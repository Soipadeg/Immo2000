# 📚 API Immo2000 - MVP Phase 1

**Dernière mise à jour:** Mai 2026
**Environnement:** http://localhost:5000
**Authentification:** JWT Bearer Token

---

## 🔐 Authentification

### 1. **POST /auth/register** - Créer un compte

**Description:** Créer un nouveau compte utilisateur

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "prenom": "Jean",
  "nom": "Dupont",
  "role": "vendeur"  // ou "acheteur"
}
```

**Response (201):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "prenom": "Jean",
  "nom": "Dupont",
  "role": "vendeur",
  "message": "Inscription réussie"
}
```

**Erreurs:**
- `400`: Email déjà utilisé, champs manquants
- `422`: Validation échouée

**Exemple curl:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@example.com",
    "password": "SecurePass123",
    "prenom": "Jean",
    "nom": "Dupont",
    "role": "vendeur"
  }'
```

---

### 2. **POST /auth/login** - Se connecter

**Description:** Obtenir un JWT token

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user_id": 1,
  "email": "user@example.com",
  "prenom": "Jean",
  "nom": "Dupont",
  "role": "vendeur"
}
```

**Erreurs:**
- `401`: Credentials incorrectes
- `400`: Email/Password manquants

**Exemple curl:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@example.com",
    "password": "SecurePass123"
  }'
```

---

## 🏠 Gestion des Biens

### 3. **GET /api/v1/biens** - Lister les biens

**Description:** Récupère la liste des biens avec filtres optionnels

**Authentification:** ✅ Requise

**Query Parameters:**
- `type_bien` (optional): "appartement" | "maison" | "terrain" | "commercial"
- `ville` (optional): Filtrer par ville
- `code_postal` (optional): Filtrer par code postal
- `surface_min` (optional): Surface minimum (en m²)
- `surface_max` (optional): Surface maximum (en m²)
- `etat` (optional): "excellent" | "bon" | "moyen" | "mauvais" | "renovation_requise"
- `limit` (optional, default=10): Nombre de résultats par page
- `offset` (optional, default=0): Offset de pagination

**Response (200):**
```json
{
  "biens": [
    {
      "bien_id": 1,
      "utilisateur_id": 1,
      "adresse": "123 Rue de Paris",
      "code_postal": "75001",
      "ville": "Paris",
      "surface": 85,
      "type_bien": "appartement",
      "nombre_pieces": 3,
      "nombre_chambres": 2,
      "nombre_salles_bain": 1,
      "prix_demande": 450000,
      "etat": "bon",
      "date_creation": "2026-05-01T10:00:00Z",
      "date_modification": "2026-05-01T10:00:00Z",
      "actif": true
    }
  ],
  "count": 1,
  "total": 45,
  "limit": 10,
  "offset": 0,
  "user_role": "vendeur"
}
```

**Exemple curl:**
```bash
# Liste simple
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/v1/biens

# Avec filtres
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/biens?ville=Paris&type_bien=appartement&surface_min=50"

# Pagination
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/biens?limit=20&offset=0"
```

---

### 4. **POST /api/v1/biens** - Créer un bien

**Description:** Créer un nouveau bien (vendeur only)

**Authentification:** ✅ Requise (vendeur)

**Body:**
```json
{
  "adresse": "123 Rue de Paris",
  "code_postal": "75001",
  "ville": "Paris",
  "surface": 85,
  "type_bien": "appartement",
  "nombre_pieces": 3,
  "nombre_chambres": 2,
  "nombre_salles_bain": 1,
  "prix_demande": 450000,
  "etat": "bon",
  "description": "Bel appartement haussmannien",
  "equipements": ["wifi", "parking"],
  "commodites": ["transport", "école"]
}
```

**Response (201):**
```json
{
  "bien_id": 1,
  "utilisateur_id": 1,
  "adresse": "123 Rue de Paris",
  "code_postal": "75001",
  "ville": "Paris",
  "surface": 85,
  "type_bien": "appartement",
  "nombre_pieces": 3,
  "nombre_chambres": 2,
  "nombre_salles_bain": 1,
  "prix_demande": 450000,
  "etat": "bon",
  "description": "Bel appartement haussmannien",
  "equipements": ["wifi", "parking"],
  "commodites": ["transport", "école"],
  "date_creation": "2026-05-01T10:00:00Z",
  "date_modification": "2026-05-01T10:00:00Z",
  "actif": true
}
```

**Erreurs:**
- `400`: Champs manquants ou invalides
- `401`: Non authentifié
- `403`: Rôle non autorisé (non-vendeur)
- `422`: Surface ≤ 0, type_bien invalide, etc.

**Exemple curl:**
```bash
curl -X POST http://localhost:5000/api/v1/biens \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adresse": "123 Rue de Paris",
    "code_postal": "75001",
    "ville": "Paris",
    "surface": 85,
    "type_bien": "appartement",
    "nombre_pieces": 3,
    "nombre_chambres": 2,
    "nombre_salles_bain": 1,
    "prix_demande": 450000,
    "etat": "bon"
  }'
```

---

### 5. **GET /api/v1/biens/me** - Mes biens

**Description:** Récupère les biens de l'utilisateur courant

**Authentification:** ✅ Requise

**Query Parameters:**
- `actif_only` (optional, default=true): Si false, inclut les biens supprimés
- `limit` (optional, default=10): Nombre de résultats
- `offset` (optional, default=0): Offset de pagination

**Response (200):**
```json
{
  "biens": [
    {
      "bien_id": 1,
      "utilisateur_id": 1,
      "adresse": "123 Rue de Paris",
      ...
    }
  ],
  "count": 1,
  "total": 5
}
```

**Exemple curl:**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/v1/biens/me
```

