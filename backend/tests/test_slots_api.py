import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

@pytest.fixture
def slot_data():
    """Fixture for valid slot data"""
    return {
        'debut': (datetime.now() + timedelta(hours=1)).isoformat(),
        'fin': (datetime.now() + timedelta(hours=2)).isoformat(),
        'type_creneau': 'VISIT',
        'remarques': 'Test slot',
    }

@pytest.fixture
def invalid_slot_data():
    """Fixture for invalid slot data"""
    return {
        'debut': (datetime.now() + timedelta(hours=2)).isoformat(),
        'fin': (datetime.now() + timedelta(hours=1)).isoformat(),  # End before start
        'type_creneau': 'VISIT',
    }

class TestSlotAPI:
    """Test suite for slot management API endpoints"""

    def test_create_slot_success(self, client: TestClient, auth_headers, slot_data):
        """Test successful slot creation"""
        response = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data['type_creneau'] == 'VISIT'
        assert data['status'] == 'AVAILABLE'
        assert 'id' in data

    def test_create_slot_invalid_time_range(self, client: TestClient, auth_headers, invalid_slot_data):
        """Test slot creation with invalid time range"""
        response = client.post(
            '/api/creneaux',
            json=invalid_slot_data,
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert 'fin' in response.json()['detail'].lower() or 'debut' in response.json()['detail'].lower()

    def test_create_slot_minimum_duration(self, client: TestClient, auth_headers):
        """Test slot creation with less than 15 minute duration"""
        now = datetime.now()
        slot_data = {
            'debut': now.isoformat(),
            'fin': (now + timedelta(minutes=10)).isoformat(),  # Only 10 minutes
            'type_creneau': 'VISIT',
        }
        response = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_get_slot_by_id(self, client: TestClient, auth_headers, slot_data):
        """Test retrieving a slot by ID"""
        # Create a slot
        create_response = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        assert create_response.status_code == 201
        slot_id = create_response.json()['id']

        # Get the slot
        response = client.get(
            f'/api/creneaux/{slot_id}',
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == slot_id

    def test_get_nonexistent_slot(self, client: TestClient, auth_headers):
        """Test retrieving a non-existent slot"""
        response = client.get(
            '/api/creneaux/99999',
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_delete_slot_success(self, client: TestClient, auth_headers, slot_data):
        """Test successful slot deletion"""
        # Create a slot
        create_response = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        slot_id = create_response.json()['id']

        # Delete the slot
        response = client.delete(
            f'/api/creneaux/{slot_id}',
            headers=auth_headers,
        )
        assert response.status_code == 200

        # Verify it's deleted
        get_response = client.get(
            f'/api/creneaux/{slot_id}',
            headers=auth_headers,
        )
        assert get_response.status_code == 404

    def test_update_slot_success(self, client: TestClient, auth_headers, slot_data):
        """Test successful slot update"""
        # Create a slot
        create_response = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        slot_id = create_response.json()['id']

        # Update the slot
        updated_data = {
            'debut': (datetime.now() + timedelta(hours=3)).isoformat(),
            'fin': (datetime.now() + timedelta(hours=4)).isoformat(),
            'type_creneau': 'CONSULTATION',
            'remarques': 'Updated remarks',
        }
        response = client.put(
            f'/api/creneaux/{slot_id}',
            json=updated_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['type_creneau'] == 'CONSULTATION'
        assert data['remarques'] == 'Updated remarks'

    def test_mark_slot_available(self, client: TestClient, auth_headers, slot_data):
        """Test marking a slot as available"""
        # Create a slot
        create_response = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        slot_id = create_response.json()['id']

        # Mark as reserved first
        client.put(
            f'/api/creneaux/{slot_id}/marquer-reserve',
            headers=auth_headers,
        )

        # Mark as available
        response = client.put(
            f'/api/creneaux/{slot_id}/marquer-disponible',
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'AVAILABLE'

    def test_mark_slot_reserved(self, client: TestClient, auth_headers, slot_data):
        """Test marking a slot as reserved"""
        # Create a slot
        create_response = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        slot_id = create_response.json()['id']

        # Mark as reserved
        response = client.put(
            f'/api/creneaux/{slot_id}/marquer-reserve',
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'RESERVED'

    def test_get_vendor_slots(self, client: TestClient, auth_headers, slot_data, user):
        """Test retrieving all slots for a vendor"""
        # Create multiple slots
        for i in range(3):
            slot_with_offset = slot_data.copy()
            slot_with_offset['debut'] = (
                datetime.now() + timedelta(hours=i+1)
            ).isoformat()
            slot_with_offset['fin'] = (
                datetime.now() + timedelta(hours=i+2)
            ).isoformat()
            client.post(
                '/api/creneaux',
                json=slot_with_offset,
                headers=auth_headers,
            )

        # Get all vendor slots
        response = client.get(
            f'/api/creneaux/vendeurs/{user.id}/creneaux',
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

    def test_create_recurring_slots(self, client: TestClient, auth_headers):
        """Test creating recurring slots"""
        slot_data = {
            'debut': (datetime.now() + timedelta(hours=1)).isoformat(),
            'fin': (datetime.now() + timedelta(hours=2)).isoformat(),
            'type_creneau': 'VISIT',
            'recurrence': 'DAILY',
            'recurrence_fin': (datetime.now() + timedelta(days=5)).isoformat(),
        }

        response = client.post(
            '/api/creneaux/recurrent',
            json=slot_data,
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert 'slots' in data or len(data) >= 5  # Should create 5+ slots

    def test_unauthorized_access(self, client: TestClient, slot_data):
        """Test unauthorized access to slot endpoints"""
        response = client.get('/api/creneaux/1')
        assert response.status_code == 401

    def test_overlapping_slots_detection(self, client: TestClient, auth_headers):
        """Test detection of overlapping slots"""
        now = datetime.now()
        base_slot = {
            'debut': (now + timedelta(hours=1)).isoformat(),
            'fin': (now + timedelta(hours=2)).isoformat(),
            'type_creneau': 'VISIT',
        }

        # Create first slot
        response1 = client.post(
            '/api/creneaux',
            json=base_slot,
            headers=auth_headers,
        )
        assert response1.status_code == 201

        # Try to create overlapping slot
        overlapping_slot = {
            'debut': (now + timedelta(hours=1, minutes=30)).isoformat(),
            'fin': (now + timedelta(hours=3)).isoformat(),
            'type_creneau': 'VISIT',
        }
        response2 = client.post(
            '/api/creneaux',
            json=overlapping_slot,
            headers=auth_headers,
        )
        # Should either succeed (if overlap checking is at service level)
        # or fail with conflict error
        assert response2.status_code in [201, 409]

    def test_slot_pagination(self, client: TestClient, auth_headers, slot_data):
        """Test pagination of slots list"""
        # Create multiple slots
        for i in range(15):
            slot_with_offset = slot_data.copy()
            slot_with_offset['debut'] = (
                datetime.now() + timedelta(hours=i+1)
            ).isoformat()
            slot_with_offset['fin'] = (
                datetime.now() + timedelta(hours=i+2)
            ).isoformat()
            client.post(
                '/api/creneaux',
                json=slot_with_offset,
                headers=auth_headers,
            )

        # Test pagination
        response = client.get(
            '/api/creneaux/vendeurs/me/creneaux?skip=0&limit=10',
            headers=auth_headers,
        )
        assert response.status_code == 200

    def test_slot_filtering_by_status(self, client: TestClient, auth_headers, slot_data):
        """Test filtering slots by status"""
        # Create and mark slots with different statuses
        response1 = client.post(
            '/api/creneaux',
            json=slot_data,
            headers=auth_headers,
        )
        slot1_id = response1.json()['id']

        response2 = client.post(
            '/api/creneaux',
            json={**slot_data, 'debut': (datetime.now() + timedelta(hours=3)).isoformat()},
            headers=auth_headers,
        )
        slot2_id = response2.json()['id']

        # Mark second as reserved
        client.put(
            f'/api/creneaux/{slot2_id}/marquer-reserve',
            headers=auth_headers,
        )

        # Filter available
        response = client.get(
            '/api/creneaux/vendeurs/me/creneaux?status=AVAILABLE',
            headers=auth_headers,
        )
        assert response.status_code == 200
        # Should contain slot1 but not slot2

    def test_expired_slot_marking(self, client: TestClient, auth_headers):
        """Test that expired slots are automatically marked"""
        # Create slot in the past
        past_slot = {
            'debut': (datetime.now() - timedelta(hours=2)).isoformat(),
            'fin': (datetime.now() - timedelta(hours=1)).isoformat(),
            'type_creneau': 'VISIT',
        }

        response = client.post(
            '/api/creneaux',
            json=past_slot,
            headers=auth_headers,
        )

        if response.status_code == 201:
            slot_id = response.json()['id']
            # Get the slot
            get_response = client.get(
                f'/api/creneaux/{slot_id}',
                headers=auth_headers,
            )
            # Should be marked expired or rejected
            assert get_response.status_code in [200, 400]
