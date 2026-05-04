"""
Tests pour le système d'authentification JWT.

Tests :
- Inscription (register)
- Connexion (login)
- Protection des routes (@token_required)
- Restriction par rôle (@role_required)
- Rafraîchissement de token (refresh)
- Récupération de l'utilisateur courant (me)
"""

import pytest
import json
from datetime import datetime, timedelta
from src.app import create_app
from src.auth.models import User, db
from src.auth.utils import generate_access_token, generate_refresh_token, verify_token


@pytest.fixture
def app():
    """Crée une application Flask pour les tests."""
    app = create_app("testing")

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Client Flask pour tester les endpoints."""
    return app.test_client()


@pytest.fixture
def app_context(app):
    """Contexte applicatif pour les tests."""
    with app.app_context():
        yield


class TestRegister:
    """Tests pour l'enregistrement d'utilisateurs."""

    def test_register_success(self, client, app_context):
        """Test l'enregistrement réussi d'un utilisateur."""
        response = client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data["message"] == "User created successfully"
        assert data["email"] == "test@example.com"
        assert "user_id" in data

    def test_register_email_already_exists(self, client, app_context):
        """Test l'enregistrement avec un email déjà existant."""
        # Premier enregistrement
        client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        # Deuxième avec même email
        response = client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP456!",
                    "nom": "Martin",
                    "prenom": "Paul",
                    "role": "acheteur",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "Email already exists" in data["error"]

    def test_register_invalid_email(self, client):
        """Test l'enregistrement avec un email invalide."""
        response = client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "invalid_email",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "Invalid email format" in data["error"]

    def test_register_weak_password(self, client):
        """Test l'enregistrement avec un mot de passe faible."""
        response = client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "weak",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_register_invalid_role(self, client):
        """Test l'enregistrement avec un rôle invalide."""
        response = client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "invalid_role",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "role must be one of" in data["error"]

    def test_register_missing_fields(self, client):
        """Test l'enregistrement sans les champs requis."""
        # Pas d'email
        response = client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.get_json()
        assert "Email is required" in data["error"]


