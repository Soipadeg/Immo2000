"""Background tasks et jobs asynchrones pour FastAPI."""
import asyncio
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class BackgroundJobQueue:
    """Simple queue pour les jobs asynchrones."""

    def __init__(self):
        self.jobs = []
        self.completed = []

    async def send_transaction_notification(
        self,
        user_email: str,
        transaction_id: int,
        event_type: str,
        sendgrid_client=None
    ):
        """Envoyer une notification pour une transaction."""
        try:
            if sendgrid_client:
                await sendgrid_client.send_transaction_notification(
                    user_email,
                    transaction_id,
                    event_type
                )
                logger.info(f"Notification envoyée: {user_email} - {event_type}")
            else:
                logger.warning("SendGrid client not available")
        except Exception as e:
            logger.error(f"Erreur envoi notification: {e}")

    async def sync_transaction_status(
        self,
        transaction_id: int,
        db: Session,
        docusign_client=None
    ):
        """Synchroniser le statut d'une transaction avec DocuSign."""
        try:
            from src.models.notaires import TransactionNotaire
            from src.models.documents import Document

            transaction = db.query(TransactionNotaire).filter(
                TransactionNotaire.transaction_notaire_id == transaction_id
            ).first()

            if not transaction:
                logger.warning(f"Transaction {transaction_id} not found")
                return

            # Vérifier les documents associés
            documents = db.query(Document).filter(
                Document.transaction_notaire_id == transaction_id
            ).all()

            for doc in documents:
                if doc.docusign_envelope_id and docusign_client:
                    try:
                        envelope_status = await docusign_client.get_envelope_status(
                            doc.docusign_envelope_id
                        )

                        if envelope_status.get("status") == "completed":
                            doc.statut_signature = "signe"
                            db.commit()
                            logger.info(f"Document {doc.document_id} marked as signed")
                    except Exception as e:
                        logger.error(f"Erreur check DocuSign: {e}")

        except Exception as e:
            logger.error(f"Erreur sync transaction status: {e}")

    async def process_failed_payments(self, db: Session, stripe_client=None):
        """Traiter les paiements échoués."""
        try:
            from src.models.paiements import Paiement

            failed_payments = db.query(Paiement).filter(
                Paiement.statut == "echoue"
            ).all()

            for payment in failed_payments:
                logger.warning(f"Failed payment detected: {payment.paiement_id}")
                # TODO: Envoyer notification à l'utilisateur
                # TODO: Créer un nouveau payment intent

        except Exception as e:
            logger.error(f"Erreur process failed payments: {e}")

    async def cleanup_expired_offers(self, db: Session):
        """Nettoyer les offres expirées."""
        try:
            from src.models.offres import Offre

            expired_offers = db.query(Offre).filter(
                Offre.date_expiration <= datetime.utcnow(),
                Offre.statut == "proposee"
            ).all()

            for offer in expired_offers:
                offer.statut = "expiree"
                logger.info(f"Offer {offer.offre_id} marked as expired")

            if expired_offers:
                db.commit()
                logger.info(f"Cleaned up {len(expired_offers)} expired offers")

        except Exception as e:
            logger.error(f"Erreur cleanup expired offers: {e}")


# Singleton
background_job_queue = BackgroundJobQueue()


def get_background_job_queue() -> BackgroundJobQueue:
    """Récupérer la queue des background jobs."""
    return background_job_queue


async def schedule_background_task(
    task_func,
    *args,
    delay_seconds: int = 0,
    **kwargs
):
    """
    Planifier une tâche en arrière-plan.

    Utile pour les jobs asynchrones qui doivent s'exécuter après la réponse.
    """
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)

    try:
        await task_func(*args, **kwargs)
    except Exception as e:
        logger.error(f"Erreur background task: {e}")


# Scheduled tasks (à exécuter périodiquement)
async def scheduled_sync_all_transactions(db: Session, docusign_client=None):
    """Synchroniser tous les statuts de transactions avec DocuSign."""
    try:
        from src.models.notaires import TransactionNotaire

        transactions = db.query(TransactionNotaire).filter(
            TransactionNotaire.statut.in_(["en_cours", "en_attente_documents"])
        ).all()

        for transaction in transactions:
            await background_job_queue.sync_transaction_status(
                transaction.transaction_notaire_id,
                db,
                docusign_client
            )

    except Exception as e:
        logger.error(f"Erreur scheduled sync: {e}")


async def scheduled_process_pending_payments(db: Session, stripe_client=None):
    """Traiter les paiements en attente."""
    try:
        from src.models.paiements import Paiement

        pending_payments = db.query(Paiement).filter(
            Paiement.statut == "en_attente"
        ).all()

        logger.info(f"Checking {len(pending_payments)} pending payments")

        for payment in pending_payments:
            # Vérifier le statut avec Stripe
            if stripe_client and payment.stripe_payment_intent_id:
                try:
                    intent = await stripe_client.get_payment_intent(
                        payment.stripe_payment_intent_id
                    )

                    if intent.get("status") == "succeeded":
                        payment.statut = "reussi"
                        db.commit()
                except Exception as e:
                    logger.error(f"Erreur check payment: {e}")

    except Exception as e:
        logger.error(f"Erreur scheduled process payments: {e}")


async def scheduled_cleanup_tasks(db: Session):
    """Tâches de nettoyage planifiées."""
    try:
        logger.info("Running scheduled cleanup tasks")
        await background_job_queue.cleanup_expired_offers(db)
    except Exception as e:
        logger.error(f"Erreur scheduled cleanup: {e}")
