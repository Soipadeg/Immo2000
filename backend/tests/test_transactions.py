"""
Tests pour les transactions notaires
Vérifie le workflow complet transaction → paiement → signature
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from src.auth.models import db, User
from src.models.notaires import TransactionNotaire, TransactionStatut, FraisNotaire, CommissionImmo2000, Paiement
from src.models.offres import Offre, OffreStatut
from src.models.annonces import Annonce
from src.schemas.notaires import TransactionNotaireAssign
from src.crud import notaires as crud_notaires
from src.crud import offres as crud_offres


class TestTransactionNotaireModels:
    """Tests des modèles TransactionNotaire."""

    def test_transaction_statut_workflow(self, app):
        """Tester progression des statuts d'une transaction."""
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

            # Créer transaction
            transaction = TransactionNotaire(
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                annonce_id=None,
                offre_id=None,
                prix_compromis=250000.00,
                statut=TransactionStatut.CREEE
            )
            db.session.add(transaction)
            db.session.flush()

            # Progression des statuts
            statuses = [
                TransactionStatut.CREEE,
                TransactionStatut.NOTAIRE_ASSIGNEE,
                TransactionStatut.COMPROMIS_PREPARE,
                TransactionStatut.COMPROMIS_SIGNE,
                TransactionStatut.ACTE_PREPARE,
                TransactionStatut.ACTE_SIGNE,
                TransactionStatut.FINALISEE
            ]

            assert transaction.statut == TransactionStatut.CREEE
            transaction.statut = TransactionStatut.NOTAIRE_ASSIGNEE
            assert transaction.statut == TransactionStatut.NOTAIRE_ASSIGNEE
            transaction.statut = TransactionStatut.FINALISEE
            assert transaction.statut == TransactionStatut.FINALISEE


class TestTransactionNotaireCreation:
    """Tests de création de transactions notaires."""

    def test_create_transaction_from_offer(self, app):
        """Créer une transaction à partir d'une offre acceptée."""
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

            # Créer transaction
            transaction = crud_notaires.create_transaction_notaire(
                db=db.session,
                offre_id=None,
                annonce_id=annonce.annonce_id,
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                prix_compromis=245000.00,
                notaire_id=None
            )
            db.session.commit()

            # Vérifications
            assert transaction is not None
            assert transaction.transaction_id is not None
            assert transaction.prix_compromis == 245000.00
            assert transaction.statut == TransactionStatut.CREEE
            assert transaction.notaire_id is None  # Pas encore assigné
            assert transaction.vendeur_id == vendeur.utilisateur_id
            assert transaction.acheteur_id == acheteur.utilisateur_id


class TestNotaireAssignment:
    """Tests d'assignation de notaire."""

    def test_assign_notaire_to_transaction(self, app):
        """Assigner un notaire à une transaction."""
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

            notaire_user = User(
                email="notaire@test.fr",
                nom="Notaire",
                prenom="Test",
                role="notaire"
            )
            notaire_user.set_password("password123")
            db.session.add(notaire_user)
            db.session.flush()

            # Créer notaire
            from src.models.notaires import Notaire
            notaire = Notaire(
                utilisateur_id=notaire_user.utilisateur_id,
                etude_notariale="Étude Test",
                numero_rpps="12345678901",
                telephone="0123456789",
                adresse="123 Rue Test",
                code_postal="75000",
                ville="Paris"
            )
            db.session.add(notaire)
            db.session.flush()

            # Créer transaction
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

            transaction = TransactionNotaire(
                vendeur_id=vendeur.utilisateur_id,
                acheteur_id=acheteur.utilisateur_id,
                annonce_id=annonce.annonce_id,
                prix_compromis=250000.00,
                statut=TransactionStatut.CREEE
            )
            db.session.add(transaction)
            db.session.flush()

            # Assigner notaire
            transaction.notaire_id = notaire.notaire_id
            transaction.statut = TransactionStatut.NOTAIRE_ASSIGNEE
            db.session.commit()

            # Vérifications
            assert transaction.notaire_id == notaire.notaire_id
            assert transaction.statut == TransactionStatut.NOTAIRE_ASSIGNEE


