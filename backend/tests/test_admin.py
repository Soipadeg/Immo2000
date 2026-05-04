"""
Tests pytest pour l'espace administrateur.

Teste :
- Décorateur @admin_required
- Endpoint GET /api/v1/utilisateurs
- Endpoint GET /api/v1/utilisateurs/{id}
- Endpoint PATCH /api/v1/utilisateurs/{id}/deactivate
- Gestion des rôles et permissions
"""

import pytest
import json
from src.app import create_app
from src.auth.models import db, User
from src.auth.utils import generate_access_token
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


@pytest.fixture
def admin_user(app):
    """Créer un utilisateur administrateur."""
    with app.app_context():
        hashed = bcrypt.hashpw(b"admin123", bcrypt.gensalt(rounds=12))
        user = User(
            email="admin@example.com",
            mot_de_passe_hash=hashed.decode("utf-8"),
            nom="Admin",
            prenom="Test",
            role="agent",  # agent = admin
            actif=True
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user


@pytest.fixture
def vendor_user(app):
    """Créer un utilisateur vendeur."""
    with app.app_context():
        hashed = bcrypt.hashpw(b"vendor123", bcrypt.gensalt(rounds=12))
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
        return user


@pytest.fixture
def admin_token(app, admin_user):
    """Générer un JWT token pour l'administrateur."""
    with app.app_context():
        token = generate_access_token(
            user_id=admin_user.utilisateur_id,
            email=admin_user.email,
            role=admin_user.role
        )
        return token


@pytest.fixture
def vendor_token(app, vendor_user):
    """Générer un JWT token pour le vendeur."""
    with app.app_context():
        token = generate_access_token(
            user_id=vendor_user.utilisateur_id,
            email=vendor_user.email,
            role=vendor_user.role
        )
        return token


class TestAdminDecorator:
    """Tests du décorateur @admin_required."""

    def test_admin_can_access(self, client, admin_token):
        """Admin (role=agent) peut accéder."""
        response = client.get(
            "/api/v1/utilisateurs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

    def test_vendor_cannot_access(self, client, vendor_token):
        """Vendeur (role=vendeur) ne peut pas accéder."""
        response = client.get(
            "/api/v1/utilisateurs",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 403
        data = response.get_json()
        assert "error" in data
        assert "Admin access required" in data["error"]

    def test_unauthenticated_cannot_access(self, client):
        """Requête sans JWT retourne 401."""
        response = client.get("/api/v1/utilisateurs")
        assert response.status_code == 401


class TestListAllUsers:
    """Tests de l'endpoint GET /api/v1/utilisateurs."""

    def test_list_users_empty(self, client, admin_token, admin_user):
        """Lister les utilisateurs quand il n'y a que l'admin."""
        response = client.get(
            "/api/v1/utilisateurs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["email"] == "admin@example.com"
        assert data["items"][0]["role"] == "agent"

    def test_list_users_pagination(self, app, client, admin_token):
        """Tester la pagination."""
        with app.app_context():
            # Créer 5 vendeurs
            for i in range(5):
                hashed = bcrypt.hashpw(b"test123", bcrypt.gensalt(rounds=12))
                user = User(
                    email=f"vendor{i}@example.com",
                    mot_de_passe_hash=hashed.decode("utf-8"),
                    nom=f"Vendor{i}",
                    prenom="Test",
                    role="vendeur",
                    actif=True
                )
                db.session.add(user)
            db.session.commit()

        # Récupérer avec limit=2
        response = client.get(
            "/api/v1/utilisateurs?skip=0&limit=2",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 6  # 5 vendeurs + 1 admin
        assert len(data["items"]) == 2
        assert data["skip"] == 0
        assert data["limit"] == 2

    def test_list_users_filter_by_role(self, app, client, admin_token):
        """Filtrer par rôle."""
        with app.app_context():
            # Créer 2 acheteurs
            for i in range(2):
                hashed = bcrypt.hashpw(b"test123", bcrypt.gensalt(rounds=12))
                user = User(
                    email=f"buyer{i}@example.com",
                    mot_de_passe_hash=hashed.decode("utf-8"),
                    nom=f"Buyer{i}",
                    prenom="Test",
                    role="acheteur",
                    actif=True
                )
                db.session.add(user)
            db.session.commit()

        # Filtrer par role=acheteur
        response = client.get(
            "/api/v1/utilisateurs?role=acheteur",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 2
        assert all(item["role"] == "acheteur" for item in data["items"])

    def test_list_users_filter_by_actif(self, app, client, admin_token):
        """Filtrer par statut actif."""
        with app.app_context():
            # Créer un utilisateur inactif
            hashed = bcrypt.hashpw(b"test123", bcrypt.gensalt(rounds=12))
            user = User(
                email="inactive@example.com",
                mot_de_passe_hash=hashed.decode("utf-8"),
                nom="Inactive",
                prenom="User",
                role="acheteur",
                actif=False
            )
            db.session.add(user)
            db.session.commit()

        # Filtrer par actif=false
        response = client.get(
            "/api/v1/utilisateurs?actif=false",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert data["items"][0]["email"] == "inactive@example.com"
        assert data["items"][0]["actif"] is False

    def test_list_users_invalid_role_filter(self, client, admin_token):
        """Filtrer avec un rôle invalide retourne 400."""
        response = client.get(
            "/api/v1/utilisateurs?role=invalid",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400


class TestGetUserDetails:
    """Tests de l'endpoint GET /api/v1/utilisateurs/{id}."""

    def test_get_user_details_success(self, client, admin_token, admin_user):
        """Récupérer les détails d'un utilisateur."""
        response = client.get(
            f"/api/v1/utilisateurs/{admin_user.utilisateur_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["utilisateur_id"] == admin_user.utilisateur_id
        assert data["email"] == admin_user.email
        assert data["role"] == "agent"
        assert "annonces_count" in data

    def test_get_user_details_not_found(self, client, admin_token):
        """Récupérer un utilisateur inexistant retourne 404."""
        response = client.get(
            "/api/v1/utilisateurs/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data

    def test_vendor_cannot_get_other_users(self, client, vendor_token, admin_user):
        """Vendeur ne peut pas accéder aux détails d'autres utilisateurs."""
        response = client.get(
            f"/api/v1/utilisateurs/{admin_user.utilisateur_id}",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 403


class TestDeactivateUser:
    """Tests de l'endpoint PATCH /api/v1/utilisateurs/{id}/deactivate."""

    def test_deactivate_user_success(self, app, client, admin_token, vendor_user):
        """Désactiver un utilisateur avec succès."""
        response = client.patch(
            f"/api/v1/utilisateurs/{vendor_user.utilisateur_id}/deactivate",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["actif"] is False

        # Vérifier que l'utilisateur est vraiment désactivé
        with app.app_context():
            user = db.session.query(User).filter(
                User.utilisateur_id == vendor_user.utilisateur_id
            ).first()
            assert user.actif is False

    def test_admin_cannot_deactivate_self(self, client, admin_token, admin_user):
        """Admin ne peut pas se désactiver lui-même."""
        response = client.patch(
            f"/api/v1/utilisateurs/{admin_user.utilisateur_id}/deactivate",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "Cannot deactivate yourself" in data["error"]

    def test_deactivate_nonexistent_user(self, client, admin_token):
        """Désactiver un utilisateur inexistant retourne 404."""
        response = client.patch(
            "/api/v1/utilisateurs/99999/deactivate",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_vendor_cannot_deactivate_users(self, client, vendor_token, admin_user):
        """Vendeur ne peut pas désactiver des utilisateurs."""
        response = client.patch(
            f"/api/v1/utilisateurs/{admin_user.utilisateur_id}/deactivate",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code == 403
