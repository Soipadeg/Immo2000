"""Fixtures pytest pour les tests FastAPI."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, AsyncMock, Mock

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app_fastapi.main import app
from app_fastapi.utils.auth import create_access_token
from shared.database import get_db


# === Database Fixtures ===

@pytest.fixture(scope="session")
def test_db_engine():
    """Créer une base de données de test (SQLite in-memory)."""
    from src.auth.models import db as flask_db

    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

    # Créer les tables
    try:
        from src.auth.models import User
        from src.models.annonces import Annonce
        flask_db.Model.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Could not create all tables: {e}")

    yield engine

    # Cleanup
    try:
        flask_db.Model.metadata.drop_all(bind=engine)
    except Exception:
        pass


@pytest.fixture
def db_session(test_db_engine):
    """Créer une session de test isolée."""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_db_engine
    )
    db = TestingSessionLocal()

    yield db

@pytest.fixture
def client(db_session):
    """Client TestClient avec base de données de test."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# === Auth Fixtures ===

@pytest.fixture
def test_user():
    """Utilisateur acheteur de test."""
    return {
        "user_id": 1,
        "email": "acheteur@test.fr",
        "role": "acheteur"
    }


@pytest.fixture
def test_vendor():
    """Vendeur de test."""
    return {
        "user_id": 2,
        "email": "vendeur@test.fr",
        "role": "vendeur"
    }


@pytest.fixture
def test_notaire():
    """Notaire de test."""
    return {
        "user_id": 3,
        "email": "notaire@test.fr",
        "role": "notaire"
    }


@pytest.fixture
def auth_headers(test_user):
    """Headers avec token d'authentification (acheteur)."""
    token = create_access_token(
        data={"user_id": test_user["user_id"], "role": test_user["role"]},
        expires_delta=timedelta(hours=1)
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def vendor_auth_headers(test_vendor):
    """Headers avec token d'authentification (vendeur)."""
    token = create_access_token(
        data={"user_id": test_vendor["user_id"], "role": test_vendor["role"]},
        expires_delta=timedelta(hours=1)
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def notaire_auth_headers(test_notaire):
    """Headers avec token d'authentification (notaire)."""
    token = create_access_token(
        data={"user_id": test_notaire["user_id"], "role": test_notaire["role"]},
        expires_delta=timedelta(hours=1)
    )
    return {"Authorization": f"Bearer {token}"}


# === Mock Fixtures ===

@pytest.fixture
def mock_stripe():
    """Mock pour Stripe API."""
    mock = AsyncMock()
    mock.get_payment_intent = AsyncMock(return_value={
        "id": "pi_test123",
        "status": "succeeded",
        "amount": 50000,
        "currency": "eur"
    })
    return mock


@pytest.fixture
def mock_docusign():
    """Mock pour DocuSign API."""
    mock = AsyncMock()
    mock.get_envelope_status = AsyncMock(return_value={
        "envelopeId": "envelope123",
        "status": "completed"
    })
    return mock


@pytest.fixture
def mock_sendgrid():
    """Mock pour SendGrid API."""
    mock = AsyncMock()
    mock.send_email = AsyncMock(return_value={"message_id": "msg123"})
    mock.send_transaction_notification = AsyncMock(return_value=True)
    return mock


# === Model Fixtures ===

@pytest.fixture
def sample_annonce(db_session, test_vendor):
    """Annonce de test."""
    from src.models.annonces import Annonce

    annonce = Annonce(
        titre="Appartement 75 m²",
        description="Bel appartement à Paris",
        prix=300000,
        utilisateur_id=test_vendor["user_id"],
        type_bien="apartement",
        surface=75,
        localisation_lat=48.8566,
        localisation_lng=2.3522,
        date_creation=datetime.utcnow()
    )
    db_session.add(annonce)
    db_session.commit()
    db_session.refresh(annonce)
    return annonce


@pytest.fixture
def sample_offre(db_session, sample_annonce, test_user, test_vendor):
    """Offre de test."""
    from src.models.offres import Offre

    offre = Offre(
        annonce_id=sample_annonce.annonce_id,
        acheteur_id=test_user["user_id"],
        vendeur_id=test_vendor["user_id"],
        montant=280000,
        conditions_suspensives="Prêt immobilier",
        message="Très intéressé",
        statut="proposee",
        date_creation=datetime.utcnow(),
        date_expiration=datetime.utcnow() + timedelta(days=7)
    )
    db_session.add(offre)
    db_session.commit()
    db_session.refresh(offre)
    return offre


@pytest.fixture
def sample_transaction(db_session, sample_offre, test_user, test_vendor):
    """Transaction de test."""
    from src.models.notaires import TransactionNotaire

    transaction = TransactionNotaire(
        offre_id=sample_offre.offre_id,
        annonce_id=sample_offre.annonce_id,
        acheteur_id=test_user["user_id"],
        vendeur_id=test_vendor["user_id"],
        prix_compromis=280000,
        statut="en_attente_notaire",
        date_creation=datetime.utcnow()
    )
    db_session.add(transaction)
    db_session.commit()
    db_session.refresh(transaction)
    return transaction
