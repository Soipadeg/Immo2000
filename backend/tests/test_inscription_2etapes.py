"""
Tests pour l'inscription 2 étapes et le profil acheteur
Tests du flux visiteur → inscription → contact vendeur
"""

import pytest
from backend.src.app import create_app
from backend.src.auth.models import db, User, RoleEnum
from backend.src.models.annonces import Annonce
import json


@pytest.fixture
def app():
    """Fixture pour créer l'application Flask en mode test."""
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Fixture pour créer un client de test."""
    return app.test_client()


@pytest.fixture
def app_context(app):
    """Fixture pour le contexte de l'application."""
    with app.app_context():
        yield app


class TestVisiteurPublicAnnonces:
    """Tests pour le flux visiteur: consultation des annonces publiques."""

    def test_get_public_annonces_without_auth(self, client, app_context):
        """
        Test: Visiteur (non connecté) peut consulter les annonces publiées.
        Route: GET /api/v1/annonces
        """
        # Créer une annonce de test (statut="publiée")
        user = User(
            email='vendeur@test.com',
            nom='Dupont',
            prenom='Jean',
            role=RoleEnum.UTILISATEUR,
            actif=True
        )
        user.set_password('Test123!')
        db.session.add(user)
        db.session.commit()

        annonce = Annonce(
            titre='Belle maison à Paris',
            description='Maison 4 pièces, ensoleillée',
            prix=450000.0,
            surface=120.5,
            adresse='12 Rue de la Paix',
            code_postal='75002',
            ville='Paris',
            type_bien='maison',
            nombre_pieces=4,
            utilisateur_id=user.utilisateur_id,
            statut='publiée',  # IMPORTANT: publiée
        )
        db.session.add(annonce)
        db.session.commit()

        # Requête publique (sans token JWT)
        response = client.get('/api/v1/annonces')

        assert response.status_code == 200
        data = response.get_json()
        assert 'items' in data or isinstance(data, list)

        # Vérifier que l'annonce est retournée
        items = data.get('items', []) if isinstance(data, dict) else data
        assert len(items) >= 1
        assert items[0]['titre'] == 'Belle maison à Paris'

    def test_get_public_annonces_with_filters(self, client, app_context):
        """
        Test: Visiteur peut filtrer les annonces par ville, type, prix, surface.
        Route: GET /api/v1/annonces?ville=Paris&type_bien=maison&prix_max=500000
        """
        # Créer 2 annonces
        user = User(
            email='vendeur2@test.com',
            nom='Martin',
            prenom='Pierre',
            role=RoleEnum.UTILISATEUR,
            actif=True
        )
        user.set_password('Test123!')
        db.session.add(user)
        db.session.commit()

        annonce1 = Annonce(
            titre='Maison Paris',
            description='Maison',
            prix=400000.0,
            surface=100.0,
            adresse='10 rue A',
            code_postal='75001',
            ville='Paris',
            type_bien='maison',
            nombre_pieces=4,
            utilisateur_id=user.utilisateur_id,
            statut='publiée',
        )

        annonce2 = Annonce(
            titre='Appartement Lyon',
            description='Appartement',
            prix=200000.0,
            surface=70.0,
            adresse='20 rue B',
            code_postal='69000',
            ville='Lyon',
            type_bien='appartement',
            nombre_pieces=2,
            utilisateur_id=user.utilisateur_id,
            statut='publiée',
        )

        db.session.add_all([annonce1, annonce2])
        db.session.commit()

        # Filtrer par ville=Paris
        response = client.get('/api/v1/annonces?ville=Paris')
        assert response.status_code == 200
        data = response.get_json()
        items = data.get('items', []) if isinstance(data, dict) else data
        assert len(items) == 1
        assert items[0]['ville'] == 'Paris'

    def test_get_public_annonces_exclude_brouillons(self, client, app_context):
        """
        Test: Les brouillons NE sont PAS affichés aux visiteurs publics.
        Route: GET /api/v1/annonces
        """
        user = User(
            email='vendeur3@test.com',
            nom='Durand',
            prenom='Marie',
            role=RoleEnum.UTILISATEUR,
            actif=True
        )
        user.set_password('Test123!')
        db.session.add(user)
        db.session.commit()

        # Créer une annonce brouillon
        annonce_brouillon = Annonce(
            titre='Brouillon - Ne pas afficher',
            description='Cette annonce ne doit pas être visible',
            prix=300000.0,
            surface=90.0,
            adresse='30 rue C',
            code_postal='75003',
            ville='Paris',
            type_bien='appartement',
            nombre_pieces=3,
            utilisateur_id=user.utilisateur_id,
            statut='brouillon',  # IMPORTANT: brouillon
        )
        db.session.add(annonce_brouillon)
        db.session.commit()

        # Requête publique
        response = client.get('/api/v1/annonces')
        assert response.status_code == 200
        data = response.get_json()
        items = data.get('items', []) if isinstance(data, dict) else data

        # Vérifier que le brouillon n'est pas inclus
        assert all(annonce['statut'] != 'brouillon' for annonce in items)


