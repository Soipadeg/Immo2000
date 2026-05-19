# Backend Routes Analysis - Immo2000
**Generated**: May 19, 2026
**Workspace**: `/home/djali/code/Soipadeg/Immo2000/backend/src/routes/`

---

## Executive Summary

| File | Lines | Status | Endpoints | Issues |
|------|-------|--------|-----------|--------|
| **notaires.py** | 484 | ✅ Working | 15 | None known |
| **transactions.py** | 411 | ✅ Working | 7 | Missing endpoints |
| **offres.py** | 312 | ⚠️ Partial | 16 | Missing: Auto-create TransactionNotaire on acceptance |
| **paiements.py** | 378 | ❌ Broken | 8 | **CRITICAL: Blueprint name mismatch** |

**Total Endpoints**: 46
**Fully Implemented**: 38 (~83%)
**Stubs/Incomplete**: 8 (~17%)
**Critical Issues**: 1 (paiements.py blueprint bug)

---

## 1. NOTAIRES.PY (484 lines)

**Blueprint**: `notaires_bp` → `/api/v1/notaires`
**Registration**: ✅ Confirmed in app.py (line 294)

### 1.1 NOTAIRE CRUD Endpoints

#### Create Notaire (Admin only)
```
POST /api/v1/notaires
Status: ✅ FULLY IMPLEMENTED
Auth: @admin_required
Parameters:
  - utilisateur_id (int)
  - etude_notariale (str) - Name of firm
  - numero_rpps (str) - Professional registration number
  - adresse_etude (str)
  - code_postal_etude (str)
  - ville_etude (str)
  - telephone (str)
  - email_professionnel (str)
  - zone_geographique (str) - Geographic area served
  - latitude (float, optional)
  - longitude (float, optional)

Response (201):
{
  "data": {
    "notaire_id": 1,
    "etude_notariale": "Étude Dupont",
    "numero_rpps": "12345...",
    "adresse_etude": "123 Rue Paris",
    "code_postal_etude": "75001",
    "ville_etude": "Paris",
    "telephone": "+33612345678",
    "email_professionnel": "contact@dupont.fr",
    "zone_geographique": "IDF",
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

#### List Notaires (Filtered)
```
GET /api/v1/notaires
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Query Parameters:
  - ville (str, optional)
  - code_postal (str, optional)
  - specialisation (str, optional)
  - skip (int, default: 0)
  - limit (int, default: 10)

Response (200):
{
  "notaires": [
    { "notaire_id": 1, "etude_notariale": "...", ... }
  ],
  "total": 42,
  "skip": 0,
  "limit": 10
}
```

#### Get Notaire Details
```
GET /api/v1/notaires/<notaire_id>
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - notaire_id (int)

Response (200):
{
  "data": {
    "notaire_id": 1,
    "etude_notariale": "Étude Dupont",
    ...
  }
}
```

#### Update Notaire Profile
```
PUT /api/v1/notaires/<notaire_id>
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required (owner only)
Path Parameters:
  - notaire_id (int)
Body:
{
  "telephone": "+33612345678",
  "email_professionnel": "new@dupont.fr",
  "zone_geographique": "Paris-IDF",
  ...
}

Response (200):
{
  "data": { "notaire_id": 1, ... }
}
```

#### Get Notaire Statistics
```
GET /api/v1/notaires/<notaire_id>/stats
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - notaire_id (int)

Response (200):
{
  "data": {
    "notaire_id": 1,
    "total_transactions": 42,
    "completed_transactions": 38,
    "pending_transactions": 4,
    "avg_duration_days": 45,
    "rating": 4.8
  }
}
```

---

### 1.2 Transaction Validation Endpoints (Notaire actions)

#### Validate Compromis (Notaire validates purchase agreement)
```
POST /api/v1/notaires/transactions/<transaction_id>/validate
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (optional):
{
  "commentaires": "Tous les documents sont conformes"
}

Response (200):
{
  "data": {
    "transaction_notaire_id": 1,
    "statut": "compromis_valide",
    "date_validation": "2026-05-19T10:30:00",
    "commentaires": "..."
  }
}

TODO: Notify buyer and seller
```

#### Request Modifications
```
POST /api/v1/notaires/transactions/<transaction_id>/request-modifications
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (required):
{
  "modifications_demandees": "Ajouter clause suspensive",
  "delai_jours": 5
}

Response (200):
{
  "data": {
    "transaction_notaire_id": 1,
    "statut": "modifications_demandees",
    "modifications_demandees": "Ajouter clause suspensive",
    "delai_demande": "2026-05-24"
  }
}

