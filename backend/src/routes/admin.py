"""
Routes Flask pour l'espace administrateur.

Endpoints :
- GET /api/v1/utilisateurs → Lister tous les utilisateurs (admin only)
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import desc, func
from datetime import datetime, timedelta
import logging

from src.auth.models import db, User
from src.auth.decorators import token_required, admin_required
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError

logger = logging.getLogger(__name__)

# Blueprint
admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1")


@admin_bp.route("/utilisateurs", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def list_all_users(current_user):
    """
    GET /api/v1/utilisateurs
    Lister tous les utilisateurs de la plateforme (admin only).

    Query parameters:
    - skip: int (default: 0) - Pagination skip
    - limit: int (default: 20) - Pagination limit (max: 100)
    - role: str (optional) - Filtrer par rôle (vendeur, acheteur, agent)
    - actif: bool (optional) - Filtrer par statut actif

    Returns:
        200 OK + PaginatedUserList
        401 Unauthorized (no JWT)
        403 Forbidden (not admin)
    """
    # Récupérer les paramètres de pagination
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 100)

    # Récupérer les paramètres de filtrage
    role = request.args.get("role", None, type=str)
    actif_str = request.args.get("actif", None, type=str)

    # Construire la requête de base
    query = db.session.query(User)

    # Appliquer les filtres
    if role:
        if role not in ["vendeur", "acheteur", "agent"]:
            raise ValidationError(f'Role must be one of: vendeur, acheteur, agent. Got: {role}')
        query = query.filter(User.role == role)

    if actif_str:
        actif = actif_str.lower() in ["true", "1", "yes"]
        query = query.filter(User.actif == actif)

    # Compter le total
    total = query.count()

    # Appliquer pagination et trier
    users = query.order_by(desc(User.date_inscription)).offset(skip).limit(limit).all()

    # Sérialiser les utilisateurs
    users_data = [
        {
            "utilisateur_id": user.utilisateur_id,
            "email": user.email,
            "nom": user.nom,
            "prenom": user.prenom,
            "telephone": user.telephone,
            "adresse_contact": user.adresse_contact,
            "role": user.role,
            "actif": user.actif,
            "date_inscription": user.date_inscription.isoformat() if user.date_inscription else None,
            "date_derniere_connexion": user.date_derniere_connexion.isoformat() if user.date_derniere_connexion else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
        for user in users
    ]

    logger.info(f"Admin {current_user['user_id']} listed {len(users)} users (total: {total})")

    return {
        "items": users_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@admin_bp.route("/utilisateurs/<int:user_id>", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_user_details(current_user, user_id):
    """
    GET /api/v1/utilisateurs/{user_id}
    Récupérer les détails d'un utilisateur spécifique (admin only).
    """
    user = db.session.query(User).filter(User.utilisateur_id == user_id).first()
    if not user:
        raise NotFoundError(f'No user with ID {user_id}')

    # Compter les annonces de l'utilisateur
    from src.models.annonces import Annonce
    annonces_count = db.session.query(Annonce).filter(
        Annonce.utilisateur_id == user_id
    ).count()

    logger.info(f"Admin {current_user['user_id']} accessed user {user_id} details")

    return {
        "utilisateur_id": user.utilisateur_id,
        "email": user.email,
        "nom": user.nom,
        "prenom": user.prenom,
        "telephone": user.telephone,
        "adresse_contact": user.adresse_contact,
        "role": user.role,
        "actif": user.actif,
        "date_inscription": user.date_inscription.isoformat() if user.date_inscription else None,
        "date_derniere_connexion": user.date_derniere_connexion.isoformat() if user.date_derniere_connexion else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "annonces_count": annonces_count
    }


@admin_bp.route("/utilisateurs/<int:user_id>/deactivate", methods=["PATCH"])
@token_required
@admin_required
@handle_errors()
def deactivate_user(current_user, user_id):
    """
    PATCH /api/v1/utilisateurs/{user_id}/deactivate
    Désactiver un compte utilisateur (admin only).
    """
    # Vérifier qu'on ne désactive pas soi-même
    if user_id == current_user["user_id"]:
        raise ValidationError('Admins cannot deactivate their own account')

    user = db.session.query(User).filter(User.utilisateur_id == user_id).first()
    if not user:
        raise NotFoundError(f'No user with ID {user_id}')

    user.actif = False
    db.session.add(user)
    db.session.commit()

    logger.info(f"Admin {current_user['user_id']} deactivated user {user_id}")

    return {
        "utilisateur_id": user.utilisateur_id,
        "email": user.email,
        "actif": user.actif,
        "message": f"User {user.email} has been deactivated"
    }


@admin_bp.route("/admin/analytics", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_analytics(current_user):
    """
    GET /api/v1/admin/analytics
    Obtenir les analytics et statistiques du trafic (admin only).
    """
    period = request.args.get("period", "week", type=str)
    if period not in ["week", "month", "year", "all"]:
        raise ValidationError('period must be one of: week, month, year, all')

    # Déterminer la date limite en fonction de la période
    now = datetime.utcnow()
    if period == "week":
        date_limit = now - timedelta(days=7)
    elif period == "month":
        date_limit = now - timedelta(days=30)
    elif period == "year":
        date_limit = now - timedelta(days=365)
    else:  # 'all'
        date_limit = datetime.min

    # ============ RÉSUMÉ GÉNÉRAL ============
    total_users = db.session.query(User).count()
    active_users = db.session.query(User).filter(User.actif == True).count()

    # Compter les utilisateurs par rôle
    users_by_role = {}
    role_counts = db.session.query(User.role, func.count(User.utilisateur_id)).group_by(User.role).all()
    for role, count in role_counts:
        users_by_role[role] = count

    # Compter les annonces, offres, notaires
    from src.models.annonces import Annonce
    total_listings = db.session.query(Annonce).count()

    try:
        from src.models.offres import Offre
        total_offers = db.session.query(Offre).count()
    except:
        total_offers = 0

    total_notaires = db.session.query(User).filter(User.role == 'notaire').count()

    # ============ TRAFIC RÉCENT ============
    logins_recent = db.session.query(User).filter(
        User.date_derniere_connexion >= date_limit
    ).count()

    listings_created_recent = db.session.query(Annonce).filter(
        Annonce.date_creation >= date_limit
    ).count() if date_limit != datetime.min else db.session.query(Annonce).count()

    try:
        from src.models.offres import Offre
        offers_created_recent = db.session.query(Offre).filter(
            Offre.date_creation >= date_limit
        ).count() if date_limit != datetime.min else db.session.query(Offre).count()
    except:
        offers_created_recent = 0

    try:
        from src.models.messages import Message
        messages_sent_recent = db.session.query(Message).filter(
            Message.date_envoi >= date_limit
        ).count() if date_limit != datetime.min else db.session.query(Message).count()
    except:
        messages_sent_recent = 0

    new_users_recent = db.session.query(User).filter(
        User.date_inscription >= date_limit
    ).count() if date_limit != datetime.min else 0

    analytics = {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "total_listings": total_listings,
            "total_offers": total_offers,
            "total_notaires": total_notaires
        },
        "users_by_role": users_by_role,
        "traffic": {
            "logins": logins_recent,
            "listings_created": listings_created_recent,
            "offers_created": offers_created_recent,
            "messages_sent": messages_sent_recent
        },
        "growth": {
            "new_users": new_users_recent,
            "new_listings": listings_created_recent,
            "new_offers": offers_created_recent
        },
        "period": period,
        "generated_at": datetime.utcnow().isoformat()
    }

    logger.info(f"Admin {current_user['user_id']} accessed analytics (period: {period})")

    return analytics


@admin_bp.route("/admin/stats/user-activity", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_user_activity_stats(current_user):
    """
    GET /api/v1/admin/stats/user-activity
    Obtenir les statistiques d'activité des utilisateurs (admin only).
    """
    # Utilisateurs actifs vs inactifs
    active_count = db.session.query(User).filter(User.actif == True).count()
    inactive_count = db.session.query(User).filter(User.actif == False).count()

    # Nouvelles inscriptions par jour (7 derniers jours)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_registrations_by_day = db.session.query(
        func.date(User.date_inscription).label('date'),
        func.count(User.utilisateur_id).label('count')
    ).filter(
        User.date_inscription >= seven_days_ago
    ).group_by(func.date(User.date_inscription)).all()

    days_data = [{"date": str(day), "count": count} for day, count in new_registrations_by_day]

    # Utilisateurs n'ayant jamais login
    never_logged_in = db.session.query(User).filter(
        User.date_derniere_connexion == None
    ).count()

    logger.info(f"Admin {current_user['user_id']} accessed user activity stats")

    return {
        "user_status": {
            "active": active_count,
            "inactive": inactive_count,
            "never_logged_in": never_logged_in
        },
        "new_registrations_last_7_days": days_data,
        "total_new_registrations_this_week": sum([d["count"] for d in days_data])
    }
