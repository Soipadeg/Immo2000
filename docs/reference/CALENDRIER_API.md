# 📅 API Réservation de Visites - Référence Développeur

**Calendrier & Reservations** - Endpoints pour gérer les réservations de visites entre acheteurs et annonces.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Endpoints](#endpoints)
4. [Schémas](#schémas)
5. [Codes d'erreur](#codes-derreur)
6. [Exemples curl](#exemples-curl)
7. [Logique métier](#logique-métier)

---

## Vue d'ensemble

**Service:** Gestion des réservations de visites
**Base URL:** `http://localhost:5000/api/v1/visites`
**Version:** 1.0
**Status:** ✅ Production Ready

**Endpoints:**
- `POST   /api/v1/visites`                      → Créer une visite
- `GET    /api/v1/visites`                      → Lister les visites (acheteur ou vendeur)
- `PUT    /api/v1/visites/<id>`                 → Modifier une visite (date/heure/statut)
- `DELETE /api/v1/visites/<id>`                 → Annuler une visite
- `GET    /api/v1/visites/<id>/download.ics`    → Télécharger fichier iCalendar (.ics)
- `POST   /api/v1/feedbacks`                    → Soumettre un feedback post-visite
- `GET    /api/v1/visites/<id>/feedback`        → Récupérer un feedback
- `PUT    /api/v1/feedbacks/<id>/reponse`       → Ajouter réponse vendeur au feedback
- `GET    /api/v1/visites/info`                 → Infos publiques (sans auth)

---

## Authentification

Tous les endpoints (sauf `/info`) **nécessitent un JWT token**.

### En-têtes requis:
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

### Obtenir un token:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "mot_de_passe": "password123"}'
```

**Réponse:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 1,
  "email": "user@example.com",
  "role": "acheteur"
}
```

---

## Endpoints

### 1️⃣ POST /api/v1/visites

Créer une nouvelle réservation de visite.

**Authentification:** ✅ Requise (JWT)

**Request Body:**
```json
{
  "acheteur_id": 1,
  "annonce_id": 5,
  "date_heure": "2026-05-20T14:00:00"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "acheteur_id": 1,
    "annonce_id": 5,
    "date_heure": "2026-05-20T14:00:00",
    "statut": "confirmee",
    "score_matching": 5,
    "message": "Visite créée avec succès. Notification envoyée au vendeur."
  }
}
```

**Validations:**
- `acheteur_id`: Entier > 0, doit exister
- `annonce_id`: Entier > 0, doit exister et être "publiée"
- `date_heure`: Format ISO 8601, doit être future
- Score matching: ≥ 5 requis
- Unicité: Une seule visite par annonce à une date/heure

**Error Responses:**

| Code | Message | Cause |
|------|---------|-------|
| 400 | `"La date ne peut pas être dans le passé"` | Date invalide |
| 400 | `"L'annonce #5 n'existe pas"` | Annonce inexistante |
| 400 | `"L'acheteur #1 n'existe pas"` | Acheteur inexistant |
| 400 | `"Une visite est déjà réservée pour cette annonce à cette heure"` | Double réservation |
| 403 | `"L'acheteur n'a pas un score suffisant (score: 3/5)"` | Score < 5 |
| 422 | `"Données invalides"` | Validation Pydantic échouée |
| 500 | `"Erreur serveur: ..."` | Erreur non gérée |

---

### 2️⃣ GET /api/v1/visites

Lister les visites de l'utilisateur connecté.

**Authentification:** ✅ Requise (JWT)

**Query Parameters:**
- `statut` (optional): Filter par statut (`confirmee`, `annulee`, `terminee`)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "acheteur_id": 1,
      "annonce_id": 5,
      "date_heure": "2026-05-20T14:00:00",
      "statut": "confirmee",
      "created_at": "2026-05-06T10:30:00",
      "updated_at": "2026-05-06T10:30:00"
    },
    {
      "id": 2,
      "acheteur_id": 1,
      "annonce_id": 8,
      "date_heure": "2026-05-25T09:00:00",
      "statut": "annulee",
      "created_at": "2026-05-06T11:15:00",
      "updated_at": "2026-05-06T15:45:00"
    }
  ],
  "count": 2
}
```

**Logique:**
- Si l'utilisateur est **acheteur** → Liste ses visites personnelles
- Si l'utilisateur est **vendeur** → Liste les visites pour toutes ses annonces

---

### 3️⃣ DELETE /api/v1/visites/<id>

Annuler une visite existante.

**Authentification:** ✅ Requise (JWT)

**Path Parameters:**
- `id`: ID de la visite (entier > 0)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "statut": "annulee",
    "message": "Visite annulée avec succès."
  }
}
```

**Error Responses:**

| Code | Message | Cause |
|------|---------|-------|
| 404 | `"La visite #1 n'existe pas"` | Visite non trouvée |
| 400 | `"La visite #1 est déjà annulée"` | Visite déjà annulée |

---

### 4️⃣ PUT /api/v1/visites/{id}

Modifier une visite existante (date/heure et/ou statut).

**Authentification:** ✅ Requise (JWT)
**Accès:** Acheteur ou vendeur uniquement

**Path Parameters:**
- `id`: ID de la visite (entier > 0)

**Request Body (au moins un champ):**
```json
{
  "date_heure": "2026-05-25T15:00:00",  // Nouvelle date/heure ISO 8601, optionnel
  "statut": "confirmee"                  // "confirmee" ou "annulee", optionnel
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "date_heure": "2026-05-25T15:00:00",
    "statut": "confirmee",
    "message": "RDV modifié avec succès. Notifications envoyées."
  }
}
```

**Validations:**
- Utilisateur doit être acheteur OU vendeur de la visite
- Si nouvelle date: doit être future et sans conflit
- Impossible de modifier une visite déjà passée
- Notifications envoyées aux deux parties

**Error Responses:**

| Code | Message | Cause |
|------|---------|-------|
| 400 | `"Veuillez fournir au moins 'date_heure' ou 'statut'"` | Pas de champ fourni |
| 400 | `"La date ne peut pas être dans le passé"` | Date invalide |
| 400 | `"Une visite existe déjà à cette nouvelle date/heure"` | Conflit date |
| 400 | `"Impossible de modifier une visite qui a déjà eu lieu"` | Visite passée |
| 403 | `"Vous n'êtes pas autorisé à modifier cette visite"` | Non autorisé |
| 404 | `"La visite #1 n'existe pas"` | Visite non trouvée |

---

### 5️⃣ GET /api/v1/visites/<id>/download.ics

Télécharger un fichier iCalendar (.ics) pour ajouter la visite au calendrier mobile.

**Authentification:** ✅ Requise (JWT)
**Accès:** Acheteur ou vendeur uniquement

**Path Parameters:**
- `id`: ID de la visite (entier > 0)

**Response (200 OK):**
```
Content-Type: text/calendar
Content-Disposition: attachment; filename=visite-1.ics

BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Immo2000//Visite//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:immo2000-visite-1@immo2000.fr
DTSTAMP:20260506T140000Z
DTSTART:20260520T140000
DTEND:20260520T150000
SUMMARY:Visite immobilière - Bel appartement à Paris
DESCRIPTION:Rendez-vous pour visiter le bien situé à 123 Rue de Paris...
LOCATION:123 Rue de Paris, 75001 Paris
ORGANIZER:mailto:vendeur@example.com
ATTENDEE:mailto:acheteur@example.com
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
```

**Usage:**
- **iPhone:** Télécharge → Apple Calendar l'importe automatiquement
- **Android:** Télécharge → Google Calendar l'importe automatiquement

**Error Responses:**

| Code | Message | Cause |
|------|---------|-------|
| 403 | `"Vous n'avez pas accès à cette visite"` | Non autorisé |
| 404 | `"Visite inexistante"` | Visite non trouvée |
| 500 | `"Erreur lors de la génération du fichier"` | Erreur serveur |

---

### 6️⃣ POST /api/v1/feedbacks

Soumettre un feedback (avis) pour une visite.

**Authentification:** ✅ Requise (JWT)
**Accès:** Acheteur uniquement

**Request Body:**
```json
{
  "visite_id": 1,
  "note": 4,
  "commentaire": "Belle visite, mais la cuisine est un peu petite."
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "visite_id": 1,
    "note": 4,
    "commentaire": "Belle visite, mais la cuisine est un peu petite.",
    "created_at": "2026-05-20T16:00:00",
    "message": "Feedback enregistré. Merci !"
  }
}
```

**Validations:**
- `note`: Entier entre 1 et 5 (requis)
- `commentaire`: Texte max 1000 caractères (optionnel)
- Visite doit être terminée (date/heure < maintenant)
- 1 feedback max par visite/acheteur (UNIQUE constraint)

**Error Responses:**

| Code | Message | Cause |
|------|---------|-------|
| 400 | `"Vous ne pouvez laisser un feedback que après la visite"` | Visite future |
| 400 | `"Vous avez déjà laissé un feedback pour cette visite"` | Doublon |
| 403 | `"Vous devez être un acheteur pour laisser un feedback"` | Non acheteur |
| 404 | `"La visite #1 n'existe pas"` | Visite non trouvée |
| 422 | `"Données invalides"` | Validation échouée |

---

### 7️⃣ GET /api/v1/visites/{id}/feedback

Récupérer le feedback d'une visite.

**Authentification:** ✅ Requise (JWT)
**Accès:** Vendeur ou acheteur de la visite

**Path Parameters:**
- `id`: ID de la visite (entier > 0)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "visite_id": 1,
    "acheteur_id": 2,
    "note": 4,
    "commentaire": "Belle visite, mais la cuisine est un peu petite.",
    "reponse_vendeur": "Merci pour votre retour! La cuisine a été rénovée depuis...",
    "created_at": "2026-05-20T16:00:00",
    "updated_at": "2026-05-20T16:00:00"
  }
}
```

**Error Responses:**

| Code | Message | Cause |
|------|---------|-------|
| 403 | `"Vous n'avez pas accès au feedback de cette visite"` | Non autorisé |
| 404 | `"Visite #1 n'existe pas"` | Visite non trouvée |
| 404 | `"Aucun feedback trouvé pour cette visite"` | Pas de feedback |

---

### 8️⃣ PUT /api/v1/feedbacks/{id}/reponse

Ajouter ou modifier la réponse du vendeur à un feedback.

**Authentification:** ✅ Requise (JWT)
**Accès:** Vendeur de l'annonce uniquement

**Path Parameters:**
- `id`: ID du feedback (entier > 0)

**Request Body:**
```json
{
  "reponse_vendeur": "Merci pour votre retour! La cuisine a été rénovée depuis et elle est désormais spacieuse."
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "visite_id": 1,
    "acheteur_id": 2,
    "note": 4,
    "commentaire": "Belle visite, mais la cuisine est un peu petite.",
    "reponse_vendeur": "Merci pour votre retour! La cuisine a été rénovée...",
    "created_at": "2026-05-20T16:00:00",
    "updated_at": "2026-05-20T17:30:00"
  }
}
```

**Validations:**
- `reponse_vendeur`: Texte min 1 caractère, max 1000 (requis)

**Error Responses:**

| Code | Message | Cause |
|------|---------|-------|
| 400 | `"Données invalides"` | Texte vide ou invalide |
| 403 | `"Seul le vendeur de l'annonce peut répondre"` | Non vendeur |
| 404 | `"Feedback #1 n'existe pas"` | Feedback non trouvé |
| 422 | `"Données invalides"` | Validation échouée |

---

### 9️⃣ GET /api/v1/visites/info

Obtenir les informations publiques sur les visites.

**Authentification:** ❌ Pas requise

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "min_score_matching": 5,
    "statuts_valides": ["confirmee", "annulee", "terminee"],
    "description": "Un acheteur peut réserver une visite si son score de matching est >= 5 pour cette annonce."
  }
}
```

