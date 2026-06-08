#!/usr/bin/env python3
"""
Phase 5b: Data Seeding - Docker Compatible

Creates test users without db.drop_all() (to avoid circular dependencies)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from src.app import create_app
from src.auth.models import db, User

app = create_app()

def seed():
    """Seed database with test users."""
    print("\n" + "="*70)
    print("🌱 PHASE 5b: DATA SEEDING (DOCKER COMPATIBLE)")
    print("="*70)

    with app.app_context():
        print("\n🧹 Preparing database...")

        # Create tables if they don't exist
        db.create_all()
        print("✅ Database tables ready")

        print("\n🧹 Clearing existing users...")
        try:
            User.query.delete()
            db.session.commit()
            print("✅ Old users cleared")
        except Exception as e:
            print(f"⚠️  Could not clear users: {e}")
            db.session.rollback()

        print("\n👥 Creating test users...")

        # Acheteurs
        users_data = [
            ('alice.martin@example.com', 'Martin', 'Alice', 'utilisateur'),
            ('bob.bernard@example.com', 'Bernard', 'Bob', 'utilisateur'),
            ('claire.dubois@example.com', 'Dubois', 'Claire', 'utilisateur'),
            ('david.moreau@example.com', 'Moreau', 'David', 'utilisateur'),
            ('emma.rousseau@example.com', 'Rousseau', 'Emma', 'utilisateur'),
            ('françois.fournier@example.com', 'Fournier', 'François', 'utilisateur'),
            ('gabrielle.laurent@example.com', 'Laurent', 'Gabrielle', 'utilisateur'),
            ('henry.lefebvre@example.com', 'Lefebvre', 'Henry', 'utilisateur'),
        ]

        created = 0
        for email, nom, prenom, role in users_data:
            try:
                # Check if user exists
                existing = User.query.filter_by(email=email).first()
                if existing:
                    print(f"  ⏭️  {prenom} {nom} (already exists)")
                    continue

                user = User(
                    email=email,
                    nom=nom,
                    prenom=prenom,
                    role=role,
                    email_verified=True,
                )
                user.set_password('password123')
                db.session.add(user)
                created += 1
                print(f"  ✅ {prenom} {nom} ({role})")
            except Exception as e:
                print(f"  ❌ Error creating {prenom}: {e}")
                db.session.rollback()

        db.session.commit()
        print(f"\n✅ {created} users created")

        print("\n" + "="*70)
        print("✅ PHASE 5b SEEDING COMPLETE")
        print("="*70)
        print(f"\n🎯 Test with any of these credentials:")
        print(f"   Email: alice.martin@example.com")
        print(f"   Password: password123")
        print(f"\n🚀 Backend ready for Phase 5c")
        print()

if __name__ == '__main__':
    seed()
