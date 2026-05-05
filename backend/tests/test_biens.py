"""
Tests pour les endpoints de gestion des biens immobiliers.

Test suite pour :
- GET /api/v1/biens (list)
- POST /api/v1/biens (create)
- GET /api/v1/biens/me (my biens)
- GET /api/v1/biens/stats (stats)
- GET /api/v1/biens/<id> (detail)
"""

import json
import pytest
from src.models.biens import Bien
from src.auth.models import User


@pytest.fixture
def vendeur_token(client, db):
    """Créer un utilisateur vendeur et retourner son token."""
    # Enregistrement
    resp = client.post(
        "/auth/register",
        json={
            "email": "vendeur@test.com",
            "password": "VendeurPass123!",
            "nom": "Dupont",
            "prenom": "Jean",
            "role": "vendeur",
        },
    )
    assert resp.status_code == 201

    # Login
    resp = client.post(
        "/auth/login",
        json={"email": "vendeur@test.com", "password": "VendeurPass123!"},
    )
    assert resp.status_code == 200
    return resp.json["access_token"]


@pytest.fixture
def agent_token(client, db):
    """Créer un utilisateur agent et retourner son token."""
    resp = client.post(
        "/auth/register",
        json={
            "email": "agent@test.com",
            "password": "AgentPass123!",
            "nom": "Martin",
            "prenom": "Pierre",
            "role": "agent",
        },
    )
    assert resp.status_code == 201

    resp = client.post(
        "/auth/login",
        json={"email": "agent@test.com", "password": "AgentPass123!"},
    )
    assert resp.status_code == 200
    return resp.json["access_token"]


class TestBiensListCreate:
    """Test list et create biens."""

    def test_list_biens_empty(self, client, vendeur_token):
        """GET /api/v1/biens - Liste vide initialement."""
        resp = client.get(
            "/api/v1/biens",
            headers={"Authorization": f"Bearer {vendeur_token}"},
        )
        assert resp.status_code == 200
        assert resp.json["biens"] == []
        assert resp.json["count"] == 0

    def test_create_bien_success(self, client, vendeur_token):
        """POST /api/v1/biens - Créer un bien avec succès."""
        resp = client.post(
            "/api/v1/biens",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "adresse": "123 Rue de Paris, 75001 Paris",
                "code_postal": "75001",
                "ville": "Paris",
                "surface": 50,
                "type_bien": "appartement",
                "nombre_pieces": 2,
                "nombre_chambres": 1,
                "etage": 3,
                "description": "Bel appartement au centre",
                "prix_demande": 350000,
            },
        )
        assert resp.status_code == 201
        assert resp.json["message"] == "Bien créé avec succès"
        assert resp.json["bien"]["adresse"] == "123 Rue de Paris, 75001 Paris"
        assert resp.json["bien"]["surface"] == 50
        assert resp.json["bien"]["type_bien"] == "appartement"

    def test_create_bien_missing_fields(self, client, vendeur_token):
        """POST /api/v1/biens - Erreur si champs requis manquants."""
        resp = client.post(
            "/api/v1/biens",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "adresse": "123 Rue",
                # Manquent code_postal et ville
                "surface": 50,
                "type_bien": "appartement",
            },
        )
        assert resp.status_code == 400

    def test_create_bien_invalid_surface(self, client, vendeur_token):
        """POST /api/v1/biens - Erreur si surface invalide."""
        resp = client.post(
            "/api/v1/biens",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "adresse": "123 Rue de Paris",
                "code_postal": "75001",
                "ville": "Paris",
                "surface": 0,  # Surface doit être > 0
                "type_bien": "appartement",
            },
        )
        assert resp.status_code == 400

    def test_create_bien_invalid_type(self, client, vendeur_token):
        """POST /api/v1/biens - Erreur si type invalide."""
        resp = client.post(
            "/api/v1/biens",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "adresse": "123 Rue de Paris",
                "code_postal": "75001",
                "ville": "Paris",
                "surface": 50,
                "type_bien": "chateau",  # Type invalide
            },
        )
        assert resp.status_code == 400


class TestBiensUserBiens:
    """Test GET /api/v1/biens/me."""

    def test_my_biens_empty(self, client, vendeur_token):
        """GET /api/v1/biens/me - Liste vide si aucun bien."""
        resp = client.get(
            "/api/v1/biens/me",
            headers={"Authorization": f"Bearer {vendeur_token}"},
        )
        assert resp.status_code == 200
        assert resp.json["biens"] == []
        assert resp.json["count"] == 0

    def test_my_biens_after_create(self, client, vendeur_token):
        """GET /api/v1/biens/me - Liste biens après création."""
        # Créer un bien
        create_resp = client.post(
            "/api/v1/biens",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "adresse": "123 Rue de Paris",
                "code_postal": "75001",
                "ville": "Paris",
                "surface": 50,
                "type_bien": "appartement",
            },
        )
        assert create_resp.status_code == 201

        # Récupérer mes biens
        resp = client.get(
            "/api/v1/biens/me",
            headers={"Authorization": f"Bearer {vendeur_token}"},
        )
        assert resp.status_code == 200
        assert len(resp.json["biens"]) == 1
        assert resp.json["count"] == 1


class TestBiensStats:
    """Test GET /api/v1/biens/stats (agent only)."""

    def test_stats_agent_only(self, client, vendeur_token):
        """GET /api/v1/biens/stats - Erreur si non agent."""
        resp = client.get(
            "/api/v1/biens/stats",
            headers={"Authorization": f"Bearer {vendeur_token}"},
        )
        assert resp.status_code == 403  # Forbidden - role_required

    def test_stats_success(self, client, agent_token):
        """GET /api/v1/biens/stats - Récupérer les stats."""
        resp = client.get(
            "/api/v1/biens/stats",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert resp.status_code == 200
        assert "stats" in resp.json
        assert "total_biens" in resp.json["stats"]
        assert "distribution_types" in resp.json["stats"]


class TestBiensDetail:
    """Test GET /api/v1/biens/<id>."""

    def test_get_bien_not_found(self, client, vendeur_token):
        """GET /api/v1/biens/<id> - 404 si bien inexistant."""
        resp = client.get(
            "/api/v1/biens/999",
            headers={"Authorization": f"Bearer {vendeur_token}"},
        )
        assert resp.status_code == 404

    def test_get_bien_success(self, client, vendeur_token):
        """GET /api/v1/biens/<id> - Récupérer un bien."""
        # Créer un bien
        create_resp = client.post(
            "/api/v1/biens",
            headers={"Authorization": f"Bearer {vendeur_token}"},
            json={
                "adresse": "456 Avenue de Versailles",
                "code_postal": "75016",
                "ville": "Paris",
                "surface": 100,
                "type_bien": "maison",
            },
        )
        bien_id = create_resp.json["bien_id"]

        # Récupérer le bien
        resp = client.get(
            f"/api/v1/biens/{bien_id}",
            headers={"Authorization": f"Bearer {vendeur_token}"},
        )
        assert resp.status_code == 200
        assert resp.json["bien"]["adresse"] == "456 Avenue de Versailles"
        assert resp.json["bien"]["surface"] == 100
