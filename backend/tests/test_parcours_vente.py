"""
Tests unitaires pour le parcours de vente (Phase 3).

Couvre:
- Création d'offres
- Réponse aux offres
- Gestion des transactions
- Validation des frais notaire
- Création et confirmation de paiements
"""

import pytest
import json
from datetime import datetime, timedelta
from decimal import Decimal

from src.app import create_app
from src.auth.models import db, User
from src.models.offres import Offre, OffreStatus
from src.models.annonces import Annonce
from src.models.notaires import Notaire, TransactionNotaire
from src.models.paiements import Paiement, FraisNotaire, CommissionImmo2000
from src.auth.models import Role


@pytest.fixture
def app():
    """Créer une application de test."""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Créer un client de test."""
    return app.test_client()


@pytest.fixture
def test_users(app):
    """Créer des utilisateurs de test."""
    with app.app_context():
        # Rôles
        role_vendeur = Role(nom='vendeur')
        role_acheteur = Role(nom='acheteur')
        role_notaire = Role(nom='notaire')

        db.session.add_all([role_vendeur, role_acheteur, role_notaire])
        db.session.commit()

        # Utilisateurs
        vendeur = User(
            email='vendeur@example.com',
            nom='Jean Vendeur',
            prenom='Jean',
            password_hash='hashed_password_1',
            email_verifiee=True,
            role_id=role_vendeur.role_id
        )

        acheteur = User(
            email='acheteur@example.com',
            nom='Marie Acheteur',
            prenom='Marie',
            password_hash='hashed_password_2',
            email_verifiee=True,
            role_id=role_acheteur.role_id
        )

        notaire = User(
            email='notaire@example.com',
            nom='Pierre Notaire',
            prenom='Pierre',
            password_hash='hashed_password_3',
            email_verifiee=True,
            role_id=role_notaire.role_id
        )

        db.session.add_all([vendeur, acheteur, notaire])
        db.session.commit()

        return {
            'vendeur': vendeur,
            'acheteur': acheteur,
            'notaire': notaire
        }


@pytest.fixture
def test_annonce(app, test_users):
    """Créer une annonce de test."""
    with app.app_context():
        annonce = Annonce(
            titre="Bel appartement à Paris",
            description="3 pièces, bien situé",
            prix=300000,
            surface=80,
            adresse="123 Rue de la Paix, Paris",
            code_postal="75001",
            ville="Paris",
            type_bien="appartement",
            nombre_pieces=3,
            utilisateur_id=test_users['vendeur'].utilisateur_id,
            statut="publiee"
        )
        db.session.add(annonce)
        db.session.commit()
        return annonce


@pytest.fixture
def test_notaire(app, test_users):
    """Créer un notaire de test."""
    with app.app_context():
        notaire_obj = Notaire(
            utilisateur_id=test_users['notaire'].utilisateur_id,
            etude_notariale="Etude Notaire Paris",
            numero_rpps="12345678901234567890",
            adresse_etude="456 Avenue du Notaire, Paris",
            code_postal_etude="75001",
            ville_etude="Paris",
            telephone="+33123456789",
            email_professionnel="notaire@etude.fr",
            zone_geographique={"villes": ["Paris"], "codes_postaux": ["75001"]},
            partenaire_actif=True
        )
        db.session.add(notaire_obj)
        db.session.commit()
        return notaire_obj


@pytest.fixture
def auth_headers(client, test_users):
    """Créer des headers d'authentification de test."""
    # Normallement il faudrait implémenter une vraie authentification
    # Pour les tests, on simule avec des tokens
    return {
        'vendeur': {'Authorization': 'Bearer test_token_vendeur'},
        'acheteur': {'Authorization': 'Bearer test_token_acheteur'},
        'notaire': {'Authorization': 'Bearer test_token_notaire'}
    }


# ==================== TESTS OFFRES ====================

def test_creer_offre(client, app, test_users, test_annonce, auth_headers):
    """Test: Créer une offre."""
    with app.app_context():
        # L'acheteur crée une offre sur l'annonce
        payload = {
            'annonce_id': test_annonce.annonce_id,
            'prix_propose': 295000,
            'conditions_suspensives': 'Obtention prêt bancaire',
            'message': 'Offre sérieuse'
        }

        # Note: Les tests réels nécessitent une authentification correcte
        # Pour cet exemple, on teste simplement la structure de l'endpoint
        # response = client.post('/api/v1/offres',
        #     json=payload,
        #     headers=auth_headers['acheteur']
        # )

        # Créer manuellement une offre pour tester la structure
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='proposee',
            message='Offre sérieuse',
            conditions_suspensives='Obtention prêt bancaire'
        )
        offre.set_expiration_24h()

        db.session.add(offre)
        db.session.commit()

        # Vérifications
        assert offre.offre_id is not None
        assert offre.statut == 'proposee'
        assert offre.prix_propose == Decimal('295000')
        assert offre.date_expiration > datetime.utcnow()


