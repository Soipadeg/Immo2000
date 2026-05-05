"""
Tests pour les endpoints d'estimation Melo.

Test suite pour :
- POST /api/v1/estimations (create estimation)
- POST /api/v1/estimations/compare (compare properties)
- GET /api/v1/estimations (list estimations)
"""

import json
import pytest


@pytest.fixture
def user_token(client, db):
    """Créer un utilisateur et retourner son token."""
    resp = client.post(
        "/auth/register",
        json={
            "email": "user@test.com",
            "password": "UserPass123!",
            "nom": "Durand",
            "prenom": "Marc",
            "role": "acheteur",
        },
    )
    assert resp.status_code == 201

    resp = client.post(
        "/auth/login",
        json={"email": "user@test.com", "password": "UserPass123!"},
    )
    assert resp.status_code == 200
    return resp.json["access_token"]


@pytest.fixture
def vendeur_token(client, db):
    """Créer un vendeur et retourner son token."""
    resp = client.post(
        "/auth/register",
        json={
            "email": "vendeur_est@test.com",
            "password": "VendeurPass123!",
            "nom": "Dupont",
            "prenom": "Jean",
            "role": "vendeur",
        },
    )
    assert resp.status_code == 201

    resp = client.post(
        "/auth/login",
        json={"email": "vendeur_est@test.com", "password": "VendeurPass123!"},
    )
    assert resp.status_code == 200
    return resp.json["access_token"]


class TestEstimationCreate:
    """Test POST /api/v1/estimations."""

    def test_create_estimation_missing_fields(self, client, user_token):
        """POST /api/v1/estimations - Erreur si champs manquants."""
        resp = client.post(
            "/api/v1/estimations",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "adresse": "123 Rue de Paris",
                # Manquent surface et type_bien
            },
        )
        assert resp.status_code == 400
        assert "Missing required fields" in resp.json["error"]

    def test_create_estimation_invalid_surface(self, client, user_token):
        """POST /api/v1/estimations - Erreur si surface invalide."""
        resp = client.post(
            "/api/v1/estimations",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "adresse": "123 Rue de Paris, 75001 Paris",
                "surface": "pas_un_nombre",  # Surface invalide
                "type_bien": "appartement",
            },
        )
        assert resp.status_code == 400
        assert "Surface must be an integer" in resp.json["error"]

    def test_create_estimation_invalid_type(self, client, user_token):
        """POST /api/v1/estimations - Erreur si type invalide."""
        resp = client.post(
            "/api/v1/estimations",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "adresse": "123 Rue de Paris, 75001 Paris",
                "surface": 50,
                "type_bien": "gratte_ciel",  # Type invalide
            },
        )
        assert resp.status_code == 400
        assert "type_bien must be one of" in resp.json["error"]

    def test_create_estimation_empty_body(self, client, user_token):
        """POST /api/v1/estimations - Erreur si body vide."""
        resp = client.post(
            "/api/v1/estimations",
            headers={"Authorization": f"Bearer {user_token}"},
            data="",
        )
        assert resp.status_code == 400

    def test_create_estimation_authenticated(self, client, user_token):
        """POST /api/v1/estimations - Nécessite authentification."""
        resp = client.post(
            "/api/v1/estimations",
            json={
                "adresse": "123 Rue de Paris, 75001 Paris",
                "surface": 50,
                "type_bien": "appartement",
            },
        )
        assert resp.status_code == 401


class TestEstimationCompare:
    """Test POST /api/v1/estimations/compare."""

    def test_compare_missing_biens(self, client, vendeur_token):
        """POST /api/v1/estimations/compare - Erreur si array vide."""
        resp = client.post(
            "/api/v1/estimations/compare",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={"biens": []},
        )
        assert resp.status_code == 400
        assert "At least 2 properties required" in resp.json["error"]

    def test_compare_one_bien(self, client, vendeur_token):
        """POST /api/v1/estimations/compare - Erreur si moins de 2 biens."""
        resp = client.post(
            "/api/v1/estimations/compare",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "biens": [
                    {
                        "adresse": "123 Rue de Paris",
                        "surface": 50,
                        "type_bien": "appartement",
                    }
                ]
            },
        )
        assert resp.status_code == 400
        assert "At least 2 properties required" in resp.json["error"]

    def test_compare_missing_bien_fields(self, client, vendeur_token):
        """POST /api/v1/estimations/compare - Erreur si champs manquants."""
        resp = client.post(
            "/api/v1/estimations/compare",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "biens": [
                    {"adresse": "123 Rue A", "surface": 50},  # Manque type_bien
                    {"adresse": "456 Rue B", "surface": 75, "type_bien": "maison"},
                ]
            },
        )
        assert resp.status_code == 400

    def test_compare_vendor_only(self, client, user_token):
        """POST /api/v1/estimations/compare - Erreur si non vendeur/agent."""
        resp = client.post(
            "/api/v1/estimations/compare",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "biens": [
                    {
                        "adresse": "123 Rue A",
                        "surface": 50,
                        "type_bien": "appartement",
                    },
                    {"adresse": "456 Rue B", "surface": 75, "type_bien": "maison"},
                ]
            },
        )
        assert resp.status_code == 403  # Forbidden - role_required

    def test_compare_authenticated(self, client):
        """POST /api/v1/estimations/compare - Nécessite authentification."""
        resp = client.post(
            "/api/v1/estimations/compare",
            json={
                "biens": [
                    {
                        "adresse": "123 Rue A",
                        "surface": 50,
                        "type_bien": "appartement",
                    },
                    {"adresse": "456 Rue B", "surface": 75, "type_bien": "maison"},
                ]
            },
        )
        assert resp.status_code == 401


class TestEstimationList:
    """Test GET /api/v1/estimations."""

    def test_list_estimations_empty(self, client, user_token):
        """GET /api/v1/estimations - Liste vide (pas de persistance)."""
        resp = client.get(
            "/api/v1/estimations",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert resp.status_code == 200
        assert resp.json["estimations"] == []
        assert resp.json["count"] == 0

    def test_list_estimations_authenticated(self, client):
        """GET /api/v1/estimations - Nécessite authentification."""
        resp = client.get("/api/v1/estimations")
        assert resp.status_code == 401
