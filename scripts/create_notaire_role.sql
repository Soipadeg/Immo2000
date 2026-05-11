-- Créer un profil notaire test si aucun n'existe
-- À exécuter si: SELECT COUNT(*) FROM utilisateurs WHERE role = 'notaire'; retourne 0

BEGIN;

-- Créer le profil notaire s'il n'existe pas
INSERT INTO utilisateurs (
    email,
    mot_de_passe_hash,
    nom,
    prenom,
    telephone,
    adresse_contact,
    role,
    actif,
    date_inscription,
    auth_method,
    email_verified
) VALUES (
    'test.notaire@immo2000.fr',
    '$2b$12$8EQ.Bq9qxH5Y2LJ9L.pYKeXtPvxJvN5mJ8R2Q6Y3Z1X0W9V8U7T6S',
    'Test',
    'Notaire',
    '+33612345678',
    '123 Rue du Notariat, 75001 Paris',
    'notaire',
    true,
    NOW(),
    'email',
    true
) ON CONFLICT (email) DO NOTHING;

-- Afficher le résultat
SELECT 'Profil notaire créé/vérifié' as result;
SELECT COUNT(*) as notaires_count FROM utilisateurs WHERE role = 'notaire';
SELECT utilisateur_id, email, nom, prenom, role FROM utilisateurs WHERE role = 'notaire' LIMIT 5;

COMMIT;

-- Note: Le mot de passe hash ci-dessus est pour "SecurePassword123!@"
-- Pour créer un autre profil notaire, utiliser bcrypt avec 12 rounds
