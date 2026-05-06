"""
Routes Flask pour le chatbot Immo2000.

Endpoint principal:
- POST /api/v1/chat → Envoyer un message et recevoir une réponse + actions

Pour Gilbert: Ce endpoint accepte un message utilisateur et retourne une réponse
du chatbot avec les actions suggérées (liens vers les fonctionnalités principales).
"""

from flask import Blueprint, request, jsonify
from src.services.chatbot import get_chatbot_service

# Blueprint
chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api/v1/chat")


@chatbot_bp.route("", methods=["POST"])
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
    try:
        # Récupérer les données
        data = request.get_json() or {}
        message = data.get("message", "").strip()
        session_id = data.get("session_id")
        user_id = data.get("user_id")

        if not message:
            return (
                jsonify(
                    {
                        "status": "error",
                        "error": "Le champ 'message' est requis.",
                    }
                ),
                400,
            )

        # Générer la réponse du chatbot
        chatbot = get_chatbot_service()
        response = chatbot.generate_response(
            user_message=message, session_id=session_id, user_id=user_id
        )

        return (
            jsonify(
                {
                    "status": "success",
                    "data": response,
                }
            ),
            200,
        )

    except Exception as e:
        return (
            jsonify(
                {
                    "status": "error",
                    "error": f"Erreur interne: {str(e)}",
                }
            ),
            500,
        )


@chatbot_bp.route("/health", methods=["GET"])
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
    try:
        chatbot = get_chatbot_service()
        return (
            jsonify(
                {
                    "status": "ok",
                    "message": "Chatbot is running",
                    "intents_loaded": len(chatbot.intents),
                }
            ),
            200,
        )
    except Exception as e:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"Chatbot health check failed: {str(e)}",
                }
            ),
            500,
        )
