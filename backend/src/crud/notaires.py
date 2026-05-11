"""
Opérations CRUD pour les notaires partenaires et transactions.

Fournit les fonctions de logique métier :
- Gestion des profils notaires
- Assignation notaires à transactions
- Validation/rejet compromis
- Gestion documents
"""

from typing import Optional, List, Dict, Tuple
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session
from src.models.notaires import (
    Notaire, TransactionNotaire, DocumentNotaire,
    HistoriqueNotaire, NotaireSpecialisation, DisponibiliteNotaire
)
from src.models.annonces import Annonce
from src.models.offres import Offre
from src.auth.models import User
from src.services.notaire_notifications import NotaireNotificationService
import logging

logger = logging.getLogger(__name__)


# ===== NOTAIRE CRUD =====

def create_notaire(
    db: Session,
    utilisateur_id: int,
    etude_notariale: str,
    numero_rpps: str,
    adresse_etude: str,
    code_postal_etude: str,
    ville_etude: str,
    telephone: str,
    email_professionnel: str,
    zone_geographique: Dict,
    max_dossiers_simultanees: int = 10,
    delai_traitement_jours: int = 5,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Notaire:
    """Créer un profil notaire partenaire."""

    # Vérifier que utilisateur_id existe
    user = db.query(User).filter_by(utilisateur_id=utilisateur_id).first()
    if not user:
        raise ValueError(f"Utilisateur {utilisateur_id} non trouvé")

    # Vérifier que RPPS est unique
    existing = db.query(Notaire).filter_by(numero_rpps=numero_rpps).first()
    if existing:
        raise ValueError(f"Numéro RPPS {numero_rpps} déjà enregistré")

    notaire = Notaire(
        utilisateur_id=utilisateur_id,
        etude_notariale=etude_notariale,
        numero_rpps=numero_rpps,
        adresse_etude=adresse_etude,
        code_postal_etude=code_postal_etude,
        ville_etude=ville_etude,
        latitude=latitude,
        longitude=longitude,
        telephone=telephone,
        email_professionnel=email_professionnel,
        zone_geographique=zone_geographique,
        max_dossiers_simultanees=max_dossiers_simultanees,
        delai_traitement_jours=delai_traitement_jours,
    )

    db.add(notaire)
    db.commit()
    db.refresh(notaire)

    logger.info(f"Notaire créé: {notaire.numero_rpps}")
    return notaire


def get_notaire(db: Session, notaire_id: int) -> Optional[Notaire]:
    """Récupérer un notaire par ID."""
    return db.query(Notaire).filter_by(notaire_id=notaire_id).first()


def get_notaire_by_utilisateur(db: Session, utilisateur_id: int) -> Optional[Notaire]:
    """Récupérer le profil notaire associé à un utilisateur."""
    return db.query(Notaire).filter_by(utilisateur_id=utilisateur_id).first()


def search_notaires(
    db: Session,
    ville: Optional[str] = None,
    code_postal: Optional[str] = None,
    specialisation: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
) -> Tuple[List[Notaire], int]:
    """
    Rechercher des notaires partenaires actifs.
    Filtres: ville, code_postal, spécialisation, disponibilité.
    """

    query = db.query(Notaire).filter(Notaire.partenaire_actif == True)

    # Filtrer par localisation
    if ville:
        query = query.filter(Notaire.ville_etude.ilike(f"%{ville}%"))

    if code_postal:
        query = query.filter(Notaire.code_postal_etude == code_postal)

    # Filtrer par spécialisation (si fournie)
    if specialisation:
        query = query.join(NotaireSpecialisation).filter(
            NotaireSpecialisation.type_specialisation == specialisation
        ).distinct()

    # Vérifier disponibilité (nombre de dossiers < max)
    # Note: cette vérification est faite en Python car SQLAlchemy count en subquery est complexe

    total = query.count()
    notaires = query.offset(skip).limit(limit).all()

    # Filter par disponibilité
    notaires = [n for n in notaires if n.est_disponible()]

    return notaires, total


def update_notaire(
    db: Session,
    notaire_id: int,
    **kwargs
) -> Optional[Notaire]:
    """Mettre à jour un profil notaire."""

    notaire = get_notaire(db, notaire_id)
    if not notaire:
        return None

    # Champs autorisés à mettre à jour
    allowed_fields = [
        'etude_notariale', 'adresse_etude', 'telephone',
        'zone_geographique', 'disponibilites', 'max_dossiers_simultanees',
        'delai_traitement_jours', 'partenaire_actif'
    ]

    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            setattr(notaire, field, value)

    notaire.date_modification = datetime.utcnow()
    db.commit()
    db.refresh(notaire)

    return notaire


def list_notaires_by_zone(
    db: Session,
    code_postal: str,
    ville: str,
) -> List[Notaire]:
    """Récupérer notaires couvrant une zone géographique."""

    # Requête pour trouver notaires dont zone_geographique contient code_postal ou ville
    notaires = db.query(Notaire).filter(
        Notaire.partenaire_actif == True
    ).all()

    # Filtrer en Python (les zones sont en JSON)
    matching = []
    for n in notaires:
        zone = n.zone_geographique or {}
        codes = zone.get('codes_postaux', [])
        villes = zone.get('villes', [])

        if code_postal in codes or ville in villes:
            matching.append(n)

    return matching


# ===== TRANSACTION NOTAIRE CRUD =====

def create_transaction_notaire(
    db: Session,
    offre_id: int,
    annonce_id: int,
    vendeur_id: int,
    acheteur_id: int,
    prix_compromis: float,
    notaire_id: Optional[int] = None,
) -> TransactionNotaire:
    """Créer une transaction notaire (suite à acceptation offre)."""

    # Vérifier offre, annonce, utilisateurs existent
    offre = db.query(Offre).filter_by(offre_id=offre_id).first()
    if not offre:
        raise ValueError(f"Offre {offre_id} non trouvée")

    annonce = db.query(Annonce).filter_by(annonce_id=annonce_id).first()
    if not annonce:
        raise ValueError(f"Annonce {annonce_id} non trouvée")

    # Vérifier notaire si fourni
    if notaire_id:
        notaire = get_notaire(db, notaire_id)
        if not notaire:
            raise ValueError(f"Notaire {notaire_id} non trouvé")

    # Créer transaction
    transaction = TransactionNotaire(
        offre_id=offre_id,
        annonce_id=annonce_id,
        notaire_id=notaire_id,
        vendeur_id=vendeur_id,
        acheteur_id=acheteur_id,
        prix_compromis=prix_compromis,
        statut='en_attente_selection' if not notaire_id else 'en_attente_validation',
        date_assignation_notaire=datetime.utcnow() if notaire_id else None,
    )

    # Créer historique
    historique = HistoriqueNotaire(
        transaction_notaire_id=None,  # Sera défini après insert
        notaire_id=notaire_id or 1,  # Temporaire
        type_action='creation',
        description=f"Transaction créée pour offre {offre_id}",
        nouveau_statut=transaction.statut,
    )

    db.add(transaction)
    db.flush()  # Pour avoir l'ID de transaction

    historique.transaction_notaire_id = transaction.transaction_notaire_id
    db.add(historique)
    db.commit()
    db.refresh(transaction)

    logger.info(f"Transaction notaire créée: {transaction.transaction_notaire_id}")
    return transaction


def get_transaction_notaire(db: Session, transaction_notaire_id: int) -> Optional[TransactionNotaire]:
    """Récupérer une transaction notaire."""
    return db.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_notaire_id
    ).first()


