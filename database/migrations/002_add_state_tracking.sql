-- Migration: Ajout des champs de suivi d'état pour les annonces
-- Date: 2026-05-04
-- Description: Ajoute les champs date_statut et date_vente à la table annonces
--              pour tracker les transitions d'état et la date de vente

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE annonces
ADD COLUMN IF NOT EXISTS date_statut TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN IF NOT EXISTS date_vente TIMESTAMP WITH TIME ZONE NULL;

-- Créer un index sur date_statut pour les requêtes de filtrage par date
CREATE INDEX IF NOT EXISTS idx_date_statut ON annonces(date_statut DESC);

-- Créer un index composite pour les annonces vendues
CREATE INDEX IF NOT EXISTS idx_statut_date_vente ON annonces(statut, date_vente DESC)
WHERE statut = 'vendue' AND date_vente IS NOT NULL;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN annonces.date_statut IS 'Date du dernier changement de statut';
COMMENT ON COLUMN annonces.date_vente IS 'Date de vente (si statut = vendue)';
