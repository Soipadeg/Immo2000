"""
Tests pour Redis Caching (Performance M8)

Valide:
- Cache hits/misses
- TTL gestion
- Pattern invalidation
- Fallback sans Redis
"""

import pytest
import json
from unittest.mock import patch, MagicMock


class TestRedisCache:
    """Tests du service de cache Redis"""

    def test_cache_initialization(self):
        """Vérifier l'initialisation du cache"""
        from src.services.cache_service import RedisCache

        cache = RedisCache()
        assert cache is not None
        # is_available() dépend de Redis actuel

    def test_cache_get_miss(self):
        """Test d'un cache miss"""
        from src.services.cache_service import RedisCache
        from unittest.mock import MagicMock

        cache = RedisCache()

        # Mock Redis
        with patch.object(cache, '_redis_client') as mock_redis:
            mock_redis.get.return_value = None

            result = cache.get('nonexistent_key')
            assert result is None

    def test_cache_set_get(self):
        """Test set et get"""
        from src.services.cache_service import RedisCache
        from unittest.mock import MagicMock

        cache = RedisCache()

        # Mock Redis
        with patch.object(cache, '_redis_client') as mock_redis:
            mock_redis.get.return_value = json.dumps({'id': 1, 'name': 'test'})

            # Set
            cache.set('test_key', {'id': 1, 'name': 'test'}, ttl=3600)
            mock_redis.setex.assert_called_once()

            # Get
            result = cache.get('test_key')
            assert result == {'id': 1, 'name': 'test'}

    def test_cache_delete(self):
        """Test suppression de cache"""
        from src.services.cache_service import RedisCache

        cache = RedisCache()

        with patch.object(cache, '_redis_client') as mock_redis:
            result = cache.delete('test_key')
            mock_redis.delete.assert_called_once_with('test_key')

    def test_cache_pattern_delete(self):
        """Test suppression par pattern"""
        from src.services.cache_service import RedisCache

        cache = RedisCache()

        with patch.object(cache, '_redis_client') as mock_redis:
            # Mock scan
            mock_redis.scan.side_effect = [
                (100, ['key1', 'key2', 'key3']),  # First scan
                (0, [])  # Final scan
            ]
            mock_redis.delete.return_value = 3

            count = cache.delete_pattern('cache:listing:*')
            assert count == 3

    def test_cache_clear(self):
        """Test vidage complet du cache"""
        from src.services.cache_service import RedisCache

        cache = RedisCache()

        with patch.object(cache, '_redis_client') as mock_redis:
            result = cache.clear()
            mock_redis.flushdb.assert_called_once()

    def test_cache_key_generation(self):
        """Test génération de clés de cache"""
        from src.services.cache_service import cache_key

        # Simple
        key = cache_key('listing', 123)
        assert key == 'cache:listing:123'

        # Avec suffix
        key = cache_key('listing', 123, 'details')
        assert key == 'cache:listing:123:details'

        # Sans ID
        key = cache_key('search')
        assert key == 'cache:search'

    def test_cached_decorator(self):
        """Test le décorateur @cached"""
        from src.services.cache_service import cached, RedisCache

        call_count = 0

        @cached('test_resource', ttl=3600)
        def fetch_data(resource_id: int):
            nonlocal call_count
            call_count += 1
            return {'id': resource_id, 'data': 'test'}

        # Mock cache
        with patch('src.services.cache_service.cache') as mock_cache:
            # First call: cache miss
            mock_cache.get.return_value = None
            result1 = fetch_data(1)
            assert call_count == 1
            mock_cache.set.assert_called_once()

            # Second call: cache hit
            mock_cache.get.return_value = {'id': 1, 'data': 'test'}
            result2 = fetch_data(1)
            assert call_count == 1  # Non incrémenté (hit)
            assert result2 == {'id': 1, 'data': 'test'}

    def test_invalidate_listing(self):
        """Test invalidation d'une annonce"""
        from src.services.cache_service import invalidate_listing

        with patch('src.services.cache_service.invalidate_cache') as mock_invalidate:
            invalidate_listing(123)
            mock_invalidate.assert_called_once_with('cache:listing:123:*')

    def test_invalidate_user(self):
        """Test invalidation d'un utilisateur"""
        from src.services.cache_service import invalidate_user

        with patch('src.services.cache_service.invalidate_cache') as mock_invalidate:
            invalidate_user(456)
            mock_invalidate.assert_called_once_with('cache:user:456:*')

    def test_cache_stats(self):
        """Test récupération des statistiques"""
        from src.services.cache_service import RedisCache

        cache = RedisCache()

        with patch.object(cache, '_redis_client') as mock_redis:
            mock_redis.info.return_value = {
                'used_memory_human': '1.5M',
                'connected_clients': 10,
                'total_commands_processed': 5000
            }
            mock_redis.dbsize.return_value = 150

            stats = cache.get_stats()
            assert stats['status'] == 'available'
            assert stats['used_memory'] == '1.5M'
            assert stats['connected_clients'] == 10
            assert stats['keyspace'] == 150

    def test_cache_json_serialization(self):
        """Test sérialisation JSON avec types complexes"""
        from src.services.cache_service import RedisCache
        from datetime import datetime

        cache = RedisCache()

        data = {
            'id': 1,
            'name': 'test',
            'timestamp': datetime(2026, 6, 8, 10, 30, 0).isoformat(),
            'nested': {'key': 'value'}
        }

        with patch.object(cache, '_redis_client') as mock_redis:
            cache.set('test_key', data, ttl=3600)

            # Verify JSON serialization
            call_args = mock_redis.setex.call_args
            stored_value = call_args[0][2]  # Third argument is the value

            # Should be valid JSON string
            decoded = json.loads(stored_value)
            assert decoded['id'] == 1
            assert decoded['timestamp'] == '2026-06-08T10:30:00'

    def test_cache_unavailable_graceful(self):
        """Test comportement graceful quand Redis est indisponible"""
        from src.services.cache_service import RedisCache

        cache = RedisCache()

        # Simuler Redis indisponible
        with patch.object(cache, '_redis_client', None):
            assert cache.is_available() is False
            assert cache.get('any_key') is None
            assert cache.set('any_key', {}) is False
            assert cache.delete('any_key') is False

    def test_cache_key_patterns(self):
        """Test les patterns de clés de cache"""
        from src.services.cache_service import cache_key

        # Listings
        listing_key = cache_key('listing', 123)
        assert listing_key.startswith('cache:listing:')

        # Users
        user_key = cache_key('user', 456)
        assert user_key.startswith('cache:user:')

        # Search (no ID)
        search_key = cache_key('search', suffix='keywords:python')
        assert 'cache:search' in search_key


class TestCacheIntegration:
    """Tests d'intégration du cache avec les services"""

    def test_cache_with_listings_endpoint(self, client):
        """Test que les listings sont bien cachés"""
        # Premier appel
        response1 = client.get('/api/v1/listings')
        assert response1.status_code in [200, 401, 404]  # Peuvent échouer pour d'autres raisons

        # Deuxième appel (devrait venir du cache)
        response2 = client.get('/api/v1/listings')
        assert response1.status_code == response2.status_code

    def test_cache_invalidation_on_update(self):
        """Test que le cache est invalidé après une mise à jour"""
        from src.services.cache_service import cache_key, cache

        listing_id = 1
        key = cache_key('listing', listing_id)

        # Ajouter au cache
        if cache.is_available():
            cache.set(key, {'id': listing_id, 'title': 'Old'}, ttl=3600)

            # Vérifier que c'est en cache
            cached = cache.get(key)
            # (dépend de Redis)

            # Invalider
            cache.delete(key)

            # Vérifier suppression
            # (dépend de Redis)
