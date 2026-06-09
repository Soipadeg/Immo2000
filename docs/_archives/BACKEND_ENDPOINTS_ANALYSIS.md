# 📡 BACKEND ENDPOINTS DETAILED ANALYSIS

**Generated**: 8 Juin 2026
**Source**: `backend/app_fastapi/routes/`

---

## 🔥 Critical Endpoints (Phase 8 Coverage)

### ✅ Health Routes (`health.py`)
```
GET     /                          Health check (basic)
GET     /health                    Health check (legacy)
```

### ✅ Transactions Routes (`transactions.py`) - 15,574 lines!
```
Core Transaction Operations:
GET     /transactions/:transaction_id          Get transaction details
GET     /transactions                          List all transactions
POST    /transactions/:id/select-notaire       Select notary
POST    /transactions/:id/frais/valider        Validate notary fees
POST    /transactions/:id/compromis/generer    Generate compromise PDF
POST    /transactions/:id/compromis/envoyer    Send to DocuSign

Payment Operations:
PUT     /transactions/:id/payment              Update payment status
GET     /transactions/:id/payment              Get payment info

Document Management:
PUT     /transactions/:id/documents/:docId/sign    Sign document
GET     /transactions/:id/documents                List documents

Offer Operations (from Phase 8.2.3):
POST    /transactions/:id/offers/:offerId/accept      Accept offer
POST    /transactions/:id/offers/:offerId/reject      Reject offer
POST    /transactions/:id/offers/:offerId/counter     Counter-offer

Timeline/History:
GET     /transactions/:id/timeline              Transaction timeline
```

### ✅ Documents Routes (`documents.py`)
```
GET     /documents/:id              Get document
GET     /documents                  List documents
POST    /documents                  Create document
PUT     /documents/:id              Update document
DELETE  /documents/:id              Delete document
```

### ✅ Payments Routes (`paiements.py`)
```
GET     /paiements                  List payments
POST    /paiements                  Create payment
GET     /paiements/:id              Get payment details
PUT     /paiements/:id              Update payment
GET     /paiements/webhook          Payment webhook
```

### ✅ Offers Routes (`offres.py`)
```
GET     /offres                     List offers
POST    /offres                     Create offer
GET     /offres/:id                 Get offer details
PUT     /offres/:id                 Update offer
DELETE  /offres/:id                 Delete offer
```

### ✅ Notary Routes (`notaires.py`)
```
GET     /notaires                   List notaries
GET     /notaires/:id               Get notary profile
POST    /notaires/:id/validate      Validate notary
```

### ✅ Webhooks Routes (`webhooks.py`)
```
POST    /webhooks/docusign          DocuSign webhook
POST    /webhooks/stripe            Stripe webhook
POST    /webhooks/melo              Melo API webhook
```

---

## 🔗 Expected Endpoints (Phase 8 Features)

### Phase 8.2.1 - Audit Logs
**Expected Endpoints** (need to verify in backend):
```
GET     /api/v1/admin/audit-logs        ❌ CHECK
GET     /api/v1/admin/audit-logs/:id    ❌ CHECK
POST    /api/v1/admin/audit-logs/export ❌ CHECK
```

### Phase 8.2.2 - Messages
**Expected Endpoints** (need to verify):
```
GET     /messages/conversations         ❌ CHECK
POST    /messages                       ❌ CHECK
DELETE  /messages/:id                   ❌ CHECK
GET     /messages/:conversationId       ❌ CHECK
```

### Phase 8.2.3 - Transactions
**Expected Endpoints** (FOUND in transactions.py):
```
GET     /transactions/:id               ✅ FOUND
POST    /transactions/:id/offers/:offerId/accept   ✅ LIKELY
POST    /transactions/:id/offers/:offerId/reject   ✅ LIKELY
PUT     /transactions/:id/payment       ✅ LIKELY
```

