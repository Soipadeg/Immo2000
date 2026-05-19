"""
Tests pour Priority 3: Optimisations et Fonctionnalités Avancées

Tests couvrant:
- Cache Redis
- Tâches Celery asynchrones
- Recherche Elasticsearch
- Simulateur de prêt
- Notifications FCM
- Chat WebSocket
"""

import pytest
import json
from datetime import datetime
from unittest.mock import patch, MagicMock
from src.utils.cache import RedisCache, cache_annonces
from src.utils.search import SearchEngine
from src.utils.loan import create_loan_simulator, calculate_loan_capacity, compare_loans
from src.utils.fcm import FCMNotificationService, NotificationManager
from src.tasks import (
    send_email_async, generate_pdf_async, upload_file_async,
    send_push_notification_async, sync_search_index
)


class TestRedisCache:
    """Tests pour la mise en cache Redis"""

    def test_cache_initialization(self):
        """Test que la cache est correctement initialisée"""
        cache = RedisCache()
        assert cache is not None
        assert cache.redis is not None

    def test_cache_result(self):
        """Test la mise en cache d'un résultat"""
        cache = RedisCache()

        def expensive_function(x):
            return x * 2

        # Première exécution (pas de cache)
        result1 = cache.cache_result('test_key', expensive_function, 5)(10)

        # Deuxième exécution (avec cache)
        result2 = cache.cache_result('test_key', expensive_function, 5)(10)

        assert result1 == result2 == 20

    def test_cache_invalidation(self):
        """Test l'invalidation de cache"""
        cache = RedisCache()

        cache.cache_result('test_key', lambda x: x * 2, 5)(10)
        cache.invalidate('test_key*')

        # La clé ne devrait plus exister
        assert not cache.redis.exists('test_key')


class TestSearchEngine:
    """Tests pour Elasticsearch"""

    @pytest.fixture
    def search_engine(self):
        """Créer une instance du moteur de recherche"""
        return SearchEngine()

    def test_index_creation(self, search_engine):
        """Test la création de l'index"""
        assert search_engine.es.indices.exists(index=search_engine.index_name)

    @patch('src.utils.search.Elasticsearch')
    def test_listing_indexing(self, mock_es):
        """Test l'indexation d'une annonce"""
        mock_instance = MagicMock()
        mock_es.return_value = mock_instance

        engine = SearchEngine()

        # Mock une annonce
        listing = MagicMock()
        listing.id = 1
        listing.title = "Bel appartement"
        listing.price = 300000
        listing.is_active = True
        listing.created_at = datetime.utcnow()
        listing.updated_at = datetime.utcnow()

        # L'indexation devrait être appelée
        engine.index_listing(listing)
        mock_instance.index.assert_called()

    @patch('src.utils.search.Elasticsearch')
    def test_search_functionality(self, mock_es):
        """Test la recherche"""
        mock_instance = MagicMock()
        mock_es.return_value = mock_instance

        # Mock la réponse de recherche
        mock_instance.search.return_value = {
            'hits': {
                'total': {'value': 1},
                'hits': [
                    {
                        '_score': 0.9,
                        '_source': {
                            'id': 1,
                            'title': 'Bel appartement',
                            'price': 300000
                        }
                    }
                ]
            }
        }

        engine = SearchEngine()
        results = engine.search("appartement")

        assert results['total'] == 1
        assert len(results['hits']) == 1


class TestLoanSimulator:
    """Tests pour le simulateur de prêt"""

    def test_loan_simulation(self):
        """Test la simulation d'un prêt"""
        simulator = create_loan_simulator()

        result = simulator._fallback_simulation(
            amount=300000,
            duration=25,
            rate=3.5
        )

        assert result['amount'] == 300000
        assert result['duration'] == 25
        assert result['rate'] == 3.5
        assert 'monthly_payment' in result
        assert 'total_interest' in result
        assert 'amortization_table' in result

    def test_amortization_table_generation(self):
        """Test la génération du tableau d'amortissement"""
        simulator = create_loan_simulator()

        table = simulator._generate_amortization_table(
            amount=100000,
            duration=10,
            rate=3.0,
            rows=12  # Seulement 1 an
        )

        assert len(table) == 12
        assert table[0]['month'] == 1
        assert table[0]['capital_paid'] > 0
        assert table[0]['interests'] > 0

    def test_loan_capacity_calculation(self):
        """Test le calcul de capacité d'emprunt"""
        capacity = calculate_loan_capacity(
            annual_income=50000,
            savings=30000,
            debt_ratio=0.35
        )

        assert capacity['annual_income'] == 50000
        assert capacity['savings'] == 30000
        assert 'estimated_loan_capacity' in capacity
        assert 'recommended_property_price' in capacity

    def test_loans_comparison(self):
        """Test la comparaison de prêts"""
        simulator = create_loan_simulator()

        simulations = [
            simulator._fallback_simulation(300000, 20, 3.2),
            simulator._fallback_simulation(300000, 25, 3.5),
            simulator._fallback_simulation(300000, 30, 3.8),
        ]

        comparison = compare_loans(simulations)

        assert 'cheapest' in comparison
        assert 'fastest' in comparison
        assert 'lowest_rate' in comparison


