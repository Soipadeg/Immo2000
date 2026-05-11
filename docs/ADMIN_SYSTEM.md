# Système Administrateur - Immo2000

## 📋 Table des matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Création du profil Admin](#-création-du-profil-admin)
3. [Fonctionnalités Admin](#-fonctionnalités-admin)
4. [Dashboard Analytics](#-dashboard-analytics)
5. [Gestion des Notaires](#-gestion-des-notaires)
6. [API Endpoints](#-api-endpoints)
7. [Permissions et Sécurité](#-permissions-et-sécurité)
8. [Guide d'Utilisation](#-guide-dutilisation)

---

## 🎯 Vue d'ensemble

Le système administrateur d'Immo2000 fournit aux administrateurs:
- ✅ Tableau de bord complet avec analytics
- ✅ Gestion complète des utilisateurs
- ✅ Création et gestion des notaires partenaires
- ✅ Statistiques de trafic en temps réel
- ✅ Audit et journal d'activité
- ✅ Gestion des permissions

### Hiérarchie des rôles

```
user (Standard)
  └─ Peut vendre et acheter des biens
  └─ Accès aux annonces, offres, messages

admin (Administrateur)
  └─ Accès à tous les endpoints admin
  └─ Peut créer des profils notaire
  └─ Accès au dashboard analytics
  └─ Gestion complète des utilisateurs

notaire (Partenaire Notaire)
  └─ Accès au dashboard notaire
  └─ Gestion des transactions notariales
  └─ Accès aux documents signés
```

---

## 🔑 Création du profil Admin

### Option 1: Script Python (Recommandé)

**Prérequis:**
- PostgreSQL en cours d'exécution
- Variables d'environnement configurées (.env)

**Exécution:**
```bash
cd /home/djali/code/Soipadeg/Immo2000

# Démarrer PostgreSQL si nécessaire
docker-compose up -d postgres
sleep 5

# Créer le profil admin
python scripts/create_admin_profile.py
```

**Résultat attendu:**
```
====================================================================
🔍 Vérification du profil Administrateur
====================================================================

❌ Aucun profil administrateur trouvé dans la base de données.

🔧 Création d'un profil administrateur test...

✅ Profil administrateur créé avec succès!

📋 Détails:
   Email: admin@immo2000.fr
   Nom: Admin Immo2000
   Rôle: admin
   Téléphone: +33123456789
   Adresse: 1 Avenue Immo2000, 75001 Paris
   Actif: ✅ Oui
   ID: 1

🔑 Identifiants de test:
   Email: admin@immo2000.fr
   Mot de passe: AdminPassword123!@

🔓 Accès à l'espace admin: /admin
```

### Option 2: SQL Direct

**Vérifier d'abord:**
```bash
psql -U immo2000 -d immo2000 -h localhost -f scripts/check_admin_role.sql
```

**Créer le profil:**
```bash
psql -U immo2000 -d immo2000 -h localhost -f scripts/create_admin_role.sql
```

### Option 3: Requête SQL Manuelle

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
    'admin@example.fr',
    '$2b$12$hash_bcrypt_du_mot_de_passe',
    'Nom',
    'Prenom',
    'admin',
    true,
    'email',
    true
);
```

---

## 📊 Fonctionnalités Admin

### 1. Tableau de Bord (Dashboard)

**Accès:** `/static/admin-dashboard.html`

**Onglets disponibles:**

#### Aperçu
- Total utilisateurs (actifs/inactifs)
- Total annonces
- Total offres
- Total notaires partenaires
- Graphique de distribution des rôles
- Graphique de croissance (7 jours)

#### Trafic
- Connexions (cette semaine)
- Annonces créées (cette semaine)
- Offres créées (cette semaine)
- Messages envoyés (cette semaine)
- Graphique du trafic hebdomadaire

#### Utilisateurs
- Utilisateurs actifs/inactifs
- Jamais connectés
- Nouveaux inscrits cette semaine
- Tableau des derniers utilisateurs
- Statistiques d'activité

#### Notaires
- Liste des notaires partenaires
- Statistiques de performance
- Bouton pour créer un nouveau notaire

#### Activité
- Graphique d'activité (7 jours)
- Journal des actions récentes
- Audit trail complet

### 2. Gestion des Utilisateurs

**Endpoints:**
```
GET    /api/v1/utilisateurs           - Lister tous les utilisateurs
GET    /api/v1/utilisateurs/<id>      - Détails utilisateur
PATCH  /api/v1/utilisateurs/<id>/deactivate - Désactiver compte
```

**Paramètres de filtrage:**
- `skip`: Pagination (défaut: 0)
- `limit`: Nombre d'éléments (défaut: 20, max: 100)
- `role`: Filtrer par rôle (user, admin, notaire)
- `actif`: Filtrer par statut (true/false)

### 3. Gestion des Notaires

**Endpoints:**
```
POST   /api/v1/notaires                 - Créer profil notaire (admin only)
GET    /api/v1/notaires                 - Lister notaires
GET    /api/v1/notaires/<id>            - Détails notaire
PUT    /api/v1/notaires/<id>            - Modifier notaire
GET    /api/v1/notaires/<id>/stats      - Statistiques notaire
```

**Important:** Seul un administrateur peut créer un profil notaire!

### 4. Analytics et Statistiques

**Endpoints:**
```
GET    /api/v1/admin/analytics              - Analytics générales
GET    /api/v1/admin/stats/user-activity    - Activité utilisateurs
```

**Paramètres:**
- `period`: 'week', 'month', 'year', 'all' (défaut: 'week')

---

## 📈 Dashboard Analytics

### Accès

1. **Connexion:**
   ```
   Email: admin@immo2000.fr
   Mot de passe: AdminPassword123!@
   ```

2. **URL:**
   ```
   http://localhost:5000/static/admin-dashboard.html
   ```

### Données affichées

#### Carte de Résumé
```json
{
  "total_users": 100,
  "active_users": 85,
  "inactive_users": 15,
  "total_listings": 250,
  "total_offers": 45,
  "total_notaires": 5
}
```

#### Distribution des Rôles
- Graphique circulaire montrant la proportion de chaque rôle
- user, admin, notaire, agent

#### Croissance Utilisateurs
- Graphique linéaire des 7 derniers jours
- Nombre de nouvelles inscriptions par jour

#### Trafic Hebdomadaire
- Graphique en barres
- Connexions, annonces, offres, messages

#### Activité Utilisateurs
- Statistiques de connexion
- Utilisateurs jamais connectés
- Nouvelles inscriptions

### Auto-refresh

Le dashboard se met à jour automatiquement toutes les 5 minutes.

---

## 🤝 Gestion des Notaires

### Créer un Notaire (Admin Only)

**Via le Dashboard:**
1. Aller dans l'onglet "Notaires"
2. Cliquer sur "Créer un Notaire"
3. Remplir le formulaire
4. Cliquer sur "Créer"

**Via API:**
```bash
curl -X POST http://localhost:5000/api/v1/notaires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "utilisateur_id": 2,
    "etude_notariale": "Étude Notariale Martin",
    "numero_rpps": "12345678901234",
    "adresse_etude": "123 rue de la Paix",
    "code_postal_etude": "75001",
    "ville_etude": "Paris",
    "telephone": "+33612345678",
    "email_professionnel": "notaire@etude.fr",
    "zone_geographique": {"regions": ["Île-de-France"]}
  }'
```

**Permissions:**
- ✅ Les admins peuvent créer des notaires
- ❌ Les utilisateurs standard NE peuvent PAS créer de notaires
- ❌ Même les notaires NE peuvent PAS créer d'autres notaires

---

## 🔌 API Endpoints

### Authentification

Tous les endpoints admin nécessitent:
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints Admin

#### 1. Lister les utilisateurs

```http
GET /api/v1/utilisateurs?skip=0&limit=20&role=user&actif=true
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK):**
```json
{
  "items": [
    {
      "utilisateur_id": 1,
      "email": "user@example.com",
      "nom": "Doe",
      "prenom": "John",
      "telephone": "0123456789",
      "adresse_contact": "123 rue",
      "role": "user",
      "actif": true,
      "date_inscription": "2026-01-15T10:00:00",
      "date_derniere_connexion": "2026-05-04T15:30:00",
      "updated_at": "2026-05-04T11:00:00"
    }
  ],
  "total": 100,
  "skip": 0,
  "limit": 20
}
```

#### 2. Obtenir les détails d'un utilisateur

```http
GET /api/v1/utilisateurs/<user_id>
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK):**
```json
{
  "utilisateur_id": 1,
  "email": "user@example.com",
  "nom": "Doe",
  "prenom": "John",
  "telephone": "0123456789",
  "adresse_contact": "123 rue",
  "role": "user",
  "actif": true,
  "date_inscription": "2026-01-15T10:00:00",
  "date_derniere_connexion": "2026-05-04T15:30:00",
  "updated_at": "2026-05-04T11:00:00",
  "annonces_count": 5
}
```

#### 3. Désactiver un utilisateur

```http
PATCH /api/v1/utilisateurs/<user_id>/deactivate
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK):**
```json
{
  "utilisateur_id": 1,
  "email": "user@example.com",
  "actif": false,
  "message": "User user@example.com has been deactivated"
}
```

#### 4. Obtenir les analytics

```http
GET /api/v1/admin/analytics?period=week
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK):**
```json
{
  "summary": {
    "total_users": 100,
    "active_users": 85,
    "inactive_users": 15,
    "total_listings": 250,
    "total_offers": 45,
    "total_notaires": 5
  },
  "users_by_role": {
    "user": 90,
    "admin": 2,
    "notaire": 5,
    "agent": 3
  },
  "traffic": {
    "logins": 342,
    "listings_created": 12,
    "offers_created": 8,
    "messages_sent": 156
  },
  "growth": {
    "new_users": 5,
    "new_listings": 12,
    "new_offers": 8
  },
  "period": "week",
  "generated_at": "2026-05-11T14:00:00"
}
```

#### 5. Obtenir les statistiques d'activité

```http
GET /api/v1/admin/stats/user-activity
Authorization: Bearer <TOKEN>
```

**Réponse (200 OK):**
```json
{
  "user_status": {
    "active": 85,
    "inactive": 15,
    "never_logged_in": 3
  },
  "new_registrations_last_7_days": [
    {"date": "2026-05-05", "count": 2},
    {"date": "2026-05-06", "count": 3},
    {"date": "2026-05-07", "count": 1}
  ],
  "total_new_registrations_this_week": 12
}
```

---

## 🔐 Permissions et Sécurité

### Contrôle d'Accès (RBAC)

| Endpoint | user | admin | notaire |
|----------|------|-------|---------|
| `/api/v1/utilisateurs` | ❌ | ✅ | ❌ |
| `/api/v1/utilisateurs/<id>` | ❌ | ✅ | ❌ |
| `/api/v1/utilisateurs/<id>/deactivate` | ❌ | ✅ | ❌ |
| `/api/v1/notaires` (POST) | ❌ | ✅ | ❌ |
| `/api/v1/notaires` (GET) | ✅ | ✅ | ✅ |
| `/api/v1/admin/analytics` | ❌ | ✅ | ❌ |
| `/api/v1/admin/stats/user-activity` | ❌ | ✅ | ❌ |

### Sécurité

1. **JWT Authentication:**
   - Tous les endpoints nécessitent un token JWT valide
   - Token stocké dans `Authorization: Bearer <TOKEN>`

2. **Admin-only Endpoints:**
   - Protégés par le décorateur `@admin_required`
   - Vérification du rôle = 'admin'

3. **Audit Trail:**
   - Toutes les actions admin sont loggées
   - Inclut: user_id, action, timestamp, details

4. **Rate Limiting (Recommandé):**
   - Limiter les requêtes par IP
   - Limiter les tentatives de login

---

## 📖 Guide d'Utilisation

### Workflow Typique

#### 1. Connexion Admin

```bash
# Obtenir le token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@immo2000.fr",
    "password": "AdminPassword123!@"
  }'

# Réponse
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "utilisateur_id": 1,
  "email": "admin@immo2000.fr",
  "role": "admin"
}

