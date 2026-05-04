# Architecture - Immo2000

## 🏗️ Vue globale

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React/Vue)              │
│              http://immo2000.local                  │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────v────────────────────────────────┐
│                  NGINX (Reverse Proxy)              │
│              Port 80/443 SSL Termination            │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────v────────────────────────────────┐
│             BACKEND API (Flask/Gunicorn)            │
│              http://backend:5000                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Services   │  │    Routes    │                │
│  └──────────────┘  └──────────────┘                │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Models     │  │ Validateurs  │                │
│  └──────────────┘  └──────────────┘                │
│                                                      │
│  ┌──────────────────────────────────┐              │
│  │     Intégration API Melo          │              │
│  │  (estimations immobilières)       │              │
│  └──────────────────────────────────┘              │
└────────────────┬──────────────┬──────────────────┬──┘
                 │              │                  │
        ┌────────v──┐    ┌─────v────┐     ┌──────v──┐
        │PostgreSQL │    │  Redis   │     │  Melo   │
        │ (DB)      │    │ (Cache)  │     │  API    │
        └───────────┘    └──────────┘     └─────────┘
```

## 📦 Composants clés

### 1. **Frontend**
- Framework : React/Vue (à choisir)
- State management : Redux/Pinia
- Build tool : Vite/Webpack
- Déploiement : CDN + S3

### 2. **Backend API**
- Framework : Flask
- ORM : SQLAlchemy
- Authentication : JWT
- Validation : Pydantic

### 3. **Base de données**
- PostgreSQL 15
- Migrations : Alembic
- Backup automatique

### 4. **Cache**
- Redis pour session & cache
- TTL configurable

### 5. **API Tiers**
- **Melo** : Estimations immobilières
- Rate limiting intégré
- Retry logic & cache

### 6. **DevOps**
- Docker containers
- Docker Compose orchestration
- Nginx load balancing
- Health checks

## 🔄 Flux de requête

```
1. User Request (Frontend)
                │
                v
2. Nginx (reverse proxy)
                │
                v
3. Flask Router
                │
                v
4. Authentication (JWT)
                │
                v
5. Service Layer
                │
      ┌─────────┴─────────┐
      │                   │
      v                   v
  Cache (Redis)    Database (PostgreSQL)
  ou Melo API
      │                   │
      └─────────┬─────────┘
                │
                v
6. Response JSON
                │
                v
7. Frontend Render
```

## 🗄️ Schéma de base de données (Draft)

```sql
-- Utilisateurs
users (
  id, email, password_hash, nom, prenom,
  telephone, adresse, created_at, updated_at
)

-- Biens immobiliers
biens (
  id, user_id, adresse, surface, type,
  nb_pieces, prix, description, statut,
  created_at, updated_at
)

-- Estimations
estimations (
  id, bien_id, source (melo/manuel),
  prix_m2, fourchette_basse, fourchette_haute,
  prix_estime, donnees_marche, created_at
)

-- Messages (pour P2P)
messages (
  id, sender_id, receiver_id, bien_id,
  contenu, lu, created_at
)

-- Transactions
transactions (
  id, bien_id, acheteur_id, vendeur_id,
  prix_final, statut, created_at, updated_at
)
```

## 🔐 Sécurité

### Authentication
- JWT tokens (access + refresh)
- HTTP-only cookies
- CORS configuré

### Authorization
- Rôles : Admin, Seller, Buyer
- Permission-based access control

### Data Protection
- Encryption des données sensibles
- HTTPS obligatoire
- Rate limiting
- Input validation & sanitization

## ⚙️ Intégration Melo API

```python
# Service wrapper autour de melo_api.py
MeloService
├── get_estimation(bien_data) -> Estimation
├── compare_estimations(biens) -> Report
└── cache_manager (Redis)
```

**Features** :
- ✅ Retry logic (exponential backoff)
- ✅ Cache avec TTL
- ✅ Error handling standardisé
- ✅ Logging détaillé
- ✅ Configuration externalisée

## 📊 Monitoring & Logging

### Logging centralisé
- JSON format pour parsing
- Levels : DEBUG, INFO, WARNING, ERROR
- Rotation des logs

### Monitoring
- Health checks endpoint `/health`
- Prometheus metrics (optional)
- Error tracking (Sentry optional)

## 🚀 Déploiement

### Développement
```bash
docker-compose up
# Backend sur port 5000
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
# Avec Gunicorn multi-worker
# Load balancing Nginx
# HTTPS SSL/TLS
```

### CI/CD Pipeline
```
Code Push
   ↓
GitHub Actions
   ├─ Tests unitaires
   ├─ Linting
   ├─ Build Docker
   └─ Push Registry
   ↓
Kubernetes / Server Deploy
```

## 📈 Performance

### Optimisations
- Connexion pooling DB
- Caching agressif (Redis)
- Gzip compression
- CDN pour assets statiques
- Database indexing

### Scaling
- Horizontal : Kubernetes/Docker Swarm
- Vertical : Plus de ressources
- Cache distribué : Redis cluster

## 🧪 Tests

### Strategy
```
Unit Tests (50%)
├─ Models
├─ Services
└─ Utils

Integration Tests (30%)
├─ API routes
└─ Database

E2E Tests (20%)
└─ Full workflows
```

### Coverage
- Target : 80%+ code coverage
- Tools : pytest, coverage.py

## 📚 Documentation

- **API Docs** : Swagger/OpenAPI
- **Code Docs** : Docstrings + README
- **Architecture** : Ce document
- **DevOps** : Docker/K8s docs

---

**Version** : 1.0 (Draft)
**Dernière mise à jour** : 2026-05-04
**Statut** : 🟡 En design
