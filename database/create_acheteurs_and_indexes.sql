-- ====================================================================
-- Script SQL pour la table ACHETEURS et les index de matching
-- ====================================================================
--
-- Ce script:
-- 1. Crée la table 'acheteurs' avec les critères de recherche
-- 2. Ajoute les index PostgreSQL pour accélérer les requêtes
-- 3. Initialise quelques données de test
--
-- Pour Gilbert: Les index rendent les recherches BEAUCOUP plus rapides!
-- ====================================================================

-- ========== 1️⃣  CRÉATION DE LA TABLE ACHETEURS ==========

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS acheteurs (
    -- Clé primaire
    acheteur_id SERIAL PRIMARY KEY,

    -- Lien avec l'utilisateur
    utilisateur_id INTEGER NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(user_id) ON DELETE CASCADE,

    -- Critères de recherche obligatoires
    budget_max NUMERIC(12, 2) NOT NULL,           -- Budget max en euros
    ville_recherchee VARCHAR(100) NOT NULL,       -- Ville recherchée
    surface_min INTEGER NOT NULL,                 -- Surface minimum en m²
    type_bien_recherche VARCHAR(50) NOT NULL,     -- Type: appartement, maison, terrain, etc.

    -- Critères optionnels (pour futur)
    nombre_pieces_min INTEGER,                    -- Nombre de pièces minimum
    dpe_ideale VARCHAR(1),                        -- Classe énergétique idéale (A-G)

    -- Métadonnées
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actif BOOLEAN DEFAULT TRUE,                   -- Profil actif ou non?

    -- Contraintes
    UNIQUE(utilisateur_id),                       -- Un acheteur par utilisateur
    CHECK (budget_max > 0),
    CHECK (surface_min > 0)
);

-- Description pour COMMENT ON
COMMENT ON TABLE acheteurs IS 'Profils d''acheteurs avec leurs critères de recherche immobilière';
COMMENT ON COLUMN acheteurs.budget_max IS 'Budget maximum accepté en euros';
COMMENT ON COLUMN acheteurs.ville_recherchee IS 'Ville principale de recherche (exact match)';
COMMENT ON COLUMN acheteurs.surface_min IS 'Surface minimale requise en m²';
COMMENT ON COLUMN acheteurs.type_bien_recherche IS 'Type de bien recherché (appartement, maison, etc.)';

-- ========== 2️⃣  INDEX POUR OPTIMISER LE MATCHING ==========

-- Index sur les colonnes clés du matching
-- Ces index accélèrent les comparaisons lors de la recherche des annonces
CREATE INDEX IF NOT EXISTS idx_acheteurs_utilisateur_id
    ON acheteurs(utilisateur_id);

CREATE INDEX IF NOT EXISTS idx_acheteurs_actif
    ON acheteurs(actif)
    WHERE actif = TRUE;  -- Partial index: uniquement les acheteurs actifs

-- ========== 3️⃣  INDEX POUR LES ANNONCES (déjà existants, mais rappel) ==========

-- Index pour accélérer les filtres de matching
CREATE INDEX IF NOT EXISTS idx_annonces_ville
    ON annonces(ville);

CREATE INDEX IF NOT EXISTS idx_annonces_prix
    ON annonces(prix);

CREATE INDEX IF NOT EXISTS idx_annonces_surface
    ON annonces(surface);

CREATE INDEX IF NOT EXISTS idx_annonces_type_bien
    ON annonces(type_bien);

-- Index combiné pour les requêtes complexes
-- Utile quand on cherche par plusieurs critères à la fois
CREATE INDEX IF NOT EXISTS idx_annonces_matching
    ON annonces(ville, type_bien, prix, surface)
    WHERE statut = 'publiée';  -- Uniquement les annonces publiées!

-- Index sur le statut pour filtrer rapidement
CREATE INDEX IF NOT EXISTS idx_annonces_statut
    ON annonces(statut);

-- Index sur la date (pour trier les plus récentes)
CREATE INDEX IF NOT EXISTS idx_annonces_date
    ON annonces(date_creation DESC);

-- ========== 4️⃣  DONNÉES DE TEST POUR GILBERT ==========

-- Insérer quelques acheteurs de test
-- (À adapter avec vos vrais user_id!)

-- NOTE: Remplacez les "123", "124", "125" par les vrais user_id existants!

INSERT INTO acheteurs (
    utilisateur_id,
    budget_max,
    ville_recherchee,
    surface_min,
    type_bien_recherche,
    nombre_pieces_min,
    dpe_ideale
) VALUES
-- Acheteur 1: Paris, budget 300k, appartement
(
    123,  -- À remplacer par un vrai user_id
    300000,
    'Paris',
    60,
    'appartement',
    2,
    'D'
),
-- Acheteur 2: Marseille, budget 200k, maison
(
    124,
    200000,
    'Marseille',
    100,
    'maison',
    3,
    'E'
),
-- Acheteur 3: Toulouse, budget 150k, terrain
(
    125,
    150000,
    'Toulouse',
    500,
    'terrain',
    NULL,
    NULL
)
ON CONFLICT (utilisateur_id) DO NOTHING;  -- Ne pas dupliquer si acheteur existe

-- ========== 5️⃣  VÉRIFICATION ==========

-- Voir les index créés
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN ('acheteurs', 'annonces')
ORDER BY tablename, indexname;

-- Voir les acheteurs créés
SELECT * FROM acheteurs LIMIT 5;

-- ====================================================================
-- Profiling des requêtes (pour déboguer avec EXPLAIN)
-- ====================================================================
--
-- Si une requête est lente, utilisez:
-- EXPLAIN ANALYZE SELECT ... FROM ...
--
-- Exemple:
-- EXPLAIN ANALYZE
-- SELECT a.annonce_id, a.prix, a.surface, a.ville
-- FROM annonces a
-- WHERE a.ville = 'Paris' AND a.prix <= 300000
-- ORDER BY a.prix DESC;
--
-- Cela montrera si l'index est bien utilisé ✓ ou non ✗
-- ====================================================================

COMMIT;
