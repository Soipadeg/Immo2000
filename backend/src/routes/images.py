"""
Routes d'API pour la gestion des images immobilières.

Endpoints:
- POST /api/v1/images/upload - Upload et traitement d'image
- GET /api/v1/images/<annonce_id> - Récupère les variants d'une image
"""

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import logging
from typing import Tuple

from src.auth.decorators import token_required
from src.services.image_processor import get_image_processor
from src.services.thumbnail_generator import ThumbnailGenerator

logger = logging.getLogger(__name__)

images_bp = Blueprint('images', __name__, url_prefix='/api/v1/images')

# Extensions autorisées
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}


def allowed_file(filename: str) -> bool:
    """Vérifie si le fichier est autorisé."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@images_bp.route('/upload', methods=['POST'])
@token_required
def upload_image(current_user) -> Tuple[dict, int]:
    """
    Upload et traite une image immobilière.

    Paramètres:
    - image_data: Fichier image (multipart form)
    - annonce_id: ID de l'annonce (query param)

    Returns:
        JSON avec les chemins des fichiers générés
    """
    try:
        # Vérifier l'annonce_id
        annonce_id = request.args.get('annonce_id')
        if not annonce_id or not annonce_id.isdigit():
            return {'error': 'annonce_id manquant ou invalide'}, 400

        # Vérifier le fichier
        if 'file' not in request.files:
            return {'error': 'Aucun fichier uploadé'}, 400

        file = request.files['file']
        if file.filename == '':
            return {'error': 'Fichier vide'}, 400

        if not allowed_file(file.filename):
            return {'error': f'Extension non autorisée. Accepté: {", ".join(ALLOWED_EXTENSIONS)}'}, 400

        # Lire les données
        image_data = file.read()
        filename = secure_filename(file.filename)

        # Traiter l'image
        processor = get_image_processor()
        result = processor.process_image(
            image_data=image_data,
            annonce_id=int(annonce_id),
            filename=filename,
            generate_webp=True
        )

        return {
            'message': 'Image traitée avec succès',
            'annonce_id': annonce_id,
            'variants': result
        }, 201

    except ValueError as e:
        return {'error': str(e)}, 400
    except Exception as e:
        logger.error(f"Erreur upload image: {str(e)}")
        return {'error': 'Erreur serveur lors du traitement'}, 500


@images_bp.route('/<int:annonce_id>', methods=['GET'])
def get_image_variants(annonce_id: int) -> Tuple[dict, int]:
    """
    Récupère tous les variants d'image d'une annonce.

    Retourne les URLs de toutes les tailles et formats disponibles.
    """
    try:
        processor = get_image_processor()
        # Chercher le premier fichier de l'annonce pour obtenir les variants
        annonce_dir = processor.base_dir / "annonces" / str(annonce_id)

        if not annonce_dir.exists():
            return {'error': 'Aucune image pour cette annonce'}, 404

        # Récupérer les fichiers
        variants = {}
        for file in annonce_dir.iterdir():
            size_type = file.stem.split('-')[-1]  # desktop, mobile, thumbnail, etc.
            format_type = 'webp' if file.suffix == '.webp' else 'jpeg'

            key = f"{size_type}_{format_type}"
            variants[key] = f"/static/images/annonces/{annonce_id}/{file.name}"

        if not variants:
            return {'error': 'Aucun variant trouvé'}, 404

        return {
            'annonce_id': annonce_id,
            'variants': variants
        }, 200

    except Exception as e:
        logger.error(f"Erreur récupération variants: {str(e)}")
        return {'error': 'Erreur serveur'}, 500


@images_bp.route('/<int:annonce_id>/regenerate', methods=['POST'])
@token_required
def regenerate_thumbnails(current_user, annonce_id: int) -> Tuple[dict, int]:
    """
    Regénère les miniatures et variants WebP d'une annonce.

    Utile après modification d'images ou pour générer les formats manquants.

    Auth: Token required
    """
    try:
        generator = ThumbnailGenerator()
        result = generator.regenerate_annonce(annonce_id, force_webp=True)

        return {
            'message': 'Regénération terminée',
            'annonce_id': annonce_id,
            **result
        }, 200

    except Exception as e:
        logger.error(f"Erreur regénération: {str(e)}")
        return {'error': 'Erreur serveur'}, 500


@images_bp.route('/<int:annonce_id>/missing-variants', methods=['GET'])
def get_missing_variants(annonce_id: int) -> Tuple[dict, int]:
    """
    Identifie les variants manquants d'une annonce.

    Retourne les fichiers WebP qui pourraient être générés.
    """
    try:
        generator = ThumbnailGenerator()
        missing = generator.get_missing_variants(annonce_id)

        return {
            'annonce_id': annonce_id,
            'missing_variants': missing,
            'total_missing': sum(len(v) for v in missing.values())
        }, 200

    except Exception as e:
        logger.error(f"Erreur récupération variants manquants: {str(e)}")
        return {'error': 'Erreur serveur'}, 500
