"""
Décorateurs pour protéger les routes et gérer les rôles.

Fournit :
- @token_required : Vérifie que le requête a un JWT valide
- @role_required : Vérifie que l'utilisateur a l'un des rôles autorisés
"""

from functools import wraps
from typing import List, Optional
from flask import request, jsonify, current_app

from .models import User
from .utils import verify_token, extract_token_from_header


def token_required(f):
    """
    Décorateur pour protéger une route avec JWT.

    Vérifie :
    - Que le header Authorization contient un JWT.
    - Que le JWT est valide (signature, expiration).
    - Que l'utilisateur existe toujours en base (au cas où il aurait été supprimé).

    Passe à la fonction l'objet `current_user` contenant :
    {
        "user_id": 123,
        "email": "user@example.com",
        "role": "vendeur",
        "exp": 1717500000
    }

    Retourne :
    - 401 Unauthorized si pas de token.
    - 401 Unauthorized si token expiré ou invalide.
    - 404 Not Found si l'utilisateur n'existe plus en base.

    Example:
        >>> @app.route("/biens", methods=["GET"])
        ... @token_required
        ... def get_biens(current_user):
        ...     user_id = current_user["user_id"]
        ...     return {"biens": []}
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        # Récupérer le header Authorization
        auth_header = request.headers.get("Authorization")
        token = extract_token_from_header(auth_header)

        if not token:
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        # Vérifier le token
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Vérifier que l'utilisateur existe toujours en base
        user = User.find_by_id(payload["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Vérifier que le compte est actif
        if not user.actif:
            return jsonify({"error": "User account is deactivated"}), 403

        # Passer le payload de l'utilisateur à la fonction
        current_user = {
            "user_id": payload["user_id"],
            "email": payload["email"],
            "role": payload["role"],
            "exp": payload["exp"],
        }

        return f(current_user, *args, **kwargs)

    return decorated


def role_required(roles: List[str]):
    """
    Décorateur pour restreindre l'accès à certains rôles.

    À utiliser **après** @token_required pour que current_user soit disponible.

    Args:
        roles (List[str]): Liste des rôles autorisés.
            Valeurs valides : ["vendeur", "acheteur", "agent"]

    Retourne :
    - 403 Forbidden si l'utilisateur n'a pas le bon rôle.

    Example:
        >>> @app.route("/admin/stats", methods=["GET"])
        ... @token_required
        ... @role_required(roles=["agent"])
        ... def get_stats(current_user):
        ...     return {"stats": {"total_users": 1000}}

        >>> # Ou plusieurs rôles autorisés
        >>> @app.route("/dashboard", methods=["GET"])
        ... @token_required
        ... @role_required(roles=["vendeur", "agent"])
        ... def get_dashboard(current_user):
        ...     return {"dashboard": {...}}
    """

    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user["role"] not in roles:
                return (
                    jsonify(
                        {
                            "error": f"Forbidden. Required roles: {', '.join(roles)}. Got: {current_user['role']}"
                        }
                    ),
                    403,
                )

            return f(current_user, *args, **kwargs)

        return decorated

    return decorator


def admin_required(f):
    """
    Décorateur pour restreindre l'accès aux administrateurs.

    À utiliser **après** @token_required pour que current_user soit disponible.

    Vérifie que l'utilisateur a le rôle "agent" (administrateur).

    Retourne :
    - 403 Forbidden si l'utilisateur n'a pas le rôle "agent".

    Example:
        >>> @app.route("/api/v1/utilisateurs", methods=["GET"])
        ... @token_required
        ... @admin_required
        ... def get_all_users(current_user):
        ...     return {"users": [...]}
    """

    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user["role"] != "agent":
            return (
                jsonify(
                    {
                        "error": f"Forbidden. Admin access required. Got role: {current_user['role']}"
                    }
                ),
                403,
            )

        return f(current_user, *args, **kwargs)

    return decorated


__all__ = ["token_required", "role_required", "admin_required"]
