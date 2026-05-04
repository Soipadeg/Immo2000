"""
Opérations CRUD pour les annonces.

Fournit les fonctions de logique métier :
- create_annonce()
- get_annonce()
- update_annonce()
- delete_annonce()
- list_annonces()
- publish_annonce() [BONUS]
- archive_annonce()
- sell_annonce()

Gère l'autorisation (propriétaire seulement), la validation métier et les notifications email.
"""

from typing import Optional, List, Dict, Any
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from src.models.annonces import Annonce
from src.auth.models import User
from src.schemas.annonces import CreateAnnonce, UpdateAnnonce
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def _send_notification_email(
    user_id: int,
    db: Session,
    notification_type: str,
    annonce_titre: str,
    annonce_id: int = None,
    date_vente: datetime = None
) -> bool:
    """
    Envoyer un email de notification (helper interne).

    Args:
        user_id: ID de l'utilisateur destinataire
        db: Session SQLAlchemy
        notification_type: Type de notification ('published', 'sold', 'archived')
        annonce_titre: Titre de l'annonce
        annonce_id: ID de l'annonce (pour URL)
        date_vente: Date de vente (pour email vendue)

    Returns:
        True si email envoyé (ou en mode dev), False sinon
    """
    try:
        # Récupérer l'utilisateur
        user = db.query(User).filter(User.utilisateur_id == user_id).first()
        if not user:
            logger.warning(f"Utilisateur {user_id} non trouvé pour notification email")
            return False

        # Importer le service d'email
        from src.services.email import get_email_service, EmailError
        email_service = get_email_service()

        # Construire l'URL de l'annonce
        annonce_url = f"https://immo2000.fr/annonces/{annonce_id}" if annonce_id else ""

        # Envoyer l'email selon le type
        if notification_type == "published":
            return email_service.send_annonce_published(
                to_email=user.email,
                to_name=f"{user.prenom} {user.nom}",
                annonce_titre=annonce_titre,
                annonce_url=annonce_url
            )
        elif notification_type == "sold":
            return email_service.send_annonce_sold(
                to_email=user.email,
                to_name=f"{user.prenom} {user.nom}",
                annonce_titre=annonce_titre,
                sale_date=date_vente
            )
        else:
            logger.warning(f"Type de notification inconnu: {notification_type}")
            return False

    except EmailError as e:
        logger.error(f"Erreur email pour notification {notification_type}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de notification: {str(e)}")
        return False


class AnnoncesNotFoundError(Exception):
    """Exception levée quand une annonce n'existe pas."""
    pass


class AnnoncesUnauthorizedError(Exception):
    """Exception levée quand l'utilisateur n'est pas autorisé à modifier l'annonce."""
    pass


class AnnoncesValidationError(Exception):
    """Exception levée pour les erreurs de validation métier."""
    pass


def create_annonce(db: Session, utilisateur_id: int, annonce_data: CreateAnnonce) -> Annonce:
    """
    Créer une nouvelle annonce.

    Args:
        db: Session SQLAlchemy
        utilisateur_id: ID de l'utilisateur créateur
        annonce_data: Schéma Pydantic CreateAnnonce validé

    Returns:
        Annonce créée

    Raises:
        AnnoncesValidationError: Si les données sont invalides
    """
    # Convertir schéma Pydantic en dict
    annonce_dict = annonce_data.dict(exclude_unset=True)

    # Créer l'objet Annonce
    annonce = Annonce(
        utilisateur_id=utilisateur_id,
        **annonce_dict
    )

    # Sauvegarder
    db.add(annonce)
    db.commit()
    db.refresh(annonce)

    return annonce


def get_annonce(db: Session, annonce_id: int) -> Optional[Annonce]:
    """
    Récupérer une annonce par son ID.

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce

    Returns:
        Annonce ou None si non trouvée

    Raises:
        AnnoncesNotFoundError: Si l'annonce n'existe pas
    """
    annonce = db.query(Annonce).filter(Annonce.annonce_id == annonce_id).first()

    if not annonce:
        raise AnnoncesNotFoundError(f"Annonce {annonce_id} non trouvée")

    return annonce


