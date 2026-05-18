"""
Tests pour le tunnel de création d'annonce (4 étapes)
pytest backend/tests/test_tunnel_annonce.py -v
"""

import json
import os
import pytest
from io import BytesIO
from PIL import Image
from flask import json as flask_json

from src.app import create_app, db
from src.auth.models import User
from src.models.annonces import Annonce
from src.models.photos import Photo


@pytest.fixture
def app():
    """Fixture pour créer l'app Flask avec une BD de test"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Fixture pour créer un client test"""
    return app.test_client()


@pytest.fixture
def app_context(app):
    """Fixture pour avoir le contexte app"""
    with app.app_context():
        yield app


def create_test_image():
    """Crée une image PIL test"""
    img = Image.new('RGB', (100, 100), color='red')
    img_io = BytesIO()
    img.save(img_io, 'JPEG')
    img_io.seek(0)
    return img_io


class TestTunnelEtape1:
    """Tests pour l'étape 1 : Créer un brouillon avec photos"""

    def test_creer_brouillon_success(self, client):
        """Test : Créer un brouillon avec succès"""
        data = {
            'titre': 'Bel appartement à Paris',
            'adresse': '123 Rue de la Paix',
            'code_postal': '75001',
            'ville': 'Paris',
            'masquer_adresse_complete': False,
            'photos': (create_test_image(), 'test.jpg'),
        }

        response = client.post(
            '/api/v1/annonces/brouillon',
            data=data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert 'annonce_id' in json_data
        assert 'temp_photo_urls' in json_data
        assert json_data['temp_photo_urls'] is not None

    def test_creer_brouillon_missing_required_fields(self, client):
        """Test : Créer brouillon sans champs requis échoue"""
        data = {
            'titre': 'Bel appartement',
            # Manque adresse, code_postal, ville
            'photos': (create_test_image(), 'test.jpg'),
        }

        response = client.post(
            '/api/v1/annonces/brouillon',
            data=data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 400

    def test_creer_brouillon_invalid_code_postal(self, client):
        """Test : Code postal invalide (ne doit pas être 5 chiffres)"""
        data = {
            'titre': 'Bel appartement',
            'adresse': '123 Rue de la Paix',
            'code_postal': '7500',  # 4 chiffres au lieu de 5
            'ville': 'Paris',
            'masquer_adresse_complete': False,
            'photos': (create_test_image(), 'test.jpg'),
        }

        response = client.post(
            '/api/v1/annonces/brouillon',
            data=data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 400
        assert 'code_postal' in response.get_json()['error'].lower()

    def test_creer_brouillon_no_photos(self, client):
        """Test : Créer brouillon sans photos échoue"""
        data = {
            'titre': 'Bel appartement',
            'adresse': '123 Rue de la Paix',
            'code_postal': '75001',
            'ville': 'Paris',
            'masquer_adresse_complete': False,
            # Pas de photos
        }

        response = client.post(
            '/api/v1/annonces/brouillon',
            data=data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 400

    def test_creer_brouillon_max_photos(self, client):
        """Test : Maximum 10 photos autorisées"""
        files = [('photos', (create_test_image(), f'test{i}.jpg')) for i in range(11)]
        data = {
            'titre': 'Bel appartement',
            'adresse': '123 Rue de la Paix',
            'code_postal': '75001',
            'ville': 'Paris',
            'masquer_adresse_complete': False,
        }
        data.update(files)

        response = client.post(
            '/api/v1/annonces/brouillon',
            data=data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 400


class TestTunnelEtape2:
    """Tests pour l'étape 2 : Créer un compte et lier le brouillon"""

    def test_inscription_avec_annonce_id(self, client, app_context):
        """Test : S'inscrire et lier un brouillon"""
        # D'abord créer un brouillon
        brouillon_data = {
            'titre': 'Bel appartement',
            'adresse': '123 Rue de la Paix',
            'code_postal': '75001',
            'ville': 'Paris',
            'masquer_adresse_complete': False,
            'photos': (create_test_image(), 'test.jpg'),
        }

        response = client.post(
            '/api/v1/annonces/brouillon',
            data=brouillon_data,
            content_type='multipart/form-data'
        )

        assert response.status_code == 201
        annonce_id = response.get_json()['annonce_id']
        temp_photo_urls = response.get_json()['temp_photo_urls']

        # Maintenant s'inscrire
        register_data = {
            'email': 'vendeur@immo2000.com',
            'mot_de_passe': 'SecurePass123!',
            'nom': 'Dupont',
            'prenom': 'Jean',
            'telephone': '+33612345678',
            'annonce_id': annonce_id,
            'temp_photo_urls': temp_photo_urls,
        }

        response = client.post(
            '/api/v1/auth/register',
            json=register_data
        )

        assert response.status_code == 201
        json_data = response.get_json()
        assert 'access_token' in json_data
        assert 'utilisateur_id' in json_data

        # Vérifier que l'annonce est liée à l'utilisateur
        user_id = json_data['utilisateur_id']
        annonce = Annonce.query.get(annonce_id)
        assert annonce is not None
        assert annonce.utilisateur_id == user_id

    def test_inscription_password_validation(self, client):
        """Test : Validation du mot de passe"""
        register_data = {
            'email': 'vendeur@immo2000.com',
            'mot_de_passe': 'weak',  # Mot de passe faible
            'nom': 'Dupont',
            'prenom': 'Jean',
            'telephone': '+33612345678',
        }

        response = client.post(
            '/api/v1/auth/register',
            json=register_data
        )

        assert response.status_code == 400
        assert 'mot_de_passe' in response.get_json()['error'].lower()


class TestTunnelEtape3:
    """Tests pour l'étape 3 : Signer le contrat d'exclusivité"""

    def test_signer_contrat_success(self, client, app_context):
        """Test : Signer le contrat avec succès"""
        # Créer un utilisateur
        user = User(
            email='vendeur@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Dupont',
            prenom='Jean',
            telephone='+33612345678',
        )
        db.session.add(user)
        db.session.commit()

        # Générer un token
        from src.auth.routes import generate_access_token
        token = generate_access_token(user)

        # Signer le contrat
        response = client.post(
            '/api/v1/contrats/exclusivite',
            json={'accepte': True},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['has_exclusivity_contract'] is True

        # Vérifier en BD
        user_updated = User.query.get(user.utilisateur_id)
        assert user_updated.has_exclusivity_contract is True

    def test_signer_contrat_false(self, client, app_context):
        """Test : accepte=False échoue"""
        user = User(
            email='vendeur@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Dupont',
            prenom='Jean',
            telephone='+33612345678',
        )
        db.session.add(user)
        db.session.commit()

        from src.auth.routes import generate_access_token
        token = generate_access_token(user)

        response = client.post(
            '/api/v1/contrats/exclusivite',
            json={'accepte': False},
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 400

    def test_signer_contrat_sans_jwt(self, client):
        """Test : Signature sans JWT échoue"""
        response = client.post(
            '/api/v1/contrats/exclusivite',
            json={'accepte': True}
        )

        assert response.status_code == 401


class TestTunnelEtape4:
    """Tests pour l'étape 4 : Compléter et publier l'annonce"""

    def test_completer_annonce_success(self, client, app_context):
        """Test : Compléter une annonce avec succès"""
        # Créer un utilisateur
        user = User(
            email='vendeur@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Dupont',
            prenom='Jean',
            telephone='+33612345678',
        )
        db.session.add(user)
        db.session.flush()

        # Créer une annonce brouillon pour cet utilisateur
        annonce = Annonce(
            titre='Bel appartement',
            adresse='123 Rue de la Paix',
            code_postal='75001',
            ville='Paris',
            utilisateur_id=user.utilisateur_id,
            statut='brouillon',
        )
        db.session.add(annonce)
        db.session.commit()

        # Générer un token
        from src.auth.routes import generate_access_token
        token = generate_access_token(user)

        # Compléter l'annonce
        complete_data = {
            'description': 'Magnifique appartement avec vue sur la Seine',
            'prix': 350000,
            'surface': 85,
            'nombre_pieces': 3,
            'type_bien': 'appartement',
            'etage': 4,
            'annee_construction': 2010,
            'dpe': 'B',
            'ascenseur': True,
            'balcon': True,
            'terrasse': False,
            'jardin': False,
            'piscine': False,
            'parking': True,
        }

        response = client.put(
            f'/api/v1/annonces/{annonce.annonce_id}/completer',
            json=complete_data,
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['statut'] == 'publiée'
        assert json_data['prix'] == 350000
        assert json_data['description'] == 'Magnifique appartement avec vue sur la Seine'

        # Vérifier en BD
        annonce_updated = Annonce.query.get(annonce.annonce_id)
        assert annonce_updated.statut == 'publiée'

    def test_completer_annonce_not_owner(self, client, app_context):
        """Test : Impossible de compléter l'annonce d'un autre"""
        # Créer deux utilisateurs
        user1 = User(
            email='vendeur1@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Dupont',
            prenom='Jean',
        )
        user2 = User(
            email='vendeur2@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Durand',
            prenom='Pierre',
        )
        db.session.add_all([user1, user2])
        db.session.flush()

        # Créer une annonce pour user1
        annonce = Annonce(
            titre='Bel appartement',
            adresse='123 Rue de la Paix',
            code_postal='75001',
            ville='Paris',
            utilisateur_id=user1.utilisateur_id,
            statut='brouillon',
        )
        db.session.add(annonce)
        db.session.commit()

        # Essayer de compléter avec user2
        from src.auth.routes import generate_access_token
        token = generate_access_token(user2)

        complete_data = {
            'description': 'Magnifique appartement',
            'prix': 350000,
            'surface': 85,
            'nombre_pieces': 3,
        }

        response = client.put(
            f'/api/v1/annonces/{annonce.annonce_id}/completer',
            json=complete_data,
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 403

    def test_completer_annonce_missing_fields(self, client, app_context):
        """Test : Champs obligatoires"""
        user = User(
            email='vendeur@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Dupont',
            prenom='Jean',
        )
        db.session.add(user)
        db.session.flush()

        annonce = Annonce(
            titre='Bel appartement',
            adresse='123 Rue de la Paix',
            code_postal='75001',
            ville='Paris',
            utilisateur_id=user.utilisateur_id,
            statut='brouillon',
        )
        db.session.add(annonce)
        db.session.commit()

        from src.auth.routes import generate_access_token
        token = generate_access_token(user)

        # Données incomplètes
        complete_data = {
            'description': 'Magnifique appartement',
            # Manque prix, surface, nombre_pieces
        }

        response = client.put(
            f'/api/v1/annonces/{annonce.annonce_id}/completer',
            json=complete_data,
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 400


class TestGetMesAnnonces:
    """Tests pour récupérer ses annonces"""

    def test_get_mes_annonces_success(self, client, app_context):
        """Test : Récupérer ses annonces"""
        user = User(
            email='vendeur@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Dupont',
            prenom='Jean',
        )
        db.session.add(user)
        db.session.flush()

        # Créer 3 annonces (1 brouillon, 2 publiées)
        annonces_data = [
            {'titre': 'App 1', 'statut': 'brouillon'},
            {'titre': 'App 2', 'statut': 'publiée'},
            {'titre': 'App 3', 'statut': 'publiée'},
        ]

        for data in annonces_data:
            annonce = Annonce(
                titre=data['titre'],
                adresse='123 Rue',
                code_postal='75001',
                ville='Paris',
                utilisateur_id=user.utilisateur_id,
                statut=data['statut'],
            )
            db.session.add(annonce)

        db.session.commit()

        from src.auth.routes import generate_access_token
        token = generate_access_token(user)

        response = client.get(
            '/api/v1/utilisateurs/me/annonces',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['total'] == 3
        assert len(json_data['annonces']) == 3

    def test_get_mes_annonces_filtered(self, client, app_context):
        """Test : Filtrer par statut"""
        user = User(
            email='vendeur@immo2000.com',
            mot_de_passe='SecurePass123!',
            nom='Dupont',
            prenom='Jean',
        )
        db.session.add(user)
        db.session.flush()

        # Créer 2 brouillons + 1 publiée
        for i in range(2):
            annonce = Annonce(
                titre=f'App {i}',
                adresse='123 Rue',
                code_postal='75001',
                ville='Paris',
                utilisateur_id=user.utilisateur_id,
                statut='brouillon',
            )
            db.session.add(annonce)

        annonce = Annonce(
            titre='App publiée',
            adresse='123 Rue',
            code_postal='75001',
            ville='Paris',
            utilisateur_id=user.utilisateur_id,
            statut='publiée',
        )
        db.session.add(annonce)
        db.session.commit()

        from src.auth.routes import generate_access_token
        token = generate_access_token(user)

        # Filtrer par statut=brouillon
        response = client.get(
            '/api/v1/utilisateurs/me/annonces?statut=brouillon',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        json_data = response.get_json()
        assert json_data['total'] == 2
        assert all(a['statut'] == 'brouillon' for a in json_data['annonces'])

    def test_get_mes_annonces_without_jwt(self, client):
        """Test : Récupérer annonces sans JWT échoue"""
        response = client.get('/api/v1/utilisateurs/me/annonces')
        assert response.status_code == 401
