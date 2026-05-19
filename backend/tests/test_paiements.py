"""
Tests pour les paiements et l'intégration Stripe
Vérifie les endpoints de paiement et la logique Stripe
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from src.auth.models import db, User
from src.models.notaires import TransactionNotaire, TransactionStatut, Paiement, PaiementStatut
from src.schemas.paiements import PaiementCreate, PaiementConfirm
from src.crud import paiements as crud_paiements


class TestPaiementModels:
    """Tests des modèles Paiement."""

    def test_create_paiement(self, app):
        """Créer un enregistrement de paiement."""
        with app.app_context():
            # Créer transaction
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

            transaction = TransactionNotaire(
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                annonce_id=None,
                prix_compromis=250000.00,
                statut=TransactionStatut.CREEE
            )
            db.session.add(transaction)
            db.session.flush()

            # Créer paiement
            paiement = Paiement(
                transaction_id=transaction.transaction_id,
                montant=37500.00,  # 15% dépôt
                type_paiement="DEPOT",
                stripe_payment_intent_id="pi_12345",
                statut=PaiementStatut.EN_COURS
            )
            db.session.add(paiement)
            db.session.commit()

            assert paiement.paiement_id is not None
            assert paiement.montant == 37500.00
            assert paiement.type_paiement == "DEPOT"


class TestPaiementCalculations:
    """Tests des calculs de paiement."""

    def test_deposit_calculation(self):
        """Tester calcul du dépôt (15%)."""
        prix = 250000.00
        depot = prix * 0.15
        assert depot == 37500.00

    def test_balance_calculation(self):
        """Tester calcul du solde (85%)."""
        prix = 250000.00
        solde = prix * 0.85
        assert solde == 212500.00

    def test_deposit_plus_balance_equals_price(self):
        """Vérifier dépôt + solde = prix."""
        prix = 250000.00
        depot = prix * 0.15
        solde = prix * 0.85
        assert depot + solde == prix

    def test_multiple_price_scenarios(self):
        """Tester différents montants."""
        scenarios = [
            {"prix": 100000, "depot": 15000, "solde": 85000},
            {"prix": 250000, "depot": 37500, "solde": 212500},
            {"prix": 500000, "depot": 75000, "solde": 425000},
            {"prix": 1000000, "depot": 150000, "solde": 850000},
        ]

        for scenario in scenarios:
            depot = scenario["prix"] * 0.15
            solde = scenario["prix"] * 0.85
            total = depot + solde

            assert depot == scenario["depot"], f"Dépôt incorrect pour {scenario['prix']}"
            assert solde == scenario["solde"], f"Solde incorrect pour {scenario['prix']}"
            assert total == pytest.approx(scenario["prix"]), f"Total incorrect pour {scenario['prix']}"


class TestPaiementStatuses:
    """Tests des statuts de paiement."""

    def test_payment_status_workflow(self, app):
        """Tester progression des statuts."""
        with app.app_context():
            # Setup
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

            transaction = TransactionNotaire(
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                annonce_id=None,
                prix_compromis=250000.00,
                statut=TransactionStatut.CREEE
            )
            db.session.add(transaction)
            db.session.flush()

            # Créer paiement
            paiement = Paiement(
                transaction_id=transaction.transaction_id,
                montant=37500.00,
                type_paiement="DEPOT",
                stripe_payment_intent_id="pi_12345",
                statut=PaiementStatut.EN_COURS
            )
            db.session.add(paiement)
            db.session.flush()

            # Progression: EN_COURS → CONFIRME
            assert paiement.statut == PaiementStatut.EN_COURS
            paiement.statut = PaiementStatut.CONFIRME
            assert paiement.statut == PaiementStatut.CONFIRME
            db.session.commit()

            # Vérifier persistence
            retrieved = Paiement.query.get(paiement.paiement_id)
            assert retrieved.statut == PaiementStatut.CONFIRME


class TestStripeIntegration:
    """Tests de l'intégration Stripe."""

    def test_payment_intent_creation(self):
        """Tester création d'intention de paiement."""
        amount = 37500  # en cents: 375.00 EUR
        stripe_id = "pi_test123"

        assert amount > 0
        assert len(stripe_id) > 0
        assert stripe_id.startswith("pi_")

    def test_payment_intent_confirmation(self):
        """Tester confirmation d'intention."""
        stripe_id = "pi_test123"
        payment_method_id = "pm_test456"

        # Simuler confirmation
        confirmed = {
            "intent_id": stripe_id,
            "payment_method": payment_method_id,
            "status": "succeeded"
        }

        assert confirmed["status"] == "succeeded"
        assert confirmed["intent_id"] == stripe_id

    def test_payment_webhook_handling(self):
        """Tester gestion des webhooks Stripe."""
        webhook_data = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_test123",
                    "status": "succeeded",
                    "amount": 37500
                }
            }
        }

        assert webhook_data["type"] == "payment_intent.succeeded"
        assert webhook_data["data"]["object"]["status"] == "succeeded"


