#!/usr/bin/env python
"""
Script pour exécuter les migrations et tester le système notaires.
"""

import os
import sys
from pathlib import Path
from sqlalchemy import text, inspect
from dotenv import load_dotenv

# Load env
load_dotenv()

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from src.app import create_app
from src.auth.models import db, User
from src.models.notaires import (
    Notaire, NotaireSpecialisation, TransactionNotaire,
    DocumentNotaire, HistoriqueNotaire, DisponibiliteNotaire
)
from src.models.offres import Offre
from src.models.annonces import Annonce


def run_migrations(app):
    """Exécuter les fichiers de migration SQL."""
    print("\n🔄 Exécution des migrations...")

    migrations_dir = Path(__file__).parent / "database" / "migrations"
    migration_files = sorted([f for f in migrations_dir.glob("*.sql")])

    # Filter for notaire migrations (016-021)
    notaire_migrations = [f for f in migration_files if f.name.startswith(('016', '017', '018', '019', '020', '021'))]

    with app.app_context():
        for migration_file in notaire_migrations:
            print(f"  📝 Exécution: {migration_file.name}")

            with open(migration_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()

            try:
                # Split par -- (commentaires) et ; (fin de statement)
                statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

                for statement in statements:
                    if statement:
                        db.session.execute(text(statement))

                db.session.commit()
                print(f"    ✅ {migration_file.name} exécutée avec succès")

            except Exception as e:
                db.session.rollback()
                print(f"    ⚠️  {migration_file.name}: {str(e)}")


def verify_tables(app):
    """Vérifier que les tables ont été créées."""
    print("\n🔍 Vérification des tables...")

    with app.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()

        required_tables = [
            'notaires',
            'notaire_specialisations',
            'transaction_notaire',
            'document_notaire',
            'historique_notaire',
            'disponibilite_notaire'
        ]

        for table_name in required_tables:
            if table_name in tables:
                columns = [col['name'] for col in inspector.get_columns(table_name)]
                print(f"  ✅ {table_name}: {len(columns)} colonnes")
            else:
                print(f"  ❌ {table_name}: TABLE MANQUANTE")


def run_tests(app):
    """Exécuter les tests unitaires."""
    print("\n🧪 Exécution des tests unitaires...")

    with app.app_context():
        # Test 1: Create notaire
        print("  Test 1: Création d'un notaire...")
        try:
            user = User(
                email="test.notaire@test.fr",
                nom="Test",
                prenom="Notaire",
                role="notaire"
            )
            user.set_password("testpassword123")
            db.session.add(user)
            db.session.flush()

            notaire = Notaire(
                utilisateur_id=user.utilisateur_id,
                etude_notariale="Étude Test",
                numero_rpps="TEST123456789",
                adresse_etude="123 Rue de Test",
                code_postal_etude="75001",
                ville_etude="Paris",
                telephone="01.23.45.67.89",
                email_professionnel="test@etude.fr",
                zone_geographique={
                    "villes": ["Paris", "Boulogne"],
                    "codes_postaux": ["75001", "75002", "92100"]
                }
            )
            db.session.add(notaire)
            db.session.commit()
            print("    ✅ Notaire créé avec succès")
        except Exception as e:
            db.session.rollback()
            print(f"    ❌ Erreur: {str(e)}")

        # Test 2: Create specialisation
        print("  Test 2: Ajout d'une spécialisation...")
        try:
            spec = NotaireSpecialisation(
                notaire_id=notaire.notaire_id,
                type_specialisation="vente"
            )
            db.session.add(spec)
            db.session.commit()
            print("    ✅ Spécialisation ajoutée avec succès")
        except Exception as e:
            db.session.rollback()
            print(f"    ❌ Erreur: {str(e)}")

        # Test 3: Create transaction notaire
        print("  Test 3: Création d'une transaction notaire...")
        try:
            # Create users
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("pwd")

            acheteur = User(
                email="acheteur@test.fr",
                nom="Acheteur",
                prenom="Test",
                role="acheteur"
            )
            acheteur.set_password("pwd")

            db.session.add_all([vendeur, acheteur])
            db.session.flush()

            # Create annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Appartement à vendre",
                description="Bel appartement",
                type_bien="appartement",
                adresse="10 Rue de Test",
                code_postal="75001",
                ville="Paris",
                superficie=80,
                prix=350000,
                statut="publiee"
            )
            db.session.add(annonce)
            db.session.flush()

            # Create offre
            offre = Offre(
                annonce_id=annonce.annonce_id,
                utilisateur_id=acheteur.utilisateur_id,
                prix_offert=350000,
                conditions="Selon acte",
                statut="acceptee"
            )
            db.session.add(offre)
            db.session.flush()

            # Create transaction
            transaction = TransactionNotaire(
                offre_id=offre.offre_id,
                annonce_id=annonce.annonce_id,
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                prix_compromis=350000,
                statut="en_attente_selection"
            )
            db.session.add(transaction)
            db.session.commit()
            print("    ✅ Transaction créée avec succès")
        except Exception as e:
            db.session.rollback()
            print(f"    ❌ Erreur: {str(e)}")

        # Test 4: Assign notaire
        print("  Test 4: Assignation d'un notaire...")
        try:
            transaction.notaire_id = notaire.notaire_id
            transaction.statut = "en_attente_validation"

            historique = HistoriqueNotaire(
                transaction_notaire_id=transaction.transaction_notaire_id,
                notaire_id=notaire.notaire_id,
                type_action="assignment",
                description="Test assignment",
                ancien_statut="en_attente_selection",
                nouveau_statut="en_attente_validation"
            )
            db.session.add(historique)
            db.session.commit()
            print("    ✅ Notaire assigné avec succès")
        except Exception as e:
            db.session.rollback()
            print(f"    ❌ Erreur: {str(e)}")

        # Test 5: Query tests
        print("  Test 5: Requêtes de vérification...")
        try:
            notaires_count = db.session.query(Notaire).count()
            transactions_count = db.session.query(TransactionNotaire).count()
            historique_count = db.session.query(HistoriqueNotaire).count()

            print(f"    ✅ {notaires_count} notaire(s) en BD")
            print(f"    ✅ {transactions_count} transaction(s) en BD")
            print(f"    ✅ {historique_count} entrée(s) historique en BD")
        except Exception as e:
            print(f"    ❌ Erreur: {str(e)}")


def main():
    """Main entry point."""
    print("=" * 60)
    print("🚀 NOTAIRE SYSTEM - Migration & Test Script")
    print("=" * 60)

    # Create app
    app = create_app("development")

    with app.app_context():
        # Drop existing tables for clean test
        print("\n💥 Nettoyage des tables existantes...")
        db.drop_all()

        # Create all tables via SQLAlchemy
        print("📦 Création des tables via SQLAlchemy...")
        db.create_all()

        # Run migrations
        run_migrations(app)

        # Verify tables
        verify_tables(app)

        # Run tests
        run_tests(app)

    print("\n" + "=" * 60)
    print("✅ Migration et tests complétés!")
    print("=" * 60)


if __name__ == "__main__":
    main()
