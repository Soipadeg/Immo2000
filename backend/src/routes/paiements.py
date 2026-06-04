"""
API routes pour la gestion des paiements (Stripe).

Endpoints pour:
- Créer un paiement (initialiser PaymentIntent Stripe)
- Confirmer un paiement
- Lister les paiements
- Gérer les remboursements
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Tuple

from src.auth.decorators import token_required
from src.auth.models import User, db
from src.models.notaires import TransactionNotaire
from src.models.paiements import Paiement, TypePaiement, StatutPaiement
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError

paiements_vente_bp = Blueprint('paiements', __name__, url_prefix='/api/v1/paiements')


@paiements_vente_bp.route('', methods=['POST'])
@token_required
@handle_errors()
def create_paiement(current_user: User) -> Tuple[Dict[str, Any], int]:
    """
    Créer un paiement (initialiser PaymentIntent Stripe).

    Endpoint: POST /api/v1/paiements

    Paramètres:
        - transaction_id (int): ID de la transaction
        - montant (Decimal): Montant à payer
        - type (str): Type de paiement (depot_garantie, solde, frais_notaire)

    Réponse:
        {
            "paiement_id": 1,
            "client_secret": "pi_3MiEt7...",
            "montant": 15000,
            "statut": "en_attente",
            "stripe_payment_intent_id": "pi_3MiEt7..."
        }
    """
    data = request.get_json()
    transaction_id = data.get('transaction_id')
    montant = data.get('montant')
    type_paiement = data.get('type', 'depot_garantie')

    # Validation
    if not transaction_id or not montant:
        raise ValidationError("transaction_id et montant sont requis")

    try:
        montant = Decimal(str(montant))
        if montant <= 0:
            raise ValueError("Montant négatif")
    except (ValueError, TypeError):
        raise ValidationError("montant doit être un nombre positif")

    # Vérifier la transaction
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    # Vérifier permissions (acheteur)
    if current_user.user_id != transaction.acheteur_id:
        raise ForbiddenError("Seul l'acheteur peut effectuer un paiement")

    # TODO: Créer PaymentIntent Stripe
    # stripe_intent = stripe.PaymentIntent.create(
    #     amount=int(montant * 100),  # Stripe utilise les centimes
    #     currency="eur",
    #     metadata={
    #         "transaction_id": transaction_id,
    #         "type": type_paiement
    #     }
    # )
    # stripe_payment_intent_id = stripe_intent['id']
    # client_secret = stripe_intent['client_secret']

    # Créer enregistrement Paiement
    paiement = Paiement(
        transaction_notaire_id=transaction_id,
        montant=montant,
        devise="EUR",
        type=type_paiement,
        statut="en_attente",
        description=f"Paiement {type_paiement} - Transaction {transaction_id}",
        # stripe_payment_intent_id=stripe_payment_intent_id,
        # stripe_client_secret=client_secret,
        metadata={
            "acheteur_id": current_user.user_id,
            "transaction_id": transaction_id
        }
    )

    db.session.add(paiement)
    db.session.commit()

    return {
        'paiement_id': paiement.paiement_id,
        'transaction_id': transaction_id,
        'montant': float(montant),
        'type': type_paiement,
        'statut': 'en_attente',
        'message': 'Paiement créé. Veuillez confirmer via Stripe'
    }, 201


@paiements_vente_bp.route('/<int:paiement_id>/confirmer', methods=['POST'])
@token_required
@handle_errors()
def confirm_paiement(current_user: User, paiement_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Confirmer un paiement après succès Stripe.

    Endpoint: POST /api/v1/paiements/{paiement_id}/confirmer

    Paramètres:
        - stripe_charge_id (str): ID de la charge Stripe
        - stripe_response (dict): Réponse complète de Stripe

    Réponse:
        {
            "paiement_id": 1,
            "statut": "reussi",
            "date_paiement": "2026-05-19T10:30:00"
        }
    """
    data = request.get_json()
    stripe_charge_id = data.get('stripe_charge_id')
    stripe_response = data.get('stripe_response', {})

    if not stripe_charge_id:
        raise ValidationError("stripe_charge_id est requis")

    paiement = db.session.query(Paiement).filter_by(
        paiement_id=paiement_id
    ).first()
    if not paiement:
        raise NotFoundError(f"Paiement {paiement_id} non trouvé")

    # Vérifier permissions
    if paiement.transaction.acheteur_id != current_user.user_id:
        raise ForbiddenError("Vous n'avez pas accès à ce paiement")

    # Mettre à jour le paiement
    paiement.statut = "reussi"
    paiement.stripe_charge_id = stripe_charge_id
    paiement.date_paiement = datetime.utcnow()
    paiement.reponse_stripe = stripe_response

    # Mettre à jour la transaction selon le type de paiement
    transaction = paiement.transaction
    if paiement.type == "depot_garantie":
        transaction.statut = "paiement_depot"
    elif paiement.type == "solde":
        transaction.statut = "paiement_solde"

    db.session.commit()

    return {
        'paiement_id': paiement_id,
        'statut': 'reussi',
        'date_paiement': paiement.date_paiement.isoformat(),
        'message': 'Paiement confirmé avec succès'
    }, 200


