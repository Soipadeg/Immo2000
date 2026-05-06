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
            "role": "vendeur" | "acheteur" | "agent",
            "telephone": "+33612345678" (optionnel),
            "adresse_contact": "123 Rue de Paris" (optionnel)
        }

    Validation:
        - email : Format valide et unique en base.
        - mot_de_passe : Min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial.
        - nom, prenom : Non vides.
        - role : Doit être 'vendeur', 'acheteur' ou 'agent'.

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
        ...     "prenom": "Jean",
        ...     "role": "vendeur"
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
        password = data.get("mot_de_passe", "")
        nom = data.get("nom", "").strip()
        prenom = data.get("prenom", "").strip()
        role = data.get("role", "").strip().lower()
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

        # Validation rôle
        valid_roles = ["vendeur", "acheteur", "agent"]
        if role not in valid_roles:
            return jsonify({"error": f"role must be one of {valid_roles}"}), 400

        # Créer l'utilisateur avec rôles multiples
        user = User(
            email=email,
            nom=nom,
            prenom=prenom,
            role=role,
            telephone=telephone,
            adresse_contact=adresse_contact,
            # Système de rôles multiples
            est_acheteur=True,  # Tous les utilisateurs sont acheteurs par défaut
            est_vendeur=False,  # Option pour devenir vendeur plus tard
            role_actif='acheteur'  # Le rôle actif par défaut
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

        token = data.get("token", "").strip()

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


@auth_bp.route("/profile/roles", methods=["GET"])
@token_required
def get_user_roles(current_user):
    """
    Retourne les rôles disponibles et actifs de l'utilisateur.

    Requires:
        Header Authorization avec un JWT valide.

    Response:
        200 OK : {
            "utilisateur_id": 123,
            "est_acheteur": true,
            "est_vendeur": false,
            "role_actif": "acheteur",
            "roles_disponibles": ["acheteur"],
            "peut_devenir_vendeur": true
        }
    """
    user = User.find_by_id(current_user["user_id"])

    if not user:
        return jsonify({"error": "User not found"}), 404

    roles_disponibles = []
    if user.est_acheteur:
        roles_disponibles.append("acheteur")
    if user.est_vendeur:
        roles_disponibles.append("vendeur")

    return (
        jsonify(
            {
                "utilisateur_id": user.utilisateur_id,
                "est_acheteur": user.est_acheteur,
                "est_vendeur": user.est_vendeur,
                "role_actif": user.role_actif,
                "roles_disponibles": roles_disponibles,
                "peut_devenir_vendeur": not user.est_vendeur,
            }
        ),
        200,
    )


@auth_bp.route("/profile/switch-role", methods=["POST"])
@token_required
def switch_role(current_user):
    """
    Switche le rôle actif de l'utilisateur.

    Requires:
        Header Authorization avec un JWT valide.

    Request JSON:
        {
            "role": "vendeur"  // "acheteur" ou "vendeur"
        }

    Response:
        200 OK : {
            "message": "Role switched successfully",
            "role_actif": "vendeur",
            "access_token": "new_token"
        }

        400 Bad Request : {
            "error": "Invalid role or user cannot switch to this role"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        new_role = data.get("role", "").strip().lower()

        if new_role not in ["acheteur", "vendeur"]:
            return jsonify({"error": "Invalid role. Must be 'acheteur' or 'vendeur'"}), 400

        user = User.find_by_id(current_user["user_id"])

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Vérifier que l'utilisateur peut accéder ce rôle
        if new_role == "acheteur" and not user.est_acheteur:
            return jsonify({"error": "User cannot act as buyer"}), 403

        if new_role == "vendeur" and not user.est_vendeur:
            return jsonify({"error": "User must enable vendor role first"}), 403

        # Switcher le rôle
        if user.switch_role(new_role):
            db.session.commit()
            current_app.logger.info(f"Role switched for user {user.email}: {user.role_actif}")

            # Générer un nouveau token avec le nouveau rôle
            access_token = generate_access_token(user.utilisateur_id, user.email, user.role_actif)

            return (
                jsonify(
                    {
                        "message": "Role switched successfully",
                        "role_actif": user.role_actif,
                        "access_token": access_token,
                        "token_type": "Bearer",
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "Could not switch role"}), 400

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Role switch error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/profile/roles/enable-vendor", methods=["PUT"])
@token_required
def enable_vendor_role(current_user):
    """
    Active le rôle vendeur pour l'utilisateur.

    Requires:
        Header Authorization avec un JWT valide.

    Response:
        200 OK : {
            "message": "Vendor role enabled successfully",
            "est_vendeur": true,
            "roles_disponibles": ["acheteur", "vendeur"]
        }

        400 Bad Request : {
            "error": "User is already a vendor"
        }
    """
    try:
        user = User.find_by_id(current_user["user_id"])

        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.est_vendeur:
            return jsonify({"error": "User is already a vendor"}), 400

        # Activer le rôle vendeur
        user.enable_vendor_role()
        db.session.commit()

        current_app.logger.info(f"Vendor role enabled for user {user.email}")

        roles_disponibles = ["acheteur", "vendeur"] if user.est_acheteur else ["vendeur"]

        return (
            jsonify(
                {
                    "message": "Vendor role enabled successfully",
                    "est_vendeur": user.est_vendeur,
                    "est_acheteur": user.est_acheteur,
                    "role_actif": user.role_actif,
                    "roles_disponibles": roles_disponibles,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Enable vendor role error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500



__all__ = ["auth_bp"]
