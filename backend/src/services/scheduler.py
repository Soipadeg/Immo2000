"""
Service de planification - Tâches planifiées avec APScheduler.

Gère les rappels automatiques (ex: feedback 24h après visite)
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.interval import IntervalTrigger
    from apscheduler.triggers.date import DateTrigger
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False

logger = logging.getLogger(__name__)


class SchedulerService:
    """Service de gestion des tâches planifiées."""

    _scheduler: Optional[BackgroundScheduler] = None

    @classmethod
    def init_scheduler(cls) -> bool:
        """
        Initialiser et démarrer le scheduler.

        À appeler une seule fois au démarrage de l'application.

        Returns:
            True si le scheduler est démarré, False sinon
        """
        if not APSCHEDULER_AVAILABLE:
            logger.warning("⚠️ APScheduler non installé - les rappels feedback ne seront pas automatiques")
            return False

        if cls._scheduler and cls._scheduler.running:
            logger.info("⚠️ Scheduler déjà en cours d'exécution")
            return True

        try:
            cls._scheduler = BackgroundScheduler()
            cls._scheduler.start()
            logger.info("✅ APScheduler démarré avec succès")

            # Ajouter les tâches récurrentes
            cls._add_recurring_jobs()

            return True
        except Exception as e:
            logger.error(f"❌ Erreur démarrage APScheduler: {e}")
            return False

    @classmethod
    def stop_scheduler(cls) -> None:
        """Arrêter le scheduler."""
        if cls._scheduler and cls._scheduler.running:
            cls._scheduler.shutdown()
            logger.info("✅ Scheduler arrêté")

    @classmethod
    def _add_recurring_jobs(cls) -> None:
        """Ajouter les tâches récurrentes."""
        if not cls._scheduler:
            return

        # Tâche: Envoyer rappels feedback toutes les heures
        # Cherche les visites qui ont eu lieu il y a ~24h et envoie un rappel
        cls._scheduler.add_job(
            func=cls._send_feedback_reminders,
            trigger=IntervalTrigger(hours=1),  # Vérifier toutes les heures
            id='send_feedback_reminders',
            name='Envoyer rappels feedback',
            replace_existing=True,
            max_instances=1  # Éviter les doublons
        )
        logger.info("✅ Tâche 'send_feedback_reminders' ajoutée")

    @classmethod
    def schedule_feedback_reminder(cls, visite_id: int, delay_seconds: int = 86400) -> bool:
        """
        Planifier un rappel feedback pour une visite spécifique.

        Args:
            visite_id: ID de la visite
            delay_seconds: Délai en secondes avant d'envoyer le rappel (par défaut 24h)

        Returns:
            True si la tâche a été planifiée, False sinon
        """
        if not APSCHEDULER_AVAILABLE or not cls._scheduler:
            logger.warning(f"⚠️ Impossible de planifier rappel visite #{visite_id} - APScheduler non disponible")
            return False

        try:
            # Calculer le temps d'exécution
            run_time = datetime.now() + timedelta(seconds=delay_seconds)

            job_id = f"feedback_reminder_visite_{visite_id}"

            # Ajouter ou remplacer la tâche
            cls._scheduler.add_job(
                func=cls._send_single_feedback_reminder,
                trigger=DateTrigger(run_time=run_time),
                id=job_id,
                name=f"Rappel feedback visite {visite_id}",
                args=[visite_id],
                replace_existing=True,
                max_instances=1
            )

            logger.info(f"✅ Rappel feedback planifié pour visite #{visite_id} à {run_time.strftime('%Y-%m-%d %H:%M:%S')}")
            return True

        except Exception as e:
            logger.error(f"❌ Erreur planification rappel visite #{visite_id}: {e}")
            return False

    @classmethod
    def _send_feedback_reminders(cls) -> None:
        """
        Tâche récurrente: Envoyer des rappels feedback.

        Cherche les visites qui ont eu lieu il y a ~24h et envoie un rappel
        uniquement si pas de feedback déjà existant.
        """
        try:
            from src.auth.models import db
            from src.models.visites import Visite
            from src.models.feedbacks import Feedback
            from src.services.email_service import EmailService

            # Chercher les visites qui ont eu lieu il y a ~24h (±1h)
            now = datetime.utcnow()
            time_24h_ago = now - timedelta(hours=24)
            time_25h_ago = now - timedelta(hours=25)

            visites = Visite.query.filter(
                Visite.date_heure >= time_25h_ago,
                Visite.date_heure <= time_24h_ago,
                Visite.statut.in_(["confirmee", "terminee"])
            ).all()

            if not visites:
                logger.debug("ℹ️ Pas de visites à rappeler")
                return

            logger.info(f"📧 Traitement de {len(visites)} visite(s) pour rappel feedback...")

            for visite in visites:
                try:
                    # Vérifier qu'il n'y a pas déjà un feedback
                    feedback_existant = Feedback.query.filter_by(
                        visite_id=visite.id,
                        acheteur_id=visite.acheteur_id
                    ).first()

                    if feedback_existant:
                        logger.debug(f"ℹ️ Visite #{visite.id}: feedback déjà existant, skip")
                        continue

                    # Récupérer les infos nécessaires
                    acheteur = visite.acheteur
                    annonce = visite.annonce

                    if not acheteur or not annonce:
                        logger.warning(f"⚠️ Visite #{visite.id}: acheteur ou annonce manquants")
                        continue

                    if not acheteur.utilisateur or not acheteur.utilisateur.email:
                        logger.warning(f"⚠️ Visite #{visite.id}: email acheteur manquant")
                        continue

                    # Générer et envoyer l'email de rappel
                    html = EmailService.generer_email_feedback(
                        visite=visite,
                        acheteur=acheteur,
                        annonce=annonce,
                        est_rappel=True
                    )

                    EmailService.envoyer_email(
                        destinataire=acheteur.utilisateur.email,
                        sujet=f"📝 Comment s'est déroulée votre visite de {annonce.titre}?",
                        corps_html=html
                    )

                    logger.info(f"✅ Rappel feedback envoyé - Visite #{visite.id} → {acheteur.utilisateur.email}")

                except Exception as e:
                    logger.error(f"❌ Erreur envoi rappel visite #{visite.id}: {e}")
                    continue

        except Exception as e:
            logger.error(f"❌ Erreur tâche _send_feedback_reminders: {e}")

    @classmethod
    def _send_single_feedback_reminder(cls, visite_id: int) -> None:
        """
        Tâche planifiée: Envoyer un rappel feedback pour une visite spécifique.

        Args:
            visite_id: ID de la visite
        """
        try:
            from src.auth.models import db
            from src.models.visites import Visite
            from src.models.feedbacks import Feedback
            from src.services.email_service import EmailService

            # Récupérer la visite
            visite = Visite.query.filter_by(id=visite_id).first()
            if not visite:
                logger.warning(f"⚠️ Visite #{visite_id} introuvable")
                return

            # Vérifier qu'il n'y a pas déjà un feedback
            feedback_existant = Feedback.query.filter_by(
                visite_id=visite_id,
                acheteur_id=visite.acheteur_id
            ).first()

            if feedback_existant:
                logger.info(f"ℹ️ Visite #{visite_id}: feedback déjà existant")
                return

            # Récupérer les infos
            acheteur = visite.acheteur
            annonce = visite.annonce

            if not acheteur or not annonce or not acheteur.utilisateur:
                logger.warning(f"⚠️ Visite #{visite_id}: données manquantes")
                return

            # Envoyer le rappel
            html = EmailService.generer_email_feedback(
                visite=visite,
                acheteur=acheteur,
                annonce=annonce,
                est_rappel=True
            )

            EmailService.envoyer_email(
                destinataire=acheteur.utilisateur.email,
                sujet=f"📝 Comment s'est déroulée votre visite de {annonce.titre}?",
                corps_html=html
            )

            logger.info(f"✅ Rappel feedback envoyé - Visite #{visite_id}")

        except Exception as e:
            logger.error(f"❌ Erreur envoi rappel visite #{visite_id}: {e}")

    @classmethod
    def get_scheduler_status(cls) -> dict:
        """Retourner le statut du scheduler."""
        if not APSCHEDULER_AVAILABLE:
            return {
                "available": False,
                "running": False,
                "reason": "APScheduler non installé"
            }

        if not cls._scheduler:
            return {
                "available": True,
                "running": False,
                "reason": "Scheduler non initialisé"
            }

        return {
            "available": True,
            "running": cls._scheduler.running,
            "jobs_count": len(cls._scheduler.get_jobs()) if cls._scheduler.running else 0,
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": str(job.next_run_time) if job.next_run_time else None
                }
                for job in cls._scheduler.get_jobs()
            ] if cls._scheduler.running else []
        }
