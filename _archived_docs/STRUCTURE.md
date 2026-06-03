# 📁 Structure du projet Immo2000

## Vue d'ensemble complète

```
Immo2000/
├── backend/                        # 🔧 API Backend (Flask)
│   ├── src/
│   │   ├── __init__.py
│   │   ├── app.py                 ✅ Application Flask
│   │   ├── config.py              ✅ Configuration centralisée
│   │   ├── melo_api.py            ✅ API Melo (corrigée & améliorée)
│   │   ├── models/                📋 Modèles (Bien, User, Estimation)
│   │   ├── routes/                📋 Routes API (CRUD)
│   │   ├── services/              📋 Services métier
│   │   └── utils/                 📋 Utilitaires & décorateurs
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_melo_api.py       ✅ Tests améliorés
│   ├── .env.example               ✅ Variables d'environnement
│   ├── .flake8                    ✅ Configuration linting
│   ├── requirements.txt           ✅ Dépendances Python
│   ├── pytest.ini                 ✅ Configuration tests
│   └── README.md                  ✅ Documentation backend
│
├── frontend/                       # 🎨 Application Frontend
│   └── README.md                  ✅ Guide intégration React/Vue
│
├── devops/                         # 🐳 Infrastructure & Déploiement
│   ├── Dockerfile.backend         ✅ Container backend
│   ├── docker-compose.yml         ✅ Orchestration (Postgres, Redis, Nginx)
│   ├── nginx.conf                 ✅ Configuration Nginx
│   └── README.md                  ✅ Guide Docker & déploiement
│
├── docs/                           # 📚 Documentation
│   └── ARCHITECTURE.md            ✅ Architecture détaillée & schéma DB
│
├── .gitignore                     ✅ Fichiers ignorés
├── README.md                      ✅ Vue d'ensemble projet
├── STRUCTURE.md                   ✅ Ce fichier
└── INTEGRATION_GUIDE.md           📋 Guide intégration (ancien)
```

## 📊 Services & Technologies

| Composant | Technologie | Port | Status |
|-----------|-------------|------|--------|
| Backend | Flask + SQLAlchemy | 5000 | ✅ Partiellement |
| Frontend | React/Vue (à définir) | 3000 | 📋 À faire |
| Database | PostgreSQL 15 | 5432 | ✅ Docker |
| Cache | Redis 7 | 6379 | ✅ Docker |
| Proxy | Nginx | 80/443 | ✅ Docker |
| API Melo | Integration | - | ✅ Complète |

## 🔧 Améliorations apportées à melo_api.py

### ✅ Corrections & optimisations

1. **Type hints corrigés**
   - `any` → `Any` (import typing)
   - Tous les types explicites

2. **Configuration externalisée** (classe `MeloAPIConfig`)
   - Variables depuis `.env`
   - Pas de hardcoding
   - Configuration centralisée

3. **Cache avec TTL** (classe `CacheManager`)
   - Réduction des appels API
   - TTL configurable
   - Eviction automatique

4. **Retry logic automatique**
   - Exponential backoff
   - Gestion des erreurs 429, 50x
   - Résilience améliorée

5. **Métadonnées standardisées**
   - `status` dans `metadata` (cohérent)
   - Structure d'erreur normalisée

6. **Sessions HTTP optimisées**
   - Réutilisation des connexions
   - Connection pooling

7. **Tests améliorés**
   - Coverage ~85%
   - Mocking avancé
   - Tests de cache

## 📋 Backend Components à implémenter

```python
backend/src/

# Models
models/
├── bien.py              # Bien immobilier
├── utilisateur.py       # Utilisateur (Seller/Buyer)
├── estimation.py        # Estimations stockées
└── transaction.py       # Transactions P2P

# Routes
routes/
├── biens.py            # CRUD biens
├── estimations.py      # API Melo endpoints
├── utilisateurs.py     # Auth/Profile
└── transactions.py     # P2P transactions

# Services
services/
├── melo_service.py     # Wrapper Melo API
├── auth_service.py     # JWT authentication
└── estimation_service.py
```

## 🐳 Docker & DevOps

```bash
# Démarrer l'environnement complet
cd devops
docker-compose up -d

# Services disponibles :
# - Backend API      : http://localhost:5000
# - PostgreSQL       : localhost:5432
# - Redis            : localhost:6379
# - Nginx            : http://localhost:80
# - PgAdmin (opt)    : http://localhost:5050
```

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| [README.md](README.md) | Vue d'ensemble projet |
| [backend/README.md](backend/README.md) | API Flask & Melo |
| [devops/README.md](devops/README.md) | Docker & déploiement |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture complète |

## 🚀 Prochaines étapes

### Phase 1 : Backend core (semaine 1-2)
- [ ] Modèles SQLAlchemy
- [ ] Routes CRUD
- [ ] Authentication JWT
- [ ] Intégration Melo complète

### Phase 2 : Frontend (semaine 3-4)
- [ ] Setup React/Vue
- [ ] Estimation form
- [ ] Comparaison UI
- [ ] Integration API

### Phase 3 : Features (semaine 5-6)
- [ ] P2P messaging
- [ ] Transactions
- [ ] Notifications
- [ ] Analytics

### Phase 4 : DevOps & Production (semaine 7-8)
- [ ] CI/CD GitHub Actions
- [ ] Kubernetes config
- [ ] SSL/TLS setup
- [ ] Monitoring

---

**Créé** : 2026-05-04
**Version** : 1.0
**Responsable** : Backend + Frontend + DevOps
