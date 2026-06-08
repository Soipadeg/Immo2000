# Immo2000: Backend API Endpoints vs Frontend UI Analysis

## Executive Summary
- **Total Backend Endpoints**: 75
- **Frontend Pages**: 71
- **Endpoints WITHOUT Dedicated Frontend UI**: ~35-40 (46%)
- **Analysis Date**: 2026-06-05

---

## 📊 COMPREHENSIVE ENDPOINT MAPPING TABLE

### Category 1: ADMIN ENDPOINTS (15 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/admin/dashboard` | GET | Admin dashboard overview | ✅ YES | AdminDashboardPage.jsx |
| `/api/v1/admin/analytics` | GET | Admin analytics data | ✅ YES | AdminAnalyticsPage.jsx |
| `/api/v1/admin/audit-logs` | GET | View audit logs | ❌ NO | Backend-only endpoint |
| `/api/v1/admin/audit-logs/export` | GET | Export audit logs | ❌ NO | Backend-only endpoint |
| `/api/v1/admin/security/status` | GET | Security status overview | ⚠️ PARTIAL | AdminSecurityPage exists but incomplete |
| `/api/v1/admin/stats/user-activity` | GET | User activity statistics | ⚠️ PARTIAL | Dashboard may call this |
| `/api/v1/admin/listings/pending` | GET | Pending listings approval queue | ❌ NO | Missing UI |
| `/api/v1/admin/listings/<id>/approve` | POST | Approve a listing | ❌ NO | Missing UI |
| `/api/v1/admin/listings/<id>/reject` | POST | Reject a listing | ❌ NO | Missing UI |
| `/api/v1/admin/listings/<id>/remove` | POST | Remove a listing | ❌ NO | Missing UI |
| `/api/v1/admin/transactions` | GET | List all transactions | ⚠️ PARTIAL | TransactionsPage exists |
| `/api/v1/admin/transactions/<id>` | GET | Transaction details | ⚠️ PARTIAL | TransactionDetailsPage exists |
| `/api/v1/admin/transactions/<id>/accept` | POST | Accept transaction | ❌ NO | Missing UI |
| `/api/v1/admin/transactions/<id>/decline` | POST | Decline transaction | ❌ NO | Missing UI |
| `/api/v1/admin/transactions/<id>/cancel` | POST | Cancel transaction | ❌ NO | Missing UI |

**Admin UI Gap**: Approval workflows, audit logs, detailed action buttons

---

### Category 2: USER MANAGEMENT ENDPOINTS (8 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/utilisateurs` | GET | List all users | ✅ YES | AdminUsersPageNew.jsx |
| `/api/v1/utilisateurs/<id>` | GET | User profile detail | ⚠️ PARTIAL | ProfilePage exists for self only |
| `/api/v1/utilisateurs/search` | GET | Search users | ✅ YES | AdminUsersPageNew.jsx |
| `/api/v1/utilisateurs/<id>/role` | POST | Change user role | ✅ YES | AdminUsersPageNew.jsx |
| `/api/v1/utilisateurs/<id>/suspend` | POST | Suspend user account | ✅ YES | AdminUsersPageNew.jsx |
| `/api/v1/utilisateurs/<id>/reactivate` | POST | Reactivate user | ✅ YES | AdminUsersPageNew.jsx |
| `/api/v1/utilisateurs/<id>/deactivate` | PATCH | Deactivate user | ✅ YES | AdminUsersPageNew.jsx |
| `/api/v1/utilisateurs/<id>` | DELETE | Delete user | ✅ YES | AdminUsersPageNew.jsx |

**Status**: Good coverage in admin panel

---