# Stocker le token
export ADMIN_TOKEN="eyJ..."
```

#### 2. Consulter le Dashboard

Accéder à: `http://localhost:5000/static/admin-dashboard.html`

Se connecter avec:
- Email: `admin@immo2000.fr`
- Mot de passe: `AdminPassword123!@`

#### 3. Créer un Notaire

Via le dashboard (formulaire) ou via API:

```bash
curl -X POST http://localhost:5000/api/v1/notaires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "utilisateur_id": 5,
    "etude_notariale": "Étude Notariale Dupont",
    "numero_rpps": "12345678901234",
    "adresse_etude": "456 avenue Paris",
    "code_postal_etude": "75002",
    "ville_etude": "Paris",
    "telephone": "+33678901234",
    "email_professionnel": "contact@etude-dupont.fr",
    "zone_geographique": {"regions": ["Île-de-France", "Hauts-de-Seine"]}
  }'
```

#### 4. Consulter les Analytics

```bash
curl -X GET 'http://localhost:5000/api/v1/admin/analytics?period=week' \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🆘 Troubleshooting

### Erreur: "Forbidden. Admin access required"

**Cause:** Le compte n'a pas le rôle `admin`

**Solution:**
```sql
UPDATE utilisateurs
SET role = 'admin'
WHERE email = 'votre-email@example.fr';
```

### Erreur: "Connection refused"

**Cause:** PostgreSQL n'est pas en cours d'exécution

**Solution:**
```bash
docker-compose up -d postgres
sleep 5
python scripts/create_admin_profile.py
```

### Dashboard ne charge pas

**Cause:** Token JWT expiré ou invalide

**Solution:**
1. Vider le localStorage: `localStorage.clear()`
2. Recharger la page
3. Se reconnecter

---

## 📊 Monitoring et Maintenance

### Vérifications Régulières

1. **Vérifier les comptes admin:**
```sql
SELECT * FROM utilisateurs WHERE role = 'admin';
```

2. **Auditer les actions:**
```sql
SELECT * FROM historique_actions
WHERE action = 'admin_access'
ORDER BY date_action DESC LIMIT 20;
```

3. **Vérifier les utilisateurs inactifs:**
```sql
SELECT * FROM utilisateurs
WHERE actif = false
ORDER BY updated_at DESC;
```

---

## 📝 Notes Importantes

- ⚠️ Ne partagez jamais les identifiants admin
- ⚠️ Changez le mot de passe admin par défaut
- ⚠️ Activez HTTPS en production
- ⚠️ Configurez CORS correctement
- ⚠️ Utilisez des variables d'environnement pour les secrets
- ✅ Activez 2FA pour les comptes admin (futur)
- ✅ Auditez régulièrement les logs
- ✅ Sauvegardez les données régulièrement

---

**Dernière mise à jour:** Mai 2026
**Version:** 1.0
**Statut:** Production Ready ✅
