#!/usr/bin/env python3
"""
Script de migration pour ajouter le système de planification de visite.

Crée les tables : creneaux_disponibles, rendez_vous, conversations
Modifie la table messages : ajout colonne conversation_id
Ajoute les relations nécessaires dans les modèles existants.

Supporte SQLite et PostgreSQL.

Usage:
    python backend/migrate_planification_visite.py
"""

import os
import sqlite3
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()


def get_database_url():
    """Détecte le type de base de données et retourne l'URL."""
    return os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        os.getenv("DATABASE_URL", "sqlite:///immo2000.db")
    )


def migrate_with_sqlite():
    """Applique la migration avec SQLite."""
    try:
        db_url = get_database_url()

        # Extraire le chemin du fichier SQLite
        if db_url.startswith("sqlite:///"):
            db_path = db_url.replace("sqlite:///", "")
        elif db_url.startswith("sqlite:////"):
            db_path = "/" + db_url.replace("sqlite:////", "")
        else:
            db_path = "immo2000.db"

        print(f"[MIGRATION] Utilisation de SQLite: {db_path}")

        if not os.path.exists(db_path):
            print(f"[MIGRATION] ❌ Base de données non trouvée: {db_path}")
            return False

        # Connexion à SQLite
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()

        print("[MIGRATION] Connexion à SQLite réussie")

        # === ÉTAPE 1 : Créer la table creneaux_disponibles ===
        print("[MIGRATION] Création de la table 'creneaux_disponibles'...")

        try:
            cursor.execute("""
                CREATE TABLE creneaux_disponibles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    utilisateur_id INTEGER NOT NULL,
                    jour TIMESTAMP NOT NULL,
                    heure_debut VARCHAR(5) NOT NULL,
                    heure_fin VARCHAR(5) NOT NULL,
                    est_disponible BOOLEAN DEFAULT TRUE,
                    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
                )
            """)

            # Créer les indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_creneau_utilisateur_jour
                ON creneaux_disponibles(utilisateur_id, jour)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_creneau_disponible
                ON creneaux_disponibles(est_disponible)
            """)

            print("[MIGRATION] ✓ Table 'creneaux_disponibles' créée")
        except sqlite3.OperationalError as e:
            if "already exists" in str(e):
                print("[MIGRATION] ℹ Table 'creneaux_disponibles' existe déjà")
            else:
                raise

        # === ÉTAPE 2 : Créer la table rendez_vous ===
        print("[MIGRATION] Création de la table 'rendez_vous'...")

        try:
            cursor.execute("""
                CREATE TABLE rendez_vous (
                    rdv_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    annonce_id INTEGER NOT NULL,
                    acheteur_id INTEGER NOT NULL,
                    vendeur_id INTEGER NOT NULL,
                    creneau_id INTEGER,
                    statut VARCHAR(30) DEFAULT 'en_attente',
                    message TEXT,
                    date_proposée TIMESTAMP,
                    date_confirmée TIMESTAMP,
                    rappel_envoye BOOLEAN DEFAULT FALSE,
                    date_rappel_envoi TIMESTAMP,
                    date_création TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    date_dernière_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (annonce_id) REFERENCES annonces(annonce_id) ON DELETE CASCADE,
                    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                    FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                    FOREIGN KEY (creneau_id) REFERENCES creneaux_disponibles(id) ON DELETE SET NULL
                )
            """)

            # Créer les indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_annonce_statut
                ON rendez_vous(annonce_id, statut)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_acheteur_statut
                ON rendez_vous(acheteur_id, statut)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_vendeur_statut
                ON rendez_vous(vendeur_id, statut)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_creneau
                ON rendez_vous(creneau_id)
            """)

            print("[MIGRATION] ✓ Table 'rendez_vous' créée")
        except sqlite3.OperationalError as e:
            if "already exists" in str(e):
                print("[MIGRATION] ℹ Table 'rendez_vous' existe déjà")
            else:
                raise

        # === ÉTAPE 3 : Créer la table conversations ===
        print("[MIGRATION] Création de la table 'conversations'...")

        try:
            cursor.execute("""
                CREATE TABLE conversations (
                    conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rdv_id INTEGER NOT NULL UNIQUE,
                    acheteur_id INTEGER NOT NULL,
                    vendeur_id INTEGER NOT NULL,
                    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rdv_id) REFERENCES rendez_vous(rdv_id) ON DELETE CASCADE,
                    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                    FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
                )
            """)

            # Créer les indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_conversation_acheteur
                ON conversations(acheteur_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_conversation_vendeur
                ON conversations(vendeur_id)
            """)

            print("[MIGRATION] ✓ Table 'conversations' créée")
        except sqlite3.OperationalError as e:
            if "already exists" in str(e):
                print("[MIGRATION] ℹ Table 'conversations' existe déjà")
            else:
                raise

        # === ÉTAPE 4 : Modifier la table messages (ajouter conversation_id) ===
        print("[MIGRATION] Vérification de la colonne 'conversation_id' dans 'messages'...")

        try:
            cursor.execute("PRAGMA table_info(messages)")
            columns = [col[1] for col in cursor.fetchall()]

            if not columns:
                print("[MIGRATION] ℹ Table 'messages' n'existe pas encore (sera créée automatiquement)")
            elif "conversation_id" not in columns:
                print("[MIGRATION] ➕ Ajout de la colonne 'conversation_id' à 'messages'...")
                cursor.execute("""
                    ALTER TABLE messages
                    ADD COLUMN conversation_id INTEGER
                    REFERENCES conversations(conversation_id) ON DELETE CASCADE
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_message_conversation
                    ON messages(conversation_id)
                """)
                print("[MIGRATION] ✓ Colonne 'conversation_id' ajoutée")
            else:
                print("[MIGRATION] ℹ Colonne 'conversation_id' existe déjà")
        except sqlite3.OperationalError as e:
            if "no such table" in str(e):
                print("[MIGRATION] ℹ Table 'messages' n'existe pas encore (sera créée automatiquement)")
            else:
                raise
        conn.close()

        return True

    except sqlite3.Error as e:
        print(f"[MIGRATION] ❌ Erreur SQLite: {e}")
        return False
    except Exception as e:
        print(f"[MIGRATION] ❌ Erreur: {e}")
        return False


def migrate_with_postgresql():
    """Applique la migration avec PostgreSQL."""
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

        # === ÉTAPE 1 : Créer la table creneaux_disponibles ===
        print("[MIGRATION] Création de la table 'creneaux_disponibles'...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS creneaux_disponibles (
                id SERIAL PRIMARY KEY,
                utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                jour TIMESTAMP NOT NULL,
                heure_debut VARCHAR(5) NOT NULL,
                heure_fin VARCHAR(5) NOT NULL,
                est_disponible BOOLEAN DEFAULT TRUE,
                date_creation TIMESTAMP DEFAULT NOW()
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_creneau_utilisateur_jour
            ON creneaux_disponibles(utilisateur_id, jour)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_creneau_disponible
            ON creneaux_disponibles(est_disponible)
        """)

        print("[MIGRATION] ✓ Table 'creneaux_disponibles' créée/vérifiée")

        # === ÉTAPE 2 : Créer la table rendez_vous ===
        print("[MIGRATION] Création de la table 'rendez_vous'...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rendez_vous (
                rdv_id SERIAL PRIMARY KEY,
                annonce_id INTEGER NOT NULL REFERENCES annonces(annonce_id) ON DELETE CASCADE,
                acheteur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                vendeur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                creneau_id INTEGER REFERENCES creneaux_disponibles(id) ON DELETE SET NULL,
                statut VARCHAR(30) DEFAULT 'en_attente',
                message TEXT,
                date_proposée TIMESTAMP,
                date_confirmée TIMESTAMP,
                rappel_envoye BOOLEAN DEFAULT FALSE,
                date_rappel_envoi TIMESTAMP,
                date_création TIMESTAMP DEFAULT NOW(),
                date_dernière_modification TIMESTAMP DEFAULT NOW()
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_annonce_statut
            ON rendez_vous(annonce_id, statut)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_acheteur_statut
            ON rendez_vous(acheteur_id, statut)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_vendeur_statut
            ON rendez_vous(vendeur_id, statut)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_creneau
            ON rendez_vous(creneau_id)
        """)

        print("[MIGRATION] ✓ Table 'rendez_vous' créée/vérifiée")

        # === ÉTAPE 3 : Créer la table conversations ===
        print("[MIGRATION] Création de la table 'conversations'...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                conversation_id SERIAL PRIMARY KEY,
                rdv_id INTEGER NOT NULL UNIQUE REFERENCES rendez_vous(rdv_id) ON DELETE CASCADE,
                acheteur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                vendeur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
                date_creation TIMESTAMP DEFAULT NOW()
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_conversation_acheteur
            ON conversations(acheteur_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_conversation_vendeur
            ON conversations(vendeur_id)
        """)

        print("[MIGRATION] ✓ Table 'conversations' créée/vérifiée")

        # === ÉTAPE 4 : Modifier la table messages ===
        print("[MIGRATION] Vérification de la colonne 'conversation_id' dans 'messages'...")

        try:
            cursor.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name='messages' AND column_name='conversation_id'
            """)

            if not cursor.fetchone():
                cursor.execute("""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name='messages'
                """)

                if not cursor.fetchone():
                    print("[MIGRATION] ℹ Table 'messages' n'existe pas encore (sera créée automatiquement)")
                else:
                    print("[MIGRATION] ➕ Ajout de la colonne 'conversation_id' à 'messages'...")
                    cursor.execute("""
                        ALTER TABLE messages
                        ADD COLUMN conversation_id INTEGER
                        REFERENCES conversations(conversation_id) ON DELETE CASCADE
                    """)
                    cursor.execute("""
                        CREATE INDEX IF NOT EXISTS idx_message_conversation
                        ON messages(conversation_id)
                    """)
                    print("[MIGRATION] ✓ Colonne 'conversation_id' ajoutée")
            else:
                print("[MIGRATION] ℹ Colonne 'conversation_id' existe déjà")
        except Exception as e:
            print(f"[MIGRATION] ℹ Impossible de vérifier messages: {e} (sera créée automatiquement si nécessaire)")
        conn.close()

        return True

    except ImportError:
        print("[MIGRATION] ❌ psycopg2 non installé. Installez-le avec: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"[MIGRATION] ❌ Erreur PostgreSQL: {e}")
        return False


def migrate_planification_visite():
    """Détecte le type de BD et applique la migration appropriée."""
    db_url = get_database_url()

    print("\n" + "="*60)
    print("[MIGRATION] AJOUT PLANIFICATION DE VISITE")
    print("="*60 + "\n")

    if "postgres" in db_url or "postgresql" in db_url:
        success = migrate_with_postgresql()
    else:
        success = migrate_with_sqlite()

    print("\n" + "="*60)
    if success:
        print("[MIGRATION] ✅ Migration réussie !")
        print("[MIGRATION] Tables créées/vérifiées :")
        print("  - creneaux_disponibles")
        print("  - rendez_vous")
        print("  - conversations")
        print("  - messages.conversation_id (colonne ajoutée)")
        print("="*60 + "\n")
        return 0
    else:
        print("[MIGRATION] ❌ Migration échouée")
        print("="*60 + "\n")
        return 1


if __name__ == "__main__":
    sys.exit(migrate_planification_visite())
