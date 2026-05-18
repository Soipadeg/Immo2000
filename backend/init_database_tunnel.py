#!/usr/bin/env python3
"""
Script pour initialiser la base de données avec les modèles mis à jour
(Tunnel d'annonce + Photos + Contrat d'exclusivité)

Usage:
    python backend/init_database_tunnel.py
"""

import os
import sys
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.app import create_app
from src.auth.models import db, User
from src.models.annonces import Annonce
from src.models.photos import Photo


def init_database():
    """Initialise la base de données avec tous les modèles"""

    app = create_app()

    with app.app_context():
        print("[INIT] 🔄 Initialisation de la base de données...")

        # Créer toutes les tables
        db.create_all()
        print("[INIT] ✅ Tables créées/vérifiées")

        # Déterminer le type de BD et vérifier les colonnes manquantes
        db_url = os.getenv("SQLALCHEMY_DATABASE_URI", "sqlite:///immo2000.db")

        if "sqlite" in db_url:
            add_missing_columns_sqlite(db_url)
        elif "postgres" in db_url or "postgresql" in db_url:
            add_missing_columns_postgresql()

        print("[INIT] ✅ Colonnes vérifiées")

        # Afficher les statistiques
        print_database_stats()

        print("[INIT] 🎉 Initialisation terminée !")


def add_missing_columns_sqlite(db_url):
    """Ajoute les colonnes manquantes pour SQLite"""
    try:
        # Extraire le chemin du fichier SQLite
        if db_url.startswith("sqlite:///"):
            db_path = db_url.replace("sqlite:///", "")
        elif db_url.startswith("sqlite:////"):
            db_path = "/" + db_url.replace("sqlite:////", "")
        else:
            db_path = "immo2000.db"

        if not os.path.exists(db_path):
            print(f"[INIT] 📁 Création de la base de données: {db_path}")
            return

        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()

        # Vérifier et ajouter has_exclusivity_contract
        cursor.execute("PRAGMA table_info(utilisateurs)")
        columns = [col[1] for col in cursor.fetchall()]

        if "has_exclusivity_contract" not in columns:
            print("[INIT] ➕ Ajout de la colonne 'has_exclusivity_contract'...")
            cursor.execute("""
                ALTER TABLE utilisateurs
                ADD COLUMN has_exclusivity_contract BOOLEAN DEFAULT FALSE
            """)
            conn.commit()
            print("[INIT] ✓ Colonne 'has_exclusivity_contract' ajoutée")
        else:
            print("[INIT] ℹ Colonne 'has_exclusivity_contract' existe déjà")

        conn.close()

    except Exception as e:
        print(f"[INIT] ⚠️ Erreur SQLite: {e}")


def add_missing_columns_postgresql():
    """Ajoute les colonnes manquantes pour PostgreSQL"""
    try:
        import psycopg2

        DB_HOST = os.getenv("DB_HOST", "localhost")
        DB_PORT = os.getenv("DB_PORT", "5432")
        DB_NAME = os.getenv("DB_NAME", "immo2000")
        DB_USER = os.getenv("DB_USER", "postgres")
        DB_PASSWORD = os.getenv("DB_PASSWORD", "")

        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()

        # Vérifier si la colonne existe
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='utilisateurs' AND column_name='has_exclusivity_contract'
        """)

        if not cursor.fetchone():
            print("[INIT] ➕ Ajout de la colonne 'has_exclusivity_contract'...")
            cursor.execute("""
                ALTER TABLE utilisateurs
                ADD COLUMN has_exclusivity_contract BOOLEAN DEFAULT FALSE
            """)
            conn.commit()
            print("[INIT] ✓ Colonne 'has_exclusivity_contract' ajoutée")
        else:
            print("[INIT] ℹ Colonne 'has_exclusivity_contract' existe déjà")

        cursor.close()
        conn.close()

    except ImportError:
        print("[INIT] ⚠️ psycopg2 non installé, sautons la vérification PostgreSQL")
    except Exception as e:
        print(f"[INIT] ⚠️ Erreur PostgreSQL: {e}")


def print_database_stats():
    """Affiche les statistiques de la base de données"""
    try:
        from src.app import create_app
        from src.auth.models import User
        from src.models.annonces import Annonce
        from src.models.photos import Photo

        app = create_app()
        with app.app_context():
            user_count = User.query.count()
            annonce_count = Annonce.query.count()
            photo_count = Photo.query.count()

            print("\n[INIT] 📊 Statistiques:")
            print(f"  - Utilisateurs: {user_count}")
            print(f"  - Annonces: {annonce_count}")
            print(f"  - Photos: {photo_count}")
    except Exception as e:
        print(f"[INIT] Erreur lors de l'affichage des stats: {e}")


if __name__ == "__main__":
    init_database()