### Phase 8.2.4 - Notifications
**Expected Endpoints** (need to verify):
```
GET     /notifications/preferences      ❌ CHECK
PUT     /notifications/preferences      ❌ CHECK
GET     /notifications/history          ❌ CHECK
DELETE  /notifications/:id              ❌ CHECK
PATCH   /notifications/:id/mark-as-read ❌ CHECK
```

### Phase 8.3.1 - Appointments
**Expected Endpoints** (need to verify):
```
GET     /rendez-vous/:id/historique     ❌ CHECK
PUT     /appointments/:id/reschedule    ❌ CHECK
PUT     /appointments/:id/cancel        ❌ CHECK
GET     /appointments/report            ❌ CHECK
```

### Phase 8.3.2 - Calendar Export
**Expected Endpoints** (need to verify):
```
GET     /rendez-vous/:id/ical           ❌ CHECK
GET     /calendar/export/vcalendar      ❌ CHECK
GET     /calendar/export/csv            ❌ CHECK
POST    /calendar/share                 ❌ CHECK
POST    /calendar/import                ❌ CHECK
```

### Phase 8.3.3 - Property Statistics
**Expected Endpoints** (need to verify):
```
GET     /biens/stats                    ❌ CHECK
GET     /statistics/performance         ❌ CHECK
GET     /statistics/report              ❌ CHECK
```

### Phase 8.3.4 - Health Check
**Expected Endpoints** (FOUND in health.py):
```
GET     /chat/health                    ✅ LIKELY in main
GET     /faq/health                     ✅ LIKELY in main
POST    /health/restart/:serviceName    ❌ CHECK
```

---

## 🚨 Status Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Transactions** | ✅ FOUND | Well-documented in transactions.py |
| **Documents** | ✅ FOUND | documents.py exists |
| **Payments** | ✅ FOUND | paiements.py exists |
| **Audit Logs** | ❌ MISSING | No audit-logs route file found |
| **Messages** | ❌ MISSING | No messages route file found |
| **Notifications** | ❌ MISSING | No notifications route file found |
| **Appointments** | ❌ MISSING | No appointments route file found |
| **Calendar** | ❌ MISSING | No calendar route file found |
| **Health** | ✅ FOUND | health.py exists (basic) |

---

## ⚠️ Critical Issues Found

1. **Missing Endpoints**: Phase 8.2.2-8.3.3 endpoints are NOT found in backend routes
   - No audit-logs routes
   - No messages routes
   - No notifications routes
   - No appointments routes
   - No calendar routes
   - No statistics routes

2. **Possible Solutions**:
   - ✅ Endpoints might be in `backend/src/routes/` instead
   - ✅ Endpoints might be in `backend/` main.py
   - ✅ Endpoints might need to be created (new backend work)
   - ✅ Frontend hooks might be using mock data only

3. **Next Action**:
   - Search `backend/src/routes/` for missing endpoints
   - Check `backend/run_server.py` and `backend/app_fastapi/main.py`
   - Check if hooks use mock data (development fallback)

---

## 🎯 Action Items

```
❌ 1. Search backend/src/routes/ for all endpoints
❌ 2. Check backend/run_server.py for route registration
❌ 3. Check backend/app_fastapi/main.py for route definitions
❌ 4. Verify which hooks use mock vs real endpoints
❌ 5. Document any missing endpoint implementations
❌ 6. Create integration report with findings
```

---

## 📊 Next Task

**Task 1.3 - Create Detailed Mapping**

Need to:
1. Check backend/src/routes/ folder
2. Check main.py for route registration
3. Verify hook implementations use real endpoints
4. Document all mismatches found

**Estimated Time**: 2-3 hours
**Output**: Complete hooks → endpoints mapping

---

## 🔍 To Find Missing Endpoints

```bash
# Search all Python files for route definitions
find backend -name "*.py" -exec grep -l "@router\|@app.get\|@app.post" {} \;

# Search for specific endpoints
grep -r "audit-logs\|/messages\|/notifications" backend/

# List all route registrations in main app
grep -r "include_router\|register_blueprint" backend/
```
