# 📚 API Reference - Immo2000

**Version**: 2.0.0
**Last Updated**: 2026-06-09
**Status**: ✅ PRODUCTION READY
**Framework**: FastAPI + Flasgger (Swagger UI)

---

## 🚀 Quick Start

### Access Documentation

```
🌐 Swagger UI (Interactive):
   http://localhost:5000/api/docs

📋 OpenAPI Spec (JSON):
   http://localhost:5000/api/openapi.json

📖 ReDoc Alternative:
   http://localhost:5000/api/redoc
```

### Start Backend Server

```bash
# Flask (legacy)
cd backend
python run_server.py

# FastAPI (recommended)
uvicorn app_fastapi.main:app --reload --port 8001
```

---

## 📖 Base Information

### Base URLs
- **Development**: `http://localhost:5000/api/` (Flask) or `http://localhost:8000/api/` (FastAPI)
- **Production**: To be configured during deployment
- **API Version**: `/api/v1/` for all endpoints

### Response Format (All Endpoints)

```json
{
  "status": "success|error",
  "data": { ... },
  "timestamp": "2026-06-09T10:00:00Z"
}
```

### Pagination

All list endpoints support pagination:

```
GET /api/endpoint?skip=0&limit=20
```

Response includes:
```json
{
  "status": "success",
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "timestamp": "..."
}
```

---

## 🔐 Authentication & Authorization

### JWT Token Required

All endpoints (except `/auth/*`, `/health`) require a valid JWT token.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

### User Roles
| Role | Description |
|------|-------------|
| `UTILISATEUR` | Buyer/Seller |
| `NOTAIRE` | Notary professional |
| `ADMINISTRATEUR` | System administrator |

### Get Token

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 123,
  "role": "acheteur"
}
```

### Backend Protection Example

```python
# FastAPI
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.get("/api/v1/protected")
async def protected_route(token = Depends(security)):
    # Verify token
    return {"status": "ok"}
