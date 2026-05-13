# Immo2000 - Plateforme Immobilière

**MVP Phase 2 - Production Ready**

Plateforme immobilière complète avec API Flask, authentification JWT, gestion de biens, visites, feedbacks, et intégrations avancées (Melo API, Chatbot IA).

---

## 🚀 Quick Start

### 📍 Pour le Développement: 4 URLs sans authentification
👉 **[Consultez DEV_MODE.md](DEV_MODE.md)** pour tester rapidement avec 4 rôles différents:
- [http://localhost:3000/dev/visiteur](http://localhost:3000/dev/visiteur) → Interface visiteur
- [http://localhost:3000/dev/user](http://localhost:3000/dev/user) → Dashboard utilisateur
- [http://localhost:3000/dev/admin](http://localhost:3000/dev/admin) → Panel administrateur
- [http://localhost:3000/dev/notaire](http://localhost:3000/dev/notaire) → Dashboard notaire

### Option 1: Docker (Recommandé)
```bash
docker-compose --env-file .env.docker up --build
```

### Option 2: Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
python run_server.py

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

---

## 📚 Documentation

👉 **[Consultez la documentation complète →](docs/README.md)**

| Besoin | Lien |
|--------|------|
| **Commencer rapidement** | [docs/start/](docs/start/) |
| **Guide de navigation** | [docs/start/NAVIGATION.md](docs/start/NAVIGATION.md) |
| **Feuille de route dev** | [docs/guides/DEVELOPMENT_ROADMAP.md](docs/guides/DEVELOPMENT_ROADMAP.md) |
| **API Reference** | [docs/core/](docs/core/) & [docs/advanced/](docs/advanced/) |
| **Tests** | [docs/tests/TEST_REPORT.md](docs/tests/TEST_REPORT.md) |

---

## ✨ Fonctionnalités

### 🏗️ Core
- ✅ Authentification JWT (acheteur/vendeur/agent)
- ✅ Gestion des annonces et biens
- ✅ Système de visites avec feedback
- ✅ Estimations Melo API
- ✅ Recommandations intelligentes

### ⚡ Advanced
- ✅ Chatbot IA
- ✅ Notifications par email
- ✅ Simulateur de prêt
- ✅ FAQ avec recherche
- ✅ Upload optimisé d'images

### 🗄️ Infrastructure
- ✅ Flask + SQLAlchemy
- ✅ PostgreSQL 15
- ✅ React 18 + Material-UI
- ✅ Docker & Docker Compose
- ✅ JWT tokens + security headers

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Backend** | Python 3.11, Flask 3.0, SQLAlchemy 2.0 |
| **Frontend** | React 18.2, Vite 4.4, Material-UI 5.14 |
| **Database** | PostgreSQL 15, Redis (cache) |
| **Infrastructure** | Docker, Docker Compose, Nginx |
| **API** | REST, JWT Auth, Swagger/OpenAPI |

---

## 📁 Structure du Projet

### 🏠 Racine (Essentiel uniquement)
```
Immo2000/
├── README.md                      ← Vous êtes ici
├── vercel.json                    ← Config Vercel
├── docker-compose.yml             ← Orchestration
├── Dockerfile                     ← Image backend
├── Dockerfile.frontend            ← Image frontend
├── .env                           ← Variables locales
├── .env.docker                    ← Variables Docker
├── .dockerignore                  ← Exclusions Docker
├── .gitignore                     ← Exclusions Git
│
├── docs/                          ← 📚 DOCUMENTATION COMPLÈTE
│   ├── README.md                  ← Point de départ
│   ├── start/                     ← Guides d'onboarding
│   ├── guides/                    ← Tutoriels & feuilles de route
│   ├── tests/                     ← Rapports de tests
│   ├── core/                      ← Features principales
│   ├── advanced/                  ← Features avancées
│   └── ...
├── backend/                       ← API Flask (models, routes, services)
├── frontend/                      ← App React/Vite
├── database/                      ← Schémas SQL & migrations
├── devops/                        ← Config Nginx/Docker
├── static/                        ← Assets & templates HTML
├── scripts/                       ← Scripts d'initialisation
├── examples/                      ← Fichiers d'exemple (biens, data)
├── logs/                          ← Logs applicatifs
├── .venv/                         ← Virtual environment Python
│
├── _archived_docs/                ← 📦 Docs anciennes (legacy)
│   ├── CODE_REVIEW_MAIN.md
│   ├── FEATURES_COMPLETE.md
│   ├── GITHUB_SETUP.md
│   ├── PRESENTATION.md
│   └── STRUCTURE.md
└── .git/                          ← Repository Git
```

---

## 🗂️ Guides Rapides par Besoin

| Besoin | Aller à | Fichier |
|--------|---------|---------|
| **Démarrer** | `docs/start/` | [QUICKSTART.md](docs/start/QUICKSTART.md) |
| **Architecture** | `docs/core/` | [Architecture.md](docs/core/) |
| **Modèle Utilisateur Unifié** ✨ | `docs/architecture/` | [UNIFIED_USER_MODEL.md](docs/architecture/UNIFIED_USER_MODEL.md) |
| **API Reference** | `docs/reference/` | [API.md](docs/reference/) |
| **Authentification** | `docs/auth/` | [JWT_REFERENCE.md](docs/auth/) |
| **Matching Algorithm** | `docs/advanced/` | [MATCHING.md](docs/advanced/MATCHING.md) |
| **Tests** | `docs/tests/` | [TEST_REPORT.md](docs/tests/) |
| **Exemples** | `examples/` | [biens_exemple.json](examples/) |
| **Initialisation** | `scripts/` | [setup.sh](scripts/) |
| **Notaire System** | `docs/` | [NOTAIRE_SYSTEM.md](docs/NOTAIRE_SYSTEM.md) |

---

## 🔄 Organisation Actuelle

**Nettoyage mai 2026:**
- ✅ Racine: seulement fichiers essentiels (configs, README, Docker)
- ✅ Scripts: tous les fichiers `.py` d'initialisation en `scripts/`
- ✅ Exemples: données de test en `examples/`
- ✅ Archives: anciennes docs en `_archived_docs/`
- ✅ Pas de doublons ni redondances

---

## 🤝 Contribution

1. Clonez le repo
2. Consultez [docs/start/](docs/start/)
3. Lancez les tests avant de committer
4. Créez une PR vers `main`

---

## 📞 Support

- 📖 **Documentation**: [docs/README.md](docs/README.md)
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions

---

**Dernière mise à jour:** Mai 2026 | **Status**: Production Ready (MVP 5.0)

---

**Pour commencer** : [Lire docs/auth/QUICKSTART_AUTH.md](docs/auth/QUICKSTART_AUTH.md)
