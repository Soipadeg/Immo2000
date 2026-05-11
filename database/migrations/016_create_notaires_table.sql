-- Migration 016: Create notaires table for partner notaries
-- Date: 2024-01

CREATE TABLE IF NOT EXISTS notaires (
    notaire_id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    etude_notariale VARCHAR(255) NOT NULL,
    numero_rpps VARCHAR(20) NOT NULL UNIQUE,
    adresse_etude VARCHAR(500) NOT NULL,
    code_postal_etude VARCHAR(10) NOT NULL,
    ville_etude VARCHAR(100) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    telephone VARCHAR(20) NOT NULL,
    email_professionnel VARCHAR(255) NOT NULL UNIQUE,
    zone_geographique JSON NOT NULL,
    disponibilites JSON,
    partenaire_actif BOOLEAN DEFAULT TRUE,
    date_activation_partenaire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_desactivation_partenaire TIMESTAMP,
    max_dossiers_simultanees INTEGER DEFAULT 10,
    delai_traitement_jours INTEGER DEFAULT 5,
    note_moyenne FLOAT DEFAULT 0.0,
    dossiers_traites INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX ix_notaire_utilisateur ON notaires(utilisateur_id);
CREATE INDEX ix_notaire_rpps ON notaires(numero_rpps);
CREATE INDEX ix_notaire_email ON notaires(email_professionnel);
CREATE INDEX ix_notaire_code_postal ON notaires(code_postal_etude);
CREATE INDEX ix_notaire_ville ON notaires(ville_etude);
CREATE INDEX ix_notaire_partenaire_active ON notaires(partenaire_actif, ville_etude);
CREATE INDEX ix_notaire_zone ON notaires(ville_etude, code_postal_etude);
