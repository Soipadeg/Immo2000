"""Tests pour les routes paiements."""
import pytest
from datetime import timedelta


class TestPaiementsRoutes:
    """Tests des routes /paiements."""

    def test_create_payment_intent_success(self, client, auth_headers, sample_transaction):
        """Test création d'un payment intent."""
        payload = {
            "transaction_id": sample_transaction.transaction_notaire_id,
            "montant": 28000,
            "type_paiement": "depot"
        }

        response = client.post(
            "/api/v1/paiements/create-intent",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "client_secret" in data
        assert "payment_intent_id" in data
        assert data["amount"] == 28000

    def test_create_payment_intent_unauthorized(self, client, vendor_auth_headers, sample_transaction):
        """Test création d'un payment intent sans permission (vendeur)."""
        payload = {
            "transaction_id": sample_transaction.transaction_notaire_id,
            "montant": 28000,
            "type_paiement": "depot"
        }

        response = client.post(
            "/api/v1/paiements/create-intent",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 403

    def test_create_payment_intent_missing_transaction(self, client, auth_headers):
        """Test création d'un payment intent avec transaction inexistante."""
        payload = {
            "transaction_id": 9999,
            "montant": 28000,
            "type_paiement": "depot"
        }

        response = client.post(
            "/api/v1/paiements/create-intent",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_confirm_payment_success(self, client, auth_headers, db_session):
        """Test confirmation d'un paiement."""
        payload = {
            "payment_intent_id": "pi_test123",
            "amount": 28000
        }

        response = client.post(
            "/api/v1/paiements/confirm",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["statut"] == "reussi"
        assert data["montant"] == 28000

    def test_get_payment_success(self, client, auth_headers, db_session):
        """Test récupération d'un paiement."""
        from src.models.paiements import Paiement

        # Créer un paiement de test
        paiement = Paiement(
            transaction_notaire_id=1,
            utilisateur_id=1,
            montant=28000,
            type_paiement="depot",
            stripe_payment_intent_id="pi_test123",
            statut="reussi",
            date_paiement=None
        )
        db_session.add(paiement)
        db_session.commit()
        db_session.refresh(paiement)

        response = client.get(
            f"/api/v1/paiements/{paiement.paiement_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["montant"] == 28000
        assert data["statut"] == "reussi"

    def test_get_payment_unauthorized(self, client, vendor_auth_headers, db_session):
        """Test récupération d'un paiement sans permission."""
        from src.models.paiements import Paiement

        # Créer un paiement de test
        paiement = Paiement(
            transaction_notaire_id=1,
            utilisateur_id=1,
            montant=28000,
            type_paiement="depot",
            stripe_payment_intent_id="pi_test456",
            statut="reussi",
            date_paiement=None
        )
        db_session.add(paiement)
        db_session.commit()
        db_session.refresh(paiement)

        response = client.get(
            f"/api/v1/paiements/{paiement.paiement_id}",
            headers=vendor_auth_headers
        )

        assert response.status_code == 403

    def test_get_payment_not_found(self, client, auth_headers):
        """Test récupération d'un paiement inexistant."""
        response = client.get(
            "/api/v1/paiements/9999",
            headers=auth_headers
        )

        assert response.status_code == 404