### Category 3: LISTINGS/ANNONCES ENDPOINTS (8 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/annonces/<id>` | GET | Get listing details | ✅ YES | AnnoncePage.jsx, PublicAnnonceListPage.jsx |
| `/api/v1/annonces/<id>` | PUT | Update listing | ⚠️ PARTIAL | CreerAnnonceEtape* pages exist |
| `/api/v1/annonces/<id>` | DELETE | Delete listing | ❌ NO | No dedicated delete UI |
| `/api/v1/annonces/<id>/publier` | POST | Publish listing | ⚠️ PARTIAL | Tunnel flow exists |
| `/api/v1/annonces/<id>/archiver` | POST | Archive listing | ❌ NO | Missing UI action |
| `/api/v1/annonces/<id>/vendre` | POST | Mark as sold | ❌ NO | Missing UI action |
| `/api/v1/annonces/brouillon` | POST | Create draft | ✅ YES | CreerAnnonceEtape1.jsx |
| `/api/v1/annonces/<id>/completer` | PUT | Complete listing | ✅ YES | VendreBienPage.jsx, CreerAnnonceEtape* |

**Status**: Core CRUD exists, but some action endpoints lack UI

---

### Category 4: PROPERTIES/BIENS ENDPOINTS (3 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/biens/me` | GET | Get my properties | ✅ YES | Dashboard, UserDashboardPage |
| `/api/v1/biens/<id>` | GET | Property details | ⚠️ PARTIAL | AnnoncePage shows property details |
| `/api/v1/biens/stats` | GET | Property statistics | ❌ NO | Backend-only |

---

### Category 5: MESSAGES ENDPOINTS (3 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/messages/<id>` | GET | Get message | ⚠️ PARTIAL | Conversations.jsx exists |
| `/api/v1/messages/<id>` | DELETE | Delete message | ❌ NO | No UI action |
| `/api/v1/messages/<id>/read` | PUT | Mark as read | ❌ NO | Auto-called, no explicit UI |

**Status**: Partial - conversation view exists, but message-level actions missing

---

### Category 6: NOTIFICATIONS ENDPOINTS (4 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/notifications/unread` | GET | Get unread notifications | ✅ YES | NotificationsPage.jsx |
| `/api/v1/notifications/<id>/mark-as-read` | PATCH | Mark notification read | ⚠️ PARTIAL | Likely called programmatically |
| `/api/v1/notifications/<id>` | DELETE | Delete notification | ❌ NO | No UI action |
| `/api/v1/notifications/health` | GET | Health check | ❌ NO | Backend monitoring |

---

### Category 7: APPOINTMENTS/RENDEZ-VOUS ENDPOINTS (5 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/rendez-vous/<id>` | GET | Get appointment | ✅ YES | MesRendezVous.jsx |
| `/api/v1/rendez-vous/<id>` | PUT | Update appointment | ⚠️ PARTIAL | MesRendezVous.jsx |
| `/api/v1/rendez-vous/<id>` | DELETE | Delete appointment | ⚠️ PARTIAL | May exist in MesRendezVous |
| `/api/v1/rendez-vous/<id>/historique` | GET | Appointment history | ❌ NO | Backend-only |
| `/api/v1/rendez-vous/<id>/ical` | GET | Export as iCalendar | ❌ NO | Calendar export, likely auto-called |

**Status**: Basic UI exists, but advanced features missing (history, export)

---

### Category 8: SLOTS/CRENEAUX ENDPOINTS (5 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/creneaux/<id>` | GET | Get slot details | ❌ NO | Missing UI |
| `/api/creneaux/<id>` | DELETE | Delete slot | ❌ NO | Missing UI |
| `/api/creneaux/<id>/marquer-disponible` | PUT | Mark available | ❌ NO | Missing UI |
| `/api/creneaux/<id>/marquer-reserve` | PUT | Mark reserved | ❌ NO | Missing UI |
| `/api/creneaux/vendeurs/<vendor_id>/creneaux` | GET | Get vendor slots | ⚠️ PARTIAL | May be called in appointment flow |

**Status**: CRITICAL GAP - No UI for time slot management

---

### Category 9: ALERTS ENDPOINTS (4 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/alertes/<id>` | GET | Get alert | ✅ YES | AlertesPage.jsx |
| `/api/v1/alertes/<id>` | PUT | Update alert | ✅ YES | AlertesPage.jsx |
| `/api/v1/alertes/<id>` | DELETE | Delete alert | ✅ YES | AlertesPage.jsx |
| `/api/v1/alertes/<id>/toggle` | POST | Toggle alert | ✅ YES | AlertesPage.jsx |