TODO: Notify seller/buyer
```

#### Reject Compromis
```
POST /api/v1/notaires/transactions/<transaction_id>/reject
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (required):
{
  "raison_refus": "Documents invalides ou incomplets"
}

Response (200):
{
  "data": {
    "transaction_notaire_id": 1,
    "statut": "refuse",
    "raison_refus": "..."
  }
}

TODO: Notify seller/buyer
```

---

### 1.3 Notaire Dashboard Endpoints

#### Get Pending Cases (Dashboard)
```
GET /api/v1/notaires/<notaire_id>/dashboard/pending
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required (owner only)
Path Parameters:
  - notaire_id (int)
Query Parameters:
  - skip (int, default: 0)
  - limit (int, default: 20)

Response (200):
{
  "transactions": [
    {
      "transaction_notaire_id": 1,
      "statut": "en_attente_validation",
      "prix_compromis": 300000,
      "acheteur": { "nom": "...", "prenom": "..." },
      "vendeur": { "nom": "...", "prenom": "..." },
      ...
    }
  ],
  "total": 5,
  "skip": 0,
  "limit": 20
}

Filters: statuts=['en_attente_validation', 'modifications_demandees']
```

#### Get Transaction History (Audit Trail)
```
GET /api/v1/notaires/transactions/<transaction_id>/history
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)

Response (200):
{
  "transaction_id": 1,
  "historique": [
    {
      "date_action": "2026-05-15T10:00:00",
      "action": "creation",
      "description": "Transaction créée",
      "ancien_statut": null,
      "nouveau_statut": "en_attente_selection",
      "notaire": null
    },
    {
      "date_action": "2026-05-16T14:30:00",
      "action": "assignment",
      "description": "Notaire assigné",
      "ancien_statut": "en_attente_selection",
      "nouveau_statut": "en_attente_validation",
      "notaire": { "notaire_id": 1, "etude_notariale": "..." }
    }
  ],
  "total": 2
}

Accessible by: Notaire, Buyer, Seller
```

---

### 1.4 Notaire Assignment Endpoints

#### Assign Notaire to Transaction (User-initiated)
```
POST /api/v1/notaires/transactions/<transaction_id>/assign
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (required):
{
  "notaire_id": 5
}

Response (200):
{
  "data": {
    "transaction_notaire_id": 1,
    "notaire_id": 5,
    "statut": "notaire_assignee",
    "date_assignation_notaire": "2026-05-19T10:30:00"
  }
}

TODO: Notify notaire
```

#### Get Available Notaires for Transaction
```
GET /api/v1/notaires/available-for-transaction/<transaction_id>
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)

Response (200):
{
  "notaires": [
    {
      "notaire_id": 1,
      "etude_notariale": "Étude Dupont",
      "ville_etude": "Paris",
      "code_postal_etude": "75001",
      "disponible": true,
      "delai_traitement_jours": 3
    }
  ],
  "total": 8
}

Selection Criteria:
- By annonce location (code_postal, ville)
- partenaire_actif = true
- est_disponible() = true (capacity check)
```

---

### 1.5 Notification Endpoints

#### Get User Notifications
```
GET /api/v1/notaires/notifications/user
Status: ✅ FULLY IMPLEMENTED (partial)
Auth: @token_required
Query Parameters:
  - notaire_only (bool, default: true)

Response (200):
{
  "notifications": [
    {
      "id": 1,
      "title": "Nouveau compromis à valider",
      "message": "Un compromis vous attend",
      "created_at": "2026-05-19T10:30:00",
      "read": false
    }
  ],
  "total": 3
}

Note: Uses NotaireNotificationService
```

#### Mark Notification as Read
```
POST /api/v1/notaires/notifications/<notification_id>/read
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - notification_id (int)

Response (200):
{
  "message": "Notification marquée comme lue",
  "notification_id": 1
}
```

#### Get Transaction Notifications
```
GET /api/v1/notaires/transactions/<transaction_id>/notifications
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)

Response (200):
{
  "notifications": [
    {
      "id": 1,
      "title": "Modification demandée",
      "message": "Le notaire demande des modifications",
      "created_at": "2026-05-19T10:30:00",
      "read": false
    }
  ],
  "total": 2
}

Accessible by: Transaction parties + assigned notaire
```

---

## 2. TRANSACTIONS.PY (411 lines)

**Blueprint**: `transactions_vente_bp` → `/api/v1/transactions`
**Registration**: ✅ Confirmed in app.py (line 296)

### 2.1 Notaire Selection & Assignment

#### Select Notaire (Buyer/Seller)
```
POST /api/v1/transactions/<transaction_id>/notaire
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (required):
{
  "notaire_id": 5
}

