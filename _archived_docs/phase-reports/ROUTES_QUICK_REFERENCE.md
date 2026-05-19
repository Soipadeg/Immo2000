# Backend Routes Quick Reference

## Overview
- **Total Endpoints**: 46
- **Fully Working**: 37 (80%)
- **Critical Issues**: 9 (all in paiements.py - 20%)
- **Missing Features**: 1 (auto-create transaction on offer acceptance)

---

## 🔴 CRITICAL ISSUES

### 1. Paiements Blueprint is BROKEN
**File**: `backend/src/routes/paiements.py`
**Problem**: Line 23 defines `paiements_bp` but routes use `@paiements_vente_bp.route` (undefined)
**Impact**: ALL 8 payment endpoints will crash with `NameError`
**Fix**: Change line 23 to `paiements_vente_bp = Blueprint(...)`

### 2. Missing Transaction Creation on Offer Acceptance
**File**: `backend/src/routes/offres.py` line 166
**Problem**: `POST /api/v1/offres/<id>/accept` only updates offer status, doesn't create TransactionNotaire
**Impact**: Frontend can accept offers but no transaction is created for payment/signing
**Fix**: Add call to `crud_notaires.create_transaction_notaire()` in accept_offer()

---

## ✅ WORKING Endpoints (37)

### Notaires (15 endpoints)
```
POST   /api/v1/notaires                                    [Create notaire - admin]
GET    /api/v1/notaires                                    [List notaires]
GET    /api/v1/notaires/<id>                               [Get notaire details]
PUT    /api/v1/notaires/<id>                               [Update notaire]
GET    /api/v1/notaires/<id>/stats                         [Get notaire stats]
POST   /api/v1/notaires/transactions/<id>/validate         [Validate compromis]
POST   /api/v1/notaires/transactions/<id>/request-modifications [Request changes]
POST   /api/v1/notaires/transactions/<id>/reject           [Reject compromis]
GET    /api/v1/notaires/<id>/dashboard/pending             [Get pending cases]
GET    /api/v1/notaires/transactions/<id>/history          [Get audit trail]
POST   /api/v1/notaires/transactions/<id>/assign           [Assign notaire]
GET    /api/v1/notaires/available-for-transaction/<id>     [Get available notaires]
GET    /api/v1/notaires/notifications/user                 [Get notifications]
POST   /api/v1/notaires/notifications/<id>/read            [Mark as read]
GET    /api/v1/notaires/transactions/<id>/notifications    [Get transaction notifications]
```

### Transactions (7 endpoints)
```
POST   /api/v1/transactions/<id>/notaire                   [Select notaire]
POST   /api/v1/transactions/<id>/frais/valider             [Validate fees]
GET    /api/v1/transactions/<id>/calcul-frais              [Calculate fees]
POST   /api/v1/transactions/<id>/compromis/sign            [Sign purchase agreement]
POST   /api/v1/transactions/<id>/acte/sign                 [Sign final deed]
GET    /api/v1/transactions/<id>                           [Get transaction details]
GET    /api/v1/transactions                                [List user transactions]
```

### Offres (15 endpoints - 1 incomplete)
```
POST   /api/v1/offres                                      [Create offer]
GET    /api/v1/offres/<id>                                 [Get offer details]
GET    /api/v1/offres/annonce/<id>                         [List offers for annonce]
GET    /api/v1/offres/buyer                                [Get buyer's offers]
GET    /api/v1/offres/vendor                               [Get vendor's offers]
PUT    /api/v1/offres/<id>/status                          [Update status]
POST   /api/v1/offres/<id>/accept                          [⚠️ INCOMPLETE - no transaction creation]
POST   /api/v1/offres/<id>/reject                          [Reject offer]
POST   /api/v1/offres/<id>/counter                         [Make counter offer]
POST   /api/v1/offres/<id>/withdraw                        [Withdraw offer]
DELETE /api/v1/offres/<id>                                 [Delete offer]
GET    /api/v1/offres/vendor/pending                       [Get pending offers]
GET    /api/v1/offres/vendor/pending/count                 [Get pending count]
GET    /api/v1/offres/<id>/stats                           [Get offer stats for annonce]
GET    /api/v1/offres/vendor/stats                         [Get vendor offer stats]
```

---

## ❌ BROKEN Endpoints (8 - all in paiements.py)

```
POST   /api/v1/paiements                                   [Create payment]
POST   /api/v1/paiements/<id>/confirmer                    [Confirm payment]
POST   /api/v1/paiements/<id>/echec                        [Payment failed]
GET    /api/v1/paiements/transaction/<id>                  [Get transaction payments]
GET    /api/v1/paiements/<id>                              [Get payment details]
POST   /api/v1/paiements/<id>/remboursement                [Request refund]
POST   /api/v1/paiements/webhook/stripe                    [Stripe webhook]

Reason: Blueprint 'paiements_vente_bp' is not defined (should be on line 23)
```

---

## 📋 Feature Checklist

