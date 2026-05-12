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


@admin_bp.route("/admin/dashboard", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_admin_dashboard(current_user):
    """GET /api/v1/admin/dashboard - Dashboard administrateur avec statistiques"""
    from src.models.annonces import Annonce

    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    last_7_days = now - timedelta(days=7)

    # Core queries
    total_users = db.session.query(User).count()
    active_users = db.session.query(User).filter(User.actif == True).count()
    role_counts = db.session.query(User.role, func.count(User.utilisateur_id)).group_by(User.role).all()
    users_by_role = {(r if r else 'undefined'): c for r, c in role_counts}

    total_listings = db.session.query(Annonce).count()
    active_listings = db.session.query(Annonce).filter(Annonce.statut == 'active').count()
    new_listings_7d = db.session.query(Annonce).filter(Annonce.date_creation >= last_7_days).count()
    new_listings_30d = db.session.query(Annonce).filter(Annonce.date_creation >= last_30_days).count()

    new_users_7d = db.session.query(User).filter(User.date_inscription >= last_7_days).count()
    new_users_30d = db.session.query(User).filter(User.date_inscription >= last_30_days).count()
    active_users_7d = db.session.query(User).filter(User.date_derniere_connexion >= last_7_days).count()
    never_logged_in = db.session.query(User).filter(User.date_derniere_connexion == None).count()

    # Optional tables
    total_offers, offers_this_month, new_offers_7d = 0, 0, 0
    try:
        from src.models.offres import Offre
        total_offers = db.session.query(Offre).count()
        offers_this_month = db.session.query(Offre).filter(Offre.date_offre >= last_30_days).count()
        new_offers_7d = db.session.query(Offre).filter(Offre.date_offre >= last_7_days).count()
    except Exception as e:
        logger.warning(f"Offres unavailable: {str(e)}")
        db.session.rollback()

    messages_7d = 0
    try:
        from src.models.messages import Message
        messages_7d = db.session.query(Message).filter(Message.date_creation >= last_7_days).count()
    except Exception as e:
        logger.warning(f"Messages unavailable: {str(e)}")
        db.session.rollback()

    top_listings_data = []
    try:
        top_listings = db.session.query(Annonce).order_by(desc(Annonce.nombre_vues)).limit(5).all()
        top_listings_data = [{"annonce_id": l.annonce_id, "titre": l.titre, "nombre_vues": l.nombre_vues or 0, "adresse": l.adresse, "prix": l.prix} for l in top_listings]
    except Exception as e:
        logger.warning(f"Top listings unavailable: {str(e)}")
        db.session.rollback()

    return {
        "admin_id": current_user['user_id'],
        "generated_at": now.isoformat(),
        "summary": {"total_users": total_users, "active_users": active_users, "inactive_users": total_users - active_users, "total_listings": total_listings, "active_listings": active_listings, "total_offers": total_offers},
        "users_by_role": users_by_role,
        "activity_7days": {"new_users": new_users_7d, "active_users": active_users_7d, "new_listings": new_listings_7d, "messages": messages_7d, "new_offers": new_offers_7d},
        "growth_30days": {"new_users": new_users_30d, "new_listings": new_listings_30d, "offers_created": offers_this_month},
        "health": {"never_logged_in_users": never_logged_in, "avg_new_users_per_day": round(new_users_7d / 7, 2), "avg_new_listings_per_day": round(new_listings_7d / 7, 2)},
        "top_listings": top_listings_data,
        "alerts": {"inactive_users": total_users - active_users, "inactive_listings": total_listings - active_listings, "never_logged_in": never_logged_in}
    }


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


# ========== TÂCHE 2: GESTION DES UTILISATEURS ==========

@admin_bp.route("/utilisateurs/<int:user_id>/role", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def update_user_role(current_user, user_id):
    """
    POST /api/v1/utilisateurs/{user_id}/role
    Modifier le rôle d'un utilisateur (admin only).

    Body:
    {
        "role": "admin" ou "user"
    }

    Returns:
        200 OK + user object
        400 BadRequest (invalid role)
        403 Forbidden (cannot modify yourself)
        404 NotFound (user doesn't exist)
    """
    # Vérifier qu'on ne modifie pas soi-même
    if user_id == current_user["user_id"]:
        raise ForbiddenError('Vous ne pouvez pas modifier votre propre rôle')

    # Valider le body
    data = request.get_json() or {}
    new_role = data.get("role", "").strip().lower()

    if not new_role:
        raise ValidationError('Le champ "role" est obligatoire')

    if new_role not in ["user", "admin"]:
        raise ValidationError(f'Role invalide. Doit être "user" ou "admin". Reçu: {new_role}')

    # Récupérer l'utilisateur
    user = db.session.query(User).filter(User.utilisateur_id == user_id).first()
    if not user:
        raise NotFoundError(f'Aucun utilisateur avec l\'ID {user_id}')

    old_role = user.role
    user.role = new_role
    db.session.add(user)
    db.session.commit()

    logger.info(f"Admin {current_user['user_id']} changed user {user_id} role from {old_role} to {new_role}")

    return {
        "utilisateur_id": user.utilisateur_id,
        "email": user.email,
        "nom": user.nom,
        "prenom": user.prenom,
        "old_role": old_role,
        "role": user.role,
        "message": f"Rôle de {user.email} changé en {new_role}"
    }


@admin_bp.route("/utilisateurs/<int:user_id>/suspend", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def suspend_user(current_user, user_id):
    """
    POST /api/v1/utilisateurs/{user_id}/suspend
    Suspendre temporairement un compte utilisateur (admin only).

    Body (optionnel):
    {
        "reason": "Raison de la suspension",
        "duration_hours": 24  # Optionnel, en heures (par défaut: 24h)
    }

    Returns:
        200 OK + suspension details
        403 Forbidden (cannot suspend yourself)
        404 NotFound (user doesn't exist)
    """
    # Vérifier qu'on ne se suspend pas soi-même
    if user_id == current_user["user_id"]:
        raise ForbiddenError('Vous ne pouvez pas vous suspendre vous-même')

    # Récupérer l'utilisateur
    user = db.session.query(User).filter(User.utilisateur_id == user_id).first()
    if not user:
        raise NotFoundError(f'Aucun utilisateur avec l\'ID {user_id}')

    # Récupérer les données optionnelles
    data = request.get_json() or {}
    reason = data.get("reason", "Non spécifiée")
    duration_hours = data.get("duration_hours", 24)

    # Valider la durée
    if not isinstance(duration_hours, int) or duration_hours <= 0:
        raise ValidationError('duration_hours doit être un entier positif')

    # Désactiver le compte
    user.actif = False
    db.session.add(user)
    db.session.commit()

    suspension_until = datetime.utcnow() + timedelta(hours=duration_hours)

    logger.info(f"Admin {current_user['user_id']} suspended user {user_id} for {duration_hours}h. Reason: {reason}")

    return {
        "utilisateur_id": user.utilisateur_id,
        "email": user.email,
        "suspended": True,
        "suspended_at": datetime.utcnow().isoformat(),
        "suspended_until": suspension_until.isoformat(),
        "duration_hours": duration_hours,
        "reason": reason,
        "message": f"{user.email} suspendu pour {duration_hours}h"
    }


@admin_bp.route("/utilisateurs/<int:user_id>/reactivate", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def reactivate_user(current_user, user_id):
    """
    POST /api/v1/utilisateurs/{user_id}/reactivate
    Réactiver un compte utilisateur suspendu ou désactivé (admin only).

    Returns:
        200 OK + user object
        404 NotFound (user doesn't exist)
    """
    user = db.session.query(User).filter(User.utilisateur_id == user_id).first()
    if not user:
        raise NotFoundError(f'Aucun utilisateur avec l\'ID {user_id}')

    was_inactive = not user.actif
    user.actif = True
    db.session.add(user)
    db.session.commit()

    logger.info(f"Admin {current_user['user_id']} reactivated user {user_id}")

    return {
        "utilisateur_id": user.utilisateur_id,
        "email": user.email,
        "nom": user.nom,
        "prenom": user.prenom,
        "actif": user.actif,
        "was_inactive": was_inactive,
        "message": f"{user.email} a été réactivé"
    }


@admin_bp.route("/utilisateurs/<int:user_id>", methods=["DELETE"])
@token_required
@admin_required
@handle_errors()
def delete_user(current_user, user_id):
    """
    DELETE /api/v1/utilisateurs/{user_id}
    Supprimer complètement un compte utilisateur et toutes ses données (admin only).

    Query params:
    - confirm: bool - Doit être "true" pour confirmer

    Returns:
        200 OK + deletion confirmation
        400 BadRequest (missing confirmation)
        403 Forbidden (cannot delete yourself)
        404 NotFound (user doesn't exist)
    """
    # Vérifier qu'on ne se supprime pas soi-même
    if user_id == current_user["user_id"]:
        raise ForbiddenError('Vous ne pouvez pas supprimer votre propre compte')

    # Vérifier la confirmation
    confirm = request.args.get("confirm", "false").lower() == "true"
    if not confirm:
        raise ValidationError('La suppression doit être confirmée avec ?confirm=true')

    # Récupérer l'utilisateur
    user = db.session.query(User).filter(User.utilisateur_id == user_id).first()
    if not user:
        raise NotFoundError(f'Aucun utilisateur avec l\'ID {user_id}')

    user_email = user.email
    user_id_val = user.utilisateur_id

    # Note: Les contraintes de clé étrangère de la base de données peuvent empêcher la suppression
    # si l'utilisateur a des annonces ou messages associés. On peut optionnellement les supprimer d'abord.

    # Supprimer l'utilisateur
    db.session.delete(user)
    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} DELETED user {user_id_val} ({user_email})")

    return {
        "deleted": True,
        "utilisateur_id": user_id_val,
        "email": user_email,
        "message": f"Le compte {user_email} a été supprimé de manière irréversible"
    }


@admin_bp.route("/utilisateurs/search", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def search_users(current_user):
    """
    GET /api/v1/utilisateurs/search
    Rechercher des utilisateurs par email, nom ou prénom (admin only).

    Query params:
    - q: str - Terme de recherche (email, nom ou prénom)
    - skip: int - Pagination skip
    - limit: int - Pagination limit

    Returns:
        200 OK + PaginatedUserList
    """
    q = request.args.get("q", "", type=str).strip()
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 100)

    if not q:
        raise ValidationError('Le paramètre "q" est obligatoire pour la recherche')

    if len(q) < 2:
        raise ValidationError('Le terme de recherche doit avoir au moins 2 caractères')

    # Recherche case-insensitive
    search_term = f"%{q}%"
    query = db.session.query(User).filter(
        (User.email.ilike(search_term)) |
        (User.nom.ilike(search_term)) |
        (User.prenom.ilike(search_term))
    )

    total = query.count()
    users = query.order_by(desc(User.date_inscription)).offset(skip).limit(limit).all()

    users_data = [
        {
            "utilisateur_id": user.utilisateur_id,
            "email": user.email,
            "nom": user.nom,
            "prenom": user.prenom,
            "telephone": user.telephone,
            "role": user.role,
            "actif": user.actif,
            "date_inscription": user.date_inscription.isoformat() if user.date_inscription else None,
            "date_derniere_connexion": user.date_derniere_connexion.isoformat() if user.date_derniere_connexion else None,
        }
        for user in users
    ]

    logger.info(f"Admin {current_user['user_id']} searched users with query: '{q}' (found {total})")

    return {
        "items": users_data,
        "total": total,
        "query": q,
        "skip": skip,
        "limit": limit
    }


# ========================================
# MODÉRATION DES ANNONCES (TASK 3)
# ========================================

@admin_bp.route("/admin/listings/pending", methods=["GET"])
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
    from src.models.annonces import Annonce

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


@admin_bp.route("/admin/listings/<int:listing_id>/approve", methods=["POST"])
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
    from src.models.annonces import Annonce

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


@admin_bp.route("/admin/listings/<int:listing_id>/reject", methods=["POST"])
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
    from src.models.annonces import Annonce

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


@admin_bp.route("/admin/listings/<int:listing_id>/remove", methods=["POST"])
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
    from src.models.annonces import Annonce

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


# ========================================
# GESTION DES TRANSACTIONS (TASK 4)
# ========================================

@admin_bp.route("/admin/transactions", methods=["GET"])
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
    from src.models.offres import Offre
    from src.models.annonces import Annonce

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


@admin_bp.route("/admin/transactions/<int:offre_id>", methods=["GET"])
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
    from src.models.offres import Offre
    from src.models.annonces import Annonce

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


@admin_bp.route("/admin/transactions/<int:offre_id>/accept", methods=["POST"])
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
    from src.models.offres import Offre
    from src.models.annonces import Annonce

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


@admin_bp.route("/admin/transactions/<int:offre_id>/decline", methods=["POST"])
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
    from src.models.offres import Offre
    from src.models.annonces import Annonce

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


@admin_bp.route("/admin/transactions/<int:offre_id>/cancel", methods=["POST"])
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
    from src.models.offres import Offre
    from src.models.annonces import Annonce

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


# ==============================================================================
# TASK 5: SYSTÈME SETTINGS / PARAMÈTRES SYSTÈME
# ==============================================================================

@admin_bp.route("/admin/settings", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_settings(current_user):
    """
    GET /api/v1/admin/settings
    Récupérer tous les paramètres système.

    Returns:
        200 OK + {
            "total": int,
            "settings": [
                {
                    "parametre_id": int,
                    "cle_parametre": str,
                    "valeur_parametre": str,
                    "type_parametre": str,
                    "description": str,
                    "date_modification": str
                }
            ]
        }
    """
    try:
        result = db.session.execute(db.text("""
            SELECT parametre_id, cle_parametre, valeur_parametre,
                   type_parametre, description, date_modification
            FROM parametres_systeme
            ORDER BY cle_parametre
        """))
        settings = [
            {
                "parametre_id": row.parametre_id,
                "cle_parametre": row.cle_parametre,
                "valeur_parametre": row.valeur_parametre,
                "type_parametre": row.type_parametre,
                "description": row.description,
                "date_modification": row.date_modification.isoformat() if row.date_modification else None
            }
            for row in result
        ]

        logger.info(f"Admin {current_user['user_id']} retrieved {len(settings)} system settings")

        return {
            "total": len(settings),
            "settings": settings
        }
    except Exception as e:
        logger.warning(f"Settings table unavailable: {str(e)}")
        db.session.rollback()
        raise ValidationError(f"Impossible de récupérer les paramètres: {str(e)}")


@admin_bp.route("/admin/settings/<setting_key>", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_setting(current_user, setting_key):
    """
    GET /api/v1/admin/settings/{setting_key}
    Récupérer un paramètre système spécifique.

    Returns:
        200 OK + {
            "parametre_id": int,
            "cle_parametre": str,
            "valeur_parametre": str,
            "type_parametre": str,
            "description": str,
            "date_modification": str
        }
    """
    try:
        result = db.session.execute(db.text("""
            SELECT parametre_id, cle_parametre, valeur_parametre,
                   type_parametre, description, date_modification
            FROM parametres_systeme
            WHERE cle_parametre = :key
        """), {"key": setting_key})
        row = result.first()

        if not row:
            raise NotFoundError(f"Paramètre '{setting_key}' non trouvé")

        return {
            "parametre_id": row.parametre_id,
            "cle_parametre": row.cle_parametre,
            "valeur_parametre": row.valeur_parametre,
            "type_parametre": row.type_parametre,
            "description": row.description,
            "date_modification": row.date_modification.isoformat() if row.date_modification else None
        }

    except NotFoundError:
        raise
    except Exception as e:
        logger.warning(f"Error fetching setting {setting_key}: {str(e)}")
        db.session.rollback()
        raise NotFoundError(f"Paramètre '{setting_key}' non trouvé")


@admin_bp.route("/admin/settings/<setting_key>", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def update_setting(current_user, setting_key):
    """
    POST /api/v1/admin/settings/{setting_key}
    Mettre à jour un paramètre système.

    JSON body: {
        "valeur_parametre": str - Nouvelle valeur
    }

    Returns:
        200 OK + {
            "updated": true,
            "parametre_id": int,
            "cle_parametre": str,
            "ancien_valeur": str,
            "nouvelle_valeur": str,
            "type_parametre": str,
            "message": str
        }
    """
    data = request.get_json() or {}
    nouvelle_valeur = data.get("valeur_parametre")

    if nouvelle_valeur is None:
        raise ValidationError("Le champ 'valeur_parametre' est requis")

    nouvelle_valeur = str(nouvelle_valeur).strip()

    if not nouvelle_valeur:
        raise ValidationError("La valeur ne peut pas être vide")

    try:
        # Récupérer le paramètre actuel
        result = db.session.execute(db.text("""
            SELECT parametre_id, cle_parametre, valeur_parametre,
                   type_parametre, description
            FROM parametres_systeme
            WHERE cle_parametre = :key
        """), {"key": setting_key})
        row = result.first()

        if not row:
            raise NotFoundError(f"Paramètre '{setting_key}' non trouvé")

        ancien_valeur = row.valeur_parametre
        parametre_id = row.parametre_id
        type_parametre = row.type_parametre

        # Valider selon le type
        if type_parametre == 'boolean':
            if nouvelle_valeur.lower() not in ['true', 'false']:
                raise ValidationError(f"Valeur booléenne invalide: '{nouvelle_valeur}'. Utilisez 'true' ou 'false'")

        elif type_parametre == 'integer':
            try:
                int(nouvelle_valeur)
            except ValueError:
                raise ValidationError(f"Valeur entière invalide: '{nouvelle_valeur}'")

        # Mettre à jour
        db.session.execute(db.text("""
            UPDATE parametres_systeme
            SET valeur_parametre = :valeur, date_modification = CURRENT_TIMESTAMP
            WHERE cle_parametre = :key
        """), {"valeur": nouvelle_valeur, "key": setting_key})
        db.session.commit()

        logger.warning(f"Admin {current_user['user_id']} updated setting '{setting_key}': '{ancien_valeur}' → '{nouvelle_valeur}'")

        return {
            "updated": True,
            "parametre_id": parametre_id,
            "cle_parametre": setting_key,
            "ancien_valeur": ancien_valeur,
            "nouvelle_valeur": nouvelle_valeur,
            "type_parametre": type_parametre,
            "message": f"Paramètre '{setting_key}' a été mis à jour avec succès"
        }

    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        logger.error(f"Error updating setting {setting_key}: {str(e)}")
        db.session.rollback()
        raise ValidationError(f"Erreur lors de la mise à jour du paramètre: {str(e)}")


@admin_bp.route("/admin/settings/reset", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def reset_settings(current_user):
    """
    POST /api/v1/admin/settings/reset
    Réinitialiser tous les paramètres système à leurs valeurs par défaut.

    JSON body: {
        "confirm": bool - Confirmation requise (doit être true)
    }

    Returns:
        200 OK + {
            "reset": true,
            "parametres_resetted": int,
            "message": str
        }
    """
    data = request.get_json() or {}
    confirm = data.get("confirm", False)

    if not confirm:
        raise ValidationError("La confirmation est requise pour réinitialiser les paramètres (confirm: true)")

    try:
        # Réinitialiser tous les paramètres à leurs valeurs par défaut
        default_settings = {
            'email_notifications_enabled': 'true',
            'sms_notifications_enabled': 'false',
            'rate_limit_requests_per_hour': '1000',
            'rate_limit_listings_per_user_per_month': '50',
            'auto_approve_listings': 'false',
            'approval_timeout_days': '7',
            'auto_archive_days': '180',
            'maintenance_mode': 'false',
            'debug_mode': 'false',
            'max_upload_size_mb': '50',
            'email_from_address': 'noreply@immo2000.fr',
            'support_email': 'support@immo2000.fr',
            'listing_image_quality': '85',
            'session_timeout_minutes': '30',
            'password_expiry_days': '90'
        }

        count = 0
        for cle, valeur in default_settings.items():
            db.session.execute(db.text("""
                UPDATE parametres_systeme
                SET valeur_parametre = :valeur, date_modification = CURRENT_TIMESTAMP
                WHERE cle_parametre = :key
            """), {"valeur": valeur, "key": cle})
            count += 1

        db.session.commit()

        logger.warning(f"Admin {current_user['user_id']} RESET all system settings to defaults")

        return {
            "reset": True,
            "parametres_resetted": count,
            "message": f"{count} paramètres ont été réinitialisés aux valeurs par défaut"
        }


    except Exception as e:
        logger.error(f"Error resetting settings: {str(e)}")
        db.session.rollback()
        raise ValidationError(f"Erreur lors de la réinitialisation: {str(e)}")


# ==============================================================================
# TASK 6: ANALYTICS / STATISTIQUES AVANCÉES
# ==============================================================================

@admin_bp.route("/admin/analytics/summary", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_analytics_summary(current_user):
    """
    GET /api/v1/admin/analytics/summary
    Résumé des statistiques principales avec KPIs.
    """
    from datetime import timedelta
    
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    try:
        # Utilisateurs
        total_users = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM utilisateurs WHERE role = 'user'
        """)).scalar() or 0
        
        active_users_30d = db.session.execute(db.text("""
            SELECT COUNT(DISTINCT utilisateur_id) as cnt FROM annonces 
            WHERE date_modification >= :start_date
        """), {"start_date": thirty_days_ago}).scalar() or 0
        
        new_users_30d = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM utilisateurs 
            WHERE date_inscription >= :start_date AND role = 'user'
        """), {"start_date": thirty_days_ago}).scalar() or 0
        
        # Annonces
        total_listings = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM annonces
        """)).scalar() or 0
        
        published = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM annonces WHERE statut = 'publiée'
        """)).scalar() or 0
        
        sold = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM annonces WHERE statut = 'vendue'
        """)).scalar() or 0
        
        draft = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM annonces WHERE statut = 'brouillon'
        """)).scalar() or 0
        
        price_stats = db.session.execute(db.text("""
            SELECT COALESCE(AVG(prix), 0) as avg_prix,
                   COALESCE(MIN(prix), 0) as min_prix,
                   COALESCE(MAX(prix), 0) as max_prix
            FROM annonces WHERE statut IN ('publiée', 'vendue', 'archivée')
        """)).first()
        
        # Offres
        try:
            total_offers = db.session.execute(db.text("""
                SELECT COUNT(*) as cnt FROM offres
            """)).scalar() or 0
            
            accepted = db.session.execute(db.text("""
                SELECT COUNT(*) as cnt FROM offres WHERE statut = 'acceptee'
            """)).scalar() or 0
            
            refused = db.session.execute(db.text("""
                SELECT COUNT(*) as cnt FROM offres WHERE statut = 'refusee'
            """)).scalar() or 0
            
            negotiation = db.session.execute(db.text("""
                SELECT COUNT(*) as cnt FROM offres WHERE statut = 'negociation'
            """)).scalar() or 0
            
            total_value = db.session.execute(db.text("""
                SELECT COALESCE(SUM(prix_propose), 0) as total FROM offres
            """)).scalar() or 0
            
            conversion_rate = (accepted / total_offers * 100) if total_offers > 0 else 0
        except:
            db.session.rollback()
            total_offers = accepted = refused = negotiation = 0
            total_value = 0
            conversion_rate = 0
        
        retention = (active_users_30d / total_users * 100) if total_users > 0 else 0
        avg_offer = (total_value / total_offers) if total_offers > 0 else 0
        
        logger.info(f"Admin {current_user['user_id']} accessed analytics summary")
        
        return {
            "periode": {
                "debut": thirty_days_ago.isoformat(),
                "fin": now.isoformat()
            },
            "utilisateurs": {
                "total": total_users,
                "actifs_derniers_30_jours": active_users_30d,
                "nouveaux_derniers_30_jours": new_users_30d,
                "taux_retention_pct": round(retention, 2)
            },
            "annonces": {
                "total": total_listings,
                "publiees": published,
                "vendues": sold,
                "draft": draft,
                "prix_moyen": round(float(price_stats.avg_prix), 2),
                "prix_min": round(float(price_stats.min_prix), 2),
                "prix_max": round(float(price_stats.max_prix), 2)
            },
            "offres": {
                "total": total_offers,
                "acceptees": accepted,
                "refusees": refused,
                "en_negociation": negotiation,
                "taux_conversion_pct": round(conversion_rate, 2)
            },
            "revenus": {
                "valeur_totale_offres": round(total_value, 2),
                "valeur_moyenne_offre": round(avg_offer, 2)
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting analytics summary: {str(e)}")
        raise ValidationError(f"Erreur: {str(e)}")


@admin_bp.route("/admin/analytics/users", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_analytics_users(current_user):
    """
    GET /api/v1/admin/analytics/users
    Statistiques détaillées des utilisateurs.
    """
    from datetime import timedelta
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    try:
        # Rôles
        roles = db.session.execute(db.text("""
            SELECT role, COUNT(*) as cnt FROM utilisateurs GROUP BY role
        """))
        roles_dict = {row.role: row.cnt for row in roles}
        
        total = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM utilisateurs
        """)).scalar() or 0
        
        active = db.session.execute(db.text("""
            SELECT COUNT(DISTINCT utilisateur_id) as cnt FROM annonces 
            WHERE date_modification >= :start
        """), {"start": start_date}).scalar() or 0
        
        suspended = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM utilisateurs WHERE actif = FALSE
        """)).scalar() or 0
        
        # Croissance
        growth = db.session.execute(db.text("""
            SELECT DATE(date_inscription) as jour, COUNT(*) as nouveaux
            FROM utilisateurs WHERE date_inscription >= :start
            GROUP BY DATE(date_inscription) ORDER BY jour DESC
        """), {"start": start_date})
        
        growth_list = [
            {"date": row.jour.isoformat() if row.jour else None, "nouveaux": row.nouveaux}
            for row in growth
        ]
        
        # Top vendeurs
        sellers = db.session.execute(db.text("""
            SELECT u.utilisateur_id, u.nom, u.email,
                   COUNT(CASE WHEN a.statut IN ('publiée', 'vendue') THEN 1 END) as total_annonces,
                   COUNT(CASE WHEN a.statut = 'vendue' THEN 1 END) as vendues
            FROM utilisateurs u
            LEFT JOIN annonces a ON u.utilisateur_id = a.utilisateur_id
            WHERE u.role = 'user'
            GROUP BY u.utilisateur_id, u.nom, u.email
            HAVING COUNT(a.annonce_id) > 0
            ORDER BY vendues DESC LIMIT 10
        """))
        
        sellers_list = [
            {
                "user_id": row.utilisateur_id,
                "nom": row.nom or "Utilisateur",
                "email": row.email,
                "nombre_annonces": row.total_annonces or 0,
                "annonces_vendues": row.vendues or 0
            }
            for row in sellers
        ]
        
        logger.info(f"Admin {current_user['user_id']} accessed users analytics")
        
        return {
            "total_users": total,
            "repartition_roles": roles_dict,
            "utilisateurs_actifs": active,
            "utilisateurs_suspendus": suspended,
            "croissance_derniers_jours": growth_list,
            "top_vendeurs": sellers_list
        }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise ValidationError(f"Erreur: {str(e)}")


@admin_bp.route("/admin/analytics/listings", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_analytics_listings(current_user):
    """
    GET /api/v1/admin/analytics/listings
    Statistiques détaillées des annonces.
    """
    try:
        # Par statut
        by_status = db.session.execute(db.text("""
            SELECT statut, COUNT(*) as cnt FROM annonces GROUP BY statut
        """))
        status_dict = {row.statut: row.cnt for row in by_status}
        
        # Par type
        by_type = db.session.execute(db.text("""
            SELECT type_bien, COUNT(*) as cnt FROM annonces 
            WHERE type_bien IS NOT NULL GROUP BY type_bien
        """))
        type_dict = {row.type_bien: row.cnt for row in by_type}
        
        # Prix
        price = db.session.execute(db.text("""
            SELECT COALESCE(AVG(prix), 0) as avg_prix,
                   COALESCE(MIN(prix), 0) as min_prix,
                   COALESCE(MAX(prix), 0) as max_prix
            FROM annonces WHERE prix IS NOT NULL
        """)).first()
        
        # Surface
        surface = db.session.execute(db.text("""
            SELECT COALESCE(AVG(surface), 0) as avg_surface,
                   COALESCE(MIN(surface), 0) as min_surface,
                   COALESCE(MAX(surface), 0) as max_surface
            FROM annonces WHERE surface IS NOT NULL
        """)).first()
        
        # Pièces
        rooms = db.session.execute(db.text("""
            SELECT COALESCE(AVG(nombre_pieces), 0) as avg FROM annonces 
            WHERE nombre_pieces IS NOT NULL
        """)).scalar() or 0
        
        # Temps vente
        sale_time = db.session.execute(db.text("""
            SELECT COALESCE(AVG(EXTRACT(DAY FROM (date_statut - date_creation))), 0) as avg_days
            FROM annonces WHERE statut = 'vendue'
        """)).scalar() or 0
        
        # Par ville
        cities = db.session.execute(db.text("""
            SELECT ville, COUNT(*) as cnt, COALESCE(AVG(prix), 0) as avg_prix
            FROM annonces WHERE ville IS NOT NULL
            GROUP BY ville ORDER BY cnt DESC LIMIT 15
        """))
        
        cities_list = [
            {"ville": row.ville, "count": row.cnt, "prix_moyen": round(float(row.avg_prix), 2)}
            for row in cities
        ]
        
        total = db.session.execute(db.text("SELECT COUNT(*) as cnt FROM annonces")).scalar() or 0
        
        logger.info(f"Admin {current_user['user_id']} accessed listings analytics")
        
        return {
            "total": total,
            "par_statut": status_dict,
            "par_type": type_dict,
            "prix": {
                "moyen": round(float(price.avg_prix), 2) if price else 0,
                "min": round(float(price.min_prix), 2) if price else 0,
                "max": round(float(price.max_prix), 2) if price else 0
            },
            "surface": {
                "moyenne": round(float(surface.avg_surface), 2) if surface else 0,
                "min": int(surface.min_surface) if surface else 0,
                "max": int(surface.max_surface) if surface else 0
            },
            "pieces": {"moyenne": round(float(rooms), 2)},
            "temps_moyen_vente_jours": int(sale_time),
            "annonces_par_ville": cities_list
        }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise ValidationError(f"Erreur: {str(e)}")


@admin_bp.route("/admin/analytics/transactions", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_analytics_transactions(current_user):
    """
    GET /api/v1/admin/analytics/transactions
    Statistiques détaillées des transactions/offres.
    """
    try:
        # Par statut
        by_status = db.session.execute(db.text("""
            SELECT statut, COUNT(*) as cnt FROM offres GROUP BY statut
        """))
        status_dict = {row.statut: row.cnt for row in by_status}
        
        total = db.session.execute(db.text("""
            SELECT COUNT(*) as cnt FROM offres
        """)).scalar() or 0
        
        accepted = status_dict.get('acceptee', 0)
        negotiation = status_dict.get('negociation', 0)
        
        conversion = (accepted / total * 100) if total > 0 else 0
        negotiation_rate = (negotiation / total * 100) if total > 0 else 0
        
        # Prix
        prices = db.session.execute(db.text("""
            SELECT COALESCE(AVG(prix_propose), 0) as avg_prix,
                   COALESCE(SUM(CASE WHEN statut IN ('proposee', 'negociation') THEN prix_propose ELSE 0 END), 0) as pending,
                   COALESCE(SUM(CASE WHEN statut = 'acceptee' THEN prix_propose ELSE 0 END), 0) as accepted_total
            FROM offres
        """)).first()
        
        # Temps moyen
        avg_time = db.session.execute(db.text("""
            SELECT COALESCE(AVG(EXTRACT(DAY FROM (date_reponse - date_offre))), 0) as days
            FROM offres WHERE date_reponse IS NOT NULL
        """)).scalar() or 0
        
        # Par annonce
        per_listing = db.session.execute(db.text("""
            SELECT COALESCE(AVG(nb), 0) as avg, COALESCE(MAX(nb), 0) as max FROM (
                SELECT COUNT(*) as nb FROM offres GROUP BY annonce_id
            ) s
        """)).first()
        
        logger.info(f"Admin {current_user['user_id']} accessed transactions analytics")
        
        return {
            "total": total,
            "par_statut": status_dict,
            "taux_conversion_pct": round(conversion, 2),
            "taux_negociation_pct": round(negotiation_rate, 2),
            "prix": {
                "moyen_propose": round(float(prices.avg_prix), 2) if prices else 0,
                "total_en_attente": round(float(prices.pending), 2) if prices else 0,
                "total_acceptees": round(float(prices.accepted_total), 2) if prices else 0
            },
            "temps_moyen_jours": int(avg_time),
            "offres_par_annonce": {
                "moyenne": round(float(per_listing.avg), 2) if per_listing else 0,
                "max": int(per_listing.max) if per_listing else 0
            }
        }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        db.session.rollback()
        return {
            "total": 0,
            "par_statut": {},
            "taux_conversion_pct": 0,
            "taux_negociation_pct": 0,
            "prix": {"moyen_propose": 0, "total_en_attente": 0, "total_acceptees": 0},
            "temps_moyen_jours": 0,
            "offres_par_annonce": {"moyenne": 0, "max": 0}
        }