@paiements_vente_bp.route('/<int:paiement_id>/echec', methods=['POST'])
@token_required
@handle_errors()
def payment_failed(current_user: User, paiement_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Enregistrer l'échec d'un paiement.

    Endpoint: POST /api/v1/paiements/{paiement_id}/echec

    Paramètres:
        - message_erreur (str): Message d'erreur Stripe
        - stripe_response (dict): Réponse Stripe complète
    """
    data = request.get_json()
    message_erreur = data.get('message_erreur', 'Paiement échoué')
    stripe_response = data.get('stripe_response', {})

    paiement = db.session.query(Paiement).filter_by(
        paiement_id=paiement_id
    ).first()
    if not paiement:
        raise NotFoundError(f"Paiement {paiement_id} non trouvé")

    # Vérifier permissions
    if paiement.transaction.acheteur_id != current_user.user_id:
        raise ForbiddenError("Vous n'avez pas accès à ce paiement")

    paiement.statut = "echoue"
    paiement.message_erreur = message_erreur
    paiement.reponse_stripe = stripe_response

    db.session.commit()

    return {
        'paiement_id': paiement_id,
        'statut': 'echoue',
        'message_erreur': message_erreur
    }, 200


@paiements_vente_bp.route('/transaction/<int:transaction_id>', methods=['GET'])
@token_required
@handle_errors()
def get_paiements_transaction(current_user: User, transaction_id: int) -> Dict[str, Any]:
    """
    Lister les paiements d'une transaction.

    Endpoint: GET /api/v1/paiements/transaction/{transaction_id}
    """
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    # Vérifier permissions
    if current_user.user_id not in [transaction.acheteur_id, transaction.vendeur_id]:
        raise ForbiddenError("Vous n'avez pas accès à cette transaction")

    paiements = db.session.query(Paiement).filter_by(
        transaction_notaire_id=transaction_id
    ).order_by(Paiement.date_creation.desc()).all()

    return {
        'transaction_id': transaction_id,
        'total': len(paiements),
        'paiements': [p.to_dict() for p in paiements]
    }


@paiements_vente_bp.route('/<int:paiement_id>', methods=['GET'])
@token_required
@handle_errors()
def get_paiement(current_user: User, paiement_id: int) -> Dict[str, Any]:
    """
    Récupérer les détails d'un paiement.

    Endpoint: GET /api/v1/paiements/{paiement_id}
    """
    paiement = db.session.query(Paiement).filter_by(
        paiement_id=paiement_id
    ).first()
    if not paiement:
        raise NotFoundError(f"Paiement {paiement_id} non trouvé")

    # Vérifier permissions
    if paiement.transaction.acheteur_id != current_user.user_id:
        raise ForbiddenError("Vous n'avez pas accès à ce paiement")

    return paiement.to_dict()


@paiements_vente_bp.route('/remboursement/<int:paiement_id>', methods=['POST'])
@token_required
@handle_errors()
def refund_payment(current_user: User, paiement_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Effectuer un remboursement pour un paiement.

    Endpoint: POST /api/v1/paiements/{paiement_id}/remboursement

    Paramètres:
        - montant_remboursement (Decimal, optionnel): Montant à rembourser (défaut: montant total)
        - motif (str): Motif du remboursement
    """
    data = request.get_json()
    montant_remboursement = data.get('montant_remboursement')
    motif = data.get('motif', 'Remboursement demandé')

    paiement = db.session.query(Paiement).filter_by(
        paiement_id=paiement_id
    ).first()
    if not paiement:
        raise NotFoundError(f"Paiement {paiement_id} non trouvé")

    # Vérifier permissions (acheteur ou admin)
    if paiement.transaction.acheteur_id != current_user.user_id:
        raise ForbiddenError("Vous n'avez pas accès à ce paiement")

    # Vérifier que le paiement a réussi
    if paiement.statut != "reussi":
        raise ValidationError("Seuls les paiements réussis peuvent être remboursés")

    if not montant_remboursement:
        montant_remboursement = paiement.montant
    else:
        montant_remboursement = Decimal(str(montant_remboursement))
        if montant_remboursement > paiement.montant:
            raise ValidationError("Montant de remboursement > montant original")

    # TODO: Appeler API Stripe pour refund
    # stripe.Refund.create(
    #     charge=paiement.stripe_charge_id,
    #     amount=int(montant_remboursement * 100)
    # )

    # Créer enregistrement remboursement
    remboursement = Paiement(
        transaction_notaire_id=paiement.transaction_notaire_id,
        montant=montant_remboursement,
        devise="EUR",
        type="remboursement",
        statut="reussi",
        description=f"Remboursement: {motif}",
        date_paiement=datetime.utcnow(),
        metadata={
            "paiement_original_id": paiement_id,
            "motif": motif
        }
    )

    db.session.add(remboursement)
    db.session.commit()

    return {
        'remboursement_id': remboursement.paiement_id,
        'montant': float(montant_remboursement),
        'statut': 'reussi',
        'message': 'Remboursement effectué'
    }, 201


# Webhook Stripe (non protégé par token_required, signé avec clé secrète)
@paiements_vente_bp.route('/webhook/stripe', methods=['POST'])
@handle_errors()
def stripe_webhook() -> Tuple[Dict[str, str], int]:
    """
    Webhook Stripe pour mettre à jour les statuts de paiement.

    Endpoint: POST /api/v1/paiements/webhook/stripe

    Événements traités:
        - payment_intent.succeeded
        - payment_intent.payment_failed
        - charge.refunded
    """
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    # TODO: Vérifier la signature avec webhook_secret
    # import stripe
    # event = stripe.Webhook.construct_event(
    #     payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
    # )

    try:
        event = request.get_json()
        event_type = event.get('type')

        if event_type == 'payment_intent.succeeded':
            # Traiter succès
            pass
        elif event_type == 'payment_intent.payment_failed':
            # Traiter échec
            pass
        elif event_type == 'charge.refunded':
            # Traiter remboursement
            pass

        return {'status': 'received'}, 200

    except ValueError as e:
        return {'error': str(e)}, 400
    except Exception as e:
        return {'error': str(e)}, 400
