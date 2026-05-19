-- Migration: Ajouter support Enum des rôles et profil acheteur complet
-- Date: 2026-05-18
-- Description:
--   1. Modifier la colonne 'role' pour utiliser un Enum (utilisateur, administrateur, notaire)
--   2. Ajouter la colonne 'is_profil_acheteur_complet' pour tracker si l'étape 2 est complétée

-- Créer le type Enum pour les rôles s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
        CREATE TYPE role_enum AS ENUM ('utilisateur', 'administrateur', 'notaire');
    END IF;
END
$$;

-- Ajouter la colonne 'is_profil_acheteur_complet' si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='utilisateurs' AND column_name='is_profil_acheteur_complet'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN is_profil_acheteur_complet BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- Mettre à jour la colonne 'role' pour utiliser l'Enum
-- ATTENTION: Cette opération change le type de la colonne
-- Si la colonne a des valeurs non standard, cette migration peut échouer
DO $$
BEGIN
    -- D'abord, mettre à jour les valeurs existantes pour qu'elles correspondent à l'Enum
    UPDATE utilisateurs SET role = 'utilisateur' WHERE role = 'user' OR role NOT IN ('utilisateur', 'administrateur', 'notaire');
    UPDATE utilisateurs SET role = 'administrateur' WHERE role = 'admin';

    -- Ensuite, changer le type de la colonne
    -- On doit créer une colonne temporaire, copier les données, supprimer l'ancienne, renommer la nouvelle
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
    END IF;
END
$$;

-- Ajouter un index sur 'is_profil_acheteur_complet' pour les recherches rapides
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename='utilisateurs' AND indexname='idx_utilisateurs_is_profil_acheteur_complet'
    ) THEN
        CREATE INDEX idx_utilisateurs_is_profil_acheteur_complet ON utilisateurs(is_profil_acheteur_complet);
    END IF;
END
$$;

-- Committer la migration
COMMIT;
