"""
Routes Flask pour le chatbot Immo2000.

Endpoint principal:
- POST /api/v1/chat → Envoyer un message et recevoir une réponse + actions

Pour Gilbert: Ce endpoint accepte un message utilisateur et retourne une réponse
du chatbot avec les actions suggérées (liens vers les fonctionnalités principales).
"""

from flask import Blueprint, request, jsonify
from src.services.chatbot import get_chatbot_service
from src.decorators.error_handling import handle_errors, ValidationError

# Blueprint
chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api/v1/chat")


@chatbot_bp.route("", methods=["POST"])
@handle_errors()
def chat():
    """
    POST /api/v1/chat
    Envoyer un message au chatbot et recevoir une réponse.

    Request body:
    {
        "message": "Comment estimer mon bien ?",
        "session_id": "abc123",  // Optionnel
        "user_id": 1             // Optionnel
    }

    Response:
    {
        "status": "success",
        "data": {
            "reponse": "Vous pouvez estimer votre bien en utilisant notre outil...",
            "intent": "estimation_prix",
            "actions": [
                {"type": "link", "text": "Estimer mon bien", "url": "/simulateur-pret"}
            ],
            "session_id": "abc123",
            "confidence": 0.75,
            "timestamp": "2026-05-06T10:30:00.000000"
        }
    }
    """
    # Récupérer les données
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    session_id = data.get("session_id")
    user_id = data.get("user_id")

    if not message:
        raise ValidationError("Le champ 'message' est requis.")

    # Générer la réponse du chatbot
    chatbot = get_chatbot_service()
    response = chatbot.generate_response(
        user_message=message, session_id=session_id, user_id=user_id
    )

    return {
        "status": "success",
        "data": response,
    }, 200


@chatbot_bp.route("/health", methods=["GET"])
@handle_errors()
def health():
    """
    GET /api/v1/chat/health
    Vérifier que le chatbot est opérationnel.

    Response:
    {
        "status": "ok",
        "message": "Chatbot is running",
        "intents_loaded": 5
    }
    """
    chatbot = get_chatbot_service()
    return {
        "status": "ok",
        "message": "Chatbot is running",
        "intents_loaded": len(chatbot.intents),
    }, 200
