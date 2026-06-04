"""
Redis Cache Service - Phase 3.2

Fournit une couche de cache haute performance pour les données fréquemment accédées:
- Listings (annonces)
- Profils utilisateurs
- Sessions
- Résultats de recherche

Stratégie de caching:
- Listings: Cache 1 heure (invalidé on update)
- Users: Cache 30 minutes (invalidé on update)
- Search: Cache 5 minutes (moins stable)
- Sessions: Cache 24 heures

Configuration:
- Redis: localhost:6379 (dev) / produit:6379 (prod)
- Key format: "cache:{module}:{resource_id}"
- TTL par défaut: Configurable par endpoint
"""

import os
import json
import redis
import logging
from functools import wraps
from typing import Any, Callable, Optional, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CacheConfig:
    """Configuration Redis selon l'environnement"""

    # Defaults
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

    # TTLs par type de données (en secondes)
    TTL_LISTING = int(os.getenv('CACHE_TTL_LISTING', 3600))      # 1 heure
    TTL_USER = int(os.getenv('CACHE_TTL_USER', 1800))            # 30 minutes
    TTL_SEARCH = int(os.getenv('CACHE_TTL_SEARCH', 300))         # 5 minutes
    TTL_SESSION = int(os.getenv('CACHE_TTL_SESSION', 86400))     # 24 heures
    TTL_NOTIFICATION = int(os.getenv('CACHE_TTL_NOTIF', 120))    # 2 minutes

    # Flags
    CACHE_ENABLED = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
    CACHE_DEBUG = os.getenv('CACHE_DEBUG', 'false').lower() == 'true'


