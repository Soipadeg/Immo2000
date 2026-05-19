"""Tests pour les routes d'offres."""
import pytest
from datetime import datetime, timedelta


@pytest.mark.asyncio
class TestOffresRoutes:
    """Tests des routes /offres."""

    def test_create_offre_success(self, client, auth_headers, sample_annonce, test_user):
        """Test création d'offre réussie."""
        payload = {
            "annonce_id": sample_annonce.annonce_id,
            "montant": 280000,
            "conditions_suspensives": "Prêt immobilier",
            "message": "Très intéressé"
        }

        response = client.post(
            "/api/v1/offres",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["montant"] == 280000
        assert data["acheteur_id"] == test_user["user_id"]
        assert data["statut"] == "proposee"
        assert "date_expiration" in data

    def test_create_offre_missing_annonce(self, client, auth_headers):
        """Test création d'offre avec annonce inexistante."""
        payload = {
            "annonce_id": 9999,
            "montant": 280000,
            "conditions_suspensives": "Prêt",
            "message": "Message"
        }

        response = client.post(
            "/api/v1/offres",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_create_offre_unauthenticated(self, client, sample_annonce):
        """Test création d'offre sans authentification."""
        payload = {
            "annonce_id": sample_annonce.annonce_id,
            "montant": 280000,
            "conditions_suspensives": "Prêt",
            "message": "Message"
        }

        response = client.post("/api/v1/offres", json=payload)

        assert response.status_code == 401

    def test_get_offre_success(self, client, auth_headers, sample_offre):
        """Test récupération d'offre réussie."""
        response = client.get(
            f"/api/v1/offres/{sample_offre.offre_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["offre_id"] == sample_offre.offre_id
        assert data["montant"] == sample_offre.montant

    def test_get_offre_not_found(self, client, auth_headers):
        """Test récupération d'offre inexistante."""
        response = client.get(
            "/api/v1/offres/9999",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_get_offre_unauthorized(self, client, auth_headers, sample_offre, test_user):
        """Test récupération d'offre sans permission."""
        # Créer un autre acheteur
        other_headers = auth_headers.copy()
        # Modifier le token pour un autre utilisateur
        from app_fastapi.utils.auth import create_access_token
        token = create_access_token(
            data={"user_id": 999, "role": "acheteur"},
            expires_delta=timedelta(hours=1)
        )
        other_headers["Authorization"] = f"Bearer {token}"

        response = client.get(
            f"/api/v1/offres/{sample_offre.offre_id}",
            headers=other_headers
        )

        assert response.status_code == 403

    def test_list_offres_by_annonce(self, client, sample_offre):
        """Test listing des offres par annonce."""
        response = client.get(
            f"/api/v1/offres/annonce/{sample_offre.annonce_id}"
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(o["offre_id"] == sample_offre.offre_id for o in data)

    def test_repondre_offre_accepter(self, client, vendor_auth_headers, sample_offre):
        """Test répondre à une offre (accepter)."""
        payload = {
            "action": "accepter"
        }

        response = client.post(
            f"/api/v1/offres/{sample_offre.offre_id}/repondre",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["statut"] == "acceptee"
        assert "date_acceptation" in data

    def test_repondre_offre_refuser(self, client, vendor_auth_headers, sample_offre):
        """Test répondre à une offre (refuser)."""
        payload = {
            "action": "refuser"
        }

        response = client.post(
            f"/api/v1/offres/{sample_offre.offre_id}/repondre",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["statut"] == "refusee"

    def test_repondre_offre_negocier(self, client, vendor_auth_headers, sample_offre):
        """Test répondre à une offre (négocier)."""
        payload = {
            "action": "negocier",
            "contre_proposition": 290000
        }

        response = client.post(
            f"/api/v1/offres/{sample_offre.offre_id}/repondre",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["statut"] == "negociation"
        assert data["contre_proposition"] == 290000

    def test_repondre_offre_negocier_missing_montant(self, client, vendor_auth_headers, sample_offre):
        """Test répondre à une offre (négocier) sans montant."""
        payload = {
            "action": "negocier"
        }

        response = client.post(
            f"/api/v1/offres/{sample_offre.offre_id}/repondre",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 422

    def test_repondre_offre_unauthorized(self, client, auth_headers, sample_offre):
        """Test répondre à une offre sans permission (acheteur)."""
        payload = {
            "action": "accepter"
        }

        response = client.post(
            f"/api/v1/offres/{sample_offre.offre_id}/repondre",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 403

    def test_update_offre_success(self, client, auth_headers, sample_offre):
        """Test mise à jour d'offre réussie."""
        payload = {
            "message": "Nouveau message"
        }

        response = client.put(
            f"/api/v1/offres/{sample_offre.offre_id}",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Nouveau message"

    def test_update_offre_unauthorized(self, client, vendor_auth_headers, sample_offre):
        """Test mise à jour d'offre sans permission (vendeur)."""
        payload = {
            "message": "Nouveau message"
        }

        response = client.put(
            f"/api/v1/offres/{sample_offre.offre_id}",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 403