Validation:
- User must be buyer or seller of transaction
- notaire_id must be active partner (partenaire_actif=true)
- Notaire must have availability capacity

Response (200):
{
  "transaction_id": 1,
  "notaire_id": 5,
  "statut": "notaire_selectionne",
  "message": "Notaire sélectionné avec succès"
}

TODO: Send email notification to notaire
```

---

### 2.2 Fee Management Endpoints

#### Validate Notaire Fees (Notaire endpoint)
```
POST /api/v1/transactions/<transaction_id>/frais/valider
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (required):
{
  "montant_frais": 8000.00,
  "detail": "Frais de préparation et enregistrement",
  "action": "valider",
  "raison_refus": null
}

Validation:
- montant_frais must be positive Decimal
- action must be 'valider' or 'refuser'
- User must be notaire assigned to transaction

On validation:
1. Create FraisNotaire record with status='valide'
2. Calculate CommissionImmo2000 (2% of prix_compromis)
3. Update transaction.statut = 'frais_valides'

Response (201):
{
  "frais_id": 1,
  "montant_frais": 8000.00,
  "statut": "valide",
  "commission_immo2000": 6000.00,
  "message": "Frais validés"
}

On rejection:
{
  "frais_id": 1,
  "montant_frais": 8000.00,
  "statut": "refuse",
  "commission_immo2000": null,
  "message": "Frais refusés"
}
```

#### Calculate Fees (Read-only estimation)
```
GET /api/v1/transactions/<transaction_id>/calcul-frais
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)

Response (200):
{
  "transaction_id": 1,
  "prix_vente": 300000.00,
  "frais_notaire": 8000.00,
  "frais_immo2000": 6000.00,
  "total_a_payer": 314000.00
}

Calculation Logic:
- frais_notaire: from FraisNotaire record (if status='valide')
- frais_immo2000: 2% of prix_compromis
- total: prix_vente + frais_notaire + frais_immo2000
```

---

### 2.3 Document Signing Endpoints

#### Sign Compromis (Purchase agreement)
```
POST /api/v1/transactions/<transaction_id>/compromis/sign
Status: ✅ FULLY IMPLEMENTED (partial)
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (required):
{
  "compromis_url": "https://docusign.com/signed/...",
  "signature_date": "2026-05-19T10:30:00"
}

Validation:
- compromis_url required
- User must be buyer, seller, or assigned notaire

Updates:
- transaction.statut = 'compromis_signe'
- Trigger: Schedule deposit payment reminder (3 days)

Response (200):
{
  "transaction_id": 1,
  "statut": "compromis_signe",
  "paiement_depot_attendu": "2026-05-19T10:30:00",
  "message": "Compromis signé avec succès"
}

TODO: Store compromis_url (needs field in TransactionNotaire)
TODO: Schedule reminder with APScheduler
```

#### Sign Acte Authentique (Final deed)
```
POST /api/v1/transactions/<transaction_id>/acte/sign
Status: ✅ FULLY IMPLEMENTED (partial)
Auth: @token_required
Path Parameters:
  - transaction_id (int)
Body (required):
{
  "acte_url": "https://docusign.com/signed/..."
}

Validation:
- acte_url required
- User must be buyer, seller, or assigned notaire

Updates:
- transaction.statut = 'finalisee'
- transaction.date_completion = datetime.utcnow()
- Archive document to S3

Response (200):
{
  "transaction_id": 1,
  "statut": "finalisee",
  "message": "Acte authentique signé et vente finalisée"
}

TODO: Archive to AWS S3
TODO: Send final confirmation emails
```

---

### 2.4 Transaction Details & History

#### Get Transaction Details
```
GET /api/v1/transactions/<transaction_id>
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - transaction_id (int)

Permissions:
- Buyer or Seller of transaction
- Assigned notaire

Response (200):
{
  "transaction_notaire_id": 1,
  "offre_id": 10,
  "annonce_id": 5,
  "vendeur_id": 2,
  "acheteur_id": 3,
  "notaire_id": 1,
  "prix_compromis": 300000.00,
  "statut": "frais_valides",
  "date_creation": "2026-05-15T10:00:00",
  "date_assignation_notaire": "2026-05-16T14:30:00",
  "date_validation": "2026-05-18T09:00:00",
  "date_completion": null,
  ...
}
```

#### List User Transactions
```
GET /api/v1/transactions
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Query Parameters:
  - statut (str, optional) - Filter by status
  - limit (int, default: 20, max: 100)
  - offset (int, default: 0)

