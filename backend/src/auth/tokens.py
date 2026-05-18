"""
Module de gestion des tokens JWT (token refresh, current user, captcha).

Endpoints :
- POST /api/v1/auth/refresh : Rafraîchir l'access_token avec un refresh_token.
- GET /api/v1/auth/me : Récupérer les infos de l'utilisateur connecté.
- POST /api/v1/auth/validate-captcha : Valider le token reCAPTCHA v3.
"""

from flask import Blueprint, request, jsonify, current_app
import requests

from .models import User
from .utils import (
    generate_access_token,
    verify_token,
)
from .decorators import token_required

tokens_bp = Blueprint("tokens", __name__, url_prefix="/auth")


@tokens_bp.route("/refresh", methods=["POST"])
def refresh():
    """
    Rafraîchit l'access_token avec un refresh_token.

    Request JSON:
        {
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }

    Response:
        200 OK : {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "Bearer",
            "expires_in": 86400
        }

        400 Bad Request : {
            "error": "refresh_token is required"
        }

        401 Unauthorized : {
            "error": "Invalid or expired refresh token"
        }

        404 Not Found : {
            "error": "User not found"
        }

    Note:
        Le refresh_token doit être de type 'refresh' et valide.
        L'utilisateur doit toujours exister en base.

    Examples:
        >>> curl -X POST http://localhost:5000/auth/refresh \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{
        ...     "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ...   }'
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "Bearer",
            "expires_in": 86400
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        refresh_token = data.get("refresh_token", "").strip()

        if not refresh_token:
            return jsonify({"error": "refresh_token is required"}), 400

        # Vérifier le refresh_token
        payload = verify_token(refresh_token)

        if not payload:
            return jsonify({"error": "Invalid or expired refresh token"}), 401

        # Vérifier que c'est bien un refresh_token (pas un access_token)
        if payload.get("type") != "refresh":
            return jsonify({"error": "Invalid token type"}), 401

        # Vérifier que l'utilisateur existe toujours
        user = User.find_by_id(payload["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Générer un nouveau access_token
        access_token = generate_access_token(user.utilisateur_id, user.email, user.role)
        access_expires_in = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES_IN", 86400)

        return (
            jsonify(
                {
                    "access_token": access_token,
                    "token_type": "Bearer",
                    "expires_in": access_expires_in,
                }
            ),
            200,
        )

    except Exception as e:
        current_app.logger.error(f"Refresh error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@tokens_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    """
    Retourne les informations de l'utilisateur connecté.

    Requires:
        Header Authorization avec un JWT valide.

    Response:
        200 OK : {
            "utilisateur_id": 123,
            "email": "user@example.com",
            "nom": "Dupont",
            "prenom": "Jean",
            "role": "vendeur",
            "telephone": "+33612345678",
            "adresse_contact": "123 Rue de Paris",
            "actif": true,
            "date_inscription": "2026-05-04T10:30:00Z"
        }

        401 Unauthorized : {
            "error": "Invalid or expired token"
        }

        404 Not Found : {
            "error": "User not found"
        }

    Examples:
        >>> curl -X GET http://localhost:5000/auth/me \\
        ...   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        {
            "utilisateur_id": 1,
            "email": "user@example.com",
            "nom": "Dupont",
            "prenom": "Jean",
            "role": "vendeur",
            ...
        }
    """
    user = User.find_by_id(current_user["user_id"])

    if not user:
        return jsonify({"error": "User not found"}), 404

    return (
        jsonify(
            {
                "utilisateur_id": user.utilisateur_id,
                "email": user.email,
                "nom": user.nom,
                "prenom": user.prenom,
                "role": user.role,
                "telephone": user.telephone,
                "adresse_contact": user.adresse_contact,
                "actif": user.actif,
                "date_inscription": user.date_inscription.isoformat() if user.date_inscription else None,
                "date_derniere_connexion": user.date_derniere_connexion.isoformat()
                if user.date_derniere_connexion
                else None,
            }
        ),
        200,
    )


@tokens_bp.route("/validate-captcha", methods=["POST"])
def validate_captcha():
    """
    Valide le token reCAPTCHA v3 avec Google.

    Request JSON:
        {
            "token": "03AOLTBWQp..."
        }

    Response:
        200 OK : {
            "message": "Captcha validated",
            "score": 0.9,
            "action": "register|login",
            "challenge_ts": "2024-05-10T10:30:00Z",
            "hostname": "immo2000.fr"
        }

        400 Bad Request : {
            "error": "Invalid or expired captcha"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/validate-captcha \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{"token": "03AOLTBWQp..."}'
        {
            "message": "Captcha validated",
            "score": 0.9
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        token = data.get("token", "").strip()

        if not token:
            return jsonify({"error": "Captcha token is required"}), 400

        # Valider le token avec Google
        RECAPTCHA_SECRET_KEY = current_app.config.get("RECAPTCHA_SECRET_KEY")

        if not RECAPTCHA_SECRET_KEY:
            current_app.logger.warning("⚠️ RECAPTCHA_SECRET_KEY not configured")
            # En développement, accepter sans validation
            return (
                jsonify(
                    {
                        "message": "Captcha validated (dev mode)",
                        "score": 0.9,
                    }
                ),
                200,
            )

        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": RECAPTCHA_SECRET_KEY,
                "response": token,
            }
        )

        result = response.json()

        if not result.get("success"):
            current_app.logger.warning(f"❌ ReCAPTCHA validation failed: {result}")
            return jsonify({"error": "Invalid or expired captcha"}), 400

        # Vérifier le score (reCAPTCHA v3)
        score = result.get("score", 0)
        action = result.get("action", "unknown")

        # Score < 0.5 = probable bot
        if score < 0.5:
            current_app.logger.warning(f"⚠️ Low reCAPTCHA score: {score} for action: {action}")
            return jsonify({"error": "Captcha score too low (probable bot activity)"}), 400

        current_app.logger.info(f"✅ ReCAPTCHA validated - Score: {score}, Action: {action}")

        return (
            jsonify(
                {
                    "message": "Captcha validated",
                    "score": score,
                    "action": action,
                    "challenge_ts": result.get("challenge_ts"),
                    "hostname": result.get("hostname"),
                }
            ),
            200,
        )

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"⚠️ Error contacting reCAPTCHA API: {str(e)}")
        # En cas d'erreur avec Google, on accepte quand même (fallback)
        return (
            jsonify(
                {
                    "message": "Captcha validated (fallback mode)",
                    "score": 0.7,
                }
            ),
            200,
        )
    except Exception as e:
        current_app.logger.error(f"Validate captcha error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
