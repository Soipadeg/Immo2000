# 🚂 Configuration Railway - Guide de Correction

**Problème**: Railway détectait Node.js au lieu de Python et cherchait un start script.
**Cause**: Présence de `package.json` à la racine (pour le frontend React).
**Solution**: Configuration explicite pour Railway avec Procfile, Dockerfile, et scripts.

---

## ✅ Fichiers de Configuration Créés

### 1. **Procfile** (Nouveau)
```
web: cd backend && uvicorn src.main:create_app --host 0.0.0.0 --port $PORT --workers 4
```
- Railway utilise ce fichier pour déterminer comment lancer l'application
- Spécifie de naviguer vers le répertoire backend et lancer Uvicorn

### 2. **Dockerfile** (Nouveau - à la racine)
```dockerfile
# Image Python multi-stage optimisée
FROM python:3.11-slim as builder
# ... build stage ...
FROM python:3.11-slim
# ... runtime stage ...
CMD ["uvicorn", "src.main:create_app", ...]
```
- Utilisé si Procfile n'est pas reconnu
- Multi-stage pour optimiser la taille de l'image (~ 200MB)

### 3. **railway.json** (Nouveau)
- Configuration explicite de Railway
- Spécifie buildCommand et startCommand

### 4. **.railwayignore** (Nouveau)
- Exclut les fichiers inutiles du build (frontend/, tests/, docs/, etc.)
- Réduit le temps de build et la taille du contexte

### 5. **package.json** (Modifié)
- Ajout d'un script `"start"` qui lance le backend FastAPI
- Fallback si Procfile n'est pas détecté

---

## 🔄 Comment Redéployer sur Railway

### Option 1: Via l'Interface Railway (Simple) ✅ RECOMMANDÉ

1. **Aller à Railway.app**
   - Ouvrir votre projet Immo2000

2. **Trigger un nouveau Build**
   - Aller dans Settings → Deployments
   - Cliquer sur "Trigger Deploy" ou redéployer depuis GitHub
   - Railway va maintenant détecter le Procfile

3. **Vérifier les Logs**
   ```
   ✓ Build log: "Procfile found"
   ✓ Runtime: Python (via Procfile)
   ✓ Build successful
   ```

4. **Tester l'API**
   ```bash
   curl https://yourdomain.railway.app/api/v1/health
   ```

### Option 2: Via Railway CLI (Local)

```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Login à Railway
railway login

# 3. Link votre projet
cd /home/djali/code/Soipadeg/Immo2000
railway link

# 4. Déployer
railway up

# 5. Voir les logs
railway logs
```

### Option 3: Force Push via Git

```bash
# 1. Commit et push les changements
git push origin main

# 2. Railway va détecter les changements et redéployer automatiquement
# Vérifier les logs dans l'interface Railway
```

---

## 🔍 Vérifier la Configuration Railway

Une fois le déploiement lancé, vous devriez voir:

```
✓ Detected: Procfile
✓ Build command: (default)
✓ Start command: cd backend && uvicorn src.main:create_app ...
✓ Runtime: Python
✓ Port: 8000
```

---

## 🛠️ Troubleshooting

### Problème 1: "No start command detected" (Revient)

**Solution A**: Activer le Dockerfile manuellement dans Railway
1. Settings → Builder → Dockerfile
2. Sélectionner: `./Dockerfile`

**Solution B**: Vérifier que Procfile est au bon endroit
```bash
ls -la /path/to/Immo2000/Procfile
# Doit afficher le fichier à la racine
```

### Problème 2: "Port 8000 not accessible"

**Solution**:
1. Vérifier que Railway expose le port 8000
2. Settings → Variables → Ajouter `PORT=8000`
3. Relancer le déploiement

### Problème 3: "Module not found" (Python import error)

**Solution**:
1. Vérifier que `backend/requirements.txt` est à jour
2. Installer les dépendances manquantes: `pip install -r backend/requirements.txt`
3. Committer et redéployer

### Problème 4: "Build takes too long" (> 5 mins)

**Solution**:
1. Railway télécharge les dépendances Python (normal 2-3 mins)
2. Vérifier que .railwayignore exclut frontend/ et tests/
3. Si toujours lent: contacter Railway support

---

## 🌍 Vérifier l'API en Production

Une fois deployé:

```bash
# 1. Health Check
curl https://yourdomain.railway.app/api/v1/health

# Résultat attendu:
# {
#   "status": "healthy",
#   "service": "immo2000-api",
#   "version": "6.0.0",
#   ...
# }

# 2. Test Authentication
curl -X POST https://yourdomain.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Voir les logs
# Railway: Settings → Deployments → Logs
```

---

## 📋 Checklist Post-Déploiement

- [ ] API répond sur `/api/v1/health`
- [ ] Build logs sont sans erreurs
- [ ] Variables d'environnement sont configurées:
  - [ ] `DATABASE_URL` (si externe)
  - [ ] `REDIS_URL` (si externe)
  - [ ] `SECRET_KEY` (générer une nouvelle)
  - [ ] `JWT_ALGORITHM=HS256`
  - [ ] `CORS_ALLOWED_ORIGINS=https://yourdomain.com`
- [ ] Base de données est accessible
- [ ] Redis cache est accessible
- [ ] Logs n'affichent pas d'erreurs critiques

---

## 🚀 Commandes Utiles Railway

```bash
# Se connecter à Railway
railway login

# Voir les variables d'environnement
railway variables

# Ajouter une variable
railway variables add SECRET_KEY="your_secret_here"

# Voir les logs en temps réel
railway logs -f

# Redéployer la branche actuelle
railway up

# Ouvrir le dashboard web
railway open

# Voir le statut du projet
railway status
```

---

## 📚 Ressources

- [Railway Docs - Python](https://docs.railway.app/guides/python)
- [Railway Docs - Procfile](https://docs.railway.app/deployment/procfile)
- [Railway Docs - Environment Variables](https://docs.railway.app/develop/variables)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## ✅ Statut

**Avant cette correction:**
```
✗ No start command detected
✗ Procfile not found
✗ Build failed
```

**Après cette correction:**
```
✓ Procfile créé
✓ Dockerfile à la racine
✓ railway.json configuré
✓ package.json avec "start" script
✓ .railwayignore optimisé
```

**Prochaine étape**: Redéployer via l'interface Railway ou `railway up`

---

**Créé**: 2026-06-08
**Commit**: 3fd3fc7
**Status**: 🚀 Prêt pour redéploiement