---

### 6. **GET /api/v1/biens/<bien_id>** - Détail d'un bien

**Description:** Récupère les détails d'un bien spécifique

**Authentification:** ✅ Requise

**Path Parameters:**
- `bien_id` (integer): ID du bien

**Response (200):**
```json
{
  "bien_id": 1,
  "utilisateur_id": 1,
  "adresse": "123 Rue de Paris",
  "code_postal": "75001",
  "ville": "Paris",
  "surface": 85,
  "type_bien": "appartement",
  "nombre_pieces": 3,
  "nombre_chambres": 2,
  "nombre_salles_bain": 1,
  "prix_demande": 450000,
  "etat": "bon",
  "date_creation": "2026-05-01T10:00:00Z",
  "date_modification": "2026-05-01T10:00:00Z",
  "actif": true,
  "proprietaire": {
    "user_id": 1,
    "email": "jean@example.com",
    "prenom": "Jean",
    "nom": "Dupont",
    "role": "vendeur"
  }
}
```

**Erreurs:**
- `404`: Bien non trouvé
- `401`: Non authentifié

**Exemple curl:**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/v1/biens/1
```

---

### 7. **GET /api/v1/biens/stats** - Statistiques

**Description:** Récupère les statistiques globales (agent only)

**Authentification:** ✅ Requise (agent)

**Response (200):**
```json
{
  "total_biens": 45,
  "par_type": {
    "appartement": 20,
    "maison": 15,
    "terrain": 5,
    "commercial": 3,
    "garage": 1,
    "parking": 1
  },
  "surface_moyenne": 125.5,
  "nombre_vendeurs": 15,
  "prix_moyen": 380000
}
```

**Erreurs:**
- `401`: Non authentifié
- `403`: Rôle non autorisé (non-agent)

**Exemple curl:**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/v1/biens/stats
```

---

## 💰 Estimations (Melo API)

### 8. **POST /api/v1/estimations** - Estimer un prix

**Description:** Obtenir une estimation de prix via Melo API

**Authentification:** ✅ Requise

**Body:**
```json
{
  "adresse": "123 Rue de Paris",
  "surface": 85,
  "type_bien": "appartement"
}
```

**Response (200):**
```json
{
  "adresse": "123 Rue de Paris",
  "surface": 85,
  "type_bien": "appartement",
  "melo_result": {
    "prix_m2": 5294,
    "fourchette_basse": 350000,
    "fourchette_haute": 475000,
    "prix_estime": 412500,
    "confiance": 0.85
  }
}
```

**Erreurs:**
- `400`: Paramètres manquants ou invalides
- `401`: Non authentifié
- `503`: Melo API indisponible
- `429`: Trop de requêtes (rate limit)

**Exemple curl:**
```bash
curl -X POST http://localhost:5000/api/v1/estimations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adresse": "123 Rue de Paris",
    "surface": 85,
    "type_bien": "appartement"
  }'
```

---

### 9. **POST /api/v1/estimations/compare** - Comparer des biens

**Description:** Comparer 2+ biens via Melo API (vendeur/agent only)

**Authentification:** ✅ Requise (vendeur/agent)

**Body:**
```json
{
  "biens": [
    {
      "adresse": "123 Rue de Paris",
      "surface": 85,
      "type_bien": "appartement"
    },
    {
      "adresse": "456 Avenue Jean",
      "surface": 95,
      "type_bien": "appartement"
    }
  ]
}
```

**Response (200):**
```json
{
  "comparaison": [
    {
      "adresse": "123 Rue de Paris",
      "surface": 85,
      "type_bien": "appartement",
      "prix_estime": 412500,
      "prix_m2": 4853
    },
    {
      "adresse": "456 Avenue Jean",
      "surface": 95,
      "type_bien": "appartement",
      "prix_estime": 475000,
      "prix_m2": 5000
    }
  ],
  "difference_prix": 62500,
  "difference_prix_m2": 147
}
```

**Erreurs:**
- `400`: Moins de 2 biens fournis
- `401`: Non authentifié
- `403`: Rôle non autorisé

**Exemple curl:**
```bash
curl -X POST http://localhost:5000/api/v1/estimations/compare \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "biens": [
      {
        "adresse": "123 Rue de Paris",
        "surface": 85,
        "type_bien": "appartement"
      },
      {
        "adresse": "456 Avenue Jean",
        "surface": 95,
        "type_bien": "appartement"
      }
    ]
  }'
```

---

## 🔑 Obtenir un Token

Après login, stockez le token:

```javascript
// Depuis LoginPage
const response = await apiLogin({email, password});
localStorage.setItem('auth_token', response.access_token);
```

Puis utilisez-le dans les requêtes:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/v1/biens
```

---

## 📝 Notes Importantes

1. **JWT Token:** Valide pendant 24h
2. **Rate Limiting:** Melo API - 100 requêtes/heure
3. **Soft Delete:** Les biens supprimés sont marqués `actif=false`, pas physiquement supprimés
4. **Validation:** Tous les paramètres sont validés côté serveur
5. **Logging:** Toutes les opérations sont loggées pour audit

---

## 🚨 Codes Erreurs Courants

| Code | Signification |
|------|---------------|
| 200 | ✅ Succès |
| 201 | ✅ Créé |
| 400 | ❌ Mauvaise requête |
| 401 | ❌ Non authentifié |
| 403 | ❌ Autorisations insuffisantes |
| 404 | ❌ Ressource non trouvée |
| 422 | ❌ Validation échouée |
| 500 | ❌ Erreur serveur |
| 503 | ❌ Service indisponible |

---

**Version:** 1.0.0 | **Statut:** MVP Phase 1 | **Auteur:** GitHub Copilot
