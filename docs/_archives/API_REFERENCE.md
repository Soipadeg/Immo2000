# 📖 Annonces API - Référence Complète

Référence détaillée de tous les endpoints, paramètres, réponses et codes d'erreur.

---

## Table des Matières

1. [Authentification](#authentification)
2. [Endpoints](#endpoints)
   - [POST /api/v1/annonces](#post-api-v1-annonces)
   - [GET /api/v1/annonces](#get-api-v1-annonces)
   - [GET /api/v1/annonces/{id}](#get-api-v1-annoncesid)
   - [PUT /api/v1/annonces/{id}](#put-api-v1-annoncesid)
   - [DELETE /api/v1/annonces/{id}](#delete-api-v1-annoncesid)
   - [POST /api/v1/annonces/{id}/publier](#post-api-v1-annoncesidpublier-bonus)
3. [Codes d'Erreur](#codes-derreur)
4. [Filtres & Paramètres](#filtres--paramètres)
5. [Workflow de Publication](#workflow-de-publication-bonus)

---

## Authentification

### En-tête Authorization

Tous les endpoints protégés requièrent un header **Authorization** avec un JWT Bearer token :

```bash
Authorization: Bearer <token>
```

**Exemple :**
```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  http://localhost:5000/api/v1/annonces
```

### Récupérer un Token

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendeur@example.com",
    "password": "yourpassword"
  }'
```

Réponse :
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 123,
  "role": "vendeur"
}
```

---

## Endpoints

### POST /api/v1/annonces

**Créer une nouvelle annonce.**

- **Auth :** ✅ JWT Required
- **Status :** 201 Created
- **Body Type :** application/json

#### Request Body

```json
{
  "titre": "Maison 4 pièces à Paris",
  "description": "Belle maison lumineuse avec jardin",
  "prix": 500000.0,
  "surface": 120.5,
  "adresse": "12 rue de la Paix",
  "code_postal": "75002",
  "ville": "Paris",
  "type_bien": "maison",
  "nombre_pieces": 4,
  "photos": ["url1", "url2"],
  "etage": null,
  "ascenseur": false,
  "balcon": false,
  "terrasse": true,
  "jardin": true,
  "piscine": false,
  "parking": true,
  "dpe": "C",
  "annee_construction": 2010
}
```

#### Réponse (201)

```json
{
  "annonce_id": 1,
  "titre": "Maison 4 pièces à Paris",
  "description": "Belle maison lumineuse avec jardin",
  "prix": 500000.0,
  "surface": 120.5,
  "adresse": "12 rue de la Paix",
  "code_postal": "75002",
  "ville": "Paris",
  "type_bien": "maison",
  "nombre_pieces": 4,
  "utilisateur_id": 123,
  "photos": ["url1", "url2"],
  "etage": null,
  "ascenseur": false,
  "balcon": false,
  "terrasse": true,
  "jardin": true,
  "piscine": false,
  "parking": true,
  "dpe": "C",
  "annee_construction": 2010,
  "statut": "brouillon",
  "date_creation": "2026-05-04T10:00:00",
  "date_modification": "2026-05-04T10:00:00"
}
```

#### Erreurs Courants

| Code | Raison |
|------|--------|
| **400** | Validation échouée (prix ≤ 0, code_postal invalide, etc.) |
| **401** | Token manquant ou expiré |
| **422** | Données invalides (types incorrects) |

#### Exemple cURL

```bash
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maison à Paris",
    "description": "Belle maison",
    "prix": 500000.0,
    "surface": 120.5,
    "adresse": "12 rue de la Paix",
    "code_postal": "75002",
    "ville": "Paris",
    "type_bien": "maison",
    "nombre_pieces": 4
  }'
```

---

### GET /api/v1/annonces

**Lister les annonces avec pagination et filtrage.**

- **Auth :** ❌ Public
- **Status :** 200 OK
- **Default Limit :** 20 (max 100)

#### Query Parameters

```
?skip=0&limit=20&ville=Paris&type_bien=maison&prix_min=400000&prix_max=600000&search=jardin
```

| Paramètre | Type | Description |
|-----------|------|-------------|
| **skip** | int | Nombre de résultats à ignorer (default: 0) |
| **limit** | int | Limite de résultats (default: 20, max: 100) |
| **ville** | string | Filtrer par ville (case-insensitive) |
| **code_postal** | string | Filtrer par code postal exact |
| **type_bien** | string | Filtrer par type (maison, appartement, terrain, local commercial) |
| **prix_min** | float | Prix minimum |
| **prix_max** | float | Prix maximum |
| **surface_min** | float | Surface minimale en m² |
| **surface_max** | float | Surface maximale en m² |
| **statut** | string | Filtrer par statut (brouillon, publiée, vendue, archivée) |
| **utilisateur_id** | int | Annonces d'un utilisateur spécifique |
| **search** | string | Recherche texte (titre + description) |

#### Réponse (200)

```json
{
  "items": [
    {
      "annonce_id": 1,
      "titre": "Maison 4 pièces à Paris",
      "prix": 500000.0,
      "statut": "publiée",
      ...
    }
  ],
  "total": 42,
  "skip": 0,
  "limit": 20
}
```

#### Exemples

```bash
# Lister toutes les annonces
curl http://localhost:5000/api/v1/annonces

# Lister avec pagination
curl "http://localhost:5000/api/v1/annonces?skip=20&limit=10"

# Filtrer par ville et type
curl "http://localhost:5000/api/v1/annonces?ville=Paris&type_bien=maison"

# Filtrer par plage de prix
curl "http://localhost:5000/api/v1/annonces?prix_min=400000&prix_max=600000"

# Recherche texte
curl "http://localhost:5000/api/v1/annonces?search=jardin"

# Combiner filtres
curl "http://localhost:5000/api/v1/annonces?ville=Lyon&type_bien=appartement&surface_min=50&surface_max=120"
```

---

### GET /api/v1/annonces/{id}

**Récupérer une annonce unique.**

- **Auth :** ❌ Public
- **Status :** 200 OK ou 404 Not Found

#### Path Parameters

| Paramètre | Type | Description |
|-----------|------|-------------|
| **id** | int | ID de l'annonce |

#### Réponse (200)

```json
{
  "annonce_id": 1,
  "titre": "Maison 4 pièces à Paris",
  "description": "Belle maison lumineuse avec jardin",
  "prix": 500000.0,
  "surface": 120.5,
  "adresse": "12 rue de la Paix",
  "code_postal": "75002",
  "ville": "Paris",
  "type_bien": "maison",
  "nombre_pieces": 4,
  "utilisateur_id": 123,
  "photos": ["url1", "url2"],
  "statut": "publiée",
  "date_creation": "2026-05-04T10:00:00",
  "date_modification": "2026-05-04T10:00:00"
}
```

#### Erreurs

| Code | Raison |
|------|--------|
| **404** | Annonce non trouvée |

#### Exemple cURL

```bash
curl http://localhost:5000/api/v1/annonces/1
```

---

### PUT /api/v1/annonces/{id}

**Mettre à jour une annonce (propriétaire seulement).**

- **Auth :** ✅ JWT Required + Owner Check
- **Status :** 200 OK
- **Body Type :** application/json

#### Request Body (tous champs optionnels)

```json
{
  "titre": "Maison rénovée",
  "description": "Maison rénovée avec piscine",
  "prix": 480000.0,
  "surface": 125.0,
  "statut": "publiée"
}
```

#### Réponse (200)

Retourne l'annonce complète avec les modifications.

#### Erreurs

| Code | Raison |
|------|--------|
| **400** | Validation échouée |
| **401** | Token manquant ou expiré |
| **403** | Vous n'êtes pas propriétaire |
| **404** | Annonce non trouvée |

#### Exemple cURL

```bash
curl -X PUT http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prix": 480000.0,
    "statut": "publiée"
  }'
```

---

### DELETE /api/v1/annonces/{id}

**Supprimer une annonce (propriétaire seulement).**

- **Auth :** ✅ JWT Required + Owner Check
- **Status :** 204 No Content (pas de body)

#### Réponse (204)

Pas de contenu.

#### Erreurs

| Code | Raison |
|------|--------|
| **401** | Token manquant ou expiré |
| **403** | Vous n'êtes pas propriétaire |
| **404** | Annonce non trouvée |

#### Exemple cURL

```bash
curl -X DELETE http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST /api/v1/annonces/{id}/publier [BONUS]

**Publier une annonce (brouillon → publiée).**

- **Auth :** ✅ JWT Required + Owner Check
- **Status :** 200 OK
- **Body :** Vide

#### Réponse (200)

Annonce avec `statut: "publiée"`.

```json
{
  "annonce_id": 1,
  "statut": "publiée",
  ...
}
```

#### Erreurs

| Code | Raison |
|------|--------|
| **401** | Token manquant ou expiré |
| **403** | Vous n'êtes pas propriétaire |
| **404** | Annonce non trouvée |
| **422** | Annonce non en brouillon (déjà publiée) |

#### Exemple cURL

```bash
curl -X POST http://localhost:5000/api/v1/annonces/1/publier \
  -H "Authorization: Bearer $TOKEN"
```

---

## Codes d'Erreur

### 400 Bad Request

Erreur de validation ou de paramètre.

```json
{
  "error": "Validation error",
  "code": 400,
  "details": [
    {
      "loc": ["prix"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

### 401 Unauthorized

Token manquant, expiré ou invalide.

```json
{
  "error": "Authorization token is missing or invalid",
  "code": 401
}
```

### 403 Forbidden

Vous n'êtes pas autorisé (ex: non-propriétaire).

```json
{
  "error": "Vous ne pouvez modifier que vos propres annonces",
  "code": 403
}
```

### 404 Not Found

Ressource non trouvée.

```json
{
  "error": "Annonce 999 non trouvée",
  "code": 404
}
```

### 422 Unprocessable Entity

Opération valide mais illogique (ex: publier déjà publiée).

```json
{
  "error": "Seules les annonces en brouillon peuvent être publiées. Statut actuel: publiée",
  "code": 422
}
```

---

## Filtres & Paramètres

### Types de Bien

```
"maison"
"appartement"
"terrain"
"local commercial"
```

### Statuts d'Annonce

```
"brouillon"     (créée, non publiée)
"publiée"       (visible publiquement)
"vendue"        (transaction conclue)
"archivée"      (archivée par propriétaire)
```

### Classes DPE

```
"A" (Très performant)
"B" (Performant)
"C" (Normal)
"D" (Moyen)
"E" (Faible)
"F" (Très faible)
"G" (Extrêmement faible)
```

### Critères Filtrage Texte

| Filtre | Champs |
|--------|--------|
| **search** | titre, description |

---

## Workflow de Publication [BONUS]

### Transitions de Statut Valides

```
brouillon → publiée    (via POST /publier)
publiée → vendue       (via PUT avec statut: "vendue")
publiée → archivée     (via PUT avec statut: "archivée")
```

### Exemple Complet

```bash
# 1. Créer en brouillon
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titre": "...", ...}'
# Réponse: { "annonce_id": 1, "statut": "brouillon" }

# 2. Mettre à jour
curl -X PUT http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prix": 480000.0}'

# 3. Publier
curl -X POST http://localhost:5000/api/v1/annonces/1/publier \
  -H "Authorization: Bearer $TOKEN"
# Réponse: { "annonce_id": 1, "statut": "publiée" }

# 4. Marquer comme vendue
curl -X PUT http://localhost:5000/api/v1/annonces/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"statut": "vendue"}'
```

---

**Pour la documentation d'implémentation**, voir [EXAMPLES.md](EXAMPLES.md) 💻
