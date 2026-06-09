# 📁 Structure du Projet Immo2000

## 🌳 Hiérarchie Complète

```
Immo2000/
│
├── 📖 DOCUMENTATION (À consulter)
│   ├── README.md                    ← Point de départ
│   ├── docs/                        ← Guide complet
│   │   ├── start/                   ← Guides de démarrage
│   │   ├── guides/                  ← Tutoriels
│   │   ├── core/                    ← Features principales
│   │   ├── advanced/                ← Features avancées
│   │   └── tests/                   ← Rapports de tests
│   └── .archive/                    ← Historique des phases
│       └── phase-reports/           ← Rapports archivés
│
├── 🔧 CONFIGURATION (Essentiels)
│   ├── package.json                 ← Scripts root
│   ├── vercel.json                  ← Deploy Vercel
│   ├── .env                         ← Config local
│   ├── .env.docker                  ← Config Docker
│   ├── .env.production.example      ← Template prod
│   └── .gitignore                   ← Exclusions Git
│
├── 🐳 INFRASTRUCTURE (Déploiement)
│   ├── Dockerfile                   ← Build backend
│   ├── Dockerfile.backend           ← Backend optimisé
│   ├── Dockerfile.frontend          ← Frontend optimisé
│   ├── docker-compose.yml           ← Dev orchestration
│   ├── docker-compose-prod.yml      ← Prod orchestration
│   └── devops/                      ← Config Nginx/Prometheus
│       ├── nginx.conf
│       ├── nginx-prod.conf
│       ├── prometheus.yml
│       └── alert_rules.yml
│
├── 💻 BACKEND (Python Flask)
│   ├── run_server.py                ← Entry point
│   ├── requirements.txt              ← Dependencies
│   ├── conftest.py                  ← Pytest config
│   ├── app_fastapi/                 ← Routes principales
│   ├── backend/                     ← Models & services
│   ├── src/                         ← Advanced features
│   │   ├── routes/                  ← API endpoints
│   │   ├── models/                  ← DB models
│   │   ├── services/                ← Business logic
│   │   └── security/                ← Auth & security
│   ├── tests/                       ← Test suite
│   ├── migrations/                  ← DB migrations
│   └── scripts/                     ← Utilitaires
│
├── ⚛️ FRONTEND (React + Vite)
│   ├── package.json                 ← Dependencies
│   ├── vite.config.js               ← Build config
│   ├── public/                      ← Static assets
│   ├── src/
│   │   ├── App.jsx                  ← Root component
│   │   ├── index.jsx                ← Entry point
│   │   ├── pages/                   ← Pages (14+)
│   │   ├── components/              ← Components (42+)
│   │   ├── hooks/                   ← Custom hooks (13+)
│   │   ├── styles/                  ← CSS (30+ files)
│   │   ├── services/                ← API client
│   │   └── store/                   ← Zustand store
│   └── dist/                        ← Build output (gitignored)
│
├── 🗄️ DATABASE
│   ├── immo2000_schema.sql          ← Schema complet
│   ├── migrations/                  ← Alembic migrations
│   └── create_*.sql                 ← Scripts setup
│
├── 📚 SCRIPTS & TOOLS
│   ├── scripts/                     ← Setup scripts
│   │   ├── init_db.py
│   │   ├── seed_database.py
│   │   └── etc.
│   ├── tools/                       ← Outils utiles
│   └── static/                      ← Templates HTML
│
└── .venv/                           ← Virtual env (gitignored)
```

## 📍 Chemins Importants

| Besoin | Chemin |
|--------|--------|
| **Lancer en dev** | `backend/run_server.py` + `frontend/npm run dev` |
| **Endpoints API** | `backend/app_fastapi/` |
| **Pages UI** | `frontend/src/pages/` |
| **Composants réutilisables** | `frontend/src/components/` |
| **Styles BEM** | `frontend/src/styles/` |
| **Hooks personnalisés** | `frontend/src/hooks/` |
| **Tests Backend** | `backend/tests/` |
| **Configuration infra** | `devops/` |
| **Docs utilisateur** | `docs/` |

## 🎯 Fichiers à NE PAS modifier à la racine

- `.git/` - Repository
- `.venv/` - Virtual environment
- `.github/` - GitHub workflows
- `.vscode/` - IDE config
- `.archive/` - Historique archivé

## 📝 Conventions

### 📄 Fichiers .md à la racine
- ✅ `README.md` → Nécessaire
- ❌ Autres `.md` → Voir `.archive/phase-reports/`

### 📦 Dépendances
- Backend: `requirements.txt` (racine backend/)
- Frontend: `package.json` (racine frontend/)
- Root: `package.json` (pour scripts globaux)

### 🔐 Configuration
- `.env` → Local development
- `.env.docker` → Docker local
- `.env.production.example` → Template pour prod
- **JAMAIS commiter `.env` réel!**

## 🚀 Pour démarrer

```bash
# Dev classique
cd backend && python run_server.py &
cd frontend && npm run dev &

# Docker
docker-compose up --build

# Prod
docker-compose -f docker-compose-prod.yml up
```

## 📖 Documentation

- **Utilisateurs**: `docs/start/`
- **Développeurs**: `docs/guides/`
- **Features**: `docs/core/` et `docs/advanced/`
- **Tests**: `docs/tests/`
- **Historique**: `.archive/phase-reports/`
