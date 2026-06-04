"""
Rate Limiting Service - Phase 3.3

Protège les APIs contre les abus par:
- Limitation par IP (dos protection)
- Limitation par utilisateur (quota)
- Limitation par endpoint (custom rules)
- Limitation par action (login attempts, etc.)

Stratégie:
- Auth endpoints (login, register): 5 req/min per IP
- Standard API: 100 req/min per user
- Search: 30 req/min per user
- Admin: 20 req/min per user
- Global: 1000 req/min per IP

Redis Keys:
- rate_limit:ip:{ip}:{endpoint}
- rate_limit:user:{user_id}:{endpoint}
- rate_limit:action:{action}:{identifier}
"""

import os
import logging
from functools import wraps
from typing import Dict, Tuple, Optional, Callable
from datetime import datetime, timedelta
from flask import request, jsonify

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Configuration des limites par catégorie"""

    # Auth endpoints (strictes - prevent brute force)
    LIMIT_LOGIN = int(os.getenv('RATE_LIMIT_LOGIN', 5))              # 5 attempts/min
    LIMIT_REGISTER = int(os.getenv('RATE_LIMIT_REGISTER', 3))        # 3 attempts/min
    LIMIT_PASSWORD_RESET = int(os.getenv('RATE_LIMIT_PWD_RESET', 3)) # 3 attempts/min

    # Standard API endpoints (user quota)
    LIMIT_USER_API = int(os.getenv('RATE_LIMIT_USER_API', 100))      # 100 req/min
    LIMIT_USER_SEARCH = int(os.getenv('RATE_LIMIT_SEARCH', 30))      # 30 search/min
    LIMIT_USER_MESSAGES = int(os.getenv('RATE_LIMIT_MSG', 50))       # 50 msg/min

    # Admin endpoints (higher quota)
    LIMIT_ADMIN_API = int(os.getenv('RATE_LIMIT_ADMIN', 500))        # 500 req/min

    # Global IP limits (dos protection)
    LIMIT_GLOBAL_IP = int(os.getenv('RATE_LIMIT_GLOBAL_IP', 1000))   # 1000 req/min per IP

    # Timeframe (TTL)
    WINDOW_SECONDS = int(os.getenv('RATE_LIMIT_WINDOW', 60))          # 1 minute

    # Enable/disable
    RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
    RATE_LIMIT_DEBUG = os.getenv('RATE_LIMIT_DEBUG', 'false').lower() == 'true'


class RateLimiter:
    """Service de rate limiting basé sur Redis"""

    def __init__(self, redis_client):
        self.redis = redis_client
        self.config = RateLimitConfig()

    def _get_client_ip(self) -> str:
        """Récupérer l'IP du client (avec support proxies)"""
        if request.environ.get('HTTP_X_FORWARDED_FOR'):
            return request.environ['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
        return request.remote_addr or '0.0.0.0'

    def _get_user_id(self) -> Optional[int]:
        """Récupérer l'ID utilisateur depuis g.user (si auth'd)"""
        from flask import g
        return getattr(g, 'user_id', None)

    def _increment_counter(self, key: str, limit: int, window: int) -> Tuple[int, int]:
        """
        Incrémenter un compteur et retourner (count, remaining)

        Returns:
            (count, remaining): Nombre de requêtes faites et restantes
        """
        if not self.redis or not self.config.RATE_LIMIT_ENABLED:
            return (0, limit)

        try:
            # Incrémenter
            count = self.redis.incr(key)

            # Si première requête, définir l'expiration
            if count == 1:
                self.redis.expire(key, window)

            # Retourner count + remaining
            remaining = max(0, limit - count)
            return (count, remaining)

        except ConnectionError as e:
            logger.warning(f"❌ Rate limit counter error ({key}) (connection): {e}", exc_info=True)
            return (0, limit)
        except Exception as e:
            logger.warning(f"❌ Rate limit counter error ({key}): {e}", exc_info=True)
            return (0, limit)

    def is_allowed(
        self,
        action: str,
        limit: int,
        window: int = None
    ) -> Tuple[bool, Dict]:
        """
        Vérifier si une requête est autorisée

        Args:
            action: Type d'action ('login', 'api', 'search', etc.)
            limit: Limite de requêtes
            window: Fenêtre de temps en secondes

        Returns:
            (allowed, info_dict): Si autorisé + infos (count, remaining, reset_time)
        """
        window = window or self.config.WINDOW_SECONDS

        # Récupérer les identifiants
        ip = self._get_client_ip()
        user_id = self._get_user_id()
        endpoint = request.endpoint or 'unknown'

        # Déterminer la clé de rate limit
        if action in ['login', 'register', 'password_reset']:
            # Pour auth: limiter par IP
            key = f"rate_limit:action:{action}:{ip}"
        elif user_id:
            # Pour users authentifiés: limiter par user
            key = f"rate_limit:user:{user_id}:{action}:{endpoint}"
        else:
            # Pour non-auth: limiter par IP
            key = f"rate_limit:ip:{ip}:{action}:{endpoint}"

        # Incrémenter et vérifier
        count, remaining = self._increment_counter(key, limit, window)

        # Déterminer si allowed
        allowed = count <= limit

        # Calculer reset time
        if allowed:
            ttl = self.redis.ttl(key) if self.redis else 0
            reset_time = datetime.utcnow() + timedelta(seconds=max(0, ttl))
        else:
            reset_time = None

        info = {
            'allowed': allowed,
            'count': count,
            'limit': limit,
            'remaining': remaining,
            'reset_time': reset_time,
            'window_seconds': window,
            'key': key if self.config.RATE_LIMIT_DEBUG else None
        }

        if self.config.RATE_LIMIT_DEBUG or not allowed:
            logger.info(f"🚦 Rate limit [{action}]: {count}/{limit} | IP: {ip}")

        return allowed, info


def rate_limit(
    action: str,
    limit: int = None,
    window: int = None
) -> Callable:
    """
    Décorateur pour appliquer le rate limiting

    Usage:
    @rate_limit('api', limit=100)  # 100 req/min
    def my_api_endpoint():
        pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import g
            from src.services.cache_service import cache

            # Récupérer le limiter
            limiter = g.get('rate_limiter')
            if not limiter:
                # Initialiser si pas en g
                limiter = RateLimiter(cache._redis_client if cache.is_available() else None)
                g.rate_limiter = limiter

            # Déterminer la limite
            effective_limit = limit or getattr(RateLimitConfig, f'LIMIT_{action.upper()}', 100)

            # Vérifier si allowed
            allowed, info = limiter.is_allowed(action, effective_limit, window)

            # Ajouter headers
            response = func(*args, **kwargs)

            if isinstance(response, tuple):
                data, code = response if len(response) >= 2 else (response[0], 200)
            else:
                data, code = response, 200

            # Retourner avec headers
            return {
                'data': data,
                'rate_limit': {
                    'limit': info['limit'],
                    'remaining': info['remaining'],
                    'reset': info['reset_time'].isoformat() if info['reset_time'] else None
                }
            }, code

        return wrapper
    return decorator


# ===== Helpers pour limit spécifiques =====

def rate_limit_login(func: Callable) -> Callable:
    """Rate limit pour login"""
    return rate_limit('login', limit=RateLimitConfig.LIMIT_LOGIN)(func)


def rate_limit_register(func: Callable) -> Callable:
    """Rate limit pour registration"""
    return rate_limit('register', limit=RateLimitConfig.LIMIT_REGISTER)(func)


def rate_limit_api(func: Callable) -> Callable:
    """Rate limit standard API"""
    return rate_limit('api', limit=RateLimitConfig.LIMIT_USER_API)(func)


def rate_limit_search(func: Callable) -> Callable:
    """Rate limit pour search endpoints"""
    return rate_limit('search', limit=RateLimitConfig.LIMIT_USER_SEARCH)(func)


def rate_limit_admin(func: Callable) -> Callable:
    """Rate limit pour admin (quota plus élevé)"""
    return rate_limit('admin', limit=RateLimitConfig.LIMIT_ADMIN_API)(func)


# ===== Middleware global =====

def init_rate_limiting(app):
    """Initialiser le rate limiting global dans l'app"""

    @app.before_request
    def check_global_rate_limit():
        """Vérifier le global IP rate limit"""
        from src.services.cache_service import cache
        from flask import g

        # Initialiser le limiter
        limiter = RateLimiter(cache._redis_client if cache.is_available() else None)
        g.rate_limiter = limiter

        # Vérifier global limit
        allowed, info = limiter.is_allowed(
            'global',
            RateLimitConfig.LIMIT_GLOBAL_IP,
            RateLimitConfig.WINDOW_SECONDS
        )

        if not allowed:
            return jsonify({
                'error': 'Rate limit exceeded',
                'message': 'Too many requests. Please try again later.',
                'reset_time': info['reset_time'].isoformat() if info['reset_time'] else None
            }), 429

    @app.after_request
    def add_rate_limit_headers(response):
        """Ajouter les headers rate limit à toutes les réponses"""
        from flask import g

        limiter = g.get('rate_limiter')
        if limiter and hasattr(g, 'rate_limit_info'):
            info = g.rate_limit_info
            response.headers['X-RateLimit-Limit'] = str(info['limit'])
            response.headers['X-RateLimit-Remaining'] = str(info['remaining'])
            if info['reset_time']:
                response.headers['X-RateLimit-Reset'] = info['reset_time'].isoformat()

        return response


# ===== Exceptions =====

class RateLimitExceeded(Exception):
    """Exception levée quand rate limit dépassé"""

    def __init__(self, info: Dict):
        self.info = info
        super().__init__(f"Rate limit exceeded: {info['remaining']} remaining")
