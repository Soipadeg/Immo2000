#!/usr/bin/env python
"""
Script de migration pour ajouter les colonnes de vérification d'email (email_verified, verification_token, verification_token_expires).
"""

import os
import sys
from pathlib import Path

# Ajouter le répertoire backend au chemin
sys.path.insert(0, str(Path(__file__).parent))

os.environ['FLASK_ENV'] = 'development'

from src.app import create_app
from src.auth.models import db
from sqlalchemy import inspect, text


def run_migration():
    """Exécute la migration de vérification d'email."""

    print("🔄 Démarrage de la migration email verification...")

    # Créer l'app Flask
    app = create_app()

    with app.app_context():
        try:
            # Vérifier que la table existe
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()

            if 'utilisateurs' not in tables:
                print("❌ Table 'utilisateurs' non trouvée. Créez d'abord les tables.")
                return False

            # Récupérer les colonnes existantes
            columns = {col['name'] for col in inspector.get_columns('utilisateurs')}
            print(f"\n📋 Colonnes existantes dans 'utilisateurs': {len(columns)}")

            # Vérifier les colonnes à ajouter
            required_columns = {
                'email_verified': 'BOOLEAN DEFAULT FALSE',
                'verification_token': 'VARCHAR(255) UNIQUE',
                'verification_token_expires': 'TIMESTAMP'
            }

            missing_columns = {col for col in required_columns if col not in columns}

            if not missing_columns:
                print("✅ Les colonnes de vérification d'email existent déjà !")
                return True

            print(f"\n🔧 Colonnes à ajouter: {missing_columns}")

            # Ajouter chaque colonne manquante
            for col_name in missing_columns:
                col_type = required_columns[col_name]
                sql = f"ALTER TABLE utilisateurs ADD COLUMN {col_name} {col_type};"

                try:
                    print(f"  ➕ Ajout de '{col_name}'...", end=" ")
                    db.session.execute(text(sql))
                    db.session.commit()
                    print("✓")
                except Exception as e:
                    # Colonne peut déjà exister
                    if 'already exists' in str(e) or 'duplicate' in str(e).lower():
                        print("⚠️  (existe déjà)")
                    else:
                        print(f"❌ {e}")
                        db.session.rollback()

            # Créer les index
            print("\n📈 Création des index...")
            indexes = [
                ('idx_utilisateurs_email_verified', 'email_verified'),
                ('idx_utilisateurs_verification_token', 'verification_token'),
            ]

            for idx_name, col_name in indexes:
                try:
                    sql = f"CREATE INDEX {idx_name} ON utilisateurs({col_name});"
                    print(f"  📌 Index '{idx_name}'...", end=" ")
                    db.session.execute(text(sql))
                    db.session.commit()
                    print("✓")
                except Exception as e:
                    if 'already exists' in str(e) or 'duplicate' in str(e).lower():
                        print("⚠️  (existe déjà)")
                    else:
                        print(f"❌ {e}")
                    db.session.rollback()

            # Vérification finale
            print("\n✅ Migration complétée avec succès !")

            # Vérifier les colonnes finales
            inspector = inspect(db.engine)
            final_columns = {col['name'] for col in inspector.get_columns('utilisateurs')}

            verified_cols = {col for col in required_columns if col in final_columns}
            print(f"✅ Colonnes vérifiées: {verified_cols}")

            return True

        except Exception as e:
            print(f"\n❌ Erreur lors de la migration: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
            import traceback
            traceback.print_exc()
            return False


if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
