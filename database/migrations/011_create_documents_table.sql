-- Migration 011: Create documents table for storing uploaded documents
-- Purpose: Store documents like compromis, DPE, photos, etc. for each annonce

CREATE TABLE IF NOT EXISTS documents (
    document_id SERIAL PRIMARY KEY,
    annonce_id INTEGER NOT NULL REFERENCES annonces(annonce_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    taille INTEGER NOT NULL,
    mime_type VARCHAR(100),
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP,
    visible_pour_tous BOOLEAN DEFAULT TRUE,
    telecharge INTEGER DEFAULT 0
);

-- Create indices for efficient queries
CREATE INDEX idx_documents_annonce_id ON documents(annonce_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_date_upload ON documents(date_upload DESC);
CREATE INDEX idx_documents_date_expiration ON documents(date_expiration);
CREATE INDEX idx_documents_visible ON documents(visible_pour_tous);

-- Ensure no duplicate naming per annonce
CREATE UNIQUE INDEX idx_documents_annonce_nom ON documents(annonce_id, nom);
