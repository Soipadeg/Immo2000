"""
Décorateurs pour protéger les routes et gérer les rôles.

Fournit :
- @token_required : Vérifie et extrait le JWT du header Authorization
- @role_required : Vérifie que l'utilisateur a l'un des rôles requis
- @admin_required : Vérifie que l'utilisateur est administrateur
"""

from functools import wraps
from typing import List, Optional
from flask import request, jsonify, current_app
import os

from .models import User
from .utils import verify_token, extract_token_from_header


def is_dev_mode() -> bool:
    """
    Vérifie si le mode développement (bypass auth) est activé.

    Returns:
        bool: True si DEV_MODE=true, False sinon
    """
    return os.getenv("DEV_MODE", "").lower() == "true"


def token_required(f):
    """
    Décorateur qui exige un token JWT valide dans le header Authorization.

    Valide :
    - Présence du header Authorization au format "Bearer <token>"
    - Validité et non-expiration du JWT
    - Extraction du payload (user_id, email, role)

    Si invalide, retourne 401 Unauthorized.

    En mode DEV_MODE=true, le token peut être contourné si un header 'X-Dev-Role' est présent.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        # Mode développement : permettre le bypass avec X-Dev-Role header
        if is_dev_mode():
            dev_role = request.headers.get('X-Dev-Role')
            if dev_role:
                current_user = {
                    "user_id": 999,  # Mock user ID
                    "email": f"dev-{dev_role}@immo2000.dev",
                    "role": dev_role,
                    "nom": "Dev",
                    "prenom": dev_role.capitalize(),
                    "exp": None,
                }
                return f(current_user, *args, **kwargs)

        # Récupérer le header Authorization
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401

        # Extraire le token du format "Bearer <token>"
        token = extract_token_from_header(auth_header)

        if not token:
            return jsonify({"error": "Invalid Authorization header format. Use 'Bearer <token>'"}), 401

        # Vérifier et décoder le token
        payload = verify_token(token)

        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Récupérer l'utilisateur depuis la base de données
        try:
            user = User.query.filter_by(utilisateur_id=payload['user_id']).first()
            if not user:
                return jsonify({"error": "User not found"}), 401

            current_user = {
                "user_id": user.utilisateur_id,
                "email": user.email,
                "role": user.role,
                "nom": user.nom,
                "prenom": user.prenom,
                "exp": payload['exp'],
            }
        except Exception as e:
            current_app.logger.error(f"Error retrieving user: {str(e)}")
            return jsonify({"error": "Authentication error"}), 401

        # Passer au route handler
        return f(current_user, *args, **kwargs)

    return decorated


def role_required(roles: List[str]):
    """
    Décorateur qui vérifie que l'utilisateur a l'un des rôles requis.

    À utiliser après @token_required qui aura défini current_user.

    Args:
        roles (List[str]): Liste des rôles autorisés (ex: ['admin', 'notaire'])

    Exemple:
        @admin_bp.route("/users")
        @token_required
        @role_required(['admin'])
        def list_users(current_user):
            ...
    """

    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user['role'] not in roles:
                return jsonify({
                    "error": f"Insufficient permissions. Required roles: {roles}",
                    "user_role": current_user['role']
                }), 403

            return f(current_user, *args, **kwargs)

        return decorated

    return decorator


def admin_required(f):
    """
    Décorateur qui vérifie que l'utilisateur est administrateur.

    À utiliser après @token_required qui aura défini current_user.

    Exemple:
        @admin_bp.route("/dashboard")
        @token_required
        @admin_required
        def admin_dashboard(current_user):
            ...
    """

    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({
                "error": "This action requires admin privileges",
                "user_role": current_user['role']
            }), 403

        return f(current_user, *args, **kwargs)

    return decorated


__all__ = ["token_required", "role_required", "admin_required"]
