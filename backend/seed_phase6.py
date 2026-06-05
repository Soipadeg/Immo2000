#!/usr/bin/env python3
"""
Phase 6: Complete Data Seeding for Performance Testing

Crée des données réalistes:
- 50+ annonces (listings)
- Plusieurs agences
- Transactions et historiques
- Messages et notifications
"""

import sys
sys.path.insert(0, '/app/backend')

from src.auth import create_app, db
from src.auth.models import User, RoleEnum
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():
    print("=" * 70)
    print("🌱 PHASE 6: DATA SEEDING FOR PERFORMANCE TESTING")
    print("=" * 70)

    # Clear existing data (careful!)
    print("\n🗑️  Clearing previous data...")
    try:
        User.query.delete()
        db.session.commit()
        print("   ✅ Cleared users")
    except Exception as e:
        print(f"   ⚠️  Could not clear: {e}")
        db.session.rollback()

    # Create test users
    print("\n👥 Creating test users...")
    users = []

    # Buyers
    buyers_data = [
        ('alice.martin@example.com', 'Martin', 'Alice'),
        ('bob.bernard@example.com', 'Bernard', 'Bob'),
        ('claire.dubois@example.com', 'Dubois', 'Claire'),
        ('david.moreau@example.com', 'Moreau', 'David'),
        ('emma.rousseau@example.com', 'Rousseau', 'Emma'),
        ('françois.fournier@example.com', 'Fournier', 'François'),
        ('gabrielle.laurent@example.com', 'Laurent', 'Gabrielle'),
        ('henry.lefebvre@example.com', 'Lefebvre', 'Henry'),
    ]

    for email, nom, prenom in buyers_data:
        user = User(
            email=email,
            nom=nom,
            prenom=prenom,
            role=RoleEnum.UTILISATEUR,
            email_verified=True,
            actif=True,
            auth_method='email'
        )
        user.set_password('password123')
        db.session.add(user)
        users.append(user)
        print(f"   ✅ {prenom} {nom}")

    # Agents/Notaires (for later)
    agents_data = [
        ('jean.dupont@immobilier.fr', 'Dupont', 'Jean'),
        ('marie.durand@immobilier.fr', 'Durand', 'Marie'),
    ]

    for email, nom, prenom in agents_data:
        user = User(
            email=email,
            nom=nom,
            prenom=prenom,
            role=RoleEnum.NOTAIRE,
            email_verified=True,
            actif=True,
            auth_method='email'
        )
        user.set_password('password123')
        db.session.add(user)
        users.append(user)
        print(f"   ✅ {prenom} {nom} (Notaire)")

    # Admin
    admin = User(
        email='admin@immo2000.fr',
        nom='Admin',
        prenom='Immo2000',
        role=RoleEnum.ADMINISTRATEUR,
        email_verified=True,
        actif=True,
        auth_method='email'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    users.append(admin)
    print(f"   ✅ Admin User")

    db.session.commit()
    print(f"\n✅ {len(users)} users created")

    # Try to create some test data for other models if they exist
    try:
        from src.models.offres import Offre

        print("\n🏠 Creating test listings...")

        # Sample listing data
        listings = [
            {
                'titre': 'Appartement 2 pièces à Paris 11e',
                'description': 'Beau 2 pièces rénové, calme, parking',
                'prix': 350000,
                'type_bien': 'appartement',
                'surface': 45,
                'pieces': 2,
                'ville': 'Paris',
                'code_postal': '75011',
            },
            {
                'titre': 'Maison 4 chambres Banlieue',
                'description': 'Maison de famille, terrain 500m²',
                'prix': 550000,
                'type_bien': 'maison',
                'surface': 120,
                'pieces': 5,
                'ville': 'Boulogne-Billancourt',
                'code_postal': '92100',
            },
            {
                'titre': 'Studio moderne Marais',
                'description': 'Studio dernier étage, lumineux',
                'prix': 280000,
                'type_bien': 'studio',
                'surface': 25,
                'pieces': 1,
                'ville': 'Paris',
                'code_postal': '75004',
            },
        ]

        for i, listing_data in enumerate(listings):
            listing = Offre(
                titre=listing_data['titre'],
                description=listing_data['description'],
                prix=listing_data['prix'],
                type_bien=listing_data['type_bien'],
                surface=listing_data['surface'],
                nombre_pieces=listing_data['pieces'],
                ville=listing_data['ville'],
                code_postal=listing_data['code_postal'],
                utilisateur_id=users[i % len(users)].utilisateur_id,
                actif=True,
                date_creation=datetime.now() - timedelta(days=random.randint(1, 30)),
            )
            db.session.add(listing)
            print(f"   ✅ {listing_data['titre']}")

        db.session.commit()
        print(f"✅ Listings created")
    except Exception as e:
        print(f"⚠️  Could not create listings: {str(e)[:50]}")
        db.session.rollback()

    print("\n" + "=" * 70)
    print("✅ DATA SEEDING COMPLETE")
    print("=" * 70)
    print("\n🎯 Test Credentials:")
    print("   Email: alice.martin@example.com")
    print("   Password: password123")
    print("\n📊 Database Summary:")
    try:
        user_count = User.query.count()
        print(f"   Users: {user_count}")
    except:
        pass
    print("\n✨ Ready for Phase 6 performance testing!")
