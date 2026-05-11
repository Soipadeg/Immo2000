-- Migration 017: Create notaire_specialisations table
-- Date: 2024-01

CREATE TABLE IF NOT EXISTS notaire_specialisations (
    specialisation_id SERIAL PRIMARY KEY,
    notaire_id INTEGER NOT NULL,
    type_specialisation VARCHAR(50) NOT NULL,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notaire_id) REFERENCES notaires(notaire_id) ON DELETE CASCADE
);

-- Indice composite
CREATE INDEX ix_notaire_spec ON notaire_specialisations(notaire_id, type_specialisation);
