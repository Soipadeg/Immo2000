-- Migration: Create visites (visits) table
-- Description: Table pour gérer les réservations de visites entre acheteurs et annonces
-- Date: 2026-05-06

CREATE TABLE IF NOT EXISTS visites (
    id SERIAL PRIMARY KEY,
    acheteur_id INT NOT NULL,
    annonce_id INT NOT NULL,
    date_heure TIMESTAMP NOT NULL,
    statut VARCHAR(20) DEFAULT 'confirmee', -- 'confirmee', 'annulee', 'terminee'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (acheteur_id) REFERENCES acheteurs(id) ON DELETE CASCADE,
    FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE,
    CONSTRAINT unique_visite UNIQUE (annonce_id, date_heure)
);

-- Indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_visites_annonce_id ON visites(annonce_id);
CREATE INDEX IF NOT EXISTS idx_visites_acheteur_id ON visites(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_visites_date_heure ON visites(date_heure);
CREATE INDEX IF NOT EXISTS idx_visites_statut ON visites(statut);

-- Index composite pour lister les visites par vendeur (via annonce)
CREATE INDEX IF NOT EXISTS idx_visites_annonce_statut ON visites(annonce_id, statut);

COMMIT;
