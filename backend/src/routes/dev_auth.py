"""
Routes de développement pour tester les rôles sans authentification.

⚠️  DEVELOPMENT ONLY - Never enable in production!

Endpoints :
- GET /dev/auth/{role} : Retourne un token fake pour le rôle spécifié
- GET /dev/auth/tokens : Liste tous les tokens disponibles

Rôles supportés: visiteur, user, admin, notaire
"""

from flask import Blueprint, jsonify, current_app, request
import os

dev_auth_bp = Blueprint("dev_auth", __name__, url_prefix="/dev/auth")


def is_dev_mode() -> bool:
    """Vérifie si le mode dev est activé."""
    return os.getenv("DEV_MODE", "").lower() == "true"


@dev_auth_bp.before_request
def check_dev_mode():
    """Vérifie que DEV_MODE est activé avant de traiter les requêtes."""
    if not is_dev_mode():
        return jsonify({
            "error": "DEV_MODE is not enabled",
            "message": "Set DEV_MODE=true in backend/.env to use dev endpoints"
        }), 403


@dev_auth_bp.route("/tokens", methods=["GET"])
def list_dev_tokens():
    """
    Liste tous les tokens dev disponibles avec les URLs correspondantes.

    Response:
        {
            "message": "Dev tokens available",
            "tokens": [
                {
                    "role": "visiteur",
                    "url": "http://localhost:3000/dev/visiteur",
                    "description": "Utilisateur non authentifié"
                },
                ...
            ]
        }
    """
    tokens = [
        {
            "role": "visiteur",
            "url": "http://localhost:3000/dev/visiteur",
            "description": "Utilisateur non authentifié - peut voir les annonces publiques",
            "backend_header": "X-Dev-Role: visiteur"
        },
        {
            "role": "user",
            "url": "http://localhost:3000/dev/user",
            "description": "Utilisateur standard - peut créer annonces et acheter",
            "backend_header": "X-Dev-Role: user"
        },
        {
            "role": "admin",
            "url": "http://localhost:3000/dev/admin",
            "description": "Administrateur - accès complet au système",
            "backend_header": "X-Dev-Role: admin"
        },
        {
            "role": "notaire",
            "url": "http://localhost:3000/dev/notaire",
            "description": "Notaire - gestion des transactions et documents légaux",
            "backend_header": "X-Dev-Role: notaire"
        }
    ]

    return jsonify({
        "message": "Dev tokens available",
        "frontend_urls": [t["url"] for t in tokens],
        "tokens": tokens
    }), 200


@dev_auth_bp.route("/<role>", methods=["GET"])
def get_dev_token(role: str):
    """
    Retourne un token de développement pour un rôle spécifié.

    Le frontend utilisera ce token pour les requêtes API en envoyant le header:
    X-Dev-Role: {role}

    Args:
        role: Un des rôles : visiteur, user, admin, notaire

    Response:
        {
            "message": "Dev token generated",
            "role": "admin",
            "header": "X-Dev-Role: admin",
            "instructions": "Add this header to your API requests"
        }
    """
    valid_roles = ["visiteur", "user", "admin", "notaire"]

    role_lower = role.lower()

    if role_lower not in valid_roles:
        return jsonify({
            "error": "Invalid role",
            "valid_roles": valid_roles,
            "message": f"Role '{role}' is not valid. Use one of: {', '.join(valid_roles)}"
        }), 400

    return jsonify({
        "message": "Dev mode activated",
        "role": role_lower,
        "header": f"X-Dev-Role: {role_lower}",
        "instructions": "This header will be automatically added to all API requests",
        "frontend_url": f"http://localhost:3000/dev/{role_lower}",
        "available_roles": valid_roles
    }), 200


@dev_auth_bp.route("/status", methods=["GET"])
def dev_status():
    """
    Retourne le statut du mode développement.

    Response:
        {
            "dev_mode_enabled": true,
            "message": "Dev mode is ACTIVE - auth is bypassed"
        }
    """
    return jsonify({
        "dev_mode_enabled": is_dev_mode(),
        "message": "Dev mode is ACTIVE - all authentication checks are bypassed",
        "warning": "⚠️  This is for development only! Never enable in production!"
    }), 200