```

---

## 📡 API Endpoints

---

### 📢 Annonces (Listings) API

Manage real estate property listings.

#### **POST** `/api/v1/annonces`
Create a new property listing.

**Auth:** ✅ JWT Required
**Status:** 201 Created

**Request Body:**
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

**Response:**
```json
{
  "annonce_id": 1,
  "titre": "Maison 4 pièces à Paris",
  "prix": 500000.0,
  "surface": 120.5,
  "statut": "brouillon",
  "date_creation": "2026-06-09T10:00:00Z",
  "utilisateur_id": 123
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titre": "Maison à Paris", "prix": 500000, "surface": 120.5, "type_bien": "maison"}'
```

---

#### **GET** `/api/v1/annonces`
List all announcements with filtering and pagination.

**Auth:** ❌ Public
**Status:** 200 OK

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | int | Pagination offset (default: 0) |
| limit | int | Results per page (default: 20, max: 100) |
| ville | string | Filter by city (case-insensitive) |
| code_postal | string | Filter by exact postal code |
| type_bien | string | Filter by type (maison, appartement, terrain, local commercial) |
| prix_min | float | Minimum price filter |
| prix_max | float | Maximum price filter |
| surface_min | float | Minimum surface in m² |
| surface_max | float | Maximum surface in m² |
| statut | string | Filter by status (brouillon, publiée, vendue, archivée) |
| utilisateur_id | int | Filter by user ID |
| search | string | Text search (titre + description) |

**Response:**
```json
{
  "items": [
    {
      "annonce_id": 1,
      "titre": "Maison 4 pièces à Paris",
      "prix": 500000.0,
      "statut": "publiée",
      "ville": "Paris"
    }
  ],
  "total": 42,
  "skip": 0,
  "limit": 20
}
```

**Examples:**
```bash
# List all
curl http://localhost:5000/api/v1/annonces

# Pagination
curl "http://localhost:5000/api/v1/annonces?skip=20&limit=10"

# Filter by city and type
curl "http://localhost:5000/api/v1/annonces?ville=Paris&type_bien=maison"

# Price range
curl "http://localhost:5000/api/v1/annonces?prix_min=400000&prix_max=600000"

# Text search
curl "http://localhost:5000/api/v1/annonces?search=jardin"
```

---

#### **GET** `/api/v1/annonces/{id}`
Get a single announcement.

**Auth:** ❌ Public
**Status:** 200 OK or 404 Not Found

**Response:**
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
  "date_creation": "2026-06-09T10:00:00Z"
}
```

---

#### **PUT** `/api/v1/annonces/{id}`
Update an announcement (owner only).

**Auth:** ✅ JWT Required + Owner Check
**Status:** 200 OK

**Request Body (all fields optional):**
```json
{
  "titre": "Maison rénovée",
  "prix": 480000.0,
  "statut": "publiée"
}
```

**Errors:**
- 400: Validation failed
- 401: Token missing or expired
- 403: Not owner
- 404: Announcement not found

---

#### **DELETE** `/api/v1/annonces/{id}`
Delete an announcement (owner only).

**Auth:** ✅ JWT Required + Owner Check
**Status:** 204 No Content

**Errors:**
- 401: Token missing or expired
- 403: Not owner
- 404: Announcement not found

---

#### **POST** `/api/v1/annonces/{id}/publier`
Publish an announcement (brouillon → publiée).

**Auth:** ✅ JWT Required + Owner Check
**Status:** 200 OK

**Response:** Annonce with `statut: "publiée"`

---

### 💰 Offers API

Manage real estate offers between buyers and sellers.

#### **POST** `/api/v1/offres`
Create a new offer.

**Request Body:**
```json
{
  "annonce_id": "ann-12345",
  "prix_propose": 245000.00,
  "message": "Offer at 245k euros"
}
```

**Response (201 Created):**
```json
{
  "offre_id": "off-98765",
  "annonce_id": "ann-12345",
  "acheteur_id": "user-111",
  "vendeur_id": "user-222",
  "prix_propose": 245000.00,
  "statut": "EN_ATTENTE",
  "date_creation": "2026-06-09T10:00:00Z"
}
```

---

#### **GET** `/api/v1/offres/{offre_id}`
Get offer details.

**Response:**
```json
{
  "offre_id": "off-98765",
  "annonce": {"titre": "Maison 3 pièces Paris", "prix_demande": 250000.00},
  "acheteur": {"nom": "Dupont", "email": "acheteur@example.com"},
  "vendeur": {"nom": "Martin", "email": "vendeur@example.com"},
  "prix_propose": 245000.00,
  "statut": "EN_ATTENTE",
  "date_creation": "2026-06-09T10:00:00Z"
}
```

---

#### **POST** `/api/v1/offres/{offre_id}/accept`
Accept an offer (creates transaction automatically).

**⭐ CRITICAL**: This automatically creates a `TransactionNotaire` record.

**Response:**
```json
{
  "offre_id": "off-98765",
  "statut": "ACCEPTEE",
  "transaction_id": "tx-55555",
  "transaction": {
    "statut": "CREEE",
    "prix_compromis": 245000.00,
    "notaire_id": null
  }
}
```

---

#### **POST** `/api/v1/offres/{offre_id}/reject`
Reject an offer.

**Request Body (optional):**
```json
{"raison": "Price too low"}
```

**Response:**
```json
{
  "offre_id": "off-98765",
  "statut": "REJETEE",
  "raison": "Price too low"
}
```

---

#### **POST** `/api/v1/offres/{offre_id}/negotiate`
Make a counter-offer.

**Request Body:**
```json
{
  "nouveau_prix": 248000.00,
  "message": "Counter-offer at 248k"
}
```

**Response:**
```json
{
  "offre_id": "off-98765",
  "prix_propose": 248000.00,
  "statut": "NEGOCIATION"
}
```

---

#### **GET** `/api/v1/offres`
List offers for a listing.

**Query Parameters:**
- `annonce_id` (required): Filter by listing ID
- `statut` (optional): EN_ATTENTE, ACCEPTEE, REJETEE, NEGOCIATION
- `skip`, `limit` (pagination)

---

### 💳 Transactions API

Manage transaction lifecycle from creation through finalization.

**Status Workflow:**
```
CREEE → NOTAIRE_ASSIGNEE → COMPROMIS_PREPARE → COMPROMIS_SIGNE → ACTE_PREPARE → ACTE_SIGNE → FINALISEE
```

#### **GET** `/api/v1/transactions/{transaction_id}`
Get transaction details with full history.

**Response:**
```json
{
  "transaction_id": "tx-55555",
  "annonce_id": "ann-12345",
  "offre_id": "off-98765",
  "vendeur_id": "user-222",
  "acheteur_id": "user-111",
  "prix_compromis": 245000.00,
  "notaire": {
    "notaire_id": "not-777",
    "nom": "Dupont",
    "etude": "Étude Dupont"
  },
  "statut": "NOTAIRE_ASSIGNEE",
  "timeline": [
    {"statut": "CREEE", "date": "2026-06-01T10:00:00Z"},
    {"statut": "NOTAIRE_ASSIGNEE", "date": "2026-06-01T11:00:00Z"}
  ]
}
```

---

#### **POST** `/api/v1/transactions/{transaction_id}/select-notaire`
Select a notary for the transaction.

**Request Body:**
```json
{"notaire_id": "not-777"}
```

**Response:**
```json
{
  "transaction_id": "tx-55555",
  "notaire_id": "not-777",
  "statut": "NOTAIRE_ASSIGNEE",
  "notaire": {"nom": "Dupont", "telephone": "01 23 45 67 89"}
}
```

---

#### **POST** `/api/v1/transactions/{transaction_id}/validate-fees`
Validate transaction fees.

**Response:**
```json
{
  "transaction_id": "tx-55555",
  "prix_bien": 245000.00,
  "frais": {
    "montant_base": 4900.00,
    "pourcentage_base": 2.0,
    "montant_tva": 980.00,
    "montant_ttc": 5880.00
  },
  "immo2000_commission": 4900.00,
  "paiement_total": 255780.00
}
```

---

#### **POST** `/api/v1/transactions/{transaction_id}/sign-compromis`
Sign the compromis document.

**Request Body:**
```json
{"docusign_envelope_id": "env-12345"}
```

**Response:**
```json
{
  "transaction_id": "tx-55555",
  "statut": "COMPROMIS_SIGNE",
  "document": {
    "type": "COMPROMIS",
    "docusign_envelope_id": "env-12345",
    "s3_url": "https://bucket.s3.amazonaws.com/..."
  }
}
```

---

#### **POST** `/api/v1/transactions/{transaction_id}/sign-acte`
Sign the acte document (final step).

**Request Body:**
```json
{"docusign_envelope_id": "env-54321"}
```

**Response:**
```json
{
  "transaction_id": "tx-55555",
  "statut": "FINALISEE",
  "document": {
    "type": "ACTE",
    "s3_url": "https://bucket.s3.amazonaws.com/..."
  }
}
```

---

#### **GET** `/api/v1/transactions`
List user transactions.

**Query Parameters:**
- `skip`, `limit` (pagination)
- `statut` (optional filter)
- `buyer_id`, `seller_id` (optional filters)

---

### 👔 Notaires API

Manage notary profiles and workload.

#### **GET** `/api/v1/notaires`
List all notaries.

**Query Parameters:**
- `skip`, `limit` (pagination)
- `specialisation` (optional: Immobilier, Succession, etc.)

**Response:**
```json
{
  "total": 15,
  "notaires": [
    {
      "notaire_id": "not-777",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "dupont@notariale.fr",
      "etude_notariale": "Étude Dupont",
      "telephone": "01 23 45 67 89",
      "adresse": "123 Rue de Paris",
      "code_postal": "75000",
      "ville": "Paris"
    }
  ]
}
```

---

#### **GET** `/api/v1/notaires/{notaire_id}`
Get notary profile.

**Response:**
```json
{
  "notaire_id": "not-777",
  "nom": "Dupont",
  "etude_notariale": "Étude Dupont",
  "specialisations": ["Immobilier", "Succession"],
  "contact": {
    "telephone": "01 23 45 67 89",
    "email": "dupont@etude-notariale.fr"
  },
  "disponibilite": {
    "dossiers_en_cours": 12,
    "dossiers_max": 30,
    "charge": "40%"
  }
}
```

---

#### **GET** `/api/v1/notaires/search`
Search notaries by location.

**Query Parameters:**
- `code_postal` (required)
- `specialisation` (optional)
- `limit` (default: 10)

**Response:**
```json
{
  "total": 5,
  "notaires": [
    {
      "notaire_id": "not-777",
      "nom": "Dupont",
      "distance_km": 2.3
    }
  ]
}
```

---

#### **GET** `/api/v1/notaires/{notaire_id}/dashboard/pending`
Get notary's pending dossiers (CRITICAL FOR DASHBOARD).

**Query Parameters:**
- `skip`, `limit` (pagination)

**Response:**
```json
{
  "total": 5,
  "transactions": [
    {
      "transaction_id": "tx-55555",
      "annonce_id": "ann-12345",
      "prix_compromis": 245000.00,
      "statut": "EN_COURS",
      "acheteur_name": "Martin Dupont",
      "vendeur_name": "Jean Martin"
    }
  ],
  "stats": {
    "total_dossiers": 5,
    "en_cours": 3,
    "compromis_signes": 1,
    "acte_signes": 1
  }
}
```

---

### 💳 Payments API

Process payments via Stripe integration.

**Status Workflow:**
```
EN_COURS → CONFIRME → FAILED (optional) → REMBOURSEE (optional)
```

#### **POST** `/api/v1/paiements/create`
Create a payment intent.

**Request Body:**
```json
{
  "transaction_id": "tx-55555",
  "montant": 37500.00,
  "type": "DEPOT"
}
```

**Response:**
```json
{
  "paiement_id": "pay-99999",
  "stripe_client_secret": "pi_xxx_secret_yyy",
  "stripe_payment_intent_id": "pi_xxx",
  "montant": 37500.00,
  "currency": "eur",
  "statut": "EN_COURS"
}
```

**Frontend Usage:**
```javascript
const { clientSecret } = response.data;
await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
```

---

#### **POST** `/api/v1/paiements/{paiement_id}/confirm`
Confirm a payment.

**Request Body:**
```json
{"stripe_payment_method_id": "pm_xxx"}
```

**Response:**
```json
{
  "paiement_id": "pay-99999",
  "statut": "CONFIRME",
  "date_confirmation": "2026-06-09T15:00:00Z"
}
```

---

#### **GET** `/api/v1/paiements/{paiement_id}`
Get payment details.

---

#### **POST** `/api/v1/paiements/{paiement_id}/refund`
Refund a payment.

**Request Body (optional):**
```json
{"raison": "Annulation de la transaction"}
```

---

#### **POST** `/api/v1/paiements/{paiement_id}/failed`
Record payment failure.

---

### 📄 Documents API

#### **GET** `/api/v1/transactions/{transaction_id}/documents`
List documents for a transaction.

**Response:**
```json
{
  "documents": [
    {
      "document_id": "doc-111",
      "type": "COMPROMIS",
      "statut": "SIGNE",
      "s3_url": "https://bucket.s3.amazonaws.com/...",
      "docusign_envelope_id": "env-12345"
    }
  ]
}
```

---

#### **GET** `/api/v1/documents/{document_id}/url`
Get temporary download URL.

**Response:**
```json
{
  "download_url": "https://bucket.s3.amazonaws.com/...?signature=xxx",
  "expires_in_seconds": 3600
}
```

---

### 👤 Users API

#### **GET** `/api/v1/users/profile`
Get current user profile.

**Response:**
```json
{
  "utilisateur_id": "user-111",
  "email": "user@example.com",
  "nom": "Dupont",
  "prenom": "Martin",
  "role": "acheteur",
  "avatar_url": "https://...",
  "date_inscription": "2026-01-15T10:00:00Z",
  "notaire_id": null
}
```

---

#### **PUT** `/api/v1/users/profile`
Update user profile.

**Request Body:**
```json
{
  "nom": "Martin",
  "prenom": "Dupont",
  "telephone": "01 23 45 67 89"
}
```

---

### 📅 Appointments API

#### **GET** `/api/v1/appointments`
List all appointments.

**Query Parameters:**
- `status`: scheduled, completed, cancelled, rescheduled
- `skip`, `limit`

---

#### **GET** `/api/v1/appointments/{id}/historique`
Get appointment history.

**Response:**
```json
{
  "history": [
    {"action": "created", "timestamp": "2026-06-01T10:00:00Z"},
    {"action": "rescheduled", "timestamp": "2026-06-05T15:30:00Z"}
  ]
}
```

---

#### **PUT** `/api/v1/appointments/{id}/reschedule`
Reschedule an appointment.

**Request Body:**
```json
{
  "new_date": "2026-06-20T10:00:00Z",
  "reason": "Requested by visitor"
}
```

---

### 📊 Calendar API

#### **GET** `/api/v1/calendar/export/ical`
Export appointments as iCal format.

#### **GET** `/api/v1/calendar/export/csv`
Export appointments as CSV.

#### **POST** `/api/v1/calendar/import`
Import calendar events.

**Request:** `multipart/form-data` with file (`.ics`, `.vcs`, `.csv`)

---

### 💬 Messages API

#### **GET** `/api/v1/messages`
Get all messages.

**Query Parameters:**
- `conversation_id`: Filter by conversation
- `read`: Filter by read status
- `skip`, `limit`

---

#### **POST** `/api/v1/messages`
Send a new message.

**Request Body:**
```json
{
  "recipient_id": 200,
  "text": "Hello, I'm interested in your property",
  "type": "direct|offer|question"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "sender_id": 100,
  "recipient_id": 200,
  "text": "Hello!",
  "read": false,
  "created_at": "2026-06-09T10:00:00Z"
}
```

---

#### **PUT** `/api/v1/messages/{id}/read`
Mark a message as read.

---

#### **DELETE** `/api/v1/messages/{id}`
Delete a message.

---

### 📊 Statistics API

#### **GET** `/api/v1/biens/stats`
Get property statistics.

**Response:**
```json
{
  "total_properties": 145,
  "active_listings": 89,
  "sold_count": 32,
  "average_price": 275000,
  "days_to_sell_avg": 42,
  "conversion_rate": 0.62
}
```

---

#### **GET** `/api/v1/statistics/export`
Export statistics.

**Query Parameters:**
- `format`: pdf or excel
- `date_range`: week, month, quarter, year

---

### 🔔 Notifications API

#### **GET** `/api/v1/notifications`
Get user notifications.

**Query Parameters:**
- `read`: Filter by read status
- `type`: Filter by notification type
- `skip`, `limit`

---

#### **GET** `/api/v1/notifications/preferences`
Get notification preferences.

**Response:**
```json
{
  "email": true,
  "push": true,
  "sms": false,
  "in_app": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00"
}
```

---

#### **PUT** `/api/v1/notifications/preferences`
Update notification preferences.

---

### ❤️ Health & Monitoring

#### **GET** `/api/health`
Global system health check.

**Auth:** ❌ None required

**Response:**
```json
{
  "status": "success",
  "data": {
    "system_status": "healthy",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "api": "healthy"
    },
    "uptime_hours": 240,
    "response_time_ms": 5
  }
}
```

---

#### **GET** `/api/chat/health`
Check chat service health.

---

#### **GET** `/api/faq/health`
Check FAQ service health.

---

### 🔄 Admin & Audit

#### **GET** `/api/admin/audit-logs`
Get audit logs with filtering.

**Query Parameters:**
- `user_id`: Filter by user ID
- `action`: Filter by action type (LIST_TRANSACTIONS, CREATE_MESSAGE, ACCEPT_OFFER, etc.)
- `start_date`, `end_date`: Date filters
- `skip`, `limit`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "user_id": 100,
      "action": "ACCEPT_OFFER",
      "resource_type": "transaction",
      "resource_id": 50,
      "timestamp": "2026-06-09T10:00:00Z"
    }
  ],
  "total": 42
}
```

---

#### **GET** `/api/admin/audit-logs/export`
Export audit logs as CSV or Excel.

**Query Parameters:**
- `format`: csv or excel
- `start_date`, `end_date`

---

### 🤖 DocuSign Integration

#### **GET** `/api/v1/docusign/oauth/start`
Start OAuth flow for document signing.

**Query Parameters:**
- `transaction_id`: Required
- `document_type`: COMPROMIS, ACTE, etc.

**Response:** 302 Redirect to DocuSign

---

#### **GET** `/api/v1/docusign/oauth/callback`
Handle OAuth callback.

**Response:**
```json
{
  "envelope_id": "env-12345",
  "signing_url": "https://docusign.net/...",
  "transaction_id": "tx-55555"
}
```

---

#### **GET** `/api/v1/docusign/envelope/{envelope_id}/status`
Get envelope signing status.

**Response:**
```json
{
  "envelope_id": "env-12345",
  "statut": "completed",
  "recipients": [
    {
      "email": "user@example.com",
      "statut": "signed",
      "date_signature": "2026-06-09T10:00:00Z"
    }
  ]
}
```

---

## ❌ Error Handling

### Standard Error Response

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {"field": "specific details"}
  },
  "timestamp": "2026-06-09T10:00:00Z"
}
```

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET request returned data |
| 201 | Created | POST created new resource |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Invalid JSON or missing field |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Invalid business logic |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Backend error |

