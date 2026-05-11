-- Migration 015: Create offres table for purchase offers
-- Purpose: Store purchase offers made by buyers on annonces

CREATE TABLE IF NOT EXISTS offres (
    offre_id SERIAL PRIMARY KEY,
    annonce_id INTEGER NOT NULL REFERENCES annonces(annonce_id) ON DELETE CASCADE,
    acheteur_id INTEGER NOT NULL REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    prix_propose DECIMAL(12,2) NOT NULL,
    statut VARCHAR(50) DEFAULT 'proposee',
    message VARCHAR(1000),
    date_offre TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reponse TIMESTAMP,
    conditions JSONB DEFAULT '{}'::jsonb
);

-- Create indices for efficient queries
CREATE INDEX idx_offres_annonce_id ON offres(annonce_id);
CREATE INDEX idx_offres_acheteur_id ON offres(acheteur_id);
CREATE INDEX idx_offres_statut ON offres(statut);
CREATE INDEX idx_offres_date_offre ON offres(date_offre DESC);
CREATE INDEX idx_offres_date_reponse ON offres(date_reponse DESC);

-- For vendor queries
CREATE INDEX idx_offres_annonce_statut ON offres(annonce_id, statut);
CREATE INDEX idx_offres_annonce_date ON offres(annonce_id, date_offre DESC);

-- For analytics
CREATE INDEX idx_offres_prix ON offres(prix_propose);
CREATE INDEX idx_offres_acheteur_statut ON offres(acheteur_id, statut);
