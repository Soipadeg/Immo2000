"""
Routes d'authentification pour Immo2000.

Endpoints :
- POST /auth/register : Créer un nouvel utilisateur.
- POST /auth/login : Se connecter et recevoir un JWT.
- POST /auth/refresh : Rafraîchir l'access_token avec un refresh_token.
- GET /auth/me : Récupérer les infos de l'utilisateur connecté.
- POST /auth/logout : Invalider le token (optionnel, nécessite Redis).
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import re
from sqlalchemy.exc import IntegrityError

from .models import User, db
from .utils import (
    generate_access_token,
    generate_refresh_token,
    verify_token,
    verify_password,
    extract_token_from_header,
)
from .decorators import token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def validate_email(email: str) -> bool:
    """
    Valide le format d'un email.

    Args:
        email (str): Email à valider.

    Returns:
        bool: True si l'email est valide, False sinon.
    """
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$"
    return re.match(pattern, email) is not None


def validate_password(password: str) -> tuple[bool, str]:
    """
    Valide le mot de passe selon les critères de sécurité.

    Critères :
    - Longueur minimum 8 caractères.
    - Contient au moins une majuscule.
    - Contient au moins une minuscule.
    - Contient au moins un chiffre.
    - Contient au moins un caractère spécial.

    Args:
        password (str): Mot de passe à valider.

    Returns:
        tuple[bool, str]: (valide, message d'erreur si invalide)

    Example:
        >>> validate_password("MonMDP123!")
        (True, "")

        >>> validate_password("weak")
        (False, "Password must be at least 8 characters")
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit"

    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};:'\",.<>?/\\|`~]", password):
        return False, "Password must contain at least one special character"

    return True, ""


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Crée un nouvel utilisateur.

    Request JSON:
        {
            "email": "user@example.com",
            "mot_de_passe": "MonMDP123!",
            "nom": "Dupont",
            "prenom": "Jean",
            "telephone": "+33612345678" (optionnel),
            "adresse_contact": "123 Rue de Paris" (optionnel)
        }

    Validation:
        - email : Format valide et unique en base.
        - mot_de_passe : Min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial.
        - nom, prenom : Non vides.

    Response:
        201 Created : {
            "message": "User created successfully",
            "user_id": 123,
            "email": "user@example.com"
        }

        400 Bad Request : {
            "error": "Email already exists" | "Invalid password" | ...
        }

    Examples:
        >>> curl -X POST http://localhost:5000/auth/register \\
        ...   -H "Content-Type: application/json" \\
        ...   -d '{
        ...     "email": "user@example.com",
        ...     "mot_de_passe": "MonMDP123!",
        ...     "nom": "Dupont",
        ...     "prenom": "Jean"
        ...   }'
        {
            "message": "User created successfully",
            "user_id": 1,
            "email": "user@example.com"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        # Validation des champs requis
        email = data.get("email", "").strip()
        # Accept both "password" and "mot_de_passe" for compatibility
        password = data.get("password", "") or data.get("mot_de_passe", "")
        nom = data.get("nom", "").strip()
        prenom = data.get("prenom", "").strip()
        telephone = data.get("telephone", "").strip() or None
        adresse_contact = data.get("adresse_contact", "").strip() or None

        # Validation email
        if not email:
            return jsonify({"error": "Email is required"}), 400

        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        # Vérifier que l'email n'existe pas déjà
        if User.find_by_email(email):
            return jsonify({"error": "Email already exists"}), 400

        # Validation mot de passe
        if not password:
            return jsonify({"error": "Password is required"}), 400

        password_valid, password_error = validate_password(password)
        if not password_valid:
            return jsonify({"error": password_error}), 400

        # Validation nom/prenom
        if not nom or len(nom) == 0:
            return jsonify({"error": "nom is required"}), 400

        if not prenom or len(prenom) == 0:
            return jsonify({"error": "prenom is required"}), 400

        # Créer l'utilisateur (par défaut role='user')
        # Un utilisateur peut naturellement vendre ET acheter
        user = User(
            email=email,
            nom=nom,
            prenom=prenom,
            role="user",  # Tous les utilisateurs ont le rôle 'user' par défaut
            telephone=telephone,
            adresse_contact=adresse_contact
        )
        user.set_password(password)

        # Générer le token de vérification d'email
        from .utils import generate_email_verification_token
        from src.services.email_service import EmailService
        from datetime import timedelta

        verification_token = generate_email_verification_token(user.utilisateur_id, email)
        user.verification_token = verification_token
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)

        db.session.add(user)
        db.session.commit()

        # Envoyer l'email de vérification
        try:
            verification_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"
            email_html = EmailService.generer_email_verification(prenom, verification_url)
            EmailService.envoyer_email(
                destinataire=email,
                sujet="Vérifiez votre adresse email - Immo2000",
                corps_html=email_html
            )
            current_app.logger.info(f"✅ Email de vérification envoyé à {email}")
        except Exception as e:
            current_app.logger.error(f"⚠️ Erreur envoi email vérification: {str(e)}")
            # Ne pas bloquer l'inscription si l'email échoue

        return (
            jsonify(
                {
                    "message": "User created successfully. Please verify your email.",
                    "user_id": user.utilisateur_id,
                    "email": user.email,
                    "email_verified": user.email_verified,
                }
            ),
            201,
        )

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already exists"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Register error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/login", methods=["POST"])
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
        password = data.get("mot_de_passe", "")

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


@auth_bp.route("/verify-email", methods=["POST"])
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
        from .utils import verify_email_token
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


@auth_bp.route("/refresh", methods=["POST"])
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


@auth_bp.route("/me", methods=["GET"])
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


@auth_bp.route("/forgot-password", methods=["POST"])
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
        import secrets
        reset_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        # Générer un token pour valider le code
        from .utils import generate_reset_token
        reset_token = generate_reset_token(user.utilisateur_id, email, reset_code)

        # Stocker le code et l'expiration en base
        from datetime import timedelta
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
        except Exception as e:
            current_app.logger.error(f"⚠️ Erreur envoi email réinitialisation: {str(e)}")

        return (
            jsonify(
                {
                    "message": "If an account exists with this email, a password reset link has been sent"
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Forgot password error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/verify-reset-code", methods=["POST"])
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
        from .utils import generate_reset_token
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

    except Exception as e:
        current_app.logger.error(f"Verify reset code error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/reset-password", methods=["POST"])
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
        from .utils import verify_reset_token
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

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Reset password error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/resend-verification", methods=["POST"])
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
        from datetime import timedelta
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
        except Exception as e:
            current_app.logger.error(f"⚠️ Erreur envoi email: {str(e)}")

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
        current_app.logger.error(f"Resend verification error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/verify-2fa", methods=["POST"])
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


@auth_bp.route("/resend-2fa", methods=["POST"])
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
        import secrets
        two_fa_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        # Stocker le code et l'expiration
        from datetime import timedelta
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


@auth_bp.route("/validate-captcha", methods=["POST"])
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
        import requests
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
