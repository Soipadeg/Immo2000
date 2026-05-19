"""Initialisation des intégrations externes et des services."""
import logging
from contextlib import asynccontextmanager

from app_fastapi.config import settings
from app_fastapi.utils.integrations import init_integrations

logger = logging.getLogger(__name__)


async def init_external_services():
    """Initialiser tous les services externes."""
    try:
        logger.info("Initialisation des services externes...")

        # Initialiser les clients d'intégration
        init_integrations(
            stripe_key=settings.STRIPE_SECRET_KEY,
            docusign_key=settings.DOCUSIGN_API_KEY,
            docusign_account=settings.DOCUSIGN_ACCOUNT_ID,
            sendgrid_key=settings.SENDGRID_API_KEY,
            aws_access_key=settings.AWS_ACCESS_KEY_ID,
            aws_secret_key=settings.AWS_SECRET_ACCESS_KEY,
            aws_bucket=settings.AWS_S3_BUCKET
        )

        logger.info("✅ Services externes initialisés avec succès")

    except Exception as e:
        logger.warning(f"⚠️  Erreur initialisation services: {e}")
        logger.warning("   Application démarrée en mode dégradé")


async def shutdown_external_services():
    """Arrêter proprement les services externes."""
    try:
        logger.info("Arrêt des services externes...")
        # Ajouter ici le cleanup si nécessaire
        logger.info("✅ Services externes arrêtés")

    except Exception as e:
        logger.error(f"Erreur arrêt services: {e}")


@asynccontextmanager
async def lifespan(app):
    """
    Context manager pour le cycle de vie de l'application FastAPI.

    - Startup: initialiser les services externes
    - Shutdown: nettoyer et arrêter les services
    """
    # Startup
    await init_external_services()

    yield

    # Shutdown
    await shutdown_external_services()


async def setup_scheduled_tasks(app):
    """
    Mettre en place les tâches planifiées.

    À utiliser avec APScheduler ou une autre librairie de scheduling.
    """
    logger.info("Configuration des tâches planifiées")

    # Exemple avec APScheduler (à installer si nécessaire):
    # from apscheduler.schedulers.asyncio import AsyncIOScheduler
    #
    # scheduler = AsyncIOScheduler()
    # scheduler.add_job(scheduled_sync_all_transactions, "interval", hours=1)
    # scheduler.add_job(scheduled_process_pending_payments, "interval", minutes=15)
    # scheduler.add_job(scheduled_cleanup_tasks, "interval", hours=6)
    # scheduler.start()
