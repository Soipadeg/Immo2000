# 🚀 Setup Immo2000 - MVP Phase 1

**Dernière mise à jour:** Mai 2026
**Statut:** ✅ Production Ready

---

## 📋 Prérequis

- **Docker:** v20.10+
- **Docker Compose:** v2.0+
- **Git:** v2.30+
- **Node.js:** v18+ (si développement frontend sans Docker)
- **Python:** v3.12+ (si développement backend sans Docker)

---

## 🎯 Démarrage Rapide (Docker - Recommandé)

### 1. **Cloner le projet**

```bash
git clone <repo-url> Immo2000
cd Immo2000
```

### 2. **Configurer les variables d'environnement**

```bash
# Copier le fichier .env.docker (déjà présent)
# Vérifier les clés importantes:
cat .env.docker | grep -E "MELO_API_KEY|SECRET_KEY|DATABASE_URL"
```

**Fichier `.env.docker`** (déjà prêt):
```env
# Database
DATABASE_URL=postgresql://immo2000:immo2000@postgres:5432/immo2000

# JWT
SECRET_KEY=your-secret-key-here
JWT_EXPIRATION_HOURS=24

# Melo API
MELO_API_KEY=your-melo-api-key
MELO_API_URL=https://api.melo.com

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Environment
FLASK_ENV=development
```

### 3. **Lancer l'application (Docker Compose)**

```bash
# Démarrer tous les services
docker-compose --env-file .env.docker up --build

# Ou sans rebuild
docker-compose --env-file .env.docker up

# En arrière-plan
docker-compose --env-file .env.docker up -d
```

**Services démarrés:**
- 🗄️ **PostgreSQL** (port 5432)
- 🐍 **Backend Flask** (port 5000)
- ⚛️ **Frontend React** (port 3000)

### 4. **Accéder à l'application**

| Service | URL | Authentification |
|---------|-----|------------------|
| 🌐 Frontend | http://localhost:3000 | ❌ Non requise (redirige vers /login) |
| 🔌 API Backend | http://localhost:5000 | ✅ JWT Bearer |
| 🗄️ Database | localhost:5432 | ✅ immo2000:immo2000 |

### 5. **Arrêter l'application**

```bash
docker-compose --env-file .env.docker down
```

---

## 🛠️ Développement Local (Sans Docker)

### Backend (Python/Flask)

#### 1. **Setup l'environnement**

```bash
cd backend

# Créer venv
python3.12 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Installer dépendances
pip install -r requirements.txt
```

#### 2. **Variables d'environnement**

```bash
# Créer .env dans backend/
cat > .env << 'EOF'
FLASK_ENV=development
FLASK_APP=src/app.py
DATABASE_URL=postgresql://user:password@localhost:5432/immo2000
SECRET_KEY=dev-secret-key-change-in-production
MELO_API_KEY=your-melo-api-key
CORS_ORIGINS=http://localhost:3000
EOF
```

#### 3. **Migrer la base de données**

```bash
# Créer les tables
python3 << 'EOF'
from src.app import create_app
from src.models import db

app = create_app()
with app.app_context():
    db.create_all()
    print("✅ Base de données créée")
EOF
```

#### 4. **Lancer le serveur**

```bash
flask run
# ou
python -m flask run

# Sortie attendue:
# * Running on http://127.0.0.1:5000
```

### Frontend (React/Vite)

#### 1. **Setup l'environnement**

```bash
cd frontend

# Installer dépendances
npm install
```

#### 2. **Variables d'environnement**

```bash
# Créer .env dans frontend/
cat > .env << 'EOF'
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Immo2000
EOF
```

#### 3. **Lancer le serveur de développement**

```bash
npm run dev

# Sortie attendue:
#   ➜  Local:   http://localhost:3000/
```

---

## ✅ Vérifier l'Installation

### 1. **Backend - API Health**

```bash
curl http://localhost:5000/api/v1/biens -H "Authorization: Bearer test" 2>/dev/null | jq .
```

### 2. **Frontend - Page de login**

```bash
open http://localhost:3000/login
# ou
firefox http://localhost:3000/login
```

### 3. **Database - Connexion**

```bash
psql -h localhost -U immo2000 -d immo2000 -c "SELECT version();"
```

---

## 🧪 Tests

### Backend - Pytest

```bash
cd backend

# Lancer tous les tests
pytest

# Avec couverture
pytest --cov=src

# Teste spécifiques
pytest tests/test_biens.py -v
pytest tests/test_estimations.py -v
```

### Frontend - Vitest (optionnel pour MVP)

```bash
cd frontend

# Tests (si configurés)
npm run test
```

---

## 🔑 First Time Setup

### 1. **Créer un premier utilisateur**

#### Via API

```bash
# Registrer
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123",
    "prenom": "Admin",
    "nom": "User",
    "role": "agent"
  }'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123"
  }'
```

#### Via Frontend

1. Aller à http://localhost:3000/register
2. Remplir le formulaire
3. Cliquer "S'inscrire"
4. Redirection automatique vers login
5. Se connecter avec les credentials

### 2. **Créer des données de test**

