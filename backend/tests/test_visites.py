"""
Tests pour le système de réservation de visites.

Tests :
- Création d'une visite valide
- Double réservation (erreur 400)
- Date dans le passé (erreur 400)
- Score < 5 (erreur 403)
- Annulation d'une visite
- Listing des visites par acheteur/vendeur
- Modification de visite avec notifications email
- Feedback post-visite avec validation
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.auth.models import User, db
from src.models.visites import Visite
from src.models.annonces import Annonce
from src.auth.utils import generate_access_token


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
def mock_email_service():
    """Mock du service d'email pour les tests."""
    with patch('src.services.visites.EmailService') as mock_service:
        # Mock des méthodes statiques
        mock_service.envoyer_email = MagicMock()
        mock_service.generer_email_modification_rdv = MagicMock(return_value="<html>Email HTML</html>")
        mock_service.generer_email_feedback = MagicMock(return_value="<html>Feedback HTML</html>")
        yield mock_service


@pytest.fixture
def authenticated_user(app, client):
    """Crée un utilisateur acheteur authentifié."""
    with app.app_context():
        # Créer un utilisateur avec les critères acheteur fusionnés
        user = User(
            email="acheteur@example.com",
            nom="Dupont",
            prenom="Jean",
            role="acheteur",
            actif=True,
            # Critères acheteur (fusionnés dans User)
            budget_max=250000,
            ville_recherchee="Paris",
            type_bien_recherche="appartement",
            surface_min=50
        )
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()

        # Générer token
        token = generate_access_token(
            user_id=user.utilisateur_id,
            email=user.email,
            role=user.role
        )

        return {
            "user": user,
            "token": token,
            "email": user.email,
            "password": "password123"
        }


@pytest.fixture
def vendeur_user(app):
    """Crée un utilisateur vendeur."""
    with app.app_context():
        user = User(
            email="vendeur@example.com",
            nom="Martin",
            prenom="Paul",
            role="vendeur",
            actif=True
        )
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def annonce_valide(app, vendeur_user):
    """Crée une annonce publiée pour les tests."""
    with app.app_context():
        annonce = Annonce(
            titre="Bel appartement à Paris",
            description="Magnifique appartement 3 pièces",
            prix=200000,
            surface=75,
            adresse="123 Rue de Paris",
            code_postal="75001",
            ville="Paris",
            type_bien="appartement",
            nombre_pieces=3,
            utilisateur_id=vendeur_user.utilisateur_id,
            statut="publiée"
        )
        db.session.add(annonce)
        db.session.commit()
        return annonce


