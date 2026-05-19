"""
Routes Flask pour la modération des annonces en tant que admin.

Endpoints :
- GET /api/v1/admin/listings/pending → Lister les annonces en attente de modération
- POST /api/v1/admin/listings/{listing_id}/approve → Approuver une annonce
- POST /api/v1/admin/listings/{listing_id}/reject → Rejeter une annonce
- POST /api/v1/admin/listings/{listing_id}/remove → Supprimer/archiver une annonce
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import desc, func
from datetime import datetime, timedelta
import logging

from src.auth.models import db, User
from src.auth.decorators import token_required, admin_required
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from src.models.annonces import Annonce

logger = logging.getLogger(__name__)

# Blueprint
listings_bp = Blueprint("admin_listings", __name__, url_prefix="/api/v1")


@listings_bp.route("/admin/listings/pending", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_pending_listings(current_user):
    """
    GET /api/v1/admin/listings/pending
    Lister toutes les annonces en attente de modération (statut brouillon).

    Query params:
    - skip: int - Pagination skip (default: 0)
    - limit: int - Pagination limit (default: 20, max: 100)

    Returns:
        200 OK + {
            "items": [
                {
                    "annonce_id": int,
                    "titre": str,
                    "description": str,
                    "prix": float,
                    "surface": float,
                    "type_bien": str,
                    "adresse": str,
                    "ville": str,
                    "utilisateur_id": int,
                    "utilisateur_email": str,
                    "date_creation": str (ISO),
                    "statut": str
                }
            ],
            "total": int,
            "skip": int,
            "limit": int
        }
    """

    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 100)

    # Annonces en attente de modération = statut 'brouillon'
    query = db.session.query(Annonce).filter(Annonce.statut == "brouillon")
    total = query.count()

    listings = query.order_by(desc(Annonce.date_creation)).offset(skip).limit(limit).all()

    listings_data = []
    for listing in listings:
        user = db.session.query(User).filter(User.utilisateur_id == listing.utilisateur_id).first()
        listings_data.append({
            "annonce_id": listing.annonce_id,
            "titre": listing.titre,
            "description": listing.description,
            "prix": listing.prix,
            "surface": listing.surface,
            "type_bien": listing.type_bien,
            "adresse": listing.adresse,
            "ville": listing.ville,
            "code_postal": listing.code_postal,
            "nombre_pieces": listing.nombre_pieces,
            "utilisateur_id": listing.utilisateur_id,
            "utilisateur_email": user.email if user else "Unknown",
            "utilisateur_nom": f"{user.prenom} {user.nom}" if user else "Unknown",
            "date_creation": listing.date_creation.isoformat() if listing.date_creation else None,
            "statut": listing.statut,
            "photos": listing.photos or []
        })

    logger.info(f"Admin {current_user['user_id']} viewed pending listings (total: {total})")

    return {
        "items": listings_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@listings_bp.route("/admin/listings/<int:listing_id>/approve", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def approve_listing(current_user, listing_id):
    """
    POST /api/v1/admin/listings/{listing_id}/approve
    Approuver une annonce en attente de modération.

    JSON body: {} (empty)

    Returns:
        200 OK + {
            "approved": true,
            "annonce_id": int,
            "titre": str,
            "previous_statut": str,
            "new_statut": str,
            "message": str
        }
    """

    # Récupérer l'annonce
    listing = db.session.query(Annonce).filter(Annonce.annonce_id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Aucune annonce avec l'ID {listing_id}")

    if listing.statut != "brouillon":
        raise ValidationError(f"Annonce n'est pas en attente de modération (statut actuel: {listing.statut})")

    # Approuver: brouillon → publiée
    previous_statut = listing.statut
    listing.statut = "publiée"
    listing.date_statut = datetime.utcnow()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} APPROVED listing {listing_id} ({listing.titre})")

    return {
        "approved": True,
        "annonce_id": listing_id,
        "titre": listing.titre,
        "previous_statut": previous_statut,
        "new_statut": listing.statut,
        "message": f"Annonce '{listing.titre}' a été approuvée et publiée"
    }


@listings_bp.route("/admin/listings/<int:listing_id>/reject", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def reject_listing(current_user, listing_id):
    """
    POST /api/v1/admin/listings/{listing_id}/reject
    Rejeter une annonce en attente de modération.

    JSON body: {
        "reason": str - Raison du rejet (optionnel, max 500 chars)
    }

    Returns:
        200 OK + {
            "rejected": true,
            "annonce_id": int,
            "titre": str,
            "previous_statut": str,
            "new_statut": str,
            "reason": str,
            "message": str
        }
    """

    # Récupérer l'annonce
    listing = db.session.query(Annonce).filter(Annonce.annonce_id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Aucune annonce avec l'ID {listing_id}")

    if listing.statut != "brouillon":
        raise ValidationError(f"Annonce n'est pas en attente de modération (statut actuel: {listing.statut})")

    # Récupérer la raison du rejet
    data = request.get_json() or {}
    reason = data.get("reason", "").strip()

    if reason and len(reason) > 500:
        raise ValidationError("La raison du rejet ne doit pas dépasser 500 caractères")

    # Rejeter: brouillon → archivée + stocker la raison
    previous_statut = listing.statut
    listing.statut = "archivée"
    listing.date_statut = datetime.utcnow()

    # Stocker la raison du rejet dans les métadonnées
    if not listing.photos:
        listing.photos = {}
    if isinstance(listing.photos, list):
        listing.photos = {}

    listing.photos["rejection_reason"] = reason or "Raison non spécifiée"
    listing.photos["rejected_by_admin_id"] = current_user["user_id"]
    listing.photos["rejected_at"] = datetime.utcnow().isoformat()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} REJECTED listing {listing_id} ({listing.titre}) - Reason: {reason}")

    return {
        "rejected": True,
        "annonce_id": listing_id,
        "titre": listing.titre,
        "previous_statut": previous_statut,
        "new_statut": listing.statut,
        "reason": reason or "Raison non spécifiée",
        "message": f"Annonce '{listing.titre}' a été rejetée"
    }


@listings_bp.route("/admin/listings/<int:listing_id>/remove", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def remove_listing(current_user, listing_id):
    """
    POST /api/v1/admin/listings/{listing_id}/remove
    Supprimer/archiver une annonce publiée (action modération).

    JSON body: {
        "reason": str - Raison de la suppression (optionnel, max 500 chars)
    }

    Returns:
        200 OK + {
            "removed": true,
            "annonce_id": int,
            "titre": str,
            "previous_statut": str,
            "new_statut": str,
            "reason": str,
            "message": str
        }
    """

    # Récupérer l'annonce
    listing = db.session.query(Annonce).filter(Annonce.annonce_id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Aucune annonce avec l'ID {listing_id}")

    if listing.statut not in ["publiée", "brouillon"]:
        raise ValidationError(f"Annonce ne peut pas être supprimée (statut actuel: {listing.statut})")

    # Récupérer la raison de la suppression
    data = request.get_json() or {}
    reason = data.get("reason", "").strip()

    if reason and len(reason) > 500:
        raise ValidationError("La raison de suppression ne doit pas dépasser 500 caractères")

    # Supprimer: publiée/brouillon → archivée
    previous_statut = listing.statut
    listing.statut = "archivée"
    listing.date_statut = datetime.utcnow()

    # Stocker la raison de suppression dans les métadonnées
    if not listing.photos:
        listing.photos = {}
    if isinstance(listing.photos, list):
        listing.photos = {}

    listing.photos["removal_reason"] = reason or "Raison non spécifiée"
    listing.photos["removed_by_admin_id"] = current_user["user_id"]
    listing.photos["removed_at"] = datetime.utcnow().isoformat()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} REMOVED listing {listing_id} ({listing.titre}) - Reason: {reason}")

    return {
        "removed": True,
        "annonce_id": listing_id,
        "titre": listing.titre,
        "previous_statut": previous_statut,
        "new_statut": listing.statut,
        "reason": reason or "Raison non spécifiée",
        "message": f"Annonce '{listing.titre}' a été supprimée par modération"
    }
