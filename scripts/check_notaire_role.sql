-- Vérifier si un profil notaire existe
SELECT COUNT(*) as count_notaires FROM utilisateurs WHERE role = 'notaire';

-- Afficher tous les profils notaire
SELECT utilisateur_id, email, nom, prenom, role, actif FROM utilisateurs WHERE role = 'notaire';

-- Afficher tous les rôles uniques
SELECT DISTINCT role, COUNT(*) as count FROM utilisateurs GROUP BY role ORDER BY role;
