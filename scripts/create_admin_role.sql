-- Créer un profil admin test si aucun n'existe
-- À exécuter si: SELECT COUNT(*) FROM utilisateurs WHERE role = 'admin'; retourne 0

BEGIN;

-- Créer le profil admin s'il n'existe pas
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
    'admin@immo2000.fr',
    '$2b$12$8EQ.Bq9qxH5Y2LJ9L.pYKeXtPvxJvN5mJ8R2Q6Y3Z1X0W9V8U7T6S',
    'Admin',
    'Immo2000',
    '+33123456789',
    '1 Avenue Immo2000, 75001 Paris',
    'admin',
    true,
    NOW(),
    'email',
    true
) ON CONFLICT (email) DO NOTHING;

-- Afficher le résultat
SELECT 'Profil admin créé/vérifié' as result;
SELECT COUNT(*) as admin_count FROM utilisateurs WHERE role = 'admin';
SELECT utilisateur_id, email, nom, prenom, role FROM utilisateurs WHERE role = 'admin' LIMIT 5;

COMMIT;

-- Note: Le mot de passe hash ci-dessus est pour "AdminPassword123!@"
-- Pour créer un autre profil admin, utiliser bcrypt avec 12 rounds