class TestInscriptionEtape1:
    """Tests pour l'inscription ÉTAPE 1: profil de base."""

    def test_register_step1_success(self, client, app_context):
        """
        Test: Visiteur s'inscrit avec email, mot de passe, nom, prénom, téléphone.
        Route: POST /auth/register
        """
        payload = {
            'email': 'newuser@test.com',
            'mot_de_passe': 'SecurePass123!',
            'nom': 'Dupont',
            'prenom': 'Jean',
            'telephone': '0612345678'
        }

        response = client.post('/auth/register', json=payload)

        assert response.status_code == 201
        data = response.get_json()
        assert 'user_id' in data
        assert data['email'] == 'newuser@test.com'

        # Vérifier que l'utilisateur a été créé avec les bon paramètres
        user = User.find_by_email('newuser@test.com')
        assert user is not None
        assert user.role == RoleEnum.UTILISATEUR
        assert user.is_profil_acheteur_complet == False  # Étape 2 non complétée
        assert user.email_verified == False  # Email non vérifié

    def test_register_step1_email_already_exists(self, client, app_context):
        """
        Test: Erreur si l'email est déjà utilisé.
        Route: POST /auth/register
        """
        # Créer un utilisateur
        user = User(
            email='existing@test.com',
            nom='Martin',
            prenom='Pierre',
            role=RoleEnum.UTILISATEUR,
            actif=True
        )
        user.set_password('Test123!')
        db.session.add(user)
        db.session.commit()

        # Essayer de s'inscrire avec le même email
        payload = {
            'email': 'existing@test.com',
            'mot_de_passe': 'NewPass123!',
            'nom': 'Durand',
            'prenom': 'Marie',
            'telephone': '0612345678'
        }

        response = client.post('/auth/register', json=payload)
        assert response.status_code == 400
        assert 'already exists' in response.get_json()['error'].lower()

    def test_register_step1_weak_password(self, client):
        """
        Test: Erreur si le mot de passe est trop faible.
        Route: POST /auth/register
        """
        payload = {
            'email': 'test@test.com',
            'mot_de_passe': 'weak',  # Trop faible
            'nom': 'Test',
            'prenom': 'User',
            'telephone': '0612345678'
        }

        response = client.post('/auth/register', json=payload)
        assert response.status_code == 400


class TestInscriptionEtape2:
    """Tests pour l'inscription ÉTAPE 2: profil acheteur."""

    def test_update_buyer_profile_success(self, client, app_context):
        """
        Test: Utilisateur connecté complète son profil acheteur.
        Route: POST /auth/update-buyer-profile (JWT required)
        """
        # Créer et connecter un utilisateur
        user = User(
            email='buyer@test.com',
            nom='Acheteur',
            prenom='Test',
            role=RoleEnum.UTILISATEUR,
            actif=True
        )
        user.set_password('Test123!')
        user.email_verified = True
        db.session.add(user)
        db.session.commit()

        # Simuler la connexion (générer un token JWT)
        from backend.src.auth.utils import generate_access_token
        token = generate_access_token(user.utilisateur_id)

        # Requête pour mettre à jour le profil acheteur
        payload = {
            'type_bien_recherche': 'appartement',
            'nombre_pieces_min': 2,
            'surface_min': 50,
            'budget_max': 300000,
            'ville_recherchee': 'Paris',
            'dpe_ideale': 'C'
        }

        response = client.post(
            '/auth/update-buyer-profile',
            json=payload,
            headers={'Authorization': f'Bearer {token}'}
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data['is_profil_acheteur_complet'] == True

        # Vérifier les mises à jour en base
        updated_user = User.query.get(user.utilisateur_id)
        assert updated_user.type_bien_recherche == 'appartement'
        assert updated_user.budget_max == 300000
        assert updated_user.is_profil_acheteur_complet == True

    def test_update_buyer_profile_no_jwt(self, client):
        """
        Test: Erreur si pas de JWT (non authentifié).
        Route: POST /auth/update-buyer-profile
        """
        payload = {
            'type_bien_recherche': 'maison',
            'budget_max': 500000
        }

        response = client.post('/auth/update-buyer-profile', json=payload)
        assert response.status_code == 401


class TestSimulateurPret:
    """Tests pour le simulateur de prêt public."""

    def test_simulate_pret_public(self, client):
        """
        Test: Visiteur (non connecté) peut utiliser le simulateur.
        Route: POST /api/v1/simulateur-pret
        """
        payload = {
            'revenu_mensuel_net': 3000,
            'apport': 50000,
            'taux_interet': 3.5,
            'duree_ans': 20,
            'taux_assurance': 0.3
        }

        response = client.post('/api/v1/simulateur-pret', json=payload)

        assert response.status_code == 200
        data = response.get_json()
        assert 'capacite_emprunt' in data or 'mensualite' in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
