# Priority 3: Optimisations et Fonctionnalités Avancées
## Guide d'Implémentation Complet

### 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Déploiement](#déploiement)
6. [Tests](#tests)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

Priority 3 implémente 4 phases majeurs d'optimisations et de fonctionnalités avancées pour Immo2000:

### **Phase 1: Optimisations Backend**
- ✅ Cache Redis (5 min / 1 heure TTL)
- ✅ Tâches asynchrones Celery
- ✅ Requêtes SQL optimisées (joinedload, selectinload)
- ✅ Clients HTTP asynchrones (httpx)

### **Phase 2: Recherche Avancée**
- ✅ Elasticsearch 8.11.0 (full-text, filtres facettés)
- ✅ Suggestions de recherche
- ✅ Statistiques d'index

### **Phase 3: Fonctionnalités Avancées**
- ✅ Simulateur de prêt (Pretto/Melo API)
- ✅ Notifications push Firebase (FCM)
- ✅ Chat temps réel (WebSocket avec Socket.IO)
- ✅ Gestion des transactions

### **Phase 4: DevOps & Monitoring**
- ✅ Containerisation Docker & docker-compose
- ✅ CI/CD GitHub Actions
- ✅ Monitoring avec Sentry
- ✅ Logs centralisés

---

## Architecture

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Jinja2)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   Flask App (Port 5000)                     │
├──────────────────┬──────────────────────────────────────────┤
│  Routes HTTP     │  WebSocket (Socket.IO)  │  Health Check  │
├──────────────────┴──────────────────────────────────────────┤
│                   Blueprints                                │
│  ├─ /api/pret (Simulateur)                                 │
│  ├─ /api/fcm (Notifications)                               │
│  ├─ /api/chat (Chat)                                       │
│  └─ ...autres routes existantes                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬──────────┐
        │                     │              │          │
┌───────▼────────┐  ┌────────▼────┐  ┌─────▼────┐  ┌──▼───┐
│  PostgreSQL    │  │    Redis    │  │ Celery   │  │ ES   │
│  (BD)          │  │  (Cache)    │  │ (Tasks)  │  │(Search)
└────────────────┘  └─────────────┘  └──────────┘  └──────┘
```

### Flux d'Execution des Tâches Asynchrones

```
Route HTTP
    │
    ├─ Validation des données
    ├─ Créer une tâche Celery (.delay())
    ├─ Retourner une réponse au client (202 Accepted)
    │
    └─> Celery Worker exécute la tâche
        ├─ Récupère du broker (Redis)
        ├─ Exécute la fonction
        ├─ Sauvegarde le résultat (Redis backend)
        └─ Envoie des notifications via WebSocket
```

---

## Installation

### 1. Installer les dépendances

```bash
cd backend
pip install -r requirements.txt
```

Les nouvelles dépendances pour Priority 3:
- `celery==5.3.4` - Tâches asynchrones
- `elasticsearch==8.11.0` - Recherche avancée
- `Flask-SocketIO==5.3.5` - WebSocket
- `httpx==0.25.2` - Clients HTTP async
- `firebase-admin==6.2.0` - Push notifications
- `sentry-sdk==1.39.2` - Error tracking

### 2. Démarrer les services Docker

```bash
# Démarrer tous les services (Flask, PostgreSQL, Redis, Elasticsearch, Celery)
docker-compose up -d

# Ou individuellement:
docker run -d -p 6379:6379 redis:7
docker run -d -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.11.0

# Le serveur Flask se démarre avec:
python run_server.py
```

### 3. Initialiser les migrations et données

```bash
# Créer les tables
flask db upgrade

# Synchroniser Elasticsearch
curl -X POST http://localhost:5000/api/admin/sync-search
```

---

## Configuration

### Variables d'environnement (.env)

```bash
# Cache & Async
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Search
ELASTICSEARCH_URL=http://localhost:9200

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-project-id
FCM_API_KEY=your-fcm-api-key

# Loan APIs (choose one)
PRETTO_API_KEY=your-pretto-key
# OR
MELO_API_KEY=your-melo-key

# Error Tracking
SENTRY_DSN=your-sentry-dsn

# Cache TTL
CACHE_TIMEOUT_SHORT=300
CACHE_TIMEOUT_LONG=3600
```

### Configuration Celery (src/tasks.py)

```python
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Paris',
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)
```

---

## Déploiement

### 1. Démarrer le serveur Flask

```bash
# Développement
python run_server.py

# Production (avec gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 "src.app:create_app()"
```

### 2. Démarrer le worker Celery

```bash
# Worker principal
celery -A celery_worker.celery worker --loglevel=info

# Avec plusieurs workers (pool de threads)
celery -A celery_worker.celery worker \
  --loglevel=info \
  --concurrency=4 \
  --pool=threads
