-- =====================================================
-- Schéma PostgreSQL pour Immo2000
-- Plateforme immobilière P2P avec intégration Melo & Keyzia
-- Généré : 2026-05-04
-- =====================================================

-- Nettoyage des objets existants (en développement)
-- À commenter en production
DROP VIEW IF EXISTS vue_estimations_recentes CASCADE;
DROP FUNCTION IF EXISTS calculer_prix_moyen_par_ville(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS obtenir_prix_estime(INTEGER) CASCADE;
DROP TABLE IF EXISTS comparaisons_biens CASCADE;
DROP TABLE IF EXISTS comparaisons CASCADE;
DROP TABLE IF EXISTS erreurs CASCADE;
DROP TABLE IF EXISTS estimations CASCADE;
DROP TABLE IF EXISTS donnees_marche CASCADE;
DROP TABLE IF EXISTS biens CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TYPE IF EXISTS type_bien_enum CASCADE;
DROP TYPE IF EXISTS role_utilisateur_enum CASCADE;

-- =====================================================
-- TYPES ENUM
-- =====================================================

/**
 * Énumération des types de bien immobilier
 * Valeurs supportées par l'API Melo
 */
CREATE TYPE type_bien_enum AS ENUM (
    'appartement',
    'maison',
    'terrain',
    'commercial'
);

/**
 * Énumération des rôles utilisateur
 * Vendeur : propriétaire vendant un bien
 * Acheteur : personne cherchant à acheter
 * Agent : agent immobilier (optionnel)
 */
CREATE TYPE role_utilisateur_enum AS ENUM (
    'vendeur',
    'acheteur',
    'agent'
);

-- =====================================================
-- TABLE : SOURCES (APIs externes)
-- =====================================================

/**
 * Stocke les informations sur les sources de données
 * Utilisé pour tracker d'où provient chaque estimation
 * Permet de filtrer/comparer par source dans le futur
 */
CREATE TABLE sources (
    source_id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nom de la source (Melo, Keyzia, etc.)',
    description TEXT COMMENT 'Description du service',
    url VARCHAR(255) COMMENT 'URL de l''API',
    actif BOOLEAN DEFAULT TRUE COMMENT 'Indique si la source est active',
    date_ajout TIMESTAMPTZ DEFAULT NOW() COMMENT 'Date d''ajout de la source',

    CONSTRAINT nom_not_empty CHECK (LENGTH(TRIM(nom)) > 0)
);

-- =====================================================
-- TABLE : UTILISATEURS
-- =====================================================

/**
 * Stocke les utilisateurs de la plateforme
 * Types : vendeur, acheteur, agent immobilier
 * Relations : vendeurs créent les biens, acheteurs les consultent
 */
CREATE TABLE utilisateurs (
    utilisateur_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email unique (identifiant)',
    mot_de_passe_hash VARCHAR(255) NOT NULL COMMENT 'Hash du mot de passe (bcrypt)',
    nom VARCHAR(100) NOT NULL COMMENT 'Nom de l''utilisateur',
    prenom VARCHAR(100) NOT NULL COMMENT 'Prénom de l''utilisateur',
    telephone VARCHAR(20) COMMENT 'Numéro de téléphone',
    adresse_contact VARCHAR(255) COMMENT 'Adresse postale',
    role role_utilisateur_enum NOT NULL DEFAULT 'acheteur' COMMENT 'Rôle dans la plateforme',
    actif BOOLEAN DEFAULT TRUE COMMENT 'Compte actif ou désactivé',
    date_inscription TIMESTAMPTZ DEFAULT NOW() COMMENT 'Date d''inscription',
    date_derniere_connexion TIMESTAMPTZ COMMENT 'Dernière connexion',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT 'Dernière modification du profil',

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT nom_not_empty CHECK (LENGTH(TRIM(nom)) > 0),
    CONSTRAINT prenom_not_empty CHECK (LENGTH(TRIM(prenom)) > 0)
);

-- =====================================================
-- TABLE : BIENS (Immobilier)
-- =====================================================

/**
 * Stocke les informations de base sur les biens immobiliers
 * Lié aux estimations et comparaisons
 * Chaque bien est créé par un vendeur et peut avoir plusieurs estimations
 */
CREATE TABLE biens (
    bien_id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
        COMMENT 'Propriétaire/créateur du bien',
    adresse VARCHAR(255) NOT NULL COMMENT 'Adresse complète du bien',
    code_postal VARCHAR(10) COMMENT 'Code postal (format français : 5 chiffres)',
    ville VARCHAR(100) COMMENT 'Ville extraite de l''adresse',
    arrondissement VARCHAR(100) COMMENT 'Arrondissement (pour les villes avec arrondissements)',
    surface INTEGER NOT NULL COMMENT 'Surface en m²',
    type_bien type_bien_enum NOT NULL COMMENT 'Type de bien (appartement, maison, etc.)',
    nombre_pieces INTEGER COMMENT 'Nombre de pièces (pour appartements/maisons)',
    nombre_chambres INTEGER COMMENT 'Nombre de chambres',
    etage INTEGER COMMENT 'Étage du bien',
    date_construction INTEGER COMMENT 'Année de construction',
    description TEXT COMMENT 'Description libre du bien',
    url_photo VARCHAR(255) COMMENT 'URL de la photo principal',
    statut VARCHAR(50) DEFAULT 'actif' COMMENT 'Statut du bien (actif, vendu, retiré)',
    date_creation TIMESTAMPTZ DEFAULT NOW() COMMENT 'Date de création du bien',
    date_modification TIMESTAMPTZ DEFAULT NOW() COMMENT 'Date de dernière modification',

    CONSTRAINT surface_positive CHECK (surface > 0),
    CONSTRAINT adresse_not_empty CHECK (LENGTH(TRIM(adresse)) > 0),
    CONSTRAINT pieces_positive CHECK (nombre_pieces IS NULL OR nombre_pieces > 0),
    CONSTRAINT unique_bien_utilisateur UNIQUE (utilisateur_id, adresse, surface, type_bien)
);

-- =====================================================
-- TABLE : ESTIMATIONS (Données Melo/Keyzia)
-- =====================================================

/**
 * Stocke les estimations obtenues via l'API Melo
 * Une estimation = résultat d'appel API pour un bien
 * Historique : plusieurs estimations pour un même bien = suivi du prix au fil du temps
 */
CREATE TABLE estimations (
    estimation_id SERIAL PRIMARY KEY,
    bien_id INTEGER NOT NULL REFERENCES biens(bien_id) ON DELETE CASCADE
        COMMENT 'Bien auquel se rapporte l''estimation',
    source_id INTEGER NOT NULL REFERENCES sources(source_id) ON DELETE RESTRICT
        COMMENT 'Source de l''estimation (Melo, Keyzia, etc.)',

    -- Prix (données Melo)
    prix_m2 DECIMAL(10,2) NOT NULL COMMENT 'Prix au m² estimé (€)',
    prix_estime DECIMAL(12,2) COMMENT 'Prix estimé total = prix_m2 * surface',
    fourchette_basse DECIMAL(12,2) NOT NULL COMMENT 'Fourchette basse (prix minimum estimé)',
    fourchette_haute DECIMAL(12,2) NOT NULL COMMENT 'Fourchette haute (prix maximum estimé)',
    marge_incertitude DECIMAL(5,2) COMMENT 'Marge d''incertitude (%) = (fourchette_haute - fourchette_basse) / prix_estime * 100',

    -- Données de marché (JSON depuis Melo)
    donnees_marche JSONB COMMENT 'Données du marché : prix_moyen_quartier, tendance, volume_transactions, etc. (JSON)',

    -- Métadonnées
    date_estimation TIMESTAMPTZ NOT NULL DEFAULT NOW() COMMENT 'Date/heure de l''estimation',
    status VARCHAR(20) NOT NULL DEFAULT 'success' COMMENT 'Statut : success, error, pending',
    message_erreur TEXT COMMENT 'Message d''erreur si status = error',

    CONSTRAINT prix_m2_positive CHECK (prix_m2 > 0),
    CONSTRAINT prix_estime_positive CHECK (prix_estime IS NULL OR prix_estime > 0),
    CONSTRAINT fourchette_coherente CHECK (fourchette_basse <= fourchette_haute),
    CONSTRAINT status_valid CHECK (status IN ('success', 'error', 'pending'))
);

-- =====================================================
-- TABLE : ERREURS (Tracking des erreurs API)
-- =====================================================

/**
 * Stocke les erreurs d'estimation pour audit et monitoring
 * Permet de retracer les problèmes lors d'appels API
 * Utile pour débugger et améliorer la qualité des données
 */
CREATE TABLE erreurs (
    erreur_id SERIAL PRIMARY KEY,
    bien_id INTEGER REFERENCES biens(bien_id) ON DELETE SET NULL
        COMMENT 'Bien auquel se rapporte l''erreur (peut être NULL)',
    source_id INTEGER NOT NULL REFERENCES sources(source_id) ON DELETE RESTRICT
        COMMENT 'Source qui a généré l''erreur',
    adresse_tentee VARCHAR(255) COMMENT 'Adresse qui a causé l''erreur',
    message_erreur TEXT NOT NULL COMMENT 'Message d''erreur détaillé',
    code_erreur VARCHAR(50) COMMENT 'Code d''erreur (ex: TIMEOUT, INVALID_ADDRESS)',
    reponse_api JSONB COMMENT 'Réponse complète de l''API (pour debug)',
    date_erreur TIMESTAMPTZ NOT NULL DEFAULT NOW() COMMENT 'Date/heure de l''erreur',
    retry_count INTEGER DEFAULT 0 COMMENT 'Nombre de tentatives de retry',

    CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message_erreur)) > 0)
);

