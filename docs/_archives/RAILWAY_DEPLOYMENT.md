# 🚀 Railway.app Backend Deployment Guide

## Déploiement Production Immo2000 Backend

### Prérequis
- [ ] Compte Railway.app (GitHub OAuth)
- [ ] Accès à ce repo
- [ ] Frontend sur Vercel (URL: https://immo2000.vercel.app)

---

## 1️⃣ Créer le projet Railway

1. Aller sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Sélectionner le repo `Soipadeg/Immo2000`
4. Sélectionner la branche `main`
5. Railway détectera automatiquement le `Dockerfile.backend`

---

## 2️⃣ Ajouter PostgreSQL

```bash
New → Add Service → PostgreSQL
```

Railway créera automatiquement `DATABASE_URL` en variable d'environnement

---

## 3️⃣ Configurer les Variables d'Environnement

Dans Railway Dashboard:
1. Aller dans **Variables** du service backend
2. Copier le contenu de `.env.production.example`
3. Remplir les valeurs réelles:

```env
JWT_SECRET=<random-key-64-chars>
YOUSIGN_API_KEY=<your-key>
DOCUSIGN_INTEGRATION_KEY=<your-key>
STRIPE_SECRET_KEY=sk_live_...
SENTRY_DSN=<your-sentry-url>
```

**Important:** Railway injecte automatiquement `DATABASE_URL` via PostgreSQL

---

## 4️⃣ Déploiement

### Automatique (Recommandé)
```bash
git push origin main
```
→ Railway redéploiera automatiquement

### Manuel
```bash
cd /home/djali/code/Soipadeg/Immo2000
git push origin main
```

### Vérifier le déploiement
1. Rail way Dashboard → View Logs
2. Attendre: `🚀 Démarrage de Immo2000 Backend`
3. Copier l'URL: `https://backend-xxx.railway.app`

---

## 5️⃣ Obtenir l'URL Backend

```bash
# Dans Railway Dashboard
Service: backend
Domain: https://backend-xxx.railway.app
```

**Note:** Railway génère un domaine automatiquement, ou connecte un custom domain

---

## 6️⃣ Connecter Vercel Frontend

Ajouter à Vercel (Dashboard → Settings → Environment Variables):

```
VITE_API_URL=https://backend-xxx.railway.app/api/v1
```

Puis **Redeploy** depuis Vercel:
```bash
git push origin main
```
→ Vercel va rebuild avec le nouvel URL

---

## 7️⃣ Tests Post-Déploiement

```bash
# Health check
curl https://backend-xxx.railway.app/health

# API test
curl https://backend-xxx.railway.app/api/v1/offres \
  -H "Authorization: Bearer <token>"
```

---

## 🔍 Monitoring

Railway Dashboard:
- **Logs** → Voir les erreurs en temps réel
- **Metrics** → CPU, RAM, Database
- **Alertes** → Configurer notifications

---

## 🚨 Troubleshooting

### Build échoue
```bash
railway logs --service backend
```

### App crash après deploy
1. Vérifier la `DATABASE_URL` (should start with `postgresql://`)
2. Vérifier que toutes les migrations sont passées
3. Vérifier les dépendances manquantes dans `requirements.txt`

### Database vide
```bash
# SSH dans Railway et lancer les migrations
flask db upgrade
python seed_database.py
```

---

## 📋 Checklist Final

- [ ] PostgreSQL ajouté et DATABASE_URL présent
- [ ] Variables d'environnement remplies
- [ ] Frontend URL dans `CORS_ORIGINS`
- [ ] Build réussit dans Railway logs
- [ ] Health check répond (`/health`)
- [ ] API endpoints répondent
- [ ] Vercel a le nouvel `VITE_API_URL`
- [ ] Frontend et Backend communiquent
- [ ] Logs monitoring configurés

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Backend Logs: `railway logs --service backend`
- Database Logs: `railway logs --service postgresql`
