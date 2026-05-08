#!/usr/bin/env python3
"""
Assigne des photos aléatoires depuis la banque d'images aux annonces.
Compresse les photos au bon format (4 tailles + WebP).
Simule un upload utilisateur.
"""

import os
import sys
import random
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from src.app import create_app, db
from src.models import Annonce
from src.services.image_processor import ImageProcessor

# Configuration
IMAGES_BANK = Path(__file__).parent / 'images'
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png'}

print(f"""
{'='*70}
🏠 ASSIGNATION DE PHOTOS ALÉATOIRES AUX ANNONCES
{'='*70}
""")

# Chercher toutes les images disponibles
image_files = []
for ext in SUPPORTED_FORMATS:
    image_files.extend(IMAGES_BANK.glob(f'*{ext}'))
    image_files.extend(IMAGES_BANK.glob(f'*{ext.upper()}'))

image_files = list(set(image_files))  # Supprimer les doublons
random.shuffle(image_files)

print(f"📂 Images trouvées: {len(image_files)}")
if not image_files:
    print("❌ Aucune image trouvée dans le dossier 'images/'")
    sys.exit(1)

# Créer l'app Flask
app = create_app()

with app.app_context():
    # Récupérer toutes les annonces
    annonces = Annonce.query.all()
    print(f"📋 Annonces: {len(annonces)}")

    if not annonces:
        print("❌ Aucune annonce trouvée")
        sys.exit(1)

    print(f"\n{'='*70}")
    print("🎲 ASSIGNATION ALÉATOIRE")
    print(f"{'='*70}\n")

    processor = ImageProcessor()
    successful = 0
    failed = 0

    # Assigner une photo aléatoire à chaque annonce
    for annonce in annonces:
        # Piocher une image aléatoire
        image_path = random.choice(image_files)

        try:
            print(f"📦 Annonce {annonce.annonce_id}: {annonce.titre}")
            print(f"   📷 Photo: {image_path.name}")

            # Lire les bytes de l'image
            with open(image_path, 'rb') as f:
                image_data = f.read()

            # Traiter l'image (compression + 4 tailles + WebP)
            result = processor.process_image(
                image_data,
                annonce.annonce_id,
                image_path.name
            )

            if result:
                # Formater les URLs de photos
                photos = [
                    result['desktop'],      # Version desktop en priorité
                    result['mobile'],       # Version mobile
                    result['thumbnail']     # Version thumbnail
                ]

                # Mettre à jour l'annonce
                annonce.photos = photos
                annonce.date_modification = datetime.utcnow()
                db.session.commit()

                print(f"   ✅ Photos assignées:")
                print(f"      - Desktop: {result['desktop']}")
                print(f"      - Mobile: {result['mobile']}")
                print(f"      - Thumbnail: {result['thumbnail']}")
                print(f"      - WebP: {result.get('webp_desktop', 'N/A')}")

                successful += 1
            else:
                print(f"   ❌ Erreur lors du traitement")
                failed += 1

        except Exception as e:
            print(f"   ❌ Erreur: {str(e)}")
            failed += 1

        print()

    print(f"\n{'='*70}")
    print(f"📊 RÉSUMÉ")
    print(f"{'='*70}")
    print(f"✅ Succès: {successful}")
    print(f"❌ Erreurs: {failed}")
    print(f"📈 Total: {successful + failed}")

    # Vérifier les assignations
    print(f"\n{'='*70}")
    print(f"✔️  VÉRIFICATION DES ASSIGNATIONS")
    print(f"{'='*70}\n")

    annonces = Annonce.query.all()
    for annonce in annonces:
        photo_count = len(annonce.photos) if annonce.photos else 0
        status = "✅" if photo_count > 0 else "⚠️"
        print(f"{status} Annonce {annonce.annonce_id}: {photo_count} photo(s)")
        if annonce.photos:
            print(f"   Premières photos assignées à cette annonce")

    print(f"\n{'='*70}")
    print("🎉 ASSIGNATION TERMINÉE!")
    print(f"{'='*70}")
