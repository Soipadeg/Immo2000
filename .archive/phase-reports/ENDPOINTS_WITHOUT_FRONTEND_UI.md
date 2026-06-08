# Immo2000: Quick Reference - Endpoints Without Frontend UI

## 🔴 CRITICAL - NO UI AT ALL (35+ endpoints)

### Slot/Creneaux Management (5 endpoints) - BLOCKING APPOINTMENT FEATURE
```
❌ GET    /api/creneaux/<int:creneau_id>
❌ DELETE /api/creneaux/<int:creneau_id>
❌ PUT    /api/creneaux/<int:creneau_id>/marquer-disponible
❌ PUT    /api/creneaux/<int:creneau_id>/marquer-reserve
❌ GET    /api/creneaux/vendeurs/<int:vendeur_id>/creneaux
```
**Impact**: Users cannot manage appointment availability/time slots
**Frontend Needed**: SlotManagementPage.jsx or component in calendar view

---

### Admin Approval & Workflow (8 endpoints) - BLOCKING MODERATION
```
❌ GET    /api/v1/admin/listings/pending
❌ POST   /api/v1/admin/listings/<int:listing_id>/approve
❌ POST   /api/v1/admin/listings/<int:listing_id>/reject
❌ POST   /api/v1/admin/listings/<int:listing_id>/remove
❌ POST   /api/v1/admin/transactions/<int:offre_id>/accept
❌ POST   /api/v1/admin/transactions/<int:offre_id>/decline
❌ POST   /api/v1/admin/transactions/<int:offre_id>/cancel
❌ GET    /api/v1/admin/transactions/<int:offre_id>
```
**Impact**: Admin cannot approve listings or manage transaction workflows
**Frontend Needed**: AdminListingsApprovalPage.jsx, transaction action buttons in TransactionsPage

---

### Audit & Compliance (2 endpoints) - BLOCKING COMPLIANCE
```
❌ GET    /api/v1/admin/audit-logs
❌ GET    /api/v1/admin/audit-logs/export
```
**Impact**: Cannot view security audit trail or demonstrate RGPD compliance
**Frontend Needed**: AdminAuditPage.jsx (exists but empty/incomplete)

---

### Visit Feedback Management (4 endpoints) - BLOCKING FEEDBACK LOOP
```
❌ GET    /api/v1/visites/<int:visite_id>/feedback
❌ PUT    /api/v1/visites/<int:feedback_id>/reponse
❌ GET    /api/v1/visites/vendeur/feedbacks
❌ DELETE /api/v1/visites/<int:visite_id>
```
**Impact**: Cannot track or respond to property visit feedback
**Frontend Needed**: VisitFeedbackPage.jsx with response functionality

---

### Listing Lifecycle Actions (4 endpoints) - BLOCKING CRITICAL USER ACTIONS
```
❌ POST   /api/v1/annonces/<int:annonce_id>/archiver
❌ POST   /api/v1/annonces/<int:annonce_id>/vendre
❌ DELETE /api/v1/annonces/<int:annonce_id>
❌ POST   /api/v1/annonces/<int:annonce_id>/publier (partial)
```
**Impact**: Users cannot publish, archive, or mark listings as sold
**Frontend Needed**: Action buttons in listing detail view, bulk actions in dashboard

---

### Message/Notification Management (4 endpoints) - BLOCKING COMMUNICATION
```
❌ DELETE /api/v1/messages/<int:message_id>
❌ PUT    /api/v1/messages/<int:message_id>/read
❌ DELETE /api/v1/notifications/<int:notification_id>
❌ PATCH  /api/v1/notifications/<int:notification_id>/mark-as-read
```
**Impact**: Cannot delete messages/notifications or mark as read explicitly
**Frontend Needed**: Message action menu, notification management UI

---

### Advanced Appointment Features (2 endpoints) - BLOCKING UX
```
❌ GET    /api/v1/rendez-vous/<int:rdv_id>/historique
❌ GET    /api/v1/rendez-vous/<int:rdv_id>/ical
```
**Impact**: Cannot view appointment history or export to calendar apps
**Frontend Needed**: History view in appointment detail, export button

---

### Backend Monitoring (4 endpoints) - OPERATIONS ONLY
```
❌ GET    /api/v1/chat/health
❌ GET    /api/v1/faq/health
❌ GET    /api/v1/notifications/health
❌ GET    /dev/auth/*
```
**Impact**: Cannot monitor service health from dashboard
**Frontend Needed**: Health check dashboard (already exists: ApiStatusPage.jsx)

---

### Stats/Analytics (5 endpoints) - BUSINESS INTELLIGENCE
```
❌ GET    /api/v1/biens/stats
❌ GET    /api/v1/matching/stats
❌ GET    /api/v1/admin/stats/user-activity
❌ GET    /api/v1/faq/stats
❌ POST   /api/v1/estimations/test
```
**Impact**: Cannot view business intelligence metrics
**Frontend Needed**: Dashboard charts and analytics pages

---

## 🟡 PARTIAL - MISSING ACTION BUTTONS OR COMPLETE FLOWS

### User Management (1 endpoint)
```
⚠️ GET    /api/v1/utilisateurs/<int:user_id>  (admin viewing other user details)
```
**Current**: AdminUsersPageNew.jsx shows list, not individual detail view
**Needed**: User detail modal/page for admin to view user profile

---

### Listing Management (3 endpoints)
```
⚠️ PUT    /api/v1/annonces/<int:annonce_id>   (update flow incomplete)
⚠️ GET    /api/v1/annonces/<int:annonce_id>   (detail page may not show all fields)
⚠️ POST   /api/v1/annonces/<int:annonce_id>/publier (tunnel exists but not button)
```
**Current**: Partial tunnel pages exist
**Needed**: Unified edit page with all fields, publish confirmation

