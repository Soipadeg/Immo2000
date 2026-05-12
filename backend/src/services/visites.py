"""
Service de gestion des réservations de visites.

Logique métier pour créer, valider et gérer les visites d'annonces.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode
from sqlalchemy.exc import IntegrityError
import logging

try:
    from icalendar import Calendar, Event
    ICALENDAR_AVAILABLE = True
except ImportError:
    ICALENDAR_AVAILABLE = False

from src.auth.models import db, User
from src.models.visites import Visite
from src.models.annonces import Annonce
from src.services.email_service import EmailService

logger = logging.getLogger(__name__)


class VisitesError(Exception):
    """Exception personnalisée pour les erreurs de visites."""
    pass


class VisitesService:
    """Service pour gérer les réservations de visites."""

    @staticmethod
    def valider_date_heure(date_heure_str: str) -> Tuple[bool, Optional[str], Optional[datetime]]:
        """
        Valider et parser une date/heure en format ISO 8601.

        Args:
            date_heure_str: Date/heure au format ISO 8601 (ex: "2026-05-20T14:00:00")

        Returns:
            Tuple (is_valid, error_message, datetime_obj)
        """
        try:
            # Parser la date
            date_heure = datetime.fromisoformat(date_heure_str.replace('Z', '+00:00'))

            # Vérifier que la date n'est pas dans le passé
            if date_heure < datetime.utcnow():
                return False, "La date de visite ne peut pas être dans le passé.", None

            return True, None, date_heure
        except (ValueError, TypeError):
            return False, "Format de date invalide. Utilisez le format ISO 8601 (ex: 2026-05-20T14:00:00)", None

    @staticmethod
    def verifier_annonce_existe(annonce_id: int) -> Tuple[bool, Optional[str], Optional[Annonce]]:
        """
        Vérifier qu'une annonce existe et est publiée.

        Args:
            annonce_id: ID de l'annonce

        Returns:
            Tuple (exists, error_message, annonce)
        """
        annonce = Annonce.query.filter_by(annonce_id=annonce_id).first()

        if not annonce:
            return False, f"L'annonce #{annonce_id} n'existe pas.", None

        if annonce.statut != "publiée":
            return False, f"L'annonce #{annonce_id} n'est pas disponible pour visite (statut: {annonce.statut}).", None

        return True, None, annonce

    @staticmethod
    def verifier_user_existe(user_id: int) -> Tuple[bool, Optional[str], Optional[User]]:
        """
        Vérifier qu'un utilisateur existe.

        Args:
            user_id: ID de l'utilisateur

        Returns:
            Tuple (exists, error_message, user)
        """
        user = User.query.filter_by(utilisateur_id=user_id).first()

        if not user:
            return False, f"L'utilisateur #{user_id} n'existe pas.", None

        return True, None, user

    @staticmethod
    def verifier_score_matching(user_id: int, annonce_id: int) -> Tuple[bool, Optional[str], int]:
        """
        Vérifier que l'utilisateur a un score de matching >= 5 pour cette annonce.

        Note: Pour le MVP, on utilise la logique du matching simple (4 critères).
        En production, on appelerait un endpoint ou une fonction de scoring.

        Args:
            user_id: ID de l'utilisateur
            annonce_id: ID de l'annonce

        Returns:
            Tuple (has_min_score, error_message, score)
        """
        user = User.query.filter_by(utilisateur_id=user_id).first()
        annonce = Annonce.query.filter_by(annonce_id=annonce_id).first()

        if not user or not annonce:
            return False, "Utilisateur ou annonce introuvable.", 0

        # Calcul simple du score de matching (4 critères)
        score = 0

        # 1. Budget (budget_max >= prix)
        if user.budget_max and user.budget_max >= annonce.prix:
            score += 1

        # 2. Localisation (ville recherchée)
        if user.ville_recherchee and user.ville_recherchee.lower() == annonce.ville.lower():
            score += 2

        # 3. Type de bien
        if user.type_bien_recherche and user.type_bien_recherche.lower() == annonce.type_bien.lower():
            score += 1

        # 4. Surface (surface_min <= surface annonce)
        if user.surface_min and user.surface_min <= annonce.surface:
            score += 1

        # Vérifier que le score est >= 5
        MIN_SCORE_THRESHOLD = 5
        if score < MIN_SCORE_THRESHOLD:
            return False, f"L'utilisateur n'a pas un score de matching suffisant (score: {score}/5).", score

        return True, None, score

    @staticmethod
    def verifier_disponibilite(annonce_id: int, date_heure: datetime) -> Tuple[bool, Optional[str]]:
        """
        Vérifier qu'il n'existe pas déjà une visite à cette date/heure pour cette annonce.

        Args:
            annonce_id: ID de l'annonce
            date_heure: Date/heure de la visite proposée

        Returns:
            Tuple (is_available, error_message)
        """
        visite_existante = Visite.query.filter_by(
            annonce_id=annonce_id,
            date_heure=date_heure,
            statut="confirmee"
        ).first()

        if visite_existante:
            return False, f"Une visite est déjà réservée pour cette annonce à cette date/heure."

        return True, None

    @staticmethod
    def envoyer_notification_vendeur(annonce: Annonce, acheteur: User, date_heure: datetime, visite_id: int) -> None:
        """
        Envoyer une notification email au vendeur pour la nouvelle visite.

        Args:
            annonce: Objet Annonce
            acheteur: Objet User (l'utilisateur acheteur)
            date_heure: Date/heure de la visite
            visite_id: ID de la visite créée

        Note:
            Utilise smtplib pour l'envoi d'email en production.
        """
        vendeur = User.query.filter_by(utilisateur_id=annonce.utilisateur_id).first()

        if not vendeur or not vendeur.email:
            logger.warning(f"Impossible d'envoyer notification: vendeur {annonce.utilisateur_id} n'a pas d'email.")
            return

        # Générer les liens calendrier
        lien_ics = f"https://immo2000.fr/api/v1/visites/{visite_id}/download.ics"
        lien_google_calendar = VisitesService.generer_lien_google_calendar(
            annonce=annonce,
            acheteur=acheteur,
            date_heure=date_heure
        )

        # Générer le HTML de l'email
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 20px auto; background: #FFFFFF; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
        h2 {{ color: #2E86C1; }}
        .button {{ background-color: #2E86C1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; font-weight: bold; }}
        .details {{ background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2E86C1; margin: 20px 0; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <h2>🔔 Nouvelle visite pour votre annonce</h2>
        <p>Bonjour {vendeur.prenom},</p>

        <div class="details">
            <p><strong>Annonce:</strong> {annonce.titre}</p>
            <p><strong>Adresse:</strong> {annonce.adresse} ({annonce.code_postal} {annonce.ville})</p>
            <p><strong>Date et heure:</strong> {date_heure.strftime('%d/%m/%Y à %H:%M')}</p>
            <p><strong>Acheteur:</strong> {acheteur.prenom} {acheteur.nom}</p>
        </div>

        <p>Un acheteur souhaite visiter votre bien. Pour ajouter ce RDV à votre calendrier :</p>

        <p><strong>📅 Ajouter au calendrier :</strong></p>
        <ul>
            <li><a href="{lien_ics}">📱 iPhone / Apple Calendar</a></li>
            <li><a href="{lien_google_calendar}">🤖 Android / Google Calendar</a></li>
        </ul>

        <p>Veuillez confirmer ou refuser cette visite depuis votre <a href="https://immo2000.fr/dashboard">dashboard</a>.</p>

        <div class="footer">
            <p>© 2026 Immo2000. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
"""

        # Envoyer l'email
        try:
            sujet = f"Nouvelle visite pour votre annonce #{annonce.annonce_id}"
            EmailService.envoyer_email(
                destinataire=vendeur.email,
                sujet=sujet,
                corps_html=html
            )
            logger.info(f"✅ Email notification envoyé à {vendeur.email} pour visite #{visite_id}")
        except Exception as e:
            logger.error(f"❌ Erreur envoi email notification: {str(e)}")
            # Ne pas bloquer le processus si l'email échoue

    @staticmethod
    def creer_visite(
        user_id: int,
        annonce_id: int,
        date_heure_str: str,
        statut: str = "confirmee"
    ) -> Dict:
        """
        Créer une nouvelle réservation de visite avec validations complètes.

        Logique:
        1. Valider format date/heure
        2. Vérifier que l'annonce existe et est publiée
        3. Vérifier que l'utilisateur existe
        4. Vérifier score de matching >= 5
        5. Vérifier pas de double réservation
        6. Créer la visite en DB
        7. Envoyer notification au vendeur
        8. Retourner les détails de la visite

        Args:
            user_id: ID de l'utilisateur acheteur
            annonce_id: ID de l'annonce
            date_heure_str: Date/heure au format ISO 8601
            statut: Statut initial de la visite (default: "confirmee")

        Returns:
            Dict avec {id, user_id, annonce_id, date_heure, statut, message}

        Raises:
            VisitesError: En cas d'erreur de validation
        """
        # 1. Valider format date/heure
        is_valid, error, date_heure = VisitesService.valider_date_heure(date_heure_str)
        if not is_valid:
            raise VisitesError(error)

        # 2. Vérifier annonce existe
        exists, error, annonce = VisitesService.verifier_annonce_existe(annonce_id)
        if not exists:
            raise VisitesError(error)

        # 3. Vérifier utilisateur existe
        exists, error, acheteur = VisitesService.verifier_user_existe(user_id)
        if not exists:
            raise VisitesError(error)

        # 4. Vérifier score de matching >= 5
        has_score, error, score = VisitesService.verifier_score_matching(user_id, annonce_id)
        if not has_score:
            raise VisitesError(error)

        # 5. Vérifier pas de double réservation
        is_available, error = VisitesService.verifier_disponibilite(annonce_id, date_heure)
        if not is_available:
            raise VisitesError(error)

        # 6. Créer la visite en DB
        try:
            visite = Visite(
                acheteur_id=user_id,
                annonce_id=annonce_id,
                date_heure=date_heure,
                statut=statut
            )
            db.session.add(visite)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise VisitesError("Erreur d'intégrité: Une visite existe déjà pour cette annonce à cette date/heure.")
        except Exception as e:
            db.session.rollback()
            raise VisitesError(f"Erreur lors de la création de la visite: {str(e)}")

        # 7. Envoyer notification au vendeur
        try:
            VisitesService.envoyer_notification_vendeur(annonce, acheteur, date_heure, visite.id)
        except Exception as e:
            logger.warning(f"⚠️ Erreur lors de l'envoi de la notification: {str(e)}")

        # 8. Planifier rappel feedback 24h après la visite
        try:
            from src.services.scheduler import SchedulerService

            # Calculer délai en secondes jusqu'à 24h après la visite
            visite_datetime = date_heure
            now = datetime.utcnow()
            delay_seconds = int((visite_datetime + timedelta(hours=24) - now).total_seconds())

            if delay_seconds > 0:
                SchedulerService.schedule_feedback_reminder(visite.id, delay_seconds)
            else:
                logger.debug(f"ℹ️ Visite #{visite.id} déjà passée, pas de rappel planifié")
        except Exception as e:
            logger.warning(f"⚠️ Erreur planification rappel feedback: {str(e)}")

        # 9. Retourner résultat
        return {
            "id": visite.id,
            "acheteur_id": visite.acheteur_id,
            "annonce_id": visite.annonce_id,
            "date_heure": visite.date_heure.isoformat(),
            "statut": visite.statut,
            "score_matching": score,
            "message": "Visite créée avec succès. Notification envoyée au vendeur."
        }

    @staticmethod
    def annuler_visite(visite_id: int) -> Dict:
        """
        Annuler une visite existante.

        Args:
            visite_id: ID de la visite à annuler

        Returns:
            Dict avec les détails de la visite annulée

        Raises:
            VisitesError: Si la visite n'existe pas ou est déjà annulée
        """
        visite = Visite.query.filter_by(id=visite_id).first()

        if not visite:
            raise VisitesError(f"La visite #{visite_id} n'existe pas.")

        if visite.statut == "annulee":
            raise VisitesError(f"La visite #{visite_id} est déjà annulée.")

        try:
            visite.statut = "annulee"
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise VisitesError(f"Erreur lors de l'annulation: {str(e)}")

        return {
            "id": visite.id,
            "statut": visite.statut,
            "message": "Visite annulée avec succès."
        }

    @staticmethod
    def lister_visites_vendeur(vendeur_id: int, statut: Optional[str] = None) -> list:
        """
        Lister toutes les visites pour les annonces d'un vendeur.

        Args:
            vendeur_id: ID du vendeur (utilisateur_id)
            statut: Optionnel, filtrer par statut ('confirmee', 'annulee', 'terminee')

        Returns:
            Liste des visites formatées en dict
        """
        query = db.session.query(Visite).join(Annonce).filter(
            Annonce.utilisateur_id == vendeur_id
        )

        if statut:
            query = query.filter(Visite.statut == statut)

        visites = query.order_by(Visite.date_heure.asc()).all()
        return [visite.to_dict() for visite in visites]

    @staticmethod
    def lister_visites_acheteur(user_id: int, statut: Optional[str] = None) -> list:
        """
        Lister toutes les visites réservées par un utilisateur en tant qu'acheteur.

        Args:
            user_id: ID de l'utilisateur
            statut: Optionnel, filtrer par statut

        Returns:
            Liste des visites formatées en dict
        """
        query = Visite.query.filter_by(acheteur_id=user_id)

        if statut:
            query = query.filter_by(statut=statut)

        visites = query.order_by(Visite.date_heure.asc()).all()
        return [visite.to_dict() for visite in visites]

    @staticmethod
    def generer_fichier_ics(visite_id: int) -> Optional[bytes]:
        """
        Générer un fichier iCalendar (.ics) pour une visite.

        Args:
            visite_id: ID de la visite

        Returns:
            Contenu du fichier .ics en bytes, ou None si erreur

        Raises:
            VisitesError: Si visite inexistante ou icalendar non disponible
        """
        if not ICALENDAR_AVAILABLE:
            raise VisitesError(
                "Librairie icalendar non installée. "
                "Installez avec: pip install icalendar"
            )

        # Récupérer la visite avec ses relations
        visite = Visite.query.filter_by(id=visite_id).first()
        if not visite:
            raise VisitesError(f"Visite #{visite_id} inexistante")

        # Récupérer annonce et utilisateurs
        annonce = Annonce.query.filter_by(annonce_id=visite.annonce_id).first()
        acheteur = User.query.filter_by(utilisateur_id=visite.acheteur_id).first()
        vendeur = User.query.filter_by(utilisateur_id=annonce.utilisateur_id).first()

        if not annonce or not acheteur or not vendeur:
            raise VisitesError("Données manquantes pour générer le .ics")

        # Créer le calendrier
        cal = Calendar()
        cal.add('prodid', '-//Immo2000//Visite Immobiliere//FR')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'PUBLISH')

        # Créer l'événement
        event = Event()
        event.add('uid', f'immo2000-visite-{visite.id}@immo2000.fr')
        event.add('dtstamp', datetime.utcnow())

        # Dates: visite de 1h par défaut
        event.add('dtstart', visite.date_heure)
        event.add('dtend', visite.date_heure + timedelta(hours=1))

        # Détails
        event.add('summary', f"Visite immobilière - {annonce.titre}")
        event.add(
            'description',
            f"Rendez-vous pour visiter le bien situé à:\n"
            f"{annonce.adresse}, {annonce.code_postal} {annonce.ville}\n\n"
            f"Annonce: {annonce.titre}\n"
            f"Type: {annonce.type_bien}\n"
            f"Surface: {annonce.surface} m²\n"
            f"Pièces: {annonce.nombre_pieces}\n"
            f"Prix: {annonce.prix:.0f}€\n\n"
            f"Acheteur: {acheteur.prenom} {acheteur.nom}"
        )

        event.add('location', f"{annonce.adresse}, {annonce.code_postal} {annonce.ville}")

        # Organisateur et participants
        event.add('organizer', f"mailto:{vendeur.email}")
        event.add('attendee', f"mailto:{acheteur.email}")

        # Paramètres de notification
        event.add('status', 'CONFIRMED')
        event.add('transp', 'OPAQUE')  # Marquer comme "occupé"

        # Ajouter l'événement au calendrier
        cal.add_component(event)

        # Retourner le contenu .ics
        return cal.to_ical()

    @staticmethod
    def generer_lien_google_calendar(
        annonce: Annonce,
        acheteur: User,
        date_heure: datetime,
        timezone: str = "Europe/Paris"
    ) -> str:
        """
        Générer un lien Google Calendar pour ajouter la visite.

        Args:
            annonce: Objet Annonce
            acheteur: Objet User (l'utilisateur acheteur)
            date_heure: Date/heure de la visite
            timezone: Timezone (default: Europe/Paris)

        Returns:
            URL Google Calendar (format query string)

        Note:
            Format: https://www.google.com/calendar/render?action=TEMPLATE&...
            Dates en format YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS
        """
        # Dates: visite de 1h
        start = date_heure.strftime("%Y%m%dT%H%M%S")
        end = (date_heure + timedelta(hours=1)).strftime("%Y%m%dT%H%M%S")

        # Paramètres
        params = {
            'action': 'TEMPLATE',
            'text': f"Visite: {annonce.titre}",
            'details': (
                f"Rendez-vous pour visiter le bien situé à "
                f"{annonce.adresse}, {annonce.code_postal} {annonce.ville}\n\n"
                f"Acheteur: {acheteur.prenom} {acheteur.nom}"
            ),
            'location': f"{annonce.adresse}, {annonce.code_postal}",
            'dates': f"{start}/{end}",
            'ctz': timezone,
        }

        # Construire l'URL
        base_url = "https://www.google.com/calendar/render"
        return f"{base_url}?{urlencode(params)}"

    @staticmethod
    def modifier_visite(
        visite_id: int,
        utilisateur_id: int,
        date_heure_str: Optional[str] = None,
        statut: Optional[str] = None
    ) -> Dict:
        """
        Modifier une visite (date/heure et/ou statut).

        Logique:
        1. Vérifier que l'utilisateur est acheteur ou vendeur de la visite
        2. Interdire les modifications si la visite est déjà dans le passé
        3. Si nouvelle date: valider et vérifier pas de conflit
        4. Mettre à jour la visite
        5. Envoyer notifications aux deux parties

        Args:
            visite_id: ID de la visite à modifier
            utilisateur_id: ID de l'utilisateur connecté
            date_heure_str: Nouvelle date/heure (ISO 8601), optionnel
            statut: Nouveau statut ('confirmee', 'annulee'), optionnel

        Returns:
            Dict avec détails de la visite modifiée

        Raises:
            VisitesError: Si la visite n'existe pas, utilisateur non autorisé, etc.
        """
        # 1. Récupérer la visite
        visite = Visite.query.filter_by(id=visite_id).first()
        if not visite:
            raise VisitesError(f"La visite #{visite_id} n'existe pas.")

        # Récupérer annonce et acheteur
        annonce = Annonce.query.filter_by(annonce_id=visite.annonce_id).first()
        acheteur = User.query.filter_by(utilisateur_id=visite.acheteur_id).first()

        if not annonce or not acheteur:
            raise VisitesError("Données manquantes pour cette visite.")

        # 2. Vérifier permissions: acheteur OU vendeur
        is_vendeur = (annonce.utilisateur_id == utilisateur_id)
        is_acheteur = (acheteur.utilisateur_id == utilisateur_id)

        if not (is_vendeur or is_acheteur):
            raise VisitesError("Vous n'êtes pas autorisé à modifier cette visite.")

        # 3. Interdire modifications si visite déjà passée
        if visite.date_heure < datetime.utcnow():
            raise VisitesError("Impossible de modifier une visite qui a déjà eu lieu.")

        # 4. Si nouvelle date: valider et vérifier pas de conflit
        if date_heure_str:
            is_valid, error, date_heure = VisitesService.valider_date_heure(date_heure_str)
            if not is_valid:
                raise VisitesError(error)

            # Vérifier pas de double réservation à la nouvelle date
            # (Sauf pour cette visite elle-même)
            visite_existante = Visite.query.filter(
                Visite.annonce_id == visite.annonce_id,
                Visite.date_heure == date_heure,
                Visite.statut == "confirmee",
                Visite.id != visite_id
            ).first()

            if visite_existante:
                raise VisitesError(
                    "Une visite est déjà réservée pour cette annonce à cette nouvelle date/heure."
                )

            visite.date_heure = date_heure

        # 5. Mettre à jour le statut si fourni
        old_statut = visite.statut
        if statut and statut in ["confirmee", "annulee", "terminee"]:
            visite.statut = statut
        elif statut:
            raise VisitesError(f"Statut invalide: {statut}. Doit être 'confirmee', 'annulee' ou 'terminee'.")

        # 6. Sauvegarder les modifications
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise VisitesError(f"Erreur lors de la modification: {str(e)}")

        # 7. Envoyer notifications
        try:
            vendeur = Utilisateur.query.filter_by(utilisateur_id=annonce.utilisateur_id).first()
            acheteur_user = acheteur.utilisateur

            if date_heure_str:
                # Email de modification
                html = EmailService.generer_email_modification_rdv(
                    vendeur=vendeur,
                    acheteur=acheteur,
                    annonce=annonce,
                    visite=visite,
                    est_modification=True
                )
                sujet = f"Modification de RDV - Annonce #{annonce.annonce_id}"

                # Envoyer au vendeur
                EmailService.envoyer_email(
                    destinataire=vendeur.email,
                    sujet=sujet,
                    corps_html=html
                )
                # Envoyer à l'acheteur
                EmailService.envoyer_email(
                    destinataire=acheteur_user.email,
                    sujet=sujet,
                    corps_html=html
                )
                logger.info(f"✅ Emails modification envoyés - Visite #{visite_id}")

            elif statut == "annulee":
                # Email d'annulation
                html = EmailService.generer_email_modification_rdv(
                    vendeur=vendeur,
                    acheteur=acheteur,
                    annonce=annonce,
                    visite=visite,
                    est_modification=False
                )
                sujet = f"Annulation de RDV - Annonce #{annonce.annonce_id}"

                # Envoyer au vendeur
                EmailService.envoyer_email(
                    destinataire=vendeur.email,
                    sujet=sujet,
                    corps_html=html
                )
                # Envoyer à l'acheteur
                EmailService.envoyer_email(
                    destinataire=acheteur_user.email,
                    sujet=sujet,
                    corps_html=html
                )
                logger.info(f"✅ Emails annulation envoyés - Visite #{visite_id}")

        except Exception as e:
            logger.error(f"❌ Erreur lors de l'envoi des notifications: {str(e)}")

        return {
            "id": visite.id,
            "date_heure": visite.date_heure.isoformat(),
            "statut": visite.statut,
            "message": "RDV modifié avec succès. Notifications envoyées."
        }

    @staticmethod
    def soumettre_feedback(
        acheteur_id: int,
        visite_id: int,
        note: int,
        commentaire: Optional[str] = None
    ) -> Dict:
        """
        Soumettre un feedback pour une visite.

        Logique:
        1. Vérifier que la visite existe
        2. Vérifier que l'utilisateur est bien l'acheteur de la visite
        3. Vérifier que la visite a eu lieu (date_heure < maintenant et statut="terminee")
        4. Vérifier pas de feedback déjà existant pour cette visite/acheteur
        5. Créer le feedback
        6. Retourner le feedback créé

        Args:
            acheteur_id: ID de l'acheteur
            visite_id: ID de la visite
            note: Note de 1 à 5
            commentaire: Avis textuel (optionnel)

        Returns:
            Dict avec les détails du feedback créé

        Raises:
            VisitesError: En cas d'erreur de validation
        """
        from src.models.feedbacks import Feedback

        # 1. Vérifier que la visite existe
        visite = Visite.query.filter_by(id=visite_id).first()
        if not visite:
            raise VisitesError(f"La visite #{visite_id} n'existe pas.")

        # 2. Vérifier que l'utilisateur est l'acheteur
        if visite.acheteur_id != acheteur_id:
            raise VisitesError("Vous n'êtes pas autorisé à laisser un feedback pour cette visite.")

        # 3. Vérifier que la visite a eu lieu
        if visite.date_heure > datetime.utcnow():
            raise VisitesError("Vous ne pouvez laisser un feedback que après la visite.")

        if visite.statut not in ["terminee", "confirmee"]:
            raise VisitesError("La visite doit être terminée ou confirmée pour pouvoir laisser un feedback.")

        # 4. Vérifier pas de feedback existant
        feedback_existant = Feedback.query.filter_by(
            visite_id=visite_id,
            acheteur_id=acheteur_id
        ).first()

        if feedback_existant:
            raise VisitesError("Vous avez déjà laissé un feedback pour cette visite.")

        # 5. Créer le feedback
        try:
            feedback = Feedback(
                visite_id=visite_id,
                acheteur_id=acheteur_id,
                note=note,
                commentaire=commentaire
            )
            db.session.add(feedback)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise VisitesError(f"Erreur lors de la création du feedback: {str(e)}")

        # 6. Retourner le feedback créé
        return {
            "id": feedback.id,
            "visite_id": feedback.visite_id,
            "note": feedback.note,
            "commentaire": feedback.commentaire,
            "created_at": feedback.created_at.isoformat(),
            "message": "Feedback enregistré. Merci !"
        }

    @staticmethod
    def recuperer_feedback(visite_id: int, utilisateur_id: int) -> Dict:
        """
        Récupérer le feedback d'une visite.

        Logique:
        1. Vérifier que la visite existe
        2. Vérifier que l'utilisateur est vendeur ou acheteur de cette visite
        3. Retourner le feedback (s'il existe)

        Args:
            visite_id: ID de la visite
            utilisateur_id: ID de l'utilisateur connecté

        Returns:
            Dict avec les détails du feedback

        Raises:
            VisitesError: En cas d'erreur
        """
        from src.models.feedbacks import Feedback

        # 1. Vérifier que la visite existe
        visite = Visite.query.filter_by(id=visite_id).first()
        if not visite:
            raise VisitesError(f"La visite #{visite_id} n'existe pas.")

        # 2. Vérifier permissions
        annonce = Annonce.query.filter_by(annonce_id=visite.annonce_id).first()
        acheteur = User.query.filter_by(utilisateur_id=visite.acheteur_id).first()

        is_vendeur = (annonce and annonce.utilisateur_id == utilisateur_id)
        is_acheteur = (acheteur and acheteur.utilisateur_id == utilisateur_id)

        if not (is_vendeur or is_acheteur):
            raise VisitesError("Vous n'avez pas accès au feedback de cette visite.")

        # 3. Récupérer le feedback
        feedback = Feedback.query.filter_by(visite_id=visite_id).first()

        if not feedback:
            raise VisitesError("Aucun feedback trouvé pour cette visite.")

        return feedback.to_dict()

    @staticmethod
    def ajouter_reponse_vendeur(
        feedback_id: int,
        utilisateur_id: int,
        reponse_vendeur: str
    ) -> Dict:
        """
        Ajouter une réponse du vendeur à un feedback.

        Logique:
        1. Vérifier que le feedback existe
        2. Vérifier que l'utilisateur est le vendeur de l'annonce
        3. Mettre à jour le feedback avec la réponse
        4. Retourner le feedback mis à jour

        Args:
            feedback_id: ID du feedback
            utilisateur_id: ID du vendeur
            reponse_vendeur: Réponse textuelle du vendeur

        Returns:
            Dict avec les détails du feedback mis à jour

        Raises:
            VisitesError: En cas d'erreur
        """
        from src.models.feedbacks import Feedback

        # 1. Vérifier que le feedback existe
        feedback = Feedback.query.filter_by(id=feedback_id).first()
        if not feedback:
            raise VisitesError(f"Le feedback #{feedback_id} n'existe pas.")

        # 2. Vérifier permissions
        visite = Visite.query.filter_by(id=feedback.visite_id).first()
        annonce = Annonce.query.filter_by(annonce_id=visite.annonce_id).first()

        if annonce.utilisateur_id != utilisateur_id:
            raise VisitesError("Seul le vendeur de l'annonce peut répondre au feedback.")

        # 3. Mettre à jour la réponse
        try:
            feedback.reponse_vendeur = reponse_vendeur
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise VisitesError(f"Erreur lors de la mise à jour: {str(e)}")

        return feedback.to_dict()

    @staticmethod
    def lister_feedbacks_annonce(annonce_id: int, utilisateur_id: int) -> list:
        """
        Lister tous les feedbacks d'une annonce.

        Logique:
        1. Vérifier que l'utilisateur est le vendeur de l'annonce
        2. Retourner tous les feedbacks associés aux visites de cette annonce

        Args:
            annonce_id: ID de l'annonce
            utilisateur_id: ID du vendeur

        Returns:
            Liste des feedbacks en format dict

        Raises:
            VisitesError: Si utilisateur non autorisé
        """
        from src.models.feedbacks import Feedback

        # Vérifier que c'est le vendeur
        annonce = Annonce.query.filter_by(annonce_id=annonce_id).first()
        if not annonce:
            raise VisitesError(f"L'annonce #{annonce_id} n'existe pas.")

        if annonce.utilisateur_id != utilisateur_id:
            raise VisitesError("Vous n'êtes pas autorisé à voir les feedbacks de cette annonce.")

        # Récupérer tous les feedbacks pour les visites de cette annonce
        feedbacks = db.session.query(Feedback).join(Visite).filter(
            Visite.annonce_id == annonce_id
        ).order_by(Feedback.created_at.desc()).all()

        return [feedback.to_dict() for feedback in feedbacks]

    @staticmethod
    def lister_feedbacks_vendeur(
        utilisateur_id: int,
        note_min: int = None,
        note_max: int = None,
        date_debut: str = None,
        date_fin: str = None
    ) -> Dict:
        """
        Lister tous les feedbacks de toutes les annonces du vendeur avec statistiques.

        Logique:
        1. Vérifier que l'utilisateur existe et est vendeur
        2. Récupérer toutes les annonces du vendeur
        3. Récupérer tous les feedbacks associés avec filtres
        4. Calculer statistiques (moyenne, min, max, total)
        5. Grouper par annonce
        6. Retourner structure complexe avec stats et détails

        Args:
            utilisateur_id: ID du vendeur (Utilisateur.utilisateur_id)
            note_min: Filtrer feedbacks avec note >= note_min (1-5)
            note_max: Filtrer feedbacks avec note <= note_max (1-5)
            date_debut: Filtrer feedbacks créés >= date_debut (ISO format)
            date_fin: Filtrer feedbacks créés <= date_fin (ISO format)

        Returns:
            Dict avec structure:
            {
                "vendeur_id": int,
                "stats_globales": {
                    "total_feedbacks": int,
                    "note_moyenne": float,
                    "note_min": int,
                    "note_max": int,
                    "total_annonces": int,
                    "annonces_avec_feedbacks": int
                },
                "annonces": [
                    {
                        "annonce_id": int,
                        "titre": str,
                        "adresse": str,
                        "stats": {
                            "feedbacks_count": int,
                            "note_moyenne": float,
                            "note_min": int,
                            "note_max": int
                        },
                        "feedbacks": [ { ... } ]
                    }
                ]
            }

        Raises:
            VisitesError: Si utilisateur non autorisé
        """
        from src.models.feedbacks import Feedback
        from sqlalchemy import func

        # 1. Vérifier que l'utilisateur existe
        vendeur = Utilisateur.query.filter_by(utilisateur_id=utilisateur_id).first()
        if not vendeur:
            raise VisitesError(f"Utilisateur #{utilisateur_id} introuvable")

        # 2. Récupérer les annonces du vendeur
        annonces = Annonce.query.filter_by(utilisateur_id=utilisateur_id).all()

        if not annonces:
            return {
                "vendeur_id": utilisateur_id,
                "stats_globales": {
                    "total_feedbacks": 0,
                    "note_moyenne": 0,
                    "note_min": None,
                    "note_max": None,
                    "total_annonces": 0,
                    "annonces_avec_feedbacks": 0
                },
                "annonces": []
            }

        annonce_ids = [a.annonce_id for a in annonces]

        # 3. Récupérer tous les feedbacks avec filtres
        query = db.session.query(Feedback).join(Visite).filter(
            Visite.annonce_id.in_(annonce_ids)
        )

        # Appliquer filtres de note
        if note_min is not None:
            query = query.filter(Feedback.note >= note_min)
        if note_max is not None:
            query = query.filter(Feedback.note <= note_max)

        # Appliquer filtres de date
        if date_debut:
            try:
                date_debut_dt = datetime.fromisoformat(date_debut)
                query = query.filter(Feedback.created_at >= date_debut_dt)
            except ValueError:
                raise VisitesError(f"Format date invalide: {date_debut}")

        if date_fin:
            try:
                date_fin_dt = datetime.fromisoformat(date_fin)
                query = query.filter(Feedback.created_at <= date_fin_dt)
            except ValueError:
                raise VisitesError(f"Format date invalide: {date_fin}")

        feedbacks = query.order_by(Feedback.created_at.desc()).all()

        # 4. Calculer statistiques globales
        if feedbacks:
            notes = [f.note for f in feedbacks]
            stats_globales = {
                "total_feedbacks": len(feedbacks),
                "note_moyenne": round(sum(notes) / len(notes), 2),
                "note_min": min(notes),
                "note_max": max(notes),
                "total_annonces": len(annonces),
                "annonces_avec_feedbacks": len(set([f.visite.annonce_id for f in feedbacks]))
            }
        else:
            stats_globales = {
                "total_feedbacks": 0,
                "note_moyenne": 0,
                "note_min": None,
                "note_max": None,
                "total_annonces": len(annonces),
                "annonces_avec_feedbacks": 0
            }

        # 5. Grouper feedbacks par annonce
        feedbacks_par_annonce = {}
        for feedback in feedbacks:
            annonce_id = feedback.visite.annonce_id
            if annonce_id not in feedbacks_par_annonce:
                feedbacks_par_annonce[annonce_id] = []
            feedbacks_par_annonce[annonce_id].append(feedback)

        # 6. Construire la réponse
        annonces_data = []

        for annonce in annonces:
            feedbacks_annonce = feedbacks_par_annonce.get(annonce.annonce_id, [])

            if feedbacks_annonce:
                notes_annonce = [f.note for f in feedbacks_annonce]
                stats_annonce = {
                    "feedbacks_count": len(feedbacks_annonce),
                    "note_moyenne": round(sum(notes_annonce) / len(notes_annonce), 2),
                    "note_min": min(notes_annonce),
                    "note_max": max(notes_annonce)
                }
            else:
                stats_annonce = {
                    "feedbacks_count": 0,
                    "note_moyenne": 0,
                    "note_min": None,
                    "note_max": None
                }

            annonces_data.append({
                "annonce_id": annonce.annonce_id,
                "titre": annonce.titre,
                "adresse": annonce.adresse,
                "code_postal": annonce.code_postal,
                "ville": annonce.ville,
                "prix": annonce.prix,
                "stats": stats_annonce,
                "feedbacks": [f.to_dict() for f in feedbacks_annonce] if feedbacks_annonce else []
            })

        return {
            "vendeur_id": utilisateur_id,
            "stats_globales": stats_globales,
            "annonces": annonces_data
        }
