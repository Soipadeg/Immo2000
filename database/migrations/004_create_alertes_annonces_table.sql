-- Migration: Créer la table alertes_annonces
-- Date: 2026-05-10
-- Description: Crée la table alertes_annonces pour gérer les alertes d'annonces des utilisateurs

BEGIN;

CREATE TABLE IF NOT EXISTS alertes_annonces (
    alerte_id SERIAL PRIMARY KEY,

    -- Foreign key
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,

    -- Nom et critères
    nom VARCHAR(200) NOT NULL,

    -- Critères de recherche
    ville VARCHAR(100) NULL,
    code_postal VARCHAR(5) NULL,
    type_bien VARCHAR(50) NULL,
    prix_min NUMERIC(12, 2) NULL,
    prix_max NUMERIC(12, 2) NULL,
    surface_min FLOAT NULL,
    surface_max FLOAT NULL,
    nombre_pieces_min INTEGER NULL,
    nombre_pieces_max INTEGER NULL,
    dpe VARCHAR(1) NULL,

    -- Équipements
    ascenseur BOOLEAN DEFAULT FALSE,
    balcon BOOLEAN DEFAULT FALSE,
    terrasse BOOLEAN DEFAULT FALSE,
    jardin BOOLEAN DEFAULT FALSE,
    piscine BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,

    -- Configuration
    actif BOOLEAN DEFAULT TRUE,
    frequence VARCHAR(50) NOT NULL DEFAULT 'quotidienne', -- 'quotidienne', 'hebdomadaire', 'immediatement'
    email_notification BOOLEAN DEFAULT TRUE,

    -- Métadonnées
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_derniere_notification TIMESTAMP WITH TIME ZONE NULL,
    date_derniere_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pour optimisation
CREATE INDEX IF NOT EXISTS idx_alerte_utilisateur ON alertes_annonces(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_alerte_utilisateur_actif ON alertes_annonces(utilisateur_id, actif);
CREATE INDEX IF NOT EXISTS idx_alerte_actif ON alertes_annonces(actif);
CREATE INDEX IF NOT EXISTS idx_alerte_ville ON alertes_annonces(ville);
CREATE INDEX IF NOT EXISTS idx_alerte_type_bien ON alertes_annonces(type_bien);
CREATE INDEX IF NOT EXISTS idx_alerte_frequence ON alertes_annonces(frequence);
CREATE INDEX IF NOT EXISTS idx_alerte_criteres ON alertes_annonces(type_bien, ville, prix_min, prix_max);

COMMIT;
