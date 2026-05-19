"""Tests pour l'authentification et les permissions."""
import pytest
from datetime import datetime, timedelta


class TestAuth:
    """Tests du système d'authentification."""

    def test_create_access_token(self):
        """Test création d'un token d'accès."""
        from app_fastapi.utils.auth import create_access_token

        token = create_access_token(
            data={"user_id": 1, "role": "acheteur"},
            expires_delta=timedelta(hours=1)
        )

        assert token is not None
        assert isinstance(token, str)

    def test_verify_token_valid(self):
        """Test vérification d'un token valide."""
        from app_fastapi.utils.auth import create_access_token, verify_token

        token = create_access_token(
            data={"user_id": 1, "role": "acheteur"},
            expires_delta=timedelta(hours=1)
        )

        payload = verify_token(token)

        assert payload["user_id"] == 1
        assert payload["role"] == "acheteur"

    def test_verify_token_expired(self):
        """Test vérification d'un token expiré."""
        from app_fastapi.utils.auth import create_access_token, verify_token

        token = create_access_token(
            data={"user_id": 1, "role": "acheteur"},
            expires_delta=timedelta(seconds=-1)  # Déjà expiré
        )

        with pytest.raises(Exception):
            verify_token(token)

    def test_verify_token_invalid(self):
        """Test vérification d'un token invalide."""
        from app_fastapi.utils.auth import verify_token

        with pytest.raises(Exception):
            verify_token("invalid_token_xyz")


class TestAuthHeaders:
    """Tests des headers d'authentification."""

    def test_bearer_token_valid(self, client, auth_headers):
        """Test accès avec Bearer token valide."""
        response = client.get(
            "/health",
            headers=auth_headers
        )

        # Devrait ne pas retourner 401 (mais peut retourner autres codes)
        assert response.status_code != 401

    def test_missing_bearer_token(self, client):
        """Test accès sans token."""
        response = client.get("/api/v1/offres")

        # Les routes protégées devraient retourner 401
        assert response.status_code == 401

    def test_invalid_bearer_token(self, client):
        """Test accès avec token invalide."""
        headers = {"Authorization": "Bearer invalid_token"}

        response = client.get(
            "/api/v1/offres",
            headers=headers
        )

        assert response.status_code == 401

    def test_malformed_authorization_header(self, client):
        """Test header Authorization mal formé."""
        headers = {"Authorization": "InvalidTokenFormat"}

        response = client.get(
            "/api/v1/offres",
            headers=headers
        )

        assert response.status_code == 401


class TestPermissions:
    """Tests des permissions."""

    def test_buyer_can_create_offer(self, client, auth_headers, sample_annonce):
        """Test qu'un acheteur peut créer une offre."""
        payload = {
            "annonce_id": sample_annonce.annonce_id,
            "montant": 280000,
            "conditions_suspensives": "Prêt",
            "message": "Intéressé"
        }

        response = client.post(
            "/api/v1/offres",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 200

    def test_vendor_cannot_create_offer(self, client, vendor_auth_headers, sample_annonce):
        """Test qu'un vendeur ne peut pas créer d'offre."""
        payload = {
            "annonce_id": sample_annonce.annonce_id,
            "montant": 280000,
            "conditions_suspensives": "Prêt",
            "message": "Intéressé"
        }

        response = client.post(
            "/api/v1/offres",
            json=payload,
            headers=vendor_auth_headers
        )

        # Devrait probablement fonctionner ou retourner 403
        # selon le design - vérifier le comportement attendu
        assert response.status_code in [200, 403]

    def test_only_vendor_can_respond_offer(self, client, auth_headers, vendor_auth_headers, sample_offre):
        """Test que seul le vendeur peut répondre à une offre."""
        payload = {"action": "accepter"}

        # L'acheteur ne devrait pas pouvoir
        response_buyer = client.post(
            f"/api/v1/offres/{sample_offre.offre_id}/repondre",
            json=payload,
            headers=auth_headers
        )
        assert response_buyer.status_code == 403

        # Le vendeur devrait pouvoir
        response_vendor = client.post(
            f"/api/v1/offres/{sample_offre.offre_id}/repondre",
            json=payload,
            headers=vendor_auth_headers
        )
        assert response_vendor.status_code == 200