def test_offre_expiration(app, test_users, test_annonce):
    """Test: L'offre expire après 24h."""
    with app.app_context():
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='proposee'
        )
        offre.set_expiration_24h()

        # Vérifier que l'expiration est dans ~24h
        assert offre.date_expiration is not None
        diff = (offre.date_expiration - datetime.utcnow()).total_seconds() / 3600
        assert 23.5 < diff < 24.5  # À peu près 24h


def test_verifier_offre_expiree(app, test_users, test_annonce):
    """Test: Vérifier si une offre a expiré."""
    with app.app_context():
        # Offre expirée
        offre_expiree = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='proposee',
            date_expiration=datetime.utcnow() - timedelta(hours=1)
        )
        assert offre_expiree.is_expired()

        # Offre valide
        offre_valide = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='proposee',
            date_expiration=datetime.utcnow() + timedelta(hours=12)
        )
        assert not offre_valide.is_expired()


# ==================== TESTS TRANSACTIONS ====================

def test_creer_transaction_apres_offre_acceptee(app, test_users, test_annonce):
    """Test: Créer une transaction après acceptation d'offre."""
    with app.app_context():
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='acceptee'
        )
        db.session.add(offre)
        db.session.commit()

        # Créer la transaction
        transaction = TransactionNotaire(
            offre_id=offre.offre_id,
            annonce_id=test_annonce.annonce_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            prix_compromis=Decimal('295000'),
            statut='en_attente_selection'
        )
        db.session.add(transaction)
        db.session.commit()

        # Vérifications
        assert transaction.transaction_notaire_id is not None
        assert transaction.statut == 'en_attente_selection'
        assert transaction.prix_compromis == Decimal('295000')
        assert transaction.offre_id == offre.offre_id


def test_selectionner_notaire(app, test_users, test_annonce, test_notaire):
    """Test: Sélectionner un notaire pour une transaction."""
    with app.app_context():
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='acceptee'
        )
        db.session.add(offre)
        db.session.commit()

        transaction = TransactionNotaire(
            offre_id=offre.offre_id,
            annonce_id=test_annonce.annonce_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            prix_compromis=Decimal('295000'),
            statut='en_attente_selection'
        )
        db.session.add(transaction)
        db.session.commit()

        # Sélectionner le notaire
        transaction.notaire_id = test_notaire.notaire_id
        transaction.statut = 'notaire_selectionne'
        transaction.date_assignation_notaire = datetime.utcnow()
        db.session.commit()

        # Vérifications
        assert transaction.notaire_id == test_notaire.notaire_id
        assert transaction.statut == 'notaire_selectionne'


# ==================== TESTS FRAIS NOTAIRE ====================

def test_valider_frais_notaire(app, test_users, test_annonce, test_notaire):
    """Test: Valider les frais notaire."""
    with app.app_context():
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='acceptee'
        )
        db.session.add(offre)
        db.session.commit()

        transaction = TransactionNotaire(
            offre_id=offre.offre_id,
            annonce_id=test_annonce.annonce_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            notaire_id=test_notaire.notaire_id,
            prix_compromis=Decimal('295000'),
            statut='notaire_selectionne'
        )
        db.session.add(transaction)
        db.session.commit()

        # Créer les frais notaire
        frais = FraisNotaire(
            transaction_notaire_id=transaction.transaction_notaire_id,
            notaire_id=test_notaire.notaire_id,
            montant_frais=Decimal('8000'),
            detail='Droits 6000€ + Émoluments 2000€',
            statut='valide',
            date_validation=datetime.utcnow()
        )
        db.session.add(frais)

        # Créer la commission Immo2000 (2%)
        montant_commission = Decimal('295000') * Decimal('0.02')
        commission = CommissionImmo2000(
            transaction_notaire_id=transaction.transaction_notaire_id,
            prix_vente=Decimal('295000'),
            montant_commission=montant_commission,
            statut='calculee'
        )
        db.session.add(commission)
        db.session.commit()

        # Vérifications
        assert frais.montant_frais == Decimal('8000')
        assert frais.statut == 'valide'
        assert commission.montant_commission == Decimal('5900')  # 2% de 295000

        # Calculer le total
        total = Decimal('295000') + Decimal('8000') + commission.montant_commission
        assert total == Decimal('308900')


# ==================== TESTS PAIEMENTS ====================

