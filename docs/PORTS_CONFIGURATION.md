# 📡 Configuration des Ports - Immo2000

## Vue d'ensemble
Listing complet de tous les ports utilisés dans l'application Immo2000 et ses services associés.

---

## 🐘 PostgreSQL Database
| Service | Port | Configuration | Statut |
|---------|------|---------------|--------|
| **PostgreSQL** | **5432** | `DB_PORT` | ✅ Actif |

**Détails:**
- Container: `immo2000_postgres`
- Variable d'env: `DB_PORT=5432` (par défaut)
- Localisation: `docker-compose.yml` ligne 16
- Base de données: `immo2000` (par défaut)
- User: `immo2000` (par défaut)

---

## 🚀 Backend API

### Flask (Production)
| Service | Port | Configuration | Statut |
|---------|------|---------------|--------|
| **Flask API** | **5000** | `API_PORT` | ✅ Actif (par défaut) |

**Détails:**
- Container: `immo2000_backend`
- Variable d'env: `API_PORT=5000` (par défaut)
- Localisation: `docker-compose.yml` ligne 61
- Commande: `flask run --host=0.0.0.0 --port=5000`
- Health check: `http://localhost:5000/health`
- Endpoint API: `http://localhost:5000/api/v1`

### FastAPI (Alternative)
| Service | Port | Configuration | Statut |
|---------|------|---------------|--------|
| **FastAPI API** | **8000** | Dockerfile défaut | ⚠️ Alternatif |

**Détails:**
- Dockerfile: `Dockerfile.fastapi`
- Port exposé: 8000
- Commande: `uvicorn src.main:create_app --host 0.0.0.0 --port 8000 --workers 4`
- Health check: `http://localhost:8000/api/v1/health`

---

## 🎨 Frontend (React/Vite)

| Service | Port Externe | Port Interne | Configuration | Statut |
|---------|-------------|-------------|---------------|--------|
| **Frontend** | **3000** | **5173** | `FRONTEND_PORT` | ✅ Actif |

**Détails:**
- Container: `immo2000_frontend`
- Port mappé: `3000:5173`
- Variable d'env: `FRONTEND_PORT=3000` (par défaut)
- Localisation: `docker-compose.yml` ligne 87
- Dev server: `npm run dev -- --host 0.0.0.0 --port 5173`
- URL locale: `http://localhost:3000`
- Dockerfile: `Dockerfile.frontend`

---

## 📧 Email (SMTP)

| Service | Port | Configuration | Statut |
|---------|------|---------------|--------|
| **SMTP** | **587** | `EMAIL_SMTP_PORT` | ✅ Configuré |

**Détails:**
- Variable d'env: `EMAIL_SMTP_PORT=587`
- Localisation: `.env.production` ligne 30
- Configuration: TLS/STARTTLS
- Variable host: `SMTP_HOST` (ex: `smtp.gmail.com`)
- Variable user: `SMTP_USER`
- Variable password: `SMTP_PASSWORD`

---

## 🔴 Redis Cache (Optionnel)

| Service | Port | Configuration | Statut |
|---------|------|---------------|--------|
| **Redis** | **6379** | Commenté | ⚠️ Désactivé |

**Détails:**
- Variable d'env: `REDIS_URL=redis://localhost:6379/0`
- Statut: Actuellement commenté dans `docker-compose.yml`
- Container: `immo2000_redis` (si activé)
- Image: `redis:7-alpine`

**Pour activer:**
```yaml
redis:
  image: redis:7-alpine
  container_name: immo2000_redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - immo2000_network
```

---

## 🌐 Proxy/Reverse Proxy (Production)

| Service | Port | Statut | Notes |
|---------|------|--------|-------|
| **HTTP** | **80** | 🔷 À configurer | Redirection vers HTTPS |
| **HTTPS** | **443** | 🔷 À configurer | Certificat SSL/TLS requis |

**Configuration recommandée:**
- Utiliser Nginx ou Traefik comme reverse proxy
- Frontend → Port 443 (HTTPS)
- Backend API → Port 443/api/v1 (HTTPS)
- Force HTTPS redirection (port 80 → 443)

---

## 📊 Monitoring & Observabilité

| Service | Port | Statut | Notes |
|---------|------|--------|-------|
| **Prometheus** | **9090** | 🔷 Optionnel | Métriques applicatives |
| **Grafana** | **3001** | 🔷 Optionnel | Dashboard de visualisation |
| **Node Exporter** | **9100** | 🔷 Optionnel | Métriques système |

---

## 📋 Résumé des Ports (Local Development)

```
Frontend:    http://localhost:3000      (externe)
             http://localhost:5173      (interne)

Backend:     http://localhost:5000      (Flask)
             ou http://localhost:8000   (FastAPI)

Database:    localhost:5432             (PostgreSQL)

Email:       smtp.* (config externe)    :587 (TLS)

Optional:
Redis:       localhost:6379             (si activé)
```

---

## 🔧 Variables d'Environnement (Résumé)

```bash
# Base de données
DB_PORT=5432                 # PostgreSQL

# API Backend
API_PORT=5000               # Flask (défaut)
FLASK_ENV=production        # Flask environment

# Frontend
FRONTEND_PORT=3000          # Port externe React/Vite
VITE_API_URL=http://localhost:5000/api/v1

# Email SMTP
SMTP_HOST=smtp.gmail.com    # Provider SMTP
SMTP_PORT=587               # TLS port
EMAIL_SMTP_PORT=587

# Redis (optionnel)
REDIS_URL=redis://localhost:6379/0

# CORS
API_CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

---

## 🚀 Démarrage Docker Compose

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les services
docker-compose ps

# Logs
docker-compose logs -f backend   # Backend logs
docker-compose logs -f frontend  # Frontend logs
docker-compose logs -f postgres  # Database logs
```

---

## ✅ Checklist Configuration Production

- [ ] SSL/HTTPS configuré (port 443)
- [ ] Redirection HTTP → HTTPS (port 80)
- [ ] Firewall: Ouvrir ports 80, 443
- [ ] Database: Port 5432 sécurisé (non exposé)
- [ ] Backend: Port 5000/8000 derrière reverse proxy
- [ ] Frontend: Servir via HTTPS uniquement
- [ ] CORS configuré pour domaines production
- [ ] Secrets renouvelés (SECRET_KEY, JWT_SECRET_KEY)
- [ ] SMTP configuré avec provider de production
- [ ] Monitoring Prometheus/Grafana (optionnel)

---

**Dernière mise à jour:** 2024-06-09
**Branche:** main
**Version Docker Compose:** 3.9