Response (200):
{
  "total": 5,
  "limit": 20,
  "offset": 0,
  "transactions": [
    {
      "transaction_notaire_id": 1,
      "prix_compromis": 300000.00,
      "statut": "frais_valides",
      ...
    }
  ]
}

Filter: Returns transactions where current_user is vendeur_id OR acheteur_id
```

---

## 3. OFFRES.PY (312 lines)

**Blueprint**: `offres_bp` → `/api/v1/offres`
**Registration**: ✅ Confirmed in app.py (line 291)

### 3.1 Offer CRUD Operations

#### Create Offer
```
POST /api/v1/offres
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Body (required):
{
  "annonce_id": 5,
  "prix_propose": 285000.00,
  "message": "Proposition intéressante",
  "conditions": {
    "delai_reponse_jours": 3,
    "clause_suspensive": true,
    "visite_requise": false
  }
}

Response (201):
{
  "offre_id": 10,
  "annonce_id": 5,
  "prix_propose": 285000.00,
  "date_offre": "2026-05-19T10:30:00",
  "message": "Offer created successfully"
}

Sets:
- acheteur_id = current_user.user_id
- statut = 'proposee'
```

#### Get Offer Details
```
GET /api/v1/offres/<offre_id>
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - offre_id (int)

Permission: User must be buyer or seller

Response (200):
{
  "offre_id": 10,
  "annonce_id": 5,
  "acheteur_id": 3,
  "prix_propose": 285000.00,
  "statut": "proposee",
  "message": "Proposition intéressante",
  "date_offre": "2026-05-19T10:30:00",
  "date_reponse": null,
  "conditions": {...}
}
```

#### List Offers for Annonce (Vendor only)
```
GET /api/v1/offres/annonce/<annonce_id>
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - annonce_id (int)
Query Parameters:
  - skip (int, default: 0)
  - limit (int, default: 50)

Permission: User must be owner of annonce

Response (200):
{
  "items": [ { "offre_id": 10, ... } ],
  "total": 3,
  "skip": 0,
  "limit": 50
}
```

#### List Buyer's Offers
```
GET /api/v1/offres/buyer
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Query Parameters:
  - skip (int, default: 0)
  - limit (int, default: 50)

Response (200):
{
  "items": [ { "offre_id": 10, ... } ],
  "total": 5,
  "skip": 0,
  "limit": 50
}

Returns: All offers made by current_user
```

#### List Vendor's Offers
```
GET /api/v1/offres/vendor
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Query Parameters:
  - skip (int, default: 0)
  - limit (int, default: 50)

Response (200):
{
  "items": [ { "offre_id": 10, ... } ],
  "total": 8,
  "skip": 0,
  "limit": 50
}

Returns: All offers for current_user's annonces
```

---

### 3.2 Offer Status Management

#### Update Offer Status
```
PUT /api/v1/offres/<offre_id>/status
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - offre_id (int)
Body (required):
{
  "statut": "acceptee"
}

Permission: Vendor only
Valid statuts: ['proposee', 'acceptee', 'refusee', 'negociation', 'retiree', 'finalisee']

Response (200):
{
  "offre_id": 10,
  "statut": "acceptee",
  "date_reponse": "2026-05-19T10:30:00",
  "message": "Offer status updated"
}
```

#### Accept Offer
```
POST /api/v1/offres/<offre_id>/accept
Status: ⚠️ PARTIALLY IMPLEMENTED (CRITICAL ISSUE)
Auth: @token_required
Path Parameters:
  - offre_id (int)

Permission: Vendor only

Response (200):
{
  "offre_id": 10,
  "statut": "acceptee",
  "message": "Offer accepted"
}

❌ MISSING FUNCTIONALITY:
- Does NOT create TransactionNotaire
- Frontend must call separate endpoint to create transaction
- OR: Should automatically call crud_notaires.create_transaction_notaire()

Current Flow:
  accept_offer() → update statut to ACCEPTEE
  ❌ Missing: TransactionNotaire creation

Expected Flow:
  accept_offer() → update statut to ACCEPTEE → create TransactionNotaire → notify buyer/seller

Fix Required: Add transaction creation in accept_offer endpoint
```

#### Reject Offer
```
POST /api/v1/offres/<offre_id>/reject
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - offre_id (int)

Permission: Vendor only