def assign_notaire_to_transaction(
    db: Session,
    transaction_notaire_id: int,
    notaire_id: int,
) -> Optional[TransactionNotaire]:
    """Assigner un notaire à une transaction."""

    transaction = get_transaction_notaire(db, transaction_notaire_id)
    if not transaction:
        return None

    notaire = get_notaire(db, notaire_id)
    if not notaire:
        raise ValueError(f"Notaire {notaire_id} non trouvé")

    if not notaire.partenaire_actif:
        raise ValueError(f"Notaire {notaire_id} n'est pas partenaire actif")

    if not notaire.est_disponible():
        raise ValueError(f"Notaire {notaire_id} n'a pas de place disponible")

    # Assigner
    transaction.notaire_id = notaire_id
    transaction.date_assignation_notaire = datetime.utcnow()
    transaction.date_envoi_notification = datetime.utcnow()
    transaction.statut = 'en_attente_validation'

    # Définir SLA: délai demande
    transaction.delai_demande = datetime.utcnow() + timedelta(days=1)  # 24h pour accuser réception
    transaction.delai_validation = datetime.utcnow() + timedelta(days=notaire.delai_traitement_jours)

    # Historique
    historique = HistoriqueNotaire(
        transaction_notaire_id=transaction_notaire_id,
        notaire_id=notaire_id,
        type_action='assignment',
        description=f"Notaire {notaire.etude_notariale} assigné",
        ancien_statut='en_attente_selection',
        nouveau_statut='en_attente_validation',
    )

    db.add(historique)
    db.commit()
    db.refresh(transaction)

    # 📧 Envoyer notification au notaire
    try:
        NotaireNotificationService.notify_notaire_assigned(
            notaire_id=notaire_id,
            transaction_id=transaction_notaire_id,
            transaction_data={
                'prix_compromis': transaction.prix_compromis,
                'vendeur_name': transaction.vendeur.nom if transaction.vendeur else 'Vendeur',
                'acheteur_name': transaction.acheteur.nom if transaction.acheteur else 'Acheteur',
                'bien': 'Bien immobilier'  # À obtenir de la transaction
            }
        )
    except Exception as e:
        logger.warning(f"Erreur lors de l'envoi de notification: {str(e)}")

    logger.info(f"Notaire {notaire_id} assigné à transaction {transaction_notaire_id}")
    return transaction


