"""
Module de connexion (login).

Endpoints :
- POST /api/v1/auth/login : Se connecter et recevoir un JWT.
- POST /api/v1/auth/verify-email : Vérifier l'email de l'utilisateur.
- POST /api/v1/auth/verify-2fa : Vérifier le code 2FA.
- POST /api/v1/auth/resend-2fa : Renvoyer le code 2FA par email.
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import secrets

from .models import User, db
from .utils import (
    generate_access_token,
    generate_refresh_token,
    verify_email_token,
)
from .decorators import token_required

login_bp = Blueprint("login", __name__, url_prefix="/auth")


@login_bp.route("/login", methods=["POST"])
def login():
    """
    Authentifie un utilisateur et retourne un JWT access_token + refresh_token.

    Request JSON:
        {
            "email": "user@example.com",
            "mot_de_passe": "MonMDP123!"
        }

    Response:
        200 OK : {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "Bearer",
            "expires_in": 86400
        }

        400 Bad Request : {
            "error": "Email or password is required"
        }

        401 Unauthorized : {
            "error": "Invalid email or password"
        }

        403 Forbidden : {
            "error": "User account is deactivated"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/login \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{
        ...     "email": "user@example.com",
        ...     "mot_de_passe": "MonMDP123!"
        ...   }'
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "Bearer",
            "expires_in": 86400
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        email = data.get("email", "").strip()
        # Accept both "password" and "mot_de_passe" for compatibility
        password = data.get("password", "") or data.get("mot_de_passe", "")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Chercher l'utilisateur par email
        user = User.find_by_email(email)

        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401

        if not user.actif:
            return jsonify({"error": "User account is deactivated"}), 403

        # Mettre à jour la date de dernière connexion
        user.date_derniere_connexion = datetime.utcnow()
        db.session.commit()

        # Générer les tokens
        access_token = generate_access_token(user.utilisateur_id, user.email, user.role)
        refresh_token = generate_refresh_token(user.utilisateur_id)

        access_expires_in = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES_IN", 86400)

        return (
            jsonify(
                {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "Bearer",
                    "expires_in": access_expires_in,
                    "email_verified": user.email_verified,
                }
            ),
            200,
        )

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@login_bp.route("/verify-email", methods=["POST"])
def verify_email():
    """
    Vérifie l'adresse email de l'utilisateur via token (RGPD compliance).

    Request JSON:
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }

    Response:
        200 OK : {
            "message": "Email verified successfully",
            "email": "user@example.com"
        }

        400 Bad Request : {
            "error": "Invalid or expired verification token"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/verify-email \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{
        ...     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ...   }'
        {
            "message": "Email verified successfully",
            "email": "user@example.com"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        # Accepter "token" ou "verificationToken" pour compatibilité
        token = data.get("token") or data.get("verificationToken")
        token = token.strip() if token else ""

        if not token:
            return jsonify({"error": "Verification token is required"}), 400

        # Vérifier le token
        payload = verify_email_token(token)

        if not payload:
            return jsonify({"error": "Invalid or expired verification token"}), 400

        # Récupérer l'utilisateur
        user = User.find_by_id(payload.get("user_id"))

        if not user or user.email != payload.get("email"):
            return jsonify({"error": "Invalid token"}), 400

        # Marquer l'email comme vérifié
        user.email_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        db.session.commit()

        current_app.logger.info(f"✅ Email vérifié pour {user.email}")

        return (
            jsonify(
                {
                    "message": "Email verified successfully",
                    "email": user.email,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Email verification error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@login_bp.route("/verify-2fa", methods=["POST"])
def verify_2fa():
    """
    Vérifie le code 2FA.

    Request JSON:
        {
            "userId": 123,
            "code": "123456"
        }

    Response:
        200 OK : {
            "message": "2FA verified successfully",
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "Bearer",
            "expires_in": 86400
        }

        400 Bad Request : {
            "error": "Code invalid or expired"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/verify-2fa \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{"userId": 123, "code": "123456"}'
        {
            "message": "2FA verified successfully",
            "access_token": "...",
            ...
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        user_id = data.get("userId")
        code = data.get("code", "").strip()

        if not user_id or not code:
            return jsonify({"error": "userId and code are required"}), 400

        # Chercher l'utilisateur
        user = User.find_by_id(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 400

        # Vérifier le code 2FA
        if user.two_fa_code != code:
            return jsonify({"error": "Code invalid"}), 400

        # Vérifier l'expiration
        if not user.two_fa_code_expires or user.two_fa_code_expires < datetime.utcnow():
            user.two_fa_code = None
            user.two_fa_code_expires = None
            db.session.commit()
            return jsonify({"error": "Code invalid or expired"}), 400

        # Générer les tokens
        user.two_fa_code = None
        user.two_fa_code_expires = None
        db.session.commit()

        access_token = generate_access_token(user.utilisateur_id, user.email, user.role)
        refresh_token = generate_refresh_token(user.utilisateur_id)
        access_expires_in = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES_IN", 86400)

        return (
            jsonify(
                {
                    "message": "2FA verified successfully",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "Bearer",
                    "expires_in": access_expires_in,
                    "user_id": user.utilisateur_id,
                    "email": user.email,
                    "role": user.role,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Verify 2FA error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@login_bp.route("/resend-2fa", methods=["POST"])
def resend_2fa_code():
    """
    Renvoie le code 2FA par email.

    Request JSON:
        {
            "userId": 123
        }

    Response:
        200 OK : {
            "message": "2FA code sent to your email"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/resend-2fa \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{"userId": 123}'
        {
            "message": "2FA code sent to your email"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        user_id = data.get("userId")

        if not user_id:
            return jsonify({"error": "userId is required"}), 400

        user = User.find_by_id(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 400

        # Générer un nouveau code 2FA (6 chiffres)
        two_fa_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        # Stocker le code et l'expiration
        user.two_fa_code = two_fa_code
        user.two_fa_code_expires = datetime.utcnow() + timedelta(minutes=5)
        db.session.commit()

        # Envoyer l'email
        try:
            from src.services.email_service import EmailService
            email_html = EmailService.generer_email_2fa(user.prenom, two_fa_code)
            EmailService.envoyer_email(
                destinataire=user.email,
                sujet="Votre code de sécurité - Immo2000",
                corps_html=email_html
            )
            current_app.logger.info(f"✅ Code 2FA envoyé à {user.email}")
        except Exception as e:
            current_app.logger.error(f"⚠️ Erreur envoi code 2FA: {str(e)}")

        return (
            jsonify(
                {
                    "message": "2FA code sent to your email"
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Resend 2FA error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
