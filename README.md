# Immo2000 - Plateforme Immobilière

**MVP Phase 1 - Production Ready**

Plateforme immobilière complète avec API Flask, authentification JWT, gestion de biens et intégration Melo API.

---

## 🎯 Commencer

👉 **[Lire INDEX.md en premier](INDEX.md)** - Guide de navigation complet

---

## 📚 Documentation Essentielle

| Besoin | Fichier |
|--------|---------|
| **Utiliser l'API** | [docs/MVP_PHASE1_API.md](docs/MVP_PHASE1_API.md) |
| **Lancer l'application** | [docs/MVP_PHASE1_SETUP.md](docs/MVP_PHASE1_SETUP.md) |
| **Vue d'ensemble projet** | [RECAPITULATIF_COMPLET.md](RECAPITULATIF_COMPLET.md) |
| **Architecture système** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Déploiement** | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

---

## 🚀 Quick Start (Docker)

```bash
docker-compose --env-file .env.docker up --build

# Ensuite:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Créer un compte → Utiliser l'API
```

👉 Pour plus de détails: [docs/MVP_PHASE1_SETUP.md](docs/MVP_PHASE1_SETUP.md)

---

## 📦 Contenu du Projet

### Backend (Flask)
- ✅ 9 endpoints (auth + biens + estimations)
- ✅ JWT authentication
- ✅ Role-based access (acheteur/vendeur/agent)
- ✅ SQLAlchemy ORM
- ✅ 15 unit tests

### Frontend (React)
- ✅ Login/Register pages
- ✅ Protected routing
- ✅ Material-UI design
- ✅ JWT token management

### Database (PostgreSQL)
- ✅ 3 tables (utilisateurs, annonces, biens)
- ✅ SQL migrations
- ✅ Indexes optimisés

### Documentation
**4 fichiers essentiels:**
1. `INDEX.md` - Guide de navigation (COMMENCER ICI)
2. `docs/MVP_PHASE1_API.md` - Référence API complète
3. `docs/MVP_PHASE1_SETUP.md` - Guide de déploiement
4. `RECAPITULATIF_COMPLET.md` - Vue d'ensemble projet

---

## 🎯 Points d'Entrée
| Audit & Validation | [docs/AUDIT.md](docs/AUDIT.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Authentification JWT | [docs/auth/](docs/auth/) |
| Setup complet | [docs/setup/](docs/setup/) |

---

## Configuration

### 1. Clé API Melo

Copiez le fichier `.env.example` en `.env` et complétez votre clé API :

```bash
cp .env.example .env
```

Puis éditez `.env` :

```env
MELO_API_KEY=votre_cle_api_ici
```

Obtenir votre clé : https://www.melo.io/api

### 2. Dépendances

```bash
cd backend
pip install -r requirements.txt
```

---

## Utilisation Melo API

### Mode 1 : Estimation unique

```bash
python melo_api.py single \
  --adresse "123 Rue de Paris, 75000 Paris" \
  --surface 50 \
  --type appartement
```

### Mode 2 : Comparaison de biens

```bash
python melo_api.py compare biens_exemple.json --output output
```

### Mode 3 : Utilisation dans du code Python

```python
from melo_api import get_estimation_melo, compare_biens

result = get_estimation_melo(
    adresse="123 Rue de Paris, 75000 Paris",
    surface=50,
    type_bien="appartement"
)
```

---

## Structure du Projet

```
Immo2000/
├── README.md (vous êtes ici)
├── STRUCTURE.md
├── docs/                          <- DOCUMENTATION RÉORGANISÉE
│   ├── INDEX.md                  <- Point d'entrée principal
│   ├── ARCHITECTURE.md
│   ├── auth/                     <- Authentification JWT
│   │   ├── INDEX.md
│   │   ├── QUICKSTART_AUTH.md
│   │   ├── INTEGRATION.md
│   │   ├── JWT_REFERENCE.md
│   │   ├── APP_CONFIGURATION.md
│   │   ├── DIAGRAMS.md
│   │   ├── RATE_LIMITING_GUIDE.md
│   │   ├── SUMMARY.md
│   │   ├── FINAL_SUMMARY.md
│   │   └── VERIFICATION_COMPLETE.sh
│   └── setup/
│       └── FULL_INTEGRATION_TEST.sh
├── backend/
│   ├── src/
│   │   ├── auth/                <- JWT authentication
│   │   ├── routes/              <- Protected routes
│   │   ├── app.py
│   │   └── config.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── database/
├── frontend/
└── devops/
```

---

## Status

- [x] Authentification JWT complète
- [x] Documentation exhaustive (9 guides)
- [x] Tests (20+ cas)
- [ ] Modèles Bien & Estimation
- [ ] Rate limiting (optionnel)

---

## Notes de Réorganisation (2026-05-04)

La documentation a été réorganisée pour une meilleure maintenabilité :

**Avant** : 9 fichiers `.md` à la racine (trop de désordre)
**Après** : Tous les guides dans `docs/auth/` avec navigation claire

Les fichiers suivants ont été déplacés :
- `QUICKSTART_AUTH.md` → `docs/auth/QUICKSTART_AUTH.md`
- `AUTHENTICATION.md` → `docs/auth/JWT_REFERENCE.md`
- `AUTHENTICATION_DIAGRAMS.md` → `docs/auth/DIAGRAMS.md`
- `AUTH_SUMMARY.md` → `docs/auth/SUMMARY.md`
- `INTEGRATION_CHECKLIST_AUTH.md` → `docs/auth/INTEGRATION.md`
- `INTEGRATION_APP_FACTORY.md` → `docs/auth/APP_CONFIGURATION.md`
- `RATE_LIMITING_GUIDE.md` → `docs/auth/RATE_LIMITING_GUIDE.md`
- `FINAL_INTEGRATION_SUMMARY.md` → `docs/auth/FINAL_SUMMARY.md`
- `VERIFICATION_COMPLETE.sh` → `docs/auth/VERIFICATION_COMPLETE.sh`
- `FULL_INTEGRATION_TEST.sh` → `docs/setup/FULL_INTEGRATION_TEST.sh`

Les anciens fichiers à la racine peuvent être supprimés (voir MIGRATION_NOTES.md)

---

**Pour commencer** : [Lire docs/auth/QUICKSTART_AUTH.md](docs/auth/QUICKSTART_AUTH.md)
