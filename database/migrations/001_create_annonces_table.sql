-- Migration : Créer la table annonces
-- Date : 2026-05-04
-- Description : Table pour stocker les annonces immobilières avec tous les champs spécifiés

BEGIN;

-- Créer la table annonces
CREATE TABLE IF NOT EXISTS annonces (
    annonce_id SERIAL PRIMARY KEY,

    -- Champs obligatoires
    titre VARCHAR(100) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    prix DOUBLE PRECISION NOT NULL,
    surface DOUBLE PRECISION NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    code_postal VARCHAR(5) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    type_bien VARCHAR(50) NOT NULL,
    nombre_pieces INTEGER NOT NULL,

    -- Clé étrangère
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,

    -- Champs optionnels
    photos JSONB DEFAULT '[]'::jsonb,
    etage INTEGER,
    ascenseur BOOLEAN DEFAULT FALSE,
    balcon BOOLEAN DEFAULT FALSE,
    terrasse BOOLEAN DEFAULT FALSE,
    jardin BOOLEAN DEFAULT FALSE,
    piscine BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    dpe VARCHAR(1),
    annee_construction INTEGER,
    statut VARCHAR(20) NOT NULL DEFAULT 'brouillon',

    -- Métadonnées
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_prix_positive CHECK (prix > 0),
    CONSTRAINT check_surface_positive CHECK (surface > 0),
    CONSTRAINT check_nombre_pieces_min CHECK (nombre_pieces >= 1),
    CONSTRAINT check_statut_valid CHECK (statut IN ('brouillon', 'publiée', 'vendue', 'archivée')),
    CONSTRAINT check_type_bien_valid CHECK (type_bien IN ('maison', 'appartement', 'terrain', 'local commercial')),
    CONSTRAINT check_dpe_valid CHECK (dpe IS NULL OR dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    CONSTRAINT check_code_postal_format CHECK (code_postal ~ '^\d{5}$')
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_annonce_ville ON annonces(ville);
CREATE INDEX IF NOT EXISTS idx_annonce_code_postal ON annonces(code_postal);
CREATE INDEX IF NOT EXISTS idx_annonce_type_bien ON annonces(type_bien);
CREATE INDEX IF NOT EXISTS idx_annonce_utilisateur_id ON annonces(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_annonce_statut ON annonces(statut);
CREATE INDEX IF NOT EXISTS idx_annonce_ville_type_bien ON annonces(ville, type_bien);
CREATE INDEX IF NOT EXISTS idx_annonce_utilisateur_statut ON annonces(utilisateur_id, statut);
CREATE INDEX IF NOT EXISTS idx_annonce_code_postal_ville ON annonces(code_postal, ville);

-- Trigger pour mettre à jour date_modification automatiquement
CREATE OR REPLACE FUNCTION update_annonce_date_modification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_annonce_date_modification
BEFORE UPDATE ON annonces
FOR EACH ROW
EXECUTE FUNCTION update_annonce_date_modification();

COMMIT;
