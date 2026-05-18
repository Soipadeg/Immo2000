"""
Routes Flask pour les messages (messagerie P2P).

Endpoints :
- POST   /api/v1/messages                      → Envoyer un message (JWT required)
- GET    /api/v1/messages                      → Lister les messages de l'utilisateur (JWT required)
- GET    /api/v1/messages/{message_id}         → Récupérer un message (JWT required)
- PUT    /api/v1/messages/{message_id}/read    → Marquer comme lu (JWT required)
- DELETE /api/v1/messages/{message_id}         → Supprimer un message (JWT required)
"""

from flask import Blueprint, request, jsonify
from typing import Dict, Any, Tuple, Optional, List
from src.auth.models import db, User
from src.auth.decorators import token_required
from src.models.messages import Message
from src.models.annonces import Annonce
from src.schemas.messages import (
    CreateMessage,
    MessageResponse,
    MessageDetailResponse,
    MessageListResponse,
    ErrorResponse,
)
from src.crud.messages import (
    send_message,
    get_message,
    list_messages,
    mark_message_as_read,
    delete_message,
    MessageNotFoundError,
    MessageUnauthorizedError,
)
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from pydantic import ValidationError as PydanticValidationError

# Blueprint
messages_bp = Blueprint("messages", __name__, url_prefix="/api/v1/messages")


@messages_bp.route("", methods=["POST"])
@token_required
@handle_errors()
def send_message_endpoint(current_user: User) -> Tuple[Dict[str, Any], int]:
    """
    POST /api/v1/messages
    Envoyer un message (JWT required).

    Request body: CreateMessage (Pydantic validated)
    {
        "receiver_id": 2,
        "annonce_id": 1,
        "contenu": "Bonjour, je suis intéressé..."
    }

    Returns:
        201 Created + MessageResponse
        400 Bad Request (validation error)
        401 Unauthorized (no JWT)
        404 Not Found (receiver ou annonce non trouvé)
    """
    # Valider les données avec Pydantic
    data = request.get_json()
    try:
        message_data = CreateMessage(**data)
    except PydanticValidationError as e:
        # Convertir les erreurs Pydantic
        errors = []
        for err in e.errors():
            errors.append({
                "field": ".".join(str(x) for x in err.get("loc", [])),
                "type": err.get("type"),
                "msg": err.get("msg")
            })
        raise ValidationError(f"Validation error: {errors}")

    # Envoyer le message
    message = send_message(
        db.session,
        sender_id=current_user["user_id"],
        receiver_id=message_data.receiver_id,
        annonce_id=message_data.annonce_id,
        contenu=message_data.contenu
    )

    # Répondre avec le schéma de réponse
    response = MessageResponse.from_orm(message)
    return {"data": response.dict()}, 201


@messages_bp.route("", methods=["GET"])
@token_required
@handle_errors()
def list_messages_endpoint(current_user: User) -> Dict[str, Any]:
    """
    GET /api/v1/messages?folder=inbox&skip=0&limit=20
    Lister les messages de l'utilisateur (JWT required).

    Query parameters:
        folder (str): Type de dossier ('inbox', 'sent', 'all') - default: 'inbox'
        skip (int): Nombre de résultats à ignorer (default: 0)
        limit (int): Limite de résultats (default: 20, max: 100)

    Returns:
        200 OK + MessageListResponse
        401 Unauthorized (no JWT)
    """
    # Récupérer les paramètres
    folder = request.args.get("folder", "inbox")
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 20, type=int)

    # Limiter le max
    if limit > 100:
        limit = 100

    # Récupérer les messages
    messages, total = list_messages(
        db.session,
        user_id=current_user["user_id"],
        folder=folder,
        skip=skip,
        limit=limit
    )

    # Convertir en réponse détaillée avec infos des utilisateurs
    message_responses = []
    for msg in messages:
        sender = db.session.query(User).filter(User.utilisateur_id == msg.sender_id).first()
        receiver = db.session.query(User).filter(User.utilisateur_id == msg.receiver_id).first()
        annonce = db.session.query(Annonce).filter(Annonce.annonce_id == msg.annonce_id).first()

        msg_detail = MessageDetailResponse.from_orm_with_details(msg, sender, receiver, annonce)
        message_responses.append(msg_detail)

    # Répondre avec le schéma de liste
    response = MessageListResponse(
        messages=message_responses,
        total=total,
        skip=skip,
        limit=limit
    )
    return {"data": response.dict()}


@messages_bp.route("/<int:message_id>", methods=["GET"])
@token_required
@handle_errors()
def get_message_endpoint(current_user: User, message_id: int) -> Dict[str, Any]:
    """
    GET /api/v1/messages/{message_id}
    Récupérer un message (JWT required).

    Returns:
        200 OK + MessageDetailResponse
        401 Unauthorized (no JWT)
        403 Forbidden (utilisateur n'a pas accès)
        404 Not Found (message n'existe pas)
    """
    try:
        message = get_message(db.session, message_id, current_user["user_id"])
    except MessageNotFoundError:
        raise NotFoundError("Message not found")
    except MessageUnauthorizedError:
        raise ForbiddenError("Unauthorized access to this message")

    # Récupérer les détails
    sender = db.session.query(User).filter(User.utilisateur_id == message.sender_id).first()
    receiver = db.session.query(User).filter(User.utilisateur_id == message.receiver_id).first()
    annonce = db.session.query(Annonce).filter(Annonce.annonce_id == message.annonce_id).first()

    response = MessageDetailResponse.from_orm_with_details(message, sender, receiver, annonce)
    return {"data": response.dict()}


@messages_bp.route("/<int:message_id>/read", methods=["PUT"])
@token_required
@handle_errors()
def mark_as_read_endpoint(current_user: User, message_id: int) -> Tuple[Dict[str, Any], int]:
    """
    PUT /api/v1/messages/{message_id}/read
    Marquer un message comme lu (JWT required).

    Returns:
        200 OK + MessageResponse
        401 Unauthorized (no JWT)
        403 Forbidden (utilisateur n'est pas le destinataire)
        404 Not Found (message n'existe pas)
    """
    try:
        message = mark_message_as_read(db.session, message_id, current_user["user_id"])
    except MessageNotFoundError:
        raise NotFoundError("Message not found")
    except MessageUnauthorizedError:
        raise ForbiddenError("Only the receiver can mark as read")

    response = MessageResponse.from_orm(message)
    return {"data": response.dict()}


@messages_bp.route("/<int:message_id>", methods=["DELETE"])
@token_required
@handle_errors()
def delete_message_endpoint(current_user: User, message_id: int) -> Tuple[Dict[str, Any], int]:
    """
    DELETE /api/v1/messages/{message_id}
    Supprimer un message (soft delete) (JWT required).

    Returns:
        204 No Content
        401 Unauthorized (no JWT)
        403 Forbidden (utilisateur n'a pas accès)
        404 Not Found (message n'existe pas)
    """
    try:
        delete_message(db.session, message_id, current_user["user_id"])
    except MessageNotFoundError:
        raise NotFoundError("Message not found")
    except MessageUnauthorizedError:
        raise ForbiddenError("Unauthorized access to this message")

    return "", 204
