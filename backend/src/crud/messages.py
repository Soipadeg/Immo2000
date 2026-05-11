"""
Opérations CRUD pour les messages.

Fournit les fonctions de logique métier :
- send_message()
- get_message()
- list_messages()
- mark_message_as_read()
- delete_message()
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from src.models.messages import Message
from src.models.annonces import Annonce
from src.auth.models import User
from src.schemas.messages import CreateMessage


class MessageNotFoundError(Exception):
    """Exception levée quand un message n'existe pas."""
    pass


class MessageUnauthorizedError(Exception):
    """Exception levée quand l'utilisateur n'est pas autorisé."""
    pass


def send_message(
    db: Session,
    sender_id: int,
    receiver_id: int,
    annonce_id: int,
    contenu: str
) -> Message:
    """
    Envoyer un message.

    Args:
        db: Session SQLAlchemy
        sender_id: ID de l'expéditeur
        receiver_id: ID du destinataire
        annonce_id: ID de l'annonce concernée
        contenu: Contenu du message

    Returns:
        Message créé

    Raises:
        ValueError: Si les données sont invalides
    """
    # Valider les données
    if not contenu or len(contenu.strip()) == 0:
        raise ValueError("Le contenu du message ne peut pas être vide")

    if len(contenu) > 2000:
        raise ValueError("Le message ne peut pas dépasser 2000 caractères")

    if sender_id == receiver_id:
        raise ValueError("Vous ne pouvez pas vous envoyer un message à vous-même")

    # Vérifier que l'expéditeur existe
    sender = db.query(User).filter(User.utilisateur_id == sender_id).first()
    if not sender:
        raise ValueError("Utilisateur expéditeur non trouvé")

    # Vérifier que le destinataire existe
    receiver = db.query(User).filter(User.utilisateur_id == receiver_id).first()
    if not receiver:
        raise ValueError("Utilisateur destinataire non trouvé")

    # Vérifier que l'annonce existe
    annonce = db.query(Annonce).filter(Annonce.annonce_id == annonce_id).first()
    if not annonce:
        raise ValueError("Annonce non trouvée")

    # Créer le message
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        annonce_id=annonce_id,
        contenu=contenu.strip(),
        date_creation=datetime.utcnow()
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


def get_message(db: Session, message_id: int, user_id: int) -> Message:
    """
    Récupérer un message.

    Args:
        db: Session SQLAlchemy
        message_id: ID du message
        user_id: ID de l'utilisateur (pour vérifier l'accès)

    Returns:
        Message

    Raises:
        MessageNotFoundError: Si le message n'existe pas
        MessageUnauthorizedError: Si l'utilisateur n'a pas accès
    """
    message = db.query(Message).filter(Message.message_id == message_id).first()

    if not message:
        raise MessageNotFoundError(f"Message {message_id} non trouvé")

    # Vérifier que l'utilisateur est l'expéditeur ou le destinataire
    if message.sender_id != user_id and message.receiver_id != user_id:
        raise MessageUnauthorizedError("Vous n'avez pas accès à ce message")

    return message


def list_messages(
    db: Session,
    user_id: int,
    folder: str = "inbox",
    skip: int = 0,
    limit: int = 20
) -> tuple[List[Message], int]:
    """
    Lister les messages d'un utilisateur.

    Args:
        db: Session SQLAlchemy
        user_id: ID de l'utilisateur
        folder: Type de dossier ('inbox', 'sent', 'all')
        skip: Nombre de résultats à ignorer
        limit: Limite de résultats

    Returns:
        Tuple (liste des messages, total)
    """
    if folder == "inbox":
        query = db.query(Message).filter(
            and_(
                Message.receiver_id == user_id,
                Message.supprime_par_destinataire == False
            )
        )
    elif folder == "sent":
        query = db.query(Message).filter(
            and_(
                Message.sender_id == user_id,
                Message.supprime_par_expediteur == False
            )
        )
    else:  # "all"
        query = db.query(Message).filter(
            or_(
                and_(
                    Message.receiver_id == user_id,
                    Message.supprime_par_destinataire == False
                ),
                and_(
                    Message.sender_id == user_id,
                    Message.supprime_par_expediteur == False
                )
            )
        )

    # Compter le total
    total = query.count()

    # Trier par date (plus récent d'abord)
    messages = query.order_by(Message.date_creation.desc()).offset(skip).limit(limit).all()

    return messages, total


def mark_message_as_read(db: Session, message_id: int, user_id: int) -> Message:
    """
    Marquer un message comme lu.

    Args:
        db: Session SQLAlchemy
        message_id: ID du message
        user_id: ID de l'utilisateur (doit être le destinataire)

    Returns:
        Message mis à jour

    Raises:
        MessageNotFoundError: Si le message n'existe pas
        MessageUnauthorizedError: Si l'utilisateur n'est pas le destinataire
    """
    message = db.query(Message).filter(Message.message_id == message_id).first()

    if not message:
        raise MessageNotFoundError(f"Message {message_id} non trouvé")

    if message.receiver_id != user_id:
        raise MessageUnauthorizedError("Seul le destinataire peut marquer le message comme lu")

    message.mark_as_read()
    db.commit()
    db.refresh(message)

    return message


def delete_message(db: Session, message_id: int, user_id: int) -> None:
    """
    Supprimer un message (soft delete pour une partie).

    Args:
        db: Session SQLAlchemy
        message_id: ID du message
        user_id: ID de l'utilisateur

    Raises:
        MessageNotFoundError: Si le message n'existe pas
        MessageUnauthorizedError: Si l'utilisateur n'a pas accès
    """
    message = db.query(Message).filter(Message.message_id == message_id).first()

    if not message:
        raise MessageNotFoundError(f"Message {message_id} non trouvé")

    if message.sender_id == user_id:
        message.supprime_par_expediteur = True
    elif message.receiver_id == user_id:
        message.supprime_par_destinataire = True
    else:
        raise MessageUnauthorizedError("Vous n'avez pas accès à ce message")

    # Si le message est supprimé des deux côtés, le supprimer vraiment
    if message.supprime_par_expediteur and message.supprime_par_destinataire:
        db.delete(message)

    db.commit()
