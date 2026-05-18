"""
Routes Flask pour la gestion des utilisateurs en tant que admin.

Endpoints :
- GET /api/v1/utilisateurs → Lister tous les utilisateurs (admin only)
- GET /api/v1/utilisateurs/{user_id} → Récupérer les détails d'un utilisateur
- PATCH /api/v1/utilisateurs/{user_id}/deactivate → Désactiver un compte
- POST /api/v1/utilisateurs/{user_id}/role → Modifier le rôle d'un utilisateur
- POST /api/v1/utilisateurs/{user_id}/suspend → Suspendre temporairement un compte
- POST /api/v1/utilisateurs/{user_id}/reactivate → Réactiver un compte suspendu
- DELETE /api/v1/utilisateurs/{user_id} → Supprimer un compte utilisateur
- GET /api/v1/utilisateurs/search → Rechercher des utilisateurs
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
users_bp = Blueprint("admin_users", __name__, url_prefix="/api/v1")


@users_bp.route("/utilisateurs", methods=["GET"])
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


@users_bp.route("/utilisateurs/<int:user_id>", methods=["GET"])
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


@users_bp.route("/utilisateurs/<int:user_id>/deactivate", methods=["PATCH"])
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


@users_bp.route("/utilisateurs/<int:user_id>/role", methods=["POST"])
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


@users_bp.route("/utilisateurs/<int:user_id>/suspend", methods=["POST"])
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


@users_bp.route("/utilisateurs/<int:user_id>/reactivate", methods=["POST"])
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


@users_bp.route("/utilisateurs/<int:user_id>", methods=["DELETE"])
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


@users_bp.route("/utilisateurs/search", methods=["GET"])
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