```

### 3. Démarrer le beat scheduler (tâches planifiées)

```bash
celery -A celery_worker.celery beat --loglevel=info
```

### 4. Docker Compose (Complet)

```yaml
version: '3.8'

services:
  # API Flask
  flask:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_APP=src.app
      - DATABASE_URL=postgresql://user:pass@postgres:5432/immo2000
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
      - elasticsearch
    volumes:
      - ./backend:/app

  # Base de données
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: immo2000
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: immo2000_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Cache & Message Broker
  redis:
    image: redis:7
    ports:
      - "6379:6379"

  # Moteur de recherche
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  # Worker Celery
  celery:
    build: ./backend
    command: celery -A celery_worker.celery worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/immo2000
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  # Beat Scheduler
  beat:
    build: ./backend
    command: celery -A celery_worker.celery beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/immo2000
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

---

## Tests

### Exécuter les tests

```bash
# Tests unitaires
pytest backend/tests/test_priority3.py -v

# Avec couverture
pytest backend/tests/test_priority3.py --cov=src --cov-report=html

# Tests d'intégration spécifiques
pytest backend/tests/test_priority3.py::TestLoanSimulator -v
```

### Tester les endpoints manuellement

```bash
# Simulateur de prêt
curl -X POST http://localhost:5000/api/pret/simulate \
  -H "Content-Type: application/json" \
  -d '{"amount": 300000, "duration": 25, "rate": 3.5}'

# Capacité d'emprunt
curl -X POST http://localhost:5000/api/pret/capacity \
  -H "Content-Type: application/json" \
  -d '{"annual_income": 50000, "savings": 30000}'

# Recherche Elasticsearch
curl "http://localhost:5000/api/annonces/search?q=appartement&city=Paris"

# FCM Token Registration
curl -X POST http://localhost:5000/api/fcm/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"token": "fcm_device_token_here"}'
```

---

## Monitoring

### Sentry (Error Tracking)

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=0.1,
)
```

### Redis Monitoring

```bash
# Vérifier la connexion
redis-cli ping

# Voir les clés en cache
redis-cli keys "*"

# Vérifier la mémoire utilisée
redis-cli info memory
```

### Elasticsearch Monitoring

```bash
# Santé du cluster
curl http://localhost:9200/_cluster/health

# Statistiques d'index
curl http://localhost:9200/listings/_stats

# Voir tous les documents
curl http://localhost:9200/listings/_search
```

### Celery Monitoring

```bash
# Avec Flower (interface Web)
pip install flower
celery -A celery_worker.celery flower

# Puis accédez à http://localhost:5555
```

---

## Troubleshooting

### 1. "Celery worker not connecting to broker"

```bash
# Vérifier que Redis est actif
redis-cli ping
# Output: PONG

# Vérifier la URL du broker
echo $CELERY_BROKER_URL
# Doit être: redis://localhost:6379/0
```

### 2. "Elasticsearch index not found"

```bash
# Synchroniser manuellement
curl -X POST http://localhost:5000/api/admin/sync-search

# Ou via Python
from src.utils.search import sync_all_listings
count = sync_all_listings()
print(f"{count} annonces indexées")
```

### 3. "FCM token invalid"

```python
# Vérifier le token Firebase dans les logs
# et s'assurer que FIREBASE_PROJECT_ID et FCM_API_KEY sont corrects
import os
print(os.getenv('FIREBASE_PROJECT_ID'))
print(os.getenv('FCM_API_KEY'))
```

### 4. "SocketIO events not working"

```python
# Vérifier que SocketIO est initialisé dans app.py
from src.app import create_app
app = create_app()
print(hasattr(app, 'socketio'))  # Should be True
```

### 5. "Cache not working - all GET requests hitting database"

```bash
# Vérifier Redis
redis-cli

# Dans la console Redis
> SET test_key "test_value"
> GET test_key
# Doit retourner "test_value"

# Si Redis est vide, vérifier REDIS_URL
```

---

## Étapes Suivantes

1. **Tester localement** avec `docker-compose up`
2. **Vérifier les endpoints** avec les commandes curl fournies
3. **Configurer Sentry** pour le monitoring d'erreurs
4. **Déployer en staging** avec le CI/CD GitHub Actions
5. **Monitorer en production** avec Prometheus + Grafana

---

## Ressources

- [Celery Documentation](https://docs.celeryproject.io/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/8.11/index.html)
- [Flask-SocketIO Documentation](https://flask-socketio.readthedocs.io/)
- [Redis Documentation](https://redis.io/docs/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

## Support

Pour toute question ou problème:
1. Vérifier les logs: `docker logs container_name`
2. Consulter la documentation ci-dessus
3. Ouvrir une issue GitHub avec les logs d'erreur
