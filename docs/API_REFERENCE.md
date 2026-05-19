# API Reference Documentation - Immo2000 Notaire System

**Version**: 1.0.0
**Last Updated**: Phase 4 Documentation
**Base URL**: `http://localhost:5000/api/v1` (development)
**Production URL**: To be configured during deployment

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Offers API](#offers-api)
3. [Transactions API](#transactions-api)
4. [Notaires API](#notaires-api)
5. [Payments API](#payments-api)
6. [Documents API](#documents-api)
7. [Users API](#users-api)
8. [Annonces (Listings) API](#annonces-listings-api)
9. [DocuSign Integration](#docusign-integration)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Webhooks](#webhooks)

---

## Authentication & Authorization

All endpoints (except `/auth/*`) require an **Authorization header** with a valid JWT token.

### Token Format
```
Authorization: Bearer <jwt_token>
```

### User Roles
- `UTILISATEUR` - Buyer/Seller
- `NOTAIRE` - Notary professional
- `ADMINISTRATEUR` - System admin

### Protected Routes
```javascript
// Frontend example
const response = await apiClient.get('/api/v1/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Backend Protection
```python
# Flask example
@app.route('/api/v1/endpoint', methods=['GET'])
@token_required
def protected_endpoint(current_user):
    # current_user is available
    return {'status': 'ok'}
```

---

## Offers API

### Overview
Manage real estate offers between buyers and sellers.

### Endpoints

#### 1. Create Offer
```
POST /api/v1/offres
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "annonce_id": "ann-12345",
  "prix_propose": 245000.00,
  "message": "Offer at 245k euros"
}
```

**Response** (201 Created):
```json
{
  "offre_id": "off-98765",
  "annonce_id": "ann-12345",
  "acheteur_id": "user-111",
  "vendeur_id": "user-222",
  "prix_propose": 245000.00,
  "statut": "EN_ATTENTE",
  "date_creation": "2024-01-15T10:30:00",
  "message": "Offer at 245k euros"
}
```

**Errors**:
- `400` - Invalid offer data
- `404` - Annonce not found
- `401` - Unauthorized

---

#### 2. Get Offer Details
```
GET /api/v1/offres/:offre_id
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "offre_id": "off-98765",
  "annonce": {
    "titre": "Maison 3 pièces Paris",
    "prix_demande": 250000.00
  },
  "acheteur": {
    "nom": "Dupont",
    "email": "acheteur@example.com"
  },
  "vendeur": {
    "nom": "Martin",
    "email": "vendeur@example.com"
  },
  "prix_propose": 245000.00,
  "statut": "EN_ATTENTE",
  "date_creation": "2024-01-15T10:30:00"
}
```

---

#### 3. Accept Offer (Creates Transaction) ⭐ **CRITICAL**
```
POST /api/v1/offres/:offre_id/accept
Authorization: Bearer <token>
```

**Response** (200 OK):
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

**Side Effects**:
- Offer status changes to `ACCEPTEE`
- `TransactionNotaire` record created automatically ✅
- Transaction ready for notaire selection

**Errors**:
- `400` - Offer already processed
- `404` - Offer not found

---

#### 4. Reject Offer
```
POST /api/v1/offres/:offre_id/reject
Authorization: Bearer <token>

Request Body (optional):
{
  "raison": "Price too low"
}
```

**Response** (200 OK):
```json
{
  "offre_id": "off-98765",
  "statut": "REJETEE",
  "raison": "Price too low"
}
```

---

#### 5. Negotiate Offer
```
POST /api/v1/offres/:offre_id/negotiate
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "nouveau_prix": 248000.00,
  "message": "Counter-offer at 248k"
}
```

**Response** (200 OK):
```json
{
  "offre_id": "off-98765",
  "prix_propose": 248000.00,
  "statut": "NEGOCIATION",
  "message": "Counter-offer at 248k"
}
```

---

#### 6. List Offers for Listing
```
GET /api/v1/offres?annonce_id=ann-12345&statut=EN_ATTENTE
Authorization: Bearer <token>

Query Parameters:
- annonce_id (required): Filter by listing ID
- statut (optional): EN_ATTENTE, ACCEPTEE, REJETEE, NEGOCIATION
- skip (optional, default: 0): Pagination offset
- limit (optional, default: 20): Results per page
```

**Response** (200 OK):
```json
{
  "total": 3,
  "offres": [
    {
      "offre_id": "off-98765",
      "prix_propose": 245000.00,
      "statut": "EN_ATTENTE"
    }
  ]
}
```

---

## Transactions API

### Overview
Manage transaction lifecycle from creation through finalization.

### Transaction Status Workflow
```
CREEE
  ↓ (notaire selected)
NOTAIRE_ASSIGNEE
  ↓ (compromis prepared)
COMPROMIS_PREPARE
  ↓ (both parties sign)
COMPROMIS_SIGNE
  ↓ (acte prepared)
ACTE_PREPARE
  ↓ (both parties sign)
ACTE_SIGNE
  ↓ (finalized)
FINALISEE
```

### Endpoints

#### 1. Get Transaction Details
```
GET /api/v1/transactions/:transaction_id
Authorization: Bearer <token>
```

**Response** (200 OK):
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
  "date_creation": "2024-01-15T10:30:00",
  "timeline": [
    {
      "statut": "CREEE",
      "date": "2024-01-15T10:30:00"
    },
    {
      "statut": "NOTAIRE_ASSIGNEE",
      "date": "2024-01-15T11:00:00"
    }
  ]
}
```

---

#### 2. Select Notaire for Transaction
```
POST /api/v1/transactions/:transaction_id/select-notaire
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "notaire_id": "not-777"
}
```

**Response** (200 OK):
```json
{
  "transaction_id": "tx-55555",
  "notaire_id": "not-777",
  "statut": "NOTAIRE_ASSIGNEE",
  "notaire": {
    "nom": "Dupont",
    "telephone": "01 23 45 67 89",
    "email": "dupont@etude-notariale.fr"
  }
}
```

**Errors**:
- `404` - Notaire not found
- `400` - Notaire already assigned

---

#### 3. Validate Fees
```
POST /api/v1/transactions/:transaction_id/validate-fees
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "transaction_id": "tx-55555",
  "prix_bien": 245000.00,
  "frais": {
    "montant_base": 4900.00,
    "pourcentage_base": 2.0,
    "montant_tva": 980.00,
    "pourcentage_tva": 20.0,
    "montant_ttc": 5880.00
  },
  "immo2000_commission": 4900.00,
  "paiement_total": 255780.00
}
```

---

#### 4. Calculate Fees
```
GET /api/v1/transactions/:transaction_id/calculate-fees
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "commission": 4900.00,
  "tva": 980.00,
  "total_ttc": 5880.00
}
```

---

#### 5. Sign Compromis
```
POST /api/v1/transactions/:transaction_id/sign-compromis
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "docusign_envelope_id": "env-12345"
}
```

**Response** (200 OK):
```json
{
  "transaction_id": "tx-55555",
  "statut": "COMPROMIS_SIGNE",
  "document": {
    "type": "COMPROMIS",
    "docusign_envelope_id": "env-12345",
    "date_signature": "2024-01-20T14:30:00",
    "s3_url": "https://bucket.s3.amazonaws.com/tx-55555/compromis.pdf"
  }
}
```

---

#### 6. Sign Acte
```
POST /api/v1/transactions/:transaction_id/sign-acte
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "docusign_envelope_id": "env-54321"
}
```

**Response** (200 OK):
```json
{
  "transaction_id": "tx-55555",
  "statut": "FINALISEE",
  "document": {
    "type": "ACTE",
    "docusign_envelope_id": "env-54321",
    "date_signature": "2024-02-15T14:30:00",
    "s3_url": "https://bucket.s3.amazonaws.com/tx-55555/acte.pdf"
  }
}
```

---

#### 7. List User Transactions
```
GET /api/v1/transactions?skip=0&limit=20
Authorization: Bearer <token>

Query Parameters:
- skip (optional): Pagination offset
- limit (optional): Results per page (max 100)
- statut (optional): Filter by status
```

**Response** (200 OK):
```json
{
  "total": 5,
  "transactions": [
    {
      "transaction_id": "tx-55555",
      "prix_compromis": 245000.00,
      "statut": "FINALISEE"
    }
  ]
}
```

---

## Notaires API

### Overview
Manage notaire profiles and their workload.

### Endpoints

#### 1. List Notaires
```
GET /api/v1/notaires?skip=0&limit=20
Authorization: Bearer <token>

Query Parameters:
- skip (optional): Pagination
- limit (optional): Results per page
- specialisation (optional): Immobilier, Succession, etc.
```

**Response** (200 OK):
```json
{
  "total": 15,
  "notaires": [
    {
      "notaire_id": "not-777",
      "utilisateur_id": "user-333",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "dupont@notariale.fr",
      "etude_notariale": "Étude Dupont",
      "telephone": "01 23 45 67 89",
      "adresse": "123 Rue de Paris",
      "code_postal": "75000",
      "ville": "Paris",
      "numero_rpps": "12345678901"
    }
  ]
}
```

---

#### 2. Get Notaire Profile
```
GET /api/v1/notaires/:notaire_id
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "notaire_id": "not-777",
  "nom": "Dupont",
  "etude_notariale": "Étude Dupont",
  "specialisations": ["Immobilier", "Succession"],
  "contact": {
    "telephone": "01 23 45 67 89",
    "email": "dupont@etude-notariale.fr",
    "adresse": "123 Rue de Paris, 75000 Paris"
  },
  "disponibilite": {
    "dossiers_en_cours": 12,
    "dossiers_max": 30,
    "charge": "40%"
  }
}
```

---

#### 3. Search Notaires by Location
```
GET /api/v1/notaires/search?code_postal=75000
Authorization: Bearer <token>

Query Parameters:
- code_postal (required): Postal code to search
- specialisation (optional): Filter by specialization
- limit (optional, default: 10): Max results
```

**Response** (200 OK):
```json
{
  "total": 5,
  "notaires": [
    {
      "notaire_id": "not-777",
      "nom": "Dupont",
      "distance_km": 2.3,
      "disponibilite": "Charge: 40%"
    }
  ]
}
```

---

#### 4. Get Notaire Dashboard (Pending Dossiers) ⭐ **CRITICAL FOR DASHBOARD**
```
GET /api/v1/notaires/:notaire_id/dashboard/pending?skip=0&limit=20
Authorization: Bearer <token>

Headers:
- Authorization: Bearer <token>
- X-Notaire-Id: <notaire_id> (optional validation)

Query Parameters:
- skip (optional, default: 0): Pagination offset
- limit (optional, default: 20): Results per page
```

**Response** (200 OK):
```json
{
  "total": 5,
  "transactions": [
    {
      "transaction_id": "tx-55555",
      "annonce_id": "ann-12345",
      "prix_compromis": 245000.00,
      "statut": "EN_COURS",
      "date_creation": "2024-01-15T10:30:00",
      "acheteur_id": "user-111",
      "vendeur_id": "user-222",
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

**Frontend Integration Example**:
```javascript
// frontend/src/services/api/transactions.js
const notairesApi = {
  getPendingDossiers: (notaireId, skip = 0, limit = 20) =>
    apiClient.get(`/api/v1/notaires/${notaireId}/dashboard/pending`, {
      params: { skip, limit },
    }),
};

// frontend/src/pages/NotaireDashboardPage.jsx
useEffect(() => {
  const loadDossiers = async () => {
    const response = await notairesApi.getPendingDossiers(user.notaire_id);
    setDossiers(response.data.transactions);
  };
  loadDossiers();
}, [user.notaire_id]);
```

---

#### 5. Create Notaire (Admin Only)
```
POST /api/v1/notaires
Content-Type: application/json
Authorization: Bearer <admin_token>
X-Admin-Action: true

Request Body:
{
  "utilisateur_id": "user-333",
  "etude_notariale": "Étude Dupont",
  "numero_rpps": "12345678901",
  "telephone": "01 23 45 67 89",
  "adresse": "123 Rue de Paris",
  "code_postal": "75000",
  "ville": "Paris"
}
```

**Response** (201 Created):
```json
{
  "notaire_id": "not-777",
  "etude_notariale": "Étude Dupont"
}
```

---

## Payments API

### Overview
Process payments via Stripe integration.

### Payment Status Workflow
```
EN_COURS (PaymentIntent created)
  ↓ (user confirms card)
  ↓ (Stripe webhook)
CONFIRME (payment successful)

OR

FAILED (card declined)
  ↓ (retry possible)
CONFIRME

OR

REMBOURSEE (refund issued)
```

### Endpoints

#### 1. Create Payment Intent
```
POST /api/v1/paiements/create
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "transaction_id": "tx-55555",
  "montant": 37500.00,
  "type": "DEPOT"
}
```

**Response** (200 OK):
```json
{
  "paiement_id": "pay-99999",
  "stripe_client_secret": "pi_xxx_secret_yyy",
  "stripe_payment_intent_id": "pi_xxx",
  "montant": 37500.00,
  "currency": "eur",
  "type": "DEPOT",
  "statut": "EN_COURS"
}
```

**Frontend Usage**:
```javascript
// Create payment intent from frontend
const response = await paymentsApi.create({
  transaction_id: transactionId,
  montant: depositAmount,
  type: 'DEPOT'
});

const clientSecret = response.data.stripe_client_secret;

// Set up Stripe Elements with client secret
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
  }
});
```

---

#### 2. Confirm Payment
```
POST /api/v1/paiements/:paiement_id/confirm
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "stripe_payment_method_id": "pm_xxx"
}
```

**Response** (200 OK):
```json
{
  "paiement_id": "pay-99999",
  "statut": "CONFIRME",
  "montant": 37500.00,
  "date_confirmation": "2024-01-18T15:00:00"
}
```

---

#### 3. Get Payment Details
```
GET /api/v1/paiements/:paiement_id
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "paiement_id": "pay-99999",
  "transaction_id": "tx-55555",
  "montant": 37500.00,
  "type": "DEPOT",
  "statut": "CONFIRME",
  "stripe_payment_intent_id": "pi_xxx",
  "date_creation": "2024-01-18T14:00:00",
  "date_confirmation": "2024-01-18T15:00:00"
}
```

---

#### 4. List Payments for Transaction
```
GET /api/v1/transactions/:transaction_id/paiements
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "transaction_id": "tx-55555",
  "paiements": [
    {
      "paiement_id": "pay-99999",
      "montant": 37500.00,
      "type": "DEPOT",
      "statut": "CONFIRME"
    },
    {
      "paiement_id": "pay-88888",
      "montant": 212500.00,
      "type": "SOLDE",
      "statut": "EN_COURS"
    }
  ]
}
```

---

#### 5. Refund Payment
```
POST /api/v1/paiements/:paiement_id/refund
Content-Type: application/json
Authorization: Bearer <admin_or_vendor>

