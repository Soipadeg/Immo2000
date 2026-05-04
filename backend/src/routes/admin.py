"""
Routes Flask pour l'espace administrateur.

Endpoints :
- GET /api/v1/utilisateurs → Lister tous les utilisateurs (admin only)
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import desc
import logging

from src.auth.models import db, User
from src.auth.decorators import token_required, admin_required

logger = logging.getLogger(__name__)

# Blueprint
admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1")


@admin_bp.route("/utilisateurs", methods=["GET"])
@token_required
@admin_required
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

    Response example:
        {
            "items": [
                {
                    "utilisateur_id": 1,
                    "email": "john@example.com",
                    "nom": "Doe",
                    "prenom": "John",
                    "role": "vendeur",
                    "actif": true,
                    "date_inscription": "2026-01-15T10:00:00",
                    "date_derniere_connexion": "2026-05-04T15:30:00"
                }
            ],
            "total": 42,
            "skip": 0,
            "limit": 20
        }
    """
    try:
        # Récupérer les paramètres de pagination
        skip = request.args.get("skip", 0, type=int)
        limit = request.args.get("limit", 20, type=int)

        # Limiter limit à 100
        limit = min(limit, 100)

        # Récupérer les paramètres de filtrage
        role = request.args.get("role", None, type=str)
        actif_str = request.args.get("actif", None, type=str)

        # Construire la requête de base
        query = db.session.query(User)

        # Appliquer les filtres
        if role:
            if role not in ["vendeur", "acheteur", "agent"]:
                return jsonify({
                    "error": "Invalid role",
                    "code": 400,
                    "details": f"Role must be one of: vendeur, acheteur, agent. Got: {role}"
                }), 400
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

        response = {
            "items": users_data,
            "total": total,
            "skip": skip,
            "limit": limit
        }

        logger.info(f"Admin {current_user['user_id']} listed {len(users)} users (total: {total})")

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": 500,
            "details": str(e)
        }), 500


@admin_bp.route("/utilisateurs/<int:user_id>", methods=["GET"])
@token_required
@admin_required
def get_user_details(current_user, user_id):
    """
    GET /api/v1/utilisateurs/{user_id}
    Récupérer les détails d'un utilisateur spécifique (admin only).

    Parameters:
        user_id (int): ID de l'utilisateur à récupérer

    Returns:
        200 OK + User details
        401 Unauthorized (no JWT)
        403 Forbidden (not admin)
        404 Not Found

    Response example:
        {
            "utilisateur_id": 1,
            "email": "john@example.com",
            "nom": "Doe",
            "prenom": "John",
            "telephone": "0123456789",
            "adresse_contact": "123 rue de la Paix, 75001 Paris",
            "role": "vendeur",
            "actif": true,
            "date_inscription": "2026-01-15T10:00:00",
            "date_derniere_connexion": "2026-05-04T15:30:00",
            "annonces_count": 5,
            "updated_at": "2026-05-04T11:00:00"
        }
    """
    try:
        user = db.session.query(User).filter(User.utilisateur_id == user_id).first()

        if not user:
            return jsonify({
                "error": "User not found",
                "code": 404,
                "details": f"No user with ID {user_id}"
            }), 404

        # Compter les annonces de l'utilisateur
        from src.models.annonces import Annonce
        annonces_count = db.session.query(Annonce).filter(
            Annonce.utilisateur_id == user_id
        ).count()

        user_data = {
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

        logger.info(f"Admin {current_user['user_id']} accessed user {user_id} details")

        return jsonify(user_data), 200

    except Exception as e:
        logger.error(f"Error getting user details: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": 500,
            "details": str(e)
        }), 500


@admin_bp.route("/utilisateurs/<int:user_id>/deactivate", methods=["PATCH"])
@token_required
@admin_required
def deactivate_user(current_user, user_id):
    """
    PATCH /api/v1/utilisateurs/{user_id}/deactivate
    Désactiver un compte utilisateur (admin only).

    Parameters:
        user_id (int): ID de l'utilisateur à désactiver

    Returns:
        200 OK + User updated
        401 Unauthorized (no JWT)
        403 Forbidden (not admin)
        404 Not Found

    Security note: Un administrateur ne peut pas se désactiver lui-même.
    """
    try:
        # Vérifier qu'on ne désactive pas soi-même
        if user_id == current_user["user_id"]:
            return jsonify({
                "error": "Cannot deactivate yourself",
                "code": 400,
                "details": "Admins cannot deactivate their own account"
            }), 400

        user = db.session.query(User).filter(User.utilisateur_id == user_id).first()

        if not user:
            return jsonify({
                "error": "User not found",
                "code": 404,
                "details": f"No user with ID {user_id}"
            }), 404

        user.actif = False
        db.session.add(user)
        db.session.commit()

        user_data = {
            "utilisateur_id": user.utilisateur_id,
            "email": user.email,
            "actif": user.actif,
            "message": f"User {user.email} has been deactivated"
        }

        logger.info(f"Admin {current_user['user_id']} deactivated user {user_id}")

        return jsonify(user_data), 200

    except Exception as e:
        logger.error(f"Error deactivating user: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": 500,
            "details": str(e)
        }), 500
