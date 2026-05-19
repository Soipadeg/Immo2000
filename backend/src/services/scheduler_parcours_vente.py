"""
Service de rappels automatiques (Phase 3 - Parcours de Vente).

Gère les rappels automatiques via APScheduler:
- Rappel offre non répondues (24h)
- Rappel négociations sans réponse (48h)
- Rappel paiement du dépôt (3 jours)
"""

import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from src.auth.models import db
from src.models.offres import Offre, OffreStatus
from src.models.notaires import TransactionNotaire
from src.models.paiements import Paiement
from src.services.external_integrations import get_sendgrid_service

logger = logging.getLogger(__name__)

# Instance globale du scheduler
scheduler = BackgroundScheduler(daemon=True)


def init_scheduler(app):
    """
    Initialiser le scheduler avec les tâches de rappel.

    À appeler au démarrage de l'application:
    ```python
    from src.services.scheduler_parcours_vente import init_scheduler
    init_scheduler(app)
    ```
    """

    # Rappel offres non répondues (toutes les heures)
    scheduler.add_job(
        func=rappeler_offres_non_repondues,
        trigger=CronTrigger(hour='*'),
        id='rappel_offres_non_repondues',
        name='Rappel: Offres non répondues depuis 24h',
        replace_existing=True
    )

    # Rappel négociations sans réponse (2 fois par jour)
    scheduler.add_job(
        func=rappeler_offres_negociation,
        trigger=CronTrigger(hour='9,17'),
        id='rappel_offres_negociation',
        name='Rappel: Négociations sans réponse depuis 48h',
        replace_existing=True
    )

    # Rappel paiement du dépôt (une fois par jour)
    scheduler.add_job(
        func=rappeler_paiement_depot,
        trigger=CronTrigger(hour='10'),
        id='rappel_paiement_depot',
        name='Rappel: Paiement du dépôt de garantie',
        replace_existing=True
    )

    # Rappel documents en attente (2 fois par jour)
    scheduler.add_job(
        func=rappeler_documents_en_attente,
        trigger=CronTrigger(hour='8,16'),
        id='rappel_documents_en_attente',
        name='Rappel: Documents en attente de signature',
        replace_existing=True
    )

    logger.info("✅ Scheduler de rappels initialisé")

    if not scheduler.running:
        scheduler.start()
        logger.info("✅ APScheduler démarré")


def rappeler_offres_non_repondues():
    """
    Envoyer un rappel aux vendeurs pour les offres PROPOSÉE non répondues depuis 24h.

    Logique:
    - Chercher offres avec statut PROPOSÉE
    - Date de création < datetime.now() - 24h
    - Pas de rappel envoyé aujourd'hui
    - Envoyer email au vendeur
    """
    try:
        with scheduler.app.app_context() if hasattr(scheduler, 'app') else __no_context__():
            logger.info("🔔 Tâche: Rappel offres non répondues")

            # Offres non répondues depuis 24h
            cutoff_date = datetime.utcnow() - timedelta(hours=24)
            offres_en_attente = db.session.query(Offre).filter(
                Offre.statut == OffreStatus.PROPOSEE,
                Offre.date_offre < cutoff_date,
                Offre.date_reponse.is_(None)
            ).all()

            if not offres_en_attente:
                logger.info("   ℹ️  Aucune offre à relancer")
                return

            logger.info(f"   📧 {len(offres_en_attente)} offre(s) à relancer")
            sendgrid = get_sendgrid_service()

            for offre in offres_en_attente:
                try:
                    # Récupérer le vendeur
                    vendeur = offre.vendeur
                    if not vendeur:
                        logger.warning(f"   ⚠️  Vendeur non trouvé pour offre {offre.offre_id}")
                        continue

                    # Envoyer rappel
                    success = sendgrid.envoyer_email_rappel_offre(
                        vendeur.email,
                        offre.prix_propose
                    )

                    if success:
                        logger.info(f"   ✅ Rappel envoyé à {vendeur.email} (offre {offre.offre_id})")
                    else:
                        logger.warning(f"   ⚠️  Erreur envoi email {vendeur.email}")

                except Exception as e:
                    logger.error(f"   ❌ Erreur traitement offre {offre.offre_id}: {e}")

    except Exception as e:
        logger.error(f"❌ Erreur tâche rappel offres: {e}")


def rappeler_offres_negociation():
    """
    Envoyer un rappel pour les offres en NÉGOCIATION sans réponse depuis 48h.

    Logique:
    - Chercher offres avec statut NÉGOCIATION
    - Dernière réponse < datetime.now() - 48h
    - Envoyer email à l'acheteur ET vendeur
    """
    try:
        with scheduler.app.app_context() if hasattr(scheduler, 'app') else __no_context__():
            logger.info("🔔 Tâche: Rappel négociations sans réponse")

            cutoff_date = datetime.utcnow() - timedelta(hours=48)
            offres_negociation = db.session.query(Offre).filter(
                Offre.statut == OffreStatus.NEGOCIATION,
                Offre.date_reponse < cutoff_date
            ).all()

            if not offres_negociation:
                logger.info("   ℹ️  Aucune négociation à relancer")
                return

            logger.info(f"   📧 {len(offres_negociation)} négociation(s) à relancer")
            sendgrid = get_sendgrid_service()

            for offre in offres_negociation:
                try:
                    # Rappel au vendeur (proposer un prix)
                    if offre.vendeur:
                        sendgrid.envoyer_email(
                            offre.vendeur.email,
                            "Rappel: Répondez à la contre-proposition",
                            f"""
                            <h2>Négociation en cours</h2>
                            <p>L'acheteur attend votre réponse à la contre-proposition de <strong>{offre.contre_proposition}€</strong>.</p>
                            <p><a href="https://immo2000.fr/offres/{offre.offre_id}">Répondre maintenant</a></p>
                            """
                        )
                        logger.info(f"   ✅ Rappel vendeur envoyé (offre {offre.offre_id})")

                    # Rappel à l'acheteur (attendre réponse)
                    if offre.acheteur:
                        sendgrid.envoyer_email(
                            offre.acheteur.email,
                            "Rappel: Attente réponse du vendeur",
                            f"""
                            <h2>Votre contre-proposition</h2>
                            <p>Votre contre-proposition de <strong>{offre.contre_proposition}€</strong> attend la réponse du vendeur.</p>
                            <p><a href="https://immo2000.fr/offres/{offre.offre_id}">Voir l'offre</a></p>
                            """
                        )
                        logger.info(f"   ✅ Rappel acheteur envoyé (offre {offre.offre_id})")

                except Exception as e:
                    logger.error(f"   ❌ Erreur traitement offre {offre.offre_id}: {e}")

    except Exception as e:
        logger.error(f"❌ Erreur tâche rappel négociations: {e}")


