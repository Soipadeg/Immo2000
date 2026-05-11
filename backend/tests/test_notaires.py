"""
Tests pour le système notaires (Phase 3)
Vérifie les modèles, schemas et CRUD operations
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from src.auth.models import db, User
from src.models.notaires import (
    Notaire,
    NotaireSpecialisation,
    TransactionNotaire,
    DocumentNotaire,
    HistoriqueNotaire,
    DisponibiliteNotaire
)
from src.models.offres import Offre
from src.models.annonces import Annonce
from src.schemas.notaires import (
    NotaireCreate,
    NotaireUpdate,
    TransactionNotaireAssign,
    TransactionNotaireUpdate
)
from src.crud import notaires as crud_notaires


class TestNotaireModels:
    """Tests des modèles Notaire."""

    def test_create_notaire(self, app):
        """Tester création d'un notaire."""
        with app.app_context():
            # Créer utilisateur d'abord
            user = User(
                email="notaire@test.fr",
                nom="Dupont",
                prenom="Jean",
                role="notaire"
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.flush()

            # Créer notaire
            notaire = Notaire(
                utilisateur_id=user.utilisateur_id,
                etude_notariale="Étude Dupont",
                numero_rpps="12345678901",
                adresse_etude="10 Rue de Paris",
                code_postal_etude="75001",
                ville_etude="Paris",
                telephone="01.23.45.67.89",
                email_professionnel="contact@etudedupont.fr",
                zone_geographique={
                    "villes": ["Paris"],
                    "codes_postaux": ["75001", "75002"]
                }
            )
            db.session.add(notaire)
            db.session.commit()

            # Vérifier
            assert notaire.notaire_id is not None
            assert notaire.numero_rpps == "12345678901"
            assert notaire.partenaire_actif == True
            assert notaire.max_dossiers_simultanees == 10
            assert notaire.est_disponible() == True

    def test_notaire_specialisation(self, app):
        """Tester spécialisations du notaire."""
        with app.app_context():
            # Setup
            user = User(email="test@test.fr", nom="Test", prenom="User", role="notaire")
            user.set_password("pwd")
            db.session.add(user)
            db.session.flush()

            notaire = Notaire(
                utilisateur_id=user.utilisateur_id,
                etude_notariale="Test",
                numero_rpps="123",
                adresse_etude="Test",
                code_postal_etude="75001",
                ville_etude="Paris",
                telephone="01",
                email_professionnel="test@test.fr",
                zone_geographique={"villes": ["Paris"]}
            )
            db.session.add(notaire)
            db.session.flush()

            # Ajouter spécialisations
            spec1 = NotaireSpecialisation(
                notaire_id=notaire.notaire_id,
                type_specialisation="vente"
            )
            spec2 = NotaireSpecialisation(
                notaire_id=notaire.notaire_id,
                type_specialisation="succession"
            )
            db.session.add(spec1)
            db.session.add(spec2)
            db.session.commit()

            # Vérifier
            assert len(notaire.specialisations) == 2

    def test_transaction_notaire_workflow(self, app):
        """Tester workflow d'une transaction notaire."""
        with app.app_context():
            # Setup users
            vendeur = User(email="vendeur@test.fr", nom="Vendeur", prenom="Test", role="vendeur")
            vendeur.set_password("pwd")
            acheteur = User(email="acheteur@test.fr", nom="Acheteur", prenom="Test", role="acheteur")
            acheteur.set_password("pwd")
            notaire_user = User(email="notaire@test.fr", nom="Notaire", prenom="Test", role="notaire")
            notaire_user.set_password("pwd")

            db.session.add_all([vendeur, acheteur, notaire_user])
            db.session.flush()

            # Create annonce
            annonce = Annonce(
                utilisateur_id=vendeur.utilisateur_id,
                titre="Appartement à vendre",
                description="Bel appart",
                type_bien="appartement",
                adresse="10 Rue de Paris",
                code_postal="75001",
                ville="Paris",
                superficie=80,
                prix=350000,
                statut="publiee"
            )
            db.session.add(annonce)
            db.session.flush()

            # Create offre
            offre = Offre(
                annonce_id=annonce.annonce_id,
                utilisateur_id=acheteur.utilisateur_id,
                prix_offert=350000,
                conditions="Selon acte",
                statut="acceptee"
            )
            db.session.add(offre)
            db.session.flush()

            # Create transaction
            transaction = TransactionNotaire(
                offre_id=offre.offre_id,
                annonce_id=annonce.annonce_id,
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                prix_compromis=350000,
                statut="en_attente_selection"
            )
            db.session.add(transaction)
            db.session.commit()

            # Vérifier initial state
            assert transaction.statut == "en_attente_selection"
            assert transaction.notaire_id is None

            # Create notaire
            notaire = Notaire(
                utilisateur_id=notaire_user.utilisateur_id,
                etude_notariale="Test",
                numero_rpps="123",
                adresse_etude="Test",
                code_postal_etude="75001",
                ville_etude="Paris",
                telephone="01",
                email_professionnel="notaire@test.fr",
                zone_geographique={"villes": ["Paris"]}
            )
            db.session.add(notaire)
            db.session.commit()

            # Assign notaire
            transaction.notaire_id = notaire.notaire_id
            transaction.date_assignation_notaire = datetime.utcnow()
            transaction.statut = "en_attente_validation"

            historique = HistoriqueNotaire(
                transaction_notaire_id=transaction.transaction_notaire_id,
                notaire_id=notaire.notaire_id,
                type_action="assignment",
                description="Notaire assigné",
                ancien_statut="en_attente_selection",
                nouveau_statut="en_attente_validation"
            )
            db.session.add(historique)
            db.session.commit()

            # Vérifier assignation
            assert transaction.statut == "en_attente_validation"
            assert transaction.notaire_id == notaire.notaire_id

            # Validate
            transaction.statut = "validee"
            transaction.date_validation = datetime.utcnow()

            historique2 = HistoriqueNotaire(
                transaction_notaire_id=transaction.transaction_notaire_id,
                notaire_id=notaire.notaire_id,
                type_action="validate",
                description="Compromis validé",
                ancien_statut="en_attente_validation",
                nouveau_statut="validee"
            )
            db.session.add(historique2)
            db.session.commit()

            # Vérifier validation
            assert transaction.statut == "validee"
            assert len(transaction.historique) == 2


class TestNotaireSchemas:
    """Tests des schémas Pydantic."""

    def test_notaire_create_schema(self):
        """Tester validation du schema NotaireCreate."""
        data = {
            "utilisateur_id": 1,
            "etude_notariale": "Étude Test",
            "numero_rpps": "12345678901",
            "adresse_etude": "10 Rue Test",
            "code_postal_etude": "75001",
            "ville_etude": "Paris",
            "telephone": "01.23.45.67.89",
            "email_professionnel": "test@test.fr",
            "zone_geographique": {
                "villes": ["Paris"],
                "codes_postaux": ["75001"]
            }
        }

        schema = NotaireCreate(**data)
        assert schema.numero_rpps == "12345678901"
        assert schema.ville_etude == "Paris"

    def test_notaire_update_schema(self):
        """Tester validation du schema NotaireUpdate."""
        data = {
            "telephone": "+33.1.23.45.67.89",
            "disponibilites": {
                "lundi": "09:00-17:00",
                "mardi": "09:00-17:00"
            }
        }

        schema = NotaireUpdate(**data)
        assert schema.telephone == "+33.1.23.45.67.89"

    def test_transaction_notaire_assign_schema(self):
        """Tester validation du schema TransactionNotaireAssign."""
        data = {
            "notaire_id": 45
        }

        schema = TransactionNotaireAssign(**data)
        assert schema.notaire_id == 45


class TestNotaireCRUD:
    """Tests des opérations CRUD."""

    def test_create_notaire_crud(self, app):
        """Tester création via CRUD."""
        with app.app_context():
            # Create user
            user = User(email="crud@test.fr", nom="Crud", prenom="Test", role="notaire")
            user.set_password("pwd")
            db.session.add(user)
            db.session.commit()

            # Create via CRUD
            notaire = crud_notaires.create_notaire(
                db=db.session,
                utilisateur_id=user.utilisateur_id,
                etude_notariale="Test CRUD",
                numero_rpps="crud123",
                adresse_etude="Test",
                code_postal_etude="75001",
                ville_etude="Paris",
                telephone="01",
                email_professionnel="crud@test.fr",
                zone_geographique={"villes": ["Paris"]}
            )

            assert notaire.notaire_id is not None
            assert notaire.numero_rpps == "crud123"

    def test_search_notaires_crud(self, app):
        """Tester recherche de notaires."""
        with app.app_context():
            # Create users and notaires
            for i in range(3):
                user = User(
                    email=f"search{i}@test.fr",
                    nom="Search",
                    prenom=f"Test{i}",
                    role="notaire"
                )
                user.set_password("pwd")
                db.session.add(user)
                db.session.flush()

                notaire = Notaire(
                    utilisateur_id=user.utilisateur_id,
                    etude_notariale=f"Étude {i}",
                    numero_rpps=f"search{i}",
                    adresse_etude="Test",
                    code_postal_etude="75001",
                    ville_etude="Paris",
                    telephone="01",
                    email_professionnel=f"search{i}@test.fr",
                    zone_geographique={"villes": ["Paris"]},
                    partenaire_actif=True
                )
                db.session.add(notaire)
            db.session.commit()

            # Search
            notaires, total = crud_notaires.search_notaires(
                db=db.session,
                ville="Paris",
                skip=0,
                limit=10
            )

            assert total >= 3
            assert len(notaires) >= 3

    def test_notaire_stats(self, app):
        """Tester calcul des statistiques."""
        with app.app_context():
            # Setup
            user = User(email="stats@test.fr", nom="Stats", prenom="Test", role="notaire")
            user.set_password("pwd")
            db.session.add(user)
            db.session.flush()

            notaire = Notaire(
                utilisateur_id=user.utilisateur_id,
                etude_notariale="Stats",
                numero_rpps="stats123",
                adresse_etude="Test",
                code_postal_etude="75001",
                ville_etude="Paris",
                telephone="01",
                email_professionnel="stats@test.fr",
                zone_geographique={"villes": ["Paris"]}
            )
            db.session.add(notaire)
            db.session.commit()

            # Get stats
            stats = crud_notaires.get_notaire_stats(db.session, notaire.notaire_id)

            assert stats['dossiers_en_cours'] == 0
            assert stats['dossiers_ce_mois'] == 0
            assert stats['delai_moyen_jours'] == 0


@pytest.fixture
def app():
    """Fixture pour app Flask."""
    from src.app import create_app
    app = create_app("testing")

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
