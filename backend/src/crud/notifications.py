"""
CRUD operations pour les notifications.
"""

from src.auth.models import db
from src.models import Notification, NotificationType
from datetime import datetime


def create_notification(user_id, notification_type, title, message, related_entity_type=None, related_entity_id=None, action_url=None, icon=None):
    """
    Créer une nouvelle notification.

    Args:
        user_id (int): ID de l'utilisateur
        notification_type (NotificationType): Type de notification
        title (str): Titre
        message (str): Corps du message
        related_entity_type (str, optional): Type d'entité liée
        related_entity_id (int, optional): ID de l'entité liée
        action_url (str, optional): URL d'action
        icon (str, optional): Icon/emoji

    Returns:
        Notification: L'objet notification créé
    """
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        action_url=action_url,
        icon=icon
    )
    db.session.add(notification)
    db.session.commit()
    return notification


def get_notification_by_id(notification_id, user_id=None):
    """
    Récupérer une notification par son ID.

    Args:
        notification_id (int): ID de la notification
        user_id (int, optional): ID de l'utilisateur (pour vérifier la propriété)

    Returns:
        Notification or None
    """
    query = Notification.query.filter_by(notification_id=notification_id)
    if user_id:
        query = query.filter_by(user_id=user_id)
    return query.first()


def get_user_notifications(user_id, skip=0, limit=20, only_unread=False):
    """
    Récupérer les notifications d'un utilisateur.

    Args:
        user_id (int): ID de l'utilisateur
        skip (int): Nombre de notifications à sauter
        limit (int): Limite de notifications à retourner
        only_unread (bool): Retourner seulement les non lues

    Returns:
        tuple: (notifications list, total count)
    """
    query = Notification.query.filter_by(user_id=user_id)

    if only_unread:
        query = query.filter_by(is_read=False)

    total = query.count()
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    return notifications, total


def get_unread_count(user_id):
    """
    Compter les notifications non lues d'un utilisateur.

    Args:
        user_id (int): ID de l'utilisateur

    Returns:
        int: Nombre de notifications non lues
    """
    return Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()


def mark_as_read(notification_id, user_id=None):
    """
    Marquer une notification comme lue.

    Args:
        notification_id (int): ID de la notification
        user_id (int, optional): ID de l'utilisateur (pour vérifier la propriété)

    Returns:
        Notification: L'objet notification mis à jour
    """
    notification = get_notification_by_id(notification_id, user_id)
    if not notification:
        return None

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.session.commit()
    return notification


def mark_all_as_read(user_id):
    """
    Marquer toutes les notifications d'un utilisateur comme lues.

    Args:
        user_id (int): ID de l'utilisateur

    Returns:
        int: Nombre de notifications marquées comme lues
    """
    count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).update({Notification.is_read: True, Notification.read_at: datetime.utcnow()})
    db.session.commit()
    return count


def delete_notification(notification_id, user_id=None):
    """
    Supprimer une notification.

    Args:
        notification_id (int): ID de la notification
        user_id (int, optional): ID de l'utilisateur (pour vérifier la propriété)

    Returns:
        bool: True si suppression réussie, False sinon
    """
    notification = get_notification_by_id(notification_id, user_id)
    if not notification:
        return False

    db.session.delete(notification)
    db.session.commit()
    return True


def delete_all_for_user(user_id):
    """
    Supprimer toutes les notifications d'un utilisateur.

    Args:
        user_id (int): ID de l'utilisateur

    Returns:
        int: Nombre de notifications supprimées
    """
    count = Notification.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return count


def get_notifications_by_type(user_id, notification_type, skip=0, limit=20):
    """
    Récupérer les notifications d'un type spécifique.

    Args:
        user_id (int): ID de l'utilisateur
        notification_type (NotificationType): Type de notification
        skip (int): Nombre à sauter
        limit (int): Limite

    Returns:
        tuple: (notifications list, total count)
    """
    query = Notification.query.filter_by(
        user_id=user_id,
        type=notification_type
    )
    total = query.count()
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications, total
