-- Migration 007: Add email verification columns for RGPD compliance
-- Date: 2026-05-06
-- Description: Add email verification system with tokens to ensure double opt-in compliance

-- Add email verification columns to utilisateurs table
ALTER TABLE utilisateurs
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255) UNIQUE,
ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookups
CREATE INDEX idx_utilisateurs_email_verified ON utilisateurs(email_verified);
CREATE INDEX idx_utilisateurs_verification_token ON utilisateurs(verification_token);

-- Add comment to document the verification system
COMMENT ON COLUMN utilisateurs.email_verified IS 'Indicates if the email has been verified (RGPD compliance)';
COMMENT ON COLUMN utilisateurs.verification_token IS 'Unique token sent to user email for verification';
COMMENT ON COLUMN utilisateurs.verification_token_expires IS 'Expiration timestamp for the verification token (24 hours)';
