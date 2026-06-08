#!/usr/bin/env python3
"""
Phase 6: Seed listings for performance testing

Populates database with test data.
"""

from app_fastapi import create_app, db
from src.auth.models import User, RoleEnum
from src.models.offres import Offre
from datetime import datetime, timedelta
import random

def main():
    app = create_app()

    with app.app_context():
        print("\n" + "="*70)
        print("🌱 PHASE 6: SEEDING TEST LISTINGS")
        print("="*70)

        # Get existing users
        users = User.query.filter(User.role == RoleEnum.UTILISATEUR).all()

        if not users:
            print("\n❌ No users found!")
            print("   Run: docker-compose exec -T backend python3 /app/backend/seed_docker.py")
            return

        print(f"\n✅ Found {len(users)} users")

        # Create test listings
        print("\n🏠 Creating test listings...\n")

        listings_data = [
            # Paris listings
            {
                'titre': 'Appartement 2 pièces Paris 11e',
                'description': 'Beau 2 pièces rénové, calme, parking inclus, proche métro',
                'prix': 350000,
                'type_bien': 'appartement',
                'surface': 45,
                'pieces': 2,
                'ville': 'Paris',
                'code_postal': '75011',
                'dpe': 'B',
            },
            {
                'titre': 'Studio moderne Paris Marais',
                'description': 'Studio dernier étage, lumineux, balcon',
                'prix': 280000,
                'type_bien': 'studio',
                'surface': 25,
                'pieces': 1,
                'ville': 'Paris',
                'code_postal': '75004',
                'dpe': 'A',
            },
            {
                'titre': '3 pièces lumineux Paris 14e',
                'description': '3 pièces avec balcon, vue sur parc',
                'prix': 420000,
                'type_bien': 'appartement',
                'surface': 65,
                'pieces': 3,
                'ville': 'Paris',
                'code_postal': '75014',
                'dpe': 'B',
            },
            # Banlieue listings
            {
                'titre': 'Maison 4 chambres Boulogne',
                'description': 'Maison de famille, terrain 500m², garage',
                'prix': 550000,
                'type_bien': 'maison',
                'surface': 120,
                'pieces': 5,
                'ville': 'Boulogne-Billancourt',
                'code_postal': '92100',
                'dpe': 'C',
            },
            {
                'titre': 'Villa 5 chambres Neuilly',
                'description': 'Villa avec piscine, terrain 800m²',
                'prix': 950000,
                'type_bien': 'maison',
                'surface': 180,
                'pieces': 6,
                'ville': 'Neuilly-sur-Seine',
                'code_postal': '92200',
                'dpe': 'B',
            },
            {
                'titre': 'Maison 3 chambres Vincennes',
                'description': 'Maison mitoyenne, proximité Château',
                'prix': 650000,
                'type_bien': 'maison',
                'surface': 95,
                'pieces': 4,
                'ville': 'Vincennes',
                'code_postal': '94300',
                'dpe': 'D',
            },
            # Commercial/Duplex
            {
                'titre': 'Duplex 4 pièces Paris 5e',
                'description': 'Duplex avec terrasse, deux niveaux',
                'prix': 480000,
                'type_bien': 'duplex',
                'surface': 85,
                'pieces': 4,
                'ville': 'Paris',
                'code_postal': '75005',
                'dpe': 'B',
            },
            {
                'titre': 'T4 rénové Paris 13e',
                'description': 'Appartement neuf, toutes commodités',
                'prix': 395000,
                'type_bien': 'appartement',
                'surface': 72,
                'pieces': 4,
                'ville': 'Paris',
                'code_postal': '75013',
                'dpe': 'A',
            },
        ]

        # Create listings, alternating between users
        created = 0
        for i, data in enumerate(listings_data):
            try:
                listing = Offre(
                    titre=data['titre'],
                    description=data['description'],
                    prix=data['prix'],
                    type_bien=data['type_bien'],
                    surface=data['surface'],
                    nombre_pieces=data['pieces'],
                    ville=data['ville'],
                    code_postal=data['code_postal'],
                    dpe=data.get('dpe', 'C'),
                    utilisateur_id=users[i % len(users)].utilisateur_id,
                    actif=True,
                    date_creation=datetime.now() - timedelta(days=random.randint(1, 30)),
                )
                db.session.add(listing)
                print(f"   ✅ {data['titre']:45} {data['prix']:>10} €")
                created += 1
            except Exception as e:
                print(f"   ❌ Error: {str(e)[:40]}")

        try:
            db.session.commit()
            print(f"\n✅ {created} listings created")
        except Exception as e:
            print(f"\n❌ Error committing: {e}")
            db.session.rollback()

        # Summary
        print("\n" + "="*70)
        print("📊 DATABASE SUMMARY")
        print("="*70)

        try:
            user_count = User.query.count()
            print(f"\n👥 Users: {user_count}")

            listing_count = Offre.query.count()
            print(f"🏠 Listings: {listing_count}")

        except Exception as e:
            print(f"⚠️  Could not get counts: {e}")

        print("\n✨ Phase 6 seeding complete!")

if __name__ == '__main__':
    main()