-- =====================================================
-- TABLE : DONNEES_MARCHE (Marché immobilier)
-- =====================================================

/**
 * Stocke les données de marché agrégées (par ville/arrondissement/type)
 * Source : Melo, Keyzia, ou agrégation locale
 * Permet des analyses de marché et tendances
 */
CREATE TABLE donnees_marche (
    marche_id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(source_id) ON DELETE RESTRICT
        COMMENT 'Source des données (Melo, Keyzia, etc.)',
    ville VARCHAR(100) NOT NULL COMMENT 'Ville',
    code_postal VARCHAR(10) COMMENT 'Code postal',
    arrondissement VARCHAR(100) COMMENT 'Arrondissement (optionnel)',
    type_bien type_bien_enum COMMENT 'Type de bien (NULL = tous types)',

    -- Statistiques de marché
    prix_moyen_m2 DECIMAL(10,2) NOT NULL COMMENT 'Prix moyen au m²',
    prix_min_m2 DECIMAL(10,2) COMMENT 'Prix minimum au m²',
    prix_max_m2 DECIMAL(10,2) COMMENT 'Prix maximum au m²',
    nombre_biens INTEGER COMMENT 'Nombre de biens vendus',
    volume_transactions DECIMAL(15,2) COMMENT 'Volume total des transactions',

    -- Tendances
    tendance_prix_3m VARCHAR(50) COMMENT 'Tendance 3 mois : hausse, baisse, stable',
    variation_pct_3m DECIMAL(5,2) COMMENT 'Variation en % sur 3 mois',
    tendance_prix_12m VARCHAR(50) COMMENT 'Tendance 12 mois : hausse, baisse, stable',
    variation_pct_12m DECIMAL(5,2) COMMENT 'Variation en % sur 12 mois',

    -- Métadonnées
    date_collecte TIMESTAMPTZ NOT NULL DEFAULT NOW() COMMENT 'Date de collecte des données',
    date_mise_a_jour TIMESTAMPTZ DEFAULT NOW() COMMENT 'Date de dernière mise à jour',

    CONSTRAINT prix_moyen_positive CHECK (prix_moyen_m2 > 0),
    CONSTRAINT prix_min_positive CHECK (prix_min_m2 IS NULL OR prix_min_m2 > 0),
    CONSTRAINT prix_max_positive CHECK (prix_max_m2 IS NULL OR prix_max_m2 > 0),
    CONSTRAINT unique_marche UNIQUE (source_id, ville, code_postal, arrondissement, type_bien)
);

