# 🔧 Docker Build Fix - Railway Deployment

## ❌ Problème Identifié

**Erreur Railway:**
```
Deployment failed during the build process
Package 'wkhtmltopdf' has no installation candidate
```

**Cause:** La base image `python:3.12-slim` utilise Debian Trixie, qui ne contient pas le package `wkhtmltopdf`.

## ✅ Solution Appliquée

### Changement du Dockerfile.backend:
```dockerfile
# AVANT:
FROM python:3.12-slim

# APRÈS:
FROM python:3.12-bookworm
```

**Pourquoi?**
- `python:3.12-slim` → Debian Trixie (manque wkhtmltopdf)
- `python:3.12-bookworm` → Debian Bookworm (a wkhtmltopdf)

### Autres changements:
- Ajout de `libssl-dev` pour meilleur support SSL

## 🧪 Validation

Docker build **testé localement** et **succès** ✅

```bash
$ docker build -f Dockerfile.backend -t immo2000-backend:test .
Successfully installed ... (118 packages)
✓ Image créée: immo2000-backend:test (909feeb8c7b8)
```

## 📊 Changement Envoyé

Git commit:
```
57691b9 fix(docker): Change base image from trixie to bookworm for wkhtmltopdf support
```

Poussé vers GitHub → Railway va redéployer automatiquement

## 🚀 Prochaines Étapes

1. **Vérifier Railway:** https://railway.app/project/3db6680a-be97-46d8-b986-1852f92a03dd
2. **Attendre** redéploiement automatique (2-5 min)
3. **Vérifier les logs:** Railway Dashboard → View Logs
4. **Chercher:** `✅ Démarrage de Immo2000 Backend`

## 📋 État des Services

| Service | Status |
|---------|--------|
| **Frontend** | ✅ Live sur Vercel |
| **Backend** | 🔄 Redéploiement en cours |
| **Database** | ⏳ Attent backend |

## 💡 Aide Supplémentaire

Si le build échoue à nouveau:

```bash
# Vérifier les logs Railway
railway logs --service backend

# Ou vérifier localement
docker build -f Dockerfile.backend .
```

Les bases image disponibles pour Python:
- `python:3.12-slim` → Debian Trixie (lightweight)
- `python:3.12-bookworm` → Debian Bookworm (more packages)
- `python:3.12-bullseye` → Debian Bullseye (stable)

## ✨ Résumé

**Problème:** wkhtmltopdf manquant dans Debian Trixie
**Solution:** Changer vers Debian Bookworm
**Temps:** 5 min
**Statut:** ✅ Corrigé et repoussé vers GitHub
