#!/usr/bin/env python
"""Script pour créer un utilisateur de test dans la base de données."""
import sys
import os

# Configuration
sys.path.insert(0, '/home/djali/code/Soipadeg/Immo2000/backend')
os.environ['FLASK_ENV'] = 'development'

from src.app import create_app
from src.auth.models import db, User
from datetime import datetime

try:
    app = create_app()

    with app.app_context():
        print("[CREATE USER] Création d'un utilisateur de test...")

        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter_by(email='test@immo2000.fr').first()

        if existing_user:
            print(f"[OK] Utilisateur existant trouvé: {existing_user.email}")
            print(f"     ID: {existing_user.utilisateur_id}")
            print(f"     Nom: {existing_user.prenom} {existing_user.nom}")
            print(f"     Rôle: {existing_user.role}")
            print(f"     Email vérifié: {existing_user.email_verified}")
        else:
            # Créer un nouvel utilisateur
            user = User(
                email='test@immo2000.fr',
                nom='Dupont',
                prenom='Jean',
                role='acheteur',
                telephone='+33612345678',
                adresse_contact='123 Rue de Paris, 75000 Paris',
                actif=True,
                email_verified=True,  # Email déjà vérifié pour tester
                auth_method='email'
            )

            # Hacher le mot de passe
            user.set_password('TestPassword123!')

            # Ajouter à la base
            db.session.add(user)
            db.session.commit()

            print("[OK] Utilisateur créé avec succès !")
            print(f"     Email: {user.email}")
            print(f"     Password: TestPassword123!")
            print(f"     ID: {user.utilisateur_id}")
            print(f"     Rôle: {user.role}")

        print("\n[INFO] Vous pouvez maintenant vous connecter à:")
        print("       http://127.0.0.1:5000/login.html")
        print("       avec les identifiants:")
        print("       📧 Email: test@immo2000.fr")
        print("       🔑 Mot de passe: TestPassword123!")

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