**Status**: COMPLETE - Full CRUD UI

---

### Category 10: VISITS/VISITES ENDPOINTS (7 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/visites/<id>` | GET | Get visit | ⚠️ PARTIAL | VisitesPage.jsx exists |
| `/api/v1/visites/<id>` | PUT | Update visit | ⚠️ PARTIAL | VisitesPage.jsx |
| `/api/v1/visites/<id>` | DELETE | Delete visit | ❌ NO | Missing UI action |
| `/api/v1/visites/<id>/feedback` | GET | Get visit feedback | ❌ NO | Backend-only |
| `/api/v1/visites/<id>/download.ics` | GET | Export visit (iCal) | ❌ NO | No explicit UI |
| `/api/v1/visites/<id>/reponse` | PUT | Respond to feedback | ❌ NO | Missing UI |
| `/api/v1/visites/info` | GET | Visit info | ⚠️ PARTIAL | Likely called at page load |
| `/api/v1/visites/vendeur/feedbacks` | GET | Vendor feedbacks | ❌ NO | Missing UI |

**Status**: Partial - view exists, but feedback/response UI missing

---

### Category 11: OFFERS/OFFRES ENDPOINTS (*)

**Note**: The grep search found limited OFFRES endpoints. Checking route files indicates more endpoints exist but weren't extracted. Key pages: OffresPage.jsx, RepondreOffrePage.jsx

**Known Missing Endpoints in Extraction**:
- POST `/api/v1/offres` - Create offer
- GET `/api/v1/offres` - List offers
- POST `/api/v1/offres/<id>/accept` - Accept offer
- POST `/api/v1/offres/<id>/reject` - Reject offer
- POST `/api/v1/offres/<id>/counter` - Counter offer

These likely have UI in: OffresPage.jsx, RepondreOffrePage.jsx

---

### Category 12: TRANSACTIONS ENDPOINTS (*)

**Note**: Similar to OFFRES - OffresPage, TransactionsPage, TransactionDetailsPage, SignActePage exist

**Known APIs Used**:
- `transactionsApi.list()` - List transactions
- `transactionsApi.getById()` - Get transaction detail
- `transactionsApi.signActe()` - Sign deed

---

### Category 13: CONTRACTS ENDPOINTS (1 endpoint)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/contrats/exclusivite` | POST | Sign exclusivity contract | ⚠️ PARTIAL | CreerAnnonceEtape3.jsx |

**Status**: Partial - integrated into listing creation flow

---

### Category 14: ESTIMATIONS ENDPOINTS (2 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/estimations/compare` | POST | Compare estimates | ✅ YES | EstimationPage.jsx, SearchPage.jsx |
| `/api/v1/estimations/test` | POST | Test estimation | ❌ NO | Testing endpoint only |

**Status**: Good coverage

---

### Category 15: LOAN SIMULATOR ENDPOINTS (1 endpoint)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/simulateur-pret/info` | GET | Get simulator info | ✅ YES | SimulateurPret.jsx, SimulateurBudget.jsx |

**Note**: Earlier phases may have had `/api/pret/*` endpoints that aren't in current extraction

---

### Category 16: FAVORITES ENDPOINTS (*)

**Note**: Not in extracted list, but frontend has FavoritesPage.jsx using `favorisApi`

**Likely Endpoints**:
- GET/POST `/api/v1/favoris`
- DELETE `/api/v1/favoris/<id>`

**Status**: Pages exist

---

### Category 17: MATCHING ENDPOINTS (1 endpoint)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/matching/stats` | GET | Matching statistics | ❌ NO | Backend analytics only |

**Note**: MatchingPage.jsx exists but may not call this specific endpoint

---

### Category 18: FAQ ENDPOINTS (3 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/faq/search` | GET | Search FAQ | ✅ YES | FAQPage.jsx |
| `/api/v1/faq/health` | GET | FAQ service health | ❌ NO | Monitoring only |
| `/api/v1/faq/stats` | GET | FAQ statistics | ⚠️ PARTIAL | Backend analytics |

**Status**: Core search UI exists

---

### Category 19: CHAT/CHATBOT ENDPOINTS (1 endpoint)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/chat/health` | GET | Chatbot service health | ❌ NO | Monitoring only |