---

### Appointment Management (2 endpoints)
```
⚠️ PUT    /api/v1/rendez-vous/<int:rdv_id>   (update exists but limited UI)
⚠️ DELETE /api/v1/rendez-vous/<int:rdv_id>   (no delete button in UI)
```
**Current**: MesRendezVous.jsx shows list
**Needed**: Edit modal, delete confirmation dialog

---

### Visit Management (2 endpoints)
```
⚠️ GET    /api/v1/visites/<int:visite_id>
⚠️ PUT    /api/v1/visites/<int:visite_id>
```
**Current**: VisitesPage.jsx exists
**Needed**: Complete edit/update functionality

---

### Admin Analytics (2 endpoints)
```
⚠️ GET    /api/v1/admin/analytics
⚠️ GET    /api/v1/admin/security/status
```
**Current**: AdminAnalyticsPage.jsx and AdminSecurityPage.jsx marked as incomplete in code
**Needed**: Charts, metrics visualization, security dashboard

---

## 📊 BY THE NUMBERS

| Category | Total | Implemented | Partial | Missing | % Missing |
|----------|-------|-------------|---------|---------|-----------|
| Admin | 15 | 2 | 4 | 9 | 60% |
| Users | 8 | 7 | 1 | 0 | 0% |
| Listings | 8 | 3 | 3 | 2 | 25% |
| Appointments | 5 | 1 | 2 | 2 | 40% |
| Slots | 5 | 0 | 0 | 5 | 100% |
| Messages | 3 | 1 | 1 | 1 | 33% |
| Notifications | 4 | 1 | 1 | 2 | 50% |
| Visits | 7 | 1 | 1 | 5 | 71% |
| **TOTAL** | **75** | **25** | **17** | **33** | **44%** |

---

## 🚀 IMPLEMENTATION ROADMAP

### Week 1: Critical (Must-Have)
- [ ] Slot management page (creneaux CRUD)
- [ ] Admin approval queue for listings
- [ ] Listing action buttons (publish, archive, sell, delete)
- [ ] Visit feedback response UI

**Effort**: 40-50 hours
**Impact**: Unblocks core user workflows

### Week 2: Important (Should-Have)
- [ ] Appointment history & iCal export
- [ ] Admin audit logs viewer
- [ ] Visit feedback management page
- [ ] Message/notification management UI

**Effort**: 30-40 hours
**Impact**: Improves user experience & compliance

### Week 3: Nice-to-Have
- [ ] Analytics dashboards
- [ ] User detail pages (admin)
- [ ] Advanced stats/metrics
- [ ] Health check monitoring UI

**Effort**: 20-30 hours
**Impact**: Business intelligence & operations

---

## 📁 FILES TO CREATE/MODIFY

### New Pages Needed
```
frontend/src/pages/
├── AdminListingsApprovalPage.jsx          (Admin approval queue)
├── AdminAuditPage.jsx                     (Already exists, needs completion)
├── AdminSecurityPage.jsx                  (Already exists, needs completion)
├── SlotManagementPage.jsx                 (Time slot scheduling)
├── VisitFeedbackPage.jsx                  (Visit feedback response)
├── UserDetailPage.jsx                     (Admin user detail modal)
└── AppointmentHistoryPage.jsx             (Appointment history & export)
```

### Components to Create
```
frontend/src/components/
├── ListingActionButtons.jsx               (Publish, Archive, Sell, Delete)
├── AdminTransactionActions.jsx            (Accept, Decline, Cancel buttons)
├── MessageContextMenu.jsx                 (Delete, Mark read actions)
├── NotificationManager.jsx                (Delete, Mark read, Filter)
├── SlotGrid.jsx                           (Visual slot scheduling)
└── FeedbackResponseModal.jsx              (Response compose UI)
```

### Existing Pages to Update
```
frontend/src/pages/
├── AdminDashboardPage.jsx                 (Add analytics charts)
├── AdminAnalyticsPage.jsx                 (Complete implementation)
├── AdminSecurityPage.jsx                  (Complete implementation)
├── AdminUsersPageNew.jsx                  (Add user detail view)
├── TransactionsPage.jsx                   (Add action buttons)
├── VisitesPage.jsx                        (Add feedback section)
├── MesRendezVous.jsx                      (Add edit, history, export)
├── NotificationsPage.jsx                  (Add delete action)
├── Conversations.jsx                      (Add message actions)
└── AnnoncePage.jsx                        (Add publish, archive, sell buttons)
```

---

## 🔗 RELATED DOCUMENTS

- [BACKEND_ENDPOINTS_ANALYSIS.md](./BACKEND_ENDPOINTS_ANALYSIS.md) - Detailed analysis
- [docs/ARCHITECTURE_DESIGN.md](./docs/ARCHITECTURE_DESIGN.md) - System architecture
- [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) - API documentation
- [PHASE_7_COMPLETION_SUMMARY.md](./PHASE_7_COMPLETION_SUMMARY.md) - Current status

---

## ✅ VERIFICATION CHECKLIST

- [x] Extracted all 75 backend endpoints
- [x] Mapped to 71 frontend pages
- [x] Identified 33+ missing endpoint implementations
- [x] Categorized by feature area
- [x] Prioritized by business impact
- [x] Created implementation roadmap
- [ ] Implement Phase 8 frontend completion
- [ ] Deploy and test
- [ ] Document completion
