"""
Endpoints supplémentaires pour notifications notaires.
À ajouter au fichier backend/src/routes/notaires.py
"""

# ===== NOTIFICATIONS =====

@notaires_bp.route('/notifications/user', methods=['GET'])
@token_required
def get_user_notifications(current_user):
    """Récupérer les notifications notaires de l'utilisateur."""
    try:
        from src.services.notaire_notifications import NotaireNotificationService

        notaire_events_only = request.args.get('notaire_only', 'true').lower() == 'true'

        notifications = NotaireNotificationService.get_user_notifications(
            user_id=current_user['user_id'],
            notaire_events_only=notaire_events_only
        )

        return jsonify({
            'notifications': notifications,
            'total': len(notifications)
        }), 200

    except Exception as e:
        logger.error(f"Erreur récupération notifications: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


@notaires_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@token_required
def mark_notification_read(current_user, notification_id):
    """Marquer une notification comme lue."""
    try:
        from src.services.notaire_notifications import NotaireNotificationService

        NotaireNotificationService.mark_notification_as_read(notification_id)

        return jsonify({
            'message': 'Notification marquée comme lue',
            'notification_id': notification_id
        }), 200

    except Exception as e:
        logger.error(f"Erreur marquage notification: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


@notaires_bp.route('/transactions/<int:transaction_id>/notifications', methods=['GET'])
@token_required
def get_transaction_notifications(current_user, transaction_id):
    """Récupérer les notifications liées à une transaction."""
    try:
        from src.services.notaire_notifications import NotaireNotificationService

        # Vérifier permissions
        transaction = db.session.query(TransactionNotaire).filter_by(
            transaction_notaire_id=transaction_id
        ).first()

        if not transaction:
            return jsonify({'erreur': 'Transaction non trouvée'}), 404

        # Vérifier que l'utilisateur est impliqué
        if transaction.vendeur_id != current_user['user_id'] and \
           transaction.acheteur_id != current_user['user_id'] and \
           (transaction.notaire and transaction.notaire.utilisateur_id != current_user['user_id']):
            return jsonify({'erreur': 'Non autorisé'}), 403

        # Récupérer notifications pour cette transaction
        from src.models.notifications import Notification

        notifications = db.session.query(Notification).filter(
            Notification.donnees['related_id'].astext.cast(db.Integer) == transaction_id
        ).order_by(Notification.date_creation.desc()).all()

        return jsonify({
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
        }), 200

    except Exception as e:
        logger.error(f"Erreur notifications transaction: {str(e)}")
        return jsonify({'erreur': 'Erreur serveur'}), 500


# À ajouter à la fin du fichier backend/src/routes/notaires.py