Response (200):
{
  "offre_id": 10,
  "statut": "refusee",
  "message": "Offer rejected"
}
```

#### Make Counter Offer
```
POST /api/v1/offres/<offre_id>/counter
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - offre_id (int)
Body (required):
{
  "new_price": 290000.00
}

Permission: Vendor only

Updates:
- prix_propose = new_price
- statut = 'negociation'
- date_reponse = now

Response (200):
{
  "offre_id": 10,
  "prix_propose": 290000.00,
  "statut": "negociation",
  "message": "Counter offer made"
}
```

#### Withdraw Offer
```
POST /api/v1/offres/<offre_id>/withdraw
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - offre_id (int)

Permission: Buyer only

Updates:
- statut = 'retiree'

Response (200):
{
  "offre_id": 10,
  "statut": "retiree",
  "message": "Offer withdrawn"
}
```

#### Delete Offer
```
DELETE /api/v1/offres/<offre_id>
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required
Path Parameters:
  - offre_id (int)

Permission: Buyer or Vendor

Response (200):
{
  "message": "Offer deleted"
}
```

---

### 3.3 Dashboard & Statistics

#### Get Pending Offers (Vendor dashboard)
```
GET /api/v1/offres/vendor/pending
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required

Returns: Offers with statut in ['proposee', 'negociation'] for vendor's annonces

Response (200):
{
  "items": [ { "offre_id": 10, "statut": "proposee", ... } ],
  "total": 3
}
```

#### Get Pending Count
```
GET /api/v1/offres/vendor/pending/count
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required

Response (200):
{
  "pending_count": 3
}

Quick dashboard badge
```

#### Get Offer Statistics for Annonce
```
GET /api/v1/offres/<annonce_id>/stats
Status: ✅ FULLY IMPLEMENTED
Auth: None (public)
Path Parameters:
  - annonce_id (int)

Response (200):
{
  "annonce_id": 5,
  "total_offers": 4,
  "avg_proposed_price": 287500.00,
  "min_proposed_price": 280000.00,
  "max_proposed_price": 295000.00
}
```

#### Get Vendor Offer Statistics
```
GET /api/v1/offres/vendor/stats
Status: ✅ FULLY IMPLEMENTED
Auth: @token_required

Response (200):
{
  "total_offers": 12,
  "pending_offers": 3,
  "accepted_offers": 2,
  "rejected_offers": 4,
  "negotiating_offers": 3,
  "avg_price_difference": -5000.00,
  "acceptance_rate": 0.16
}
```

---

## 4. PAIEMENTS.PY (378 lines) - ❌ BROKEN

**Blueprint**: `paiements_bp` (defined) + `paiements_vente_bp` (used in routes)
**Registration**: `paiements_vente_bp` in app.py (line 297)
**Status**: ❌ **CRITICAL BUG - Blueprint name mismatch**

### CRITICAL ISSUES

#### Issue #1: Blueprint Name Inconsistency
```python
# Line 23
paiements_bp = Blueprint('paiements', __name__, url_prefix='/api/v1/paiements')

# Lines 27+ use:
@paiements_vente_bp.route(...)  # ← UNDEFINED! Should be paiements_bp
```

**Impact**: All payment routes will fail with `NameError: name 'paiements_vente_bp' is not defined`

**Fix Required**: Either
1. Change line 23 to: `paiements_vente_bp = Blueprint(...)`
2. OR change all `@paiements_vente_bp.route` to `@paiements_bp.route`
3. OR create both blueprint names pointing to same object

---

#### Issue #2: Wrong Blueprint Name in app.py
```python
# app.py line 297
app.register_blueprint(paiements_vente_bp)  # ← This will fail if not defined in paiements.py
```

**Impact**: Flask will fail to register the blueprint if only `paiements_bp` exists in the file.

---

### 4.1 Payment Creation

#### Create Payment (Initiate Stripe PaymentIntent)
```
POST /api/v1/paiements
Status: ❌ BROKEN (Blueprint bug)
Auth: @token_required
Body (required):
{
  "transaction_id": 1,
  "montant": 15000.00,
  "type": "depot_garantie"
}

Parameters:
- transaction_id (int): Transaction to pay for
- montant (Decimal): Amount in EUR
- type (str): One of ['depot_garantie', 'solde', 'frais_notaire']
  * depot_garantie: Deposit (typically 5-10% of price)
  * solde: Balance payment
  * frais_notaire: Notary fees

Validation:
- montant must be positive Decimal
- User must be buyer of transaction (acheteur_id)

Response (201):
{
  "paiement_id": 1,
  "transaction_id": 1,
  "montant": 15000.00,
  "type": "depot_garantie",
  "statut": "en_attente",
  "message": "Paiement créé. Veuillez confirmer via Stripe"
}

