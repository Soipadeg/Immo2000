-- Migration 021: Add missing user columns
-- Date: 2026-05-12
-- Description: Ajouter les colonnes manquantes à utilisateurs pour synchroniser avec le modèle SQLAlchemy

-- Vérifier quelles colonnes manquent et les ajouter si nécessaire

ALTER TABLE utilisateurs
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(6) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS requires_2fa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_fa_code VARCHAR(6) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS two_fa_code_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Créer indices pour performance des recherches
CREATE INDEX IF NOT EXISTS idx_utilisateurs_verification_token ON utilisateurs(verification_token);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_reset_token ON utilisateurs(reset_token);

-- Ajouter les commentaires
COMMENT ON COLUMN utilisateurs.verification_token IS 'Token unique pour la vérification d''email';
COMMENT ON COLUMN utilisateurs.verification_token_expires IS 'Expiration du token de vérification';
COMMENT ON COLUMN utilisateurs.reset_token IS 'Code 6 chiffres pour réinitialisation de mot de passe';
COMMENT ON COLUMN utilisateurs.reset_token_expires IS 'Expiration du code de réinitialisation';
COMMENT ON COLUMN utilisateurs.requires_2fa IS 'L''utilisateur a activé l''authentification double facteur';
COMMENT ON COLUMN utilisateurs.two_fa_code IS 'Code 6 chiffres pour 2FA';
COMMENT ON COLUMN utilisateurs.two_fa_code_expires IS 'Expiration du code 2FA';
