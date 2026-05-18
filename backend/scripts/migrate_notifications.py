#!/usr/bin/env python
"""Script pour créer la table notifications dans la base de données."""
import sys
import os

# Configuration
sys.path.insert(0, '/home/djali/code/Soipadeg/Immo2000/backend')
os.environ['FLASK_ENV'] = 'development'

try:
    from src.app import create_app
    from src.auth.models import db
    from src.models import Notification
    from sqlalchemy import inspect

    app = create_app()

    with app.app_context():
        print("[MIGRATION] Démarrage de la création de la table notifications...")

        # Vérifier si la table existe
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if 'notifications' in existing_tables:
            print("[OK] La table 'notifications' existe déjà")
        else:
            print("[CREATE] Création de la table 'notifications'...")
            try:
                # Créer la table
                Notification.__table__.create(db.engine, checkfirst=True)
                print("[OK] Table 'notifications' créée avec succès")

                # Vérifier les colonnes créées
                inspector = inspect(db.engine)
                columns = {col['name'] for col in inspector.get_columns('notifications')}
                print(f"[COLUMNS] Colonnes: {columns}")

            except Exception as e:
                print(f"[ERROR] Erreur lors de la création: {e}")
                import traceback
                traceback.print_exc()

        print("[DONE] Migration terminée")

except Exception as e:
    print(f"[ERROR] Erreur globale: {e}")
    import traceback
    traceback.print_exc()
