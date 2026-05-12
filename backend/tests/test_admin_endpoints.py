"""
Tests pour tous les endpoints administrateur (28 endpoints)
Tâches 1-6: Dashboard, Utilisateurs, Annonces, Transactions, Paramètres, Analytics
"""

import pytest
import json
from datetime import datetime, timedelta

# Fixture pour le client de test
@pytest.fixture
def client(app, db):
    """Client de test Flask"""
    return app.test_client()

@pytest.fixture
def admin_token(client, db):
    """Token administrateur valide"""
    # Créer un admin de test
    from src.auth.models import User
    admin = User(
        email='test_admin@test.com',
        password='TestAdmin123!',
        nom='Admin',
        prenom='Test',
        role='admin'
    )
    db.session.add(admin)
    db.session.commit()

    # Générer token
    import jwt
    from datetime import datetime, timedelta
    secret = 'change-me-in-production'
    payload = {
        'user_id': admin.utilisateur_id,
        'email': admin.email,
        'role': 'admin',
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token

@pytest.fixture
def regular_user_token(client, db):
    """Token utilisateur régulier (non-admin)"""
    from src.auth.models import User
    user = User(
        email='test_user@test.com',
        password='TestUser123!',
        nom='User',
        prenom='Test',
        role='user'
    )
    db.session.add(user)
    db.session.commit()

    import jwt
    from datetime import datetime, timedelta
    secret = 'change-me-in-production'
    payload = {
        'user_id': user.utilisateur_id,
        'email': user.email,
        'role': 'user',
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token

# ============================================================================
# TÂCHE 1: DASHBOARD ADMIN (1 endpoint)
# ============================================================================

class TestDashboard:
    """Tests pour GET /admin/dashboard"""

    def test_dashboard_unauthorized(self, client):
        """Sans token -> 401"""
        response = client.get('/api/v1/admin/dashboard')
        assert response.status_code == 401

    def test_dashboard_forbidden_regular_user(self, client, regular_user_token):
        """Utilisateur régulier -> 403"""
        response = client.get(
            '/api/v1/admin/dashboard',
            headers={'Authorization': f'Bearer {regular_user_token}'}
        )
        assert response.status_code == 403

    def test_dashboard_success(self, client, admin_token):
        """Admin -> 200 avec données"""
        response = client.get(
            '/api/v1/admin/dashboard',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']

        # Vérifier structure
        assert 'utilisateurs' in data
        assert 'annonces' in data
        assert 'offres' in data
        assert 'revenus' in data

        # Vérifier types
        assert isinstance(data['utilisateurs'], dict)
        assert 'total' in data['utilisateurs']
        assert 'actifs_derniers_30_jours' in data['utilisateurs']


# ============================================================================
# TÂCHE 2: GESTION UTILISATEURS (7 endpoints)
# ============================================================================

class TestUsersManagement:
    """Tests pour endpoints utilisateurs"""

    def test_list_users_unauthorized(self, client):
        """GET /utilisateurs sans token -> 401"""
        response = client.get('/api/v1/admin/utilisateurs')
        assert response.status_code == 401

    def test_list_users_forbidden(self, client, regular_user_token):
        """GET /utilisateurs non-admin -> 403"""
        response = client.get(
            '/api/v1/admin/utilisateurs',
            headers={'Authorization': f'Bearer {regular_user_token}'}
        )
        assert response.status_code == 403

    def test_list_users_success(self, client, admin_token, db):
        """GET /utilisateurs admin -> 200"""
        # Créer un utilisateur de test
        from src.auth.models import User
        user = User(
            email='user@test.com',
            password='Test123!',
            nom='Dupont',
            prenom='Jean'
        )
        db.session.add(user)
        db.session.commit()

        response = client.get(
            '/api/v1/admin/utilisateurs?skip=0&limit=20',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'utilisateurs' in data
        assert isinstance(data['utilisateurs'], list)

    def test_search_users(self, client, admin_token, db):
        """GET /utilisateurs/search -> 200"""
        from src.auth.models import User
        user = User(
            email='search@test.com',
            password='Test123!',
            nom='Recherche'
        )
        db.session.add(user)
        db.session.commit()

        response = client.get(
            '/api/v1/admin/utilisateurs/search?q=search',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert len(data) > 0

    def test_get_user_by_id(self, client, admin_token, db):
        """GET /utilisateurs/{id} -> 200"""
        from src.auth.models import User
        user = User(
            email='getuser@test.com',
            password='Test123!',
            nom='GetUser'
        )
        db.session.add(user)
        db.session.commit()

        response = client.get(
            f'/api/v1/admin/utilisateurs/{user.utilisateur_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert data['utilisateur_id'] == user.utilisateur_id

    def test_change_role(self, client, admin_token, db):
        """POST /utilisateurs/{id}/role -> 200"""
        from src.auth.models import User
        user = User(
            email='changerole@test.com',
            password='Test123!',
            role='user'
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.utilisateur_id

        response = client.post(
            f'/api/v1/admin/utilisateurs/{user_id}/role',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={}
        )
        assert response.status_code == 200

        # Vérifier que le rôle a changé
        db.session.refresh(user)
        assert user.role == 'admin'

    def test_suspend_user(self, client, admin_token, db):
        """POST /utilisateurs/{id}/suspend -> 200"""
        from src.auth.models import User
        user = User(
            email='suspend@test.com',
            password='Test123!'
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.utilisateur_id

        response = client.post(
            f'/api/v1/admin/utilisateurs/{user_id}/suspend',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'duration_hours': 48}
        )
        assert response.status_code == 200

        # Vérifier que l'utilisateur est suspendu
        db.session.refresh(user)
        assert user.actif == False

    def test_reactivate_user(self, client, admin_token, db):
        """POST /utilisateurs/{id}/reactivate -> 200"""
        from src.auth.models import User
        user = User(
            email='reactivate@test.com',
            password='Test123!',
            actif=False
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.utilisateur_id

        response = client.post(
            f'/api/v1/admin/utilisateurs/{user_id}/reactivate',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={}
        )
        assert response.status_code == 200

        # Vérifier que l'utilisateur est réactivé
        db.session.refresh(user)
        assert user.actif == True

    def test_delete_user(self, client, admin_token, db):
        """DELETE /utilisateurs/{id} -> 200"""
        from src.auth.models import User
        user = User(
            email='delete@test.com',
            password='Test123!'
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.utilisateur_id

        response = client.delete(
            f'/api/v1/admin/utilisateurs/{user_id}?confirm=true',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200

        # Vérifier que l'utilisateur est supprimé
        deleted_user = db.session.get(User, user_id)
        assert deleted_user is None


# ============================================================================
# TÂCHE 3: MODÉRATION ANNONCES (4 endpoints)
# ============================================================================

class TestListingsModeration:
    """Tests pour endpoints modération annonces"""

    def test_get_pending_listings(self, client, admin_token, db):
        """GET /listings/pending -> 200"""
        from src.models.annonces import Annonce
        from src.auth.models import User

        user = User(email='vendor@test.com', password='Test123!')
        db.session.add(user)
        db.session.commit()

        listing = Annonce(
            titre='Test Listing',
            prix=300000,
            utilisateur_id=user.utilisateur_id,
            statut='brouillon'
        )
        db.session.add(listing)
        db.session.commit()

        response = client.get(
            '/api/v1/admin/listings/pending',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'brouillons' in data

    def test_approve_listing(self, client, admin_token, db):
        """POST /listings/{id}/approve -> 200"""
        from src.models.annonces import Annonce
        from src.auth.models import User

        user = User(email='vendor2@test.com', password='Test123!')
        db.session.add(user)
        db.session.commit()

        listing = Annonce(
            titre='Approve Test',
            prix=250000,
            utilisateur_id=user.utilisateur_id,
            statut='brouillon'
        )
        db.session.add(listing)
        db.session.commit()
        listing_id = listing.annonce_id

        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/approve',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={}
        )
        assert response.status_code == 200

        # Vérifier statut
        db.session.refresh(listing)
        assert listing.statut == 'publiée'

    def test_reject_listing(self, client, admin_token, db):
        """POST /listings/{id}/reject -> 200"""
        from src.models.annonces import Annonce
        from src.auth.models import User

        user = User(email='vendor3@test.com', password='Test123!')
        db.session.add(user)
        db.session.commit()

        listing = Annonce(
            titre='Reject Test',
            prix=350000,
            utilisateur_id=user.utilisateur_id,
            statut='brouillon'
        )
        db.session.add(listing)
        db.session.commit()
        listing_id = listing.annonce_id

        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/reject',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'reason': 'Contenu inapproprié'}
        )
        assert response.status_code == 200

        # Vérifier statut
        db.session.refresh(listing)
        assert listing.statut == 'archivée'

    def test_remove_listing(self, client, admin_token, db):
        """POST /listings/{id}/remove -> 200"""
        from src.models.annonces import Annonce
        from src.auth.models import User

        user = User(email='vendor4@test.com', password='Test123!')
        db.session.add(user)
        db.session.commit()

        listing = Annonce(
            titre='Remove Test',
            prix=400000,
            utilisateur_id=user.utilisateur_id,
            statut='publiée'
        )
        db.session.add(listing)
        db.session.commit()
        listing_id = listing.annonce_id

        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/remove',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={}
        )
        assert response.status_code == 200


# ============================================================================
# TÂCHE 4: GESTION TRANSACTIONS (5 endpoints)
# ============================================================================

class TestTransactionsManagement:
    """Tests pour endpoints transactions"""

    def test_list_transactions(self, client, admin_token):
        """GET /transactions -> 200"""
        response = client.get(
            '/api/v1/admin/transactions',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'offres' in data

    def test_get_transaction_by_id(self, client, admin_token, db):
        """GET /transactions/{id} -> 200"""
        # Créer une transaction de test
        from src.models.offres import Offre
        from src.auth.models import User
        from src.models.annonces import Annonce

        user = User(email='buyer@test.com', password='Test123!')
        vendor = User(email='vendor5@test.com', password='Test123!')
        db.session.add(user)
        db.session.add(vendor)
        db.session.commit()

        listing = Annonce(
            titre='Transaction Test',
            prix=500000,
            utilisateur_id=vendor.utilisateur_id,
            statut='publiée'
        )
        db.session.add(listing)
        db.session.commit()

        offre = Offre(
            annonce_id=listing.annonce_id,
            acheteur_id=user.utilisateur_id,
            prix_propose=480000,
            statut='proposee'
        )
        db.session.add(offre)
        db.session.commit()
        offre_id = offre.offre_id

        response = client.get(
            f'/api/v1/admin/transactions/{offre_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert data['offre_id'] == offre_id

    def test_accept_transaction(self, client, admin_token, db):
        """POST /transactions/{id}/accept -> 200"""
        from src.models.offres import Offre
        from src.auth.models import User
        from src.models.annonces import Annonce

        user = User(email='buyer2@test.com', password='Test123!')
        vendor = User(email='vendor6@test.com', password='Test123!')
        db.session.add(user)
        db.session.add(vendor)
        db.session.commit()

        listing = Annonce(
            titre='Accept Test',
            prix=450000,
            utilisateur_id=vendor.utilisateur_id,
            statut='publiée'
        )
        db.session.add(listing)
        db.session.commit()

        offre = Offre(
            annonce_id=listing.annonce_id,
            acheteur_id=user.utilisateur_id,
            prix_propose=440000,
            statut='proposee'
        )
        db.session.add(offre)
        db.session.commit()
        offre_id = offre.offre_id

        response = client.post(
            f'/api/v1/admin/transactions/{offre_id}/accept',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={}
        )
        assert response.status_code == 200

        # Vérifier statut
        db.session.refresh(offre)
        assert offre.statut == 'acceptee'


# ============================================================================
# TÂCHE 5: PARAMÈTRES SYSTÈME (4 endpoints)
# ============================================================================

class TestSystemSettings:
    """Tests pour endpoints paramètres"""

    def test_list_settings(self, client, admin_token):
        """GET /settings -> 200"""
        response = client.get(
            '/api/v1/admin/settings',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'parametres' in data
        assert len(data['parametres']) > 0

    def test_get_setting_by_key(self, client, admin_token):
        """GET /settings/{key} -> 200"""
        response = client.get(
            '/api/v1/admin/settings/email_notifications_enabled',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']
        assert data['cle_parametre'] == 'email_notifications_enabled'

    def test_update_setting(self, client, admin_token):
        """POST /settings/{key} -> 200"""
        response = client.post(
            '/api/v1/admin/settings/rate_limit_requests_per_hour',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'valeur_parametre': 2000}
        )
        assert response.status_code == 200

        # Vérifier que la mise à jour a fonctionné
        get_response = client.get(
            '/api/v1/admin/settings/rate_limit_requests_per_hour',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        data = get_response.get_json()['data']
        assert int(data['valeur_parametre']) == 2000

    def test_reset_settings(self, client, admin_token):
        """POST /settings/reset -> 200"""
        response = client.post(
            '/api/v1/admin/settings/reset',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'confirm': True}
        )
        assert response.status_code == 200


# ============================================================================
# TÂCHE 6: ANALYTICS (4 endpoints)
# ============================================================================

class TestAnalytics:
    """Tests pour endpoints analytics"""

    def test_analytics_summary(self, client, admin_token):
        """GET /analytics/summary -> 200"""
        response = client.get(
            '/api/v1/admin/analytics/summary',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']

        assert 'periode' in data
        assert 'utilisateurs' in data
        assert 'annonces' in data
        assert 'offres' in data
        assert 'revenus' in data

    def test_analytics_users(self, client, admin_token):
        """GET /analytics/users -> 200"""
        response = client.get(
            '/api/v1/admin/analytics/users?days=30',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']

        assert 'total_users' in data
        assert 'repartition_roles' in data
        assert 'utilisateurs_actifs' in data
        assert 'top_vendeurs' in data

    def test_analytics_listings(self, client, admin_token):
        """GET /analytics/listings -> 200"""
        response = client.get(
            '/api/v1/admin/analytics/listings',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']

        assert 'total' in data
        assert 'par_statut' in data
        assert 'par_type' in data
        assert 'prix' in data

    def test_analytics_transactions(self, client, admin_token):
        """GET /analytics/transactions -> 200"""
        response = client.get(
            '/api/v1/admin/analytics/transactions',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()['data']

        assert 'total' in data
        assert 'par_statut' in data
        assert 'taux_conversion_pct' in data
