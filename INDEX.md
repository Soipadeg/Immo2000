# 🚀 IMMO2000 - Guide de Démarrage

**MVP Phase 1 - Production Ready**

---

## 📍 Vous êtes où?

### 👉 Je veux UTILISER l'API

**Commencez par:** [`docs/MVP_PHASE1_API.md`](docs/MVP_PHASE1_API.md)

Contient:
- ✅ 9 endpoints documentés
- ✅ Examples curl prêts-à-copier
- ✅ Gestion erreurs
- ✅ Authentification JWT

**Puis:** [`docs/MVP_PHASE1_SETUP.md`](docs/MVP_PHASE1_SETUP.md)

Pour lancer l'application:
```bash
docker-compose --env-file .env.docker up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

---

### 👉 Je veux comprendre le projet COMPLET

**Lisez:** [`RECAPITULATIF_COMPLET.md`](RECAPITULATIF_COMPLET.md)

Contient:
- ✅ Vue d'ensemble complète
- ✅ 14 tâches réalisées
- ✅ Statistiques et qualité
- ✅ Prochaines étapes

---

### 👉 Je veux DÉVELOPPER / CONTRIBUER

**Points de départ:**

**Backend:**
- Code: `backend/src/app.py` (entry point)
- API: `backend/src/routes/biens.py` (endpoints)
- ORM: `backend/src/models/biens.py` (database)
- Logic: `backend/src/crud/biens.py` (business)
- Tests: `backend/tests/` (unit tests)

**Frontend:**
- Code: `frontend/src/App.jsx` (entry point)
- Pages: `frontend/src/pages/` (components)
- Client: `frontend/src/services/api.js` (API calls)

**Database:**
- Migrations: `database/migrations/` (schema)
- Schema: `database/immo2000_schema.sql` (full schema)

---

## 🎯 Quick Links

| Besoin | Fichier |
|--------|---------|
| **Utiliser API** | [`docs/MVP_PHASE1_API.md`](docs/MVP_PHASE1_API.md) |
| **Lancer app** | [`docs/MVP_PHASE1_SETUP.md`](docs/MVP_PHASE1_SETUP.md) |
| **Vue d'ensemble** | [`RECAPITULATIF_COMPLET.md`](RECAPITULATIF_COMPLET.md) |
| **Code source** | `backend/src/`, `frontend/src/` |
| **Architecture** | `docs/ARCHITECTURE.md` |
| **Historique** | `_archive/` |

---

## ✨ Fichiers Importants à Connaître

### Documentation (À Lire)
- ✅ `RECAPITULATIF_COMPLET.md` - Vue complète
- ✅ `docs/MVP_PHASE1_API.md` - API reference
- ✅ `docs/MVP_PHASE1_SETUP.md` - Setup guide

### Code (À Comprendre)
- ✅ `backend/src/app.py` - Flask factory
- ✅ `frontend/src/App.jsx` - React routing
- ✅ `.env.docker` - Configuration
- ✅ `docker-compose.yml` - Infrastructure

### Tests (À Lancer)
- ✅ `backend/tests/test_biens.py` - 7 tests
- ✅ `backend/tests/test_estimations.py` - 8 tests
- ✅ Commande: `pytest backend/tests/`

---

## 🚦 Status

| Composant | Status | Notes |
|-----------|--------|-------|
| Backend | ✅ OK | 9 endpoints, tests complets |
| Frontend | ✅ OK | Auth pages intégrées |
| Database | ✅ OK | PostgreSQL, migrations prêtes |
| Tests | ✅ OK | 15 unit tests |
| Docs | ✅ OK | 3 fichiers essentiels |
| Production | ✅ READY | Docker prêt, config needed |

---

## 📞 Besoin d'aide?

### Erreurs de déploiement
→ Voir [`docs/MVP_PHASE1_SETUP.md`](docs/MVP_PHASE1_SETUP.md) section "Dépannage"

### Erreurs API
→ Voir [`docs/MVP_PHASE1_API.md`](docs/MVP_PHASE1_API.md) section "Codes Erreurs"

### Comprendre l'architecture
→ Lire [`RECAPITULATIF_COMPLET.md`](RECAPITULATIF_COMPLET.md)

---

**Version:** 1.0.0 | **Status:** MVP Phase 1 ✅ | **Prêt pour:** Production
