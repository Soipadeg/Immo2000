"""
Tests for FastAPI migrated routers (Phase 6)

Validates that new FastAPI routers work correctly before
full migration from Flask.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


@pytest.fixture
def client():
    """Create test client for FastAPI app"""
    from src.main import create_app
    app = create_app("testing")
    return TestClient(app)


class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self, client):
        """Health endpoint should return ok"""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "immo2000-api"
        assert data["version"] == "6.0.0"


class TestAuthRouter:
    """Test FastAPI Auth router"""

    def test_register_success(self, client):
        """Register endpoint should create user"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Doe"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"

    def test_register_invalid_email(self, client):
        """Register with invalid email should fail"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Doe"
            }
        )
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_register_missing_field(self, client):
        """Register without required field should fail"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                # Missing password, first_name, last_name
            }
        )
        assert response.status_code == 422

    def test_login_success(self, client):
        """Login endpoint should return tokens"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user_id"] == 1

    def test_login_invalid_email(self, client):
        """Login with invalid email should fail validation"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "not-an-email",
                "password": "password123"
            }
        )
        assert response.status_code == 422

    def test_refresh_token_success(self, client):
        """Refresh token endpoint should return new token"""
        response = client.post(
            "/api/v1/auth/refresh-token",
            json={
                "refresh_token": "valid_refresh_token"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["expires_in"] == 3600

    def test_password_reset_request(self, client):
        """Password reset request should send email"""
        response = client.post(
            "/api/v1/auth/password-reset",
            json={
                "email": "test@example.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "test@example.com" in data["message"]

    def test_password_reset_confirm(self, client):
        """Password reset confirmation should update password"""
        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": "reset_token_123",
                "new_password": "NewPass456!"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestListingsRouter:
    """Test FastAPI Listings router"""

    def test_get_listings(self, client):
        """Get all listings should return list"""
        response = client.get("/api/v1/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_listings_with_filters(self, client):
        """Get listings with filters should apply them"""
        response = client.get(
            "/api/v1/listings?skip=0&limit=10&city=Paris&min_price=100000&max_price=500000"
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_listings_invalid_limit(self, client):
        """Invalid limit should fail validation"""
        response = client.get("/api/v1/listings?limit=200")  # > 100
        assert response.status_code == 422

    def test_create_listing_success(self, client):
        """Create listing should return created listing"""
        response = client.post(
            "/api/v1/listings",
            json={
                "title": "Beautiful apartment in Paris",
                "description": "A lovely 2-bedroom apartment with stunning city views and modern amenities.",
                "price": 500000,
                "property": {
                    "type": "apartment",
                    "rooms": 2,
                    "bathrooms": 1,
                    "area": 75.0,
                    "address": "123 Rue de la Paix",
                    "city": "Paris",
                    "postal_code": "75000"
                },
                "images": ["https://example.com/image1.jpg"],
                "features": ["elevator", "parking", "balcony"]
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Beautiful apartment in Paris"
        assert data["price"] == 500000
        assert data["property"]["city"] == "Paris"

    def test_create_listing_invalid_title(self, client):
        """Create listing with invalid title should fail"""
        response = client.post(
            "/api/v1/listings",
            json={
                "title": "Too",  # < 5 chars
                "description": "A lovely 2-bedroom apartment with stunning views.",
                "price": 500000,
                "property": {
                    "type": "apartment",
                    "rooms": 2,
                    "bathrooms": 1,
                    "area": 75.0,
                    "address": "123 Rue de la Paix",
                    "city": "Paris",
                    "postal_code": "75000"
                }
            }
        )
        assert response.status_code == 422

    def test_create_listing_invalid_price(self, client):
        """Create listing with invalid price should fail"""
        response = client.post(
            "/api/v1/listings",
            json={
                "title": "Beautiful apartment",
                "description": "A lovely 2-bedroom apartment with stunning views.",
                "price": -100,  # < 0
                "property": {
                    "type": "apartment",
                    "rooms": 2,
                    "bathrooms": 1,
                    "area": 75.0,
                    "address": "123 Rue de la Paix",
                    "city": "Paris",
                    "postal_code": "75000"
                }
            }
        )
        assert response.status_code == 422

    def test_get_listing_details(self, client):
        """Get listing details should return full data"""
        response = client.get("/api/v1/listings/1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert "title" in data
        assert "price" in data
        assert "property" in data
        assert data["property"]["type"] == "apartment"

    def test_update_listing(self, client):
        """Update listing should modify it"""
        response = client.put(
            "/api/v1/listings/1",
            json={
                "title": "Updated title",
                "price": 600000
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated title"
        assert data["price"] == 600000

    def test_delete_listing(self, client):
        """Delete listing should remove it"""
        response = client.delete("/api/v1/listings/1")
        assert response.status_code == 204

    def test_delete_listing_returns_no_content(self, client):
        """Delete listing should return empty response"""
        response = client.delete("/api/v1/listings/1")
        assert response.status_code == 204
        assert response.content == b""


class TestOpenAPIDocumentation:
    """Test that OpenAPI docs are generated correctly"""

    def test_openapi_schema(self, client):
        """OpenAPI schema should be generated"""
        response = client.get("/api/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert schema["info"]["title"] == "Immo2000 API"
        assert "paths" in schema

    def test_swagger_ui(self, client):
        """Swagger UI should be available"""
        response = client.get("/api/docs")
        assert response.status_code == 200
        assert "swagger" in response.text.lower()

    def test_redoc(self, client):
        """ReDoc should be available"""
        response = client.get("/api/redoc")
        assert response.status_code == 200


class TestErrorHandling:
    """Test error handling in FastAPI app"""

    def test_404_endpoint(self, client):
        """Non-existent endpoint should return 404"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404

    def test_validation_error_format(self, client):
        """Validation errors should be formatted correctly"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "invalid"}  # Missing password
        )
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data


class TestMigrationCompatibility:
    """Test that new FastAPI routes are compatible with old Flask expectations"""

    def test_cors_headers(self, client):
        """CORS headers should be present"""
        response = client.get(
            "/api/v1/health",
            headers={"Origin": "http://localhost:3000"}
        )
        assert response.status_code == 200
        # CORS headers should be included
        assert "access-control" in str(response.headers).lower()

    def test_content_type(self, client):
        """Response should be JSON"""
        response = client.get("/api/v1/health")
        assert response.headers["content-type"] == "application/json"

    def test_status_codes(self, client):
        """Status codes should match Flask expectations"""
        # 201 for created
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "pass",
                "first_name": "John",
                "last_name": "Doe"
            }
        )
        assert response.status_code == 201

        # 204 for delete
        response = client.delete("/api/v1/listings/1")
        assert response.status_code == 204