class TestLogin:
    """Tests pour la connexion."""

    def test_login_success(self, client, app_context):
        """Test la connexion réussie."""
        # Enregistrer l'utilisateur
        client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        # Connexion
        response = client.post(
            "/auth/login",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.get_json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "Bearer"
        assert "expires_in" in data

    def test_login_invalid_password(self, client, app_context):
        """Test la connexion avec un mauvais mot de passe."""
        # Enregistrer l'utilisateur
        client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        # Connexion avec mauvais mot de passe
        response = client.post(
            "/auth/login",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "WrongPassword123!",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 401
        data = response.get_json()
        assert "Invalid email or password" in data["error"]

    def test_login_user_not_found(self, client):
        """Test la connexion avec un utilisateur inexistant."""
        response = client.post(
            "/auth/login",
            data=json.dumps(
                {
                    "email": "nonexistent@example.com",
                    "mot_de_passe": "MonMDP123!",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 401
        data = response.get_json()
        assert "Invalid email or password" in data["error"]

    def test_login_deactivated_user(self, client, app_context):
        """Test la connexion avec un compte désactivé."""
        # Créer un utilisateur
        user = User(
            email="test@example.com",
            nom="Dupont",
            prenom="Jean",
            role="vendeur",
            actif=False,
        )
        user.set_password("MonMDP123!")
        db.session.add(user)
        db.session.commit()

        # Essayer de se connecter
        response = client.post(
            "/auth/login",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                }
            ),
            content_type="application/json",
        )

        assert response.status_code == 403
        data = response.get_json()
        assert "User account is deactivated" in data["error"]


class TestRefresh:
    """Tests pour le rafraîchissement de token."""

    def test_refresh_success(self, client, app_context):
        """Test le rafraîchissement réussi du token."""
        # Créer un utilisateur et se connecter
        client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                }
            ),
            content_type="application/json",
        )

        login_response = client.post(
            "/auth/login",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                }
            ),
            content_type="application/json",
        )

        refresh_token = login_response.get_json()["refresh_token"]

        # Rafraîchir
        response = client.post(
            "/auth/refresh",
            data=json.dumps({"refresh_token": refresh_token}),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.get_json()
        assert "access_token" in data
        assert data["token_type"] == "Bearer"

    def test_refresh_invalid_token(self, client):
        """Test le rafraîchissement avec un token invalide."""
        response = client.post(
            "/auth/refresh",
            data=json.dumps({"refresh_token": "invalid_token"}),
            content_type="application/json",
        )

        assert response.status_code == 401
        data = response.get_json()
        assert "Invalid or expired refresh token" in data["error"]


class TestProtectedRoutes:
    """Tests pour les routes protégées (@token_required)."""

    def test_get_current_user_with_valid_token(self, client, app_context):
        """Test l'accès à /auth/me avec un token valide."""
        # Créer et connecter l'utilisateur
        client.post(
            "/auth/register",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "role": "vendeur",
                    "telephone": "+33612345678",
                }
            ),
            content_type="application/json",
        )

        login_response = client.post(
            "/auth/login",
            data=json.dumps(
                {
                    "email": "test@example.com",
                    "mot_de_passe": "MonMDP123!",
                }
            ),
            content_type="application/json",
        )

        token = login_response.get_json()["access_token"]

        # Accéder à /auth/me
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["email"] == "test@example.com"
        assert data["nom"] == "Dupont"
        assert data["prenom"] == "Jean"
        assert data["role"] == "vendeur"
        assert data["telephone"] == "+33612345678"

    def test_get_current_user_without_token(self, client):
        """Test l'accès à /auth/me sans token."""
        response = client.get("/auth/me")

        assert response.status_code == 401
        data = response.get_json()
        assert "Missing or invalid Authorization header" in data["error"]

    def test_get_current_user_with_invalid_token(self, client):
        """Test l'accès à /auth/me avec un token invalide."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )

        assert response.status_code == 401
        data = response.get_json()
        assert "Invalid or expired token" in data["error"]


class TestTokenValidation:
    """Tests pour la validation des tokens."""

    def test_verify_valid_token(self, app_context):
        """Test la vérification d'un token valide."""
        token = generate_access_token(1, "test@example.com", "vendeur")
        payload = verify_token(token)

        assert payload is not None
        assert payload["user_id"] == 1
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "vendeur"
        assert payload["type"] == "access"

    def test_verify_expired_token(self, app_context):
        """Test la vérification d'un token expiré."""
        # Créer un token expiré
        import jwt
        from src.config import get_config

        config = get_config("testing")
        secret_key = config.JWT_SECRET_KEY

        payload = {
            "user_id": 1,
            "email": "test@example.com",
            "role": "vendeur",
            "exp": datetime.utcnow() - timedelta(hours=1),  # Expiré il y a 1h
            "iat": datetime.utcnow(),
            "type": "access",
        }

        token = jwt.encode(payload, secret_key, algorithm="HS256")
        result = verify_token(token)

        assert result is None

    def test_verify_invalid_token(self, app_context):
        """Test la vérification d'un token invalide."""
        result = verify_token("invalid_token_string")
        assert result is None


class TestPasswordHashing:
    """Tests pour le hachage des mots de passe."""

    def test_password_hashing(self, app_context):
        """Test le hachage et la vérification du mot de passe."""
        user = User(
            email="test@example.com",
            nom="Dupont",
            prenom="Jean",
            role="vendeur",
        )

        password = "MonMDP123!"
        user.set_password(password)

        # Vérifier que le hash n'est pas le mot de passe en clair
        assert user.mot_de_passe_hash != password

        # Vérifier que check_password fonctionne
        assert user.check_password(password) is True
        assert user.check_password("WrongPassword") is False


class TestUserModel:
    """Tests pour le modèle User."""

    def test_user_to_dict(self, app_context):
        """Test la conversion de l'utilisateur en dictionnaire."""
        user = User(
            utilisateur_id=1,
            email="test@example.com",
            nom="Dupont",
            prenom="Jean",
            role="vendeur",
            telephone="+33612345678",
        )

        data = user.to_dict()

        assert data["utilisateur_id"] == 1
        assert data["email"] == "test@example.com"
        assert data["nom"] == "Dupont"
        assert data["prenom"] == "Jean"
        assert data["role"] == "vendeur"

    def test_find_by_email(self, app_context):
        """Test la recherche d'un utilisateur par email."""
        user = User(
            email="test@example.com",
            nom="Dupont",
            prenom="Jean",
            role="vendeur",
        )
        user.set_password("MonMDP123!")
        db.session.add(user)
        db.session.commit()

        found_user = User.find_by_email("test@example.com")

        assert found_user is not None
        assert found_user.email == "test@example.com"

    def test_find_by_id(self, app_context):
        """Test la recherche d'un utilisateur par ID."""
        user = User(
            email="test@example.com",
            nom="Dupont",
            prenom="Jean",
            role="vendeur",
        )
        user.set_password("MonMDP123!")
        db.session.add(user)
        db.session.commit()

        found_user = User.find_by_id(user.utilisateur_id)

        assert found_user is not None
        assert found_user.email == "test@example.com"
