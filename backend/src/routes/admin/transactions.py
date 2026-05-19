"""
Routes Flask pour la gestion des transactions en tant que admin.

Endpoints :
- GET /api/v1/admin/transactions → Lister toutes les transactions/offres
- GET /api/v1/admin/transactions/{offre_id} → Récupérer les détails d'une transaction
- POST /api/v1/admin/transactions/{offre_id}/accept → Accepter une transaction
- POST /api/v1/admin/transactions/{offre_id}/decline → Rejeter une transaction
- POST /api/v1/admin/transactions/{offre_id}/cancel → Annuler une transaction
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import desc, func
from datetime import datetime, timedelta
import logging

from src.auth.models import db, User
from src.auth.decorators import token_required, admin_required
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from src.models.offres import Offre
from src.models.annonces import Annonce

logger = logging.getLogger(__name__)

# Blueprint
transactions_bp = Blueprint("admin_transactions", __name__, url_prefix="/api/v1")


@transactions_bp.route("/admin/transactions", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_transactions(current_user):
    """
    GET /api/v1/admin/transactions
    Lister toutes les offres/transactions avec filtres optionnels.

    Query params:
    - status: str - Filtrer par statut (proposee, acceptee, refusee, negociation, retiree, finalisee)
    - skip: int - Pagination skip (default: 0)
    - limit: int - Pagination limit (default: 20, max: 100)

    Returns:
        200 OK + {
            "items": [
                {
                    "offre_id": int,
                    "annonce_id": int,
                    "titre_annonce": str,
                    "acheteur_id": int,
                    "acheteur_email": str,
                    "vendeur_email": str,
                    "prix_annonce": float,
                    "prix_propose": float,
                    "statut": str,
                    "message": str,
                    "date_offre": str (ISO),
                    "date_reponse": str (ISO) or null
                }
            ],
            "total": int,
            "skip": int,
            "limit": int,
            "statuts_count": {statut: count, ...}
        }
    """

    status = request.args.get("status", "", type=str).strip()
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 100)

    # Base query
    query = db.session.query(Offre)

    # Filter by status if provided
    if status:
        valid_statuts = ["proposee", "acceptee", "refusee", "negociation", "retiree", "finalisee"]
        if status not in valid_statuts:
            raise ValidationError(f"Statut invalide. Valides: {', '.join(valid_statuts)}")
        query = query.filter(Offre.statut == status)

    total = query.count()

    # Count by status
    all_offres = db.session.query(Offre).all()
    statuts_count = {}
    for offre in all_offres:
        statuts_count[offre.statut] = statuts_count.get(offre.statut, 0) + 1

    offres = query.order_by(desc(Offre.date_offre)).offset(skip).limit(limit).all()

    offres_data = []
    for offre in offres:
        acheteur = db.session.query(User).filter(User.utilisateur_id == offre.acheteur_id).first()
        annonce = db.session.query(Annonce).filter(Annonce.annonce_id == offre.annonce_id).first()
        vendeur = db.session.query(User).filter(User.utilisateur_id == annonce.utilisateur_id).first() if annonce else None

        offres_data.append({
            "offre_id": offre.offre_id,
            "annonce_id": offre.annonce_id,
            "titre_annonce": annonce.titre if annonce else "Unknown",
            "acheteur_id": offre.acheteur_id,
            "acheteur_email": acheteur.email if acheteur else "Unknown",
            "vendeur_email": vendeur.email if vendeur else "Unknown",
            "prix_annonce": annonce.prix if annonce else 0,
            "prix_propose": offre.prix_propose,
            "statut": offre.statut,
            "message": offre.message or "",
            "date_offre": offre.date_offre.isoformat() if offre.date_offre else None,
            "date_reponse": offre.date_reponse.isoformat() if offre.date_reponse else None
        })

    logger.info(f"Admin {current_user['user_id']} viewed transactions (total: {total})")

    return {
        "items": offres_data,
        "total": total,
        "skip": skip,
        "limit": limit,
        "statuts_count": statuts_count
    }


@transactions_bp.route("/admin/transactions/<int:offre_id>", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_transaction_details(current_user, offre_id):
    """
    GET /api/v1/admin/transactions/{offre_id}
    Récupérer les détails complets d'une offre/transaction.

    Returns:
        200 OK + {
            "offre_id": int,
            "annonce_id": int,
            "titre_annonce": str,
            "description_annonce": str,
            "acheteur_id": int,
            "acheteur_nom": str,
            "acheteur_email": str,
            "vendeur_id": int,
            "vendeur_nom": str,
            "vendeur_email": str,
            "prix_annonce": float,
            "prix_propose": float,
            "difference_prix": float (prix_annonce - prix_propose),
            "statut": str,
            "message": str,
            "conditions": dict,
            "date_offre": str (ISO),
            "date_reponse": str (ISO) or null
        }
    """

    offre = db.session.query(Offre).filter(Offre.offre_id == offre_id).first()
    if not offre:
        raise NotFoundError(f"Aucune offre avec l'ID {offre_id}")

    acheteur = db.session.query(User).filter(User.utilisateur_id == offre.acheteur_id).first()
    annonce = db.session.query(Annonce).filter(Annonce.annonce_id == offre.annonce_id).first()
    vendeur = db.session.query(User).filter(User.utilisateur_id == annonce.utilisateur_id).first() if annonce else None

    difference_prix = (annonce.prix - offre.prix_propose) if annonce else 0

    logger.info(f"Admin {current_user['user_id']} viewed transaction {offre_id}")

    return {
        "offre_id": offre.offre_id,
        "annonce_id": offre.annonce_id,
        "titre_annonce": annonce.titre if annonce else "Unknown",
        "description_annonce": annonce.description if annonce else "",
        "acheteur_id": offre.acheteur_id,
        "acheteur_nom": f"{acheteur.prenom} {acheteur.nom}" if acheteur else "Unknown",
        "acheteur_email": acheteur.email if acheteur else "Unknown",
        "vendeur_id": annonce.utilisateur_id if annonce else None,
        "vendeur_nom": f"{vendeur.prenom} {vendeur.nom}" if vendeur else "Unknown",
        "vendeur_email": vendeur.email if vendeur else "Unknown",
        "prix_annonce": annonce.prix if annonce else 0,
        "prix_propose": offre.prix_propose,
        "difference_prix": difference_prix,
        "statut": offre.statut,
        "message": offre.message or "",
        "conditions": offre.conditions or {},
        "date_offre": offre.date_offre.isoformat() if offre.date_offre else None,
        "date_reponse": offre.date_reponse.isoformat() if offre.date_reponse else None
    }


@transactions_bp.route("/admin/transactions/<int:offre_id>/accept", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def accept_transaction(current_user, offre_id):
    """
    POST /api/v1/admin/transactions/{offre_id}/accept
    Accepter une offre/transaction (l'admin approuve la vente).

    JSON body: {} (empty)

    Returns:
        200 OK + {
            "accepted": true,
            "offre_id": int,
            "titre_annonce": str,
            "previous_statut": str,
            "new_statut": str,
            "acheteur_email": str,
            "vendeur_email": str,
            "message": str
        }
    """

    offre = db.session.query(Offre).filter(Offre.offre_id == offre_id).first()
    if not offre:
        raise NotFoundError(f"Aucune offre avec l'ID {offre_id}")

    if offre.statut in ["refusee", "retiree", "finalisee"]:
        raise ValidationError(f"Impossible d'accepter une offre avec le statut: {offre.statut}")

    acheteur = db.session.query(User).filter(User.utilisateur_id == offre.acheteur_id).first()
    annonce = db.session.query(Annonce).filter(Annonce.annonce_id == offre.annonce_id).first()
    vendeur = db.session.query(User).filter(User.utilisateur_id == annonce.utilisateur_id).first() if annonce else None

    previous_statut = offre.statut
    offre.statut = "acceptee"
    offre.date_reponse = datetime.utcnow()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} ACCEPTED transaction {offre_id} ({annonce.titre if annonce else 'Unknown'})")

    return {
        "accepted": True,
        "offre_id": offre_id,
        "titre_annonce": annonce.titre if annonce else "Unknown",
        "previous_statut": previous_statut,
        "new_statut": offre.statut,
        "acheteur_email": acheteur.email if acheteur else "Unknown",
        "vendeur_email": vendeur.email if vendeur else "Unknown",
        "message": f"Offre pour '{annonce.titre if annonce else 'Unknown'}' a été acceptée"
    }


@transactions_bp.route("/admin/transactions/<int:offre_id>/decline", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def decline_transaction(current_user, offre_id):
    """
    POST /api/v1/admin/transactions/{offre_id}/decline
    Rejeter une offre/transaction.

    JSON body: {
        "reason": str - Raison du rejet (optionnel, max 500 chars)
    }

    Returns:
        200 OK + {
            "declined": true,
            "offre_id": int,
            "titre_annonce": str,
            "previous_statut": str,
            "new_statut": str,
            "reason": str,
            "message": str
        }
    """

    offre = db.session.query(Offre).filter(Offre.offre_id == offre_id).first()
    if not offre:
        raise NotFoundError(f"Aucune offre avec l'ID {offre_id}")

    if offre.statut in ["refusee", "finalisee"]:
        raise ValidationError(f"Impossible de rejeter une offre avec le statut: {offre.statut}")

    data = request.get_json() or {}
    reason = data.get("reason", "").strip()

    if reason and len(reason) > 500:
        raise ValidationError("La raison du rejet ne doit pas dépasser 500 caractères")

    annonce = db.session.query(Annonce).filter(Annonce.annonce_id == offre.annonce_id).first()

    previous_statut = offre.statut
    offre.statut = "refusee"
    offre.date_reponse = datetime.utcnow()

    # Stocker la raison dans conditions
    if not offre.conditions:
        offre.conditions = {}
    offre.conditions["rejection_reason"] = reason or "Raison non spécifiée"
    offre.conditions["rejected_by_admin"] = True
    offre.conditions["rejected_by_admin_id"] = current_user["user_id"]
    offre.conditions["rejected_at"] = datetime.utcnow().isoformat()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} DECLINED transaction {offre_id} ({annonce.titre if annonce else 'Unknown'}) - Reason: {reason}")

    return {
        "declined": True,
        "offre_id": offre_id,
        "titre_annonce": annonce.titre if annonce else "Unknown",
        "previous_statut": previous_statut,
        "new_statut": offre.statut,
        "reason": reason or "Raison non spécifiée",
        "message": f"Offre pour '{annonce.titre if annonce else 'Unknown'}' a été rejetée"
    }


@transactions_bp.route("/admin/transactions/<int:offre_id>/cancel", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def cancel_transaction(current_user, offre_id):
    """
    POST /api/v1/admin/transactions/{offre_id}/cancel
    Annuler une transaction (transaction retiree).

    JSON body: {
        "reason": str - Raison de l'annulation (optionnel, max 500 chars)
    }

    Returns:
        200 OK + {
            "cancelled": true,
            "offre_id": int,
            "titre_annonce": str,
            "previous_statut": str,
            "new_statut": str,
            "reason": str,
            "message": str
        }
    """

    offre = db.session.query(Offre).filter(Offre.offre_id == offre_id).first()
    if not offre:
        raise NotFoundError(f"Aucune offre avec l'ID {offre_id}")

    if offre.statut in ["finalisee", "retiree"]:
        raise ValidationError(f"Impossible d'annuler une offre avec le statut: {offre.statut}")

    data = request.get_json() or {}
    reason = data.get("reason", "").strip()

    if reason and len(reason) > 500:
        raise ValidationError("La raison de l'annulation ne doit pas dépasser 500 caractères")

    annonce = db.session.query(Annonce).filter(Annonce.annonce_id == offre.annonce_id).first()

    previous_statut = offre.statut
    offre.statut = "retiree"
    offre.date_reponse = datetime.utcnow()

    # Stocker la raison dans conditions
    if not offre.conditions:
        offre.conditions = {}
    offre.conditions["cancellation_reason"] = reason or "Raison non spécifiée"
    offre.conditions["cancelled_by_admin"] = True
    offre.conditions["cancelled_by_admin_id"] = current_user["user_id"]
    offre.conditions["cancelled_at"] = datetime.utcnow().isoformat()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} CANCELLED transaction {offre_id} ({annonce.titre if annonce else 'Unknown'}) - Reason: {reason}")

    return {
        "cancelled": True,
        "offre_id": offre_id,
        "titre_annonce": annonce.titre if annonce else "Unknown",
        "previous_statut": previous_statut,
        "new_statut": offre.statut,
        "reason": reason or "Raison non spécifiée",
        "message": f"Offre pour '{annonce.titre if annonce else 'Unknown'}' a été annulée"
    }