Request Body (optional):
{
  "raison": "Annulation de la transaction",
  "montant_partiel": null  // null = full refund
}
```

**Response** (200 OK):
```json
{
  "paiement_id": "pay-99999",
  "statut": "REMBOURSEE",
  "montant_refund": 37500.00,
  "date_remboursement": "2024-01-20T10:00:00"
}
```

---

#### 6. Record Payment Failed
```
POST /api/v1/paiements/:paiement_id/failed
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "raison": "Card declined"
}
```

**Response** (200 OK):
```json
{
  "paiement_id": "pay-99999",
  "statut": "FAILED",
  "raison": "Card declined",
  "date_echec": "2024-01-18T15:30:00"
}
```

---

## Documents API

### Overview
Manage transaction documents (compromis, acte, etc.)

### Endpoints

#### 1. List Documents for Transaction
```
GET /api/v1/transactions/:transaction_id/documents
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "transaction_id": "tx-55555",
  "documents": [
    {
      "document_id": "doc-111",
      "type": "COMPROMIS",
      "statut": "SIGNE",
      "date_creation": "2024-01-15T10:00:00",
      "date_signature": "2024-01-20T14:30:00",
      "s3_url": "https://bucket.s3.amazonaws.com/tx-55555/compromis.pdf",
      "docusign_envelope_id": "env-12345"
    },
    {
      "document_id": "doc-222",
      "type": "ACTE",
      "statut": "SIGNE",
      "date_creation": "2024-02-01T10:00:00",
      "date_signature": "2024-02-15T14:30:00",
      "s3_url": "https://bucket.s3.amazonaws.com/tx-55555/acte.pdf"
    }
  ]
}
```

---

#### 2. Get Document URL
```
GET /api/v1/documents/:document_id/url
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "document_id": "doc-111",
  "download_url": "https://bucket.s3.amazonaws.com/tx-55555/compromis.pdf?signature=xxx",
  "expires_in_seconds": 3600
}
```

---

## Users API

### Overview
Manage user profiles and authentication.

### Endpoints

#### 1. Get Current User Profile
```
GET /api/v1/users/profile
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "utilisateur_id": "user-111",
  "email": "user@example.com",
  "nom": "Dupont",
  "prenom": "Martin",
  "role": "acheteur",
  "avatar_url": "https://...",
  "date_inscription": "2023-06-15T10:00:00",
  "notaire_id": null  // Only if role is 'notaire'
}
```

---

#### 2. Update User Profile
```
PUT /api/v1/users/profile
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "nom": "Martin",
  "prenom": "Dupont",
  "telephone": "01 23 45 67 89",
  "adresse": "123 Rue de Paris"
}
```

**Response** (200 OK):
```json
{
  "utilisateur_id": "user-111",
  "nom": "Martin",
  "prenom": "Dupont"
}
```

---

## Annonces (Listings) API

### Overview
Manage real estate listings.

### Endpoints

#### 1. Create Listing
```
POST /api/v1/annonces
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "titre": "Maison 3 pièces Paris",
  "description": "Belle maison avec jardin",
  "prix_demande": 250000.00,
  "adresse": "123 Rue de Paris",
  "code_postal": "75000",
  "ville": "Paris",
  "surface": 100,
  "nombre_pieces": 3,
  "images": ["url1", "url2"]
}
```

**Response** (201 Created):
```json
{
  "annonce_id": "ann-12345",
  "titre": "Maison 3 pièces Paris",
  "prix_demande": 250000.00,
  "utilisateur_id": "user-222"
}
```

---

#### 2. Get Listing Details
```
GET /api/v1/annonces/:annonce_id
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "annonce_id": "ann-12345",
  "titre": "Maison 3 pièces Paris",
  "description": "Belle maison avec jardin",
  "prix_demande": 250000.00",
  "adresse": "123 Rue de Paris",
  "code_postal": "75000",
  "ville": "Paris",
  "surface": 100,
  "nombre_pieces": 3,
  "vendeur": {
    "nom": "Martin",
    "email": "martin@example.com"
  },
  "offres_count": 3
}
```

---

## DocuSign Integration

### Overview
Electronic signature via DocuSign OAuth 2.0

### Endpoints

#### 1. Start OAuth Flow
```
GET /api/v1/docusign/oauth/start?transaction_id=tx-55555&document_type=COMPROMIS
```

**Response** (302 Redirect):
```
Location: https://account.docusign.com/oauth/auth?client_id=xxx&response_type=code&scope=...
```

---

#### 2. Handle OAuth Callback
```
GET /api/v1/docusign/oauth/callback?code=XXX&state=YYY
```

**Response** (200 OK):
```json
{
  "envelope_id": "env-12345",
  "signing_url": "https://docusign.net/...",
  "transaction_id": "tx-55555"
}
```

---

#### 3. Get Envelope Status
```
GET /api/v1/docusign/envelope/:envelope_id/status
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "envelope_id": "env-12345",
  "statut": "completed",
  "date_completion": "2024-01-20T14:30:00",
  "recipients": [
    {
      "email": "user1@example.com",
      "statut": "signed",
      "date_signature": "2024-01-20T14:00:00"
    }
  ]
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "specific details"
    }
  }
}
```

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET request returned data |
| 201 | Created | POST created new resource |
| 400 | Bad Request | Invalid JSON or missing field |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Backend error |

### Example Errors

**404 Not Found**:
```json
{
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction tx-55555 does not exist"
  }
}
```

**400 Bad Request**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "montant": "Must be a positive number"
    }
  }
}
```

