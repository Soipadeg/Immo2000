"""
Routes pour les notifications push Firebase Cloud Messaging (FCM)
Intégration avec les notifications mobile et web
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from src.utils.fcm import create_notification_manager, create_fcm_service
from src.auth.models import db, User
from src.tasks import send_push_notification_async
import logging

logger = logging.getLogger(__name__)

fcm_bp = Blueprint('fcm', __name__, url_prefix='/api/fcm')


@fcm_bp.route('/register-token', methods=['POST'])
@login_required
def register_fcm_token():
    """
    Enregistrer le token FCM d'un utilisateur.
    Utilisé par le frontend pour les notifications push.

    Body JSON:
    {
        "token": "token_fcm_xyz..."
    }
    """
    try:
        data = request.get_json()

        if not data.get('token'):
            return jsonify({'error': 'Token requis'}), 400

        token = data.get('token')

        # Mettre à jour le token de l'utilisateur
        current_user.fcm_token = token
        db.session.commit()

        logger.info(f"Token FCM enregistré pour l'utilisateur {current_user.id}")
        return jsonify({'success': True, 'message': 'Token enregistré'}), 200

    except ValueError as e:
        db.session.rollback()
        logger.error(f"Erreur enregistrement token (validation): {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de l\'enregistrement'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur enregistrement token: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de l\'enregistrement'}), 500


@fcm_bp.route('/unregister-token', methods=['POST'])
@login_required
def unregister_fcm_token():
    """Désinscrire le token FCM d'un utilisateur"""
    try:
        current_user.fcm_token = None
        db.session.commit()

        logger.info(f"Token FCM supprimé pour l'utilisateur {current_user.id}")
        return jsonify({'success': True}), 200

    except AttributeError as e:
        db.session.rollback()
        logger.error(f"Erreur désinscription (attribut): {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la désinscription'}), 500
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur désinscription: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la désinscription'}), 500


@fcm_bp.route('/test', methods=['POST'])
@login_required
def send_test_notification():
    """Envoyer une notification de test"""
    try:
        if not current_user.fcm_token:
            return jsonify({'error': 'Token FCM non enregistré'}), 400

        # Envoyer une notification de test via Celery
        send_push_notification_async.delay(
            user_id=current_user.id,
            title="Notification de test",
            body="Ceci est une notification de test",
            data={'type': 'test'}
        )

        logger.info(f"Notification de test envoyée à {current_user.id}")
        return jsonify({'success': True, 'message': 'Notification de test envoyée'}), 200

    except ValueError as e:
        logger.error(f"Erreur envoi notification test (validation): {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de l\'envoi'}), 500
    except Exception as e:
        logger.error(f"Erreur envoi notification test: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de l\'envoi'}), 500


# Routes d'administration

@fcm_bp.route('/admin/send-to-users', methods=['POST'])
@login_required
def admin_send_to_users():
    """
    [ADMIN SEULEMENT] Envoyer une notification à plusieurs utilisateurs.

    Body JSON:
    {
        "user_ids": [1, 2, 3],
        "title": "Titre",
        "body": "Corps du message",
        "data": {...}
    }
    """
    try:
        # Vérifier que l'utilisateur est admin
        if not hasattr(current_user, 'is_admin') or not current_user.is_admin:
            return jsonify({'error': 'Accès refusé'}), 403

        data = request.get_json()

        if not data.get('user_ids') or not data.get('title') or not data.get('body'):
            return jsonify({'error': 'Données incomplètes'}), 400

        user_ids = data.get('user_ids')
        title = data.get('title')
        body = data.get('body')
        extra_data = data.get('data', {})

        # Récupérer les tokens des utilisateurs
        users = User.query.filter(
            User.id.in_(user_ids),
            User.fcm_token != None
        ).all()
        tokens = [u.fcm_token for u in users]

        if not tokens:
            return jsonify({'error': 'Aucun utilisateur avec token FCM'}), 400

        # Envoyer les notifications
        fcm = create_fcm_service()

        # Utiliser la multicast
        result = fcm.send_multicast(tokens, title, body, extra_data)

        logger.info(f"Notification admin envoyée à {len(tokens)} utilisateurs")
        return jsonify(result), 200

    except ValueError as e:
        logger.error(f"Erreur envoi admin (validation): {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de l\'envoi'}), 500
    except Exception as e:
        logger.error(f"Erreur envoi admin: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de l\'envoi'}), 500


@fcm_bp.route('/admin/send-to-topic', methods=['POST'])
@login_required
def admin_send_to_topic():
    """
    [ADMIN SEULEMENT] Envoyer une notification à un topic.

    Body JSON:
    {
        "topic": "announcements",
        "title": "Titre",
        "body": "Corps du message",
        "data": {...}
    }
    """
    try:
        # Vérifier que l'utilisateur est admin
        if not hasattr(current_user, 'is_admin') or not current_user.is_admin:
            return jsonify({'error': 'Accès refusé'}), 403

        data = request.get_json()

        if not data.get('topic') or not data.get('title') or not data.get('body'):
            return jsonify({'error': 'Données incomplètes'}), 400

        topic = data.get('topic')
        title = data.get('title')
        body = data.get('body')
        extra_data = data.get('data', {})

        # Envoyer la notification
        fcm = create_fcm_service()
        result = fcm.send_to_topic(topic, title, body, extra_data)

        logger.info(f"Notification envoyée au topic {topic}")
        return jsonify(result), 200

    except ValueError as e:
        logger.error(f"Erreur envoi topic (validation): {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur'}), 500
    except Exception as e:
        logger.error(f"Erreur envoi topic: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur'}), 500
