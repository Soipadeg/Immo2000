"""
Routes/endpoints pour gestion notaires partenaires.

Endpoints:
- POST   /api/v1/notaires - Créer profil notaire (admin)
- GET    /api/v1/notaires - Lister notaires (filtré)
- GET    /api/v1/notaires/<id> - Détails notaire
- PUT    /api/v1/notaires/<id> - Mettre à jour profil (notaire)
- GET    /api/v1/notaires/<id>/stats - Stats notaire
- POST   /api/v1/notaires/<id>/availability - Ajouter créneau
- GET    /api/v1/transactions/<id>/available-notaires - Notaires disponibles
- POST   /api/v1/transactions/<id>/assign-notaire - Assigner notaire
- GET    /api/v1/notaires/<id>/dashboard/pending - Cas en attente (notaire)
- POST   /api/v1/transactions/<id>/validate - Valider compromis
- POST   /api/v1/transactions/<id>/request-modifications - Demander modifs
- POST   /api/v1/transactions/<id>/reject - Refuser
- GET    /api/v1/transactions/<id>/history - Historique
"""

from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from src.auth.decorators import token_required, admin_required
from src.auth.models import db, User
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError, UnauthorizedError
from src.schemas.notaires import (
    NotaireCreate, NotaireUpdate, NotaireResponse,
    TransactionNotaireCreate, TransactionNotaireModifications,
    TransactionNotaireResponse
)
from src.crud import notaires as crud_notaires
from src.models.notaires import Notaire, TransactionNotaire

logger = logging.getLogger(__name__)

notaires_bp = Blueprint('notaires', __name__, url_prefix='/api/v1/notaires')


