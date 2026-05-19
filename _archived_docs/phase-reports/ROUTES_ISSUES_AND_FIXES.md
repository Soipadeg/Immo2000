# Backend Routes - Issues & Fixes

## 🔴 CRITICAL ISSUE #1: Paiements Blueprint Name Mismatch

### Location
File: `backend/src/routes/paiements.py`
Line: 23

### Problem
```python
# Line 23 - WRONG
paiements_bp = Blueprint('paiements', __name__, url_prefix='/api/v1/paiements')

# Line 25+ - Uses undefined variable
@paiements_vente_bp.route('', methods=['POST'])  # ← ERROR: paiements_vente_bp not defined!
```

### Root Cause
The blueprint is defined as `paiements_bp` but all route decorators use `@paiements_vente_bp.route()`.
The app.py file imports `paiements_vente_bp` (line 49):
```python
from src.routes.paiements import paiements_vente_bp
```

### Impact
**ALL 8 PAYMENT ENDPOINTS ARE BROKEN**
- `POST /api/v1/paiements`
- `POST /api/v1/paiements/<id>/confirmer`
- `POST /api/v1/paiements/<id>/echec`
- `GET /api/v1/paiements/transaction/<id>`
- `GET /api/v1/paiements/<id>`
- `POST /api/v1/paiements/<id>/remboursement`
- `POST /api/v1/paiements/webhook/stripe`

When Flask loads the app, it will raise:
```
NameError: name 'paiements_vente_bp' is not defined
```

### Fix (Option A - Recommended)
**Change line 23 in paiements.py from:**
```python
paiements_bp = Blueprint('paiements', __name__, url_prefix='/api/v1/paiements')
```

**To:**
```python
paiements_vente_bp = Blueprint('paiements', __name__, url_prefix='/api/v1/paiements')
```

This is a 1-line fix that aligns the file with how it's imported in app.py.

### Fix (Option B - Alternative)
Keep the name as `paiements_bp` and change all route decorators from `@paiements_vente_bp.route` to `@paiements_bp.route`.
But this would also require changing app.py line 49 and 301, so Option A is better.

### Verification
After fixing, test with:
```bash
curl -X POST http://localhost:5000/api/v1/paiements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": 1, "montant": 15000, "type": "depot_garantie"}'
```

Should return 201 with paiement details (not NameError 500).

---

## ⚠️ MAJOR ISSUE #2: Missing Transaction Creation on Offer Acceptance

### Location
File: `backend/src/routes/offres.py`
Function: `accept_offer()` (lines 166-177)

### Problem
When a vendor accepts an offer, the system only updates the offer status to 'acceptee' but does NOT create a TransactionNotaire record.

```python
# Current implementation
@offres_bp.route('/<int:offre_id>/accept', methods=['POST'])
@token_required
@handle_errors()
def accept_offer(current_user: User, offre_id: int) -> Tuple[Dict[str, Any], int]:
    offre = crud_offres.accept_offer(db.session, offre_id, current_user.user_id)

    if not offre:
        raise ForbiddenError('Offer not found or unauthorized')

    return {
        'offre_id': offre.offre_id,
        'statut': 'acceptee',
        'message': 'Offer accepted'
    }
    # ❌ MISSING: No TransactionNotaire created!
```

### Expected Business Logic
When an offer is accepted, a legal transaction should be created:
1. Update offer.statut = 'acceptee'
2. Create TransactionNotaire with:
   - offre_id = offer ID
   - annonce_id = offer's annonce
   - vendeur_id = annonce owner
   - acheteur_id = offer buyer
   - prix_compromis = offer's prix_propose
   - notaire_id = NULL (to be assigned later)
   - statut = 'en_attente_selection'
3. Notify both buyer and seller
4. Return both offer AND transaction details

### Impact
Frontend can accept offers, but no transaction is created. The frontend then needs to:
- Either manually create a transaction via some undocumented endpoint
- Or the flow is broken and users can't proceed to payment/signing

### Solution
Modify `accept_offer()` in offres.py:

```python
@offres_bp.route('/<int:offre_id>/accept', methods=['POST'])
@token_required
@handle_errors()
def accept_offer(current_user: User, offre_id: int) -> Tuple[Dict[str, Any], int]:
    """Accept an offer (vendor only) and create TransactionNotaire"""

    # 1. Accept the offer
    offre = crud_offres.accept_offer(db.session, offre_id, current_user.user_id)

    if not offre:
        raise ForbiddenError('Offer not found or unauthorized')

    # 2. Create TransactionNotaire
    try:
        transaction = crud_notaires.create_transaction_notaire(
            db=db.session,
            offre_id=offre_id,
            annonce_id=offre.annonce_id,
            vendeur_id=offre.annonce.utilisateur_id,
            acheteur_id=offre.acheteur_id,
            prix_compromis=float(offre.prix_propose),
            notaire_id=None  # To be assigned later
        )
    except Exception as e:
        raise ValidationError(f"Failed to create transaction: {str(e)}")

    # 3. TODO: Send notifications
    # from src.services.notifications import NotificationService
    # NotificationService.notify_offer_accepted(offre, transaction)

    # 4. Return both offer and transaction details
    return {
        'offre_id': offre.offre_id,
        'transaction_id': transaction.transaction_notaire_id,
        'statut': 'acceptee',
        'transaction_statut': 'en_attente_selection',
        'message': 'Offer accepted. Transaction created.',
        'transaction': transaction.to_dict()
    }, 201
```

