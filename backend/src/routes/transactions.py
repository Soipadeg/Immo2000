"""
API routes pour la gestion des transactions notariales.

Endpoints pour:
- Sélectionner un notaire
- Valider les frais notaire
- Signer les documents (compromis, acte authentique)
- Archiver les documents
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Tuple

from src.auth.decorators import token_required
from src.auth.models import User, db
from src.models.notaires import Notaire, TransactionNotaire
from src.models.offres import Offre
from src.models.paiements import FraisNotaire, CommissionImmo2000
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError

transactions_vente_bp = Blueprint('transactions_vente', __name__, url_prefix='/api/v1/transactions')


@transactions_vente_bp.route('/<int:transaction_id>/notaire', methods=['POST'])
@token_required
@handle_errors()
def select_notaire(current_user: User, transaction_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Sélectionner un notaire pour une transaction.

    Endpoint: POST /api/v1/transactions/{transaction_id}/notaire

    Paramètres:
        - notaire_id (int): ID du notaire à sélectionner

    Réponse:
        {
            "transaction_id": 1,
            "notaire_id": 5,
            "statut": "notaire_selectionne",
            "message": "Notaire sélectionné avec succès"
        }
    """
    data = request.get_json()
    notaire_id = data.get('notaire_id')

    if not notaire_id:
        raise ValidationError("notaire_id est requis")

    # Vérifier la transaction
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    # Vérifier que l'utilisateur actuel est vendeur ou acheteur
    if current_user.user_id not in [transaction.vendeur_id, transaction.acheteur_id]:
        raise ForbiddenError("Vous n'avez pas accès à cette transaction")

    # Vérifier le notaire
    notaire = db.session.query(Notaire).filter_by(
        notaire_id=notaire_id,
        partenaire_actif=True
    ).first()
    if not notaire:
        raise NotFoundError(f"Notaire {notaire_id} non trouvé ou inactif")

    # Vérifier disponibilité notaire
    if not notaire.est_disponible():
        raise ValidationError("Notaire indisponible (trop de dossiers)")

    # Mettre à jour la transaction
    transaction.notaire_id = notaire_id
    transaction.statut = "notaire_selectionne"
    transaction.date_assignation_notaire = datetime.utcnow()

    db.session.commit()

    # Envoyer notification au notaire (TODO: intégration SendGrid)
    # send_email_to_notaire(notaire, transaction)

    return {
        'transaction_id': transaction.transaction_notaire_id,
        'notaire_id': notaire_id,
        'statut': 'notaire_selectionne',
        'message': 'Notaire sélectionné avec succès'
    }, 200


