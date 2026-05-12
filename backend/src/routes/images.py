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
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError

logger = logging.getLogger(__name__)

images_bp = Blueprint('images', __name__, url_prefix='/api/v1/images')

# Extensions autorisées
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}


def allowed_file(filename: str) -> bool:
    """Vérifie si le fichier est autorisé."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@images_bp.route('/upload', methods=['POST'])
@token_required
@handle_errors()
def upload_image(current_user) -> Tuple[dict, int]:
    """
    Upload et traite une image immobilière.

    Paramètres:
    - image_data: Fichier image (multipart form)
    - annonce_id: ID de l'annonce (query param)

    Returns:
        JSON avec les chemins des fichiers générés
    """
    # Vérifier l'annonce_id
    annonce_id = request.args.get('annonce_id')
    if not annonce_id or not annonce_id.isdigit():
        raise ValidationError('annonce_id manquant ou invalide')

    # Vérifier le fichier
    if 'file' not in request.files:
        raise ValidationError('Aucun fichier uploadé')

    file = request.files['file']
    if file.filename == '':
        raise ValidationError('Fichier vide')

    if not allowed_file(file.filename):
        raise ValidationError(f'Extension non autorisée. Accepté: {", ".join(ALLOWED_EXTENSIONS)}')

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


@images_bp.route('/<int:annonce_id>', methods=['GET'])
@handle_errors()
def get_image_variants(annonce_id: int) -> Tuple[dict, int]:
    """
    Récupère tous les variants d'image d'une annonce.

    Retourne les URLs de toutes les tailles et formats disponibles.
    """
    processor = get_image_processor()
    # Chercher le premier fichier de l'annonce pour obtenir les variants
    annonce_dir = processor.base_dir / "annonces" / str(annonce_id)

    if not annonce_dir.exists():
        raise NotFoundError('Aucune image pour cette annonce')

    # Récupérer les fichiers
    variants = {}
    for file in annonce_dir.iterdir():
        size_type = file.stem.split('-')[-1]  # desktop, mobile, thumbnail, etc.
        format_type = 'webp' if file.suffix == '.webp' else 'jpeg'

        key = f"{size_type}_{format_type}"
        variants[key] = f"/static/images/annonces/{annonce_id}/{file.name}"

    if not variants:
        raise NotFoundError('Aucun variant trouvé')

    return {
        'annonce_id': annonce_id,
        'variants': variants
    }, 200


@images_bp.route('/<int:annonce_id>/regenerate', methods=['POST'])
@token_required
@handle_errors()
def regenerate_thumbnails(current_user, annonce_id: int) -> Tuple[dict, int]:
    """
    Regénère les miniatures et variants WebP d'une annonce.

    Utile après modification d'images ou pour générer les formats manquants.

    Auth: Token required
    """
    generator = ThumbnailGenerator()
    result = generator.regenerate_annonce(annonce_id, force_webp=True)

    return {
        'message': 'Regénération terminée',
        'annonce_id': annonce_id,
        **result
    }, 200


@images_bp.route('/<int:annonce_id>/missing-variants', methods=['GET'])
@handle_errors()
def get_missing_variants(annonce_id: int) -> Tuple[dict, int]:
    """
    Identifie les variants manquants d'une annonce.

    Retourne les fichiers WebP qui pourraient être générés.
    """
    generator = ThumbnailGenerator()
    missing = generator.get_missing_variants(annonce_id)

    return {
        'annonce_id': annonce_id,
        'missing_variants': missing,
        'total_missing': sum(len(v) for v in missing.values())
    }, 200
