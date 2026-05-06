-- Migration 008: Multi-role system - Unified user profile
-- Date: 2026-05-06
-- Description: Add columns for multi-role support allowing users to be both buyers and sellers

-- Add multi-role columns to utilisateurs table
ALTER TABLE utilisateurs
ADD COLUMN est_acheteur BOOLEAN DEFAULT TRUE,
ADD COLUMN est_vendeur BOOLEAN DEFAULT FALSE,
ADD COLUMN role_actif VARCHAR(50) DEFAULT 'acheteur';

-- Create indexes for role queries
CREATE INDEX idx_utilisateurs_est_acheteur ON utilisateurs(est_acheteur);
CREATE INDEX idx_utilisateurs_est_vendeur ON utilisateurs(est_vendeur);
CREATE INDEX idx_utilisateurs_role_actif ON utilisateurs(role_actif);

-- Add comments to document the multi-role system
COMMENT ON COLUMN utilisateurs.est_acheteur IS 'Indicates if user can act as a buyer (always true by default)';
COMMENT ON COLUMN utilisateurs.est_vendeur IS 'Indicates if user can act as a seller (optional, can be enabled later)';
COMMENT ON COLUMN utilisateurs.role_actif IS 'Currently active role: buyer or seller (determines interface and features)';