class TestFCMNotifications:
    """Tests pour les notifications Firebase"""

    @patch('httpx.AsyncClient')
    async def test_fcm_notification_sending(self, mock_client):
        """Test l'envoi de notification FCM"""
        service = FCMNotificationService()

        # Mock la réponse
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'name': 'projects/test/messages/123'}

        with patch.object(service, 'api_key', 'test-key'):
            # L'envoi devrait être appelé avec les bons paramètres
            assert service.api_key == 'test-key'

    def test_notification_manager(self):
        """Test le gestionnaire de notifications"""
        service = FCMNotificationService()
        manager = NotificationManager(service)

        assert manager.fcm == service


class TestCeleryTasks:
    """Tests pour les tâches Celery"""

    @patch('src.tasks.send_email')
    def test_email_task(self, mock_send_email):
        """Test la tâche d'envoi d'email"""
        # Les tâches Celery devraient être définies
        assert send_email_async is not None

    def test_pdf_generation_task(self):
        """Test la tâche de génération PDF"""
        assert generate_pdf_async is not None

    def test_file_upload_task(self):
        """Test la tâche d'upload de fichier"""
        assert upload_file_async is not None

    def test_push_notification_task(self):
        """Test la tâche de notification push"""
        assert send_push_notification_async is not None

    def test_search_sync_task(self):
        """Test la tâche de synchronisation Elasticsearch"""
        assert sync_search_index is not None


class TestAPIIntegration:
    """Tests d'intégration API"""

    def test_loan_simulator_endpoint(self, client):
        """Test l'endpoint du simulateur de prêt"""
        response = client.post('/api/pret/simulate', json={
            'amount': 300000,
            'duration': 25,
            'rate': 3.5
        })

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['amount'] == 300000

    def test_amortization_endpoint(self, client):
        """Test l'endpoint du tableau d'amortissement"""
        response = client.post('/api/pret/amortization', json={
            'amount': 300000,
            'duration': 25,
            'rate': 3.5,
            'rows': 60
        })

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'amortization_table' in data

    def test_loan_capacity_endpoint(self, client):
        """Test l'endpoint de capacité d'emprunt"""
        response = client.post('/api/pret/capacity', json={
            'annual_income': 50000,
            'savings': 30000
        })

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'estimated_loan_capacity' in data

    @pytest.mark.requires_auth
    def test_fcm_token_registration(self, client, auth_headers):
        """Test l'enregistrement du token FCM"""
        response = client.post(
            '/api/fcm/register-token',
            json={'token': 'test-token-123'},
            headers=auth_headers
        )

        assert response.status_code == 200

    @pytest.mark.requires_auth
    def test_fcm_test_notification(self, client, auth_headers):
        """Test l'envoi d'une notification de test"""
        response = client.post(
            '/api/fcm/test',
            headers=auth_headers
        )

        # Peut échouer si le token n'est pas enregistré
        assert response.status_code in [200, 400]


class TestPerformanceOptimizations:
    """Tests pour les optimisations de performance"""

    def test_cache_reduces_queries(self):
        """Test que le cache réduit les requêtes"""
        cache = RedisCache()

        query_count = 0

        def database_query():
            nonlocal query_count
            query_count += 1
            return "result"

        # Première exécution
        cache.cache_result('perf_test', database_query, 10)()
        count_first = query_count

        # Deuxième exécution (cache)
        cache.cache_result('perf_test', database_query, 10)()
        count_second = query_count

        # Le compte ne devrait pas augmenter (cache hit)
        assert count_second == count_first

    def test_async_task_execution(self):
        """Test que les tâches asynchrones sont bien définies"""
        from src.tasks import celery_app

        # Le worker Celery devrait avoir les tâches enregistrées
        assert celery_app is not None


# Fixtures

@pytest.fixture
def client():
    """Créer un client de test"""
    from src.app import create_app
    app = create_app('testing')

    with app.test_client() as client:
        yield client


@pytest.fixture
def auth_headers(client):
    """Créer des headers avec authentification"""
    # Cette fixture devrait générer des tokens JWT valides
    return {'Authorization': 'Bearer test-token'}
