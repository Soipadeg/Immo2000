"""
Service pour les notifications utilisateur.

Encapsule la logique métier pour la création, gestion et envoi de notifications.
"""

from src.models import Notification, NotificationType
from src.crud import notifications as crud_notifications
from src.services.email import get_email_service
import logging

logger = logging.getLogger(__name__)


def notify_user(user_id, notification_type, title, message, related_entity_type=None, related_entity_id=None, action_url=None, icon=None, send_email=False, user_email=None):
    """
    Créer une notification pour un utilisateur.

    Args:
        user_id (int): ID de l'utilisateur destinataire
        notification_type (NotificationType): Type de notification
        title (str): Titre
        message (str): Corps du message
        related_entity_type (str, optional): Type d'entité liée
        related_entity_id (int, optional): ID de l'entité liée
        action_url (str, optional): URL d'action
        icon (str, optional): Icon/emoji
        send_email (bool): Envoyer également un email
        user_email (str, optional): Email de l'utilisateur (requis si send_email=True)

    Returns:
        Notification: L'objet notification créé
    """
    try:
        # Créer la notification
        notification = crud_notifications.create_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            action_url=action_url,
            icon=icon
        )

        # Envoyer un email si demandé
        if send_email and user_email:
            send_notification_email(user_email, title, message, action_url)

        logger.info(f"Notification créée pour user {user_id}: {notification_type}")
        return notification

    except Exception as e:
        logger.error(f"Erreur lors de la création de la notification: {str(e)}")
        raise


def send_notification_email(user_email, title, message, action_url=None):
    """
    Envoyer un email de notification.

    Args:
        user_email (str): Email du destinataire
        title (str): Titre
        message (str): Corps du message
        action_url (str, optional): URL pour l'action

    Returns:
        bool: True si envoyé avec succès
    """
    try:
        email_service = get_email_service()

        subject = f"Immo2000 - {title}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>{title}</h2>
                <p>{message}</p>
                {f'<p><a href="{action_url}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Voir plus</a></p>' if action_url else ''}
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                    Vous avez reçu cette notification de Immo2000.
                </p>
            </body>
        </html>
        """

        text_content = f"""
        {title}

        {message}

        {f"Voir plus: {action_url}" if action_url else ""}

        ---
        Vous avez reçu cette notification de Immo2000.
        """

        success = email_service.send_email(
            to_email=user_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )

        if success:
            logger.info(f"Email de notification envoyé à {user_email}")
        else:
            logger.warning(f"Échec de l'envoi de l'email de notification à {user_email}")

        return success

    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return False


def notify_on_new_annonce(utilisateur_id, annonce_title, annonce_id):
    """
    Notifier un utilisateur qu'une nouvelle annonce a été créée (pour les alertes).

    Args:
        utilisateur_id (int): ID de l'utilisateur
        annonce_title (str): Titre de l'annonce
        annonce_id (int): ID de l'annonce
    """
    try:
        title = "Nouvelle annonce correspondant à vos critères"
        message = f"Une nouvelle annonce '{annonce_title}' correspond à une de vos alertes."
        action_url = f"/annonces/{annonce_id}"

        notify_user(
            user_id=utilisateur_id,
            notification_type=NotificationType.ALERTE_MATCHED,
            title=title,
            message=message,
            related_entity_type="annonce",
            related_entity_id=annonce_id,
            action_url=action_url,
            icon="🏠"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la notification d'alerte: {str(e)}")


def notify_on_offer_received(utilisateur_id, offer_id, buyer_name):
    """
    Notifier un utilisateur qu'il a reçu une offre d'achat.

    Args:
        utilisateur_id (int): ID de l'utilisateur
        offer_id (int): ID de l'offre
        buyer_name (str): Nom de l'acheteur
    """
    try:
        title = "Nouvelle offre d'achat reçue"
        message = f"{buyer_name} a soumis une offre d'achat pour votre bien."
        action_url = f"/offres/{offer_id}"

        notify_user(
            user_id=utilisateur_id,
            notification_type=NotificationType.OFFER_RECEIVED,
            title=title,
            message=message,
            related_entity_type="offre",
            related_entity_id=offer_id,
            action_url=action_url,
            icon="📋"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la notification d'offre: {str(e)}")


def notify_on_message_received(utilisateur_id, message_id, sender_name):
    """
    Notifier un utilisateur qu'il a reçu un message.

    Args:
        utilisateur_id (int): ID de l'utilisateur
        message_id (int): ID du message
        sender_name (str): Nom de l'expéditeur
    """
    try:
        title = "Nouveau message reçu"
        message = f"{sender_name} vous a envoyé un message."
        action_url = f"/messages/{message_id}"

        notify_user(
            user_id=utilisateur_id,
            notification_type=NotificationType.MESSAGE_RECEIVED,
            title=title,
            message=message,
            related_entity_type="message",
            related_entity_id=message_id,
            action_url=action_url,
            icon="💬"
        )
    except Exception as e:
        logger.error(f"Erreur lors de la notification de message: {str(e)}")


def get_user_notifications_summary(user_id):
    """
    Récupérer un résumé des notifications d'un utilisateur.

    Args:
        user_id (int): ID de l'utilisateur

    Returns:
        dict: Résumé avec count total et unread count
    """
    try:
        total = Notification.query.filter_by(user_id=user_id).count()
        unread = crud_notifications.get_unread_count(user_id)

        return {
            "total": total,
            "unread": unread,
            "has_unread": unread > 0
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du résumé: {str(e)}")
        return {"total": 0, "unread": 0, "has_unread": False}