---

### 5️⃣ GET /api/v1/visites/info

Obtenir les informations publiques sur les visites.

**Authentification:** ❌ Pas requise

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "min_score_matching": 5,
    "statuts_valides": ["confirmee", "annulee", "terminee"],
    "description": "Un acheteur peut réserver une visite si son score de matching est >= 5 pour cette annonce."
  }
}
```

---

## Schémas

### VisiteInput (POST)
```python
class VisiteInput(BaseModel):
    acheteur_id: int        # ID acheteur (> 0)
    annonce_id: int         # ID annonce (> 0)
    date_heure: str         # ISO 8601 (ex: "2026-05-20T14:00:00")
```

### VisiteOutput (Response)
```python
class VisiteOutput(BaseModel):
    id: int                 # ID visite (auto-généré)
    acheteur_id: int
    annonce_id: int
    date_heure: str         # ISO 8601
    statut: str             # "confirmee", "annulee", ou "terminee"
    score_matching: int     # Score (≥ 5)
    message: str            # Message de confirmation
```

### VisiteResponse (GET)
```python
class VisiteResponse(BaseModel):
    id: int
    acheteur_id: int
    annonce_id: int
    date_heure: str
    statut: str
    created_at: str         # ISO 8601 (nullable)
    updated_at: str         # ISO 8601 (nullable)
