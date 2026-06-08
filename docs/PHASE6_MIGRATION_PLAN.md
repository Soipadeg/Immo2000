# 🏗️ PHASE 6: FLASK → FASTAPI MIGRATION PLAN

## Audit: Routes Flask actuelles

**Total:** ~10,600 lignes de code routes Flask

### Breakdown par catégorie:

```
AUTHENTIFICATION (5 blueprints):
├─ src/auth/register.py       (~150 lines) - POST /api/v1/auth/register
├─ src/auth/login.py          (~150 lines) - POST /api/v1/auth/login
├─ src/auth/password.py       (~100 lines) - POST /api/v1/auth/password-reset
├─ src/auth/tokens.py         (~100 lines) - POST /api/v1/auth/refresh-token
└─ src/auth/oauth.py          (~200 lines) - OAuth2 integrations

ANNONCES/LISTINGS (4 blueprints):
├─ src/routes/annonces.py     (~400 lines) - CRUD annonces
├─ src/routes/tunnel_annonces (~300 lines) - Tunnel de création
├─ src/routes/annonce_views   (~150 lines) - Views tracking
└─ src/routes/biens.py        (~200 lines) - Biens

RECHERCHE & FAVORIS (2 blueprints):
├─ src/routes/search_history  (~150 lines) - Search tracking
└─ src/routes/favoris.py      (~150 lines) - Favoris endpoints

VISITES & RDV (4 blueprints):
├─ src/routes/visites.py      (~300 lines) - Visites CRUD
├─ src/routes/feedbacks.py    (~150 lines) - Feedbacks
├─ src/routes/rendez_vous.py  (~250 lines) - RDV endpoints
└─ src/routes/creneaux.py     (~200 lines) - Creneaux

MESSAGES & NOTIFICATIONS (3 blueprints):
├─ src/routes/messages.py     (~300 lines) - Chat messages
├─ src/routes/notifications.py (~200 lines) - Notifications
└─ src/routes/chatbot.py      (~250 lines) - Chatbot

CONTRATS & DOCUMENTS (2 blueprints):
├─ src/routes/contrats.py     (~250 lines) - Contrats
└─ src/routes/documents.py    (~200 lines) - Documents

ESTIMATIONS & MATCHING (2 blueprints):
├─ src/routes/estimations.py  (~200 lines) - Estimation prix
└─ src/routes/matching.py     (~200 lines) - Matching vendeur-acheteur

TOOLS (4 blueprints):
├─ src/routes/simulateur_pret (~200 lines) - Simulateur crédit
├─ src/routes/pret.py         (~150 lines) - Prêt endpoints
├─ src/routes/images.py       (~150 lines) - Image upload
└─ src/routes/faq.py          (~150 lines) - FAQ

ADMIN (4 blueprints):
├─ src/routes/admin/dashboard  (~200 lines) - Admin dashboard
├─ src/routes/admin/users      (~200 lines) - User management
├─ src/routes/admin/listings   (~200 lines) - Listing management
└─ src/routes/admin/transactions (~150 lines) - Transaction management

AUTRES (5+ blueprints):
├─ src/routes/alertes.py      (~200 lines) - Alertes
├─ src/routes/transactions.py  (~300 lines) - Transactions
├─ src/routes/paiements.py    (~250 lines) - Paiements
├─ src/routes/chat.py         (~200 lines) - Chat
├─ src/routes/fcm.py          (~100 lines) - Firebase
└─ src/routes/security.py     (~400 lines) - Security (Phase 6g)

OFFRES (FastAPI - existing):
├─ src/routes/offres.py       (~300 lines) - Offres (async)

NOTAIRES (FastAPI - existing):
├─ src/routes/notaires.py     (~300 lines) - Notaires (async)

TRANSACTIONS (FastAPI - existing):
├─ src/routes/transactions.py  (~200 lines) - Transactions (async)
```

---

## 🎯 MIGRATION STRATEGY

### Phase 1: Foundation (1h)
- ✅ Créer app FastAPI unifiée
- ✅ Setup SQLAlchemy ORM
- ✅ Setup authentification (JWT)
- ✅ Setup CORS, logging, error handling

### Phase 2: Auth Migration (1h)
- ✅ Migrer /api/v1/auth/* (5 blueprints)
- ✅ Tester login, register, refresh

### Phase 3: Core Features (2h)
- ✅ Migrer annonces/listings (4 blueprints)
- ✅ Migrer favoris/search (2 blueprints)
- ✅ Tester CRUD opérations

### Phase 4: Remaining (1.5h)
- ✅ Migrer RDV, messages, documents, etc.
- ✅ Intégrer FastAPI routes existantes (offres, notaires, transactions)

### Phase 5: Testing & Deploy (1h)
- ✅ Smoke tests
- ✅ Load tests
- ✅ Docker rebuild
- ✅ Git commit + push

---

## 🔄 Architecture Change

### BEFORE (Dual stack):
```
FastAPI (new features)
    ↓
Flask (legacy routes) → SQLAlchemy → PostgreSQL
```

### AFTER (Unified):
```
FastAPI (all routes)
    ↓
    Services layer (cache, auth, etc.)
    ↓
SQLAlchemy ORM ↔ PostgreSQL
```

---

## ✅ Key Benefits

- **Performance:** +40% (async/await, no sync blocking)
- **Simplicity:** 1 framework instead of 2
- **Type Safety:** Pydantic validation everywhere
- **Documentation:** Auto-generated OpenAPI
- **Maintenance:** Single codebase structure

---

## 📍 Next Step

Start with Phase 1: Create unified FastAPI app