def update_annonce(
    db: Session,
    annonce_id: int,
    utilisateur_id: int,
    annonce_data: UpdateAnnonce
) -> Annonce:
    """
    Mettre à jour une annonce (propriétaire seulement).

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce
        utilisateur_id: ID de l'utilisateur (pour vérification propriétaire)
        annonce_data: Schéma Pydantic UpdateAnnonce

    Returns:
        Annonce mise à jour

    Raises:
        AnnoncesNotFoundError: Si l'annonce n'existe pas
        AnnoncesUnauthorizedError: Si l'utilisateur n'est pas propriétaire
        AnnoncesValidationError: Si les données sont invalides
    """
    # Récupérer l'annonce
    annonce = get_annonce(db, annonce_id)

    # Vérifier propriétaire
    if annonce.utilisateur_id != utilisateur_id:
        raise AnnoncesUnauthorizedError(
            f"Vous ne pouvez modifier que vos propres annonces"
        )

    # Mettre à jour les champs fournis
    update_dict = annonce_data.dict(exclude_unset=True)

    for field, value in update_dict.items():
        if value is not None:
            setattr(annonce, field, value)

    # Mettre à jour la date de modification
    annonce.date_modification = datetime.utcnow()

    db.add(annonce)
    db.commit()
    db.refresh(annonce)

    return annonce


def delete_annonce(db: Session, annonce_id: int, utilisateur_id: int) -> bool:
    """
    Supprimer une annonce (propriétaire seulement).

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce
        utilisateur_id: ID de l'utilisateur (pour vérification propriétaire)

    Returns:
        True si suppression réussie

    Raises:
        AnnoncesNotFoundError: Si l'annonce n'existe pas
        AnnoncesUnauthorizedError: Si l'utilisateur n'est pas propriétaire
    """
    # Récupérer l'annonce
    annonce = get_annonce(db, annonce_id)

    # Vérifier propriétaire
    if annonce.utilisateur_id != utilisateur_id:
        raise AnnoncesUnauthorizedError(
            f"Vous ne pouvez supprimer que vos propres annonces"
        )

    # Supprimer
    db.delete(annonce)
    db.commit()

    return True


def list_annonces(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    filters: Optional[Dict[str, Any]] = None
) -> tuple[List[Annonce], int]:
    """
    Lister les annonces avec pagination et filtrage.

    Filtres supportés :
    - ville: str
    - code_postal: str
    - type_bien: str
    - prix_min: float
    - prix_max: float
    - surface_min: float
    - surface_max: float
    - statut: str
    - utilisateur_id: int
    - search: str (recherche dans titre et description)

    Args:
        db: Session SQLAlchemy
        skip: Nombre de résultats à ignorer (pagination)
        limit: Nombre maximal de résultats (max 100)
        filters: Dictionnaire de filtres optionnels

    Returns:
        Tuple (liste d'annonces, total)
    """
    # Limiter limit à 100
    limit = min(limit, 100)

    # Requête de base
    query = db.query(Annonce)

    if filters:
        # Filtres simples
        if "ville" in filters and filters["ville"]:
            query = query.filter(
                Annonce.ville.ilike(f"%{filters['ville']}%")
            )

        if "code_postal" in filters and filters["code_postal"]:
            query = query.filter(
                Annonce.code_postal == filters["code_postal"]
            )

        if "type_bien" in filters and filters["type_bien"]:
            query = query.filter(
                Annonce.type_bien == filters["type_bien"]
            )

        if "statut" in filters and filters["statut"]:
            query = query.filter(
                Annonce.statut == filters["statut"]
            )

        if "utilisateur_id" in filters and filters["utilisateur_id"]:
            query = query.filter(
                Annonce.utilisateur_id == filters["utilisateur_id"]
            )

        # Filtres de plage
        if "prix_min" in filters and filters["prix_min"] is not None:
            query = query.filter(Annonce.prix >= filters["prix_min"])

        if "prix_max" in filters and filters["prix_max"] is not None:
            query = query.filter(Annonce.prix <= filters["prix_max"])

        if "surface_min" in filters and filters["surface_min"] is not None:
            query = query.filter(Annonce.surface >= filters["surface_min"])

        if "surface_max" in filters and filters["surface_max"] is not None:
            query = query.filter(Annonce.surface <= filters["surface_max"])

        # Recherche texte
        if "search" in filters and filters["search"]:
            search_term = f"%{filters['search']}%"
            query = query.filter(
                or_(
                    Annonce.titre.ilike(search_term),
                    Annonce.description.ilike(search_term)
                )
            )

    # Compter le total
    total = query.count()

    # Appliquer pagination et trier par date de création décroissante
    annonces = query.order_by(Annonce.date_creation.desc()).offset(skip).limit(limit).all()

    return annonces, total


