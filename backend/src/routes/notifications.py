"""
Routes Flask pour les notifications utilisateur.

Endpoints:
- GET /api/v1/notifications → Lister les notifications (pagination)
- GET /api/v1/notifications/unread → Compter les notifications non lues
- PATCH /api/v1/notifications/{id}/mark-as-read → Marquer comme lue
- DELETE /api/v1/notifications/{id} → Supprimer une notification
- POST /api/v1/notifications/test → Tester la configuration SMTP
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from src.auth.models import db
from src.models import Notification
from src.auth.decorators import token_required
from src.services.email import get_email_service, EmailError

logger = logging.getLogger(__name__)

# Blueprint
notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")


@notifications_bp.route("", methods=["GET"])
@token_required
def list_notifications(current_user):
    """
    GET /api/v1/notifications
    Lister les notifications de l'utilisateur avec pagination.

    Query parameters:
        skip (int, default=0): Nombre de notifications à sauter
        limit (int, default=20): Nombre de notifications à retourner

    Returns:
        200 OK: {
            "success": true,
            "data": [
                {
                    "notification_id": 1,
                    "type": "message_received",
                    "title": "Nouveau message",
                    "message": "Vous avez reçu un nouveau message",
                    "is_read": false,
                    "created_at": "2024-01-15T10:30:00",
                    "read_at": null,
                    ...
                }
            ],
            "pagination": {
                "skip": 0,
                "limit": 20,
                "total": 42
            }
        }
    """
    try:
        skip = max(0, int(request.args.get("skip", 0)))
        limit = min(100, int(request.args.get("limit", 20)))

        # Récupérer les notifications de l'utilisateur
        total = Notification.query.filter_by(user_id=current_user["user_id"]).count()

        notifications = Notification.query.filter_by(
            user_id=current_user["user_id"]
        ).order_by(
            Notification.created_at.desc()
        ).offset(skip).limit(limit).all()

        return jsonify({
            "success": True,
            "data": [n.to_dict() for n in notifications],
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": total
            }
        }), 200

    except Exception as e:
        logger.error(f"Erreur lors de la récupération des notifications: {str(e)}")
        return jsonify({
            "error": "Erreur serveur",
            "code": 500,
            "details": str(e)
        }), 500


@notifications_bp.route("/unread", methods=["GET"])
@token_required
def get_unread_count(current_user):
    """
    GET /api/v1/notifications/unread
    Compter le nombre de notifications non lues.

    Returns:
        200 OK: {
            "success": true,
            "unread_count": 5,
            "has_unread": true
        }
    """
    try:
        unread_count = Notification.query.filter_by(
            user_id=current_user["user_id"],
            is_read=False
        ).count()

        return jsonify({
            "success": True,
            "unread_count": unread_count,
            "has_unread": unread_count > 0
        }), 200

    except Exception as e:
        logger.error(f"Erreur lors du comptage des notifications: {str(e)}")
        return jsonify({
            "error": "Erreur serveur",
            "code": 500,
            "details": str(e)
        }), 500


@notifications_bp.route("/<int:notification_id>/mark-as-read", methods=["PATCH"])
@token_required
def mark_as_read(current_user, notification_id):
    """
    PATCH /api/v1/notifications/{notification_id}/mark-as-read
    Marquer une notification comme lue.

    Returns:
        200 OK: Notification mise à jour
        404 Not Found: Notification introuvable
    """
    try:
        notification = Notification.query.filter_by(
            notification_id=notification_id,
            user_id=current_user["user_id"]
        ).first()

        if not notification:
            return jsonify({
                "error": "Notification introuvable",
                "code": 404
            }), 404

        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.session.commit()

        logger.info(f"Notification {notification_id} marquée comme lue par user {current_user["user_id"]}")

        return jsonify({
            "success": True,
            "message": "Notification marquée comme lue",
            "data": notification.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur lors du marquage de la notification: {str(e)}")
        return jsonify({
            "error": "Erreur serveur",
            "code": 500,
            "details": str(e)
        }), 500


@notifications_bp.route("/<int:notification_id>", methods=["DELETE"])
@token_required
def delete_notification(current_user, notification_id):
    """
    DELETE /api/v1/notifications/{notification_id}
    Supprimer une notification.

    Returns:
        200 OK: Notification supprimée
        404 Not Found: Notification introuvable
    """
    try:
        notification = Notification.query.filter_by(
            notification_id=notification_id,
            user_id=current_user["user_id"]
        ).first()

        if not notification:
            return jsonify({
                "error": "Notification introuvable",
                "code": 404
            }), 404

        db.session.delete(notification)
        db.session.commit()

        logger.info(f"Notification {notification_id} supprimée par user {current_user["user_id"]}")

        return jsonify({
            "success": True,
            "message": "Notification supprimée"
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur lors de la suppression de la notification: {str(e)}")
        return jsonify({
            "error": "Erreur serveur",
            "code": 500,
            "details": str(e)
        }), 500



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