def validate_compromis(
    db: Session,
    transaction_notaire_id: int,
    notaire_id: int,
    commentaires: Optional[str] = None,
) -> Optional[TransactionNotaire]:
    """Notaire valide le compromis."""

    transaction = get_transaction_notaire(db, transaction_notaire_id)
    if not transaction:
        return None

    # Vérifier permissions: c'est le bon notaire
    if transaction.notaire_id != notaire_id:
        raise ValueError("Notaire non autorisé pour cette transaction")

    # Mettre à jour
    ancien_statut = transaction.statut
    transaction.statut = 'validee'
    transaction.date_validation = datetime.utcnow()

    # Historique
    historique = HistoriqueNotaire(
        transaction_notaire_id=transaction_notaire_id,
        notaire_id=notaire_id,
        type_action='validate',
        description=f"Compromis validé par {transaction.notaire.etude_notariale if transaction.notaire else 'notaire'}",
        ancien_statut=ancien_statut,
        nouveau_statut=transaction.statut,
    )

    db.add(historique)
    db.commit()
    db.refresh(transaction)

    # 📧 Notifier les utilisateurs
    try:
        notaire_name = transaction.notaire.etude_notariale if transaction.notaire else 'Notaire'
        NotaireNotificationService.notify_compromis_validated(
            transaction_id=transaction_notaire_id,
            notaire_name=notaire_name,
            users=[
                {
                    'user_id': transaction.vendeur_id,
                    'email': transaction.vendeur.email if transaction.vendeur else '',
                    'name': transaction.vendeur.nom if transaction.vendeur else 'Vendeur'
                },
                {
                    'user_id': transaction.acheteur_id,
                    'email': transaction.acheteur.email if transaction.acheteur else '',
                    'name': transaction.acheteur.nom if transaction.acheteur else 'Acheteur'
                }
            ]
        )
    except Exception as e:
        logger.warning(f"Erreur notification validation: {str(e)}")

    logger.info(f"Compromis validé: transaction {transaction_notaire_id}")
    return transaction


