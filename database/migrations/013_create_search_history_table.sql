-- Migration 013: Create search_history table for tracking searches
-- Purpose: Record user search queries for analytics and recommendations

CREATE TABLE IF NOT EXISTS search_history (
    search_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES utilisateurs(user_id) ON DELETE CASCADE,
    ville VARCHAR(100),
    type_bien VARCHAR(50),
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    surface_min DECIMAL(10,2),
    surface_max DECIMAL(10,2),
    pieces_min INTEGER,
    date_search TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre_resultats INTEGER DEFAULT 0
);

-- Create indices for efficient queries
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_date_search ON search_history(date_search DESC);
CREATE INDEX idx_search_history_ville ON search_history(ville);
CREATE INDEX idx_search_history_type_bien ON search_history(type_bien);
CREATE INDEX idx_search_history_user_date ON search_history(user_id, date_search DESC);

-- For analytics queries
CREATE INDEX idx_search_history_ville_type ON search_history(ville, type_bien, date_search DESC);