### Example Errors

**404 Not Found:**
```json
{
  "status": "error",
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction tx-55555 does not exist"
  }
}
```

**400 Bad Request:**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {"montant": "Must be a positive number"}
  }
}
```

**401 Unauthorized:**
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired"
  }
}
```

---

## 🚦 Rate Limiting

### Limits
- **Authenticated requests**: 1000 per minute per user
- **Unauthenticated requests**: 100 per minute per IP

### Response Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Exceeded Limit (429)
```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after_seconds": 60
  }
}
```

---

## 🔄 Webhooks

### Stripe Webhooks

Stripe sends events to your configured webhook URL.

**Payment Intent Succeeded:**
```json
{
  "id": "evt_12345",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 3750000,
      "currency": "eur",
      "status": "succeeded"
    }
  }
}
```

**Handler Example (Python):**
```python
@app.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    event = json.loads(request.data)
    if event['type'] == 'payment_intent.succeeded':
        pi_id = event['data']['object']['id']
        payment = Paiement.query.filter_by(
            stripe_payment_intent_id=pi_id
        ).first()
        payment.statut = PaiementStatut.CONFIRME
        db.session.commit()
    return {'received': True}
```

---

## 💡 Best Practices

### Authentication
- Always include `Authorization: Bearer <token>` header
- Tokens expire after 24 hours
- Use `/auth/refresh` for token renewal
- Never log tokens