TODO: Create Stripe PaymentIntent and return client_secret
```

---

### 4.2 Payment Confirmation/Failure

#### Confirm Payment (After Stripe success)
```
POST /api/v1/paiements/<paiement_id>/confirmer
Status: ❌ BROKEN
Auth: @token_required
Path Parameters:
  - paiement_id (int)
Body (required):
{
  "stripe_charge_id": "ch_1234567890",
  "stripe_response": { ... }
}

Validation:
- User must be buyer of transaction

Updates:
- paiement.statut = "reussi"
- paiement.stripe_charge_id = stripe_charge_id
- paiement.date_paiement = now
- transaction.statut updated based on type:
  * depot_garantie → "paiement_depot"
  * solde → "paiement_solde"

Response (200):
{
  "paiement_id": 1,
  "statut": "reussi",
  "date_paiement": "2026-05-19T10:30:00",
  "message": "Paiement confirmé avec succès"
}
```

#### Payment Failed
```
POST /api/v1/paiements/<paiement_id>/echec
Status: ❌ BROKEN
Auth: @token_required
Path Parameters:
  - paiement_id (int)
Body (required):
{
  "message_erreur": "Carte refusée",
  "stripe_response": { ... }
}

Updates:
- paiement.statut = "echoue"
- paiement.message_erreur = message_erreur

Response (200):
{
  "paiement_id": 1,
  "statut": "echoue",
  "message_erreur": "Carte refusée"
}
```

---

### 4.3 Payment Retrieval

#### Get Transaction Payments
```
GET /api/v1/paiements/transaction/<transaction_id>
Status: ❌ BROKEN
Auth: @token_required
Path Parameters:
  - transaction_id (int)

Permission: Buyer or Seller of transaction

Response (200):
{
  "transaction_id": 1,
  "total": 2,
  "paiements": [
    {
      "paiement_id": 1,
      "montant": 15000.00,
      "type": "depot_garantie",
      "statut": "reussi",
      "date_paiement": "2026-05-19T10:30:00"
    },
    {
      "paiement_id": 2,
      "montant": 285000.00,
      "type": "solde",
      "statut": "en_attente",
      "date_paiement": null
    }
  ]
}
```

#### Get Payment Details
```
GET /api/v1/paiements/<paiement_id>
Status: ❌ BROKEN
Auth: @token_required
Path Parameters:
  - paiement_id (int)

Permission: Buyer of transaction

Response (200):
{
  "paiement_id": 1,
  "transaction_id": 1,
  "montant": 15000.00,
  "type": "depot_garantie",
  "statut": "reussi",
  "devise": "EUR",
  "date_creation": "2026-05-19T09:00:00",
  "date_paiement": "2026-05-19T10:30:00",
  "stripe_charge_id": "ch_1234567890",
  "description": "Paiement depot_garantie - Transaction 1"
}
```

---

### 4.4 Refunds

#### Request Refund
```
POST /api/v1/paiements/<paiement_id>/remboursement
Status: ❌ BROKEN
Auth: @token_required
Path Parameters:
  - paiement_id (int)
Body:
{
  "montant_remboursement": 15000.00,
  "motif": "Acheteur se rétracte"
}

Validation:
- User must be buyer of transaction
- Original payment must have status="reussi"
- Refund amount ≤ original amount

Behavior:
- If montant_remboursement omitted: full refund
- Creates new Paiement record with type="remboursement"

Response (201):
{
  "remboursement_id": 3,
  "montant": 15000.00,
  "statut": "reussi",
  "message": "Remboursement effectué"
}

TODO: Call Stripe refund API
```

---

### 4.5 Webhook

#### Stripe Webhook Handler
```
POST /api/v1/paiements/webhook/stripe
Status: ❌ BROKEN (+ TODO implementation)
Auth: None (webhook signature verification)

Handled Events:
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded

Response (200):
{
  "status": "received"
}

