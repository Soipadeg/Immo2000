#!/usr/bin/env python3
import sys
sys.path.insert(0, '/app/backend')

from src.app import create_app, db
from src.models.utilisateurs import Utilisateur
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    existing = Utilisateur.query.filter_by(email='test@immo2000.fr').first()
    if existing:
        print("✓ Utilisateur test existe déjà")
    else:
        user = Utilisateur(
            email='test@immo2000.fr',
            nom='User',
            prenom='Test',
            telephone='+33612345678',
            mot_de_passe_hash=generate_password_hash('TestPassword123!'),
            role='user',
            email_verified=True,
            actif=True
        )
        db.session.add(user)
        db.session.commit()
        print(f"✓ Utilisateur créé: {user.email}")
