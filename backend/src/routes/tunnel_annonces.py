"""
Routes Flask pour le tunnel de création d'annonce.

Endpoints :
- POST   /api/v1/annonces/brouillon          → Créer un brouillon (public, sans JWT)
- PUT    /api/v1/annonces/{id}/completer     → Finaliser une annonce (JWT required)
"""

import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from src.auth.models import db
from src.auth.decorators import token_required
from src.models.annonces import Annonce
from src.models.photos import Photo
from PIL import Image
import io

# Configuration des uploads
TEMP_UPLOAD_FOLDER = "backend/static/uploads/temp"
ANNONCES_UPLOAD_FOLDER = "backend/static/uploads/annonces"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_PHOTOS = 10

os.makedirs(TEMP_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ANNONCES_UPLOAD_FOLDER, exist_ok=True)

# Blueprint
tunnel_bp = Blueprint("tunnel", __name__, url_prefix="/api/v1")


def allowed_file(filename):
    """Vérifie si le fichier a une extension autorisée."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def resize_image(file_obj, max_width=1280, max_height=960):
    """
    Redimensionne une image avec Pillow si elle dépasse les limites.

    Args:
        file_obj: Fichier uploadé
        max_width: Largeur max
        max_height: Hauteur max

    Returns:
        BytesIO avec l'image redimensionnée (ou l'originale si plus petite)
    """
    try:
        img = Image.open(file_obj)

        # Convertir RGBA en RGB si nécessaire
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background

        # Redimensionner si nécessaire
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

        # Sauvegarder en bytes
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=85, optimize=True)
        output.seek(0)

        return output
    except Exception as e:
        print(f"[ERROR] Erreur redimensionnement image: {e}")
        # Retourner le fichier original en cas d'erreur
        file_obj.seek(0)
        return file_obj


@tunnel_bp.route("/annonces/brouillon", methods=["POST"])
def create_brouillon():
    """
    Crée un brouillon d'annonce (accessible sans authentification).

    Accepts:
        - titre (str): Titre de l'annonce [REQUIRED]
        - adresse (str): Adresse complète [REQUIRED]
        - code_postal (str): Code postal [REQUIRED]
        - ville (str): Ville [REQUIRED]
        - masquer_adresse_complete (bool, optional): Masquer l'adresse complète
        - photos (list[File], max 10): Photos de l'annonce (jpg, png, webp, max 10MB each)

    Returns:
        201: {
            "message": "Brouillon créé avec succès",
            "annonce_id": int,
            "temp_photo_urls": [list of temp URLs]
        }
    """
    try:
        # Récupérer les données du formulaire
        titre = request.form.get("titre", "").strip()
        adresse = request.form.get("adresse", "").strip()
        code_postal = request.form.get("code_postal", "").strip()
        ville = request.form.get("ville", "").strip()
        masquer_adresse = request.form.get("masquer_adresse_complete", "false").lower() == "true"

        # Validation
        if not all([titre, adresse, code_postal, ville]):
            return jsonify({
                "error": "Les champs titre, adresse, code_postal et ville sont obligatoires"
            }), 400

        if len(titre) > 100:
            return jsonify({"error": "Le titre ne doit pas dépasser 100 caractères"}), 400

        if len(code_postal) != 5 or not code_postal.isdigit():
            return jsonify({"error": "Code postal invalide (doit être 5 chiffres)"}), 400

        # Créer l'annonce en brouillon
        annonce = Annonce(
            titre=titre,
            adresse=adresse,
            code_postal=code_postal,
            ville=ville,
            type_bien="appartement",  # Valeur par défaut
            nombre_pieces=1,  # Valeur par défaut
            prix=0,  # Sera complété en étape 4
            surface=0,  # Sera complété en étape 4
            description="",  # Sera complété en étape 4
            statut="brouillon",
            masquer_adresse_complete=masquer_adresse,
            utilisateur_id=None  # Sera défini lors de l'inscription
        )
        db.session.add(annonce)
        db.session.commit()

        # Traiter les photos
        temp_photo_urls = []
        files = request.files.getlist("photos")

        if len(files) > MAX_PHOTOS:
            db.session.delete(annonce)
            db.session.commit()
            return jsonify({
                "error": f"Maximum {MAX_PHOTOS} photos autorisées"
            }), 400

        for idx, file in enumerate(files):
            if file and file.filename:
                # Vérifier l'extension
                if not allowed_file(file.filename):
                    db.session.delete(annonce)
                    db.session.commit()
                    return jsonify({
                        "error": f"Format de fichier non autorisé: {file.filename}"
                    }), 400

                # Vérifier la taille
                file.seek(0, 2)  # Aller à la fin
                file_size = file.tell()
                file.seek(0)  # Revenir au début

                if file_size > MAX_FILE_SIZE:
                    db.session.delete(annonce)
                    db.session.commit()
                    return jsonify({
                        "error": f"Fichier trop volumineux: {file.filename} ({file_size / 1024 / 1024:.1f}MB > 10MB)"
                    }), 400

                # Redimensionner l'image
                resized_file = resize_image(file)

                # Générer un nom de fichier unique
                ext = file.filename.rsplit(".", 1)[1].lower()
                filename = secure_filename(f"temp_{uuid.uuid4()}.{ext}")
                filepath = os.path.join(TEMP_UPLOAD_FOLDER, filename)

                # Sauvegarder
                resized_file.save(filepath)
                temp_photo_urls.append(f"/static/uploads/temp/{filename}")

        return jsonify({
            "message": "Brouillon créé avec succès",
            "annonce_id": annonce.annonce_id,
            "temp_photo_urls": temp_photo_urls
        }), 201

    except Exception as e:
        print(f"[ERROR] create_brouillon: {e}")
        return jsonify({"error": str(e)}), 500


@tunnel_bp.route("/annonces/<int:annonce_id>/completer", methods=["PUT"])
@token_required
def completer_annonce(current_user, annonce_id):
    """
    Complète et publie une annonce (étape 4 du tunnel).

    Required JWT: True
    Owner check: True (utilisateur doit être propriétaire)

    Accepts:
        - description (str): Description [REQUIRED]
        - prix (float): Prix en euros [REQUIRED]
        - surface (float): Surface en m² [REQUIRED]
        - nombre_pieces (int): Nombre de pièces [REQUIRED]
        - type_bien (str, optional): Type de bien
        - nombre_chambres (int, optional): Nombre de chambres
        - etage (int, optional): Étage
        - annee_construction (int, optional): Année de construction
        - dpe (str, optional): Classe énergétique (A-G)
        - ascenseur, balcon, terrasse, jardin, piscine, parking (bool, optional)

    Returns:
        200: Annonce mise à jour avec statut "publiée"
    """
    try:
        # Récupérer l'annonce
        annonce = Annonce.query.filter_by(
            annonce_id=annonce_id,
            utilisateur_id=current_user["user_id"]
        ).first()

        if not annonce:
            return jsonify({"error": "Annonce introuvable ou non autorisée"}), 404

        # Récupérer les données
        data = request.get_json()

        # Validation champs obligatoires
        if not data.get("description") or not data.get("prix") or not data.get("surface") or not data.get("nombre_pieces"):
            return jsonify({
                "error": "Les champs description, prix, surface et nombre_pieces sont obligatoires"
            }), 400

        try:
            prix = float(data.get("prix"))
            surface = float(data.get("surface"))
            nombre_pieces = int(data.get("nombre_pieces"))
        except (ValueError, TypeError):
            return jsonify({"error": "Formats invalides pour prix/surface/nombre_pieces"}), 400

        if prix <= 0 or surface <= 0 or nombre_pieces < 1:
            return jsonify({"error": "Prix, surface et nombre de pièces doivent être positifs"}), 400

        # Mettre à jour l'annonce
        annonce.description = data.get("description", annonce.description)
        annonce.prix = prix
        annonce.surface = surface
        annonce.nombre_pieces = nombre_pieces
        annonce.type_bien = data.get("type_bien", annonce.type_bien)
        annonce.etage = data.get("etage") if data.get("etage") is not None else annonce.etage
        annonce.annee_construction = data.get("annee_construction") if data.get("annee_construction") is not None else annonce.annee_construction
        annonce.dpe = data.get("dpe") if data.get("dpe") else annonce.dpe

        # Booléens
        annonce.ascenseur = data.get("ascenseur", annonce.ascenseur)
        annonce.balcon = data.get("balcon", annonce.balcon)
        annonce.terrasse = data.get("terrasse", annonce.terrasse)
        annonce.jardin = data.get("jardin", annonce.jardin)
        annonce.piscine = data.get("piscine", annonce.piscine)
        annonce.parking = data.get("parking", annonce.parking)

        # Publier l'annonce si tous les champs obligatoires sont remplis
        annonce.statut = "publiée"
        annonce.date_modification = datetime.utcnow()

        db.session.commit()

        return jsonify({
            "message": "Annonce complétée et publiée avec succès",
            "annonce": annonce.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] completer_annonce: {e}")
        return jsonify({"error": str(e)}), 500


@tunnel_bp.route("/utilisateurs/me/annonces", methods=["GET"])
@token_required
def get_mes_annonces(current_user):
    """
    Récupère les annonces de l'utilisateur connecté (brouillons + publiées).

    Required JWT: True

    Query params:
        - skip (int, default 0): Pagination
        - limit (int, default 20): Nombre d'annonces
        - statut (str, optional): Filtrer par statut (brouillon, publiée, etc.)

    Returns:
        200: {
            "total": int,
            "annonces": [...]
        }
    """
    try:
        skip = request.args.get("skip", 0, type=int)
        limit = request.args.get("limit", 20, type=int)
        statut = request.args.get("statut", None)

        # Requête
        query = Annonce.query.filter_by(utilisateur_id=current_user["user_id"])

        if statut:
            query = query.filter_by(statut=statut)

        total = query.count()
        annonces = query.order_by(Annonce.date_modification.desc()).offset(skip).limit(limit).all()

        return jsonify({
            "total": total,
            "annonces": [a.to_dict() for a in annonces]
        }), 200

    except Exception as e:
        print(f"[ERROR] get_mes_annonces: {e}")
        return jsonify({"error": str(e)}), 500
