-- Migration 019: Create document_notaire table
-- Date: 2024-01

CREATE TABLE IF NOT EXISTS document_notaire (
    document_notaire_id SERIAL PRIMARY KEY,
    transaction_notaire_id INTEGER NOT NULL,
    type_document VARCHAR(50) NOT NULL,
    nom_original VARCHAR(255) NOT NULL,
    url_fichier VARCHAR(500) NOT NULL,
    taille_bytes INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    validé_par_notaire BOOLEAN DEFAULT FALSE,
    date_validation TIMESTAMP,
    commentaires_notaire TEXT,
    chiffre BOOLEAN DEFAULT FALSE,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_notaire_id) REFERENCES transaction_notaire(transaction_notaire_id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX ix_document_notaire_transaction ON document_notaire(transaction_notaire_id);
CREATE INDEX ix_document_notaire_type ON document_notaire(type_document);