### Error Handling
- Always check response status code
- Parse error response for `error.code` and `details`
- Log errors for debugging

### Pagination
- Always use `skip` and `limit` for large datasets
- Max `limit` is 100
- Default `limit` is 20

### Performance
- Implement exponential backoff for 429 responses
- Cache frequently accessed data (profiles, settings)
- Use WebSocket for real-time updates if available

### Security
- Always use HTTPS in production
- Validate webhook signatures (Stripe)
- Implement CSRF protection for forms
- Never expose sensitive data in URLs

---

## 🧪 Testing

### With curl

```bash
# Get audit logs
curl -X GET "http://localhost:5000/api/admin/audit-logs?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send message
curl -X POST "http://localhost:5000/api/messages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id": 200, "text": "Hello!"}'

# Health check (no auth)
curl -X GET "http://localhost:5000/api/health"
```

### With Postman

1. Import OpenAPI: `http://localhost:5000/api/openapi.json`
2. Set Authorization: Bearer Token
3. Run requests

---

## 📚 Frontend Integration Examples

### Complete User Journey

```javascript
// 1. Login
const { token, user } = await authApi.login(email, password);
localStorage.setItem('token', token);

// 2. View listings
const announcements = await annoncesApi.list({ ville: 'Paris', type_bien: 'maison' });

// 3. Create offer
const offer = await offresApi.create({
  annonce_id: announcement.annonce_id,
  prix_propose: 245000.00
});

// 4. Accept offer (creates transaction)
const transaction = await offresApi.acceptOffer(offer.offre_id);

// 5. Select notary
const notaire = await notairesApi.list({ code_postal: '75000' });
await transactionsApi.selectNotaire(transaction.transaction_id, notaire[0].notaire_id);

// 6. Validate fees
const fees = await transactionsApi.validateFees(transaction.transaction_id);

// 7. Create payment
const payment = await paymentsApi.create({
  transaction_id: transaction.transaction_id,
  montant: transaction.prix_compromis * 0.15,
  type: 'DEPOT'
});

// 8. Sign documents (DocuSign)
const envelope = await docusignApi.startOAuth(transaction.transaction_id, 'COMPROMIS');

// 9. Finalize
const result = await transactionsApi.signActe(transaction.transaction_id, envelope.envelope_id);
// Transaction is now FINALISEE
```

---

## 🎯 Quick Reference

### Property Types
```
"maison", "appartement", "terrain", "local commercial"
```

### Announcement Statuses
```
"brouillon", "publiée", "vendue", "archivée"
```

### DPE Classes
```
"A", "B", "C", "D", "E", "F", "G"
```

### Transaction Statuses
```
"CREEE", "NOTAIRE_ASSIGNEE", "COMPROMIS_PREPARE", "COMPROMIS_SIGNE",
"ACTE_PREPARE", "ACTE_SIGNE", "FINALISEE"
```

### Payment Types
```
"DEPOT", "SOLDE", "COMMISSION"
```

### Offer Statuses
```
"EN_ATTENTE", "ACCEPTEE", "REJETEE", "NEGOCIATION"
```

---

## 📖 Related Documentation

- [Hooks to Endpoints Mapping](../HOOKS_TO_ENDPOINTS_MAPPING.md)
- [Backend Endpoints Analysis](../BACKEND_ENDPOINTS_ANALYSIS.md)
- [Integration Test Report](../INTEGRATION_TEST_REPORT.md)

---

**Documentation Version**: 2.0.0
**Last Updated**: 2026-06-09
**Status**: ✅ PRODUCTION READY