```

---

## Codes d'erreur

### 400 Bad Request
Erreur de validation: données invalides, ressource inexistante, conflit d'unicité.

**Exemples:**
- Date dans le passé
- Annonce/acheteur inexistant
- Double réservation
- Format ISO 8601 invalide

### 403 Forbidden
Score de matching insuffisant (< 5).

```json
{
  "status": "error",
  "error": "L'acheteur n'a pas un score suffisant (score: 3/5)."
}
```

### 404 Not Found
Ressource inexistante (visite, annonce, acheteur).

### 422 Unprocessable Entity
Erreur Pydantic: données ne respectent pas le schéma.

```json
{
  "status": "error",
  "error": "Données invalides",
  "details": [
    "date_heure: string type required (type=type_error.string)"
  ]
}
```

### 500 Internal Server Error
Erreur serveur non gérée.

---

## Exemples curl

### 1️⃣ Créer une visite
```bash
curl -X POST http://localhost:5000/api/v1/visites \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "acheteur_id": 1,
    "annonce_id": 5,
    "date_heure": "2026-05-20T14:00:00"
  }'
```

### 2️⃣ Lister les visites (acheteur)
```bash
curl -X GET http://localhost:5000/api/v1/visites \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 3️⃣ Lister les visites (filtrer par statut)
```bash
curl -X GET "http://localhost:5000/api/v1/visites?statut=confirmee" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 4️⃣ Modifier une visite (changer la date)
```bash
curl -X PUT http://localhost:5000/api/v1/visites/1 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "date_heure": "2026-05-25T15:00:00"
  }'