### Offer Lifecycle ✅ (mostly)
- [x] Create offer
- [x] View offer details
- [x] Reject offer
- [x] Counter offer
- [x] Withdraw offer
- [x] Get offer statistics
- [⚠️] Accept offer → **Missing: Create TransactionNotaire**

### Notaire Management ✅
- [x] Create notaire profile (admin)
- [x] List notaires (with filters)
- [x] View notaire details
- [x] Update notaire profile
- [x] View notaire statistics
- [x] Assign notaire to transaction
- [x] Get available notaires for transaction
- [x] Get pending cases (dashboard)
- [x] View transaction history/audit trail
- [⚠️] TODO: Email notifications

### Fee Management ✅
- [x] Calculate fees estimate
- [x] Validate notaire fees
- [x] Reject notaire fees
- [x] Commission calculation (2% of sale price)

### Document Signing ✅ (partial)
- [x] Sign purchase agreement (compromis)
- [x] Sign final deed (acte authentique)
- [⚠️] TODO: Store document URLs in DB
- [⚠️] TODO: Archive to S3

### Payments ❌ (Completely broken)
- [❌] Create payment
- [❌] Confirm payment
- [❌] Handle payment failure
- [❌] Get payment history
- [❌] Request refund
- [❌] Stripe webhook handling
- [⚠️] TODO: Stripe integration

### Transaction Management ✅
- [x] View transaction details
- [x] List user transactions
- [x] Get transaction history
- [x] Update transaction status (implicit via other endpoints)
- [⚠️] Missing: Explicit status update endpoint

---

## Required Frontend API Calls

### Offer to Sale Flow
```
1. POST /api/v1/offres                           ← Create offer
2. PUT /api/v1/offres/<id>/status               ← Accept/reject
3. ??? Create transaction manually? OR fixed by offer acceptance?
4. POST /api/v1/transactions/<id>/notaire       ← Select notaire
5. POST /api/v1/transactions/<id>/frais/valider ← Validate fees
6. POST /api/v1/paiements                       ← Initiate payment (BROKEN)
7. POST /api/v1/transactions/<id>/compromis/sign ← Sign agreement
8. POST /api/v1/transactions/<id>/acte/sign     ← Finalize sale
```

### Dashboard Display
```
Buyer:
  GET /api/v1/transactions              ← My transactions
  GET /api/v1/offres/buyer              ← My offers

Seller:
  GET /api/v1/offres/vendor             ← Offers for my listings
  GET /api/v1/offres/vendor/pending     ← Pending offers
  GET /api/v1/offres/vendor/pending/count ← Badge count
  GET /api/v1/offres/vendor/stats       ← Statistics

Notaire:
  GET /api/v1/notaires/<id>/dashboard/pending ← Cases to review
  GET /api/v1/notaires/notifications/user    ← Notifications
```

---

## Technical Details

### Authentication
- Most endpoints use `@token_required` decorator
- Admin endpoints use `@admin_required`
- Webhook endpoints use no auth (signature verification instead)

### Data Models
- **Offre**: Purchase offer with negotiation status
- **TransactionNotaire**: Legal transaction linking offer to parties + notaire
- **FraisNotaire**: Notary fees record
- **CommissionImmo2000**: Platform commission (2%)
- **Paiement**: Payment tracking (Stripe integration)
- **HistoriqueNotaire**: Audit trail for transactions

### Key Statuses

**Offre.statut**: 'proposee' → 'acceptee'/'negociation'/'refusee'/'retiree'/'finalisee'

**TransactionNotaire.statut**:
- 'en_attente_selection': Waiting for notaire assignment
- 'en_attente_validation': Waiting for notaire to validate compromis
- 'modifications_demandees': Notaire requested changes
- 'frais_valides': Fees validated by notaire
- 'paiement_depot': Deposit payment made
- 'compromis_signe': Purchase agreement signed
- 'paiement_solde': Balance payment made
- 'finalisee': Sale completed

---

## TODO/Known Issues

### High Priority (Blocking)
- [ ] Fix paiements.py blueprint name
- [ ] Add TransactionNotaire creation to accept_offer()
- [ ] Implement Stripe integration in paiement endpoints

### Medium Priority (Missing features)
- [ ] Email notifications (scattered TODOs in notaires.py, transactions.py)
- [ ] Document URL storage (compromis_url, acte_url fields needed)
- [ ] APScheduler integration (payment reminders)
- [ ] AWS S3 document archival
- [ ] Stripe webhook implementation

### Low Priority (Polish)
- [ ] Add explicit transaction status update endpoint
- [ ] Add notaire availability calendar endpoint
- [ ] Add signature history/timestamps

---

## File Summary

| File | Lines | Endpoints | Status | Issues |
|------|-------|-----------|--------|--------|
| notaires.py | 484 | 15 | ✅ | None |
| transactions.py | 411 | 7 | ✅ | Missing: Explicit status update |
| offres.py | 312 | 16 | ⚠️ | 1 incomplete: accept_offer() |
| paiements.py | 378 | 8 | ❌ | Blueprint bug + TODO Stripe |
