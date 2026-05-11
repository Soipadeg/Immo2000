-- Migration 020: Create historique_notaire table (audit trail)
-- Date: 2024-01

CREATE TABLE IF NOT EXISTS historique_notaire (
    historique_id SERIAL PRIMARY KEY,
    transaction_notaire_id INTEGER NOT NULL,
    notaire_id INTEGER NOT NULL,
    type_action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_notaire_id) REFERENCES transaction_notaire(transaction_notaire_id) ON DELETE CASCADE,
    FOREIGN KEY (notaire_id) REFERENCES notaires(notaire_id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX ix_historique_transaction ON historique_notaire(transaction_notaire_id, date_action);
CREATE INDEX ix_historique_notaire ON historique_notaire(notaire_id);
CREATE INDEX ix_historique_date ON historique_notaire(date_action);
