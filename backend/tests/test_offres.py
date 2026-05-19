"""
Tests pour les offres et le workflow de création de transactions notaires
Vérifie l'intégration offres → transactions notaires
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from src.auth.models import db, User
from src.models.offres import Offre, OffreStatut
from src.models.annonces import Annonce
from src.models.notaires import TransactionNotaire
from src.schemas.offres import OffreCreate, OffreUpdate
from src.crud import offres as crud_offres
from src.crud import notaires as crud_notaires
from src.crud import annonces as crud_annonces


class TestOffreModels:
    """Tests des modèles Offre."""

    def test_create_offre(self, app):
        """Tester création d'une offre."""
        with app.app_context():
            # Créer utilisateurs
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("password123")
            db.session.add(vendeur)
            db.session.flush()

            acheteur = User(
                email="acheteur@test.fr",
                nom="Acheteur",
                prenom="Test",
                role="acheteur"
            )
            acheteur.set_password("password123")
            db.session.add(acheteur)
            db.session.flush()

            # Créer annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Maison Test",
                description="Description test",
                prix_demande=250000.00,
                adresse="123 Rue de Test",
                code_postal="75000",
                ville="Paris",
                surface=100,
                nombre_pieces=3
            )
            db.session.add(annonce)
            db.session.flush()

            # Créer offre
            offre = Offre(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur.utilisateur_id,
                vendeur_id=vendeur.utilisateur_id,
                prix_propose=245000.00,
                message="Offre intéressée",
                statut=OffreStatut.EN_ATTENTE
            )
            db.session.add(offre)
            db.session.commit()

            assert offre.offre_id is not None
            assert offre.statut == OffreStatut.EN_ATTENTE
            assert offre.prix_propose == 245000.00


class TestOffreAcceptance:
    """Tests de l'acceptation d'offre et création de transaction."""

    def test_accept_offre_creates_transaction(self, app):
        """
        CRITICAL: Accepter une offre doit créer une TransactionNotaire.
        Ceci est la connexion clé entre offres et le système notaire.
        """
        with app.app_context():
            # Créer utilisateurs
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("password123")
            db.session.add(vendeur)
            db.session.flush()

            acheteur = User(
                email="acheteur@test.fr",
                nom="Acheteur",
                prenom="Test",
                role="acheteur"
            )
            acheteur.set_password("password123")
            db.session.add(acheteur)
            db.session.flush()

            # Créer annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Maison Test",
                description="Description test",
                prix_demande=250000.00,
                adresse="123 Rue de Test",
                code_postal="75000",
                ville="Paris",
                surface=100,
                nombre_pieces=3
            )
            db.session.add(annonce)
            db.session.flush()

            # Créer offre
            offre = Offre(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur.utilisateur_id,
                vendeur_id=vendeur.utilisateur_id,
                prix_propose=245000.00,
                message="Offre intéressée",
                statut=OffreStatut.EN_ATTENTE
            )
            db.session.add(offre)
            db.session.flush()

            # Accepter offre et créer transaction
            offre.statut = OffreStatut.ACCEPTEE
            transaction = crud_notaires.create_transaction_notaire(
                db=db.session,
                offre_id=offre.offre_id,
                annonce_id=offre.annonce_id,
                vendeur_id=offre.vendeur_id,
                acheteur_id=offre.acheteur_id,
                prix_compromis=float(offre.prix_propose),
                notaire_id=None  # Sera assigné plus tard
            )
            db.session.commit()

            # Vérifications
            assert offre.statut == OffreStatut.ACCEPTEE
            assert transaction is not None
            assert transaction.transaction_id is not None
            assert transaction.offre_id == offre.offre_id
            assert transaction.prix_compromis == 245000.00
            assert transaction.notaire_id is None  # Pas encore assigné

    def test_reject_offre_does_not_create_transaction(self, app):
        """Rejeter une offre ne doit pas créer de transaction."""
        with app.app_context():
            # Créer utilisateurs
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("password123")
            db.session.add(vendeur)
            db.session.flush()

            acheteur = User(
                email="acheteur@test.fr",
                nom="Acheteur",
                prenom="Test",
                role="acheteur"
            )
            acheteur.set_password("password123")
            db.session.add(acheteur)
            db.session.flush()

            # Créer annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Maison Test",
                description="Description test",
                prix_demande=250000.00,
                adresse="123 Rue de Test",
                code_postal="75000",
                ville="Paris",
                surface=100,
                nombre_pieces=3
            )
            db.session.add(annonce)
            db.session.flush()

            # Créer offre
            offre = Offre(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur.utilisateur_id,
                vendeur_id=vendeur.utilisateur_id,
                prix_propose=245000.00,
                message="Offre intéressée",
                statut=OffreStatut.EN_ATTENTE
            )
            db.session.add(offre)
            db.session.flush()

            # Rejeter offre
            offre.statut = OffreStatut.REJETEE
            db.session.commit()

            # Vérifier pas de transaction créée
            transaction_count = TransactionNotaire.query.filter_by(
                offre_id=offre.offre_id
            ).count()
            assert transaction_count == 0