def notaire_required(f):
    """Décorateur: utilisateur doit être notaire partenaire."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            payload = request.headers.get('Authorization')
            if not payload:
                return jsonify({'erreur': 'Token manquant'}), 401

            # Récupérer user depuis token (via @token_required)
            user_id = kwargs.get('utilisateur_id')
            if not user_id:
                return jsonify({'erreur': 'Non autorisé'}), 403

            notaire = crud_notaires.get_notaire_by_utilisateur(db.session, user_id)
            if not notaire:
                return jsonify({'erreur': 'Profil notaire non trouvé'}), 403

            # Passer notaire_id au endpoint
            kwargs['notaire_obj'] = notaire
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Erreur notaire_required: {str(e)}")
            return jsonify({'erreur': 'Erreur authentification'}), 401

    return decorated_function


# ===== CRUD NOTAIRES =====

@notaires_bp.route('', methods=['POST'])
@token_required
@admin_required
@handle_errors()
def create_notaire(utilisateur_id, **kwargs):
    """Créer profil notaire partenaire (admin seulement)."""
    # Vérifier permissions (admin)
    user = db.session.query(User).filter_by(utilisateur_id=utilisateur_id).first()
    if not user or user.role != 'admin':
        raise ForbiddenError('Permissions insuffisantes')

    # Valider données
    data = request.get_json()
    try:
        validated = NotaireCreate(**data)
    except Exception as e:
        raise ValidationError(f"Validation error: {str(e)}")

    # Créer notaire
    notaire = crud_notaires.create_notaire(
        db=db.session,
        utilisateur_id=data.get('utilisateur_id'),
        etude_notariale=validated.etude_notariale,
        numero_rpps=validated.numero_rpps,
        adresse_etude=validated.adresse_etude,
        code_postal_etude=validated.code_postal_etude,
        ville_etude=validated.ville_etude,
        telephone=validated.telephone,
        email_professionnel=validated.email_professionnel,
        zone_geographique=validated.zone_geographique,
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
    )

    return {'data': notaire.to_dict()}, 201


@notaires_bp.route('', methods=['GET'])
@token_required
@handle_errors()
def list_notaires(utilisateur_id, **kwargs):
    """Lister notaires partenaires (avec filtres)."""
    # Paramètres filtres
    ville = request.args.get('ville')
    code_postal = request.args.get('code_postal')
    specialisation = request.args.get('specialisation')
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 10, type=int)

    notaires, total = crud_notaires.search_notaires(
        db=db.session,
        ville=ville,
        code_postal=code_postal,
        specialisation=specialisation,
        skip=skip,
        limit=limit
    )

    return {
        'notaires': [n.to_dict() for n in notaires],
        'total': total,
        'skip': skip,
        'limit': limit
    }


@notaires_bp.route('/<int:notaire_id>', methods=['GET'])
@token_required
@handle_errors()
def get_notaire(utilisateur_id, notaire_id, **kwargs):
    """Récupérer détails notaire."""
    notaire = crud_notaires.get_notaire(db.session, notaire_id)
    if not notaire:
        raise NotFoundError('Notaire non trouvé')

    return {'data': notaire.to_dict()}


@notaires_bp.route('/<int:notaire_id>', methods=['PUT'])
@token_required
@handle_errors()
def update_notaire(utilisateur_id, notaire_id, **kwargs):
    """Mettre à jour profil notaire (notaire seulement)."""
    # Vérifier que c'est le bon notaire
    notaire = crud_notaires.get_notaire(db.session, notaire_id)
    if not notaire:
        raise NotFoundError('Notaire non trouvé')

    if notaire.utilisateur_id != utilisateur_id:
        raise ForbiddenError('Non autorisé')

    # Valider données
    data = request.get_json()

    # Mettre à jour
    updated = crud_notaires.update_notaire(
        db.session,
        notaire_id,
        **data
    )

    return {'data': updated.to_dict()}


@notaires_bp.route('/<int:notaire_id>/stats', methods=['GET'])
@token_required
@handle_errors()
def get_notaire_stats(utilisateur_id, notaire_id, **kwargs):
    """Récupérer statistiques notaire."""
    stats = crud_notaires.get_notaire_stats(db.session, notaire_id)
    if not stats:
        raise NotFoundError('Notaire non trouvé')

    return {'data': stats}


# ===== TRANSACTIONS NOTAIRE =====

@notaires_bp.route('/transactions/<int:transaction_id>/validate', methods=['POST'])
@token_required
@handle_errors()
def validate_compromis(utilisateur_id, transaction_id, **kwargs):
    """Notaire valide compromis."""
    # Récupérer notaire
    notaire = crud_notaires.get_notaire_by_utilisateur(db.session, utilisateur_id)
    if not notaire:
        raise ForbiddenError('Profil notaire manquant')

    # Récupérer transaction
    transaction = crud_notaires.get_transaction_notaire(db.session, transaction_id)
    if not transaction:
        raise NotFoundError('Transaction non trouvée')

    # Données optionnelles
    data = request.get_json() or {}
    commentaires = data.get('commentaires')

    # Valider
    updated = crud_notaires.validate_compromis(
        db.session,
        transaction_id,
        notaire.notaire_id,
        commentaires=commentaires
    )

    # TODO: Notifier acheteur et vendeur

    return {'data': updated.to_dict()}


@notaires_bp.route('/transactions/<int:transaction_id>/request-modifications', methods=['POST'])
@token_required
@handle_errors()
def request_modifications(utilisateur_id, transaction_id, **kwargs):
    """Notaire demande modifications."""
    # Récupérer notaire
    notaire = crud_notaires.get_notaire_by_utilisateur(db.session, utilisateur_id)
    if not notaire:
        raise ForbiddenError('Profil notaire manquant')

    # Valider données requises
    data = request.get_json()
    if not data.get('modifications_demandees'):
        raise ValidationError('modifications_demandees requis')

    delai_jours = data.get('delai_jours', 5)

    # Mettre à jour
    updated = crud_notaires.request_modifications(
        db.session,
        transaction_id,
        notaire.notaire_id,
        modifications_demandees=data['modifications_demandees'],
        delai_jours=delai_jours
    )

    # TODO: Notifier vendeur/acheteur

    return {'data': updated.to_dict()}


@notaires_bp.route('/transactions/<int:transaction_id>/reject', methods=['POST'])
@token_required
@handle_errors()
def reject_compromis(utilisateur_id, transaction_id, **kwargs):
    """Notaire refuse compromis."""
    # Récupérer notaire
    notaire = crud_notaires.get_notaire_by_utilisateur(db.session, utilisateur_id)
    if not notaire:
        raise ForbiddenError('Profil notaire manquant')

    # Valider données
    data = request.get_json()
    if not data.get('raison_refus'):
        raise ValidationError('raison_refus requis')

    # Mettre à jour
    updated = crud_notaires.reject_compromis(
        db.session,
        transaction_id,
        notaire.notaire_id,
        raison_refus=data['raison_refus']
    )

    # TODO: Notifier vendeur/acheteur

    return {'data': updated.to_dict()}


# ===== DASHBOARD NOTAIRE =====

@notaires_bp.route('/<int:notaire_id>/dashboard/pending', methods=['GET'])
@token_required
@handle_errors()
def get_pending_cases(utilisateur_id, notaire_id, **kwargs):
    """Récupérer cas en attente pour notaire (tableau de bord)."""
    # Vérifier permissions
    notaire = crud_notaires.get_notaire(db.session, notaire_id)
    if not notaire or notaire.utilisateur_id != utilisateur_id:
        raise ForbiddenError('Non autorisé')

    # Récupérer transactions
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 20, type=int)

    transactions, total = crud_notaires.list_transactions_for_notaire(
        db.session,
        notaire_id,
        statuts=['en_attente_validation', 'modifications_demandees'],
        skip=skip,
        limit=limit
    )

    return {
        'transactions': [t.to_dict() for t in transactions],
        'total': total,
        'skip': skip,
        'limit': limit
    }


@notaires_bp.route('/transactions/<int:transaction_id>/history', methods=['GET'])
@token_required
@handle_errors()
def get_transaction_history(utilisateur_id, transaction_id, **kwargs):
    """Récupérer historique/audit trail transaction."""
    # Récupérer transaction
    transaction = crud_notaires.get_transaction_notaire(db.session, transaction_id)
    if not transaction:
        raise NotFoundError('Transaction non trouvée')

    # Vérifier permissions (notaire, acheteur ou vendeur)
    notaire = crud_notaires.get_notaire_by_utilisateur(db.session, utilisateur_id)
    is_notaire = notaire and notaire.notaire_id == transaction.notaire_id
    is_involved = utilisateur_id in [transaction.vendeur_id, transaction.acheteur_id]

    if not (is_notaire or is_involved):
        raise ForbiddenError('Non autorisé')

    # Retourner historique
    historique = [h.to_dict() for h in transaction.historique]

    return {
        'transaction_id': transaction_id,
        'historique': historique,
        'total': len(historique)
    }


# ===== ASSIGNATION NOTAIRE (depuis utilisateur) =====

@notaires_bp.route('/transactions/<int:transaction_id>/assign', methods=['POST'])
@token_required
@handle_errors()
def assign_notaire_to_transaction(utilisateur_id, transaction_id, **kwargs):
    """Acheteur/vendeur assigne notaire à transaction."""
    # Récupérer transaction
    transaction = crud_notaires.get_transaction_notaire(db.session, transaction_id)
    if not transaction:
        raise NotFoundError('Transaction non trouvée')

    # Vérifier permissions (acheteur ou vendeur)
    if utilisateur_id not in [transaction.acheteur_id, transaction.vendeur_id]:
        raise ForbiddenError('Non autorisé')

    # Récupérer notaire_id depuis request
    data = request.get_json()
    notaire_id = data.get('notaire_id')

    if not notaire_id:
        raise ValidationError('notaire_id requis')

    # Assigner
    updated = crud_notaires.assign_notaire_to_transaction(
        db.session,
        transaction_id,
        notaire_id
    )

    # TODO: Notifier notaire

    return {'data': updated.to_dict()}


@notaires_bp.route('/available-for-transaction/<int:transaction_id>', methods=['GET'])
@token_required
@handle_errors()
def get_available_notaires_for_transaction(utilisateur_id, transaction_id, **kwargs):
    """Récupérer notaires disponibles pour une transaction."""
    # Récupérer transaction
    transaction = crud_notaires.get_transaction_notaire(db.session, transaction_id)
    if not transaction:
        raise NotFoundError('Transaction non trouvée')

    # Récupérer annonce pour localisation
    annonce = transaction.annonce
    if not annonce:
        raise NotFoundError('Annonce non trouvée')

    # Chercher notaires par zone
    notaires = crud_notaires.list_notaires_by_zone(
        db.session,
        annonce.code_postal,
        annonce.ville
    )

    return {
        'notaires': [n.to_dict() for n in notaires],
        'total': len(notaires)
    }


# ===== NOTIFICATIONS =====

@notaires_bp.route('/notifications/user', methods=['GET'])
@token_required
@handle_errors()
def get_user_notifications(current_user):
    """Récupérer les notifications notaires de l'utilisateur."""
    from src.services.notaire_notifications import NotaireNotificationService

    notaire_events_only = request.args.get('notaire_only', 'true').lower() == 'true'

    notifications = NotaireNotificationService.get_user_notifications(
        user_id=current_user['user_id'],
        notaire_events_only=notaire_events_only
    )

    return {
        'notifications': notifications,
        'total': len(notifications)
    }