```

### 5️⃣ Annuler une visite (via statut)
```bash
curl -X PUT http://localhost:5000/api/v1/visites/1 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"statut": "annulee"}'
```

### 6️⃣ Annuler une visite (DELETE)
```bash
curl -X DELETE http://localhost:5000/api/v1/visites/1 \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 7️⃣ Télécharger le fichier .ics
```bash
curl -X GET http://localhost:5000/api/v1/visites/1/download.ics \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  --output visite-1.ics

# Importer dans Apple Calendar (macOS)
open -a Calendar visite-1.ics

# Ou copier dans Google Drive pour importer
```

### 8️⃣ Soumettre un feedback
```bash
curl -X POST http://localhost:5000/api/v1/feedbacks \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "visite_id": 1,
    "note": 4,
    "commentaire": "Belle visite, mais la cuisine est un peu petite."
  }'
```

### 9️⃣ Récupérer un feedback
```bash
curl -X GET http://localhost:5000/api/v1/visites/1/feedback \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 🔟 Ajouter une réponse vendeur au feedback
```bash
curl -X PUT http://localhost:5000/api/v1/feedbacks/1/reponse \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "reponse_vendeur": "Merci pour votre retour! La cuisine a été rénovée depuis."
  }'
```

### 1️⃣1️⃣ Obtenir les infos publiques
```bash
curl -X GET http://localhost:5000/api/v1/visites/info
```

---

## Logique métier

### Création d'une visite

**Validations (dans l'ordre):**

1. **Format date/heure**
   - Parser ISO 8601
   - Vérifier que date ≥ maintenant

2. **Vérification annonce**
   - Annonce existe
   - Annonce statut = "publiée"

3. **Vérification acheteur**
   - Acheteur existe

4. **Score de matching**
   - Score = Σ(budget, localisation, type bien, surface)
   - Score ≥ 5 requis

5. **Disponibilité**
   - Aucune visite "confirmee" à cette date/heure
   - (Constraint UNIQUE en BD)

6. **Création + Notifications**
   - Créer visite en BD (statut = "confirmee")
   - Envoyer email au vendeur

### Modification d'une visite

**Validations:**

1. Utilisateur = acheteur OU vendeur
2. Visite pas déjà passée (date_heure > maintenant)
3. Si nouvelle date: future et sans conflit
4. Notifications email aux deux parties

### Feedback post-visite

**Validations:**

1. Utilisateur = acheteur de la visite
2. Visite terminée (date < maintenant et statut="terminee")
3. 1 feedback max par visite/acheteur
4. Note: 1-5 étoiles
5. Commentaire: max 1000 caractères

**Réponse vendeur:**
- Seul le vendeur de l'annonce peut répondre
- Optionnel mais recommandé

### Scoring de matching

| Critère | Points | Condition |
|---------|--------|-----------|
| Budget | 1 | `acheteur.budget_max >= annonce.prix` |
| Localisation | 2 | `acheteur.code_postal == annonce.code_postal` |
| Type bien | 1 | `acheteur.type_bien == annonce.type_bien` |
| Surface | 1 | `acheteur.surface_min <= annonce.surface` |

**Total:** Max 5 points, min requis = 5 points

### Notifications

**Email au vendeur (nouvelle visite):**
```
To: vendeur@example.com
Subject: Nouvelle visite pour votre annonce #5

