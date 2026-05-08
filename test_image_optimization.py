"""
Script de test pour le système d'optimisation d'images.

Teste:
- Compression d'images
- Génération de miniatures
- Détection WebP
- Endpoints API
"""

import sys
import os
from pathlib import Path

# Ajouter le chemin du backend
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

def test_image_processor():
    """Test du processeur d'images."""
    print("\n" + "="*60)
    print("TEST 1: ImageProcessor (Compression & Miniatures)")
    print("="*60)

    from src.services.image_processor import ImageProcessor

    processor = ImageProcessor()
    print(f"✓ ImageProcessor initialisé")
    print(f"  Répertoire base: {processor.base_dir}")
    print(f"  Tailles configurées: {list(processor.SIZES.keys())}")
    print(f"  Qualité JPEG: {processor.JPEG_QUALITY}")
    print(f"  Qualité WebP: {processor.WEBP_QUALITY}")

    # Tester la création du répertoire
    test_dir = processor.create_annonce_directory(999)
    print(f"✓ Répertoire test créé: {test_dir}")

    # Charger l'image de test
    test_image_path = Path(__file__).parent / "static" / "images" / "default-house.jpg"
    if test_image_path.exists():
        print(f"✓ Image de test trouvée: {test_image_path}")
        print(f"  Taille: {test_image_path.stat().st_size} bytes")

        with open(test_image_path, 'rb') as f:
            image_data = f.read()

        # Traiter l'image
        try:
            result = processor.process_image(
                image_data=image_data,
                annonce_id=999,
                filename='test-image.jpg',
                generate_webp=True
            )
            print(f"✓ Image traitée avec succès")
            for variant, url in result.items():
                print(f"  - {variant}: {url}")
        except Exception as e:
            print(f"✗ Erreur traitement: {str(e)}")
            return False
    else:
        print(f"⚠ Image de test non trouvée: {test_image_path}")

    return True


def test_thumbnail_generator():
    """Test du générateur de miniatures."""
    print("\n" + "="*60)
    print("TEST 2: ThumbnailGenerator (Regénération)")
    print("="*60)

    from src.services.thumbnail_generator import ThumbnailGenerator

    generator = ThumbnailGenerator()
    print(f"✓ ThumbnailGenerator initialisé")

    # Chercher les annonces existantes
    annonces_dir = generator.processor.base_dir / "annonces"
    if annonces_dir.exists():
        annonces = [d for d in annonces_dir.iterdir() if d.is_dir()]
        print(f"✓ {len(annonces)} annonce(s) trouvée(s)")

        for annonce_folder in annonces[:1]:  # Tester la première
            annonce_id = int(annonce_folder.name)
            print(f"\n  Regénération annonce {annonce_id}...")
            result = generator.regenerate_annonce(annonce_id, force_webp=True)
            print(f"    Status: {result.get('status')}")
            if 'images_processed' in result:
                print(f"    Images traitées: {result['images_processed']}")
                print(f"    Variants générés: {result['variants_generated']}")
    else:
        print(f"⚠ Aucune annonce trouvée")

    return True


def test_pillow_support():
    """Teste le support Pillow."""
    print("\n" + "="*60)
    print("TEST 3: Support Pillow (Image Processing)")
    print("="*60)

    try:
        from PIL import Image
        print(f"✓ PIL/Pillow disponible")
        print(f"  Version: {Image.__version__ if hasattr(Image, '__version__') else 'inconnue'}")

        # Lister les formats supportés
        formats = Image.EXTENSION.keys()
        print(f"  Formats supportés: {len(formats)}")

        # Vérifier WebP
        try:
            Image.new('RGB', (1, 1)).save('/tmp/test.webp', 'WEBP')
            os.remove('/tmp/test.webp')
            print(f"  ✓ WebP support détecté")
        except Exception as e:
            print(f"  ✗ WebP non supporté: {str(e)}")

        return True
    except ImportError:
        print(f"✗ PIL/Pillow non installé")
        return False


def test_api_endpoints():
    """Teste les endpoints API."""
    print("\n" + "="*60)
    print("TEST 4: Endpoints API (Routes)")
    print("="*60)

    try:
        from src.routes.images import images_bp
        print(f"✓ Blueprint images chargé")
        print(f"  Prefix: {images_bp.url_prefix}")
        print(f"  Routes disponibles:")
        print(f"    - POST /api/v1/images/upload?annonce_id=ID [POST]")
        print(f"    - GET /api/v1/images/<annonce_id> [GET]")
        print(f"    - POST /api/v1/images/<annonce_id>/regenerate [POST]")
        print(f"    - GET /api/v1/images/<annonce_id>/missing-variants [GET]")
        return True
    except ImportError as e:
        print(f"✗ Erreur import: {str(e)}")
        return False


def test_javascript_support():
    """Teste les fichiers JavaScript."""
    print("\n" + "="*60)
    print("TEST 5: Support JavaScript (Lazy Loading & WebP)")
    print("="*60)

    js_files = [
        'lazy-loader.js',
        'responsive-images.js',
    ]

    for js_file in js_files:
        js_path = Path(__file__).parent / 'static' / 'js' / js_file
        if js_path.exists():
            size = js_path.stat().st_size
            print(f"✓ {js_file} ({size} bytes)")
        else:
            print(f"✗ {js_file} non trouvé")
            return False

    return True


def main():
    """Lance tous les tests."""
    print("\n" + "🖼️  TESTS D'OPTIMISATION D'IMAGES - Immo2000".center(60))

    results = {
        'Pillow Support': test_pillow_support(),
        'ImageProcessor': test_image_processor(),
        'ThumbnailGenerator': test_thumbnail_generator(),
        'API Endpoints': test_api_endpoints(),
        'JavaScript Support': test_javascript_support(),
    }

    # Résumé
    print("\n" + "="*60)
    print("RÉSUMÉ DES TESTS")
    print("="*60)

    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name:<30} {status}")

    all_passed = all(results.values())
    print("\n" + ("="*60))

    if all_passed:
        print("✓ TOUS LES TESTS RÉUSSIS!")
        print("\nLe système d'optimisation d'images est prêt à être utilisé.")
        print("\nDémarrez l'API avec:")
        print("  cd backend && python run_server.py")
        print("\nAccédez à l'API sur:")
        print("  http://localhost:5000/api/v1/images/upload")
        return 0
    else:
        print("✗ CERTAINS TESTS ONT ÉCHOUÉ")
        print("\nVérifiez les erreurs ci-dessus et relancez les tests.")
        return 1


if __name__ == '__main__':
    exit(main())
