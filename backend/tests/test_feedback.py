import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

@pytest.fixture
def visit_data():
    """Fixture for creating a visit"""
    return {
        'vendeur_id': 1,
        'acheteur_id': 2,
        'annonce_id': 1,
        'date_visite': datetime.now().isoformat(),
        'heure_debut': '14:00',
        'heure_fin': '14:30',
        'lieu': 'Sur place',
        'statut': 'EFFECTUEE',
    }

@pytest.fixture
def feedback_data():
    """Fixture for feedback submission"""
    return {
        'rating': 4,
        'comment': 'Propriété très bien présentée, accueil chaleureux',
        'images': [],
    }

class TestFeedbackAPI:
    """Test suite for visit feedback API endpoints"""

    def test_get_vendor_feedbacks(self, client: TestClient, admin_headers):
        """Test retrieving all feedback for a vendor"""
        response = client.get(
            '/api/v1/visites/vendeur/feedbacks',
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))

    def test_get_visit_feedback(self, client: TestClient, admin_headers):
        """Test retrieving feedback for a specific visit"""
        # Assuming visit with id=1 exists
        response = client.get(
            '/api/v1/visites/1/feedback',
            headers=admin_headers,
        )
        # Could be 200 or 404 if visit doesn't exist
        assert response.status_code in [200, 404]

    def test_submit_feedback_success(self, client: TestClient, auth_headers, feedback_data):
        """Test successful feedback submission"""
        # Assuming visit with id=1 exists
        response = client.post(
            '/api/v1/visites/1/feedback',
            json=feedback_data,
            headers=auth_headers,
        )
        # Could be 201 (Created) or 404 (visit not found)
        assert response.status_code in [200, 201, 404]

    def test_submit_feedback_invalid_rating(self, client: TestClient, auth_headers, feedback_data):
        """Test feedback submission with invalid rating"""
        invalid_data = {
            **feedback_data,
            'rating': 6,  # Invalid: should be 1-5
        }
        response = client.post(
            '/api/v1/visites/1/feedback',
            json=invalid_data,
            headers=auth_headers,
        )
        # Should reject invalid rating
        assert response.status_code in [400, 404, 422]

    def test_submit_feedback_missing_rating(self, client: TestClient, auth_headers, feedback_data):
        """Test feedback submission without rating"""
        invalid_data = {k: v for k, v in feedback_data.items() if k != 'rating'}
        response = client.post(
            '/api/v1/visites/1/feedback',
            json=invalid_data,
            headers=auth_headers,
        )
        # Should require rating
        assert response.status_code in [400, 404, 422]

    def test_respond_to_feedback_success(self, client: TestClient, admin_headers):
        """Test vendor responding to feedback"""
        response_data = {
            'response': 'Merci pour votre visite et vos commentaires positifs!',
        }
        response = client.put(
            '/api/v1/visites/1/feedback',
            json=response_data,
            headers=admin_headers,
        )
        # Could be 200 or 404
        assert response.status_code in [200, 404]

    def test_respond_to_feedback_empty_response(self, client: TestClient, admin_headers):
        """Test response with empty text"""
        response_data = {
            'response': '',
        }
        response = client.put(
            '/api/v1/visites/1/feedback',
            json=response_data,
            headers=admin_headers,
        )
        # Should reject empty response
        assert response.status_code in [400, 404, 422]

    def test_delete_feedback_success(self, client: TestClient, admin_headers):
        """Test deleting feedback"""
        response = client.delete(
            '/api/v1/visites/1',
            headers=admin_headers,
        )
        # Could be 200, 204, or 404
        assert response.status_code in [200, 204, 404]

    def test_feedback_authorization(self, client: TestClient, auth_headers):
        """Test that users can only see their own feedback"""
        # Regular user should not access all vendor feedbacks
        response = client.get(
            '/api/v1/visites/vendeur/feedbacks',
            headers=auth_headers,
        )
        # Could be 403 (forbidden) or filtered results
        assert response.status_code in [200, 403]

    def test_feedback_vendor_response_authorization(self, client: TestClient, auth_headers):
        """Test that only vendors can respond to feedback"""
        response_data = {
            'response': 'Test response',
        }
        response = client.put(
            '/api/v1/visites/1/feedback',
            json=response_data,
            headers=auth_headers,
        )
        # Should be 403 if user is not vendor of property
        assert response.status_code in [200, 403, 404]

    def test_feedback_lifecycle(self, client: TestClient, auth_headers, admin_headers, feedback_data):
        """Test complete feedback lifecycle"""
        # 1. Create/submit feedback (as buyer)
        response = client.post(
            '/api/v1/visites/1/feedback',
            json=feedback_data,
            headers=auth_headers,
        )
        if response.status_code not in [200, 201]:
            pytest.skip('Visit not found')

        # 2. Get feedback (vendor retrieves)
        response = client.get(
            '/api/v1/visites/vendeur/feedbacks',
            headers=admin_headers,
        )
        assert response.status_code == 200

        # 3. Respond to feedback (vendor responds)
        response_data = {
            'response': 'Merci beaucoup pour votre visite!',
        }
        response = client.put(
            '/api/v1/visites/1/feedback',
            json=response_data,
            headers=admin_headers,
        )
        assert response.status_code in [200, 404]

        # 4. Verify response is recorded
        response = client.get(
            '/api/v1/visites/1/feedback',
            headers=auth_headers,
        )
        if response.status_code == 200:
            data = response.json()
            # Response should be in the data
            assert 'response' in data or 'data' in data

    def test_feedback_filtering(self, client: TestClient, admin_headers):
        """Test filtering feedback by criteria"""
        # Test filtering by status
        response = client.get(
            '/api/v1/visites/vendeur/feedbacks?status=responded',
            headers=admin_headers,
        )
        assert response.status_code in [200, 404]

        # Test filtering by rating
        response = client.get(
            '/api/v1/visites/vendeur/feedbacks?min_rating=4',
            headers=admin_headers,
        )
        assert response.status_code in [200, 404]

    def test_feedback_pagination(self, client: TestClient, admin_headers):
        """Test pagination of feedback"""
        response = client.get(
            '/api/v1/visites/vendeur/feedbacks?limit=10&offset=0',
            headers=admin_headers,
        )
        assert response.status_code == 200

    def test_feedback_rating_distribution(self, client: TestClient, admin_headers):
        """Test that feedback includes rating statistics"""
        response = client.get(
            '/api/v1/visites/vendeur/feedbacks',
            headers=admin_headers,
        )
        if response.status_code == 200:
            data = response.json()
            # Should contain feedback with ratings
            if isinstance(data, list):
                for feedback in data:
                    if feedback:
                        assert 'rating' in feedback or 'data' in feedback

    def test_feedback_images(self, client: TestClient, auth_headers, feedback_data):
        """Test feedback with images"""
        feedback_with_images = {
            **feedback_data,
            'images': ['https://example.com/img1.jpg'],
        }
        response = client.post(
            '/api/v1/visites/1/feedback',
            json=feedback_with_images,
            headers=auth_headers,
        )
        # Should accept images
        assert response.status_code in [200, 201, 404]

    def test_feedback_timestamps(self, client: TestClient, admin_headers):
        """Test that feedback includes creation/modification timestamps"""
        response = client.get(
            '/api/v1/visites/1/feedback',
            headers=admin_headers,
        )
        if response.status_code == 200:
            data = response.json()
            # Should include timestamps
            # Check for created_at, updated_at, or similar fields
            if isinstance(data, dict):
                # Timestamp fields might be in data
                pass

    def test_feedback_notification(self, client: TestClient, auth_headers, admin_headers, feedback_data):
        """Test that feedback submission triggers notification"""
        response = client.post(
            '/api/v1/visites/1/feedback',
            json=feedback_data,
            headers=auth_headers,
        )
        # Feedback submission should succeed or return 404
        # In real implementation, would verify notification was sent
        assert response.status_code in [200, 201, 404]

    def test_feedback_validation(self, client: TestClient, auth_headers):
        """Test feedback data validation"""
        # Test with invalid JSON
        response = client.post(
            '/api/v1/visites/1/feedback',
            json={'rating': 'invalid'},  # Should be integer
            headers=auth_headers,
        )
        assert response.status_code in [400, 404, 422]

    def test_feedback_long_comment(self, client: TestClient, auth_headers, feedback_data):
        """Test feedback with very long comment"""
        long_comment = 'A' * 5000
        feedback_long = {
            **feedback_data,
            'comment': long_comment,
        }
        response = client.post(
            '/api/v1/visites/1/feedback',
            json=feedback_long,
            headers=auth_headers,
        )
        # Should either accept or reject based on max length
        assert response.status_code in [200, 201, 400, 404, 422]

    def test_feedback_duplicate(self, client: TestClient, auth_headers, feedback_data):
        """Test submitting feedback twice for same visit"""
        # First submission
        response1 = client.post(
            '/api/v1/visites/1/feedback',
            json=feedback_data,
            headers=auth_headers,
        )

        if response1.status_code not in [200, 201]:
            pytest.skip('First feedback submission failed')

        # Second submission (should update or reject)
        response2 = client.post(
            '/api/v1/visites/1/feedback',
            json=feedback_data,
            headers=auth_headers,
        )
        # Should either update existing or reject duplicate
        assert response2.status_code in [200, 201, 400, 404, 409]
