"""
Tests d'intégration pour l'endpoint /simulateur-pret.

Teste le endpoint Flask entièrement:
- Validation des inputs
- Calcul des résultats
- Serialization JSON
- Gestion des erreurs
- Authentification JWT
"""

import json
import pytest
from src.auth.models import User, db
from src.auth.utils import generate_access_token


class TestSimulateurEndpoint:
    """Tests de l'endpoint POST /api/v1/simulateur-pret"""

    @pytest.fixture
    def app(self):
        """Crée l'app Flask pour les tests."""
        from src.app import create_app
        app = create_app("testing")
        with app.app_context():
            db.create_all()
            yield app
            db.session.remove()
            db.drop_all()

    @pytest.fixture
    def client(self, app):
        """Client Flask pour tester les endpoints."""
        return app.test_client()

    @pytest.fixture
    def authenticated_client(self, client, app):
        """Client authentifié avec un token valide."""
        with app.app_context():
            # Créer un utilisateur de test
            user = User(
                email="test@example.com",
                nom="Test",
                prenom="User",
                role="acheteur",
            )
            user.set_password("TestPassword123!")
            db.session.add(user)
            db.session.commit()

            # Générer un token pour cet utilisateur
            token = generate_access_token(user.utilisateur_id, user.email, user.role)
            client.token = token

        return client

    def get_headers_with_token(self, token):
        """Retourne les headers avec token JWT."""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }

    # ===== CAS VALIDES =====

    def test_simulateur_cas_standard(self, authenticated_client):
        """Test cas standard: revenu 3000€, apport 50k€."""
        data = {
            "revenu_mensuel_net": 3000,
            "apport": 50000,
            "taux_interet": 3.5,
            "duree_ans": 20,
            "taux_assurance": 0.3,
        }

        response = authenticated_client.post(
            "/api/v1/simulateur-pret",
            data=json.dumps(data),
            headers=self.get_headers_with_token(authenticated_client.token),
        )

        assert response.status_code == 200
        json_data = response.get_json()

        assert json_data["status"] == "success"
        assert "data" in json_data

        result = json_data["data"]
        assert result["capacite_emprunt"] > 0
        assert result["mensualite"] > 0
        assert result["cout_total_credit"] > 0
        assert len(result["tableau_amortissement"]) == 12

        # Vérifier les valeurs approximatives (2 décimales)
        assert abs(result["capacite_emprunt"] - 181047.06) < 1
        assert abs(result["mensualite"] - 1095.26) < 1
        assert abs(result["cout_total_credit"] - 262862.82) < 1

    def test_simulateur_defaults(self, authenticated_client):
        """Test avec valeurs par défaut (only required field)."""
        data = {
            "revenu_mensuel_net": 2500,
        }

        response = authenticated_client.post(
            "/api/v1/simulateur-pret",
            data=json.dumps(data),
            headers=self.get_headers_with_token(authenticated_client.token),
        )

        assert response.status_code == 200
        json_data = response.get_json()

        result = json_data["data"]
        assert result["mensualite"] > 0
        assert result["capacite_emprunt"] > 0

    def test_simulateur_no_auth(self, client):
        """Test rejette requête sans authentification."""
        data = {
            "revenu_mensuel_net": 3000,
        }

        response = client.post(
            "/api/v1/simulateur-pret",
            data=json.dumps(data),
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 401

    def test_info_endpoint(self, client):
        """Test GET /info retourne les paramètres par défaut."""
        response = client.get("/api/v1/simulateur-pret/info")

        assert response.status_code == 200
        result = response.get_json()

        assert "defauts" in result
        assert result["defauts"]["taux_interet"] == 3.5
        assert result["defauts"]["duree_ans"] == 20
        assert result["defauts"]["taux_assurance"] == 0.3

        assert "limites" in result
        assert result["limites"]["taux_interet"]["min"] == 0
        assert result["limites"]["taux_interet"]["max"] == 15
