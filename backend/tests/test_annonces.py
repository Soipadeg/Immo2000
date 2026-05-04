"""
Tests pytest pour l'API Annonces.

Teste :
- Création d'annonces (validation, auth)
- Récupération (single, list, pagination)
- Mise à jour (propriétaire seulement, validation partielle)
- Suppression (propriétaire seulement)
- Filtrage (ville, type_bien, prix range, recherche)
- Workflow de publication (brouillon → publiée)
- Gestion d'erreurs (404, 403, 422, 400)
"""

import pytest
import json
from datetime import datetime
from src.auth.models import db, User
from src.models.annonces import Annonce
from src.app import create_app
from src.crud.annonces import (
    create_annonce,
    get_annonce,
    update_annonce,
    delete_annonce,
    list_annonces,
    publish_annonce,
    archive_annonce,
    sell_annonce,
    AnnoncesNotFoundError,
    AnnoncesUnauthorizedError,
    AnnoncesValidationError,
)
from src.schemas.annonces import CreateAnnonce, UpdateAnnonce
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
def test_user(app):
    """Créer un utilisateur test."""
    with app.app_context():
        # Hash password
        hashed = bcrypt.hashpw(b"testpass123", bcrypt.gensalt(rounds=12))
        user = User(
            email="test@example.com",
            mot_de_passe_hash=hashed.decode("utf-8"),
            nom="Test",
            prenom="User",
            role="vendeur",
            actif=True
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user


@pytest.fixture
def test_user_2(app):
    """Créer un deuxième utilisateur test."""
    with app.app_context():
        hashed = bcrypt.hashpw(b"testpass456", bcrypt.gensalt(rounds=12))
        user = User(
            email="test2@example.com",
            mot_de_passe_hash=hashed.decode("utf-8"),
            nom="Test2",
            prenom="User2",
            role="vendeur",
            actif=True
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user


@pytest.fixture
def auth_token(app, test_user):
    """Générer un JWT token pour l'utilisateur test."""
    with app.app_context():
        token = generate_access_token(
            user_id=test_user.utilisateur_id,
            email=test_user.email,
            role=test_user.role
        )
        return token


@pytest.fixture
def auth_token_2(app, test_user_2):
    """Générer un JWT token pour le deuxième utilisateur."""
    with app.app_context():
        token = generate_access_token(
            user_id=test_user_2.utilisateur_id,
            email=test_user_2.email,
            role=test_user_2.role
        )
        return token


@pytest.fixture
def valid_annonce_data():
    """Données valides pour créer une annonce."""
    return {
        "titre": "Maison 4 pièces à Paris",
        "description": "Belle maison lumineuse avec jardin et terrasse",
        "prix": 500000.0,
        "surface": 120.5,
        "adresse": "12 rue de la Paix",
        "code_postal": "75002",
        "ville": "Paris",
        "type_bien": "maison",
        "nombre_pieces": 4,
        "photos": ["url1", "url2"],
        "jardin": True,
        "terrasse": True,
        "dpe": "C",
        "annee_construction": 2010,
    }


class TestCreateAnnonce:
    """Tests de création d'annonce (POST /api/v1/annonces)."""

    def test_create_annonce_valid(self, client, auth_token, valid_annonce_data):
        """Créer une annonce avec données valides."""
        response = client.post(
            "/api/v1/annonces",
            data=json.dumps(valid_annonce_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["titre"] == valid_annonce_data["titre"]
        assert data["prix"] == valid_annonce_data["prix"]
        assert data["statut"] == "brouillon"
        assert data["annonce_id"] is not None
        assert data["date_creation"] is not None

    def test_create_annonce_no_auth(self, client, valid_annonce_data):
        """Créer sans JWT devrait retourner 401."""
        response = client.post(
            "/api/v1/annonces",
            data=json.dumps(valid_annonce_data),
            content_type="application/json"
        )
        assert response.status_code == 401

    def test_create_annonce_invalid_prix(self, client, auth_token, valid_annonce_data):
        """Prix négatif devrait être rejeté."""
        valid_annonce_data["prix"] = -1000
        response = client.post(
            "/api/v1/annonces",
            data=json.dumps(valid_annonce_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_create_annonce_invalid_code_postal(self, client, auth_token, valid_annonce_data):
        """Code postal invalide devrait être rejeté."""
        valid_annonce_data["code_postal"] = "ABCDE"
        response = client.post(
            "/api/v1/annonces",
            data=json.dumps(valid_annonce_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400

    def test_create_annonce_missing_required_field(self, client, auth_token, valid_annonce_data):
        """Champ obligatoire manquant devrait être rejeté."""
        del valid_annonce_data["titre"]
        response = client.post(
            "/api/v1/annonces",
            data=json.dumps(valid_annonce_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400

    def test_create_annonce_invalid_type_bien(self, client, auth_token, valid_annonce_data):
        """Type de bien invalide devrait être rejeté."""
        valid_annonce_data["type_bien"] = "villa"
        response = client.post(
            "/api/v1/annonces",
            data=json.dumps(valid_annonce_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400


class TestGetAnnonce:
    """Tests de récupération d'annonce (GET /api/v1/annonces/{id})."""

    def test_get_annonce_by_id(self, app, client, test_user, valid_annonce_data):
        """Récupérer une annonce par ID."""
        # Créer l'annonce
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        # Récupérer
        response = client.get(f"/api/v1/annonces/{annonce_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert data["annonce_id"] == annonce_id
        assert data["titre"] == valid_annonce_data["titre"]

    def test_get_annonce_not_found(self, client):
        """Récupérer une annonce inexistante."""
        response = client.get("/api/v1/annonces/99999")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data


class TestListAnnonces:
    """Tests de listing d'annonces (GET /api/v1/annonces)."""

    def test_list_annonces_empty(self, client):
        """Lister des annonces quand il n'y en a pas."""
        response = client.get("/api/v1/annonces")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 0
        assert len(data["items"]) == 0

    def test_list_annonces_pagination(self, app, client, test_user, valid_annonce_data):
        """Tester la pagination."""
        with app.app_context():
            # Créer 5 annonces
            for i in range(5):
                data = valid_annonce_data.copy()
                data["titre"] = f"Annonce {i}"
                annonce_data = CreateAnnonce(**data)
                create_annonce(db.session, test_user.utilisateur_id, annonce_data)

        # Récupérer avec limit=2
        response = client.get("/api/v1/annonces?skip=0&limit=2")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["skip"] == 0
        assert data["limit"] == 2

        # Récupérer page 2
        response = client.get("/api/v1/annonces?skip=2&limit=2")
        assert response.status_code == 200
        data = response.get_json()
        assert len(data["items"]) == 2

    def test_list_annonces_filter_by_ville(self, app, client, test_user, valid_annonce_data):
        """Filtrer par ville."""
        with app.app_context():
            # Créer annonce à Paris
            annonce_data = CreateAnnonce(**valid_annonce_data)
            create_annonce(db.session, test_user.utilisateur_id, annonce_data)

            # Créer annonce à Lyon
            data_lyon = valid_annonce_data.copy()
            data_lyon["ville"] = "Lyon"
            data_lyon["code_postal"] = "69000"
            annonce_data_lyon = CreateAnnonce(**data_lyon)
            create_annonce(db.session, test_user.utilisateur_id, annonce_data_lyon)

        # Filtrer par Paris
        response = client.get("/api/v1/annonces?ville=Paris")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert data["items"][0]["ville"] == "Paris"

    def test_list_annonces_filter_by_price_range(self, app, client, test_user, valid_annonce_data):
        """Filtrer par plage de prix."""
        with app.app_context():
            # Créer annonces à différents prix
            for price in [100000, 300000, 500000]:
                data = valid_annonce_data.copy()
                data["prix"] = price
                annonce_data = CreateAnnonce(**data)
                create_annonce(db.session, test_user.utilisateur_id, annonce_data)

        # Filtrer 200000-400000
        response = client.get("/api/v1/annonces?prix_min=200000&prix_max=400000")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert data["items"][0]["prix"] == 300000

    def test_list_annonces_filter_by_type_bien(self, app, client, test_user, valid_annonce_data):
        """Filtrer par type de bien."""
        with app.app_context():
            # Créer annonce maison
            annonce_data = CreateAnnonce(**valid_annonce_data)
            create_annonce(db.session, test_user.utilisateur_id, annonce_data)

            # Créer annonce appartement
            data_apt = valid_annonce_data.copy()
            data_apt["type_bien"] = "appartement"
            data_apt["nombre_pieces"] = 3
            annonce_data_apt = CreateAnnonce(**data_apt)
            create_annonce(db.session, test_user.utilisateur_id, annonce_data_apt)

        # Filtrer par maison
        response = client.get("/api/v1/annonces?type_bien=maison")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert data["items"][0]["type_bien"] == "maison"

    def test_list_annonces_search(self, app, client, test_user, valid_annonce_data):
        """Recherche texte."""
        with app.app_context():
            # Créer annonce
            annonce_data = CreateAnnonce(**valid_annonce_data)
            create_annonce(db.session, test_user.utilisateur_id, annonce_data)

        # Rechercher par titre
        response = client.get("/api/v1/annonces?search=Maison")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1

        # Rechercher par description
        response = client.get("/api/v1/annonces?search=lumineuse")
        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1


class TestUpdateAnnonce:
    """Tests de mise à jour d'annonce (PUT /api/v1/annonces/{id})."""

    def test_update_annonce_owner(self, app, client, test_user, auth_token, valid_annonce_data):
        """Propriétaire peut mettre à jour."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        update_data = {"prix": 450000.0, "titre": "Maison rénovée"}
        response = client.put(
            f"/api/v1/annonces/{annonce_id}",
            data=json.dumps(update_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["prix"] == 450000.0
        assert data["titre"] == "Maison rénovée"

    def test_update_annonce_non_owner(self, app, client, test_user, test_user_2, auth_token_2, valid_annonce_data):
        """Non-propriétaire ne peut pas mettre à jour."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        update_data = {"prix": 450000.0}
        response = client.put(
            f"/api/v1/annonces/{annonce_id}",
            data=json.dumps(update_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token_2}"}
        )
        assert response.status_code == 403

    def test_update_annonce_invalid_data(self, app, client, test_user, auth_token, valid_annonce_data):
        """Données invalides sont rejetées."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        update_data = {"prix": -500}
        response = client.put(
            f"/api/v1/annonces/{annonce_id}",
            data=json.dumps(update_data),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400


class TestDeleteAnnonce:
    """Tests de suppression d'annonce (DELETE /api/v1/annonces/{id})."""

    def test_delete_annonce_owner(self, app, client, test_user, auth_token, valid_annonce_data):
        """Propriétaire peut supprimer."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        response = client.delete(
            f"/api/v1/annonces/{annonce_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 204

        # Vérifier que l'annonce n'existe plus
        with app.app_context():
            with pytest.raises(AnnoncesNotFoundError):
                get_annonce(db.session, annonce_id)

    def test_delete_annonce_non_owner(self, app, client, test_user, test_user_2, auth_token_2, valid_annonce_data):
        """Non-propriétaire ne peut pas supprimer."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        response = client.delete(
            f"/api/v1/annonces/{annonce_id}",
            headers={"Authorization": f"Bearer {auth_token_2}"}
        )
        assert response.status_code == 403


class TestPublishAnnonce:
    """Tests de publication d'annonce (POST /api/v1/annonces/{id}/publier) [BONUS]."""

    def test_publish_annonce_from_brouillon(self, app, client, test_user, auth_token, valid_annonce_data):
        """Publier une annonce en brouillon."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        response = client.post(
            f"/api/v1/annonces/{annonce_id}/publier",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["statut"] == "publiée"

    def test_publish_annonce_already_published(self, app, client, test_user, auth_token, valid_annonce_data):
        """Publier une annonce déjà publiée devrait échouer."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id
            # Publier une première fois
            publish_annonce(db.session, annonce_id, test_user.utilisateur_id)

        # Essayer de publier à nouveau
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/publier",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 422

    def test_publish_annonce_non_owner(self, app, client, test_user, test_user_2, auth_token_2, valid_annonce_data):
        """Non-propriétaire ne peut pas publier."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        response = client.post(
            f"/api/v1/annonces/{annonce_id}/publier",
            headers={"Authorization": f"Bearer {auth_token_2}"}
        )
        assert response.status_code == 403


class TestCRUDFunctions:
    """Tests des fonctions CRUD directes."""

    def test_create_annonce_function(self, app, test_user, valid_annonce_data):
        """Test create_annonce()."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            assert annonce.annonce_id is not None
            assert annonce.titre == valid_annonce_data["titre"]
            assert annonce.utilisateur_id == test_user.utilisateur_id

    def test_get_annonce_function_not_found(self, app):
        """Test get_annonce() avec ID inexistant."""
        with app.app_context():
            with pytest.raises(AnnoncesNotFoundError):
                get_annonce(db.session, 99999)

    def test_update_annonce_function(self, app, test_user, valid_annonce_data):
        """Test update_annonce()."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)

            update_data = UpdateAnnonce(prix=450000.0, titre="Maison rénovée")
            updated = update_annonce(
                db.session,
                annonce.annonce_id,
                test_user.utilisateur_id,
                update_data
            )
            assert updated.prix == 450000.0
            assert updated.titre == "Maison rénovée"

    def test_delete_annonce_function(self, app, test_user, valid_annonce_data):
        """Test delete_annonce()."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

            result = delete_annonce(db.session, annonce_id, test_user.utilisateur_id)
            assert result is True

            with pytest.raises(AnnoncesNotFoundError):
                get_annonce(db.session, annonce_id)

    def test_list_annonces_function(self, app, test_user, valid_annonce_data):
        """Test list_annonces()."""
        with app.app_context():
            # Créer 3 annonces
            for i in range(3):
                data = valid_annonce_data.copy()
                data["titre"] = f"Annonce {i}"
                annonce_data = CreateAnnonce(**data)
                create_annonce(db.session, test_user.utilisateur_id, annonce_data)

            # Lister
            annonces, total = list_annonces(db.session, skip=0, limit=20)
            assert len(annonces) == 3
            assert total == 3

    def test_publish_annonce_function(self, app, test_user, valid_annonce_data):
        """Test publish_annonce()."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)

            published = publish_annonce(db.session, annonce.annonce_id, test_user.utilisateur_id)
            assert published.statut == "publiée"


class TestStateTransitions:
    """Tests des transitions d'état d'annonce."""

    def test_archive_annonce_endpoint(self, client, auth_token, app, test_user, valid_annonce_data):
        """Archiver une annonce via endpoint."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        # Publier d'abord
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/publier",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200

        # Archiver
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/archiver",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["statut"] == "archivée"
        assert data["date_statut"] is not None

    def test_archive_annonce_not_owner(self, client, auth_token_2, app, test_user, valid_annonce_data):
        """Archiver l'annonce de quelqu'un d'autre devrait retourner 403."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        response = client.post(
            f"/api/v1/annonces/{annonce_id}/archiver",
            headers={"Authorization": f"Bearer {auth_token_2}"}
        )
        assert response.status_code == 403

    def test_archive_sold_annonce_fails(self, client, auth_token, app, test_user, valid_annonce_data):
        """Archiver une annonce vendue devrait retourner 422."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

            # Marquer comme vendue
            annonce.statut = "vendue"
            db.session.add(annonce)
            db.session.commit()

        response = client.post(
            f"/api/v1/annonces/{annonce_id}/archiver",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 422

    def test_sell_annonce_endpoint(self, client, auth_token, app, test_user, valid_annonce_data):
        """Marquer une annonce comme vendue via endpoint."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        # Publier d'abord
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/publier",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200

        # Vendre
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/vendre",
            data=json.dumps({}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["statut"] == "vendue"
        assert data["date_vente"] is not None
        assert data["date_statut"] is not None

    def test_sell_annonce_with_date(self, client, auth_token, app, test_user, valid_annonce_data):
        """Marquer une annonce comme vendue avec une date spécifique."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        # Publier d'abord
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/publier",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200

        # Vendre avec date
        sale_date = "2026-04-15T14:30:00"
        response = client.post(
            f"/api/v1/annonces/{annonce_id}/vendre",
            data=json.dumps({"date_vente": sale_date}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["statut"] == "vendue"
        assert data["date_vente"] is not None

    def test_sell_annonce_not_owner(self, client, auth_token_2, app, test_user, valid_annonce_data):
        """Vendre l'annonce de quelqu'un d'autre devrait retourner 403."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        response = client.post(
            f"/api/v1/annonces/{annonce_id}/vendre",
            data=json.dumps({}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token_2}"}
        )
        assert response.status_code == 403

    def test_sell_archived_annonce_fails(self, client, auth_token, app, test_user, valid_annonce_data):
        """Vendre une annonce archivée devrait retourner 422."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

            # Marquer comme archivée
            annonce.statut = "archivée"
            db.session.add(annonce)
            db.session.commit()

        response = client.post(
            f"/api/v1/annonces/{annonce_id}/vendre",
            data=json.dumps({}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 422

    def test_sell_annonce_invalid_date_format(self, client, auth_token, app, test_user, valid_annonce_data):
        """Format de date invalide devrait retourner 400."""
        with app.app_context():
            annonce_data = CreateAnnonce(**valid_annonce_data)
            annonce = create_annonce(db.session, test_user.utilisateur_id, annonce_data)
            annonce_id = annonce.annonce_id

        response = client.post(
            f"/api/v1/annonces/{annonce_id}/vendre",
            data=json.dumps({"date_vente": "invalid-date"}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
