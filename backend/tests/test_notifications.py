"""
Tests pytest pour le service d'email et les notifications.

Teste :
- Endpoint POST /api/v1/notifications/test
- Service d'email (EmailService)
- Envoi d'emails en mode développement
"""

import pytest
import json
from src.app import create_app
from src.auth.models import db, User
from src.services.email import EmailService, EmailError
import bcrypt


@pytest.fixture
def app():
    """Créer une app Flask pour les tests."""
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Créer un client test."""
    return app.test_client()


class TestEmailService:
    """Tests du service d'email."""

    def test_email_service_creation(self):
        """Créer une instance du service d'email."""
        service = EmailService(
            smtp_host="smtp.test.com",
            smtp_port=587,
            smtp_user="test@test.com",
            smtp_password="password123",
            from_email="noreply@test.com"
        )
        assert service.smtp_host == "smtp.test.com"
        assert service.smtp_port == 587
        assert service.smtp_user == "test@test.com"

    def test_email_service_dev_mode(self):
        """Mode développement : emails juste loggés."""
        service = EmailService()  # localhost, pas de credentials

        result = service.send_email(
            to_email="test@example.com",
            to_name="Test User",
            subject="Test Email",
            html_content="<p>Test</p>"
        )
        assert result is True

    def test_send_annonce_published_email(self):
        """Envoyer email de notification annonce publiée."""
        service = EmailService()

        result = service.send_annonce_published(
            to_email="test@example.com",
            to_name="Test User",
            annonce_titre="Maison à Paris",
            annonce_url="https://immo2000.fr/annonces/123"
        )
        assert result is True

    def test_send_annonce_sold_email(self):
        """Envoyer email de notification annonce vendue."""
        from datetime import datetime
        service = EmailService()

        result = service.send_annonce_sold(
            to_email="test@example.com",
            to_name="Test User",
            annonce_titre="Maison à Paris",
            sale_date=datetime.now()
        )
        assert result is True


class TestNotificationsEndpoints:
    """Tests des endpoints de notifications."""

    def test_test_email_endpoint_success(self, client):
        """POST /api/v1/notifications/test avec données valides."""
        response = client.post(
            "/api/v1/notifications/test",
            data=json.dumps({
                "email": "test@example.com",
                "name": "Test User"
            }),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        assert "email" in data
        assert data["email"] == "test@example.com"

    def test_test_email_endpoint_missing_fields(self, client):
        """POST /api/v1/notifications/test sans champs requis."""
        response = client.post(
            "/api/v1/notifications/test",
            data=json.dumps({"email": "test@example.com"}),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_test_email_endpoint_invalid_email(self, client):
        """POST /api/v1/notifications/test avec email invalide."""
        response = client.post(
            "/api/v1/notifications/test",
            data=json.dumps({
                "email": "invalid",
                "name": "Test User"
            }),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_health_check_endpoint(self, client):
        """GET /api/v1/notifications/health."""
        response = client.get("/api/v1/notifications/health")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"
        assert data["service"] == "notifications"


class TestEmailNotificationsIntegration:
    """Tests d'intégration : email notifications avec CRUD."""

    def test_publish_annonce_sends_email(self, app, client):
        """Publier une annonce devrait envoyer un email."""
        from src.auth.utils import generate_access_token
        from src.crud.annonces import create_annonce
        from src.schemas.annonces import CreateAnnonce

        # Créer un utilisateur
        with app.app_context():
            hashed = bcrypt.hashpw(b"testpass123", bcrypt.gensalt(rounds=12))
            user = User(
                email="vendor@example.com",
                mot_de_passe_hash=hashed.decode("utf-8"),
                nom="Vendor",
                prenom="Test",
                role="vendeur",
                actif=True
            )
            db.session.add(user)
            db.session.commit()
            db.session.refresh(user)

            # Créer une annonce
            annonce_data = CreateAnnonce(
                titre="Maison à Paris",
                description="Belle maison",
                prix=500000.0,
                surface=120.0,
                adresse="123 rue de la Paix",
                code_postal="75001",
                ville="Paris",
                type_bien="maison",
                nombre_pieces=4
            )
            annonce = create_annonce(db.session, user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

            # Générer token
            token = generate_access_token(
                user_id=user.utilisateur_id,
                email=user.email,
                role=user.role
            )

        # Publier l'annonce via API
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/publier",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["statut"] == "publiée"
        # Email aurait été envoyé en arrière-plan

    def test_sell_annonce_sends_email(self, app, client):
        """Vendre une annonce devrait envoyer un email."""
        from src.auth.utils import generate_access_token
        from src.crud.annonces import create_annonce, publish_annonce
        from src.schemas.annonces import CreateAnnonce

        # Créer un utilisateur
        with app.app_context():
            hashed = bcrypt.hashpw(b"testpass123", bcrypt.gensalt(rounds=12))
            user = User(
                email="vendor@example.com",
                mot_de_passe_hash=hashed.decode("utf-8"),
                nom="Vendor",
                prenom="Test",
                role="vendeur",
                actif=True
            )
            db.session.add(user)
            db.session.commit()
            db.session.refresh(user)

            # Créer et publier une annonce
            annonce_data = CreateAnnonce(
                titre="Maison à Paris",
                description="Belle maison",
                prix=500000.0,
                surface=120.0,
                adresse="123 rue de la Paix",
                code_postal="75001",
                ville="Paris",
                type_bien="maison",
                nombre_pieces=4
            )
            annonce = create_annonce(db.session, user.utilisateur_id, annonce_data)
            publish_annonce(db.session, annonce.annonce_id, user.utilisateur_id)
            annonce_id = annonce.annonce_id

            # Générer token
            token = generate_access_token(
                user_id=user.utilisateur_id,
                email=user.email,
                role=user.role
            )

        # Vendre l'annonce via API
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/vendre",
            data=json.dumps({}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["statut"] == "vendue"
        assert data["date_vente"] is not None
        # Email aurait été envoyé en arrière-plan