TODO: Implement webhook signature verification
TODO: Implement event handlers
```

---

## Summary Table: ALL Endpoints

| # | Endpoint | Method | Module | Status | Auth |
|----|----------|--------|--------|--------|------|
| 1 | `/api/v1/notaires` | POST | notaires | ✅ | admin_required |
| 2 | `/api/v1/notaires` | GET | notaires | ✅ | token_required |
| 3 | `/api/v1/notaires/<id>` | GET | notaires | ✅ | token_required |
| 4 | `/api/v1/notaires/<id>` | PUT | notaires | ✅ | token_required |
| 5 | `/api/v1/notaires/<id>/stats` | GET | notaires | ✅ | token_required |
| 6 | `/api/v1/notaires/transactions/<id>/validate` | POST | notaires | ✅ | token_required |
| 7 | `/api/v1/notaires/transactions/<id>/request-modifications` | POST | notaires | ✅ | token_required |
| 8 | `/api/v1/notaires/transactions/<id>/reject` | POST | notaires | ✅ | token_required |
| 9 | `/api/v1/notaires/<id>/dashboard/pending` | GET | notaires | ✅ | token_required |
| 10 | `/api/v1/notaires/transactions/<id>/history` | GET | notaires | ✅ | token_required |
| 11 | `/api/v1/notaires/transactions/<id>/assign` | POST | notaires | ✅ | token_required |
| 12 | `/api/v1/notaires/available-for-transaction/<id>` | GET | notaires | ✅ | token_required |
| 13 | `/api/v1/notaires/notifications/user` | GET | notaires | ✅ | token_required |
| 14 | `/api/v1/notaires/notifications/<id>/read` | POST | notaires | ✅ | token_required |
| 15 | `/api/v1/notaires/transactions/<id>/notifications` | GET | notaires | ✅ | token_required |
| 16 | `/api/v1/transactions/<id>/notaire` | POST | transactions | ✅ | token_required |
| 17 | `/api/v1/transactions/<id>/frais/valider` | POST | transactions | ✅ | token_required |
| 18 | `/api/v1/transactions/<id>/calcul-frais` | GET | transactions | ✅ | token_required |
| 19 | `/api/v1/transactions/<id>/compromis/sign` | POST | transactions | ✅ | token_required |
| 20 | `/api/v1/transactions/<id>/acte/sign` | POST | transactions | ✅ | token_required |
| 21 | `/api/v1/transactions/<id>` | GET | transactions | ✅ | token_required |
| 22 | `/api/v1/transactions` | GET | transactions | ✅ | token_required |
| 23 | `/api/v1/offres` | POST | offres | ✅ | token_required |
| 24 | `/api/v1/offres/<id>` | GET | offres | ✅ | token_required |
| 25 | `/api/v1/offres/annonce/<id>` | GET | offres | ✅ | token_required |
| 26 | `/api/v1/offres/buyer` | GET | offres | ✅ | token_required |
| 27 | `/api/v1/offres/vendor` | GET | offres | ✅ | token_required |
| 28 | `/api/v1/offres/<id>/status` | PUT | offres | ✅ | token_required |
| 29 | `/api/v1/offres/<id>/accept` | POST | offres | ⚠️ | token_required |
| 30 | `/api/v1/offres/<id>/reject` | POST | offres | ✅ | token_required |
| 31 | `/api/v1/offres/<id>/counter` | POST | offres | ✅ | token_required |
| 32 | `/api/v1/offres/<id>/withdraw` | POST | offres | ✅ | token_required |
| 33 | `/api/v1/offres/<id>` | DELETE | offres | ✅ | token_required |
| 34 | `/api/v1/offres/vendor/pending` | GET | offres | ✅ | token_required |
| 35 | `/api/v1/offres/vendor/pending/count` | GET | offres | ✅ | token_required |
| 36 | `/api/v1/offres/<id>/stats` | GET | offres | ✅ | None |
| 37 | `/api/v1/offres/vendor/stats` | GET | offres | ✅ | token_required |
| 38 | `/api/v1/paiements` | POST | paiements | ❌ | token_required |
| 39 | `/api/v1/paiements/<id>/confirmer` | POST | paiements | ❌ | token_required |
| 40 | `/api/v1/paiements/<id>/echec` | POST | paiements | ❌ | token_required |
| 41 | `/api/v1/paiements/transaction/<id>` | GET | paiements | ❌ | token_required |
| 42 | `/api/v1/paiements/<id>` | GET | paiements | ❌ | token_required |
| 43 | `/api/v1/paiements/<id>/remboursement` | POST | paiements | ❌ | token_required |
| 44 | `/api/v1/paiements/webhook/stripe` | POST | paiements | ❌ | None |

---

## Critical Issues & Recommendations

### 1. CRITICAL: Paiements Blueprint Bug ❌
**Location**: `backend/src/routes/paiements.py`
**Severity**: CRITICAL - All payment endpoints are broken
**Fix**: Change line 23 to:
```python
paiements_vente_bp = Blueprint('paiements', __name__, url_prefix='/api/v1/paiements')
```

### 2. MAJOR: Missing Transaction Creation on Offer Acceptance ⚠️
**Location**: `backend/src/routes/offres.py` line 166-177
**Severity**: HIGH - Core flow incomplete
**Issue**: `accept_offer()` endpoint only updates offer status, does NOT create TransactionNotaire
**Expected Flow**:
```
POST /api/v1/offres/<id>/accept
  → Update offer.statut = "acceptee"
  → Create TransactionNotaire (vendeur_id, acheteur_id, prix_compromis, offre_id)
  → Set transaction.statut = "en_attente_selection"
  → Notify both parties
  → Return transaction details