def publish_annonce(db: Session, annonce_id: int, utilisateur_id: int) -> Annonce:
    """
    Publier une annonce (passer de "brouillon" à "publiée").

    [BONUS] Endpoint : POST /api/v1/annonces/{id}/publier

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce
        utilisateur_id: ID de l'utilisateur (pour vérification propriétaire)

    Returns:
        Annonce mise à jour avec statut "publiée"

    Raises:
        AnnoncesNotFoundError: Si l'annonce n'existe pas
        AnnoncesUnauthorizedError: Si l'utilisateur n'est pas propriétaire
        AnnoncesValidationError: Si l'annonce n'est pas en brouillon
    """
    # Récupérer l'annonce
    annonce = get_annonce(db, annonce_id)

    # Vérifier propriétaire
    if annonce.utilisateur_id != utilisateur_id:
        raise AnnoncesUnauthorizedError(
            f"Vous ne pouvez publier que vos propres annonces"
        )

    # Vérifier le statut actuel
    if annonce.statut != "brouillon":
        raise AnnoncesValidationError(
            f"Seules les annonces en brouillon peuvent être publiées. "
            f"Statut actuel: {annonce.statut}"
        )

    # Mettre à jour le statut
    annonce.statut = "publiée"
    annonce.date_modification = datetime.utcnow()
    annonce.date_statut = datetime.utcnow()

    db.add(annonce)
    db.commit()
    db.refresh(annonce)

    # Envoyer l'email de notification
    _send_notification_email(
        user_id=utilisateur_id,
        db=db,
        notification_type="published",
        annonce_titre=annonce.titre,
        annonce_id=annonce_id
    )

    return annonce


def archive_annonce(db: Session, annonce_id: int, utilisateur_id: int) -> Annonce:
    """
    Archiver une annonce.

    Endpoint: POST /api/v1/annonces/{id}/archiver

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce
        utilisateur_id: ID de l'utilisateur (pour vérification propriétaire)

    Returns:
        Annonce mise à jour avec statut "archivée"

    Raises:
        AnnoncesNotFoundError: Si l'annonce n'existe pas
        AnnoncesUnauthorizedError: Si l'utilisateur n'est pas propriétaire
        AnnoncesValidationError: Si l'annonce est déjà vendue
    """
    # Récupérer l'annonce
    annonce = get_annonce(db, annonce_id)

    # Vérifier propriétaire
    if annonce.utilisateur_id != utilisateur_id:
        raise AnnoncesUnauthorizedError(
            f"Vous ne pouvez archiver que vos propres annonces"
        )

    # Vérifier que l'annonce n'est pas vendue
    if annonce.statut == "vendue":
        raise AnnoncesValidationError(
            "Une annonce vendue ne peut pas être archivée"
        )

    # Mettre à jour le statut
    annonce.statut = "archivée"
    annonce.date_modification = datetime.utcnow()
    annonce.date_statut = datetime.utcnow()

    db.add(annonce)
    db.commit()
    db.refresh(annonce)

    return annonce


def sell_annonce(db: Session, annonce_id: int, utilisateur_id: int, date_vente: Optional[datetime] = None) -> Annonce:
    """
    Marquer une annonce comme vendue.

    Endpoint: POST /api/v1/annonces/{id}/vendre

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce
        utilisateur_id: ID de l'utilisateur (pour vérification propriétaire)
        date_vente: Date de vente (par défaut, date/heure actuelle)

    Returns:
        Annonce mise à jour avec statut "vendue"

    Raises:
        AnnoncesNotFoundError: Si l'annonce n'existe pas
        AnnoncesUnauthorizedError: Si l'utilisateur n'est pas propriétaire
        AnnoncesValidationError: Si l'annonce est déjà archivée
    """
    # Récupérer l'annonce
    annonce = get_annonce(db, annonce_id)

    # Vérifier propriétaire
    if annonce.utilisateur_id != utilisateur_id:
        raise AnnoncesUnauthorizedError(
            f"Vous ne pouvez marquer que vos propres annonces comme vendues"
        )

    # Vérifier que l'annonce n'est pas archivée
    if annonce.statut == "archivée":
        raise AnnoncesValidationError(
            "Une annonce archivée ne peut pas être marquée comme vendue"
        )

    # Mettre à jour le statut et la date de vente
    annonce.statut = "vendue"
    annonce.date_vente = date_vente or datetime.utcnow()
    annonce.date_modification = datetime.utcnow()
    annonce.date_statut = datetime.utcnow()

    db.add(annonce)
    db.commit()
    db.refresh(annonce)

    # Envoyer l'email de notification
    _send_notification_email(
        user_id=utilisateur_id,
        db=db,
        notification_type="sold",
        annonce_titre=annonce.titre,
        annonce_id=annonce_id,
        date_vente=annonce.date_vente
    )

    return annonce


def get_user_annonces(db: Session, utilisateur_id: int, skip: int = 0, limit: int = 20) -> tuple[List[Annonce], int]:
    """
    Récupérer les annonces d'un utilisateur spécifique.

    Args:
        db: Session SQLAlchemy
        utilisateur_id: ID de l'utilisateur
        skip: Pagination skip
        limit: Pagination limit

    Returns:
        Tuple (liste d'annonces, total)
    """
    return list_annonces(
        db,
        skip=skip,
        limit=limit,
        filters={"utilisateur_id": utilisateur_id}
    )
