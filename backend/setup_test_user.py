#!/usr/bin/env python3
"""Script pour créer un utilisateur de test"""

import os
import sys

# Ajouter le chemin du projet au sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.app import create_app
from src.auth.models import User, db

def create_test_user():
    """Crée un utilisateur de test"""
    app = create_app()

    with app.app_context():
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter_by(email='test@immo2000.fr').first()

        if existing_user:
            print("✅ Utilisateur test existe déjà")
            print(f"📧 Email: test@immo2000.fr")
            print(f"🔐 Mot de passe: TestPassword123!")
            return

        # Créer l'utilisateur de test
        user = User(
            email='test@immo2000.fr',
            nom='Test',
            prenom='Utilisateur',
            role='acheteur',
            telephone='0600000000',
            adresse_contact='123 Rue Test, 75000 Paris',
            est_acheteur=True,
            est_vendeur=False,
            role_actif='acheteur',
            email_verified=True,
            actif=True
        )

        # Définir le mot de passe
        user.set_password('TestPassword123!')

        # Ajouter à la base de données
        db.session.add(user)
        db.session.commit()

        print("✅ Utilisateur test créé avec succès!")
        print(f"📧 Email: test@immo2000.fr")
        print(f"🔐 Mot de passe: TestPassword123!")
        print(f"👤 Nom: Test Utilisateur")
        print(f"🎭 Rôle: acheteur")

if __name__ == '__main__':
    create_test_user()
