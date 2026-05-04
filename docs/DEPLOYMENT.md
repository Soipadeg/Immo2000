# 🚀 DEPLOYMENT - Immo2000

Guide complet pour déployer Immo2000 en production.

---

## ⚡ Quick Start (15 minutes)

**Impatient?** Allez directement à:
1. [Backend Docker](#backend-docker-5-min)
2. [Frontend Vercel](#frontend-vercel-5-min)

---

## 📋 Configuration Pré-Déploiement

### Variables d'environnement

**Backend (.env.docker):**
```bash
DATABASE_URL=postgresql://user:password@postgres:5432/immo2000
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
FLASK_ENV=production
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Frontend (Vercel env):**
```
VITE_API_URL=https://api.immo2000.com/api/v1
```

---

## 🐳 Backend Docker (30 min)

### 1. Construire l'image

```bash
cd /home/djali/code/Soipadeg/Immo2000
docker-compose build
```

### 2. Démarrer les services

```bash
docker-compose up -d
```

### 3. Vérifier la santé

```bash
# Backend health
curl http://localhost:5000/health

# Expected output:
# {"status":"healthy","version":"1.0.0"}
```

### 4. Tester une requête API

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 5. Production Deployment

Pour AWS/Heroku/DigitalOcean:

```bash
# Option A: Push to Docker Hub
docker build -t yourusername/immo2000-backend:latest .
docker push yourusername/immo2000-backend:latest

# Option B: Deploy to Heroku
heroku create immo2000-backend
heroku config:set $(cat .env.docker | xargs)
git push heroku main

# Option C: Deploy to AWS ECR
aws ecr create-repository --repository-name immo2000-backend
docker tag immo2000-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/immo2000-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/immo2000-backend:latest
```

---

## ☁️ Frontend Vercel (10 min)

### 1. Créer compte Vercel

Allez à https://vercel.com/signup

### 2. Importer le repository

- Connectez votre GitHub
- Sélectionnez `/home/djali/code/Soipadeg/Immo2000`

### 3. Configuration Vercel

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Root Directory: frontend
```

### 4. Variables d'environnement

```
Production:
VITE_API_URL=https://api.immo2000.com/api/v1

Preview:
VITE_API_URL=https://staging-api.immo2000.com

Development:
VITE_API_URL=http://localhost:5000
```

### 5. Déployer

```bash
# Automatic deployment on git push
git push origin main

# Manual deployment
vercel --prod
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check passing
- [ ] Frontend loads without errors
- [ ] Login/Register flow works
- [ ] Dashboard displays correctly
- [ ] Search functionality works
- [ ] Email notifications configured
- [ ] Monitoring enabled
- [ ] Backups scheduled

---

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Frontend build fails

```bash
cd frontend
npm install
npm run build

# Check for errors
npm run build -- --verbose
```

### API URL not found

```bash
# Verify Vercel env vars
vercel env list

# Redeploy
vercel --prod --force
```

---

## 📚 Guides Détaillés

| Besoin | Fichier |
|--------|---------|
| Docker détaillé | `DOCKER_GUIDE.md` |
| Vercel détaillé | `VERCEL_GUIDE.md` |
| Production checklist | `DEPLOYMENT_GUIDE.md` |

---

## 📞 Support

- 🐳 Docker issues: `docker-compose logs [service]`
- ☁️ Vercel issues: Vercel Dashboard → Project → Deployments
- 🐛 Backend errors: Check `/backend/logs/`
- 🌐 Frontend errors: Browser DevTools Console

---

**Status:** ✅ Ready to deploy!

Voir [INDEX.md](INDEX.md) pour plus de documentation.