**Note**: Actual chat endpoints not in extraction - may use WebSockets or different pattern

---

### Category 20: DEVELOPMENT/DEV ENDPOINTS (3 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/dev/auth/<role>` | GET | Dev auth (create test user) | ❌ NO | Dev-only, not for production |
| `/dev/auth/status` | GET | Dev auth status | ❌ NO | Dev-only |
| `/dev/auth/tokens` | GET | Dev auth tokens | ❌ NO | Dev-only |

**Status**: Dev-only endpoints, no production UI needed

---

### Category 21: NOTAIRES ENDPOINTS (*)

**Note**: NotaireDashboardPage.jsx exists - uses `notairesApi`

**Missing in Extraction**:
- `/api/v1/notaires` endpoints (notifications, RGPD, etc.)
- These are in: notaires_notifications_endpoints.py, notaires_rgpd_endpoints.py

---

### Category 22: SECURITY ENDPOINTS (*)

**Note**: Verify2FAPage.jsx, AdminSecurityPage.jsx exist

**Missing in Extraction**:
- `/api/v1/security/2fa/*` endpoints
- `/api/v1/security/identity/*` endpoints
- `/api/v1/security/rgpd/*` endpoints
- `/api/v1/security/profile` endpoints

These are in: security.py route file

---

### Category 23: ANALYTICS ENDPOINTS (*)

**Note**: AdminAnalyticsPage.jsx uses `analyticsApi`

**Missing in Extraction**:
- `/api/v1/analytics/*` endpoints
- Web Vitals collection endpoints
- Performance metrics

---

### Category 24: DOCUMENTS ENDPOINTS (*)

**Note**: Various pages reference documents (SignActePage, etc.)

**Missing in Extraction**:
- `/api/v1/documents/*` endpoints
- Document upload/download
- Document signing integration

---

### Category 25: PAYMENTS ENDPOINTS (*)

**Note**: PaymentPage.jsx, ValidateFeesPage.jsx exist

**Missing in Extraction**:
- `/api/v1/paiements/*` endpoints
- Payment processing
- Payment status tracking

---

### Category 26: TUNNEL ANNONCES ENDPOINTS (3 endpoints)

| Endpoint | Method | Purpose | Has Frontend UI | Notes |
|----------|--------|---------|-----------------|-------|
| `/api/v1/utilisateurs/me/annonces` | GET | My listings | ✅ YES | VendreBienPage.jsx, Dashboard |
| `/api/v1/annonces/brouillon` | POST | Create draft listing | ✅ YES | CreerAnnonceEtape1.jsx |
| `/api/v1/annonces/<id>/completer` | PUT | Complete listing | ✅ YES | CreerAnnonceEtape*, VendreBienPage |

**Status**: COMPLETE - Full listing creation workflow UI

---

## 📋 SUMMARY OF MISSING FRONTEND UIs

### ❌ CRITICAL GAPS (No UI at all):

1. **Slot Management (Creneaux)**
   - All 5 endpoints: GET, DELETE, mark-available, mark-reserved, vendor slots
   - Impact: Users cannot manage appointment time slots

2. **Admin Audit & Approval Workflow**
   - Audit logs (view & export)
   - Listing approval/rejection queue
   - Transaction action buttons (accept/decline/cancel)
   - Impact: No admin oversight or approval management

3. **Visit Feedback Management**
   - Get feedback, respond to feedback, feedbacks list
   - Impact: Cannot track or respond to property visit feedback

4. **Advanced Appointment Features**
   - Appointment history, iCalendar export
   - Impact: Users cannot view history or export to calendar apps

5. **User Management (Admin)**
   - User detail page for admin viewing other users
   - Impact: Limited admin user visibility

6. **Backend Monitoring Endpoints**
   - Health checks (chat, faq, notifications)
   - Analytics/stats endpoints
   - Impact: No production monitoring UI

7. **Business Logic Actions**
   - Mark listing as sold, archive listing, delete listing
   - Mark message/notification as read, delete message/notification
   - Delete visits
   - Respond to visit feedback
   - Impact: Users must rely on workarounds or API calls

