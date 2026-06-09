"""
Module d'enregistrement (registration).

Endpoints :
- POST /api/v1/auth/register : Créer un nouvel utilisateur (étape 1 : profil de base).
- POST /api/v1/auth/update-buyer-profile : Compléter le profil acheteur (étape 2).
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import re
from sqlalchemy.exc import IntegrityError

from .models import User, db, RoleEnum
from .utils import (
    generate_access_token,
    generate_email_verification_token,
)
from .decorators import token_required

register_bp = Blueprint("register", __name__, url_prefix="/auth")


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


@register_bp.route("/register", methods=["POST"])
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

        # Créer l'utilisateur (par défaut role=UTILISATEUR, is_profil_acheteur_complet=False)
        # Un utilisateur peut naturellement vendre ET acheter
        # is_profil_acheteur_complet sera mis à True une fois qu'il complète l'étape 2
        user = User(
            email=email,
            nom=nom,
            prenom=prenom,
            role=RoleEnum.UTILISATEUR,  # Tous les utilisateurs ont le rôle UTILISATEUR par défaut
            telephone=telephone,
            adresse_contact=adresse_contact,
            is_profil_acheteur_complet=False  # Étape 2 non complétée
        )
        user.set_password(password)

        # Générer le token de vérification d'email
        from src.services.email_service import EmailService

        verification_token = generate_email_verification_token(user.utilisateur_id, email)
        user.verification_token = verification_token
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)

        db.session.add(user)
        db.session.commit()

        # === TUNNEL DE CRÉATION D'ANNONCE ===
        # Si l'utilisateur vient du tunnel de création d'annonce, lier le brouillon
        annonce_id = data.get("annonce_id")
        temp_photo_urls = data.get("temp_photo_urls", [])

        if annonce_id:
            from src.models.annonces import Annonce
            from src.models.photos import Photo
            import os
            import shutil

            annonce = Annonce.query.get(annonce_id)
            if annonce:
                # Lier l'annonce au nouvel utilisateur
                annonce.utilisateur_id = user.utilisateur_id
                db.session.commit()

                # Déplacer les photos temporaires vers le dossier définitif
                TEMP_FOLDER = "backend/static/uploads/temp"
                ANNONCES_FOLDER = "backend/static/uploads/annonces"
                os.makedirs(ANNONCES_FOLDER, exist_ok=True)

                for temp_url in temp_photo_urls:
                    temp_path = os.path.join("backend/static", temp_url.lstrip("/"))

                    if os.path.exists(temp_path):
                        # Générer un nouveau nom
                        filename = os.path.basename(temp_path)
                        new_filename = f"annonce_{annonce_id}_{filename}"
                        new_path = os.path.join(ANNONCES_FOLDER, new_filename)

                        try:
                            shutil.move(temp_path, new_path)

                            # Créer l'entrée Photo en BD
                            photo = Photo(
                                annonce_id=annonce_id,
                                url=f"/static/uploads/annonces/{new_filename}",
                                nom_fichier=new_filename,
                                ordre=len(annonce.photos_list)  # Ajouter à la suite
                            )
                            db.session.add(photo)
                        except IOError as e:
                            current_app.logger.error(f"Erreur déplacement photo (fichier introuvable): {e}", exc_info=True)
                        except Exception as e:
                            current_app.logger.error(f"Erreur déplacement photo: {e}", exc_info=True)

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
        except ValueError as e:
            current_app.logger.error(f"⚠️ Erreur envoi email vérification (email invalide): {str(e)}", exc_info=True)
        except Exception as e:
            current_app.logger.error(f"⚠️ Erreur envoi email vérification: {str(e)}", exc_info=True)
            # Ne pas bloquer l'inscription si l'email échoue

        return (
            jsonify(
                {
                    "message": "User created successfully. Please verify your email.",
                    "user_id": user.utilisateur_id,
                    "email": user.email,
                    "email_verified": user.email_verified,
                    "access_token": generate_access_token(user),  # Token JWT pour authentification immédiate
                    "annonce_id": annonce_id or None,  # Si tunnel d'annonce
                }
            ),
            201,
        )

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already exists"}), 400
    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f"Register error (validation): {str(e)}", exc_info=True)
        return jsonify({"error": "Validation error"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Register error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@register_bp.route("/update-buyer-profile", methods=["POST"])
@token_required
def update_buyer_profile(current_user):
    """
    Complète le profil acheteur (ÉTAPE 2 de l'inscription).

    Cette route permet à un utilisateur d'ajouter ses critères de recherche immobilière.
    Elle doit être appelée APRÈS l'inscription (étape 1).

    Request JSON:
        {
            "type_bien_recherche": "appartement",  # "appartement", "maison", "terrain"
            "nombre_pieces_min": 2,
            "nb_pieces_max": 5,  (optionnel)
            "surface_min": 50,
            "surface_max": 200,  (optionnel)
            "budget_max": 300000,
            "ville_recherchee": "Paris",
            "dpe_ideale": "C"  (optionnel)
        }

    Response:
        200 OK : {
            "message": "Buyer profile updated successfully",
            "user_id": 123,
            "is_profil_acheteur_complet": True
        }

        400 Bad Request : {
            "error": "Invalid input"
        }

        401 Unauthorized : {
            "error": "No JWT token"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        # Récupérer l'utilisateur actuel (passé par @token_required)
        user = User.query.get(current_user.get("user_id"))
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Mettre à jour les critères acheteur
        if "type_bien_recherche" in data:
            user.type_bien_recherche = data.get("type_bien_recherche")

        if "nombre_pieces_min" in data:
            user.nombre_pieces_min = data.get("nombre_pieces_min")

        if "surface_min" in data:
            user.surface_min = data.get("surface_min")

        if "surface_max" in data:
            # Champ optionnel, peut être ignoré
            pass  # Pas de surface_max dans le modèle User actuel

        if "budget_max" in data:
            user.budget_max = data.get("budget_max")

        if "ville_recherchee" in data:
            user.ville_recherchee = data.get("ville_recherchee")

        if "dpe_ideale" in data:
            user.dpe_ideale = data.get("dpe_ideale")

        # Marquer le profil acheteur comme complet
        user.is_profil_acheteur_complet = True

        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Buyer profile updated successfully",
                    "user_id": user.utilisateur_id,
                    "is_profil_acheteur_complet": user.is_profil_acheteur_complet,
                }
            ),
            200,
        )

    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f"Update buyer profile error (validation): {str(e)}", exc_info=True)
        return jsonify({"error": "Validation error"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update buyer profile error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