@transactions_vente_bp.route('/<int:transaction_id>/frais/valider', methods=['POST'])
@token_required
@handle_errors()
def validate_frais(current_user: User, transaction_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Valider ou refuser les frais notaire.

    Endpoint: POST /api/v1/transactions/{transaction_id}/frais/valider

    Paramètres:
        - montant_frais (Decimal): Montant des frais
        - detail (str): Détail des frais
        - action (str): 'valider' ou 'refuser'
        - raison_refus (str): Raison du refus (si action='refuser')

    Réponse:
        {
            "frais_id": 1,
            "montant_frais": 8000,
            "statut": "valide",
            "commission_immo2000": 6000
        }
    """
    data = request.get_json()
    montant_frais = data.get('montant_frais')
    detail = data.get('detail')
    action = data.get('action', 'valider')

    if not montant_frais:
        raise ValidationError("montant_frais est requis")

    # Vérifier que montant_frais est positif
    try:
        montant_frais = Decimal(str(montant_frais))
        if montant_frais <= 0:
            raise ValueError("Montant négatif")
    except (ValueError, TypeError):
        raise ValidationError("montant_frais doit être un nombre positif")

    # Vérifier la transaction
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    # Vérifier que l'utilisateur est notaire assigné
    if current_user.user_id != transaction.notaire.utilisateur_id:
        raise ForbiddenError("Seul le notaire assigné peut valider les frais")

    if action == 'valider':
        # Créer FraisNotaire
        frais_notaire = FraisNotaire(
            transaction_notaire_id=transaction_id,
            notaire_id=transaction.notaire_id,
            montant_frais=montant_frais,
            detail=detail,
            statut='valide',
            date_validation=datetime.utcnow()
        )
        db.session.add(frais_notaire)

        # Calculer et créer CommissionImmo2000 (2% du prix de vente)
        commission_montant = Decimal(str(transaction.prix_compromis)) * Decimal('0.02')
        commission = CommissionImmo2000(
            transaction_notaire_id=transaction_id,
            prix_vente=transaction.prix_compromis,
            montant_commission=commission_montant,
            statut='calculee'
        )
        db.session.add(commission)

        # Mettre à jour statut transaction
        transaction.statut = 'frais_valides'
        transaction.date_validation = datetime.utcnow()

    elif action == 'refuser':
        raison_refus = data.get('raison_refus')
        if not raison_refus:
            raise ValidationError("raison_refus est requis pour refuser")

        frais_notaire = FraisNotaire(
            transaction_notaire_id=transaction_id,
            notaire_id=transaction.notaire_id,
            montant_frais=montant_frais,
            detail=detail,
            statut='refuse',
            date_validation=datetime.utcnow(),
            raison_refus=raison_refus
        )
        db.session.add(frais_notaire)

        # Mettre à jour statut transaction
        transaction.statut = 'frais_refuses'
        transaction.modifications_demandees = raison_refus

    else:
        raise ValidationError("action doit être 'valider' ou 'refuser'")

    db.session.commit()

    return {
        'frais_id': frais_notaire.frais_notaire_id,
        'montant_frais': float(montant_frais),
        'statut': frais_notaire.statut,
        'commission_immo2000': float(commission_montant) if action == 'valider' else None,
        'message': 'Frais validés' if action == 'valider' else 'Frais refusés'
    }, 201


@transactions_vente_bp.route('/<int:transaction_id>/calcul-frais', methods=['GET'])
@token_required
@handle_errors()
def calcul_frais(current_user: User, transaction_id: int) -> Dict[str, Any]:
    """
    Calculer les frais pour une transaction.

    Endpoint: GET /api/v1/transactions/{transaction_id}/calcul-frais

    Réponse:
        {
            "prix_vente": 300000,
            "frais_notaire": 8000,
            "frais_immo2000": 6000,
            "total_a_payer": 314000
        }
    """
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    prix_vente = Decimal(str(transaction.prix_compromis))
    commission_immo2000 = prix_vente * Decimal('0.02')

    # Récupérer frais notaire si validés
    frais_notaire_obj = db.session.query(FraisNotaire).filter_by(
        transaction_notaire_id=transaction_id,
        statut='valide'
    ).first()
    frais_notaire = Decimal(str(frais_notaire_obj.montant_frais)) if frais_notaire_obj else None

    total = prix_vente
    if frais_notaire:
        total += frais_notaire
    total += commission_immo2000

    return {
        'transaction_id': transaction_id,
        'prix_vente': float(prix_vente),
        'frais_notaire': float(frais_notaire) if frais_notaire else None,
        'frais_immo2000': float(commission_immo2000),
        'total_a_payer': float(total)
    }


@transactions_vente_bp.route('/<int:transaction_id>/compromis/sign', methods=['POST'])
@token_required
@handle_errors()
def sign_compromis(current_user: User, transaction_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Mettre à jour le statut du compromis après signature.

    Endpoint: POST /api/v1/transactions/{transaction_id}/compromis/sign

    Paramètres:
        - compromis_url (str): URL du document signé (DocuSign)
        - signature_date (str): Date de signature (ISO format)

    Réponse:
        {
            "transaction_id": 1,
            "statut": "compromis_signe",
            "paiement_depot_attendu": "2026-05-22"
        }
    """
    data = request.get_json()
    compromis_url = data.get('compromis_url')

    if not compromis_url:
        raise ValidationError("compromis_url est requis")

    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    # Vérifier permissions (notaire ou parties)
    if current_user.user_id not in [transaction.vendeur_id, transaction.acheteur_id, transaction.notaire.utilisateur_id]:
        raise ForbiddenError("Vous n'avez pas accès à cette transaction")

    transaction.statut = 'compromis_signe'
    # TODO: Stocker compromis_url (ajouter champ dans TransactionNotaire)

    db.session.commit()

    # TODO: Planifier rappel paiement dépôt après 3 jours (APScheduler)

    return {
        'transaction_id': transaction_id,
        'statut': 'compromis_signe',
        'paiement_depot_attendu': datetime.utcnow().isoformat(),
        'message': 'Compromis signé avec succès'
    }, 200


@transactions_vente_bp.route('/<int:transaction_id>/acte/sign', methods=['POST'])
@token_required
@handle_errors()
def sign_acte_authentique(current_user: User, transaction_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Finaliser la vente après signature de l'acte authentique.

    Endpoint: POST /api/v1/transactions/{transaction_id}/acte/sign

    Paramètres:
        - acte_url (str): URL de l'acte signé

    Réponse:
        {
            "transaction_id": 1,
            "statut": "finalisee",
            "message": "Vente finalisée avec succès"
        }
    """
    data = request.get_json()
    acte_url = data.get('acte_url')

    if not acte_url:
        raise ValidationError("acte_url est requis")

    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    # Vérifier permissions
    if current_user.user_id not in [transaction.vendeur_id, transaction.acheteur_id, transaction.notaire.utilisateur_id]:
        raise ForbiddenError("Vous n'avez pas accès à cette transaction")

    transaction.statut = 'finalisee'
    transaction.date_completion = datetime.utcnow()

    # TODO: Archiver dans AWS S3
    # archive_document_to_s3(transaction, acte_url, 'acte_authentique.pdf')

    db.session.commit()

    return {
        'transaction_id': transaction_id,
        'statut': 'finalisee',
        'message': 'Acte authentique signé et vente finalisée'
    }, 200


@transactions_vente_bp.route('/<int:transaction_id>', methods=['GET'])
@token_required
@handle_errors()
def get_transaction(current_user: User, transaction_id: int) -> Dict[str, Any]:
    """
    Récupérer les détails d'une transaction.

    Endpoint: GET /api/v1/transactions/{transaction_id}
    """
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()
    if not transaction:
        raise NotFoundError(f"Transaction {transaction_id} non trouvée")

    # Vérifier permissions
    if current_user.user_id not in [transaction.vendeur_id, transaction.acheteur_id]:
        # Allow notaire to view
        if transaction.notaire_id and current_user.user_id == transaction.notaire.utilisateur_id:
            pass
        else:
            raise ForbiddenError("Vous n'avez pas accès à cette transaction")

    return transaction.to_dict()


@transactions_vente_bp.route('', methods=['GET'])
@token_required
@handle_errors()
def list_transactions(current_user: User) -> Dict[str, Any]:
    """
    Lister les transactions de l'utilisateur.

    Endpoint: GET /api/v1/transactions

    Query params:
        - statut (str): Filtrer par statut
        - limit (int): Nombre de résultats (défaut: 20)
        - offset (int): Offset (défaut: 0)
    """
    statut = request.args.get('statut')
    limit = min(int(request.args.get('limit', 20)), 100)
    offset = int(request.args.get('offset', 0))

    query = db.session.query(TransactionNotaire).filter(
        (TransactionNotaire.vendeur_id == current_user.user_id) |
        (TransactionNotaire.acheteur_id == current_user.user_id)
    )

    if statut:
        query = query.filter_by(statut=statut)

    total = query.count()
    transactions = query.order_by(TransactionNotaire.date_creation.desc()).limit(limit).offset(offset).all()

    return {
        'total': total,
        'limit': limit,
        'offset': offset,
        'transactions': [t.to_dict() for t in transactions]
    }
