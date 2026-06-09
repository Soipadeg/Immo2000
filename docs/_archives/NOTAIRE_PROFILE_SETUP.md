# Gestion du Profil Notaire

## 🎯 Objectif

Vérifier s'il existe un profil utilisateur avec le rôle "notaire" dans la base de données.
Si aucun n'existe, le créer.

## 📋 Options disponibles

### Option 1: Python Script (Recommandé - Automatique)

**Prérequis:**
- PostgreSQL doit être en cours d'exécution
- Variables d'environnement configurées (.env)

**Commande:**
```bash
cd /home/djali/code/Soipadeg/Immo2000
python scripts/create_notaire_profile.py
```

**Résultat attendu:**
```
✅ Profil notaire créé avec succès!

📋 Détails:
   Email: test.notaire@immo2000.fr
   Nom: Test Notaire
   Rôle: notaire
   Téléphone: +33612345678
   ...
```

### Option 2: SQL Scripts (Manuel)

#### 2A. Vérifier s'il existe un profil notaire
```bash
psql -U immo2000 -d immo2000 -h localhost -f scripts/check_notaire_role.sql
```

**Résultat:**
- Si `count_notaires = 0`: Aucun profil notaire
- Si `count_notaires > 0`: Au moins un profil notaire existe

#### 2B. Créer un profil notaire
```bash
psql -U immo2000 -d immo2000 -h localhost -f scripts/create_notaire_role.sql
```

**Ou manuellement:**
```bash
psql -U immo2000 -d immo2000 -h localhost
```

Puis exécuter:
```sql
INSERT INTO utilisateurs (
    email,
    mot_de_passe_hash,
    nom,
    prenom,
    role,
    actif,
    auth_method,
    email_verified
) VALUES (
    'notaire@immo2000.fr',
    '$2b$12$<votre-hash-bcrypt>',
    'Nom',
    'Prenom',
    'notaire',
    true,
    'email',
    true
);
```

### Option 3: Avec Docker

**Démarrer PostgreSQL:**
```bash
docker-compose up -d postgres
```

**Attendre que PostgreSQL soit prêt:**
```bash
docker-compose exec postgres pg_isready -U immo2000
```

**Exécuter le script Python:**
```bash
python scripts/create_notaire_profile.py
```

## 📊 Vérification

### Vérifier tous les rôles existants
```bash
psql -U immo2000 -d immo2000 -h localhost -c "
  SELECT DISTINCT role, COUNT(*) as count
  FROM utilisateurs
  GROUP BY role
  ORDER BY role;
"
```

### Afficher tous les profils notaire
```bash
psql -U immo2000 -d immo2000 -h localhost -c "
  SELECT utilisateur_id, email, nom, prenom, role
  FROM utilisateurs
  WHERE role = 'notaire';
"
```

## 🔐 Profil Test Créé

Si le script a créé un profil notaire, voici les identifiants:

| Champ | Valeur |
|-------|--------|
| **Email** | test.notaire@immo2000.fr |
| **Mot de passe** | SecurePassword123!@ |
| **Rôle** | notaire |
| **Nom** | Test |
| **Prénom** | Notaire |
| **Téléphone** | +33612345678 |
| **Adresse** | 123 Rue du Notariat, 75001 Paris |
| **Actif** | ✅ Oui |

## 🧪 Test de Connexion

Une fois le profil créé:

```bash
# Tester la connexion avec curl
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.notaire@immo2000.fr",
    "password": "SecurePassword123!@"
  }'
```

Réponse attendue:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "utilisateur_id": 1,
  "email": "test.notaire@immo2000.fr",
  "role": "notaire"
}
```

## 📝 Notes importantes

1. **Rôle "notaire" vs "admin":**
   - `notaire`: Professionnel notaire (nouveau rôle pour Phase 3)
   - `admin`: Administrateur plateforme
   - `user`: Utilisateur standard (vendeur/acheteur)

2. **Sécurité:**
   - Mot de passe changé par l'utilisateur à la première connexion
   - Email vérifié automatiquement (pour les tests)
   - Peut être modifié dans le script si nécessaire

3. **Intégration:**
   - Le profil notaire est lié au système Notaire (Phase 3)
   - Voir: [docs/NOTAIRE_SYSTEM.md](../docs/NOTAIRE_SYSTEM.md)

## ✅ Checklist

- [ ] PostgreSQL est en cours d'exécution
- [ ] Variables d'environnement configurées (.env)
- [ ] Script exécuté: `python scripts/create_notaire_profile.py`
- [ ] Profil notaire créé/vérifié
- [ ] Connexion testée avec les identifiants fournis
- [ ] Dashboard notaire fonctionnel

## 🆘 Troubleshooting

### Erreur: "connection refused"
```bash
# PostgreSQL n'est pas disponible
docker-compose up -d postgres
# Attendre 5-10 secondes et réessayer
```

### Erreur: "duplicate key value"
```bash
# Le profil existe déjà
# Vérifier avec: psql ... -c "SELECT * FROM utilisateurs WHERE email='test.notaire@immo2000.fr';"
```

### Erreur: "ModuleNotFoundError"
```bash
# S'assurer d'être dans le bon répertoire
cd /home/djali/code/Soipadeg/Immo2000
python scripts/create_notaire_profile.py
```

---

**Dernière mise à jour:** Mai 2026 | **Version:** 1.0
