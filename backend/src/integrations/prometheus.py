"""
Configuration Prometheus pour le monitoring des métriques

Prometheus setup:
1. Installer prometheus-client: pip install prometheus-client
2. Configurer PROMETHEUS_ENABLED=true dans .env
3. Les métriques sont disponibles sur /metrics
4. Intégrer Prometheus dans docker-compose (optional)

Voir aussi:
- https://prometheus.io/
- https://github.com/prometheus/client_python
"""

import os
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps
import time


# === Initialisation des métriques ===

# Compteurs de requêtes HTTP
http_requests_total = Counter(
    'http_requests_total',
    'Nombre total de requêtes HTTP',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'Durée des requêtes HTTP en secondes',
    ['method', 'endpoint'],
    buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
)

# Métriques de base de données
db_queries_total = Counter(
    'db_queries_total',
    'Nombre total de requêtes à la base de données',
    ['query_type', 'table']
)

db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Durée des requêtes BD en secondes',
    ['query_type'],
    buckets=(0.001, 0.01, 0.1, 0.5, 1.0)
)

# Métriques d'authentification
auth_attempts_total = Counter(
    'auth_attempts_total',
    'Nombre total de tentatives d\'authentification',
    ['method', 'status']
)

# Métriques de cache
cache_hits = Counter(
    'cache_hits_total',
    'Nombre total de hits cache',
    ['cache_type']
)

cache_misses = Counter(
    'cache_misses_total',
    'Nombre total de misses cache',
    ['cache_type']
)

# Métriques d'erreurs
exceptions_total = Counter(
    'exceptions_total',
    'Nombre total d\'exceptions levées',
    ['exception_type', 'endpoint']
)

# Gauges (valeurs instantanées)
active_connections = Gauge(
    'active_connections',
    'Nombre de connexions actives'
)

queue_length = Gauge(
    'queue_length',
    'Longueur de la queue Celery',
    ['queue_name']
)


# === Fonctions de recording ===

def record_http_request(method: str, endpoint: str, status: int, duration: float):
    """
    Enregistrer une requête HTTP

    Args:
        method: Méthode HTTP (GET, POST, etc.)
        endpoint: Endpoint de l'API
        status: Status code de la réponse
        duration: Durée en secondes
    """
    http_requests_total.labels(
        method=method,
        endpoint=endpoint,
        status=status
    ).inc()

    http_request_duration.labels(
        method=method,
        endpoint=endpoint
    ).observe(duration)


def record_db_query(query_type: str, table: str, duration: float):
    """
    Enregistrer une requête base de données

    Args:
        query_type: Type de requête (SELECT, INSERT, UPDATE, DELETE)
        table: Nom de la table
        duration: Durée en secondes
    """
    db_queries_total.labels(
        query_type=query_type,
        table=table
    ).inc()

    db_query_duration.labels(query_type=query_type).observe(duration)


def record_auth_attempt(method: str, status: str):
    """
    Enregistrer une tentative d'authentification

    Args:
        method: Méthode d'auth (password, oauth, 2fa, etc.)
        status: Résultat (success, failed, rate_limited)
    """
    auth_attempts_total.labels(
        method=method,
        status=status
    ).inc()


def record_cache_hit(cache_type: str):
    """Enregistrer un cache hit"""
    cache_hits.labels(cache_type=cache_type).inc()


def record_cache_miss(cache_type: str):
    """Enregistrer un cache miss"""
    cache_misses.labels(cache_type=cache_type).inc()


def record_exception(exception_type: str, endpoint: str):
    """Enregistrer une exception"""
    exceptions_total.labels(
        exception_type=exception_type,
        endpoint=endpoint
    ).inc()


# === Decorators pour instrumenter le code ===

def monitor_endpoint(app):
    """
    Decorator pour monitorer les endpoints Flask

    Usage:
        @app.before_request
        def before_request():
            g.start_time = time.time()

        @app.after_request
        def after_request(response):
            if hasattr(g, 'start_time'):
                duration = time.time() - g.start_time
                record_http_request(
                    request.method,
                    request.endpoint or request.path,
                    response.status_code,
                    duration
                )
            return response
    """
    @app.before_request
    def start_timer():
        from flask import g
        g.start_time = time.time()

    @app.after_request
    def record_metrics(response):
        from flask import g, request

        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            record_http_request(
                method=request.method,
                endpoint=request.endpoint or request.path,
                status=response.status_code,
                duration=duration
            )

        return response


def monitor_function(func):
    """
    Decorator pour monitorer une fonction

    Usage:
        @monitor_function
        def my_function():
            pass
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            record_exception(type(e).__name__, getattr(func, '__name__', 'unknown'))
            raise
        except Exception as e:
            record_exception(type(e).__name__, getattr(func, '__name__', 'unknown'))
            raise
        finally:
            duration = time.time() - start
            # Log custom metrics si needed

    return wrapper


# === Endpoint /metrics pour Prometheus ===

def register_metrics_endpoint(app):
    """
    Enregistrer l'endpoint /metrics pour Prometheus

    Args:
        app: Application Flask
    """
    @app.route('/metrics', methods=['GET'])
    def metrics():
        """Expose Prometheus metrics"""
        if os.getenv("PROMETHEUS_ENABLED", "false").lower() == "false":
            return {"error": "Prometheus metrics disabled"}, 403

        # Générer les métriques au format Prometheus
        return generate_latest(), 200, {'Content-Type': 'text/plain; charset=utf-8'}


def init_prometheus(app):
    """
    Initialiser Prometheus dans l'application Flask

    Args:
        app: Application Flask

    Returns:
        bool: True si Prometheus est activé
    """
    prometheus_enabled = os.getenv("PROMETHEUS_ENABLED", "false").lower() == "true"

    if not prometheus_enabled:
        print("⚠️  Prometheus metrics disabled (set PROMETHEUS_ENABLED=true to enable)")
        return False

    try:
        # Enregistrer l'endpoint /metrics
        register_metrics_endpoint(app)

        # Instrumenter les endpoints Flask
        monitor_endpoint(app)

        print(f"✅ Prometheus initialized - metrics available at /metrics")
        return True

    except ValueError as e:
        print(f"❌ Failed to initialize Prometheus (validation): {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to initialize Prometheus: {e}")
        return False
