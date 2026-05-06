-- Migration 005: Créer la table feedbacks pour les avis post-visite
-- Date: 2026-05-06
-- Description: Permet aux acheteurs de laisser des retours sur les visites

-- Table feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    visite_id INT NOT NULL,
    acheteur_id INT NOT NULL,
    note INT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    reponse_vendeur TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_feedbacks_visite
        FOREIGN KEY (visite_id) REFERENCES visites(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedbacks_acheteur
        FOREIGN KEY (acheteur_id) REFERENCES acheteurs(id) ON DELETE CASCADE,
    CONSTRAINT unique_feedback_per_visite
        UNIQUE (visite_id, acheteur_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_feedbacks_visite_id ON feedbacks(visite_id);
CREATE INDEX idx_feedbacks_acheteur_id ON feedbacks(acheteur_id);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feedbacks_updated_at
BEFORE UPDATE ON feedbacks
FOR EACH ROW
EXECUTE FUNCTION update_feedbacks_updated_at();