-- =====================================================
-- TABLE : COMPARAISONS
-- =====================================================

/**
 * Stocke les comparaisons de biens créées par les utilisateurs
 * Une comparaison = groupe de biens comparés ensemble
 * Historique : permet de voir quels biens ont été comparés
 */
CREATE TABLE comparaisons (
    comparaison_id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
        COMMENT 'Utilisateur qui a créé la comparaison',
    titre VARCHAR(255) NOT NULL COMMENT 'Titre de la comparaison',
    description TEXT COMMENT 'Description/notes de la comparaison',
    nombre_biens INTEGER DEFAULT 0 COMMENT 'Nombre de biens comparés',
    prix_moyen_estime DECIMAL(12,2) COMMENT 'Prix moyen estimé des biens',
    prix_min_estime DECIMAL(12,2) COMMENT 'Prix minimum estimé',
    prix_max_estime DECIMAL(12,2) COMMENT 'Prix maximum estimé',
    resume_comparatif JSONB COMMENT 'Résumé comparatif en JSON',
    date_creation TIMESTAMPTZ DEFAULT NOW() COMMENT 'Date de création',
    date_modification TIMESTAMPTZ DEFAULT NOW() COMMENT 'Date de dernière modification',

    CONSTRAINT titre_not_empty CHECK (LENGTH(TRIM(titre)) > 0)
);