@notaires_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@token_required
@handle_errors()
def mark_notification_read(current_user, notification_id):
    """Marquer une notification comme lue."""
    from src.services.notaire_notifications import NotaireNotificationService

    NotaireNotificationService.mark_notification_as_read(notification_id)

    return {
        'message': 'Notification marquée comme lue',
        'notification_id': notification_id
    }


@notaires_bp.route('/transactions/<int:transaction_id>/notifications', methods=['GET'])
@token_required
@handle_errors()
def get_transaction_notifications(current_user, transaction_id):
    """Récupérer les notifications liées à une transaction."""
    from src.services.notaire_notifications import NotaireNotificationService
    from src.models.notifications import Notification

    # Vérifier que la transaction existe
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()

    if not transaction:
        raise NotFoundError('Transaction non trouvée')

    # Vérifier permissions
    is_authorized = (
        transaction.vendeur_id == current_user['user_id'] or
        transaction.acheteur_id == current_user['user_id'] or
        (transaction.notaire and transaction.notaire.utilisateur_id == current_user['user_id'])
    )

    if not is_authorized:
        raise ForbiddenError('Non autorisé')

    # Récupérer notifications pour cette transaction
    notifications = db.session.query(Notification).filter(
        Notification.donnees['related_id'].astext.cast(db.Integer) == transaction_id
    ).order_by(Notification.date_creation.desc()).all()

    return {
        'notifications': [
            {
                'id': n.notification_id,
                'title': n.titre,
                'message': n.message,
                'created_at': n.date_creation.isoformat(),
                'read': n.lu
            }
            for n in notifications
        ],
        'total': len(notifications)
    }
