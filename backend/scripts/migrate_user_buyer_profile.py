"""
Migration: Ajouter support Enum des rôles et profil acheteur complet
Date: 2026-05-18

Description:
    1. Modifier la colonne 'role' pour utiliser un Enum (utilisateur, administrateur, notaire)
    2. Ajouter la colonne 'is_profil_acheteur_complet' pour tracker si l'étape 2 est complétée
"""

import os
import psycopg2
from psycopg2 import sql

def migrate_user_buyer_profile():
    """
    Exécute la migration pour ajouter le support Enum des rôles et le champ is_profil_acheteur_complet.
    """

    # Récupérer la connexion DB
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'immo2000'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'password')
    }

    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()

    try:
        print("🔄 Migration: Ajouter support Enum des rôles et profil acheteur complet...")

        # 1. Créer le type Enum pour les rôles s'il n'existe pas
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
                    CREATE TYPE role_enum AS ENUM ('utilisateur', 'administrateur', 'notaire');
                END IF;
            END
            $$;
        """)
        print("✅ Type Enum 'role_enum' créé (ou existant)")

        # 2. Ajouter la colonne 'is_profil_acheteur_complet' si elle n'existe pas
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='utilisateurs' AND column_name='is_profil_acheteur_complet'
                ) THEN
                    ALTER TABLE utilisateurs ADD COLUMN is_profil_acheteur_complet BOOLEAN DEFAULT FALSE;
                    RAISE NOTICE 'Colonne is_profil_acheteur_complet ajoutée';
                ELSE
                    RAISE NOTICE 'Colonne is_profil_acheteur_complet existe déjà';
                END IF;
            END
            $$;
        """)
        print("✅ Colonne 'is_profil_acheteur_complet' ajoutée (ou existante)")

        # 3. Mettre à jour les valeurs existantes de 'role'
        cursor.execute("""
            UPDATE utilisateurs SET role = 'utilisateur'
            WHERE role = 'user' OR role NOT IN ('utilisateur', 'administrateur', 'notaire');
        """)
        cursor.execute("""
            UPDATE utilisateurs SET role = 'administrateur' WHERE role = 'admin';
        """)
        print("✅ Valeurs de 'role' mises à jour (user → utilisateur, admin → administrateur)")

        # 4. Changer le type de la colonne 'role' pour utiliser l'Enum
        cursor.execute("""
            DO $$
            BEGIN
                -- Vérifier si la colonne 'role' n'est pas déjà de type Enum
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='utilisateurs' AND column_name='role' AND data_type != 'USER-DEFINED'
                ) THEN
                    -- Créer une colonne temporaire avec le nouveau type Enum
                    ALTER TABLE utilisateurs ADD COLUMN role_temp role_enum;

                    -- Copier les données de l'ancienne colonne vers la nouvelle
                    UPDATE utilisateurs SET role_temp = role::role_enum;

                    -- Supprimer l'ancienne colonne
                    ALTER TABLE utilisateurs DROP COLUMN role;

                    -- Renommer la colonne temporaire
                    ALTER TABLE utilisateurs RENAME COLUMN role_temp TO role;

                    -- Ajouter une contrainte DEFAULT
                    ALTER TABLE utilisateurs ALTER COLUMN role SET DEFAULT 'utilisateur'::role_enum;

                    -- Ajouter une contrainte NOT NULL
                    ALTER TABLE utilisateurs ALTER COLUMN role SET NOT NULL;

                    RAISE NOTICE 'Colonne role convertie en type Enum';
                ELSE
                    RAISE NOTICE 'Colonne role est déjà de type Enum';
                END IF;
            END
            $$;
        """)
        print("✅ Colonne 'role' convertie en type Enum (ou déjà convertie)")

        # 5. Ajouter un index sur 'is_profil_acheteur_complet'
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE tablename='utilisateurs' AND indexname='idx_utilisateurs_is_profil_acheteur_complet'
                ) THEN
                    CREATE INDEX idx_utilisateurs_is_profil_acheteur_complet ON utilisateurs(is_profil_acheteur_complet);
                    RAISE NOTICE 'Index créé sur is_profil_acheteur_complet';
                ELSE
                    RAISE NOTICE 'Index sur is_profil_acheteur_complet existe déjà';
                END IF;
            END
            $$;
        """)
        print("✅ Index sur 'is_profil_acheteur_complet' créé (ou existant)")

        conn.commit()
        print("\n✅ Migration réussie!")
        return True

    except psycopg2.Error as e:
        conn.rollback()
        print(f"❌ Erreur PostgreSQL: {str(e)}")
        return False
    except Exception as e:
        conn.rollback()
        print(f"❌ Erreur: {str(e)}")
        return False
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    success = migrate_user_buyer_profile()
    exit(0 if success else 1)
