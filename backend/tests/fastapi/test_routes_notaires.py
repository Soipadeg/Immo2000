"""Tests pour les routes notaires."""
import pytest


class TestNotairesRoutes:
    """Tests des routes /notaires."""

    def test_list_notaires(self, client, db_session):
        """Test listing des notaires."""
        from src.models.notaires import Notaire

        # Créer quelques notaires de test
        notaire1 = Notaire(
            nom="Notaire 1",
            email="notaire1@test.fr",
            telephone="+33123456789",
            utilisateur_id=10,
            zone_geographique='{"paris": true}'
        )
        notaire2 = Notaire(
            nom="Notaire 2",
            email="notaire2@test.fr",
            telephone="+33987654321",
            utilisateur_id=11,
            zone_geographique='{"lyon": true}'
        )
        db_session.add_all([notaire1, notaire2])
        db_session.commit()

        response = client.get("/api/v1/notaires")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_get_notaire_success(self, client, db_session):
        """Test récupération d'un notaire."""
        from src.models.notaires import Notaire

        notaire = Notaire(
            nom="Notaire Test",
            email="notaire@test.fr",
            telephone="+33123456789",
            utilisateur_id=12,
            zone_geographique='{"paris": true}'
        )
        db_session.add(notaire)
        db_session.commit()
        db_session.refresh(notaire)

        response = client.get(f"/api/v1/notaires/{notaire.notaire_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Notaire Test"
        assert data["email"] == "notaire@test.fr"

    def test_get_notaire_not_found(self, client):
        """Test récupération d'un notaire inexistant."""
        response = client.get("/api/v1/notaires/9999")

        assert response.status_code == 404

    def test_notaire_dashboard(self, client, notaire_auth_headers, db_session):
        """Test accès au dashboard d'un notaire."""
        from src.models.notaires import Notaire, TransactionNotaire
        from datetime import datetime

        # Créer un notaire
        notaire = Notaire(
            nom="Notaire Dashboard",
            email="dashboard@test.fr",
            telephone="+33123456789",
            utilisateur_id=3,
            zone_geographique='{"paris": true}'
        )
        db_session.add(notaire)
        db_session.commit()
        db_session.refresh(notaire)

        # Créer une transaction associée
        transaction = TransactionNotaire(
            offre_id=1,
            annonce_id=1,
            acheteur_id=1,
            vendeur_id=2,
            notaire_id=notaire.notaire_id,
            prix_compromis=280000,
            statut="en_cours",
            date_creation=datetime.utcnow()
        )
        db_session.add(transaction)
        db_session.commit()

        response = client.get(
            f"/api/v1/notaires/{notaire.notaire_id}/dashboard",
            headers=notaire_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_notaire_dashboard_unauthorized(self, client, auth_headers, db_session):
        """Test accès au dashboard sans permission."""
        from src.models.notaires import Notaire

        notaire = Notaire(
            nom="Notaire Test",
            email="notaire@test.fr",
            telephone="+33123456789",
            utilisateur_id=13,
            zone_geographique='{"paris": true}'
        )
        db_session.add(notaire)
        db_session.commit()
        db_session.refresh(notaire)

        response = client.get(
            f"/api/v1/notaires/{notaire.notaire_id}/dashboard",
            headers=auth_headers
        )

        assert response.status_code == 403
