"""
Service de notifications pour le système notaires.
Gère les emails et notifications in-app pour les événements notaires.
"""

from datetime import datetime
from typing import Optional, List, Dict
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class NotaireEventType(str, Enum):
    """Types d'événements notaire."""

    NOTAIRE_ASSIGNED = "notaire_assigned"
    NOTAIRE_VALIDATION_REQUESTED = "notaire_validation_requested"
    COMPROMIS_VALIDATED = "compromis_validated"
    MODIFICATIONS_REQUESTED = "modifications_requested"
    COMPROMIS_REJECTED = "compromis_rejected"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_VALIDATED = "document_validated"


class NotaireNotificationService:
    """Service pour envoyer des notifications notaires."""

    @staticmethod
    def notify_notaire_assigned(notaire_id: int, transaction_id: int, transaction_data: Dict):
        """
        Notifier le notaire qu'il a été assigné à une transaction.

        Args:
            notaire_id: ID du notaire
            transaction_id: ID de la transaction
            transaction_data: Données de la transaction (prix, bien, etc.)
        """
        try:
            from src.auth.models import db, User
            from src.models.notaires import Notaire

            # Récupérer le notaire et son email
            notaire = db.session.query(Notaire).filter_by(notaire_id=notaire_id).first()
            if not notaire:
                logger.error(f"Notaire {notaire_id} non trouvé")
                return

            # Créer notification in-app
            NotaireNotificationService._create_inapp_notification(
                user_id=notaire.utilisateur_id,
                title="Nouveau Dossier Assigné",
                message=f"Vous avez un nouveau dossier de validation (Transaction #{transaction_id})",
                event_type=NotaireEventType.NOTAIRE_ASSIGNED,
                related_id=transaction_id
            )

            # Envoyer email
            NotaireNotificationService._send_email(
                to_email=notaire.email_professionnel,
                subject="Nouveau Dossier à Valider - Immo2000",
                template="notaire_assignment",
                context={
                    "notaire_name": notaire.etude_notariale,
                    "transaction_id": transaction_id,
                    "prix": transaction_data.get('prix_compromis'),
                    "bien": transaction_data.get('bien'),
                    "vendeur": transaction_data.get('vendeur_name'),
                    "acheteur": transaction_data.get('acheteur_name'),
                    "action_url": f"/dashboard-notaire?transaction={transaction_id}"
                }
            )

            logger.info(f"Notification d'assignation envoyée au notaire {notaire_id}")

        except Exception as e:
            logger.error(f"Erreur notification assignation: {str(e)}")


    @staticmethod
    def notify_compromis_validated(transaction_id: int, notaire_name: str,
                                  users: List[Dict]):
        """
        Notifier les utilisateurs que le compromis a été validé.

        Args:
            transaction_id: ID de la transaction
            notaire_name: Nom du notaire
            users: Liste avec {'user_id': ..., 'email': ...} pour vendeur et acheteur
        """
        try:
            # Notifier chaque utilisateur impliqué
            for user_info in users:
                NotaireNotificationService._create_inapp_notification(
                    user_id=user_info.get('user_id'),
                    title="✅ Compromis Validé",
                    message=f"Votre compromis a été validé par {notaire_name}",
                    event_type=NotaireEventType.COMPROMIS_VALIDATED,
                    related_id=transaction_id
                )

                NotaireNotificationService._send_email(
                    to_email=user_info.get('email'),
                    subject="Compromis Validé - Immo2000",
                    template="compromis_validated",
                    context={
                        "user_name": user_info.get('name'),
                        "notaire_name": notaire_name,
                        "transaction_id": transaction_id,
                        "action_url": f"/dashboard?transaction={transaction_id}"
                    }
                )

            logger.info(f"Notifications validation compromis envoyées pour {transaction_id}")

        except Exception as e:
            logger.error(f"Erreur notification validation: {str(e)}")


    @staticmethod
    def notify_modifications_requested(transaction_id: int, notaire_name: str,
                                     modifications: str, users: List[Dict]):
        """
        Notifier que des modifications sont demandées.

        Args:
            transaction_id: ID de la transaction
            notaire_name: Nom du notaire
            modifications: Description des modifications demandées
            users: Liste des utilisateurs à notifier
        """
        try:
            for user_info in users:
                NotaireNotificationService._create_inapp_notification(
                    user_id=user_info.get('user_id'),
                    title="⚠️ Modifications Demandées",
                    message=f"{notaire_name} demande des modifications",
                    event_type=NotaireEventType.MODIFICATIONS_REQUESTED,
                    related_id=transaction_id
                )

                NotaireNotificationService._send_email(
                    to_email=user_info.get('email'),
                    subject="Modifications Demandées - Immo2000",
                    template="modifications_requested",
                    context={
                        "user_name": user_info.get('name'),
                        "notaire_name": notaire_name,
                        "modifications": modifications,
                        "transaction_id": transaction_id,
                        "action_url": f"/dashboard?transaction={transaction_id}"
                    }
                )

            logger.info(f"Notifications modifications envoyées pour {transaction_id}")

        except Exception as e:
            logger.error(f"Erreur notification modifications: {str(e)}")


    @staticmethod
    def notify_compromis_rejected(transaction_id: int, notaire_name: str,
                                 raison: str, users: List[Dict]):
        """
        Notifier que le compromis a été rejeté.

        Args:
            transaction_id: ID de la transaction
            notaire_name: Nom du notaire
            raison: Raison du rejet
            users: Liste des utilisateurs à notifier
        """
        try:
            for user_info in users:
                NotaireNotificationService._create_inapp_notification(
                    user_id=user_info.get('user_id'),
                    title="❌ Compromis Rejeté",
                    message=f"{notaire_name} a rejeté le compromis",
                    event_type=NotaireEventType.COMPROMIS_REJECTED,
                    related_id=transaction_id
                )

                NotaireNotificationService._send_email(
                    to_email=user_info.get('email'),
                    subject="Compromis Rejeté - Immo2000",
                    template="compromis_rejected",
                    context={
                        "user_name": user_info.get('name'),
                        "notaire_name": notaire_name,
                        "raison": raison,
                        "transaction_id": transaction_id,
                        "action_url": f"/dashboard?transaction={transaction_id}"
                    }
                )

            logger.info(f"Notifications rejet envoyées pour {transaction_id}")

        except Exception as e:
            logger.error(f"Erreur notification rejet: {str(e)}")


    @staticmethod
    def _create_inapp_notification(user_id: int, title: str, message: str,
                                  event_type: NotaireEventType, related_id: int):
        """
        Créer une notification in-app.

        Args:
            user_id: ID utilisateur
            title: Titre de la notification
            message: Message
            event_type: Type d'événement
            related_id: ID de la ressource associée (transaction, document, etc.)
        """
        try:
            from src.auth.models import db
            from src.models.notifications import Notification

            notification = Notification(
                utilisateur_id=user_id,
                titre=title,
                message=message,
                type_notification="notaire_event",
                donnees={
                    "event_type": event_type.value,
                    "related_id": related_id,
                    "created_at": datetime.utcnow().isoformat()
                }
            )

            db.session.add(notification)
            db.session.commit()

            logger.debug(f"Notification in-app créée pour utilisateur {user_id}")

        except Exception as e:
            logger.error(f"Erreur création notification in-app: {str(e)}")


    @staticmethod
    def _send_email(to_email: str, subject: str, template: str, context: Dict):
        """
        Envoyer un email.

        Args:
            to_email: Email destinataire
            subject: Sujet
            template: Nom du template email
            context: Données pour le template
        """
        try:
            # Utiliser le service email existant
            from src.services.email import EmailService

            EmailService.send_email(
                to_email=to_email,
                subject=subject,
                template_name=f"notaire/{template}",
                context=context
            )

            logger.debug(f"Email envoyé à {to_email}")

        except Exception as e:
            logger.error(f"Erreur envoi email: {str(e)}")


    @staticmethod
    def get_user_notifications(user_id: int, notaire_events_only: bool = False) -> List[Dict]:
        """
        Récupérer les notifications de l'utilisateur.

        Args:
            user_id: ID utilisateur
            notaire_events_only: Si True, retourner seulement les événements notaires

        Returns:
            Liste des notifications
        """
        try:
            from src.auth.models import db
            from src.models.notifications import Notification

            query = db.session.query(Notification).filter_by(utilisateur_id=user_id)

            if notaire_events_only:
                query = query.filter_by(type_notification="notaire_event")

            notifications = query.order_by(Notification.date_creation.desc()).all()

            return [
                {
                    'id': n.notification_id,
                    'title': n.titre,
                    'message': n.message,
                    'read': n.lu,
                    'created_at': n.date_creation.isoformat(),
                    'data': n.donnees
                }
                for n in notifications
            ]

        except Exception as e:
            logger.error(f"Erreur récupération notifications: {str(e)}")
            return []


    @staticmethod
    def mark_notification_as_read(notification_id: int):
        """
        Marquer une notification comme lue.

        Args:
            notification_id: ID de la notification
        """
        try:
            from src.auth.models import db
            from src.models.notifications import Notification

            notification = db.session.query(Notification).filter_by(
                notification_id=notification_id
            ).first()

            if notification:
                notification.lu = True
                db.session.commit()

        except Exception as e:
            logger.error(f"Erreur marquage notification: {str(e)}")
