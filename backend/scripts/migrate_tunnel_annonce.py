"""
Script Python pour appliquer la migration 002 à la base de données.
Supporte PostgreSQL ET SQLite.

Usage:
    python backend/migrate_tunnel_annonce.py
"""

import os
import sqlite3
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def get_database_url():
    """Détecte le type de base de données et retourne l'URL"""
    return os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        os.getenv("DATABASE_URL", "sqlite:///immo2000.db")
    )


def migrate_with_sqlite():
    """Applique la migration avec SQLite"""
    try:
        db_url = get_database_url()

        # Extraire le chemin du fichier SQLite
        # Format: sqlite:///path/to/database.db ou sqlite:////absolute/path.db
        if db_url.startswith("sqlite:///"):
            db_path = db_url.replace("sqlite:///", "")
        elif db_url.startswith("sqlite:////"):
            db_path = "/" + db_url.replace("sqlite:////", "")
        else:
            db_path = "immo2000.db"

        print(f"[MIGRATION] Utilisation de SQLite: {db_path}")

        # Connexion à SQLite
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()

        print("[MIGRATION] Connexion à SQLite réussie")

        # === ÉTAPE 1 : Créer la table photos ===
        print("[MIGRATION] Création de la table 'photos'...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS photos (
                photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
                annonce_id INTEGER NOT NULL,
                url VARCHAR(500) NOT NULL,
                nom_fichier VARCHAR(255) NOT NULL,
                ordre INTEGER DEFAULT 0,
                largeur INTEGER,
                hauteur INTEGER,
                taille_bytes INTEGER,
                date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (annonce_id) REFERENCES annonces(annonce_id) ON DELETE CASCADE
            )
        """)

        # Créer l'index
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_annonce_ordre
            ON photos(annonce_id, ordre)
        """)

        print("[MIGRATION] ✓ Table 'photos' créée")

        # === ÉTAPE 2 : Ajouter la colonne has_exclusivity_contract ===
        print("[MIGRATION] Vérification de la colonne 'has_exclusivity_contract'...")

        cursor.execute("PRAGMA table_info(utilisateurs)")
        columns = [column[1] for column in cursor.fetchall()]

        if "has_exclusivity_contract" not in columns:
            cursor.execute("""
                ALTER TABLE utilisateurs
                ADD COLUMN has_exclusivity_contract BOOLEAN DEFAULT FALSE
            """)
            print("[MIGRATION] ✓ Colonne 'has_exclusivity_contract' ajoutée")
        else:
            print("[MIGRATION] ℹ Colonne 'has_exclusivity_contract' existe déjà")

        conn.commit()
        cursor.close()
        conn.close()

        return True

    except sqlite3.Error as e:
        print(f"[MIGRATION] ❌ Erreur SQLite: {e}")
        return False
    except Exception as e:
        print(f"[MIGRATION] ❌ Erreur: {e}")
        return False


def migrate_with_postgresql():
    """Applique la migration avec PostgreSQL"""
    try:
        import psycopg2

        DB_HOST = os.getenv("DB_HOST", "localhost")
        DB_PORT = os.getenv("DB_PORT", "5432")
        DB_NAME = os.getenv("DB_NAME", "immo2000")
        DB_USER = os.getenv("DB_USER", "postgres")
        DB_PASSWORD = os.getenv("DB_PASSWORD", "")

        print(f"[MIGRATION] Utilisation de PostgreSQL: {DB_NAME}@{DB_HOST}")

        # Connexion à PostgreSQL
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()

        print("[MIGRATION] Connexion à PostgreSQL réussie")

        # Lire le script SQL PostgreSQL
        with open("database/migrations/002_add_photos_and_exclusivity_contract.sql", "r") as f:
            sql_script = f.read()

        print("[MIGRATION] Exécution du script SQL...")

        # Exécuter le script
        cursor.execute(sql_script)
        conn.commit()

        print("[MIGRATION] ✅ Migration 002 appliquée avec succès !")
        print("[MIGRATION] - Table 'photos' créée")
        print("[MIGRATION] - Colonne 'has_exclusivity_contract' ajoutée")
        print("[MIGRATION] - Index créés")

        cursor.close()
        conn.close()

        return True

    except ImportError:
        print("[MIGRATION] ❌ psycopg2 non installé. Installez-le avec: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"[MIGRATION] ❌ Erreur PostgreSQL: {e}")
        return False


def migrate_tunnel_annonce():
    """Détecte le type de DB et applique la migration appropriée"""
    db_url = get_database_url()

    if "postgres" in db_url or "postgresql" in db_url:
        return migrate_with_postgresql()
    else:
        return migrate_with_sqlite()


if __name__ == "__main__":
    success = migrate_tunnel_annonce()
    exit(0 if success else 1)
