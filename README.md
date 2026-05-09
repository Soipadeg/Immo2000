# Immo2000 - Plateforme Immobilière

**MVP Phase 2 - Production Ready**

Plateforme immobilière complète avec API Flask, authentification JWT, gestion de biens, visites, feedbacks, et intégrations avancées (Melo API, Chatbot IA).

---

## 🚀 Quick Start

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

```
Immo2000/
├── README.md                      ← Vous êtes ici
├── docs/                          ← 📚 DOCUMENTATION COMPLÈTE
│   ├── README.md                  ← Point de départ
│   ├── start/                     ← Guides d'onboarding
│   ├── guides/                    ← Tutoriels & feuilles de route
│   ├── tests/                     ← Rapports de tests
│   ├── core/                      ← Features principales
│   ├── advanced/                  ← Features avancées
│   └── ...
├── backend/                       ← API Flask
├── frontend/                      ← App React
├── database/                      ← Schémas SQL
├── devops/                        ← Config Docker/Nginx
└── docker-compose.yml
```

---

## 🤝 Contribution

1. Clonez le repo
2. Consultez [docs/start/NAVIGATION.md](docs/start/NAVIGATION.md)
3. Suivez [docs/guides/DEVELOPMENT_ROADMAP.md](docs/guides/DEVELOPMENT_ROADMAP.md)
4. Lancez les tests avant de committer

---

## 📞 Support

- 📖 **Documentation**: [docs/README.md](docs/README.md)
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions

---

**Dernière mise à jour:** Mai 2026 | **Status**: Production Ready (MVP 2.0+)

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
