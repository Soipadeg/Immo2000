-- Migration 018: Create transaction_notaire table
-- Date: 2024-01

CREATE TABLE IF NOT EXISTS transaction_notaire (
    transaction_notaire_id SERIAL PRIMARY KEY,
    offre_id INTEGER NOT NULL,
    notaire_id INTEGER,
    annonce_id INTEGER NOT NULL,
    vendeur_id INTEGER NOT NULL,
    acheteur_id INTEGER NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'en_attente_selection',
    prix_compromis NUMERIC(12, 2) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_assignation_notaire TIMESTAMP,
    date_envoi_notification TIMESTAMP,
    date_validation TIMESTAMP,
    date_completion TIMESTAMP,
    delai_demande TIMESTAMP,
    delai_validation TIMESTAMP,
    raison_refus TEXT,
    modifications_demandees TEXT,
    notes_internes TEXT,
    FOREIGN KEY (offre_id) REFERENCES offres(offre_id) ON DELETE CASCADE,
    FOREIGN KEY (notaire_id) REFERENCES notaires(notaire_id) ON DELETE SET NULL,
    FOREIGN KEY (annonce_id) REFERENCES annonces(annonce_id) ON DELETE CASCADE,
    FOREIGN KEY (vendeur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
    FOREIGN KEY (acheteur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX ix_transaction_notaire_offre ON transaction_notaire(offre_id);
CREATE INDEX ix_transaction_notaire_notaire ON transaction_notaire(notaire_id);
CREATE INDEX ix_transaction_notaire_annonce ON transaction_notaire(annonce_id);
CREATE INDEX ix_transaction_notaire_vendeur ON transaction_notaire(vendeur_id);
CREATE INDEX ix_transaction_notaire_acheteur ON transaction_notaire(acheteur_id);
CREATE INDEX ix_transaction_notaire_statut ON transaction_notaire(statut);
CREATE INDEX ix_transaction_notaire_dates ON transaction_notaire(date_creation, date_assignation_notaire);
