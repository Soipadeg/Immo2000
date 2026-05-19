"""
Shared pytest fixtures for Phase 6f integration tests
Uses existing project structure with Flask-SQLAlchemy
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app_fastapi.main import app
from shared.database import get_db
from src.models.notaires import TransactionNotaire, HistoriqueNotaire
from src.auth.models import User
from src.models.annonces import Annonce
from src.auth.models import db


@pytest.fixture(scope="function")
def test_app():
    """Create app with test configuration"""
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    return app


@pytest.fixture(scope="function")
def db_session(test_app):
    """Create database session for testing"""
    with test_app.app_context():
        db.create_all()
        yield db.session
        db.session.remove()
        db.drop_all()


@pytest.fixture
def test_client(test_app, db_session):
    """Create FastAPI test client"""
    def override_get_db():
        yield db_session

    test_app.dependency_overrides[get_db] = override_get_db
    client = TestClient(test_app)

    yield client

    test_app.dependency_overrides.clear()


@pytest.fixture
def test_users(test_app, db_session):
    """Create test users"""
    with test_app.app_context():
        acheteur = User(
            email="acheteur@test.fr",
            password_hash="hashed_password",
            role="acheteur",
            prenom="John",
            nom="Buyer"
        )
        vendeur = User(
            email="vendeur@test.fr",
            password_hash="hashed_password",
            role="vendeur",
            prenom="Jane",
            nom="Seller"
        )
        notaire = User(
            email="notaire@test.fr",
            password_hash="hashed_password",
            role="notaire",
            prenom="Jean",
            nom="Notary"
        )

        db.session.add_all([acheteur, vendeur, notaire])
        db.session.commit()

        return {
            "acheteur": acheteur,
            "vendeur": vendeur,
            "notaire": notaire
        }


@pytest.fixture
def test_annonce(test_app, db_session, test_users):
    """Create test annonce"""
    with test_app.app_context():
        annonce = Annonce(
            vendeur_id=test_users["vendeur"].user_id,
            titre="Appartement 3 pièces",
            description="Bel appartement à Paris",
            prix=500000.00,
            adresse="123 Rue de Test, Paris",
            type_bien="appartement",
            date_creation=datetime.now()
        )
        db.session.add(annonce)
        db.session.commit()
        return annonce


@pytest.fixture
def test_transaction(test_app, db_session, test_users, test_annonce):
    """Create test transaction"""
    with test_app.app_context():
        transaction = TransactionNotaire(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users["acheteur"].user_id,
            vendeur_id=test_users["vendeur"].user_id,
            notaire_id=test_users["notaire"].user_id,
            prix_transaction=500000.00,
            frais_notaire=15000.00,
            frais_immo2000=10000.00,
            statut="initiale",
            date_creation=datetime.now()
        )
        db.session.add(transaction)
        db.session.commit()
        return transaction


@pytest.fixture
def transaction_with_docusign_envelope(test_app, test_transaction, db_session):
    """Transaction with DocuSign envelope"""
    with test_app.app_context():
        test_transaction.docusign_envelope_id = "test-envelope-123"
        test_transaction.statut = "compromis_envoye"
        test_transaction.date_envoi_signature = datetime.now()
        db.session.commit()
        return test_transaction


@pytest.fixture
def webhook_payload_completed():
    """Completed envelope webhook"""
    return {
        "envelopeId": "test-envelope-123",
        "status": "completed",
        "recipientStatuses": [
            {"email": "acheteur@test.fr", "recipientId": "1", "status": "completed"},
            {"email": "vendeur@test.fr", "recipientId": "2", "status": "completed"}
        ]
    }


@pytest.fixture
def webhook_payload_declined():
    """Declined envelope webhook"""
    return {
        "envelopeId": "test-envelope-123",
        "status": "declined",
        "recipientStatuses": [
            {"email": "acheteur@test.fr", "recipientId": "1", "status": "declined"}
        ]
    }


@pytest.fixture
def webhook_payload_sent():
    """Sent envelope webhook"""
    return {
        "envelopeId": "test-envelope-123",
        "status": "sent",
        "recipientStatuses": [
            {"email": "acheteur@test.fr", "recipientId": "1", "status": "sent"},
            {"email": "vendeur@test.fr", "recipientId": "2", "status": "sent"}
        ]
    }


@pytest.fixture
def webhook_payload_voided():
    """Voided envelope webhook"""
    return {
        "envelopeId": "test-envelope-123",
        "status": "voided",
        "voidedReason": "Cancelled"
    }


@pytest.fixture
def mock_sendgrid():
    """Mock SendGrid service"""
    with patch("app_fastapi.routes.webhooks.send_email") as mock_send:
        mock_send.return_value = AsyncMock(return_value=True)
        yield mock_send


@pytest.fixture
def mock_docusign():
    """Mock DocuSign service"""
    with patch("app_fastapi.services.docusign_service.DocuSignClient") as mock_client:
        mock_instance = MagicMock()
        mock_instance.create_envelope = AsyncMock(return_value={"envelopeId": "test-123"})
        mock_instance.get_envelope = AsyncMock(return_value={"status": "sent"})
        mock_client.return_value = mock_instance
        yield mock_client


@pytest.fixture
def mock_aws_s3():
    """Mock AWS S3 service"""
    with patch("app_fastapi.services.s3_service.S3Client") as mock_client:
        mock_instance = MagicMock()
        mock_instance.upload_file = AsyncMock(return_value={
            "url": "https://s3.amazonaws.com/bucket/compromis-123.pdf"
        })
        mock_client.return_value = mock_instance
        yield mock_client
