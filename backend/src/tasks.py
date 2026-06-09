"""
Tâches asynchrones Celery pour les opérations longues
- Envoi d'emails
- Génération de PDF
- Upload de fichiers
- Notifications
"""

import os
from celery import Celery
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Configuration Celery basique (sera initialisée dans app/__init__.py)
celery_app = Celery(
    'immo2000',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Paris',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)


# ==================== TÂCHES EMAIL ====================

@celery_app.task(bind=True, max_retries=3)
def send_email_async(self, to, subject, html_body, text_body=None, attachments=None):
    """
    Envoyer un email de manière asynchrone.

    Args:
        to: Email destinataire (str ou list)
        subject: Sujet de l'email
        html_body: Corps HTML de l'email
        text_body: Corps texte (optionnel)
        attachments: Liste des fichiers à joindre (optionnel)
    """
    try:
        from src.utils.email import send_email

        send_email(
            to=to,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            attachments=attachments
        )
        logger.info(f"Email envoyé à {to}")
        return {'status': 'success', 'to': to}

    except ValueError as exc:
        logger.error(f"Erreur envoi email (paramètres invalides): {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=60)
    except Exception as exc:
        logger.error(f"Erreur envoi email: {str(exc)}", exc_info=True)
        # Retry avec backoff exponentiel
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@celery_app.task
def send_notification_email(user_id, notification_type, data):
    """
    Envoyer une notification email à un utilisateur.

    Args:
        user_id: ID de l'utilisateur
        notification_type: Type de notification (nouvelle_offre, rappel, etc.)
        data: Données pour remplir le template
    """
    try:
        from src.auth.models import User
        from flask import render_template

        user = User.query.get(user_id)
        if not user:
            return {'status': 'error', 'message': 'Utilisateur non trouvé'}

        # Mapper les types de notification aux templates
        templates = {
            'nouvelle_offre': 'emails/nouvelle_offre.html',
            'offre_acceptee': 'emails/offre_acceptee.html',
            'rappel_signature': 'emails/rappel_signature.html',
            'transaction_completee': 'emails/transaction_completee.html',
        }

        template = templates.get(notification_type)
        if not template:
            return {'status': 'error', 'message': f'Type de notification inconnu: {notification_type}'}

        # Générer le corps HTML
        html_body = render_template(template, user=user, **data)

        # Envoyer l'email
        send_email_async.delay(
            to=user.email,
            subject=data.get('subject', f'Notification Immo2000 - {notification_type}'),
            html_body=html_body
        )

        return {'status': 'success', 'user_id': user_id}

    except ValueError as exc:
        logger.error(f"Erreur notification email (utilisateur introuvable): {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': 'Utilisateur introuvable'}
    except Exception as exc:
        logger.error(f"Erreur notification email: {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': str(exc)}


# ==================== TÂCHES GÉNÉRATION PDF ====================

@celery_app.task(bind=True, max_retries=3)
def generate_pdf_async(self, template_name, data, filename=None):
    """
    Générer un PDF de manière asynchrone.

    Args:
        template_name: Nom du template à utiliser
        data: Données pour remplir le template
        filename: Nom du fichier PDF (optionnel)

    Returns:
        Chemin du fichier PDF généré
    """
    try:
        from src.utils.pdf import generate_pdf

        pdf_path = generate_pdf(template_name, data, filename)
        logger.info(f"PDF généré: {pdf_path}")
        return {'status': 'success', 'pdf_path': pdf_path}

    except ValueError as exc:
        logger.error(f"Erreur génération PDF (template introuvable): {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=10)
    except Exception as exc:
        logger.error(f"Erreur génération PDF: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(bind=True, max_retries=3)
def generate_compromis_pdf(self, transaction_id):
    """
    Générer le compromis de vente pour une transaction.

    Args:
        transaction_id: ID de la transaction

    Returns:
        URL du PDF généralisé et uploadé
    """
    try:
        from src.auth.models import Transaction
        from src.utils.pdf import generate_pdf
        from src.utils.aws import upload_to_s3

        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return {'status': 'error', 'message': 'Transaction non trouvée'}

        # Générer le PDF
        template_data = {
            'seller': transaction.seller,
            'buyer': transaction.buyer,
            'listing': transaction.listing,
            'offer': transaction.offer,
            'generated_at': datetime.utcnow(),
        }

        pdf_path = generate_pdf('documents/compromis_vente.html', template_data,
                                f'compromis_{transaction_id}.pdf')

        # Uploader sur S3
        with open(pdf_path, 'rb') as f:
            s3_path = f"transactions/{transaction_id}/compromis.pdf"
            pdf_url = upload_to_s3(f.read(), s3_path)

        # Mettre à jour la transaction
        transaction.compromis_url = pdf_url
        from src.auth.models import db
        db.session.commit()

        logger.info(f"Compromis généré pour transaction {transaction_id}")
        return {'status': 'success', 'pdf_url': pdf_url}

    except ValueError as exc:
        logger.error(f"Erreur génération compromis (transaction introuvable): {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': 'Transaction introuvable'}
    except Exception as exc:
        logger.error(f"Erreur génération compromis: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=60)


# ==================== TÂCHES UPLOAD S3 ====================

@celery_app.task(bind=True, max_retries=3)
def upload_file_async(self, file_path, s3_key, delete_local=True):
    """
    Uploader un fichier vers S3 de manière asynchrone.

    Args:
        file_path: Chemin local du fichier
        s3_key: Clé S3 (chemin dans le bucket)
        delete_local: Supprimer le fichier local après upload

    Returns:
        URL publique du fichier
    """
    try:
        from src.utils.aws import upload_to_s3

        with open(file_path, 'rb') as f:
            file_content = f.read()

        s3_url = upload_to_s3(file_content, s3_key)

        # Supprimer le fichier local si demandé
        if delete_local and os.path.exists(file_path):
            os.remove(file_path)

        logger.info(f"Fichier uploadé vers S3: {s3_url}")
        return {'status': 'success', 's3_url': s3_url}

    except IOError as exc:
        logger.error(f"Erreur upload S3 (fichier introuvable): {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=10)
    except Exception as exc:
        logger.error(f"Erreur upload S3: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=30)


# ==================== TÂCHES DOCUSIGN ====================

@celery_app.task(bind=True, max_retries=3)
def send_to_docusign_async(self, transaction_id):
    """
    Envoyer un document à DocuSign pour signature asynchrone.

    Args:
        transaction_id: ID de la transaction

    Returns:
        ID de l'enveloppe DocuSign
    """
    try:
        from src.auth.models import Transaction
        from src.utils.docusign import send_to_docusign

        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return {'status': 'error', 'message': 'Transaction non trouvée'}

        # Envoyer à DocuSign
        envelope_id = send_to_docusign(transaction)

        # Mettre à jour la transaction
        transaction.docusign_envelope_id = envelope_id
        transaction.status = 'attente_signatures'
        from src.auth.models import db
        db.session.commit()

        logger.info(f"Transaction {transaction_id} envoyée à DocuSign: {envelope_id}")
        return {'status': 'success', 'envelope_id': envelope_id}

    except ValueError as exc:
        logger.error(f"Erreur DocuSign (transaction introuvable): {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': 'Transaction introuvable'}
    except Exception as exc:
        logger.error(f"Erreur DocuSign: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=60)


# ==================== TÂCHES NETTOYAGE ====================

@celery_app.task
def cleanup_old_files():
    """Nettoyer les fichiers temporaires anciens"""
    try:
        from pathlib import Path
        from datetime import timedelta

        temp_dir = Path('/tmp/immo2000')
        if not temp_dir.exists():
            return {'status': 'no_files'}

        now = datetime.utcnow()
        deleted_count = 0

        for file_path in temp_dir.glob('*'):
            if (now - datetime.fromtimestamp(file_path.stat().st_mtime)) > timedelta(days=7):
                file_path.unlink()
                deleted_count += 1

        logger.info(f"Nettoyage: {deleted_count} fichiers anciens supprimés")
        return {'status': 'success', 'deleted_files': deleted_count}

    except OSError as exc:
        logger.error(f"Erreur nettoyage (dossier introuvable): {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': 'Dossier temporaire introuvable'}
    except Exception as exc:
        logger.error(f"Erreur nettoyage: {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': str(exc)}


# ==================== TÂCHES NOTIFICATIONS ====================

@celery_app.task
def send_push_notification_async(user_id, title, body, data=None):
    """
    Envoyer une notification push à un utilisateur.

    Args:
        user_id: ID de l'utilisateur
        title: Titre de la notification
        body: Corps de la notification
        data: Données additionnelles (optionnel)
    """
    try:
        from src.auth.models import User
        from src.utils.fcm import send_push_notification

        user = User.query.get(user_id)
        if not user or not user.fcm_token:
            return {'status': 'error', 'message': 'Token FCM non disponible'}

        send_push_notification(
            device_token=user.fcm_token,
            title=title,
            body=body,
            data=data
        )

        logger.info(f"Notification push envoyée à {user_id}")
        return {'status': 'success', 'user_id': user_id}

    except ValueError as exc:
        logger.error(f"Erreur notification push (utilisateur introuvable): {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': 'Utilisateur introuvable'}
    except Exception as exc:
        logger.error(f"Erreur notification push: {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': str(exc)}


# ==================== TÂCHES MAINTENANCE ====================

@celery_app.task
def sync_search_index():
    """Synchroniser l'index de recherche Elasticsearch"""
    try:
        from src.utils.search import sync_all_listings

        count = sync_all_listings()
        logger.info(f"Index de recherche synchronisé: {count} annonces indexées")
        return {'status': 'success', 'indexed_count': count}

    except ConnectionError as exc:
        logger.error(f"Erreur synchronisation index (Elasticsearch indisponible): {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': 'Service de recherche indisponible'}
    except Exception as exc:
        logger.error(f"Erreur synchronisation index: {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': str(exc)}


@celery_app.task
def update_user_activity():
    """Mettre à jour les statistiques d'activité des utilisateurs"""
    try:
        from src.auth.models import User, UserActivity
        from datetime import timedelta

        # Compter les activités de la dernière heure
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)

        users = User.query.all()
        for user in users:
            activity_count = UserActivity.query.filter(
                UserActivity.user_id == user.id,
                UserActivity.timestamp > one_hour_ago
            ).count()

            user.activity_score = (user.activity_score or 0) + activity_count

        from src.auth.models import db
        db.session.commit()

        logger.info(f"Activité utilisateurs mise à jour")
        return {'status': 'success', 'users_updated': len(users)}

    except ValueError as exc:
        logger.error(f"Erreur mise à jour activité (erreur de calcul): {str(exc)}", exc_info=True)
    except Exception as exc:
        logger.error(f"Erreur mise à jour activité: {str(exc)}", exc_info=True)
        return {'status': 'error', 'message': str(exc)}