def request_modifications(
    db: Session,
    transaction_notaire_id: int,
    notaire_id: int,
    modifications_demandees: str,
    delai_jours: int = 5,
) -> Optional[TransactionNotaire]:
    """Notaire demande des modifications."""

    transaction = get_transaction_notaire(db, transaction_notaire_id)
    if not transaction:
        return None

    if transaction.notaire_id != notaire_id:
        raise ValueError("Notaire non autorisé")

    ancien_statut = transaction.statut
    transaction.statut = 'modifications_demandees'
    transaction.modifications_demandees = modifications_demandees
    transaction.delai_demande = datetime.utcnow() + timedelta(days=delai_jours)

    historique = HistoriqueNotaire(
        transaction_notaire_id=transaction_notaire_id,
        notaire_id=notaire_id,
        type_action='request_modifications',
        description=f"Modifications demandées",
        ancien_statut=ancien_statut,
        nouveau_statut=transaction.statut,
    )

    db.add(historique)
    db.commit()
    db.refresh(transaction)

    # 📧 Notifier les utilisateurs
    try:
        notaire_name = transaction.notaire.etude_notariale if transaction.notaire else 'Notaire'
        NotaireNotificationService.notify_modifications_requested(
            transaction_id=transaction_notaire_id,
            notaire_name=notaire_name,
            modifications=modifications_demandees,
            users=[
                {
                    'user_id': transaction.vendeur_id,
                    'email': transaction.vendeur.email if transaction.vendeur else '',
                    'name': transaction.vendeur.nom if transaction.vendeur else 'Vendeur'
                },
                {
                    'user_id': transaction.acheteur_id,
                    'email': transaction.acheteur.email if transaction.acheteur else '',
                    'name': transaction.acheteur.nom if transaction.acheteur else 'Acheteur'
                }
            ]
        )
    except Exception as e:
        logger.warning(f"Erreur notification modifications: {str(e)}")

    logger.info(f"Modifications demandées: transaction {transaction_notaire_id}")
    return transaction


def reject_compromis(
    db: Session,
    transaction_notaire_id: int,
    notaire_id: int,
    raison_refus: str,
) -> Optional[TransactionNotaire]:
    """Notaire refuse le compromis."""

    transaction = get_transaction_notaire(db, transaction_notaire_id)
    if not transaction:
        return None

    if transaction.notaire_id != notaire_id:
        raise ValueError("Notaire non autorisé")

    ancien_statut = transaction.statut
    transaction.statut = 'refusee'
    transaction.raison_refus = raison_refus

    historique = HistoriqueNotaire(
        transaction_notaire_id=transaction_notaire_id,
        notaire_id=notaire_id,
        type_action='reject',
        description=f"Compromis refusé: {raison_refus[:100]}",
        ancien_statut=ancien_statut,
        nouveau_statut=transaction.statut,
    )

    db.add(historique)
    db.commit()
    db.refresh(transaction)

    # 📧 Notifier les utilisateurs
    try:
        notaire_name = transaction.notaire.etude_notariale if transaction.notaire else 'Notaire'
        NotaireNotificationService.notify_compromis_rejected(
            transaction_id=transaction_notaire_id,
            notaire_name=notaire_name,
            raison=raison_refus,
            users=[
                {
                    'user_id': transaction.vendeur_id,
                    'email': transaction.vendeur.email if transaction.vendeur else '',
                    'name': transaction.vendeur.nom if transaction.vendeur else 'Vendeur'
                },
                {
                    'user_id': transaction.acheteur_id,
                    'email': transaction.acheteur.email if transaction.acheteur else '',
                    'name': transaction.acheteur.nom if transaction.acheteur else 'Acheteur'
                }
            ]
        )
    except Exception as e:
        logger.warning(f"Erreur notification rejet: {str(e)}")

    logger.info(f"Compromis refusé: transaction {transaction_notaire_id}")
    return transaction


def list_transactions_for_notaire(
    db: Session,
    notaire_id: int,
    statuts: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[TransactionNotaire], int]:
    """Lister transactions pour un notaire (tableau de bord)."""

    query = db.query(TransactionNotaire).filter_by(notaire_id=notaire_id)

    if statuts:
        query = query.filter(TransactionNotaire.statut.in_(statuts))

    total = query.count()
    transactions = query.order_by(
        TransactionNotaire.date_creation.desc()
    ).offset(skip).limit(limit).all()

    return transactions, total