Bonjour Paul,

Un acheteur souhaite visiter votre bien:
- Annonce: Bel appartement à Paris
- Adresse: 123 Rue de Paris (75001 Paris)
- Date et heure: 20/05/2026 à 14:00
- Acheteur: Jean Dupont

📅 AJOUTER À VOTRE CALENDRIER:
- Apple/iPhone: https://immo2000.fr/api/v1/visites/1/download.ics
- Google Calendar: https://www.google.com/calendar/render?action=TEMPLATE&text=Visite...

Veuillez confirmer ou refuser cette visite.

Cordialement,
Immo2000
```

**Liens calendrier:**
- **Fichier .ics:** Télécharge le fichier, compatible iPhone et Android
- **Google Calendar:** URL directe, ouvre Google Calendar app sur Android/Web

**Note:** Pour le MVP, on mocke l'envoi (print). En prod, utiliser smtplib ou SendGrid.

---

## Architecture

### Dossiers & Fichiers

```
backend/
├── src/
│   ├── models/
│   │   └── visites.py           # ORM SQLAlchemy
│   ├── services/
│   │   └── visites.py           # Logique métier + iCalendar
│   ├── routes/
│   │   └── visites.py           # Endpoints Flask
│   ├── schemas/
│   │   └── visites.py           # Schémas Pydantic
│   └── app.py                   # Enregistrement blueprint
├── database/
│   └── migrations/
│       └── 004_create_visites_table.sql
└── tests/
    └── test_visites.py          # Tests unitaires + intégration
```

### Dependencies

```python
Flask          3.0.0
SQLAlchemy     2.0.23
Pydantic       2.5.0
PyJWT          2.12.1
icalendar      5.0.11  # RFC 5545 iCalendar generation
```

---

## Tests

**Cas de test principaux:**

1. ✅ Création d'une visite valide (201)
2. ❌ Double réservation (400)
3. ❌ Date dans le passé (400)
4. ❌ Score < 5 (403)
5. ✅ Téléchargement .ics par acheteur (200)
6. ✅ Téléchargement .ics par vendeur (200)
7. ❌ Téléchargement .ics par tiers (403)
8. ✅ Validité du contenu .ics (RFC 5545)

**Lancer les tests:**
```bash
cd backend
python -m pytest tests/test_visites.py -v
python -m pytest tests/test_visites.py::TestDownloadICS -v  # Tests .ics uniquement
```

---

## État Futur (TODO)

- [ ] Rappels automatiques (email 24h avant)
- [ ] WebSocket pour notifications temps réel
- [ ] Confirmation/refus du vendeur
- [ ] Bloc de 30min par défaut (pas 00:00-23:59)
- [ ] Timezone support (UTC vs heure locale)
- [ ] Rate limiting sur création

---

**Dernière mise à jour:** 6 mai 2026
**Mainteneur:** Équipe Backend Immo2000
**Status:** 🟢 Production Ready
