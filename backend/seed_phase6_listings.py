#!/usr/bin/env python3
"""
Phase 6: Data Seeding - Create test listings for performance testing

Creates realistic test data:
- Multiple listings in different cities
- Different property types
- Realistic prices and features
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from src.app import create_app
from src.auth.models import db, User
from src.models.annonces import Annonce
from datetime import datetime, timedelta
import random

app = create_app()

def seed():
    """Seed database with test listings."""
    print("\n" + "="*70)
    print("🌱 PHASE 6: CREATE TEST LISTINGS")
    print("="*70)

    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        print("\n✅ Database tables ready")

        # Get existing users
        users = User.query.all()

        if not users:
            print("\n❌ No users found!")
            print("   First run: docker-compose exec -T backend python3 /app/backend/seed_docker.py")
            return

        print(f"\n✅ Found {len(users)} existing users")

        # Clear existing listings to avoid duplicates
        print("\n🧹 Clearing existing listings...")
        try:
            Annonce.query.delete()
            db.session.commit()
            print("✅ Old listings cleared")
        except Exception as e:
            print(f"⚠️  Could not clear listings: {e}")
            db.session.rollback()

        print("\n🏠 Creating test listings...\n")

        listings_data = [
            # Paris 11e
            {
                'titre': 'Appartement 2 pièces Paris 11e - Sympa',
                'description': 'Beau 2 pièces rénové, calme, parking inclus, proche métro Bastille',
                'prix': 350000,
                'surface': 45,
                'adresse': '42 Rue de Charonne',
                'code_postal': '75011',
                'ville': 'Paris',
                'type_bien': 'appartement',
                'nombre_pieces': 2,
                'dpe': 'B',
                'etage': 3,
                'ascenseur': True,
                'balcon': False,
                'parking': True,
            },
            # Marais
            {
                'titre': 'Studio moderne Marais - Vue Bastille',
                'description': 'Studio dernier étage, lumineux, balcon, proche restaurants',
                'prix': 280000,
                'surface': 25,
                'adresse': '18 Rue des Rosiers',
                'code_postal': '75004',
                'ville': 'Paris',
                'type_bien': 'studio',
                'nombre_pieces': 1,
                'dpe': 'A',
                'etage': 6,
                'ascenseur': False,
                'balcon': True,
                'parking': False,
            },
            # Paris 14e
            {
                'titre': '3 pièces lumineux Paris 14e - Parc Montsouris',
                'description': '3 pièces avec balcon, vue sur parc, excellente exposition',
                'prix': 420000,
                'surface': 65,
                'adresse': '35 Avenue Reille',
                'code_postal': '75014',
                'ville': 'Paris',
                'type_bien': 'appartement',
                'nombre_pieces': 3,
                'dpe': 'B',
                'etage': 2,
                'ascenseur': True,
                'balcon': True,
                'parking': True,
            },
            # Boulogne-Billancourt
            {
                'titre': 'Maison 4 chambres Boulogne - Famille',
                'description': 'Maison de famille, terrain 500m², garage, sans vis-à-vis',
                'prix': 550000,
                'surface': 120,
                'adresse': '8 Avenue Edmond de Rotschild',
                'code_postal': '92100',
                'ville': 'Boulogne-Billancourt',
                'type_bien': 'maison',
                'nombre_pieces': 5,
                'dpe': 'C',
                'etage': 0,
                'ascenseur': False,
                'jardin': True,
                'parking': True,
            },
            # Neuilly-sur-Seine
            {
                'titre': 'Villa 5 chambres Neuilly - Prestige',
                'description': 'Villa avec piscine, terrain 800m², pool house',
                'prix': 950000,
                'surface': 180,
                'adresse': '15 Boulevard du Château',
                'code_postal': '92200',
                'ville': 'Neuilly-sur-Seine',
                'type_bien': 'maison',
                'nombre_pieces': 6,
                'dpe': 'B',
                'etage': 0,
                'piscine': True,
                'jardin': True,
                'parking': True,
            },
            # Vincennes
            {
                'titre': 'Maison 3 chambres Vincennes - Parc',
                'description': 'Maison mitoyenne, proximité Château, petite cour',
                'prix': 650000,
                'surface': 95,
                'adresse': '12 Avenue de Paris',
                'code_postal': '94300',
                'ville': 'Vincennes',
                'type_bien': 'maison',
                'nombre_pieces': 4,
                'dpe': 'D',
                'etage': 0,
                'jardin': True,
                'parking': False,
            },
            # Paris 5e - Duplex
            {
                'titre': 'Duplex 4 pièces Paris 5e - Latin',
                'description': 'Duplex avec terrasse, deux niveaux, poutres apparentes',
                'prix': 480000,
                'surface': 85,
                'adresse': '45 Rue Mouffetard',
                'code_postal': '75005',
                'ville': 'Paris',
                'type_bien': 'appartement',
                'nombre_pieces': 4,
                'dpe': 'B',
                'etage': 4,
                'ascenseur': True,
                'balcon': False,
                'terrasse': True,
            },
            # Paris 13e
            {
                'titre': 'T4 rénové Paris 13e - Butte aux Cailles',
                'description': 'Appartement neuf, toutes commodités, accès transports',
                'prix': 395000,
                'surface': 72,
                'adresse': '58 Rue des Cinq Diamants',
                'code_postal': '75013',
                'ville': 'Paris',
                'type_bien': 'appartement',
                'nombre_pieces': 4,
                'dpe': 'A',
                'etage': 2,
                'ascenseur': True,
                'balcon': True,
                'parking': False,
            },
            # Bagneux
            {
                'titre': '2 pièces neuf Bagneux - Métro',
                'description': 'T2 tout neuf, balcon, parking, proche RER',
                'prix': 260000,
                'surface': 50,
                'adresse': '102 Avenue du Président Kennedy',
                'code_postal': '92220',
                'ville': 'Bagneux',
                'type_bien': 'appartement',
                'nombre_pieces': 2,
                'dpe': 'A',
                'etage': 1,
                'ascenseur': True,
                'balcon': True,
                'parking': True,
            },
            # Saint-Denis
            {
                'titre': 'Maison 3 étages Saint-Denis - Affaire',
                'description': 'Maison de ville, 3 étages, petit cour, cave',
                'prix': 380000,
                'surface': 110,
                'adresse': '7 Rue Jean Jaurès',
                'code_postal': '93200',
                'ville': 'Saint-Denis',
                'type_bien': 'maison',
                'nombre_pieces': 4,
                'dpe': 'D',
                'etage': 0,
                'parking': True,
            },
        ]

        created = 0
        for i, data in enumerate(listings_data):
            try:
                listing = Annonce(
                    titre=data['titre'],
                    description=data['description'],
                    prix=data['prix'],
                    surface=data['surface'],
                    adresse=data['adresse'],
                    code_postal=data['code_postal'],
                    ville=data['ville'],
                    type_bien=data['type_bien'],
                    nombre_pieces=data['nombre_pieces'],
                    dpe=data.get('dpe', 'C'),
                    etage=data.get('etage'),
                    ascenseur=data.get('ascenseur', False),
                    balcon=data.get('balcon', False),
                    terrasse=data.get('terrasse', False),
                    jardin=data.get('jardin', False),
                    piscine=data.get('piscine', False),
                    parking=data.get('parking', False),
                    utilisateur_id=users[i % len(users)].utilisateur_id,
                    statut='publiée',
                    date_creation=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
                    date_modification=datetime.utcnow(),
                    date_statut=datetime.utcnow(),
                )
                db.session.add(listing)
                print(f"   ✅ {data['titre']:55} {data['prix']:>10} €")
                created += 1
            except Exception as e:
                print(f"   ❌ Error creating listing: {str(e)[:50]}")
                db.session.rollback()

        try:
            db.session.commit()
            print(f"\n✅ {created} listings created successfully")
        except Exception as e:
            print(f"\n❌ Error committing: {e}")
            db.session.rollback()

        # Summary
        print("\n" + "="*70)
        print("📊 DATABASE SUMMARY")
        print("="*70)

        try:
            user_count = User.query.count()
            listing_count = Annonce.query.count()

            print(f"\n👥 Users: {user_count}")
            print(f"🏠 Listings: {listing_count}")

            # Show some stats
            listings_by_city = db.session.query(
                Annonce.ville,
                db.func.count(Annonce.annonce_id).label('count')
            ).group_by(Annonce.ville).all()

            print(f"\n📍 Listings by city:")
            for city, count in listings_by_city:
                print(f"   • {city}: {count}")

        except Exception as e:
            print(f"⚠️  Could not get stats: {e}")

        print("\n✨ Phase 6 data seeding complete!")

if __name__ == '__main__':
    seed()