def list_transactions_pending(db: Session) -> List[TransactionNotaire]:
    """Lister toutes transactions en attente de validation."""

    return db.query(TransactionNotaire).filter(
        TransactionNotaire.statut.in_(['en_attente_selection', 'en_attente_validation'])
    ).order_by(TransactionNotaire.date_creation.asc()).all()


# ===== DOCUMENT NOTAIRE CRUD =====

def upload_document_notaire(
    db: Session,
    transaction_notaire_id: int,
    type_document: str,
    nom_original: str,
    url_fichier: str,
    taille_bytes: int,
    mime_type: str,
    chiffre: bool = False,
) -> DocumentNotaire:
    """Upload/enregistrer document notaire."""

    # Vérifier transaction existe
    transaction = get_transaction_notaire(db, transaction_notaire_id)
    if not transaction:
        raise ValueError(f"Transaction {transaction_notaire_id} non trouvée")

    document = DocumentNotaire(
        transaction_notaire_id=transaction_notaire_id,
        type_document=type_document,
        nom_original=nom_original,
        url_fichier=url_fichier,
        taille_bytes=taille_bytes,
        mime_type=mime_type,
        chiffre=chiffre,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    logger.info(f"Document uploadé: {nom_original}")
    return document


def get_documents_for_transaction(
    db: Session,
    transaction_notaire_id: int,
) -> List[DocumentNotaire]:
    """Récupérer tous documents d'une transaction."""

    return db.query(DocumentNotaire).filter_by(
        transaction_notaire_id=transaction_notaire_id
    ).order_by(DocumentNotaire.date_upload.desc()).all()


def validate_document_notaire(
    db: Session,
    document_notaire_id: int,
    notaire_id: int,
    commentaires: Optional[str] = None,
) -> Optional[DocumentNotaire]:
    """Notaire valide un document."""

    document = db.query(DocumentNotaire).filter_by(
        document_notaire_id=document_notaire_id
    ).first()

    if not document:
        return None

    # Vérifier permissions
    transaction = document.transaction
    if transaction.notaire_id != notaire_id:
        raise ValueError("Notaire non autorisé")

    document.validé_par_notaire = True
    document.date_validation = datetime.utcnow()
    document.commentaires_notaire = commentaires

    db.commit()
    db.refresh(document)

    return document


# ===== STATS & ANALYTICS =====

def get_notaire_stats(db: Session, notaire_id: int) -> Dict:
    """Récupérer statistiques pour un notaire."""

    notaire = get_notaire(db, notaire_id)
    if not notaire:
        return {}

    # Dossiers en cours
    dossiers_en_cours = db.query(TransactionNotaire).filter(
        TransactionNotaire.notaire_id == notaire_id,
        TransactionNotaire.statut.in_(['en_attente_validation', 'modifications_demandees'])
    ).count()

    # Dossiers complétés ce mois
    debut_mois = datetime.utcnow().replace(day=1)
    dossiers_mois = db.query(TransactionNotaire).filter(
        TransactionNotaire.notaire_id == notaire_id,
        TransactionNotaire.date_validation >= debut_mois,
        TransactionNotaire.statut == 'validee'
    ).count()

    # Temps moyen traitement
    transactions_completes = db.query(TransactionNotaire).filter(
        TransactionNotaire.notaire_id == notaire_id,
        TransactionNotaire.statut == 'validee',
        TransactionNotaire.date_validation.isnot(None),
        TransactionNotaire.date_assignation_notaire.isnot(None),
    ).all()

    if transactions_completes:
        temps_moyens = [
            (t.date_validation - t.date_assignation_notaire).days
            for t in transactions_completes
        ]
        delai_moyen = sum(temps_moyens) / len(temps_moyens)
    else:
        delai_moyen = 0

    return {
        'dossiers_en_cours': dossiers_en_cours,
        'dossiers_ce_mois': dossiers_mois,
        'delai_moyen_jours': delai_moyen,
        'note_moyenne': notaire.note_moyenne,
        'dossiers_traites_total': notaire.dossiers_traites,
    }
