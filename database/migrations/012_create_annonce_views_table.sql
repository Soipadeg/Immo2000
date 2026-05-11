-- Migration 012: Create annonce_views table for tracking views/impressions
-- Purpose: Record every view of an annonce to track analytics and trending

CREATE TABLE IF NOT EXISTS annonce_views (
    view_id SERIAL PRIMARY KEY,
    annonce_id INTEGER NOT NULL REFERENCES annonces(annonce_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES utilisateurs(user_id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    date_view TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duree_vue INTEGER DEFAULT 0,
    source VARCHAR(50) DEFAULT 'direct'
);

-- Create indices for efficient queries
CREATE INDEX idx_annonce_views_annonce_id ON annonce_views(annonce_id);
CREATE INDEX idx_annonce_views_user_id ON annonce_views(user_id);
CREATE INDEX idx_annonce_views_date_view ON annonce_views(date_view DESC);
CREATE INDEX idx_annonce_views_source ON annonce_views(source);
CREATE INDEX idx_annonce_views_composite ON annonce_views(annonce_id, date_view DESC);

-- For analytics queries
CREATE INDEX idx_annonce_views_date_source ON annonce_views(date_view, source);