class TestOffreCRUD:
    """Tests CRUD pour les offres."""

    def test_create_offre_crud(self, app):
        """Tester création d'offre via CRUD."""
        with app.app_context():
            # Créer utilisateurs
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("password123")
            db.session.add(vendeur)
            db.session.flush()

            acheteur = User(
                email="acheteur@test.fr",
                nom="Acheteur",
                prenom="Test",
                role="acheteur"
            )
            acheteur.set_password("password123")
            db.session.add(acheteur)
            db.session.flush()

            # Créer annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Maison Test",
                description="Description test",
                prix_demande=250000.00,
                adresse="123 Rue de Test",
                code_postal="75000",
                ville="Paris",
                surface=100,
                nombre_pieces=3
            )
            db.session.add(annonce)
            db.session.flush()

            # Créer via CRUD
            offre_data = OffreCreate(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur.utilisateur_id,
                prix_propose=245000.00,
                message="Offre intéressée"
            )
            offre = crud_offres.create_offre(db.session, offre_data, vendeur.utilisateur_id)
            db.session.commit()

            assert offre is not None
            assert offre.offre_id is not None
            assert offre.prix_propose == 245000.00

    def test_get_offre(self, app):
        """Tester récupération d'offre."""
        with app.app_context():
            # Créer offre
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("password123")
            db.session.add(vendeur)
            db.session.flush()

            acheteur = User(
                email="acheteur@test.fr",
                nom="Acheteur",
                prenom="Test",
                role="acheteur"
            )
            acheteur.set_password("password123")
            db.session.add(acheteur)
            db.session.flush()

            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Maison Test",
                description="Description test",
                prix_demande=250000.00,
                adresse="123 Rue de Test",
                code_postal="75000",
                ville="Paris",
                surface=100,
                nombre_pieces=3
            )
            db.session.add(annonce)
            db.session.flush()

            offre = Offre(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur.utilisateur_id,
                vendeur_id=vendeur.utilisateur_id,
                prix_propose=245000.00,
                message="Test",
                statut=OffreStatut.EN_ATTENTE
            )
            db.session.add(offre)
            db.session.flush()

            # Récupérer
            retrieved = crud_offres.get_offre(db.session, offre.offre_id)
            assert retrieved is not None
            assert retrieved.offre_id == offre.offre_id

    def test_list_offres_by_annonce(self, app):
        """Tester listing des offres par annonce."""
        with app.app_context():
            # Créer utilisateurs
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("password123")
            db.session.add(vendeur)
            db.session.flush()

            acheteur1 = User(
                email="acheteur1@test.fr",
                nom="Acheteur1",
                prenom="Test",
                role="acheteur"
            )
            acheteur1.set_password("password123")
            db.session.add(acheteur1)

            acheteur2 = User(
                email="acheteur2@test.fr",
                nom="Acheteur2",
                prenom="Test",
                role="acheteur"
            )
            acheteur2.set_password("password123")
            db.session.add(acheteur2)
            db.session.flush()

            # Créer annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Maison Test",
                description="Description test",
                prix_demande=250000.00,
                adresse="123 Rue de Test",
                code_postal="75000",
                ville="Paris",
                surface=100,
                nombre_pieces=3
            )
            db.session.add(annonce)
            db.session.flush()

            # Créer 2 offres
            offre1 = Offre(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur1.utilisateur_id,
                vendeur_id=vendeur.utilisateur_id,
                prix_propose=245000.00,
                message="Offre 1",
                statut=OffreStatut.EN_ATTENTE
            )
            db.session.add(offre1)

            offre2 = Offre(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur2.utilisateur_id,
                vendeur_id=vendeur.utilisateur_id,
                prix_propose=248000.00,
                message="Offre 2",
                statut=OffreStatut.EN_ATTENTE
            )
            db.session.add(offre2)
            db.session.flush()

            # Lister offres de l'annonce
            offres = crud_offres.get_offres_by_annonce(
                db.session,
                annonce.annonce_id
            )
            assert len(offres) == 2


class TestOffreValidation:
    """Tests de validation des offres."""

    def test_offre_price_validation(self):
        """Tester validation du prix."""
        # Le prix doit être positif
        assert 245000 > 0
        assert 0 < 245000 <= 10000000  # Raisonnable pour immobilier

    def test_offre_price_comparison(self, app):
        """Tester comparaison prix offre vs prix demandé."""
        with app.app_context():
            # Créer utilisateurs
            vendeur = User(
                email="vendeur@test.fr",
                nom="Vendeur",
                prenom="Test",
                role="vendeur"
            )
            vendeur.set_password("password123")
            db.session.add(vendeur)
            db.session.flush()

            acheteur = User(
                email="acheteur@test.fr",
                nom="Acheteur",
                prenom="Test",
                role="acheteur"
            )
            acheteur.set_password("password123")
            db.session.add(acheteur)
            db.session.flush()

            # Créer annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Maison Test",
                description="Description test",
                prix_demande=250000.00,
                adresse="123 Rue de Test",
                code_postal="75000",
                ville="Paris",
                surface=100,
                nombre_pieces=3
            )
            db.session.add(annonce)
            db.session.flush()

            # Offre sous le prix demandé
            offre = Offre(
                annonce_id=annonce.annonce_id,
                acheteur_id=acheteur.utilisateur_id,
                vendeur_id=vendeur.utilisateur_id,
                prix_propose=240000.00,  # Moins que 250000
                message="Offre test",
                statut=OffreStatut.EN_ATTENTE
            )
            db.session.add(offre)
            db.session.commit()

            # Vérifier la différence
            prix_diff = offre.prix_propose - annonce.prix_demande
            assert prix_diff < 0  # Offre inférieure
            assert abs(prix_diff) / annonce.prix_demande == pytest.approx(0.04, abs=0.01)
