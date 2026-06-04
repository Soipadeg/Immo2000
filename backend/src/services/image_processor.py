"""
Service de traitement et optimisation d'images immobilières.

Fonctionnalités:
- Compression JPEG/PNG
- Génération WebP
- Redimensionnement automatique
- Génération de miniatures
- Gestion des répertoires d'images par annonce
"""

import os
import logging
from pathlib import Path
from typing import Tuple, Optional
from io import BytesIO

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Traitement et optimisation d'images immobilières."""

    # Configuration des tailles d'image
    SIZES = {
        'thumbnail': (200, 150),      # Listes, galeries miniatures
        'mobile': (600, 400),         # Carousel mobile
        'desktop': (1200, 800),       # Carousel desktop
        'detail': (1920, 1280),       # Page détail haute résolution
    }

    # Configuration de compression
    JPEG_QUALITY = 80
    WEBP_QUALITY = 80
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB max

    def __init__(self, base_images_dir: str = None):
        """
        Initialise le processeur d'images.

        Args:
            base_images_dir: Chemin de base pour stocker les images
        """
        if not PIL_AVAILABLE:
            logger.warning("PIL/Pillow non disponible - compression désactivée")

        if base_images_dir is None:
            # Par défaut, utilisera /project/static/images
            self.base_dir = Path(__file__).parent.parent.parent.parent / "static" / "images"
        else:
            self.base_dir = Path(base_images_dir)

        self.base_dir.mkdir(parents=True, exist_ok=True)

    def create_annonce_directory(self, annonce_id: int) -> Path:
        """
        Crée un répertoire pour une annonce.

        Args:
            annonce_id: ID de l'annonce

        Returns:
            Path au répertoire de l'annonce
        """
        annonce_dir = self.base_dir / "annonces" / str(annonce_id)
        annonce_dir.mkdir(parents=True, exist_ok=True)
        return annonce_dir

    def process_image(
        self,
        image_data: bytes,
        annonce_id: int,
        filename: str,
        generate_webp: bool = True
    ) -> dict:
        """
        Traite une image uploadée: compression, redimensionnement, WebP.

        Args:
            image_data: Données brutes de l'image (bytes)
            annonce_id: ID de l'annonce
            filename: Nom du fichier original
            generate_webp: Générer version WebP

        Returns:
            Dict avec les chemins des fichiers générés:
            {
                'thumbnail': '/static/images/annonces/1/filename-thumbnail.jpg',
                'mobile': '/static/images/annonces/1/filename-mobile.jpg',
                'desktop': '/static/images/annonces/1/filename-desktop.jpg',
                'detail': '/static/images/annonces/1/filename-detail.jpg',
                'webp_desktop': '/static/images/annonces/1/filename-desktop.webp',
            }
        """
        if not PIL_AVAILABLE:
            logger.error("PIL/Pillow non disponible")
            return {}

        try:
            # Valider la taille
            if len(image_data) > self.MAX_FILE_SIZE:
                raise ValueError(f"Image trop grande ({len(image_data)} > {self.MAX_FILE_SIZE})")

            # Charger l'image
            img = Image.open(BytesIO(image_data))

            # Convertir en RGB si nécessaire (PNG avec alpha, etc.)
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img

            # Créer répertoire annonce
            annonce_dir = self.create_annonce_directory(annonce_id)

            # Préparer le nom de base
            name_base = Path(filename).stem  # Sans extension

            results = {}

            # Générer chaque version redimensionnée
            for size_name, size in self.SIZES.items():
                jpeg_path = annonce_dir / f"{name_base}-{size_name}.jpg"
                results[size_name] = self._save_jpeg(img, size, jpeg_path)

                # Générer WebP pour la version desktop
                if generate_webp and size_name == 'desktop':
                    webp_path = annonce_dir / f"{name_base}-{size_name}.webp"
                    results[f'webp_{size_name}'] = self._save_webp(img, size, webp_path)

            logger.info(f"Image traitée pour annonce {annonce_id}: {results}")
            return results

        except ValueError as e:
            logger.error(f"Erreur traitement image (validation): {str(e)}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Erreur traitement image: {str(e)}", exc_info=True)
            raise

    def _save_jpeg(self, img: 'Image.Image', size: Tuple[int, int], output_path: Path) -> str:
        """
        Redimensionne et sauvegarde en JPEG.

        Args:
            img: Image PIL
            size: Dimensions cibles (width, height)
            output_path: Chemin de sortie

        Returns:
            Chemin relatif pour URL (/static/images/...)
        """
        # Redimensionner avec conservation ratio
        img_resized = img.copy()
        img_resized.thumbnail(size, Image.Resampling.LANCZOS)

        # Créer fond blanc si transparent
        if img_resized.mode == 'RGBA':
            background = Image.new('RGB', size, (255, 255, 255))
            offset = (
                (size[0] - img_resized.width) // 2,
                (size[1] - img_resized.height) // 2
            )
            background.paste(img_resized, offset, img_resized)
            img_resized = background

        # Sauvegarder
        img_resized.save(output_path, 'JPEG', quality=self.JPEG_QUALITY, optimize=True)

        # Retourner chemin relatif
        relative_path = f"/static/images/annonces/{output_path.parent.name}/{output_path.name}"
        return relative_path

    def _save_webp(self, img: 'Image.Image', size: Tuple[int, int], output_path: Path) -> str:
        """
        Redimensionne et sauvegarde en WebP.

        Args:
            img: Image PIL
            size: Dimensions cibles
            output_path: Chemin de sortie

        Returns:
            Chemin relatif pour URL
        """
        img_resized = img.copy()
        img_resized.thumbnail(size, Image.Resampling.LANCZOS)

        # Sauvegarder en WebP
        img_resized.save(output_path, 'WEBP', quality=self.WEBP_QUALITY)

        relative_path = f"/static/images/annonces/{output_path.parent.name}/{output_path.name}"
        return relative_path

    def delete_annonce_images(self, annonce_id: int) -> bool:
        """
        Supprime tous les fichiers images d'une annonce.

        Args:
            annonce_id: ID de l'annonce

        Returns:
            True si suppression réussie
        """
        try:
            annonce_dir = self.base_dir / "annonces" / str(annonce_id)
            if annonce_dir.exists():
                import shutil
                shutil.rmtree(annonce_dir)
                logger.info(f"Images annonce {annonce_id} supprimées")
            return True
        except IOError as e:
            logger.error(f"Erreur suppression images (IO): {str(e)}", exc_info=True)
            return False
        except Exception as e:
            logger.error(f"Erreur suppression images: {str(e)}", exc_info=True)
            return False

    def get_image_variants(self, annonce_id: int, filename: str) -> dict:
        """
        Récupère tous les variants d'une image.

        Args:
            annonce_id: ID de l'annonce
            filename: Nom du fichier (sans extension)

        Returns:
            Dict des variants disponibles
        """
        annonce_dir = self.base_dir / "annonces" / str(annonce_id)
        name_base = Path(filename).stem

        variants = {}
        for size_name in self.SIZES.keys():
            jpeg_file = annonce_dir / f"{name_base}-{size_name}.jpg"
            webp_file = annonce_dir / f"{name_base}-{size_name}.webp"

            if jpeg_file.exists():
                variants[f'{size_name}_jpeg'] = f"/static/images/annonces/{annonce_id}/{jpeg_file.name}"
            if webp_file.exists():
                variants[f'{size_name}_webp'] = f"/static/images/annonces/{annonce_id}/{webp_file.name}"

        return variants


# Instance globale
_processor: Optional[ImageProcessor] = None


def get_image_processor() -> ImageProcessor:
    """Récupère l'instance du processeur d'images."""
    global _processor
    if _processor is None:
        _processor = ImageProcessor()
    return _processor
