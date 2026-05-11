-- Migration 014: Create favoris table for bookmarking annonces
-- Purpose: Allow buyers to mark annonces as favorites with optional notes and ratings

CREATE TABLE IF NOT EXISTS favoris (
    favori_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    annonce_id INTEGER NOT NULL REFERENCES annonces(annonce_id) ON DELETE CASCADE,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note INTEGER CHECK (note >= 1 AND note <= 5),
    commentaire VARCHAR(500),
    CONSTRAINT uk_user_annonce_favorite UNIQUE(user_id, annonce_id)
);

-- Create indices for efficient queries
CREATE INDEX idx_favoris_user_id ON favoris(user_id);
CREATE INDEX idx_favoris_annonce_id ON favoris(annonce_id);
CREATE INDEX idx_favoris_date_ajout ON favoris(date_ajout DESC);
CREATE INDEX idx_favoris_note ON favoris(note);
CREATE INDEX idx_favoris_user_date ON favoris(user_id, date_ajout DESC);

-- For analytics queries
CREATE INDEX idx_favoris_annonce_note ON favoris(annonce_id, note);
