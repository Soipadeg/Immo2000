"""
Migration SQL pour ajouter les colonnes et tables manquantes pour le tunnel de création d'annonce.

Ajoute :
1. Table `photos` (relation ONE-TO-MANY avec annonces)
2. Colonne `has_exclusivity_contract` à `utilisateurs` (préparation pour outils IA)
"""

-- Créer la table photos pour stocker les images des annonces
CREATE TABLE IF NOT EXISTS photos (
    photo_id SERIAL PRIMARY KEY,
    annonce_id INTEGER NOT NULL REFERENCES annonces(annonce_id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    ordre INTEGER DEFAULT 0,
    largeur INTEGER,
    hauteur INTEGER,
    taille_bytes INTEGER,
    date_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_photos_annonce FOREIGN KEY (annonce_id) REFERENCES annonces(annonce_id) ON DELETE CASCADE
);

-- Index pour les requêtes courantes sur photos
CREATE INDEX IF NOT EXISTS idx_annonce_ordre ON photos(annonce_id, ordre);
CREATE INDEX IF NOT EXISTS idx_photos_annonce_id ON photos(annonce_id);

-- Ajouter la colonne has_exclusivity_contract à utilisateurs (si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='utilisateurs' AND column_name='has_exclusivity_contract'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN has_exclusivity_contract BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Index pour les recherches de contrats d'exclusivité
CREATE INDEX IF NOT EXISTS idx_utilisateurs_has_contract ON utilisateurs(has_exclusivity_contract);
