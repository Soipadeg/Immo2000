"""
Service de chiffrement et gestion RGPD pour les documents notaires.

Fonctionnalités:
- Chiffrement AES-256 des documents à l'enregistrement
- Déchiffrement à l'accès (avec contrôle permissions)
- Audit trail RGPD (qui a accédé à quoi, quand, pourquoi)
- Droit à l'oubli: suppression sécurisée
- Data retention policies: suppression automatique
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import base64

logger = logging.getLogger(__name__)


class DocumentEncryptionService:
    """Service de chiffrement des documents notaires."""

    # Clé de chiffrement: générée une fois, stockée de manière sécurisée
    _encryption_key = None

    @classmethod
    def initialize(cls, master_key: Optional[str] = None):
        """
        Initialiser le service avec une clé maître.

        Args:
            master_key: Clé maître (de env var ENCRYPTION_KEY si non fournie)
        """
        if master_key is None:
            master_key = os.getenv('ENCRYPTION_KEY')

        if not master_key:
            raise ValueError("ENCRYPTION_KEY doit être définie dans les variables d'environnement")

        # Dériver une clé à partir de la clé maître
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'immo2000-notaire-docs',  # Salt statique pour la dérivation
            iterations=100000,
        )

        derived_key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        cls._encryption_key = Fernet(derived_key)


    @staticmethod
    def encrypt_document(content: bytes, metadata: Dict) -> Tuple[bytes, str]:
        """
        Chiffrer un document.

        Args:
            content: Contenu du document en bytes
            metadata: Métadonnées (nom, type MIME, etc.)

        Returns:
            (encrypted_content, encryption_id)
        """
        if not DocumentEncryptionService._encryption_key:
            raise RuntimeError("Service non initialisé. Appelez initialize() d'abord.")

        try:
            encrypted_content = DocumentEncryptionService._encryption_key.encrypt(content)

            # Générer un ID de chiffrement pour la rotation de clés
            encryption_id = f"v1_{datetime.utcnow().isoformat()}"

            logger.info(f"Document chiffré: {metadata.get('filename', 'unknown')}")
            return encrypted_content, encryption_id

        except ValueError as e:
            logger.error(f"Erreur chiffrement document (données invalides): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur chiffrement document: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def decrypt_document(encrypted_content: bytes) -> bytes:
        """
        Déchiffrer un document.

        Args:
            encrypted_content: Contenu chiffré

        Returns:
            Contenu déchiffré en bytes
        """
        if not DocumentEncryptionService._encryption_key:
            raise RuntimeError("Service non initialisé. Appelez initialize() d'abord.")

        try:
            decrypted_content = DocumentEncryptionService._encryption_key.decrypt(encrypted_content)
            return decrypted_content

        except ValueError as e:
            logger.error(f"Erreur déchiffrement document (clé ou données invalides): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur déchiffrement document: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def verify_access_permission(user_id: int, document_id: int,
                                reason: str = "visualization") -> bool:
        """
        Vérifier qu'un utilisateur peut accéder à un document.

        Args:
            user_id: ID de l'utilisateur
            document_id: ID du document
            reason: Raison de l'accès (visualization, modification, export)

        Returns:
            True si accès autorisé

        Raises:
            PermissionError si accès refusé
        """
        try:
            from src.auth.models import db, User
            from src.models.notaires import DocumentNotaire, TransactionNotaire

            # Récupérer le document
            document = db.session.query(DocumentNotaire).filter_by(
                document_id=document_id
            ).first()

            if not document:
                raise PermissionError("Document non trouvé")

            # Récupérer l'utilisateur
            user = db.session.query(User).filter_by(utilisateur_id=user_id).first()
            if not user:
                raise PermissionError("Utilisateur non trouvé")

            # Récupérer la transaction associée
            transaction = db.session.query(TransactionNotaire).filter_by(
                transaction_notaire_id=document.transaction_notaire_id
            ).first()

            # Vérifier les permissions
            is_notaire = transaction.notaire_id and document.notaire_id == transaction.notaire_id and \
                        transaction.notaire.utilisateur_id == user_id
            is_vendeur = transaction.vendeur_id == user_id
            is_acheteur = transaction.acheteur_id == user_id
            is_admin = user.role == 'admin'

            has_access = is_notaire or is_vendeur or is_acheteur or is_admin

            if not has_access:
                raise PermissionError("Accès non autorisé à ce document")

            # Enregistrer l'accès pour l'audit RGPD
            DocumentEncryptionService._log_document_access(
                user_id=user_id,
                document_id=document_id,
                transaction_id=document.transaction_notaire_id,
                reason=reason,
                user_role=user.role
            )

            return True

        except PermissionError as e:
            logger.warning(f"Accès refusé au document {document_id} pour utilisateur {user_id}: {str(e)}")
            raise
        except ValueError as e:
            logger.error(f"Erreur vérification permissions (données manquantes): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur vérification permissions: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def _log_document_access(user_id: int, document_id: int, transaction_id: int,
                            reason: str, user_role: str):
        """
        Enregistrer un accès pour l'audit RGPD.

        Args:
            user_id: ID utilisateur
            document_id: ID document
            transaction_id: ID transaction
            reason: Raison de l'accès
            user_role: Rôle de l'utilisateur
        """
        try:
            from src.auth.models import db
            from src.models.notaires import HistoriqueNotaire

            # Enregistrer dans l'historique RGPD
            audit = HistoriqueNotaire(
                transaction_notaire_id=transaction_id,
                type_action='document_access',
                description=f"Accès au document {document_id} - Raison: {reason}",
                # Métadonnées RGPD
                metadata={
                    'accessed_by': user_id,
                    'document_id': document_id,
                    'access_reason': reason,
                    'user_role': user_role,
                    'ip_address': DocumentEncryptionService._get_client_ip(),
                    'timestamp': datetime.utcnow().isoformat()
                }
            )

            db.session.add(audit)
            db.session.commit()

        except ValueError as e:
            logger.error(f"Erreur enregistrement accès (données invalides): {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Erreur enregistrement accès: {str(e)}", exc_info=True)


    @staticmethod
    def _get_client_ip() -> str:
        """Obtenir l'IP du client (pour audit RGPD)."""
        try:
            from flask import request
            return request.remote_addr or "unknown"
        except RuntimeError as e:
            logger.warning(f"Impossible d'obtenir l'IP du client: {str(e)}", exc_info=True)
            return "unknown"
        except Exception as e:
            logger.warning(f"Impossible d'obtenir l'IP du client: {str(e)}", exc_info=True)
            return "unknown"


    @staticmethod
    def get_document_access_log(document_id: int) -> List[Dict]:
        """
        Récupérer le journal d'accès RGPD d'un document.

        Args:
            document_id: ID du document

        Returns:
            Liste des accès enregistrés
        """
        try:
            from src.auth.models import db
            from src.models.notaires import HistoriqueNotaire

            accesses = db.session.query(HistoriqueNotaire).filter(
                HistoriqueNotaire.type_action == 'document_access',
                HistoriqueNotaire.metadata['document_id'].astext == str(document_id)
            ).order_by(HistoriqueNotaire.date_action.desc()).all()

            return [
                {
                    'accessed_by': a.metadata.get('accessed_by'),
                    'reason': a.metadata.get('access_reason'),
                    'timestamp': a.metadata.get('timestamp'),
                    'ip_address': a.metadata.get('ip_address'),
                    'user_role': a.metadata.get('user_role')
                }
                for a in accesses
            ]

        except ValueError as e:
            logger.error(f"Erreur récupération access log (données invalides): {str(e)}", exc_info=True)
            return []
        except Exception as e:
            logger.error(f"Erreur récupération access log: {str(e)}", exc_info=True)
            return []


    @staticmethod
    def delete_document_permanently(document_id: int, reason: str = "user_request"):
        """
        Supprimer définitivement un document (droit à l'oubli).

        Args:
            document_id: ID du document
            reason: Raison de la suppression
        """
        try:
            from src.auth.models import db
            from src.models.notaires import DocumentNotaire, HistoriqueNotaire

            document = db.session.query(DocumentNotaire).filter_by(
                document_id=document_id
            ).first()

            if not document:
                raise ValueError("Document non trouvé")

            # Vérifier que le document n'a pas d'autres références
            transaction_id = document.transaction_notaire_id

            # Enregistrer la suppression dans l'historique
            audit = HistoriqueNotaire(
                transaction_notaire_id=transaction_id,
                type_action='document_deleted',
                description=f"Document supprimé de manière permanente - Raison: {reason}",
                metadata={
                    'document_id': document_id,
                    'deletion_reason': reason,
                    'deletion_timestamp': datetime.utcnow().isoformat()
                }
            )

            db.session.add(audit)

            # Supprimer le document (DB gérera les étapes)
            db.session.delete(document)
            db.session.commit()

            logger.info(f"Document {document_id} supprimé définitivement - Raison: {reason}")

        except ValueError as e:
            logger.error(f"Erreur suppression document (document introuvable): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur suppression document: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def apply_retention_policy(days_to_keep: int = 365):
        """
        Appliquer la politique de rétention des données.

        Supprime automatiquement les documents plus anciens que la durée spécifiée.

        Args:
            days_to_keep: Nombre de jours à conserver (défaut: 1 an)
        """
        try:
            from src.auth.models import db
            from src.models.notaires import DocumentNotaire

            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

            # Récupérer les documents à supprimer
            old_documents = db.session.query(DocumentNotaire).filter(
                DocumentNotaire.date_upload < cutoff_date
            ).all()

            deleted_count = 0
            for document in old_documents:
                try:
                    DocumentEncryptionService.delete_document_permanently(
                        document.document_id,
                        reason=f"retention_policy_{days_to_keep}days"
                    )
                    deleted_count += 1
                except Exception as e:
                    logger.warning(f"Impossible de supprimer document {document.document_id}: {str(e)}", exc_info=True)

            logger.info(f"Politique de rétention appliquée: {deleted_count} documents supprimés")

        except ValueError as e:
            logger.error(f"Erreur application politique rétention (paramètres invalides): {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Erreur application politique rétention: {str(e)}", exc_info=True)


class RGPDComplianceService:
    """Service de conformité RGPD."""

    @staticmethod
    def export_user_data(user_id: int) -> Dict:
        """
        Exporter toutes les données personnelles d'un utilisateur (droit d'accès).

        Args:
            user_id: ID de l'utilisateur

        Returns:
            Dictionnaire avec toutes les données de l'utilisateur
        """
        try:
            from src.auth.models import db, User
            from src.models.notaires import TransactionNotaire, DocumentNotaire

            user = db.session.query(User).filter_by(utilisateur_id=user_id).first()
            if not user:
                raise ValueError("Utilisateur non trouvé")

            # Récupérer les transactions
            transactions_as_vendeur = db.session.query(TransactionNotaire).filter_by(
                vendeur_id=user_id
            ).all()

            transactions_as_acheteur = db.session.query(TransactionNotaire).filter_by(
                acheteur_id=user_id
            ).all()

            # Récupérer les documents
            documents = db.session.query(DocumentNotaire).join(
                TransactionNotaire
            ).filter(
                (TransactionNotaire.vendeur_id == user_id) |
                (TransactionNotaire.acheteur_id == user_id)
            ).all()

            data = {
                'user': {
                    'id': user.utilisateur_id,
                    'nom': user.nom,
                    'email': user.email,
                    'role': user.role,
                    'date_creation': user.date_creation.isoformat()
                },
                'transactions_as_vendeur': [t.to_dict() for t in transactions_as_vendeur],
                'transactions_as_acheteur': [t.to_dict() for t in transactions_as_acheteur],
                'documents': [
                    {
                        'id': d.document_id,
                        'filename': d.nom_fichier,
                        'upload_date': d.date_upload.isoformat(),
                        'encrypted': d.estEncrypte,
                        'access_log': DocumentEncryptionService.get_document_access_log(d.document_id)
                    }
                    for d in documents
                ],
                'export_date': datetime.utcnow().isoformat()
            }

            logger.info(f"Données RGPD exportées pour utilisateur {user_id}")
            return data

        except ValueError as e:
            logger.error(f"Erreur export données RGPD (utilisateur introuvable): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur export données RGPD: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def delete_user_data(user_id: int, reason: str = "user_request"):
        """
        Supprimer toutes les données d'un utilisateur (droit à l'oubli).

        ATTENTION: Cette opération est irréversible.

        Args:
            user_id: ID de l'utilisateur
            reason: Raison de la suppression
        """
        try:
            from src.auth.models import db, User
            from src.models.notaires import TransactionNotaire, DocumentNotaire, HistoriqueNotaire

            user = db.session.query(User).filter_by(utilisateur_id=user_id).first()
            if not user:
                raise ValueError("Utilisateur non trouvé")

            logger.warning(f"Suppression RGPD complète pour utilisateur {user_id}: {reason}")

            # 1. Supprimer les documents
            documents = db.session.query(DocumentNotaire).join(
                TransactionNotaire
            ).filter(
                (TransactionNotaire.vendeur_id == user_id) |
                (TransactionNotaire.acheteur_id == user_id)
            ).all()

            for document in documents:
                DocumentEncryptionService.delete_document_permanently(
                    document.document_id,
                    reason=f"user_deletion_{reason}"
                )

            # 2. Anonymiser les transactions
            transactions = db.session.query(TransactionNotaire).filter(
                (TransactionNotaire.vendeur_id == user_id) |
                (TransactionNotaire.acheteur_id == user_id)
            ).all()

            for transaction in transactions:
                if transaction.vendeur_id == user_id:
                    transaction.vendeur_id = None
                if transaction.acheteur_id == user_id:
                    transaction.acheteur_id = None

            # 3. Supprimer l'utilisateur
            db.session.delete(user)
            db.session.commit()

            logger.info(f"Suppression RGPD complète effectuée pour utilisateur {user_id}")

        except ValueError as e:
            logger.error(f"Erreur suppression données RGPD (utilisateur introuvable): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur suppression données RGPD: {str(e)}", exc_info=True)
            raise


    @staticmethod
    def generate_privacy_report() -> Dict:
        """
        Générer un rapport RGPD sur les données sensibles.

        Returns:
            Rapport avec statistiques RGPD
        """
        try:
            from src.auth.models import db, User
            from src.models.notaires import DocumentNotaire, TransactionNotaire

            total_users = db.session.query(User).count()
            total_documents = db.session.query(DocumentNotaire).count()
            encrypted_documents = db.session.query(DocumentNotaire).filter_by(
                estEncrypte=True
            ).count()

            report = {
                'report_date': datetime.utcnow().isoformat(),
                'total_users': total_users,
                'total_documents': total_documents,
                'encrypted_documents': encrypted_documents,
                'encryption_coverage': f"{(encrypted_documents / total_documents * 100):.1f}%" if total_documents > 0 else "N/A",
                'compliance_status': 'COMPLIANT' if encrypted_documents == total_documents else 'NEEDS_ATTENTION'
            }

            return report

        except ValueError as e:
            logger.error(f"Erreur rapport RGPD (erreur de calcul): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur rapport RGPD: {str(e)}", exc_info=True)
            raise
