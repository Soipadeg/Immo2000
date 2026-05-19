"""Tests pour les routes de transactions."""
import pytest
from datetime import timedelta


@pytest.mark.asyncio
class TestTransactionsRoutes:
    """Tests des routes /transactions."""

    def test_get_transaction_success(self, client, auth_headers, sample_transaction):
        """Test récupération de transaction réussie."""
        response = client.get(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["transaction_notaire_id"] == sample_transaction.transaction_notaire_id
        assert data["prix_compromis"] == 280000

    def test_get_transaction_not_found(self, client, auth_headers):
        """Test récupération de transaction inexistante."""
        response = client.get(
            "/api/v1/transactions/9999",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_get_transaction_unauthorized(self, client, auth_headers, sample_transaction):
        """Test récupération de transaction sans permission."""
        from app_fastapi.utils.auth import create_access_token

        token = create_access_token(
            data={"user_id": 999, "role": "acheteur"},
            expires_delta=timedelta(hours=1)
        )
        other_headers = {"Authorization": f"Bearer {token}"}

        response = client.get(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}",
            headers=other_headers
        )

        assert response.status_code == 403

    def test_list_transactions_buyer(self, client, auth_headers, sample_transaction, test_user):
        """Test listing des transactions pour l'acheteur."""
        response = client.get(
            "/api/v1/transactions",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(t["transaction_notaire_id"] == sample_transaction.transaction_notaire_id for t in data)

    def test_list_transactions_vendor(self, client, vendor_auth_headers, sample_transaction, test_vendor):
        """Test listing des transactions pour le vendeur."""
        response = client.get(
            "/api/v1/transactions",
            headers=vendor_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_select_notaire_success(self, client, vendor_auth_headers, sample_transaction, db_session):
        """Test sélection d'un notaire réussie."""
        from src.models.notaires import Notaire

        # Créer un notaire de test
        notaire = Notaire(
            nom="Notaire Test",
            email="notaire@test.fr",
            telephone="+33123456789",
            utilisateur_id=3,
            zone_geographique='{"paris": true}'
        )
        db_session.add(notaire)
        db_session.commit()
        db_session.refresh(notaire)

        payload = {
            "notaire_id": notaire.notaire_id
        }

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/select-notaire",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notaire_id"] == notaire.notaire_id
        assert data["statut"] == "notaire_selectionne"
        assert "date_assignation_notaire" in data

    def test_select_notaire_unauthorized(self, client, auth_headers, sample_transaction, db_session):
        """Test sélection d'un notaire sans permission (autre utilisateur)."""
        from src.models.notaires import Notaire
        from app_fastapi.utils.auth import create_access_token

        # Créer un notaire de test
        notaire = Notaire(
            nom="Notaire Test",
            email="notaire@test.fr",
            telephone="+33123456789",
            utilisateur_id=4,
            zone_geographique='{"paris": true}'
        )
        db_session.add(notaire)
        db_session.commit()
        db_session.refresh(notaire)

        # Utiliser un autre utilisateur
        token = create_access_token(
            data={"user_id": 999, "role": "acheteur"},
            expires_delta=timedelta(hours=1)
        )
        other_headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "notaire_id": notaire.notaire_id
        }

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/select-notaire",
            json=payload,
            headers=other_headers
        )

        assert response.status_code == 403

    def test_select_notaire_not_found(self, client, vendor_auth_headers, sample_transaction):
        """Test sélection d'un notaire inexistant."""
        payload = {
            "notaire_id": 9999
        }

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/select-notaire",
            json=payload,
            headers=vendor_auth_headers
        )

        assert response.status_code == 404

    def test_validate_fees_success(self, client, notaire_auth_headers, sample_transaction, db_session):
        """Test validation des frais réussie."""
        from src.models.notaires import Notaire

        # Ajouter un notaire à la transaction
        notaire = Notaire(
            nom="Notaire Test",
            email="notaire@test.fr",
            telephone="+33123456789",
            utilisateur_id=3,
            zone_geographique='{"paris": true}'
        )
        db_session.add(notaire)
        db_session.commit()
        db_session.refresh(notaire)

        sample_transaction.notaire_id = notaire.notaire_id
        db_session.commit()

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/validate-fees",
            json={"montant_frais": 5000},
            headers=notaire_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["statut"] == "frais_valides"
        assert "date_validation" in data

    def test_validate_fees_unauthorized(self, client, auth_headers, sample_transaction):
        """Test validation des frais sans permission."""
        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/validate-fees",
            json={"montant_frais": 5000},
            headers=auth_headers
        )

        assert response.status_code == 403
