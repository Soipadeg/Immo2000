#!/usr/bin/env python3
"""Initialize database and create test user"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.app import create_app
from src.auth.models import db, User

def main():
    app = create_app()

    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✅ Database initialized")

        # Check if test user exists
        existing_user = User.query.filter_by(email='test@immo2000.fr').first()

        if existing_user:
            print(f"✅ Test user already exists")
            print(f"  Email: {existing_user.email}")
            print(f"  Name: {existing_user.prenom} {existing_user.nom}")
            print(f"  Buyer: {existing_user.est_acheteur}")
            print(f"  Seller: {existing_user.est_vendeur}")
            print(f"  Active role: {existing_user.role_actif}")
        else:
            # Create test user
            print("Creating test user...")
            user = User(
                email='test@immo2000.fr',
                nom='User',
                prenom='Test',
                role='acheteur',
                telephone='0600000000',
                adresse_contact='123 Rue Test, 75000 Paris',
                est_acheteur=True,
                est_vendeur=True,
                role_actif='acheteur',
                email_verified=True,
                actif=True
            )
            user.set_password('TestPassword123!')
            db.session.add(user)
            db.session.commit()
            print("✅ Test user created successfully!")
            print(f"  Email: test@immo2000.fr")
            print(f"  Password: TestPassword123!")
            print(f"  Can buy: True")
            print(f"  Can sell: True")

if __name__ == '__main__':
    main()
