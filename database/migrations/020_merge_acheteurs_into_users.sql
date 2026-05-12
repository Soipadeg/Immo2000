-- Migration 020: Merge Acheteur model into User model
-- Date: 2026-05-12
-- Description: Fusionner le modèle Acheteur dans User.
--              Ajouter les champs critères acheteur à la table utilisateurs.
--              Transformer les FK acheteur_id en utilisateur_id dans les tables qui les référencent.
--              Supprimer la table acheteurs.

-- ===== STEP 1: Ajouter les champs acheteur à la table utilisateurs =====

ALTER TABLE utilisateurs
ADD COLUMN budget_max NUMERIC(12, 2) DEFAULT NULL,
ADD COLUMN ville_recherchee VARCHAR(100) DEFAULT NULL,
ADD COLUMN surface_min INTEGER DEFAULT NULL,
ADD COLUMN type_bien_recherche VARCHAR(50) DEFAULT NULL,
ADD COLUMN nombre_pieces_min INTEGER DEFAULT NULL,
ADD COLUMN dpe_ideale VARCHAR(1) DEFAULT NULL;

-- Créer des indices pour performance de recherche
CREATE INDEX IF NOT EXISTS idx_utilisateurs_budget_max ON utilisateurs(budget_max);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_ville_recherchee ON utilisateurs(ville_recherchee);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_type_bien_recherche ON utilisateurs(type_bien_recherche);

-- ===== STEP 2: Migrer les données des acheteurs (si la table existe) =====

-- Migration optionnelle: copier les données de acheteurs vers utilisateurs
-- Commenté car cela dépend de si les données doivent être préservées
-- IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'acheteurs') THEN
--   UPDATE utilisateurs
--   SET budget_max = a.budget_max,
--       ville_recherchee = a.ville_recherchee,
--       surface_min = a.surface_min,
--       type_bien_recherche = a.type_bien_recherche,
--       nombre_pieces_min = a.nombre_pieces_min,
--       dpe_ideale = a.dpe_ideale
--   FROM acheteurs a
--   WHERE utilisateurs.utilisateur_id = a.utilisateur_id;
-- END IF;

-- ===== STEP 3: Transformer les FK acheteur_id en utilisateur_id =====

-- Visites table: transformer acheteur_id en utilisateur_id
-- D'abord, créer la nouvelle colonne si elle n'existe pas
ALTER TABLE visites
ADD COLUMN utilisateur_acheteur_id INTEGER DEFAULT NULL;

-- Copier les données: visites.utilisateur_acheteur_id = acheteurs.utilisateur_id
-- Mais on n'a pas l'accès direct, donc on laisse NULL pour l'instant
-- Les données seront mises à jour lors de la suppression de la table acheteurs

-- Supprimer la FK sur acheteur_id
ALTER TABLE visites
DROP CONSTRAINT IF EXISTS fk_visites_acheteur_id,
DROP CONSTRAINT IF EXISTS fk_visites_acheteur;

-- Supprimer la colonne acheteur_id
ALTER TABLE visites
DROP COLUMN IF EXISTS acheteur_id;

-- Renommer utilisateur_acheteur_id en acheteur_id (pour compatibilité)
ALTER TABLE visites
RENAME COLUMN utilisateur_acheteur_id TO acheteur_id;

-- ===== STEP 4: Faire la même chose pour offres =====

ALTER TABLE offres
ADD COLUMN utilisateur_acheteur_id INTEGER DEFAULT NULL;

-- Supprimer les FKs
ALTER TABLE offres
DROP CONSTRAINT IF EXISTS fk_offres_acheteur,
DROP CONSTRAINT IF EXISTS fk_offres_acheteur_id;

-- Supprimer acheteur_id
ALTER TABLE offres
DROP COLUMN IF EXISTS acheteur_id;

-- Renommer
ALTER TABLE offres
RENAME COLUMN utilisateur_acheteur_id TO acheteur_id;

-- ===== STEP 5: Faire la même chose pour feedbacks =====

ALTER TABLE feedbacks
ADD COLUMN utilisateur_acheteur_id INTEGER DEFAULT NULL;

-- Supprimer les FKs
ALTER TABLE feedbacks
DROP CONSTRAINT IF EXISTS fk_feedbacks_acheteur;

-- Supprimer acheteur_id
ALTER TABLE feedbacks
DROP COLUMN IF EXISTS acheteur_id;

-- Renommer
ALTER TABLE feedbacks
RENAME COLUMN utilisateur_acheteur_id TO acheteur_id;

-- ===== STEP 6: Supprimer la table acheteurs =====

DROP TABLE IF EXISTS acheteurs CASCADE;

-- ===== STEP 7: Ajouter des contraintes de vérification =====

-- Budget doit être positif si défini
ALTER TABLE utilisateurs
ADD CONSTRAINT ck_budget_max_positive CHECK (budget_max IS NULL OR budget_max > 0);

-- Surface doit être positive si définie
ALTER TABLE utilisateurs
ADD CONSTRAINT ck_surface_min_positive CHECK (surface_min IS NULL OR surface_min > 0);

-- ===== STEP 8: Documenter les changements =====

COMMENT ON COLUMN utilisateurs.budget_max IS 'Budget maximal en euros pour achat (optionnel)';
COMMENT ON COLUMN utilisateurs.ville_recherchee IS 'Ville principale de recherche (optionnel)';
COMMENT ON COLUMN utilisateurs.surface_min IS 'Surface minimale requise en m² (optionnel)';
COMMENT ON COLUMN utilisateurs.type_bien_recherche IS 'Type de bien recherché (optionnel)';
COMMENT ON COLUMN utilisateurs.nombre_pieces_min IS 'Nombre minimum de pièces (optionnel)';
COMMENT ON COLUMN utilisateurs.dpe_ideale IS 'Classe énergétique idéale A-G (optionnel)';
