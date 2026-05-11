-- Vérifier si un profil admin existe
SELECT COUNT(*) as count_admins FROM utilisateurs WHERE role = 'admin';

-- Afficher tous les profils admin
SELECT utilisateur_id, email, nom, prenom, role, actif FROM utilisateurs WHERE role = 'admin';

-- Afficher tous les rôles uniques
SELECT DISTINCT role, COUNT(*) as count FROM utilisateurs GROUP BY role ORDER BY role;
