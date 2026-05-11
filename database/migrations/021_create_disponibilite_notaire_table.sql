-- Migration 021: Create disponibilite_notaire table (calendar/availability)
-- Date: 2024-01
-- Bonus: Calendar availability blocking system

CREATE TABLE IF NOT EXISTS disponibilite_notaire (
    disponibilite_id SERIAL PRIMARY KEY,
    notaire_id INTEGER NOT NULL,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    type_creneau VARCHAR(50) DEFAULT 'disponible',
    description VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notaire_id) REFERENCES notaires(notaire_id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX ix_disponibilite_notaire ON disponibilite_notaire(notaire_id);
CREATE INDEX ix_disponibilite_dates ON disponibilite_notaire(notaire_id, date_debut, date_fin);
CREATE INDEX ix_disponibilite_type ON disponibilite_notaire(type_creneau);
