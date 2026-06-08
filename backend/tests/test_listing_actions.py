import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

@pytest.fixture
def listing_data():
    """Fixture for valid listing data"""
    return {
        'titre': 'Appartement 3 pièces Paris',
        'description': 'Magnifique appartement avec vue',
        'prix': 450000,
        'surface': 75,
        'nombre_pieces': 3,
        'type_bien': 'APPARTEMENT',
        'adresse': '123 Rue de Paris',
        'code_postal': '75001',
        'ville': 'Paris',
    }

@pytest.fixture
def published_listing_data():
    """Fixture for a published listing"""
    return {
        'titre': 'Maison 4 pièces Lyon',
        'description': 'Belle maison avec jardin',
        'prix': 380000,
        'surface': 120,
        'nombre_pieces': 4,
        'type_bien': 'MAISON',
        'adresse': '456 Avenue Fourvière',
        'code_postal': '69000',
        'ville': 'Lyon',
        'status': 'PUBLIEE',
    }

class TestListingLifecycleAPI:
    """Test suite for listing lifecycle management API endpoints"""

    def test_publish_listing_success(self, client: TestClient, auth_headers, listing_data):
        """Test successful listing publication"""
        # First create a listing
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
            headers=auth_headers,
        )
        assert response.status_code == 201
        listing_id = response.json()['id']

        # Then publish it
        response = client.post(
            f'/api/v1/annonces/{listing_id}/publier',
            json={'type': 'VENTE'},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'PUBLIEE'
        assert 'id' in data

    def test_publish_listing_missing_fields(self, client: TestClient, auth_headers):
        """Test publish with invalid data"""
        response = client.post(
            '/api/v1/annonces/999/publier',
            json={'type': 'VENTE'},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_archive_listing_success(self, client: TestClient, auth_headers, listing_data):
        """Test successful listing archival"""
        # Create and publish listing
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Publish it first
        client.post(
            f'/api/v1/annonces/{listing_id}/publier',
            json={'type': 'VENTE'},
            headers=auth_headers,
        )

        # Then archive it
        response = client.post(
            f'/api/v1/annonces/{listing_id}/archiver',
            json={'reason': 'Sold'},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'ARCHIVEE'

    def test_archive_listing_not_found(self, client: TestClient, auth_headers):
        """Test archive non-existent listing"""
        response = client.post(
            '/api/v1/annonces/999/archiver',
            json={'reason': 'Test'},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_mark_as_sold_success(self, client: TestClient, auth_headers, listing_data):
        """Test marking listing as sold"""
        # Create listing
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Mark as sold
        response = client.post(
            f'/api/v1/annonces/{listing_id}/vendre',
            json={
                'prix_vente': 450000,
                'date_vente': datetime.now().isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'VENDUE'
        assert data.get('prix_vente') == 450000

    def test_mark_as_sold_invalid_price(self, client: TestClient, auth_headers, listing_data):
        """Test mark as sold with invalid price"""
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Try invalid price
        response = client.post(
            f'/api/v1/annonces/{listing_id}/vendre',
            json={
                'prix_vente': -100,  # Invalid negative price
                'date_vente': datetime.now().isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_delete_listing_success(self, client: TestClient, auth_headers, listing_data):
        """Test successful listing deletion"""
        # Create listing
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Delete it
        response = client.delete(
            f'/api/v1/annonces/{listing_id}',
            headers=auth_headers,
        )
        assert response.status_code == 204 or response.status_code == 200

        # Verify it's deleted
        response = client.get(
            f'/api/v1/annonces/{listing_id}',
            headers=auth_headers,
        )
        # Should return 404 or have status SUPPRIMEE
        assert response.status_code == 404 or response.json().get('status') == 'SUPPRIMEE'

    def test_delete_listing_not_found(self, client: TestClient, auth_headers):
        """Test delete non-existent listing"""
        response = client.delete(
            '/api/v1/annonces/999',
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_listing_status_flow(self, client: TestClient, auth_headers, listing_data):
        """Test complete listing status flow"""
        # Create (BROUILLON)
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']
        assert response.json()['status'] == 'BROUILLON'

        # Publish (PUBLIEE)
        response = client.post(
            f'/api/v1/annonces/{listing_id}/publier',
            json={'type': 'VENTE'},
            headers=auth_headers,
        )
        assert response.json()['status'] == 'PUBLIEE'

        # Archive (ARCHIVEE)
        response = client.post(
            f'/api/v1/annonces/{listing_id}/archiver',
            json={'reason': 'Test'},
            headers=auth_headers,
        )
        assert response.json()['status'] == 'ARCHIVEE'

    def test_cannot_modify_other_user_listing(self, client: TestClient, auth_headers, other_auth_headers, listing_data):
        """Test that user cannot modify another user's listing"""
        # Create listing as user 1
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
            headers=auth_headers,
        )
        listing_id = response.json()['id']

        # Try to archive as user 2
        response = client.post(
            f'/api/v1/annonces/{listing_id}/archiver',
            json={'reason': 'Hacking attempt'},
            headers=other_auth_headers,
        )
        assert response.status_code == 403  # Forbidden

    def test_list_pending_listings_for_admin(self, client: TestClient, admin_headers, listing_data):
        """Test admin can list pending listings for approval"""
        response = client.get(
            '/api/v1/admin/listings/pending',
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_listing_detail(self, client: TestClient, listing_data):
        """Test getting listing detail view"""
        response = client.post(
            '/api/v1/annonces',
            json=listing_data,
        )
        listing_id = response.json()['id']

        response = client.get(f'/api/v1/annonces/{listing_id}')
        assert response.status_code == 200
        data = response.json()
        assert data['titre'] == listing_data['titre']
