#!/usr/bin/env python
"""Script simple pour ajouter les colonnes de vérification d'email."""
import sys
import os

# Configuration
sys.path.insert(0, '/home/djali/code/Soipadeg/Immo2000/backend')
os.environ['FLASK_ENV'] = 'development'

try:
    from src.app import create_app
    from src.auth.models import db
    from sqlalchemy import inspect, text

    app = create_app()

    with app.app_context():
        print("[MIGRATION] Démarrage...")

        # Get inspector
        inspector = inspect(db.engine)
        columns = {col['name'] for col in inspector.get_columns('utilisateurs')}
        print(f"[CHECK] Colonnes existantes: {columns}")

        # Ajouter les colonnes manquantes
        to_add = {
            'email_verified': 'BOOLEAN DEFAULT 0',
            'verification_token': 'VARCHAR(255)',
            'verification_token_expires': 'TIMESTAMP'
        }

        for col_name, col_type in to_add.items():
            if col_name not in columns:
                print(f"[ADD] Ajout de {col_name}...")
                try:
                    sql = f"ALTER TABLE utilisateurs ADD COLUMN {col_name} {col_type}"
                    db.session.execute(text(sql))
                    db.session.commit()
                    print(f"[OK] {col_name} ajouté")
                except Exception as e:
                    print(f"[WARN] {col_name}: {e}")
                    db.session.rollback()
            else:
                print(f"[OK] {col_name} existe déjà")

        print("[DONE] Migration terminée")

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