class TestCreerVisite:
    """Tests de création de visites."""

    def test_creer_visite_valide(self, client, app, authenticated_user, annonce_valide):
        """Test 1: Création d'une visite valide réussit avec status 201."""
        with app.app_context():
            # Date future valide
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response.status_code == 201
            data = response.get_json()
            assert data["status"] == "success"
            assert data["data"]["statut"] == "confirmee"
            assert data["data"]["score_matching"] >= 5
            assert "Notification envoyée" in data["data"]["message"]

    def test_double_reservation_erreur_400(self, client, app, authenticated_user, annonce_valide):
        """Test 2: Double réservation retourne erreur 400."""
        with app.app_context():
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            # Première visite
            response1 = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response1.status_code == 201

            # Deuxième visite même heure
            response2 = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response2.status_code == 400
            data = response2.get_json()
            assert data["status"] == "error"
            assert "déjà réservée" in data["error"]

    def test_date_passee_erreur_400(self, client, app, authenticated_user, annonce_valide):
        """Test 3: Date dans le passé retourne erreur 400."""
        with app.app_context():
            # Date dans le passé
            date_visite = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%dT14:00:00")

            response = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response.status_code == 400
            data = response.get_json()
            assert "passé" in data["error"].lower()

    def test_score_insuffisant_erreur_403(self, client, app, annonce_valide):
        """Test 4: Score < 5 retourne erreur 403."""
        with app.app_context():
            # Créer acheteur avec mauvais profil (score < 5)
            user = User(
                email="bad_acheteur@example.com",
                nom="Dupont",
                prenom="Jean",
                role="acheteur",
                actif=True
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()

            user = User(
                email="low-budget@example.com",
                nom="Dupont",
                prenom="Jean",
                role="acheteur",
                actif=True,
                # Critères acheteur avec mauvais score
                budget_max=50000,  # Trop bas
                ville_recherchee="Marseille",  # Mauvaise ville
                type_bien_recherche="maison",  # Mauvais type
                surface_min=100  # Surface trop grande
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()

            # Token
            token = generate_access_token(
                user_id=user.utilisateur_id,
                email=user.email,
                role=user.role
            )

            # Tentative de réservation
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": user.utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )

            assert response.status_code == 403
            data = response.get_json()
            assert "score" in data["error"].lower()

    def test_annonce_inexistante_erreur_400(self, client, app, authenticated_user):
        """Test: Annonce inexistante retourne 400."""
        with app.app_context():
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": 9999,  # ID inexistant
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response.status_code == 400
            data = response.get_json()
            assert "n'existe pas" in data["error"]

    def test_acheteur_inexistant_erreur_400(self, client, app, authenticated_user, annonce_valide):
        """Test: Acheteur inexistant retourne 400."""
        with app.app_context():
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": 9999,  # ID inexistant
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response.status_code == 400
            data = response.get_json()
            assert "n'existe pas" in data["error"]


class TestAnnulerVisite:
    """Tests d'annulation de visites."""

    def test_annuler_visite_succes(self, client, app, authenticated_user, annonce_valide):
        """Test l'annulation réussie d'une visite."""
        with app.app_context():
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            # Créer une visite
            response_create = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            visite_id = response_create.get_json()["data"]["id"]

            # Annuler la visite
            response_cancel = client.delete(
                f"/api/v1/visites/{visite_id}",
                headers={"Authorization": f"Bearer {authenticated_user['token']}"}
            )

            assert response_cancel.status_code == 200
            data = response_cancel.get_json()
            assert data["status"] == "success"
            assert data["data"]["statut"] == "annulee"

    def test_annuler_visite_inexistante(self, client, authenticated_user):
        """Test l'annulation d'une visite inexistante."""
        response = client.delete(
            "/api/v1/visites/9999",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        assert response.status_code == 404
        data = response.get_json()
        assert "n'existe pas" in data["error"]


class TestListerVisites:
    """Tests du listing des visites."""

    def test_lister_visites_acheteur(self, client, app, authenticated_user, annonce_valide):
        """Test le listing des visites pour un acheteur."""
        with app.app_context():
            # Créer deux visites
            for i in range(2):
                date_visite = (datetime.utcnow() + timedelta(days=5+i)).strftime("%Y-%m-%dT14:00:00")

                client.post(
                    "/api/v1/visites",
                    data=json.dumps({
                        "acheteur_id": authenticated_user["user"].utilisateur_id,
                        "annonce_id": annonce_valide.annonce_id,
                        "date_heure": date_visite
                    }),
                    headers={
                        "Authorization": f"Bearer {authenticated_user['token']}",
                        "Content-Type": "application/json"
                    }
                )

            # Lister les visites
            response = client.get(
                "/api/v1/visites",
                headers={"Authorization": f"Bearer {authenticated_user['token']}"}
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["status"] == "success"
            assert data["count"] == 2

    def test_lister_visites_vendeur(self, client, app, vendeur_user, annonce_valide, authenticated_user):
        """Test le listing des visites pour un vendeur."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            # Token vendeur
            token = generate_access_token(
                user_id=vendeur_user.utilisateur_id,
                email=vendeur_user.email,
                role=vendeur_user.role
            )

            # Lister les visites du vendeur
            response = client.get(
                "/api/v1/visites",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["status"] == "success"
            assert data["count"] >= 1


class TestDownloadICS:
    """Tests du téléchargement du fichier iCalendar."""

    def test_download_ics_acheteur(self, client, app, authenticated_user, annonce_valide):
        """Test que l'acheteur peut télécharger le fichier .ics."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response_create = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            visite_id = response_create.get_json()["data"]["id"]

            # Télécharger le fichier .ics
            response_ics = client.get(
                f"/api/v1/visites/{visite_id}/download.ics",
                headers={"Authorization": f"Bearer {authenticated_user['token']}"}
            )

            assert response_ics.status_code == 200
            assert response_ics.content_type == "text/calendar"
            assert b"BEGIN:VCALENDAR" in response_ics.data
            assert b"BEGIN:VEVENT" in response_ics.data
            assert b"immo2000-visite-" in response_ics.data

    def test_download_ics_vendeur(self, client, app, authenticated_user, annonce_valide, vendeur_user):
        """Test que le vendeur peut télécharger le fichier .ics."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            # Récupérer l'ID de la visite
            visite = Visite.query.filter_by(acheteur_id=authenticated_user["user"].utilisateur_id).first()
            visite_id = visite.id

            # Token vendeur
            token = generate_access_token(
                user_id=vendeur_user.utilisateur_id,
                email=vendeur_user.email,
                role=vendeur_user.role
            )

            # Vendeur télécharge le fichier .ics
            response_ics = client.get(
                f"/api/v1/visites/{visite_id}/download.ics",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response_ics.status_code == 200
            assert response_ics.content_type == "text/calendar"
            assert b"BEGIN:VCALENDAR" in response_ics.data

    def test_download_ics_unauthorized(self, client, app, authenticated_user, annonce_valide):
        """Test qu'un utilisateur tiers ne peut pas télécharger."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response_create = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            visite_id = response_create.get_json()["data"]["id"]

            # Créer un autre utilisateur
            user = User(
                email="autre@example.com",
                nom="Martin",
                prenom="Paul",
                role="acheteur",
                actif=True
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()

            token = generate_access_token(
                user_id=user.utilisateur_id,
                email=user.email,
                role=user.role
            )

            # Tentative de téléchargement
            response_ics = client.get(
                f"/api/v1/visites/{visite_id}/download.ics",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response_ics.status_code == 403
            data = response_ics.get_json()
            assert "n'avez pas accès" in data["error"]

    def test_download_ics_inexistante(self, client, authenticated_user):
        """Test le téléchargement d'une visite inexistante."""
        response = client.get(
            "/api/v1/visites/9999/download.ics",
            headers={"Authorization": f"Bearer {authenticated_user['token']}"}
        )

        assert response.status_code == 404
        data = response.get_json()
        assert "inexistante" in data["error"]

    def test_download_ics_content_valid(self, client, app, authenticated_user, annonce_valide):
        """Test que le contenu du fichier .ics est valide."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response_create = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            visite_id = response_create.get_json()["data"]["id"]

            # Télécharger le fichier .ics
            response_ics = client.get(
                f"/api/v1/visites/{visite_id}/download.ics",
                headers={"Authorization": f"Bearer {authenticated_user['token']}"}
            )

            assert response_ics.status_code == 200
            ics_content = response_ics.data.decode('utf-8')

            # Vérifier les éléments clés du fichier .ics
            assert "BEGIN:VCALENDAR" in ics_content
            assert "VERSION:2.0" in ics_content
            assert "BEGIN:VEVENT" in ics_content
            assert f"UID:immo2000-visite-{visite_id}@immo2000.fr" in ics_content
            assert "SUMMARY:" in ics_content
            assert "DESCRIPTION:" in ics_content
            assert "LOCATION:" in ics_content
            assert "DTSTART:" in ics_content
            assert "DTEND:" in ics_content
            assert "ORGANIZER:mailto:" in ics_content
            assert "ATTENDEE:mailto:" in ics_content


class TestModifierVisite:
    """Tests de modification de visites."""

    def test_modifier_visite_date_acheteur(self, client, app, authenticated_user, annonce_valide):
        """Test que l'acheteur peut modifier la date d'une visite."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response_create = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            visite_id = response_create.get_json()["data"]["id"]

            # Modifier la date
            nouvelle_date = (datetime.utcnow() + timedelta(days=6)).strftime("%Y-%m-%dT15:00:00")

            response_modify = client.put(
                f"/api/v1/visites/{visite_id}",
                data=json.dumps({"date_heure": nouvelle_date}),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response_modify.status_code == 200
            data = response_modify.get_json()
            assert data["status"] == "success"
            assert "modifié" in data["data"]["message"].lower()

    def test_modifier_visite_vendeur(self, client, app, authenticated_user, annonce_valide, vendeur_user):
        """Test que le vendeur peut modifier la date d'une visite."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            # Récupérer l'ID de la visite
            visite = Visite.query.filter_by(acheteur_id=authenticated_user["user"].utilisateur_id).first()
            visite_id = visite.id

            # Token vendeur
            token = generate_access_token(
                user_id=vendeur_user.utilisateur_id,
                email=vendeur_user.email,
                role=vendeur_user.role
            )

            # Vendeur modifie la date
            nouvelle_date = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%dT16:00:00")

            response_modify = client.put(
                f"/api/v1/visites/{visite_id}",
                data=json.dumps({"date_heure": nouvelle_date}),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )

            assert response_modify.status_code == 200

    def test_modifier_visite_tiers_erreur_403(self, client, app, authenticated_user, annonce_valide):
        """Test qu'un tiers ne peut pas modifier une visite."""
        with app.app_context():
            # Créer une visite
            date_visite = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            response_create = client.post(
                "/api/v1/visites",
                data=json.dumps({
                    "acheteur_id": authenticated_user["user"].utilisateur_id,
                    "annonce_id": annonce_valide.annonce_id,
                    "date_heure": date_visite
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            visite_id = response_create.get_json()["data"]["id"]

            # Créer un autre utilisateur
            user = User(
                email="tiers@example.com",
                nom="Martin",
                prenom="Paul",
                role="acheteur",
                actif=True
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()

            token = generate_access_token(
                user_id=user.utilisateur_id,
                email=user.email,
                role=user.role
            )

            # Tentative de modification par tiers
            nouvelle_date = (datetime.utcnow() + timedelta(days=6)).strftime("%Y-%m-%dT15:00:00")

            response_modify = client.put(
                f"/api/v1/visites/{visite_id}",
                data=json.dumps({"date_heure": nouvelle_date}),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )

            assert response_modify.status_code == 403
            data = response_modify.get_json()
            assert "autorisé" in data["error"].lower()

    def test_modifier_visite_date_passee_erreur_400(self, client, app, authenticated_user, annonce_valide):
        """Test qu'on ne peut pas modifier une visite qui a eu lieu."""
        with app.app_context():
            # Créer une visite dans le passé
            date_passee = (datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%dT14:00:00")

            visite = Visite(
                acheteur_id=authenticated_user["user"].utilisateur_id,
                annonce_id=annonce_valide.annonce_id,
                date_heure=datetime.fromisoformat(date_passee.replace('Z', '+00:00')),
                statut="confirmee"
            )
            db.session.add(visite)
            db.session.commit()

            visite_id = visite.id

            # Tenter une modification
            nouvelle_date = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%dT15:00:00")

            response_modify = client.put(
                f"/api/v1/visites/{visite_id}",
                data=json.dumps({"date_heure": nouvelle_date}),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response_modify.status_code == 400
            data = response_modify.get_json()
            assert "eu lieu" in data["error"].lower()


class TestFeedback:
    """Tests du système de feedback post-visite."""

    def test_soumettre_feedback_valide(self, client, app, authenticated_user, annonce_valide):
        """Test que l'acheteur peut soumettre un feedback après la visite."""
        with app.app_context():
            # Créer une visite dans le passé (terminée)
            date_passee = (datetime.utcnow() - timedelta(hours=1)).strftime("%Y-%m-%dT14:00:00")

            visite = Visite(
                acheteur_id=authenticated_user["user"].utilisateur_id,
                annonce_id=annonce_valide.annonce_id,
                date_heure=datetime.fromisoformat(date_passee.replace('Z', '+00:00')),
                statut="terminee"
            )
            db.session.add(visite)
            db.session.commit()

            visite_id = visite.id

            # Soumettre un feedback
            response = client.post(
                "/api/v1/feedbacks",
                data=json.dumps({
                    "visite_id": visite_id,
                    "note": 4,
                    "commentaire": "Belle visite, mais la cuisine est un peu petite."
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response.status_code == 201
            data = response.get_json()
            assert data["status"] == "success"
            assert data["data"]["note"] == 4
            assert "Feedback enregistré" in data["data"]["message"]

    def test_soumettre_feedback_trop_tot_erreur_400(self, client, app, authenticated_user, annonce_valide):
        """Test qu'on ne peut pas soumettre un feedback avant la visite."""
        with app.app_context():
            # Créer une visite future
            date_future = (datetime.utcnow() + timedelta(hours=1)).strftime("%Y-%m-%dT14:00:00")

            visite = Visite(
                acheteur_id=authenticated_user["user"].utilisateur_id,
                annonce_id=annonce_valide.annonce_id,
                date_heure=datetime.fromisoformat(date_future.replace('Z', '+00:00')),
                statut="confirmee"
            )
            db.session.add(visite)
            db.session.commit()

            visite_id = visite.id

            # Tenter de soumettre un feedback
            response = client.post(
                "/api/v1/feedbacks",
                data=json.dumps({
                    "visite_id": visite_id,
                    "note": 4,
                    "commentaire": "Test"
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response.status_code == 400
            data = response.get_json()
            assert "après la visite" in data["error"].lower()

    def test_soumettre_feedback_doublon_erreur_400(self, client, app, authenticated_user, annonce_valide):
        """Test qu'on ne peut pas soumettre deux feedbacks pour la même visite."""
        with app.app_context():
            from src.models.feedbacks import Feedback

            # Créer une visite terminée
            date_passee = (datetime.utcnow() - timedelta(hours=1)).strftime("%Y-%m-%dT14:00:00")

            visite = Visite(
                acheteur_id=authenticated_user["user"].utilisateur_id,
                annonce_id=annonce_valide.annonce_id,
                date_heure=datetime.fromisoformat(date_passee.replace('Z', '+00:00')),
                statut="terminee"
            )
            db.session.add(visite)
            db.session.commit()

            visite_id = visite.id

            # Soumettre un premier feedback
            response1 = client.post(
                "/api/v1/feedbacks",
                data=json.dumps({
                    "visite_id": visite_id,
                    "note": 4,
                    "commentaire": "Premier feedback"
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response1.status_code == 201

            # Tenter un deuxième feedback
            response2 = client.post(
                "/api/v1/feedbacks",
                data=json.dumps({
                    "visite_id": visite_id,
                    "note": 5,
                    "commentaire": "Deuxième feedback"
                }),
                headers={
                    "Authorization": f"Bearer {authenticated_user['token']}",
                    "Content-Type": "application/json"
                }
            )

            assert response2.status_code == 400
            data = response2.get_json()
            assert "déjà laissé" in data["error"].lower()

    def test_recuperer_feedback_acheteur(self, client, app, authenticated_user, annonce_valide):
        """Test que l'acheteur peut récupérer le feedback qu'il a laissé."""
        with app.app_context():
            from src.models.feedbacks import Feedback

            # Créer une visite et un feedback
            date_passee = (datetime.utcnow() - timedelta(hours=1)).strftime("%Y-%m-%dT14:00:00")

            visite = Visite(
                acheteur_id=authenticated_user["user"].utilisateur_id,
                annonce_id=annonce_valide.annonce_id,
                date_heure=datetime.fromisoformat(date_passee.replace('Z', '+00:00')),
                statut="terminee"
            )
            db.session.add(visite)
            db.session.commit()

            feedback = Feedback(
                visite_id=visite.id,
                acheteur_id=authenticated_user["user"].utilisateur_id,
                note=4,
                commentaire="Belle visite"
            )
            db.session.add(feedback)
            db.session.commit()

            # Récupérer le feedback
            response = client.get(
                f"/api/v1/visites/{visite.id}/feedback",
                headers={"Authorization": f"Bearer {authenticated_user['token']}"}
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["status"] == "success"
            assert data["data"]["note"] == 4
            assert "Belle visite" in data["data"]["commentaire"]

    def test_recuperer_feedback_vendeur(self, client, app, authenticated_user, annonce_valide, vendeur_user):
        """Test que le vendeur peut récupérer le feedback laissé sur son annonce."""
        with app.app_context():
            from src.models.feedbacks import Feedback

            # Créer une visite et un feedback
            date_passee = (datetime.utcnow() - timedelta(hours=1)).strftime("%Y-%m-%dT14:00:00")

            visite = Visite(
                acheteur_id=authenticated_user["user"].utilisateur_id,
                annonce_id=annonce_valide.annonce_id,
                date_heure=datetime.fromisoformat(date_passee.replace('Z', '+00:00')),
                statut="terminee"
            )
            db.session.add(visite)
            db.session.commit()

            feedback = Feedback(
                visite_id=visite.id,
                acheteur_id=authenticated_user["user"].utilisateur_id,
                note=4,
                commentaire="Belle visite"
            )
            db.session.add(feedback)
            db.session.commit()

            # Token vendeur
            token = generate_access_token(
                user_id=vendeur_user.utilisateur_id,
                email=vendeur_user.email,
                role=vendeur_user.role
            )

            # Vendeur récupère le feedback
            response = client.get(
                f"/api/v1/visites/{visite.id}/feedback",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["data"]["note"] == 4
