"""
Routes Flask pour les notifications et tests d'email.

Endpoints:
- POST /api/v1/notifications/test → Tester la configuration SMTP
"""

from flask import Blueprint, request, jsonify
import logging

from src.services.email import get_email_service, EmailError

logger = logging.getLogger(__name__)

# Blueprint
notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")


@notifications_bp.route("/test", methods=["POST"])
def test_email_endpoint():
    """
    POST /api/v1/notifications/test
    Tester la configuration SMTP en envoyant un email de test.

    Request body:
        {
            "email": "test@example.com",      (requis)
            "name": "John Doe"                 (requis)
        }

    Returns:
        200 OK: {"success": true, "message": "Email de test envoyé"}
        400 Bad Request: Champs manquants ou email invalide
        500 Internal Server Error: Erreur SMTP
    """
    try:
        # Valider les données
        data = request.get_json() or {}
        email = data.get("email", "").strip()
        name = data.get("name", "").strip()

        if not email or not name:
            return jsonify({
                "error": "Champs manquants",
                "code": 400,
                "details": "Les champs 'email' et 'name' sont requis"
            }), 400

        # Valider le format email (simple)
        if "@" not in email or "." not in email:
            return jsonify({
                "error": "Email invalide",
                "code": 400,
                "details": f"'{email}' n'est pas une adresse email valide"
            }), 400

        # Envoyer l'email de test
        email_service = get_email_service()

        subject = "📧 Email de test - Immo2000"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Email de test</h2>

                <p>Bonjour {name},</p>

                <p>Cet email confirme que votre configuration SMTP pour Immo2000 fonctionne correctement.</p>

                <p><strong>Informations du test:</strong></p>
                <ul>
                    <li>Email reçu par: {email}</li>
                    <li>Heure d'envoi: {__import__('datetime').datetime.now().isoformat()}</li>
                    <li>Type de notification: Email de test</li>
                </ul>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                <p style="color: #666; font-size: 12px;">
                    Si vous recevez cet email, la configuration est correcte!
                </p>
            </body>
        </html>
        """

        text_content = f"""
        Email de test - Immo2000

        Bonjour {name},

        Cet email confirme que votre configuration SMTP fonctionne correctement.

        Email reçu par: {email}
        Heure d'envoi: {__import__('datetime').datetime.now().isoformat()}

        Si vous recevez cet email, la configuration est correcte!
        """

        success = email_service.send_email(
            to_email=email,
            to_name=name,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )

        if success:
            logger.info(f"Email de test envoyé avec succès à {email}")
            return jsonify({
                "success": True,
                "message": f"Email de test envoyé à {email}",
                "email": email,
                "timestamp": __import__('datetime').datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                "error": "Erreur d'envoi",
                "code": 500,
                "details": "L'email n'a pas pu être envoyé. Vérifiez les logs."
            }), 500

    except EmailError as e:
        logger.error(f"Erreur email: {str(e)}")
        return jsonify({
            "error": "Erreur SMTP",
            "code": 500,
            "details": str(e)
        }), 500
    except Exception as e:
        logger.error(f"Erreur inattendue: {str(e)}")
        return jsonify({
            "error": "Erreur inattendue",
            "code": 500,
            "details": str(e)
        }), 500


@notifications_bp.route("/health", methods=["GET"])
def health_check():
    """
    GET /api/v1/notifications/health
    Vérifier que le service de notifications est actif.

    Returns:
        200 OK: Service actif
    """
    return jsonify({
        "status": "ok",
        "service": "notifications",
        "timestamp": __import__('datetime').datetime.now().isoformat()
    }), 200
