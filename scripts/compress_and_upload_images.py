"""
Script pour créer, compresser et uploader des images aux annonces.

Fonctionnalités:
1. Génère une image test pour chaque annonce
2. Compresse avec ImageProcessor (4 tailles + WebP)
3. Met à jour les annonces dans la DB avec les URLs des images
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Ajouter le chemin du backend
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from src.services.image_processor import get_image_processor
from src.models import Annonce
from src.app import create_app, db


def generate_test_image(annonce_id: int, titre: str) -> bytes:
    """Génère une image de test pour une annonce."""
    # Créer une image colorée avec le titre
    colors = [
        (230, 126, 34),   # Orange
        (52, 152, 219),   # Bleu
        (46, 204, 113),   # Vert
        (155, 89, 182),   # Violet
        (236, 112, 99),   # Coral
        (52, 73, 94),     # Gris foncé
    ]

    color = colors[annonce_id % len(colors)]

    # Créer l'image
    img = Image.new('RGB', (1200, 800), color=color)
    draw = ImageDraw.Draw(img)

    # Ajouter du texte
    try:
        # Essayer d'utiliser une police système
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
    except:
        # Fallback à la police par défaut
        font = ImageFont.load_default()

    # Texte
    text = f"Annonce #{annonce_id}\n{titre[:40]}"

    # Centrer le texte
    bbox = draw.textbbox((0, 0), text)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (1200 - text_width) // 2
    y = (800 - text_height) // 2

    draw.text((x, y), text, fill=(255, 255, 255), font=font)

    # Convertir en bytes
    from io import BytesIO
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=85, optimize=True)
    buffer.seek(0)
    return buffer.getvalue()


def process_images_for_annonces():
    """Compresse les images et les assigne aux annonces."""

    print("\n" + "="*70)
    print("🖼️  COMPRESSION ET ATTRIBUTION DES IMAGES AUX ANNONCES")
    print("="*70)

    # Initialiser l'app Flask
    app = create_app()

    with app.app_context():
        # Obtenir le processeur d'images
        processor = get_image_processor()

        # Récupérer toutes les annonces
        annonces = db.session.query(Annonce).all()

        if not annonces:
            print("✗ Aucune annonce trouvée dans la base de données")
            return False

        print(f"\n✓ {len(annonces)} annonce(s) trouvée(s)")

        # Traiter chaque annonce
        for annonce in annonces:
            print(f"\n📦 Traitement annonce {annonce.annonce_id}: {annonce.titre[:40]}")

            try:
                # Générer une image de test
                image_data = generate_test_image(annonce.annonce_id, annonce.titre)
                print(f"   ✓ Image générée ({len(image_data)} bytes)")

                # Traiter l'image (compression + génération variantes)
                result = processor.process_image(
                    image_data=image_data,
                    annonce_id=annonce.annonce_id,
                    filename=f'annonce-{annonce.annonce_id}.jpg',
                    generate_webp=True
                )

                if result:
                    print(f"   ✓ Images compressées et redimensionnées:")

                    # Préparer les URLs pour la DB
                    photos = [
                        result['desktop'],      # Image principale
                        result['mobile'],       # Version mobile
                        result['thumbnail'],    # Miniature
                    ]

                    # Mettre à jour l'annonce dans la DB
                    annonce.photos = photos
                    db.session.commit()

                    print(f"   ✓ Annonce mise à jour dans la DB")
                    print(f"      - Desktop: {result['desktop']}")
                    print(f"      - Mobile: {result['mobile']}")
                    print(f"      - Thumbnail: {result['thumbnail']}")

                    if 'webp_desktop' in result:
                        print(f"      - WebP: {result['webp_desktop']}")
                else:
                    print(f"   ✗ Erreur traitement image")

            except Exception as e:
                print(f"   ✗ Erreur: {str(e)}")
                continue

        print("\n" + "="*70)
        print("✅ COMPRESSION TERMINÉE")
        print("="*70)

        # Afficher un résumé
        print(f"\n📊 Résumé:")
        for annonce in db.session.query(Annonce).all():
            nb_photos = len(annonce.photos) if annonce.photos else 0
            print(f"   Annonce {annonce.annonce_id}: {nb_photos} photo(s)")

        return True


def verify_compression():
    """Vérifie la compression des images."""

    print("\n" + "="*70)
    print("🔍 VÉRIFICATION DE LA COMPRESSION")
    print("="*70)

    images_dir = Path("/home/djali/code/Soipadeg/Immo2000/static/images")

    # Collecter les statistiques
    stats = {
        'total_files': 0,
        'total_size': 0,
        'by_extension': {},
        'by_size': []
    }

    for img_file in images_dir.rglob("*"):
        if img_file.is_file():
            size = img_file.stat().st_size
            ext = img_file.suffix.lower()

            stats['total_files'] += 1
            stats['total_size'] += size

            if ext not in stats['by_extension']:
                stats['by_extension'][ext] = {'count': 0, 'size': 0}

            stats['by_extension'][ext]['count'] += 1
            stats['by_extension'][ext]['size'] += size

            stats['by_size'].append((img_file.name, size))

    print(f"\n📊 Statistiques générales:")
    print(f"   Total fichiers: {stats['total_files']}")
    print(f"   Taille totale: {stats['total_size'] / 1024:.1f} KB")
    print(f"   Moyenne par fichier: {stats['total_size'] / stats['total_files']:.0f} bytes")

    print(f"\n📝 Par format:")
    for ext, data in sorted(stats['by_extension'].items()):
        size_kb = data['size'] / 1024
        avg = data['size'] / data['count']
        print(f"   {ext}: {data['count']} fichier(s), {size_kb:.1f} KB (avg: {avg:.0f} bytes)")

    print(f"\n🗂️  Plus grands fichiers:")
    for name, size in sorted(stats['by_size'], key=lambda x: x[1], reverse=True)[:10]:
        print(f"   {size/1024:.1f} KB - {name}")

    return stats


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Compresse et attribue des images aux annonces')
    parser.add_argument('--verify', action='store_true', help='Vérifier la compression')
    parser.add_argument('--process', action='store_true', help='Traiter les images')
    parser.add_argument('--all', action='store_true', help='Tout faire (verify + process)')

    args = parser.parse_args()

    if args.all or not (args.verify or args.process):
        args.verify = True
        args.process = True

    # Vérifier la compression existante
    if args.verify:
        stats = verify_compression()

    # Traiter les images
    if args.process:
        success = process_images_for_annonces()
        if success:
            print("\n✅ Les images sont maintenant compressées et assignées aux annonces!")
            print("\n💡 Prochaines étapes:")
            print("   1. Vérifier que les photos s'affichent: http://localhost:5000/")
            print("   2. Tester le carousel: vérifier lazy loading et compression")
            print("   3. Consulter l'onglet Network pour voir les tailles optimisées")
        sys.exit(0 if success else 1)