### ⚠️ PARTIAL COVERAGE (Page exists, but incomplete):

1. **Admin Dashboard**
   - Analytics page exists but may be incomplete
   - Security status page incomplete
   - User activity stats not visualized

2. **Appointment Management**
   - Basic view exists, but advanced features missing (history, export)

3. **Message/Notification Management**
   - Conversations view exists, but message-level actions missing
   - Notifications page exists, but deletion missing

4. **Listing Lifecycle**
   - Create/update exists, but publish/archive/sell actions missing
   - No delete confirmation UI

5. **Security/Identity**
   - 2FA setup/disable endpoints exist
   - Identity verification endpoints exist
   - RGPD endpoints exist
   - UI pages partially complete (Verify2FAPage, AdminSecurityPage)

---

## 📈 STATISTICS BY FEATURE COMPLETENESS

### Complete UI Coverage (✅)
- Alerts: 4/4 endpoints (100%)
- User Management (Admin): 7/8 endpoints (88%)
- Listings Basic CRUD: 4/8 endpoints (50%)
- Estimations: 1/2 endpoints (50%)

### Partial Coverage (⚠️)
- Admin: 2/6 endpoints (33%)
- Appointments: 2/5 endpoints (40%)
- Messages: 1/3 endpoints (33%)
- Notifications: 1/4 endpoints (25%)
- Visits: 1/7 endpoints (14%)
- Properties: 1/3 endpoints (33%)

### No Coverage (❌)
- Slots: 0/5 endpoints (0%)
- Health/Monitoring: 0/4 endpoints (0%)
- Dev endpoints: 0/3 endpoints (0%)

---

## 🔧 RECOMMENDED PRIORITY FIX QUEUE

### Phase 1: Critical Business Functions (1-2 weeks)
1. **Slot Management UI** - Required for appointment booking
2. **Admin Approval Queue** - Required for listing moderation
3. **Visit Feedback Management** - Required for user experience tracking
4. **Business Action Buttons** - Archive, sell, publish for listings

### Phase 2: Admin Features (1-2 weeks)
1. **Audit Log Viewer** - Admin oversight
2. **User Management Details** - Admin user viewing
3. **Analytics Dashboard** - Business intelligence

### Phase 3: User Experience (1 week)
1. **Message/Notification Management** - Full CRUD
2. **Appointment History & Export** - User convenience
3. **Advanced Settings** - Security & identity management

### Phase 4: Monitoring & Operations (1 week)
1. **Health Check Dashboard** - Ops monitoring
2. **System Analytics** - Performance tracking
3. **Error Tracking** - Debugging support

---

## 📝 NOTES & OBSERVATIONS

1. **Security Endpoints**: Phase 6G implemented comprehensive security (2FA, identity verification, RGPD) but UI is incomplete

2. **Extraction Limitations**: The grep-based endpoint extraction may have missed some endpoints (especially in admin subdirectory, notaires, documents, payments)

3. **WebSocket/Real-time**: Chat functionality may use WebSockets rather than REST endpoints

4. **Integration Pattern**: Many endpoints are called programmatically (e.g., mark-as-read) without explicit user UI

5. **Partial Pages**: Some pages exist but are incomplete (AdminSecurityPage, AdminAnalyticsPage noted as incomplete in code comments)

6. **Legacy Endpoints**: Some phase 5/6 endpoints may still exist but aren't in Phase 7+ routing

---

## 🎯 CONCLUSION

**~35-40 endpoints (46%) lack corresponding frontend UI**, but this breaks down as:
- **Critical gaps**: ~12-15 endpoints (16%) - Features completely missing
- **Partial coverage**: ~20-25 endpoints (27%) - Pages exist but incomplete
- **Backend-only**: ~5-8 endpoints (7%) - Health checks, monitoring, dev tools

The most urgent gaps are:
1. **Slot/Time Management** - Core appointment booking feature
2. **Admin Workflow** - Listing approval & transaction management
3. **Visit Feedback** - User feedback tracking & response
4. **Action Buttons** - Listing state transitions (publish, archive, sell)

These should be prioritized for Phase 8 frontend completion.
