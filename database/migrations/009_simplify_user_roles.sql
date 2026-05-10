-- Migration 009: Simplify user roles system
-- Date: 2026-05-09
-- Description: Remove multi-role complexity. Users are simply "user" or "admin".
--              A connected user can naturally sell (create annonce) and buy (contact users).

-- 1. Drop the old enum (vendeur | acheteur | agent)
-- We need to remove the column that uses it first
ALTER TABLE utilisateurs DROP COLUMN role;

-- 2. Drop the old enum type
DROP TYPE role_utilisateur_enum;

-- 3. Create new simplified enum (user | admin)
CREATE TYPE role_utilisateur_enum AS ENUM (
    'user',
    'admin'
);

-- 4. Add back the role column with new enum
ALTER TABLE utilisateurs
ADD COLUMN role role_utilisateur_enum NOT NULL DEFAULT 'user';

-- 5. Drop the multi-role columns (no longer needed)
-- A user can naturally sell and buy without restrictions
DROP INDEX idx_utilisateurs_est_acheteur;
DROP INDEX idx_utilisateurs_est_vendeur;
DROP INDEX idx_utilisateurs_role_actif;

ALTER TABLE utilisateurs
DROP COLUMN est_acheteur,
DROP COLUMN est_vendeur,
DROP COLUMN role_actif;

-- 6. Add comment to document the simplified system
COMMENT ON COLUMN utilisateurs.role IS 'Role: user (standard) or admin (moderator)';