**401 Unauthorized**:
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired"
  }
}
```

---

## Rate Limiting

### Limits
- **Authenticated requests**: 1000 per minute per user
- **Unauthenticated requests**: 100 per minute per IP

### Response Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Exceeded Limit
```
429 Too Many Requests

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after_seconds": 60
  }
}
```

---

## Webhooks

### Stripe Webhooks

Stripe sends events to your webhook URL configured in dashboard.

#### Payment Intent Succeeded
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

**Handler**:
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

## Best Practices

### Authentication
- Always include `Authorization: Bearer <token>` header
- Tokens expire after 24 hours
- Refresh tokens available via `/auth/refresh`

### Error Handling
- Always check response status code
- Parse error response for `error.code` and `details`
- Log errors for debugging

### Pagination
- Always handle pagination using `skip` and `limit`
- Max `limit` is 100
- Default `limit` is 20

### Rate Limiting
- Implement exponential backoff for 429 responses
- Cache frequently accessed data (profiles, settings)
- Use WebSocket for real-time updates if available

### Security
- Never log tokens
- Always use HTTPS in production
- Validate webhook signatures (Stripe)
- Implement CSRF protection for forms

---

## Frontend Integration Examples

### Complete User Journey

```javascript
// 1. Login
const token = await authApi.login(email, password);
localStorage.setItem('token', token);

// 2. View dashboard
const user = await usersApi.getProfile();
if (user.role === 'notaire') {
  const dossiers = await notairesApi.getPendingDossiers(user.notaire_id);
  // Display in NotaireDashboard
}

// 3. Create offer
const offer = await offresApi.create({
  annonce_id: annonce.annonce_id,
  prix_propose: 245000.00
});

// 4. Accept offer (creates transaction)
const transaction = await offresApi.acceptOffer(offer.offre_id);

// 5. Select notaire
await transactionsApi.selectNotaire(transaction.transaction_id, notaire.notaire_id);

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
const result = await transactionsApi.signActe(transaction.transaction_id, envelopeId);
// Transaction is now FINALISEE
```

---

**API Version**: 1.0.0
**Last Updated**: Phase 4 Documentation
**Status**: ✅ Complete & Ready for Integration
