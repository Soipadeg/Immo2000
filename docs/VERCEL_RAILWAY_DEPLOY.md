# 🚀 Railway & Vercel Deployment Guide

## 📋 Prérequis

### Base de Données PostgreSQL sur Railway
1. Va sur: https://railway.app
2. Create project → Add PostgreSQL
3. Railway va créer automatiquement: `DATABASE_URL`

### Redis Cache sur Railway
1. Create project → Add Redis
2. Railway va créer automatiquement: `REDIS_URL`

---

## 🔧 Configuration Railway (Backend)

### Étape 1: Créer un projet Railway
```bash
# Depuis le repo
railway init

# Ou directement sur https://railway.app
# Create project → Deploy from GitHub
```

### Étape 2: Ajouter les services
- **PostgreSQL** - Base de données
- **Redis** - Cache/Sessions

### Étape 3: Configurer les variables d'env

| Variable | Valeur | Obtenu de |
|----------|--------|----------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL service |
| `REDIS_URL` | `redis://...` | Redis service |
| `SECRET_KEY` | Générer une clé sécurisée | À définir |
| `JWT_SECRET` | Clé JWT | À définir |
| `FLASK_ENV` | `production` | Défaut |

**Pour générer les clés:**
```bash
# SECRET_KEY (32 caractères aléatoires)
openssl rand -hex 16

# JWT_SECRET
openssl rand -hex 16
```

### Étape 4: Déployer

Railway va:
1. Lire `railway.json` → Build avec pip install
2. Lancer `alembic upgrade head` → Migration BD
3. Lancer `start.sh` → Uvicorn FastAPI

**Vérifier:**
```bash
# Check health
curl https://your-railway-app.railway.app/api/v1/health
```

---

## 🎨 Configuration Vercel (Frontend)

### Étape 1: Créer un projet Vercel
```bash
# Depuis le repo frontend
npx vercel

# Ou directement sur https://vercel.com
# Import GitHub project
```

### Étape 2: Configuration
- Framework: React (auto-détecté)
- Build Command: `npm run build` ✓ (déjà dans vercel.json)
- Output Directory: `frontend/dist` ✓ (déjà dans vercel.json)

### Étape 3: Configurer les variables d'env frontend

**Variables Vercel importantes:**
```bash
VITE_API_URL=https://your-railway-app.railway.app/api/v1
VITE_GOOGLE_OAUTH_CLIENT_ID=xxxxx
```

### Étape 4: Déployer

Vercel va:
1. Lancer `npm install`
2. Lancer `npm run build` (Vite)
3. Héberger sur le CDN Vercel

**Vérifier:**
```bash
# Devrait charger le site
https://your-vercel-app.vercel.app
```

---

## 🔗 Connecter Frontend ↔ Backend

### Frontend doit appeler Backend

**Dans frontend/.env ou variables Vercel:**
```bash
VITE_API_URL=https://your-railway-backend.railway.app/api/v1
```

**Dans le code (vérifier):**
```javascript
// frontend/src/api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
```

---

## ✅ Checklist Déploiement

### Railway (Backend)
- [ ] Projet Railway créé
- [ ] PostgreSQL ajouté
- [ ] Redis ajouté
- [ ] DATABASE_URL configurée
- [ ] REDIS_URL configurée
- [ ] SECRET_KEY configurée
- [ ] JWT_SECRET configurée
- [ ] Déploiement lancé
- [ ] Health check ✅

### Vercel (Frontend)
- [ ] Projet Vercel créé
- [ ] GitHub connecté
- [ ] VITE_API_URL pointant vers Railway
- [ ] Déploiement lancé
- [ ] Site chargé ✅

---

## 🆘 Troubleshooting

### Railway échoue au build
```
❌ "pip install failed"
→ Vérifier backend/requirements.txt existe
→ Vérifier qu'il n'y a pas de dépendances incompatibles Python 3.11
```

### Railway échoue au démarrage
```
❌ "ModuleNotFoundError: No module named 'src'"
→ Vérifier que backend/ a le dossier src/
→ Vérifier start.sh pointe vers bon chemin
```

### Vercel échoue au build
```
❌ "npm run build failed"
→ Vérifier npm run build fonctionne en local
→ Vérifier frontend/package.json a tous les scripts
```

### API ne répond pas
```
❌ "CORS error" ou "Cannot reach backend"
→ Vérifier VITE_API_URL est correct dans Vercel
→ Vérifier /api/v1/health fonctionne sur Railway
→ Vérifier CORS configuré dans src/main.py
```

---

## 📊 Architecture Production

```
                    Utilisateur
                         ↓
         ┌────────────────┴────────────────┐
         ↓                                  ↓
    Vercel Frontend                  Railway Backend
    (React App)                      (FastAPI)
         ↓                                  ↓
    CDN Global                       PostgreSQL
                                          +
                                       Redis
```

---

## 🚀 Commandes Utiles

```bash
# Tester localement avant de déployer
docker-compose up -d

# Build frontend
cd frontend
npm run build

# Build backend Docker
docker build -f Dockerfile.backend -t immo2000-backend .

# Vérifier migrations
cd backend
alembic upgrade head --sql
```

---

**Status**: 📋 Guide complet pour Vercel + Railway
**Créé**: 2026-06-30
**Prêt**: Quand tu veux déployer!
