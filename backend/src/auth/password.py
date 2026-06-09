"""
Module de gestion des mots de passe (password reset).

Endpoints :
- POST /api/v1/auth/forgot-password : Demander une réinitialisation de mot de passe.
- POST /api/v1/auth/verify-reset-code : Vérifier le code de réinitialisation.
- POST /api/v1/auth/reset-password : Réinitialiser le mot de passe.
- POST /api/v1/auth/resend-verification : Renvoyer l'email de vérification.
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import secrets

from .models import User, db
from .utils import (
    generate_reset_token,
    verify_reset_token,
)
from .register import validate_password

password_bp = Blueprint("password", __name__, url_prefix="/auth")


@password_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Demande une réinitialisation de mot de passe.
    Envoie un code de réinitialisation par email.

    Request JSON:
        {
            "email": "user@example.com"
        }

    Response:
        200 OK : {
            "message": "Password reset code sent to your email"
        }

        400 Bad Request : {
            "error": "Email is required"
        }

        404 Not Found : {
            "error": "User not found"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/forgot-password \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{"email": "user@example.com"}'
        {
            "message": "Password reset code sent to your email"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        email = data.get("email", "").strip()

        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Chercher l'utilisateur
        user = User.find_by_email(email)

        if not user:
            # Pour la sécurité, on retourne toujours 200 même si l'email n'existe pas
            return (
                jsonify(
                    {
                        "message": "If an account exists with this email, a password reset link has been sent"
                    }
                ),
                200,
            )

        # Générer un code de réinitialisation (6 chiffres)
        reset_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        # Générer un token pour valider le code
        reset_token = generate_reset_token(user.utilisateur_id, email, reset_code)

        # Stocker le code et l'expiration en base
        user.reset_token = reset_code
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()

        # Envoyer l'email
        try:
            from src.services.email_service import EmailService
            email_html = EmailService.generer_email_reset_password(user.prenom, reset_code)
            EmailService.envoyer_email(
                destinataire=email,
                sujet="Réinitialiser votre mot de passe - Immo2000",
                corps_html=email_html
            )
            current_app.logger.info(f"✅ Email de réinitialisation envoyé à {email}")
        except ValueError as e:
            current_app.logger.error(f"⚠️ Erreur envoi email réinitialisation (email invalide): {str(e)}", exc_info=True)
        except Exception as e:
            current_app.logger.error(f"⚠️ Erreur envoi email réinitialisation: {str(e)}", exc_info=True)

        return (
            jsonify(
                {
                    "message": "If an account exists with this email, a password reset link has been sent"
                }
            ),
            200,
        )

    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f"Forgot password error (validation): {str(e)}", exc_info=True)
        return jsonify({"error": "Validation error"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Forgot password error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@password_bp.route("/verify-reset-code", methods=["POST"])
def verify_reset_code():
    """
    Vérifie le code de réinitialisation envoyé par email.

    Request JSON:
        {
            "email": "user@example.com",
            "resetCode": "123456"
        }

    Response:
        200 OK : {
            "message": "Code verified",
            "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }

        400 Bad Request : {
            "error": "Code invalid or expired"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/verify-reset-code \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{"email": "user@example.com", "resetCode": "123456"}'
        {
            "message": "Code verified",
            "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        email = data.get("email", "").strip()
        reset_code = data.get("resetCode", "").strip()

        if not email or not reset_code:
            return jsonify({"error": "Email and resetCode are required"}), 400

        # Chercher l'utilisateur
        user = User.find_by_email(email)

        if not user:
            return jsonify({"error": "Invalid email or code"}), 400

        # Vérifier le code
        if user.reset_token != reset_code:
            return jsonify({"error": "Code invalid or expired"}), 400

        # Vérifier l'expiration
        if not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
            user.reset_token = None
            user.reset_token_expires = None
            db.session.commit()
            return jsonify({"error": "Code invalid or expired"}), 400

        # Générer un token de réinitialisation
        reset_token = generate_reset_token(user.utilisateur_id, email, reset_code)

        return (
            jsonify(
                {
                    "message": "Code verified",
                    "resetToken": reset_token,
                }
            ),
            200,
        )

    except ValueError as e:
        current_app.logger.error(f"Verify reset code error (code invalide): {str(e)}", exc_info=True)
        return jsonify({"error": "Invalid code"}), 400
    except Exception as e:
        current_app.logger.error(f"Verify reset code error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@password_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Réinitialise le mot de passe avec un token valide.

    Request JSON:
        {
            "email": "user@example.com",
            "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "newPassword": "NewMDP123!"
        }

    Response:
        200 OK : {
            "message": "Password reset successfully"
        }

        400 Bad Request : {
            "error": "Invalid password" | "Invalid token"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/reset-password \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{"email": "user@example.com", "resetToken": "...", "newPassword": "NewMDP123!"}'
        {
            "message": "Password reset successfully"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        email = data.get("email", "").strip()
        reset_token = data.get("resetToken", "").strip()
        new_password = data.get("newPassword", "")

        if not email or not reset_token or not new_password:
            return jsonify({"error": "All fields are required"}), 400

        # Vérifier le token de réinitialisation
        payload = verify_reset_token(reset_token)

        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 400

        # Chercher l'utilisateur
        user = User.find_by_email(email)

        if not user or user.utilisateur_id != payload.get("user_id"):
            return jsonify({"error": "Invalid token"}), 400

        # Valider le nouveau mot de passe
        password_valid, password_error = validate_password(new_password)
        if not password_valid:
            return jsonify({"error": password_error}), 400

        # Mettre à jour le mot de passe
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()

        current_app.logger.info(f"✅ Mot de passe réinitialisé pour {email}")

        return (
            jsonify(
                {
                    "message": "Password reset successfully"
                }
            ),
            200,
        )

    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f"Reset password error (validation): {str(e)}", exc_info=True)
        return jsonify({"error": "Validation error"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Reset password error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@password_bp.route("/resend-verification", methods=["POST"])
def resend_verification_email():
    """
    Renvoie l'email de vérification d'email.

    Request JSON:
        {
            "email": "user@example.com"
        }

    Response:
        200 OK : {
            "message": "Verification email sent"
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/resend-verification \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{"email": "user@example.com"}'
        {
            "message": "Verification email sent"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        email = data.get("email", "").strip()

        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = User.find_by_email(email)

        if not user:
            return (
                jsonify(
                    {
                        "message": "If an account exists with this email, a verification link has been sent"
                    }
                ),
                200,
            )

        # Générer un nouveau token de vérification
        from .utils import generate_email_verification_token
        verification_token = generate_email_verification_token(user.utilisateur_id, email)
        user.verification_token = verification_token
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        db.session.commit()

        # Envoyer l'email
        try:
            from src.services.email_service import EmailService
            verification_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"
            email_html = EmailService.generer_email_verification(user.prenom, verification_url)
            EmailService.envoyer_email(
                destinataire=email,
                sujet="Vérifiez votre adresse email - Immo2000",
                corps_html=email_html
            )
        except ValueError as e:
            current_app.logger.error(f"⚠️ Erreur envoi email (adresse invalide): {str(e)}", exc_info=True)
        except Exception as e:
            current_app.logger.error(f"⚠️ Erreur envoi email: {str(e)}", exc_info=True)

    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f"Resend verification error (validation): {str(e)}", exc_info=True)
        return jsonify({"error": "Validation error"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Resend verification error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "message": "If an account exists with this email, a verification link has been sent"
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Resend verification error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
