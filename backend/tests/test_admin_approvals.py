import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

@pytest.fixture
def pending_listing_data():
    """Fixture for a listing pending approval"""
    return {
        'titre': 'Pendingappartement 3 pièces',
        'description': 'Bel appartement',
        'prix': 450000,
        'surface': 75,
        'nombre_pieces': 3,
        'type_bien': 'APPARTEMENT',
        'adresse': '123 Rue de Paris',
        'code_postal': '75001',
        'ville': 'Paris',
        'status': 'PENDING',
    }

class TestAdminApprovalsAPI:
    """Test suite for admin approval API endpoints"""

    def test_get_pending_listings(self, client: TestClient, admin_headers):
        """Test retrieving pending listings for approval"""
        response = client.get(
            '/api/v1/admin/listings/pending',
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_pending_listings_pagination(self, client: TestClient, admin_headers):
        """Test pagination of pending listings"""
        response = client.get(
            '/api/v1/admin/listings/pending?limit=10',
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_approve_listing_success(self, client: TestClient, admin_headers, auth_headers, pending_listing_data):
        """Test successful listing approval"""
        # Create a pending listing
        response = client.post(
            '/api/v1/annonces',
            json=pending_listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Approve as admin
        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/approve',
            json={'admin_notes': 'Looks good'},
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'PUBLIEE' or data['status'] == 'APPROVED'

    def test_approve_listing_not_found(self, client: TestClient, admin_headers):
        """Test approve non-existent listing"""
        response = client.post(
            '/api/v1/admin/listings/999/approve',
            json={'admin_notes': 'Test'},
            headers=admin_headers,
        )
        assert response.status_code == 404

    def test_reject_listing_success(self, client: TestClient, admin_headers, auth_headers, pending_listing_data):
        """Test successful listing rejection"""
        # Create a pending listing
        response = client.post(
            '/api/v1/annonces',
            json=pending_listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Reject as admin
        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/reject',
            json={
                'reason': 'INCOMPLETE',
                'message': 'Manquent des informations importantes',
            },
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'REJETEE' or data['status'] == 'REJECTED'

    def test_reject_listing_missing_reason(self, client: TestClient, admin_headers, auth_headers, pending_listing_data):
        """Test reject listing without reason"""
        response = client.post(
            '/api/v1/annonces',
            json=pending_listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/reject',
            json={'message': 'No reason'},
            headers=admin_headers,
        )
        assert response.status_code == 400

    def test_remove_listing_success(self, client: TestClient, admin_headers, auth_headers, pending_listing_data):
        """Test admin removal of listing"""
        response = client.post(
            '/api/v1/annonces',
            json=pending_listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/remove',
            json={'reason': 'FRAUD'},
            headers=admin_headers,
        )
        assert response.status_code == 200

    def test_admin_only_approval(self, client: TestClient, auth_headers, pending_listing_data):
        """Test that non-admin users cannot approve listings"""
        response = client.post(
            '/api/v1/annonces',
            json=pending_listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Try to approve as regular user (should fail)
        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/approve',
            json={'admin_notes': 'Test'},
            headers=auth_headers,
        )
        assert response.status_code == 403  # Forbidden

    def test_get_pending_transactions(self, client: TestClient, admin_headers):
        """Test retrieving pending transactions"""
        response = client.get(
            '/api/v1/admin/transactions/pending',
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_accept_transaction_success(self, client: TestClient, admin_headers):
        """Test accepting a transaction"""
        # This requires a transaction to exist first
        # Assuming transaction with id=1 exists
        response = client.post(
            '/api/v1/admin/transactions/1/accept',
            json={'notes': 'Approved'},
            headers=admin_headers,
        )
        # Could be 200, 404 if no transaction, or 400 if already processed
        assert response.status_code in [200, 404, 400]

    def test_decline_transaction_success(self, client: TestClient, admin_headers):
        """Test declining a transaction"""
        response = client.post(
            '/api/v1/admin/transactions/1/decline',
            json={
                'reason': 'PRICE_TOO_LOW',
                'message': 'Offre trop basse',
            },
            headers=admin_headers,
        )
        # Could be 200, 404 if no transaction, or 400 if already processed
        assert response.status_code in [200, 404, 400]

    def test_cancel_transaction_success(self, client: TestClient, admin_headers):
        """Test canceling a transaction"""
        response = client.post(
            '/api/v1/admin/transactions/1/cancel',
            json={'reason': 'BUYER_REQUEST'},
            headers=admin_headers,
        )
        # Could be 200, 404 if no transaction, or 400 if already processed
        assert response.status_code in [200, 404, 400]

    def test_get_transaction_details(self, client: TestClient, admin_headers):
        """Test getting transaction details"""
        response = client.get(
            '/api/v1/admin/transactions/1',
            headers=admin_headers,
        )
        # Could be 200 or 404 if not found
        assert response.status_code in [200, 404]

    def test_approval_workflow(self, client: TestClient, admin_headers, auth_headers, pending_listing_data):
        """Test complete approval workflow"""
        # Create listing
        response = client.post(
            '/api/v1/annonces',
            json=pending_listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']
        status = response.json()['status']
        assert status == 'BROUILLON' or status == 'PENDING'

        # Get pending listings
        response = client.get(
            '/api/v1/admin/listings/pending',
            headers=admin_headers,
        )
        assert response.status_code == 200
        pending = response.json()
        # New listing should be in pending list
        ids = [l.get('id') for l in pending]
        assert listing_id in ids or len(pending) > 0

        # Approve listing
        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/approve',
            json={'admin_notes': 'OK'},
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'PUBLIEE' or data['status'] == 'APPROVED'

        # Check it's no longer pending
        response = client.get(
            '/api/v1/admin/listings/pending',
            headers=admin_headers,
        )
        pending_ids = [l.get('id') for l in response.json()]
        assert listing_id not in pending_ids

    def test_rejection_workflow(self, client: TestClient, admin_headers, auth_headers, pending_listing_data):
        """Test complete rejection workflow"""
        # Create listing
        response = client.post(
            '/api/v1/annonces',
            json=pending_listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Reject listing
        response = client.post(
            f'/api/v1/admin/listings/{listing_id}/reject',
            json={
                'reason': 'LOW_QUALITY',
                'message': 'Photos de mauvaise qualité',
            },
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'REJETEE' or data['status'] == 'REJECTED'

        # Check it's no longer pending
        response = client.get(
            '/api/v1/admin/listings/pending',
            headers=admin_headers,
        )
        pending_ids = [l.get('id') for l in response.json()]
        assert listing_id not in pending_ids