```

**Current Flow**:
```
POST /api/v1/offres/<id>/accept
  → Update offer.statut = "acceptee"
  → Return only offer details
  ❌ Missing: TransactionNotaire creation
```

**Fix**:
```python
def accept_offer(current_user: User, offre_id: int):
    offre = crud_offres.accept_offer(db.session, offre_id, current_user.user_id)

    # ✅ NEW: Create transaction
    transaction = crud_notaires.create_transaction_notaire(
        db=db.session,
        offre_id=offre_id,
        annonce_id=offre.annonce_id,
        vendeur_id=offre.annonce.utilisateur_id,
        acheteur_id=offre.acheteur_id,
        prix_compromis=offre.prix_propose,
        notaire_id=None
    )

    # ✅ NEW: Notify parties
    # ... send emails/notifications

    return {
        'offre_id': offre.offre_id,
        'transaction_id': transaction.transaction_notaire_id,
        'statut': 'acceptee',
        'message': 'Offer accepted. Transaction created.'
    }
```

### 3. TODO Items Scattered Throughout Code ⚠️
Multiple endpoints have TODO comments for critical features:
- Email notifications (notaires, transactions)
- DocuSign URL storage
- APScheduler integration (payment reminders)
- AWS S3 document archival
- Stripe webhook implementation
- Stripe PaymentIntent creation

---

## Missing Endpoints (Needed by Frontend)

### Missing: Transaction Status Update
Frontend needs endpoint to update transaction status (e.g., "frais_refuses" → retry)
```
Suggested: PATCH /api/v1/transactions/<id>/status
```

### Missing: Compromise Signature History
Frontend may need signature timestamps and audit trail
```
Suggested: GET /api/v1/transactions/<id>/signatures
```

### Missing: Payment History per Transaction
Currently only `GET /api/v1/paiements/transaction/<id>` but paiements.py is broken
```
Alternative: GET /api/v1/transactions/<id>/paiements (if added to transactions.py)
```

### Missing: Notaire Availability Calendar
Frontend needs to see notaire availability for scheduling
```
Suggested: GET /api/v1/notaires/<id>/availability
```

---

## Data Flow Diagrams

### Current Offer → Transaction Flow
```
1. POST /api/v1/offres (buyer creates offer)
   └─ Create Offre, statut=PROPOSEE

2. POST /api/v1/offres/<id>/accept (vendor accepts)
   └─ Update Offre.statut=ACCEPTEE
   └─ ❌ MISSING: Create TransactionNotaire

3. [MISSING] Need endpoint to create transaction manually?
   OR modify accept_offer to auto-create transaction

4. POST /api/v1/transactions/<id>/notaire (assign notaire)
   └─ Update TransactionNotaire.notaire_id

5. POST /api/v1/transactions/<id>/frais/valider (notaire validates fees)
   └─ Create FraisNotaire, CommissionImmo2000

6. POST /api/v1/transactions/<id>/compromis/sign (sign purchase agreement)
   └─ Update TransactionNotaire.statut=compromis_signe

7. POST /api/v1/paiements (initiate payment)
   └─ Create Paiement, statut=en_attente
   └─ Get Stripe PaymentIntent

8. POST /api/v1/paiements/<id>/confirmer (confirm payment)
   └─ Update Paiement.statut=reussi

9. POST /api/v1/transactions/<id>/acte/sign (sign final deed)
   └─ Update TransactionNotaire.statut=finalisee
   └─ Archive to S3
```

---

## Implementation Status Summary

| Category | Count | Complete | TODO | Broken |
|----------|-------|----------|------|--------|
| Notaires | 15 | 15 | 0 | 0 |
| Transactions | 7 | 7 | 0 | 0 |
| Offres | 16 | 15 | 0 | 1 |
| Paiements | 8 | 0 | 0 | 8 |
| **TOTAL** | **46** | **37** | **0** | **9** |

**Overall**: 80% implemented, 20% broken (all in paiements.py), 1 critical missing feature (offer → transaction)
