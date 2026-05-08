"""
Script de batch processing pour générer/regénérer les miniatures.

Permet de:
- Regénérer toutes les miniatures d'une annonce
- Générer les variants WebP manquants
- Traiter les images existantes par défaut
"""

import os
import logging
from pathlib import Path
from typing import List, Dict

from src.services.image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class ThumbnailGenerator:
    """Génère les miniatures et variants d'images en batch."""

    def __init__(self, base_images_dir: str = None):
        """Initialise le générateur."""
        self.processor = ImageProcessor(base_images_dir)

    def regenerate_annonce(self, annonce_id: int, force_webp: bool = True) -> Dict[str, any]:
        """
        Regénère tous les variants d'une annonce.

        Scanne le répertoire de l'annonce et regénère les variants
        manquants ou forcément (WebP, etc.).

        Args:
            annonce_id: ID de l'annonce
            force_webp: Générer WebP même s'il existe déjà

        Returns:
            Dict avec statistiques
        """
        annonce_dir = self.processor.base_dir / "annonces" / str(annonce_id)

        if not annonce_dir.exists():
            logger.warning(f"Annonce {annonce_id} n'a pas de dossier images")
            return {'status': 'error', 'message': 'Dossier inexistant'}

        stats = {
            'annonce_id': annonce_id,
            'images_processed': 0,
            'variants_generated': 0,
            'errors': []
        }

        # Chercher tous les fichiers JPEG
        jpeg_files = list(annonce_dir.glob('*.jpg'))

        if not jpeg_files:
            logger.warning(f"Aucun JPEG trouvé pour annonce {annonce_id}")
            return {'status': 'warning', 'message': 'Aucune image JPEG'}

        # Traiter chaque image
        for jpeg_file in jpeg_files:
            try:
                # Lire l'image originale
                with open(jpeg_file, 'rb') as f:
                    image_data = f.read()

                # Déterminer la taille originale
                stem = jpeg_file.stem  # "filename-desktop"
                base_name = '-'.join(stem.split('-')[:-1])  # "filename"

                # Regénérer les WebP si nécessaire
                if force_webp:
                    # Lire l'image avec PIL et regénérer WebP
                    from PIL import Image
                    img = Image.open(jpeg_file)

                    for size_name, size in self.processor.SIZES.items():
                        webp_path = annonce_dir / f"{base_name}-{size_name}.webp"

                        # Regénérer même si existe
                        if webp_path.exists() or size_name in stem:
                            self.processor._save_webp(img, size, webp_path)
                            stats['variants_generated'] += 1

                stats['images_processed'] += 1

            except Exception as e:
                logger.error(f"Erreur regénération {jpeg_file}: {str(e)}")
                stats['errors'].append(str(e))

        logger.info(f"Regénération annonce {annonce_id}: {stats}")
        return {'status': 'success', **stats}

    def regenerate_all(self, limit: int = None) -> List[Dict]:
        """
        Regénère les variants de toutes les annonces.

        Args:
            limit: Nombre max d'annonces à traiter

        Returns:
            Liste des statistiques par annonce
        """
        annonces_dir = self.processor.base_dir / "annonces"

        if not annonces_dir.exists():
            logger.warning("Dossier annonces inexistant")
            return []

        results = []
        count = 0

        for annonce_folder in sorted(annonces_dir.iterdir()):
            if not annonce_folder.is_dir():
                continue

            if limit and count >= limit:
                break

            try:
                annonce_id = int(annonce_folder.name)
                result = self.regenerate_annonce(annonce_id, force_webp=True)
                results.append(result)
                count += 1

            except ValueError:
                continue
            except Exception as e:
                logger.error(f"Erreur annonce {annonce_folder.name}: {str(e)}")
                results.append({
                    'annonce_id': annonce_folder.name,
                    'status': 'error',
                    'message': str(e)
                })

        logger.info(f"Regénération batch terminée: {len(results)} annonces traitées")
        return results

    def get_missing_variants(self, annonce_id: int) -> Dict[str, List[str]]:
        """
        Identifie les variants manquants pour une annonce.

        Returns:
            Dict avec les fichiers manquants par taille
        """
        annonce_dir = self.processor.base_dir / "annonces" / str(annonce_id)

        if not annonce_dir.exists():
            return {}

        missing = {size: [] for size in self.processor.SIZES.keys()}

        # Lister les fichiers existants
        existing_files = set(f.name for f in annonce_dir.iterdir())

        # Vérifier chaque fichier JPEG
        for jpeg_file in annonce_dir.glob('*.jpg'):
            base_name = '-'.join(jpeg_file.stem.split('-')[:-1])

            for size in self.processor.SIZES.keys():
                webp_name = f"{base_name}-{size}.webp"
                if webp_name not in existing_files:
                    missing[size].append(webp_name)

        return {k: v for k, v in missing.items() if v}


# Fonction utilitaire pour CLI
def cli_regenerate(annonce_id: int = None, batch: bool = False):
    """
    CLI pour regénérer les miniatures.

    Usage:
        python -m backend.scripts.thumbnail_generator --annonce-id 1
        python -m backend.scripts.thumbnail_generator --batch
    """
    generator = ThumbnailGenerator()

    if batch:
        print("Regénération batch de toutes les annonces...")
        results = generator.regenerate_all()
        for result in results:
            print(f"  {result['annonce_id']}: {result['status']}")
    elif annonce_id:
        print(f"Regénération annonce {annonce_id}...")
        result = generator.regenerate_annonce(annonce_id, force_webp=True)
        print(f"  Status: {result['status']}")
        if 'images_processed' in result:
            print(f"  Images: {result['images_processed']}")
            print(f"  Variants: {result['variants_generated']}")
    else:
        print("Usage: python -m backend.scripts.thumbnail_generator [--annonce-id ID | --batch]")
