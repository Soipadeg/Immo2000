-- Migration: Créer la table biens
-- Date: 2026-05-05
-- Description: Crée la table biens pour gérer les propriétés immobilières avec leurs caractéristiques

BEGIN;

CREATE TABLE IF NOT EXISTS biens (
    bien_id SERIAL PRIMARY KEY,

    -- Foreign key
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(user_id) ON DELETE CASCADE,

    -- Localisation
    adresse VARCHAR(255) NOT NULL,
    code_postal VARCHAR(10) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NULL,
    longitude DOUBLE PRECISION NULL,

    -- Caractéristiques du bien
    type_bien VARCHAR(50) NOT NULL,
    surface INTEGER NOT NULL,
    nombre_pieces INTEGER NULL,
    nombre_chambres INTEGER NULL,
    nombre_salles_bain INTEGER NULL,
    etage INTEGER NULL,
    date_construction INTEGER NULL,

    -- Description
    description TEXT NULL,
    prix_demande NUMERIC(12, 2) NULL,

    -- État
    etat VARCHAR(50) NOT NULL DEFAULT 'bon',
    equipements TEXT NULL,
    commodites TEXT NULL,

    -- Métadonnées
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    -- Constraints
    CONSTRAINT check_surface_positive CHECK (surface > 0),
    CONSTRAINT check_pieces_positive CHECK (nombre_pieces IS NULL OR nombre_pieces >= 0),
    CONSTRAINT check_bedrooms_positive CHECK (nombre_chambres IS NULL OR nombre_chambres >= 0),
    CONSTRAINT check_type_bien_valid CHECK (
        type_bien IN ('appartement', 'maison', 'terrain', 'commercial', 'garage', 'parking')
    ),
    CONSTRAINT check_etat_valid CHECK (
        etat IN ('excellent', 'bon', 'moyen', 'mauvais', 'renovation_requise')
    )
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_bien_utilisateur ON biens(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_bien_actif ON biens(actif);
CREATE INDEX IF NOT EXISTS idx_bien_type_bien ON biens(type_bien);
CREATE INDEX IF NOT EXISTS idx_bien_ville ON biens(ville);
CREATE INDEX IF NOT EXISTS idx_bien_code_postal ON biens(code_postal);
CREATE INDEX IF NOT EXISTS idx_bien_utilisateur_actif ON biens(utilisateur_id, actif);
CREATE INDEX IF NOT EXISTS idx_bien_type_ville ON biens(type_bien, ville);

COMMIT;