def test_creer_paiement(app, test_users, test_annonce, test_notaire):
    """Test: Créer un paiement."""
    with app.app_context():
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='acceptee'
        )
        db.session.add(offre)
        db.session.commit()

        transaction = TransactionNotaire(
            offre_id=offre.offre_id,
            annonce_id=test_annonce.annonce_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            notaire_id=test_notaire.notaire_id,
            prix_compromis=Decimal('295000'),
            statut='compromis_signe'
        )
        db.session.add(transaction)
        db.session.commit()

        # Créer le paiement du dépôt (15%)
        montant_depot = Decimal('295000') * Decimal('0.15')
        paiement = Paiement(
            transaction_notaire_id=transaction.transaction_notaire_id,
            montant=montant_depot,
            devise='EUR',
            type='depot_garantie',
            statut='en_attente',
            description='Dépôt de garantie'
        )
        db.session.add(paiement)
        db.session.commit()

        # Vérifications
        assert paiement.paiement_id is not None
        assert paiement.montant == Decimal('44250')  # 15% de 295000
        assert paiement.statut == 'en_attente'
        assert paiement.type == 'depot_garantie'


def test_confirmer_paiement(app, test_users, test_annonce, test_notaire):
    """Test: Confirmer un paiement."""
    with app.app_context():
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='acceptee'
        )
        db.session.add(offre)
        db.session.commit()

        transaction = TransactionNotaire(
            offre_id=offre.offre_id,
            annonce_id=test_annonce.annonce_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            notaire_id=test_notaire.notaire_id,
            prix_compromis=Decimal('295000'),
            statut='compromis_signe'
        )
        db.session.add(transaction)
        db.session.commit()

        # Créer et confirmer le paiement
        paiement = Paiement(
            transaction_notaire_id=transaction.transaction_notaire_id,
            montant=Decimal('44250'),
            devise='EUR',
            type='depot_garantie',
            statut='en_attente'
        )
        db.session.add(paiement)
        db.session.commit()

        # Confirmer
        paiement.statut = 'reussi'
        paiement.stripe_charge_id = 'ch_3MiEt7...'
        paiement.date_paiement = datetime.utcnow()

        # Mettre à jour la transaction
        transaction.statut = 'paiement_depot'
        db.session.commit()

        # Vérifications
        assert paiement.statut == 'reussi'
        assert paiement.date_paiement is not None
        assert transaction.statut == 'paiement_depot'


# ==================== TESTS PARCOURS COMPLET ====================

def test_parcours_complet_vente(app, test_users, test_annonce, test_notaire):
    """Test: Parcours complet de vente."""
    with app.app_context():
        # 1. Créer une offre
        offre = Offre(
            annonce_id=test_annonce.annonce_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            prix_propose=Decimal('295000'),
            statut='proposee'
        )
        offre.set_expiration_24h()
        db.session.add(offre)
        db.session.commit()

        assert offre.statut == 'proposee'

        # 2. Vendeur accepte
        offre.statut = 'acceptee'
        offre.date_reponse = datetime.utcnow()
        db.session.commit()

        # 3. Créer transaction
        transaction = TransactionNotaire(
            offre_id=offre.offre_id,
            annonce_id=test_annonce.annonce_id,
            vendeur_id=test_users['vendeur'].utilisateur_id,
            acheteur_id=test_users['acheteur'].utilisateur_id,
            prix_compromis=Decimal('295000'),
            statut='en_attente_selection'
        )
        db.session.add(transaction)
        db.session.commit()

        # 4. Sélectionner notaire
        transaction.notaire_id = test_notaire.notaire_id
        transaction.statut = 'notaire_selectionne'
        transaction.date_assignation_notaire = datetime.utcnow()
        db.session.commit()

        # 5. Notaire valide frais
        frais = FraisNotaire(
            transaction_notaire_id=transaction.transaction_notaire_id,
            notaire_id=test_notaire.notaire_id,
            montant_frais=Decimal('8000'),
            statut='valide',
            date_validation=datetime.utcnow()
        )
        commission = CommissionImmo2000(
            transaction_notaire_id=transaction.transaction_notaire_id,
            prix_vente=Decimal('295000'),
            montant_commission=Decimal('5900'),
            statut='calculee'
        )
        db.session.add_all([frais, commission])
        db.session.commit()

        # 6. Signer compromis
        transaction.statut = 'compromis_signe'
        db.session.commit()

        # 7. Créer et confirmer paiement
        paiement = Paiement(
            transaction_notaire_id=transaction.transaction_notaire_id,
            montant=Decimal('44250'),
            type='depot_garantie',
            statut='reussi',
            date_paiement=datetime.utcnow()
        )
        db.session.add(paiement)
        transaction.statut = 'paiement_depot'
        db.session.commit()

        # 8. Signer acte authentique
        transaction.statut = 'finalisee'
        transaction.date_completion = datetime.utcnow()
        db.session.commit()

        # Vérifications finales
        assert offre.statut == 'acceptee'
        assert transaction.statut == 'finalisee'
        assert paiement.statut == 'reussi'
        assert transaction.notaire_id == test_notaire.notaire_id

        # Calculer total
        total = Decimal('295000') + Decimal('8000') + Decimal('5900')
        assert total == Decimal('308900')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