class RedisCache:
    """Service Redis centralisé"""

    _instance = None
    _redis_client = None

    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super(RedisCache, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialiser la connexion Redis"""
        if self._redis_client is None:
            try:
                self._redis_client = redis.Redis(
                    host=CacheConfig.REDIS_HOST,
                    port=CacheConfig.REDIS_PORT,
                    db=CacheConfig.REDIS_DB,
                    password=CacheConfig.REDIS_PASSWORD,
                    decode_responses=True,  # Retourner strings au lieu de bytes
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    health_check_interval=30
                )
                # Test connexion
                self._redis_client.ping()
                logger.info(f"✅ Redis connecté: {CacheConfig.REDIS_HOST}:{CacheConfig.REDIS_PORT}")
            except ConnectionError as e:
                logger.warning(f"⚠️  Redis unavailable (connexion échouée): {e}", exc_info=True)
                self._redis_client = None
            except Exception as e:
                logger.warning(f"⚠️  Redis unavailable: {e}. Cache désactivé.", exc_info=True)
                self._redis_client = None

    def is_available(self) -> bool:
        """Vérifier si Redis est disponible"""
        return self._redis_client is not None and CacheConfig.CACHE_ENABLED

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Récupérer une valeur du cache"""
        if not self.is_available():
            return None

        try:
            value = self._redis_client.get(key)
            if value:
                if CacheConfig.CACHE_DEBUG:
                    logger.debug(f"🔄 Cache HIT: {key}")
                return json.loads(value)
            return None
        except json.JSONDecodeError as e:
            logger.warning(f"❌ Cache GET error ({key}) (JSON invalide): {e}", exc_info=True)
            return None
        except Exception as e:
            logger.warning(f"❌ Cache GET error ({key}): {e}", exc_info=True)
            return None

    def set(self, key: str, value: Dict[str, Any], ttl: int = 3600) -> bool:
        """Stocker une valeur dans le cache"""
        if not self.is_available():
            return False

        try:
            json_value = json.dumps(value, default=str)
            self._redis_client.setex(key, ttl, json_value)
            if CacheConfig.CACHE_DEBUG:
                logger.debug(f"💾 Cache SET: {key} (TTL: {ttl}s)")
            return True
        except ValueError as e:
            logger.warning(f"❌ Cache SET error ({key}) (valeur invalide): {e}", exc_info=True)
            return False
        except Exception as e:
            logger.warning(f"❌ Cache SET error ({key}): {e}", exc_info=True)
            return False

    def delete(self, key: str) -> bool:
        """Supprimer une clé du cache"""
        if not self.is_available():
            return False

        try:
            self._redis_client.delete(key)
            if CacheConfig.CACHE_DEBUG:
                logger.debug(f"🗑️  Cache DELETE: {key}")
            return True
        except ValueError as e:
            logger.warning(f"❌ Cache DELETE error ({key}) (clé invalide): {e}", exc_info=True)
            return False
        except Exception as e:
            logger.warning(f"❌ Cache DELETE error ({key}): {e}", exc_info=True)
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Supprimer toutes les clés matchant un pattern"""
        if not self.is_available():
            return 0

        try:
            cursor = 0
            count = 0
            while True:
                cursor, keys = self._redis_client.scan(cursor, match=pattern, count=100)
                if keys:
                    count += self._redis_client.delete(*keys)
                if cursor == 0:
                    break
            if CacheConfig.CACHE_DEBUG:
                logger.debug(f"🗑️  Cache PATTERN DELETE: {pattern} ({count} keys)")
            return count
        except ValueError as e:
            logger.warning(f"❌ Cache PATTERN DELETE error ({pattern}) (pattern invalide): {e}", exc_info=True)
            return 0
        except Exception as e:
            logger.warning(f"❌ Cache PATTERN DELETE error ({pattern}): {e}", exc_info=True)
            return 0

    def clear(self) -> bool:
        """Vider tout le cache"""
        if not self.is_available():
            return False

        try:
            self._redis_client.flushdb()
            logger.info("🧹 Cache complètement vidé")
            return True
        except ConnectionError as e:
            logger.warning(f"❌ Cache CLEAR error (connexion Redis échouée): {e}", exc_info=True)
            return False
        except Exception as e:
            logger.warning(f"❌ Cache CLEAR error: {e}", exc_info=True)
            return False

    def get_stats(self) -> Dict[str, Any]:
        """Retourner les statistiques du cache"""
        if not self.is_available():
            return {'status': 'unavailable'}

        try:
            info = self._redis_client.info()
            return {
                'status': 'available',
                'used_memory': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands': info.get('total_commands_processed'),
                'keyspace': self._redis_client.dbsize()
            }
        except ConnectionError as e:
            logger.warning(f"❌ Cache STATS error (connexion Redis échouée): {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}
        except Exception as e:
            logger.warning(f"❌ Cache STATS error: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}


def cache_key(resource_type: str, resource_id: Any = None, suffix: str = '') -> str:
    """Générer une clé de cache standardisée"""
    key = f"cache:{resource_type}"
    if resource_id:
        key += f":{resource_id}"
    if suffix:
        key += f":{suffix}"
    return key


def cached(
    resource_type: str,
    ttl: int = None,
    key_builder: Callable = None
) -> Callable:
    """
    Décorateur pour cacher les résultats de fonctions

    Usage:
    @cached('listing', ttl=3600)
    def get_listing(listing_id: int):
        return fetch_from_db(listing_id)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_svc = RedisCache()

            # Générer clé de cache
            if key_builder:
                cache_key_str = key_builder(*args, **kwargs)
            else:
                # Par défaut: resource_type + premier argument (id généralement)
                resource_id = args[0] if args else kwargs.get('id')
                cache_key_str = cache_key(resource_type, resource_id)

            # Essayer le cache
            cached_value = cache_svc.get(cache_key_str)
            if cached_value is not None:
                return cached_value

            # Cache miss: exécuter la fonction
            result = func(*args, **kwargs)

            # Stocker dans le cache
            effective_ttl = ttl or CacheConfig.TTL_LISTING
            cache_svc.set(cache_key_str, result, ttl=effective_ttl)

            return result

        return wrapper
    return decorator


def invalidate_cache(pattern: str) -> bool:
    """Invalider le cache pour un pattern"""
    cache_svc = RedisCache()
    count = cache_svc.delete_pattern(pattern)
    logger.info(f"🔄 Cache invalidated: {pattern} ({count} keys)")
    return count > 0


# Instances globales
cache = RedisCache()


# ===== Helpers pour invalider le cache =====

def invalidate_listing(listing_id: int) -> None:
    """Invalider le cache d'une annonce"""
    invalidate_cache(f"cache:listing:{listing_id}:*")


def invalidate_user(user_id: int) -> None:
    """Invalider le cache d'un utilisateur"""
    invalidate_cache(f"cache:user:{user_id}:*")


def invalidate_search() -> None:
    """Invalider tout le cache de recherche"""
    invalidate_cache("cache:search:*")


# ===== Monitoring =====

def get_cache_stats() -> Dict[str, Any]:
    """Retourner les stats du cache (pour endpoint admin)"""
    cache_svc = RedisCache()
    return cache_svc.get_stats()
