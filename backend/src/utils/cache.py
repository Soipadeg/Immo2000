"""
Cache Redis utilities pour optimiser les performances
"""

from functools import wraps
from flask import request
from datetime import timedelta
import hashlib
import json


class RedisCache:
    """Classe pour gérer le cache Redis"""

    def __init__(self, redis_client):
        self.redis = redis_client

    def cache_result(self, timeout=300, key_prefix=None):
        """
        Décorateur pour cacher le résultat d'une fonction.

        Args:
            timeout: Durée du cache en secondes (par défaut 5 minutes)
            key_prefix: Préfixe personnalisé pour la clé (par défaut, utilise le nom de la fonction)
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Générer une clé de cache
                prefix = key_prefix or f"{func.__module__}:{func.__name__}"

                # Inclure les paramètres dans la clé
                args_str = json.dumps([str(arg) for arg in args], sort_keys=True)
                kwargs_str = json.dumps(kwargs, sort_keys=True, default=str)
                cache_key = f"{prefix}:{hashlib.md5((args_str + kwargs_str).encode()).hexdigest()}"

                # Chercher dans le cache
                cached_value = self.redis.get(cache_key)
                if cached_value:
                    return json.loads(cached_value)

                # Exécuter la fonction
                result = func(*args, **kwargs)

                # Stocker le résultat en cache
                try:
                    self.redis.setex(cache_key, timeout, json.dumps(result, default=str))
                except (TypeError, ValueError):
                    # Si la sérialisation JSON échoue, ne pas mettre en cache
                    pass

                return result

            return wrapper
        return decorator

    def cache_list(self, timeout=300, key_prefix=None):
        """
        Décorateur spécifique pour cacher les listes d'objets.
        Utile pour les requêtes retournant des listes de modèles SQLAlchemy.
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                prefix = key_prefix or f"{func.__module__}:{func.__name__}:list"

                # Chercher dans le cache
                cached_value = self.redis.get(prefix)
                if cached_value:
                    return json.loads(cached_value)

                # Exécuter la fonction
                result = func(*args, **kwargs)

                # Convertir les modèles SQLAlchemy en dict pour la sérialisation
                serializable_result = []
                try:
                    for item in result:
                        if hasattr(item, '__dict__'):
                            # C'est un objet SQLAlchemy
                            serializable_result.append({k: v for k, v in item.__dict__.items() if not k.startswith('_')})
                        else:
                            serializable_result.append(item)

                    self.redis.setex(prefix, timeout, json.dumps(serializable_result, default=str))
                except Exception:
                    # Si la sérialisation échoue, ne pas mettre en cache
                    pass

                return result

            return wrapper
        return decorator

    def invalidate(self, pattern):
        """
        Invalider toutes les clés correspondant à un pattern.

        Args:
            pattern: Pattern à matcher (ex: "annonces:*")
        """
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)

    def invalidate_single(self, key):
        """Invalider une clé spécifique"""
        self.redis.delete(key)

    def get_stats(self):
        """Retourner les statistiques du cache Redis"""
        info = self.redis.info()
        return {
            'used_memory': info.get('used_memory_human', 'N/A'),
            'connected_clients': info.get('connected_clients', 0),
            'total_commands': info.get('total_commands_processed', 0),
        }


# Fonctions utilitaires pour les cas d'usage courants

def cache_annonces(redis_cache, timeout=300):
    """Cache la liste des annonces actives"""
    @redis_cache.cache_list(timeout=timeout, key_prefix='annonces:liste:actives')
    def get_annonces():
        from src.auth.models import Listing  # Utiliser le bon modèle
        return Listing.query.filter_by(actif=True).all()

    return get_annonces()


def cache_annonce_details(redis_cache, annonce_id, timeout=3600):
    """Cache les détails d'une annonce spécifique (1 heure)"""
    @redis_cache.cache_result(timeout=timeout, key_prefix=f'annonces:details:{annonce_id}')
    def get_annonce():
        from src.auth.models import Listing
        return Listing.query.get(annonce_id)

    return get_annonce()


def cache_offres_user(redis_cache, user_id, timeout=300):
    """Cache les offres d'un utilisateur spécifique"""
    @redis_cache.cache_list(timeout=timeout, key_prefix=f'offres:user:{user_id}')
    def get_offres():
        from src.auth.models import Offer
        return Offer.query.filter_by(buyer_id=user_id).all()

    return get_offres()


def cache_transactions_user(redis_cache, user_id, timeout=300):
    """Cache les transactions d'un utilisateur spécifique"""
    @redis_cache.cache_list(timeout=timeout, key_prefix=f'transactions:user:{user_id}')
    def get_transactions():
        from src.auth.models import Transaction
        return Transaction.query.filter(
            (Transaction.seller_id == user_id) | (Transaction.buyer_id == user_id)
        ).all()

    return get_transactions()


def invalidate_annonce_cache(redis_cache, annonce_id):
    """Invalider le cache pour une annonce spécifique"""
    redis_cache.invalidate_single(f'annonces:details:{annonce_id}')
    redis_cache.invalidate('annonces:liste:*')


def invalidate_user_cache(redis_cache, user_id):
    """Invalider le cache pour un utilisateur spécifique"""
    redis_cache.invalidate(f'offres:user:{user_id}')
    redis_cache.invalidate(f'transactions:user:{user_id}')