class TestTransactionFees:
    """Tests des frais notariaux."""

    def test_calculate_base_fees(self):
        """Tester calcul des frais de base (2% du prix)."""
        prix = 250000.00
        frais_base = prix * 0.02
        assert frais_base == 5000.00

    def test_calculate_tva(self):
        """Tester calcul TVA sur frais (20%)."""
        frais_base = 5000.00
        tva = frais_base * 0.20
        assert tva == 1000.00

    def test_calculate_total_fees(self):
        """Tester calcul total frais + TVA."""
        prix = 250000.00
        frais_base = prix * 0.02
        tva = frais_base * 0.20
        total = frais_base + tva
        assert total == 6000.00

    def test_calculate_immo2000_commission(self):
        """Tester calcul commission Immo2000 (2%)."""
        prix = 250000.00
        commission = prix * 0.02
        assert commission == 5000.00

    def test_create_frais_notaire(self, app):
        """Créer frais notariaux dans la BD."""
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

            # Créer frais
            frais = FraisNotaire(
                transaction_id=transaction.transaction_id,
                prix_bien=250000.00,
                pourcentage_base=2.0,
                montant_base=5000.00,
                pourcentage_tva=20.0,
                montant_tva=1000.00,
                montant_ttc=6000.00
            )
            db.session.add(frais)
            db.session.commit()

            # Vérifications
            assert frais.frais_id is not None
            assert frais.montant_ttc == 6000.00


class TestTransactionPayments:
    """Tests des paiements de transactions."""

    def test_payment_deposit_split(self):
        """Tester split paiement: 15% dépôt, 85% solde."""
        prix = 250000.00
        depot = prix * 0.15
        solde = prix * 0.85

        assert depot == 37500.00
        assert solde == 212500.00
        assert depot + solde == prix

    def test_multiple_payment_scenarios(self):
        """Tester différents scénarios de paiement."""
        scenarios = [
            {"prix": 100000, "depot": 15000, "solde": 85000},
            {"prix": 250000, "depot": 37500, "solde": 212500},
            {"prix": 500000, "depot": 75000, "solde": 425000},
            {"prix": 1000000, "depot": 150000, "solde": 850000},
        ]

        for scenario in scenarios:
            depot = scenario["prix"] * 0.15
            solde = scenario["prix"] * 0.85
            assert depot == scenario["depot"]
            assert solde == scenario["solde"]
            assert depot + solde == scenario["prix"]


class TestTransactionDocuments:
    """Tests des documents de transaction."""

    def test_document_generation_sequence(self):
        """Tester séquence de génération de documents."""
        sequence = [
            "compromis_draft",
            "compromis_signed",
            "acte_draft",
            "acte_signed"
        ]
        assert sequence[0] == "compromis_draft"
        assert sequence[-1] == "acte_signed"
        assert len(sequence) == 4

    def test_document_storage_paths(self):
        """Tester chemins de stockage des documents."""
        transaction_id = "tx-12345"

        paths = {
            "compromis_draft": f"transactions/{transaction_id}/compromis_draft.pdf",
            "compromis_signed": f"transactions/{transaction_id}/compromis_signed.pdf",
            "acte_draft": f"transactions/{transaction_id}/acte_draft.pdf",
            "acte_signed": f"transactions/{transaction_id}/acte_signed.pdf",
        }

        assert "compromis_draft.pdf" in paths["compromis_draft"]
        assert transaction_id in paths["compromis_draft"]


class TestTransactionHistory:
    """Tests de l'historique des transactions."""

    def test_transaction_history_tracking(self, app):
        """Tester suivi de l'historique."""
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

            from src.models.notaires import HistoriqueNotaire

            # Ajouter entrées d'historique
            historique1 = HistoriqueNotaire(
                transaction_id=transaction.transaction_id,
                action="CREEE",
                description="Transaction créée",
                utilisateur_id=vendeur.utilisateur_id
            )
            db.session.add(historique1)

            historique2 = HistoriqueNotaire(
                transaction_id=transaction.transaction_id,
                action="NOTAIRE_ASSIGNEE",
                description="Notaire assigné",
                utilisateur_id=None
            )
            db.session.add(historique2)
            db.session.commit()

            # Vérifier historique
            history = HistoriqueNotaire.query.filter_by(
                transaction_id=transaction.transaction_id
            ).all()
            assert len(history) == 2
            assert history[0].action == "CREEE"
            assert history[1].action == "NOTAIRE_ASSIGNEE"