def rappeler_paiement_depot():
    """
    Envoyer un rappel pour le paiement du dépôt de garantie (3 jours après compromis).

    Logique:
    - Chercher transactions avec statut COMPROMIS_SIGNÉ
    - Créées il y a >= 3 jours
    - Paiement dépôt pas encore reçu
    - Envoyer rappel à l'acheteur
    """
    try:
        with scheduler.app.app_context() if hasattr(scheduler, 'app') else __no_context__():
            logger.info("🔔 Tâche: Rappel paiement dépôt")

            cutoff_date = datetime.utcnow() - timedelta(days=3)
            transactions = db.session.query(TransactionNotaire).filter(
                TransactionNotaire.statut == 'compromis_signe',
                TransactionNotaire.date_creation < cutoff_date
            ).all()

            if not transactions:
                logger.info("   ℹ️  Aucun paiement à relancer")
                return

            logger.info(f"   📧 {len(transactions)} paiement(s) à relancer")
            sendgrid = get_sendgrid_service()

            for transaction in transactions:
                try:
                    # Calculer montant dépôt (15% du prix)
                    montant_depot = transaction.prix_compromis * 0.15

                    # Envoyer rappel à l'acheteur
                    if transaction.acheteur:
                        sendgrid.envoyer_email_paiement_depot(
                            transaction.acheteur.email,
                            montant_depot
                        )
                        logger.info(f"   ✅ Rappel paiement envoyé à l'acheteur (transaction {transaction.transaction_notaire_id})")

                except Exception as e:
                    logger.error(f"   ❌ Erreur transaction {transaction.transaction_notaire_id}: {e}")

    except Exception as e:
        logger.error(f"❌ Erreur tâche rappel paiement dépôt: {e}")


def rappeler_documents_en_attente():
    """
    Envoyer un rappel pour les documents en attente de signature/validation.

    Logique:
    - Chercher transactions en attente de compromis ou acte
    - En attente depuis >= 5 jours
    - Envoyer rappel à notaire et acheteur/vendeur
    """
    try:
        with scheduler.app.app_context() if hasattr(scheduler, 'app') else __no_context__():
            logger.info("🔔 Tâche: Rappel documents en attente")

            cutoff_date = datetime.utcnow() - timedelta(days=5)
            transactions_en_attente = db.session.query(TransactionNotaire).filter(
                TransactionNotaire.statut.in_(['frais_valides', 'compromis_en_attente']),
                TransactionNotaire.date_creation < cutoff_date
            ).all()

            if not transactions_en_attente:
                logger.info("   ℹ️  Aucun document à relancer")
                return

            logger.info(f"   📧 {len(transactions_en_attente)} document(s) à relancer")
            sendgrid = get_sendgrid_service()

            for transaction in transactions_en_attente:
                try:
                    # Rappel au notaire
                    if transaction.notaire:
                        sendgrid.envoyer_email(
                            transaction.notaire.email_professionnel,
                            "Rappel: Document en attente de signature",
                            f"""
                            <h2>Document en attente</h2>
                            <p>Veuillez finaliser la signature du document pour la transaction {transaction.transaction_notaire_id}.</p>
                            <p>Durée en attente: {(datetime.utcnow() - transaction.date_creation).days} jours</p>
                            <p><a href="https://immo2000.fr/notaire/transactions/{transaction.transaction_notaire_id}">Voir transaction</a></p>
                            """
                        )
                        logger.info(f"   ✅ Rappel notaire envoyé (transaction {transaction.transaction_notaire_id})")

                    # Rappel aux parties
                    if transaction.acheteur:
                        sendgrid.envoyer_email(
                            transaction.acheteur.email,
                            "Rappel: Signature du document en attente",
                            f"""
                            <h2>En attente de signature</h2>
                            <p>Votre transaction attend la finalisation de la signature.</p>
                            <p><a href="https://immo2000.fr/transactions/{transaction.transaction_notaire_id}">Voir transaction</a></p>
                            """
                        )
                        logger.info(f"   ✅ Rappel acheteur envoyé (transaction {transaction.transaction_notaire_id})")

                except Exception as e:
                    logger.error(f"   ❌ Erreur transaction {transaction.transaction_notaire_id}: {e}")

    except Exception as e:
        logger.error(f"❌ Erreur tâche rappel documents: {e}")


def __no_context__():
    """Contexte vide (fallback)."""
    class NoContext:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
    return NoContext()


def get_jobs_info():
    """Retourner les infos des jobs planifiés."""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            'id': job.id,
            'name': job.name,
            'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None
        })
    return jobs
