#!/usr/bin/env python3
"""
Phase 5b: Data Seeding - Ultra Simple Version

Using direct Python models without SQL
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from src.app import create_app
from src.auth.models import db, User

app = create_app()

def seed():
    """Seed database with simple data."""
    print("\n" + "="*70)
    print("🌱 PHASE 5b: DATA SEEDING")
    print("="*70)

    with app.app_context():
        print("\n🧹 Clearing database...")
        db.drop_all()
        db.create_all()
        print("✅ Done")

        print("\n👥 Creating users...")

        # Acheteurs
        users = []
        acheteurs = [
            ('alice.martin@example.com', 'Martin', 'Alice', 'acheteur'),
            ('bob.bernard@example.com', 'Bernard', 'Bob', 'acheteur'),
            ('claire.dubois@example.com', 'Dubois', 'Claire', 'acheteur'),
            ('david.moreau@example.com', 'Moreau', 'David', 'acheteur'),
            ('emma.rousseau@example.com', 'Rousseau', 'Emma', 'acheteur'),
        ]

        # Vendeurs
        vendeurs = [
            ('françois.fournier@example.com', 'Fournier', 'François', 'vendeur'),
            ('gabrielle.laurent@example.com', 'Laurent', 'Gabrielle', 'vendeur'),
            ('henry.lefebvre@example.com', 'Lefebvre', 'Henry', 'vendeur'),
        ]

        for email, nom, prenom, role in acheteurs + vendeurs:
            user = User(
                email=email,
                nom=nom,
                prenom=prenom,
                role=role,
                email_verified=True,
            )
            user.set_password('password123')
            db.session.add(user)
            users.append(user)
            print(f"  ✅ {prenom} {nom} ({role})")

        db.session.commit()
        print(f"\n✅ {len(users)} utilisateurs créés")

        print("\n" + "="*70)
        print("✅ PHASE 5b SEEDING COMPLETE")
        print("="*70)
        print(f"\n🎯 Utilisateurs créés:")
        for email, nom, prenom, role in (acheteurs + vendeurs)[:3]:
            print(f"   Email: {email}")
            print(f"   Password: password123")
        print(f"\n🚀 Backend prêt pour Phase 5c (Frontend Integration)")
        print()

if __name__ == '__main__':
    seed()