### Required Imports
Add to offres.py imports:
```python
from src.crud import notaires as crud_notaires
```

### Verification
After fixing:
```bash
POST /api/v1/offres/<offre_id>/accept

Response should include:
{
  "offre_id": 10,
  "transaction_id": 42,  # ← NEW
  "statut": "acceptee",
  "transaction_statut": "en_attente_selection",  # ← NEW
  "message": "Offer accepted. Transaction created.",
  "transaction": { ... }  # ← NEW
}
```

---

## 📋 Additional Issues (Lower Priority)

### Issue #3: TODO - Email Notifications
Multiple endpoints have `TODO: Send email` comments:
- notaires.py line 180 (validate_compromis)
- notaires.py line 214 (request_modifications)
- notaires.py line 247 (reject_compromis)
- transactions.py line 97 (select_notaire)

Implement using SendGrid or similar service.

### Issue #4: TODO - Document URL Storage
- transactions.py lines 168, 199: Sign endpoints don't store document URLs
- Need to add fields to TransactionNotaire model:
  - compromis_url (str)
  - acte_authentique_url (str)

### Issue #5: TODO - Stripe Integration
Multiple TODOs in paiements.py:
- Line 48: Create PaymentIntent
- Line 85: Verify webhook signature
- Line 185: Call Stripe refund API
- Line 247: Handle webhook events

### Issue #6: TODO - Document Archival
transactions.py line 198: `TODO: Archive to AWS S3`
Implement S3 upload for signed documents.

### Issue #7: TODO - Payment Reminders
transactions.py line 177: `TODO: Plan reminder with APScheduler`
Schedule email reminders for deposit payment.

---

## Quick Fix Checklist

### MUST FIX (Before any payment can work)
- [ ] Rename `paiements_bp` to `paiements_vente_bp` in paiements.py line 23
- [ ] Verify payment endpoints work with curl
- [ ] Add transaction creation to accept_offer() in offres.py
- [ ] Test offer acceptance creates transaction

### SHOULD FIX (For MVP completion)
- [ ] Implement basic Stripe integration (create PaymentIntent)
- [ ] Add email notification service
- [ ] Store document URLs in DB
- [ ] Implement webhook signature verification

### NICE TO HAVE (Polish)
- [ ] Document archival to S3
- [ ] Payment reminders with APScheduler
- [ ] Webhook event handlers
- [ ] Notaire availability calendar

---

## Testing Strategy

### Test #1: Verify Blueprint Fix
```bash
# Start server
python -m backend.run_server

# Check if payment endpoints accessible
curl -X OPTIONS http://localhost:5000/api/v1/paiements
# Should return 200 (endpoint exists), not 500 (blueprint error)
```

### Test #2: Test Offer Acceptance Flow
```bash
# 1. Create offer
POST /api/v1/offres
{
  "annonce_id": 1,
  "prix_propose": 300000,
  "message": "My offer"
}
# Response: { "offre_id": 10, ... }

# 2. Accept offer (as vendor)
POST /api/v1/offres/10/accept
# Should return:
# { "offre_id": 10, "transaction_id": 42, "statut": "acceptee", ... }

# 3. Verify transaction created
GET /api/v1/transactions/42
# Should return transaction details
```

### Test #3: Payment Flow
```bash
# 1. Create payment
POST /api/v1/paiements
{
  "transaction_id": 42,
  "montant": 30000,
  "type": "depot_garantie"
}
# Should return: { "paiement_id": 1, "statut": "en_attente", ... }

# 2. Confirm payment (after Stripe success)
POST /api/v1/paiements/1/confirmer
{
  "stripe_charge_id": "ch_1234567890"
}
# Should return: { "paiement_id": 1, "statut": "reussi", ... }
```

---

## Files Modified
1. `backend/src/routes/paiements.py` - Line 23 (1 character change)
2. `backend/src/routes/offres.py` - Lines 166-177 (function enhancement)

## Files to Create/Update
1. Create: Document storage schema (compromis_url, acte_url fields)
2. Update: NotificationService for email sending
3. Update: Stripe integration in paiements.py

---

## Estimated Effort
- **Fix Blueprint**: 1 minute (1-line change)
- **Add Transaction Creation**: 15 minutes (add function call + tests)
- **Test Both Fixes**: 30 minutes (integration testing)
- **Total for Critical**: ~45 minutes