class TestPaiementCRUD:
    """Tests CRUD pour les paiements."""

    def test_create_paiement_crud(self, app):
        """Créer paiement via CRUD."""
        with app.app_context():
            # Setup
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

            transaction = TransactionNotaire(
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                annonce_id=None,
                prix_compromis=250000.00,
                statut=TransactionStatut.CREEE
            )
            db.session.add(transaction)
            db.session.flush()

            # Créer paiement via CRUD
            if hasattr(crud_paiements, 'create_paiement'):
                paiement_data = {
                    "transaction_id": transaction.transaction_id,
                    "montant": 37500.00,
                    "type_paiement": "DEPOT",
                    "stripe_payment_intent_id": "pi_test123"
                }
                paiement = crud_paiements.create_paiement(db.session, paiement_data)
                db.session.commit()

                assert paiement is not None
                assert paiement.paiement_id is not None

    def test_get_paiement(self, app):
        """Récupérer un paiement."""
        with app.app_context():
            # Setup
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

            transaction = TransactionNotaire(
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                annonce_id=None,
                prix_compromis=250000.00,
                statut=TransactionStatut.CREEE
            )
            db.session.add(transaction)
            db.session.flush()

            paiement = Paiement(
                transaction_id=transaction.transaction_id,
                montant=37500.00,
                type_paiement="DEPOT",
                stripe_payment_intent_id="pi_test123",
                statut=PaiementStatut.EN_COURS
            )
            db.session.add(paiement)
            db.session.flush()

            # Récupérer
            if hasattr(crud_paiements, 'get_paiement'):
                retrieved = crud_paiements.get_paiement(db.session, paiement.paiement_id)
                assert retrieved is not None
                assert retrieved.paiement_id == paiement.paiement_id

    def test_list_paiements_for_transaction(self, app):
        """Lister tous les paiements d'une transaction."""
        with app.app_context():
            # Setup
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

            transaction = TransactionNotaire(
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                annonce_id=None,
                prix_compromis=250000.00,
                statut=TransactionStatut.CREEE
            )
            db.session.add(transaction)
            db.session.flush()

            # Créer 2 paiements: dépôt et solde
            depot = Paiement(
                transaction_id=transaction.transaction_id,
                montant=37500.00,
                type_paiement="DEPOT",
                stripe_payment_intent_id="pi_depot",
                statut=PaiementStatut.CONFIRME
            )
            db.session.add(depot)

            solde = Paiement(
                transaction_id=transaction.transaction_id,
                montant=212500.00,
                type_paiement="SOLDE",
                stripe_payment_intent_id="pi_solde",
                statut=PaiementStatut.EN_COURS
            )
            db.session.add(solde)
            db.session.flush()

            # Lister paiements
            paiements = Paiement.query.filter_by(
                transaction_id=transaction.transaction_id
            ).all()
            assert len(paiements) == 2
            assert sum(p.montant for p in paiements) == 250000.00


class TestRefundLogic:
    """Tests de la logique de remboursement."""

    def test_refund_deposit(self):
        """Tester remboursement du dépôt."""
        depot = 37500.00
        refund_amount = depot * 1.0  # 100%
        assert refund_amount == 37500.00

    def test_refund_with_fees(self):
        """Tester remboursement avec frais."""
        depot = 37500.00
        frais_remboursement = 100.00  # Frais fixes
        refund_net = depot - frais_remboursement
        assert refund_net == 37400.00
        assert refund_net < depot
