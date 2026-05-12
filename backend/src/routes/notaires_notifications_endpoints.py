"""
Endpoints supplémentaires pour notifications notaires.
À ajouter au fichier backend/src/routes/notaires.py
"""

from src.decorators.error_handling import handle_errors, NotFoundError, ForbiddenError

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
    }, 200


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
    }, 200


@notaires_bp.route('/transactions/<int:transaction_id>/notifications', methods=['GET'])
@token_required
@handle_errors()
def get_transaction_notifications(current_user, transaction_id):
    """Récupérer les notifications liées à une transaction."""
    from src.services.notaire_notifications import NotaireNotificationService

    # Vérifier permissions
    transaction = db.session.query(TransactionNotaire).filter_by(
        transaction_notaire_id=transaction_id
    ).first()

    if not transaction:
        raise NotFoundError('Transaction non trouvée')

    # Vérifier que l'utilisateur est impliqué
    if transaction.vendeur_id != current_user['user_id'] and \
       transaction.acheteur_id != current_user['user_id'] and \
       (transaction.notaire and transaction.notaire.utilisateur_id != current_user['user_id']):
        raise ForbiddenError('Non autorisé')

    # Récupérer notifications pour cette transaction
    from src.models.notifications import Notification

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
    }, 200


# À ajouter à la fin du fichier backend/src/routes/notaires.py
