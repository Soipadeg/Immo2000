-- Migration 006: Add OAuth support columns
-- Date: 2026-05-06
-- Description: Add Google OAuth, Facebook OAuth, and photo_url columns to support social login

-- Modify utilisateurs table to add OAuth columns
ALTER TABLE utilisateurs
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN facebook_id VARCHAR(255) UNIQUE,
ADD COLUMN apple_id VARCHAR(255) UNIQUE,
ADD COLUMN photo_url VARCHAR(500),
ADD COLUMN auth_method VARCHAR(50) DEFAULT 'email';

-- Modify mot_de_passe to be nullable (since OAuth users won't have a password)
ALTER TABLE utilisateurs
ALTER COLUMN mot_de_passe NULLIFY DEFAULT;

-- Create indexes for OAuth lookups
CREATE INDEX idx_utilisateurs_google_id ON utilisateurs(google_id);
CREATE INDEX idx_utilisateurs_facebook_id ON utilisateurs(facebook_id);
CREATE INDEX idx_utilisateurs_apple_id ON utilisateurs(apple_id);
CREATE INDEX idx_utilisateurs_auth_method ON utilisateurs(auth_method);

-- Add comment to document the auth_method values
COMMENT ON COLUMN utilisateurs.auth_method IS 'Authentication method: email, google, facebook, or apple';