-- =====================================================
-- TABLE : COMPARAISONS_BIENS (Relation M2M)
-- =====================================================

/**
 * Relation many-to-many entre comparaisons et biens
 * Permet une comparaison de contenir plusieurs biens
 */
CREATE TABLE comparaisons_biens (
    comparaison_id INTEGER NOT NULL REFERENCES comparaisons(comparaison_id) ON DELETE CASCADE,
    bien_id INTEGER NOT NULL REFERENCES biens(bien_id) ON DELETE CASCADE,
    estimation_id INTEGER COMMENT 'Estimation utilisée pour cette comparaison',
    position INTEGER DEFAULT 0 COMMENT 'Ordre d''affichage',
    date_ajout TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (comparaison_id, bien_id),
    FOREIGN KEY (estimation_id) REFERENCES estimations(estimation_id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES (Optimisation des requêtes)
-- =====================================================

-- Recherche par adresse
CREATE INDEX idx_biens_adresse ON biens(adresse);
CREATE INDEX idx_biens_ville ON biens(ville);
CREATE INDEX idx_biens_code_postal ON biens(code_postal);

-- Recherche par type
CREATE INDEX idx_biens_type ON biens(type_bien);

-- Recherche par utilisateur
CREATE INDEX idx_biens_utilisateur ON biens(utilisateur_id);
CREATE INDEX idx_estimations_utilisateur ON estimations
    USING btree (bien_id) WHERE status = 'success';

-- Recherche par date
CREATE INDEX idx_estimations_date ON estimations(date_estimation DESC);
CREATE INDEX idx_estimations_date_bien ON estimations(bien_id, date_estimation DESC);

-- Recherche par prix
CREATE INDEX idx_estimations_prix_m2 ON estimations(prix_m2);
CREATE INDEX idx_estimations_prix_estime ON estimations(prix_estime);

-- Recherche par source
CREATE INDEX idx_estimations_source ON estimations(source_id);

-- Erreurs récentes
CREATE INDEX idx_erreurs_date ON erreurs(date_erreur DESC);
CREATE INDEX idx_erreurs_bien ON erreurs(bien_id);

-- Données de marché
CREATE INDEX idx_donnees_marche_ville ON donnees_marche(ville);
CREATE INDEX idx_donnees_marche_type ON donnees_marche(type_bien);

-- Comparaisons
CREATE INDEX idx_comparaisons_utilisateur ON comparaisons(utilisateur_id);
CREATE INDEX idx_comparaisons_date ON comparaisons(date_creation DESC);

-- Utilisateurs
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);

-- =====================================================
-- VUES SQL
-- =====================================================

/**
 * VUE : Estimations récentes
 * Affiche les 20 dernières estimations avec informations du bien et de la source
 * Utilité : dashboard, affichage rapide des résultats Melo
 */
CREATE VIEW vue_estimations_recentes AS
SELECT
    e.estimation_id,
    e.bien_id,
    b.adresse,
    b.surface,
    b.type_bien,
    b.ville,
    b.arrondissement,
    u.nom || ' ' || u.prenom AS proprietaire,
    e.prix_m2,
    e.prix_estime,
    e.fourchette_basse,
    e.fourchette_haute,
    e.marge_incertitude,
    ROUND(100.0 * (e.fourchette_haute - e.fourchette_basse) / NULLIF(e.prix_estime, 0), 2) AS marge_incertitude_calc,
    e.donnees_marche,
    e.date_estimation,
    e.status,
    s.nom AS source,
    (NOW() - e.date_estimation)::TEXT AS temps_ecoule
FROM estimations e
JOIN biens b ON e.bien_id = b.bien_id
JOIN sources s ON e.source_id = s.source_id
JOIN utilisateurs u ON b.utilisateur_id = u.utilisateur_id
WHERE e.status = 'success'
ORDER BY e.date_estimation DESC
LIMIT 20;

/**
 * VUE : Estimations par type de bien
 * Affiche les estimations groupées par type de bien avec prix moyen
 */
CREATE VIEW vue_estimations_par_type AS
SELECT
    b.type_bien,
    COUNT(DISTINCT e.estimation_id) AS nombre_estimations,
    COUNT(DISTINCT b.bien_id) AS nombre_biens,
    ROUND(AVG(e.prix_m2)::NUMERIC, 2) AS prix_m2_moyen,
    MIN(e.prix_m2) AS prix_m2_min,
    MAX(e.prix_m2) AS prix_m2_max,
    ROUND(AVG(e.prix_estime)::NUMERIC, 2) AS prix_estime_moyen,
    MAX(e.date_estimation) AS derniere_estimation
FROM estimations e
JOIN biens b ON e.bien_id = b.bien_id
WHERE e.status = 'success'
GROUP BY b.type_bien;

/**
 * VUE : Estimations par ville
 * Affiche les statistiques d'estimation par ville
 */
CREATE VIEW vue_estimations_par_ville AS
SELECT
    b.ville,
    b.code_postal,
    COUNT(DISTINCT e.estimation_id) AS nombre_estimations,
    COUNT(DISTINCT b.bien_id) AS nombre_biens,
    ROUND(AVG(e.prix_m2)::NUMERIC, 2) AS prix_m2_moyen,
    MIN(e.prix_m2) AS prix_m2_min,
    MAX(e.prix_m2) AS prix_m2_max,
    ROUND(AVG(e.prix_estime)::NUMERIC, 2) AS prix_estime_moyen,
    MAX(e.date_estimation) AS derniere_estimation
FROM estimations e
JOIN biens b ON e.bien_id = b.bien_id
WHERE e.status = 'success' AND b.ville IS NOT NULL
GROUP BY b.ville, b.code_postal
ORDER BY nombre_estimations DESC;

-- =====================================================
-- FONCTIONS PostgreSQL
-- =====================================================

/**
 * FONCTION : Calculer le prix moyen au m² par ville
 * @param p_ville VARCHAR - Nom de la ville
 * @return DECIMAL - Prix moyen au m²
 */
CREATE OR REPLACE FUNCTION calculer_prix_moyen_par_ville(p_ville VARCHAR)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    prix_moyen DECIMAL(10,2);
BEGIN
    SELECT AVG(e.prix_m2) INTO prix_moyen
    FROM estimations e
    JOIN biens b ON e.bien_id = b.bien_id
    WHERE b.ville ILIKE p_ville AND e.status = 'success';

    RETURN COALESCE(prix_moyen, 0);
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * FONCTION : Obtenir le prix estimé d'un bien
 * @param p_bien_id INTEGER - ID du bien
 * @return DECIMAL - Dernier prix estimé (ou NULL si pas d'estimation)
 */
CREATE OR REPLACE FUNCTION obtenir_prix_estime(p_bien_id INTEGER)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    prix_estime DECIMAL(12,2);
BEGIN
    SELECT e.prix_estime INTO prix_estime
    FROM estimations e
    WHERE e.bien_id = p_bien_id AND e.status = 'success'
    ORDER BY e.date_estimation DESC
    LIMIT 1;

    RETURN prix_estime;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * FONCTION : Insérer une estimation et calculer prix_estime
 * @param p_bien_id INTEGER
 * @param p_source_id INTEGER
 * @param p_prix_m2 DECIMAL
 * @param p_fourchette_basse DECIMAL
 * @param p_fourchette_haute DECIMAL
 * @param p_donnees_marche JSONB
 * @return INTEGER - ID de l'estimation créée
 */
CREATE OR REPLACE FUNCTION inserer_estimation(
    p_bien_id INTEGER,
    p_source_id INTEGER,
    p_prix_m2 DECIMAL,
    p_fourchette_basse DECIMAL,
    p_fourchette_haute DECIMAL,
    p_donnees_marche JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_estimation_id INTEGER;
    v_surface INTEGER;
    v_prix_estime DECIMAL;
    v_marge DECIMAL;
BEGIN
    -- Récupérer la surface du bien
    SELECT surface INTO v_surface FROM biens WHERE bien_id = p_bien_id;

    IF v_surface IS NULL THEN
        RAISE EXCEPTION 'Bien avec ID % non trouvé', p_bien_id;
    END IF;

    -- Calculer prix_estime et marge
    v_prix_estime := p_prix_m2 * v_surface;
    v_marge := ROUND(100.0 * (p_fourchette_haute - p_fourchette_basse) / NULLIF(v_prix_estime, 0), 2);

    -- Insérer l'estimation
    INSERT INTO estimations (
        bien_id,
        source_id,
        prix_m2,
        prix_estime,
        fourchette_basse,
        fourchette_haute,
        marge_incertitude,
        donnees_marche,
        status
    ) VALUES (
        p_bien_id,
        p_source_id,
        p_prix_m2,
        v_prix_estime,
        p_fourchette_basse,
        p_fourchette_haute,
        v_marge,
        p_donnees_marche,
        'success'
    )
    RETURNING estimation_id INTO v_estimation_id;

    RETURN v_estimation_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

/**
 * TRIGGER : Mettre à jour date_modification des biens
 */
CREATE OR REPLACE FUNCTION update_bien_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bien_update
    BEFORE UPDATE ON biens
    FOR EACH ROW
    EXECUTE FUNCTION update_bien_modified();

/**
 * TRIGGER : Mettre à jour date_modification des comparaisons
 */
CREATE OR REPLACE FUNCTION update_comparaison_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comparaison_update
    BEFORE UPDATE ON comparaisons
    FOR EACH ROW
    EXECUTE FUNCTION update_comparaison_modified();

-- =====================================================
-- DONNÉES DE TEST / EXEMPLES
-- =====================================================

-- Sources
INSERT INTO sources (nom, description, url, actif) VALUES
    ('Melo', 'API d''estimation immobilière Melo', 'https://api.melo.io', TRUE),
    ('Keyzia', 'Données de marché Keyzia', 'https://api.keyzia.com', TRUE),
    ('Manuel', 'Estimations manuelles utilisateur', NULL, TRUE)
ON CONFLICT DO NOTHING;

-- Utilisateurs (test)
INSERT INTO utilisateurs (email, mot_de_passe_hash, nom, prenom, telephone, role, actif) VALUES
    ('jalil@example.com', '$2b$12$xxx', 'Khéloufi', 'Jalil', '+33612345678', 'agent', TRUE),
    ('marie.dupont@example.com', '$2b$12$yyy', 'Dupont', 'Marie', '+33687654321', 'vendeur', TRUE),
    ('jean.martin@example.com', '$2b$12$zzz', 'Martin', 'Jean', '+33698765432', 'acheteur', TRUE),
    ('sophie.bernard@example.com', '$2b$12$aaa', 'Bernard', 'Sophie', '+33645123456', 'acheteur', TRUE)
ON CONFLICT DO NOTHING;

-- Biens immobiliers
INSERT INTO biens (utilisateur_id, adresse, code_postal, ville, arrondissement, surface, type_bien, nombre_pieces, nombre_chambres, etage, date_construction, description, statut) VALUES
    (2, '123 Rue de Paris, 75000 Paris', '75000', 'Paris', '1er', 50, 'appartement', 2, 1, 3, 2010, 'Petit appartement rénové en plein cœur de Paris', 'actif'),
    (2, '456 Avenue des Champs-Élysées, 75008 Paris', '75008', 'Paris', '8ème', 80, 'appartement', 3, 2, 2, 1985, 'Spacieux appartement haussmannien', 'actif'),
    (2, '789 Rue de Lyon, 69000 Lyon', '69000', 'Lyon', 'Presqu''île', 120, 'maison', 5, 3, NULL, 1995, 'Maison spacieuse avec jardin', 'actif'),
    (2, '321 Boulevard des Ternes, 75017 Paris', '75017', 'Paris', '17ème', 65, 'appartement', 2, 1, 4, 2005, 'Appartement lumineux avec balcon', 'actif'),
    (3, '654 Route de Bordeaux, 33000 Bordeaux', '33000', 'Bordeaux', 'Quartier Saint-Michel', 150, 'maison', 6, 4, NULL, 1980, 'Maison d''époque bordelaise', 'actif'),
    (3, '987 Rue de la Paix, 13000 Marseille', '13000', 'Marseille', 'Vieux-Port', 75, 'appartement', 3, 2, 1, 1978, 'Vue sur le Vieux-Port', 'actif'),
    (2, '555 Rue Mouffetard, 75005 Paris', '75005', 'Paris', '5ème', 45, 'appartement', 2, 1, 2, 2015, 'Studio modernisé', 'actif'),
    (3, '222 Chemin de la Forêt, 78000 Versailles', '78000', 'Versailles', NULL, 180, 'maison', 7, 5, NULL, 1990, 'Belle propriété avec terrain', 'actif')
ON CONFLICT DO NOTHING;

-- Estimations
INSERT INTO estimations (bien_id, source_id, prix_m2, prix_estime, fourchette_basse, fourchette_haute, donnees_marche, status) VALUES
    (1, 1, 5000.00, 250000.00, 4500.00, 5500.00,
     '{"prix_moyen_quartier": 4800, "tendance": "stable", "volume_transactions": 150}',
     'success'),
    (2, 1, 6500.00, 520000.00, 6000.00, 7000.00,
     '{"prix_moyen_quartier": 6200, "tendance": "hausse", "volume_transactions": 120}',
     'success'),
    (3, 1, 3500.00, 420000.00, 3200.00, 3800.00,
     '{"prix_moyen_quartier": 3400, "tendance": "stable", "volume_transactions": 200}',
     'success'),
    (4, 1, 5500.00, 357500.00, 5000.00, 6000.00,
     '{"prix_moyen_quartier": 5300, "tendance": "hausse", "volume_transactions": 180}',
     'success'),
    (5, 1, 4200.00, 630000.00, 3900.00, 4500.00,
     '{"prix_moyen_quartier": 4100, "tendance": "stable", "volume_transactions": 90}',
     'success'),
    (6, 1, 5800.00, 435000.00, 5400.00, 6200.00,
     '{"prix_moyen_quartier": 5600, "tendance": "baisse", "volume_transactions": 110}',
     'success'),
    (7, 1, 5200.00, 234000.00, 4800.00, 5600.00,
     '{"prix_moyen_quartier": 5000, "tendance": "stable", "volume_transactions": 170}',
     'success'),
    (8, 2, 4800.00, 864000.00, 4400.00, 5200.00,
     '{"prix_moyen_quartier": 4700, "tendance": "hausse", "volume_transactions": 75}',
     'success'),
    (1, 1, 5100.00, 255000.00, 4600.00, 5600.00,
     '{"prix_moyen_quartier": 4900, "tendance": "stable", "volume_transactions": 155}',
     'success'),
    (2, 2, 6600.00, 528000.00, 6100.00, 7100.00,
     '{"prix_moyen_quartier": 6300, "tendance": "hausse", "volume_transactions": 125}',
     'success')
ON CONFLICT DO NOTHING;

-- Erreurs (exemples)
INSERT INTO erreurs (bien_id, source_id, adresse_tentee, message_erreur, code_erreur, date_erreur, retry_count) VALUES
    (1, 1, '999 Rue Inexistante, 75000 Paris', 'Adresse invalide ou introuvable', 'INVALID_ADDRESS', NOW() - INTERVAL '1 day', 2),
    (NULL, 1, '111 Rue Test, 99999 VilleFantôme', 'Impossible de géolocaliser l''adresse', 'GEOLOCATION_FAILED', NOW() - INTERVAL '2 days', 1),
    (5, 1, '654 Route de Bordeaux, 33000 Bordeaux', 'Timeout lors de la requête API', 'TIMEOUT', NOW() - INTERVAL '3 hours', 3)
ON CONFLICT DO NOTHING;

-- Données de marché (exemples)
INSERT INTO donnees_marche (source_id, ville, code_postal, arrondissement, type_bien, prix_moyen_m2, prix_min_m2, prix_max_m2, nombre_biens, volume_transactions, tendance_prix_3m, variation_pct_3m, tendance_prix_12m, variation_pct_12m) VALUES
    (1, 'Paris', '75000', '1er', 'appartement', 5000.00, 4500.00, 5500.00, 150, 10000000.00, 'stable', 0.5, 'hausse', 3.2),
    (1, 'Paris', '75008', '8ème', 'appartement', 6500.00, 6000.00, 7000.00, 120, 12000000.00, 'hausse', 2.3, 'hausse', 5.1),
    (1, 'Lyon', '69000', 'Presqu''île', 'maison', 3500.00, 3200.00, 3800.00, 200, 15000000.00, 'stable', -0.2, 'stable', 1.0),
    (1, 'Bordeaux', '33000', 'Quartier Saint-Michel', 'maison', 4200.00, 3900.00, 4500.00, 90, 9000000.00, 'stable', 1.1, 'hausse', 2.8),
    (1, 'Marseille', '13000', 'Vieux-Port', 'appartement', 5800.00, 5400.00, 6200.00, 110, 8000000.00, 'baisse', -1.2, 'baisse', -2.5),
    (2, 'Versailles', '78000', NULL, 'maison', 4800.00, 4400.00, 5200.00, 75, 7200000.00, 'hausse', 1.8, 'hausse', 4.3)
ON CONFLICT DO NOTHING;

-- Comparaisons (exemples)
INSERT INTO comparaisons (utilisateur_id, titre, description, nombre_biens, prix_moyen_estime, prix_min_estime, prix_max_estime, resume_comparatif) VALUES
    (3, 'Appartements Paris 2026', 'Comparaison d''appartements à Paris pour achat', 3, 375500.00, 250000.00, 520000.00,
     '{"nombre_biens": 3, "prix_moyen": 375500, "prix_m2_moyen": 5516.67}'),
    (4, 'Maisons région PACA', 'Maisons dans le sud', 2, 532500.00, 435000.00, 630000.00,
     '{"nombre_biens": 2, "prix_moyen": 532500, "prix_m2_moyen": 5000}')
ON CONFLICT DO NOTHING;

-- Relation comparaisons_biens
INSERT INTO comparaisons_biens (comparaison_id, bien_id, estimation_id, position) VALUES
    (1, 1, 1, 1),
    (1, 2, 2, 2),
    (1, 4, 4, 3),
    (2, 5, 5, 1),
    (2, 6, 6, 2)
ON CONFLICT DO NOTHING;

-- =====================================================
-- EXEMPLES DE REQUÊTES
-- =====================================================

/**
 * REQUÊTE 1 : Biens estimés entre 300k€ et 500k€ à Paris
 */
/*
SELECT DISTINCT
    b.bien_id,
    b.adresse,
    b.surface,
    b.type_bien,
    e.prix_m2,
    e.prix_estime,
    e.fourchette_basse,
    e.fourchette_haute,
    e.date_estimation
FROM biens b
JOIN estimations e ON b.bien_id = e.bien_id
WHERE b.ville = 'Paris'
    AND e.prix_estime BETWEEN 300000 AND 500000
    AND e.status = 'success'
ORDER BY e.prix_estime DESC;
*/

/**
 * REQUÊTE 2 : Tendance des prix/m² à Paris sur 6 derniers mois
 */
/*
SELECT
    DATE_TRUNC('month', e.date_estimation)::DATE AS mois,
    ROUND(AVG(e.prix_m2)::NUMERIC, 2) AS prix_m2_moyen,
    COUNT(DISTINCT e.estimation_id) AS nombre_estimations,
    COUNT(DISTINCT b.bien_id) AS nombre_biens
FROM estimations e
JOIN biens b ON e.bien_id = b.bien_id
WHERE b.ville = 'Paris'
    AND e.status = 'success'
    AND e.date_estimation >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', e.date_estimation)
ORDER BY mois DESC;
*/

/**
 * REQUÊTE 3 : Biens avec erreurs d'estimation hier
 */
/*
SELECT
    err.erreur_id,
    err.adresse_tentee,
    b.bien_id,
    err.message_erreur,
    err.code_erreur,
    err.date_erreur
FROM erreurs err
LEFT JOIN biens b ON err.bien_id = b.bien_id
WHERE DATE(err.date_erreur) = DATE(NOW() - INTERVAL '1 day')
ORDER BY err.date_erreur DESC;
*/

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================
COMMIT;