```bash
cd backend

# Script de seed (à créer)
python scripts/seed_data.py
```

---

## 📊 Monitoring & Logs

### Docker - Voir les logs

```bash
# Tous les services
docker-compose --env-file .env.docker logs -f

# Service spécifique
docker-compose --env-file .env.docker logs -f backend
docker-compose --env-file .env.docker logs -f frontend
docker-compose --env-file .env.docker logs -f postgres

# Dernières 50 lignes
docker-compose --env-file .env.docker logs --tail=50
```

### Backend - Logs Flask

```bash
# Activé par défaut en FLASK_ENV=development
# Fichiers de logs (à créer):
tail -f backend/logs/app.log
```

---

## 🚨 Dépannage

### Problème: Port déjà utilisé

```bash
# Trouver le PID utilisant le port
lsof -i :5000
lsof -i :3000
lsof -i :5432

# Tuer le processus
kill -9 <PID>
```

### Problème: Base de données refuse la connexion

```bash
# Vérifier si PostgreSQL est en cours d'exécution
docker ps | grep postgres

# Redémarrer les services
docker-compose --env-file .env.docker restart postgres

# Recréer les volumes
docker-compose --env-file .env.docker down -v
docker-compose --env-file .env.docker up -d
```

### Problème: Frontend ne se connecte pas au backend

```bash
# Vérifier les headers CORS
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/v1/biens -v

# Vérifier VITE_API_URL
cat frontend/.env | grep VITE_API_URL

# Redémarrer frontend
docker-compose --env-file .env.docker restart frontend
```

### Problème: JWT token invalide

```bash
# Vérifier SECRET_KEY dans .env.docker
# Regénérer les tokens en se reconnectant
# Vérifier la validité du token: 24h par défaut
```

---

## 📦 Structure du Projet

```
Immo2000/
├── backend/                 # API Flask Python
│   ├── src/
│   │   ├── app.py          # Factory Flask
│   │   ├── models/         # SQLAlchemy ORM
│   │   │   ├── annonces.py
│   │   │   └── biens.py    # ✨ Nouveau
│   │   ├── routes/         # Blueprints
│   │   │   ├── biens.py    # ✨ Complété
│   │   │   └── estimations.py # ✨ Complété
│   │   ├── crud/           # Business logic
│   │   │   └── biens.py    # ✨ Nouveau
│   │   └── melo_api.py     # Intégration API
│   ├── tests/              # Pytest
│   │   ├── test_biens.py   # ✨ Nouveau
│   │   └── test_estimations.py # ✨ Nouveau
│   ├── requirements.txt    # Dépendances
│   └── pytest.ini         # Config tests
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── App.jsx        # ✨ Routes intégrées
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx     # ✨ Nouveau
│   │   │   └── RegisterPage.jsx  # ✨ Nouveau
│   │   ├── components/
│   │   └── services/
│   │       └── api.js     # API client
│   ├── package.json
│   └── vite.config.js
│
├── database/               # Migrations SQL
│   ├── migrations/
│   │   ├── 001_create_annonces_table.sql
│   │   ├── 002_add_state_tracking.sql
│   │   └── 003_create_biens_table.sql  # ✨ Nouveau
│   └── immo2000_schema.sql
│
├── docs/                   # Documentation
│   ├── MVP_PHASE1_API.md   # ✨ Cette API
│   ├── MVP_PHASE1_SETUP.md # ✨ Ce setup
│   └── ...autres docs
│
├── .env.docker            # Variables Docker
├── docker-compose.yml     # Orchestration
├── Dockerfile             # Backend image
├── vite.config.js        # Frontend build
└── README.md
```

---

## 🌐 Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)  │
│  :3000         │
└────────┬────────┘
         │ HTTP/JWT
┌────────▼────────┐
│   API Backend   │
│  (Flask)       │
│  :5000         │
└────────┬────────┘
         │ SQL
┌────────▼────────┐
│   PostgreSQL    │
│   :5432        │
└─────────────────┘
```

---

## 📞 Support & Ressources

### Documentation
- [API Reference](./MVP_PHASE1_API.md) - Endpoints disponibles
- [Architecture](../docs/ARCHITECTURE.md) - Design global
- [Tests](../backend/tests/) - Exemples de test

### Outils Externes
- **Melo API:** https://api.melo.com/docs
- **Material-UI:** https://mui.com/
- **Flask:** https://flask.palletsprojects.com/
- **React:** https://react.dev/

### Contacts
- **Backend Issues:** Backend logs dans `docker-compose logs backend`
- **Frontend Issues:** Frontend logs dans navigateur (F12)
- **Database Issues:** `docker-compose logs postgres`

---

## ✨ Prochaines Étapes (Phase 2)

- [ ] Créer dashboard complet vendeur
- [ ] Implémenter recherche avancée
- [ ] Ajouter système de notifications
- [ ] Créer dashboard agent admin
- [ ] Implémenter system de favoris
- [ ] Ajouter upload d'images pour biens

---

**Version:** 1.0.0 | **Statut:** MVP Phase 1 | **Auteur:** GitHub Copilot
**Dernière révision:** Mai 2026
