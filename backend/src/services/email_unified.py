"""
Service email unifié et centralisé pour Immo2000.

Fusion des services email.py et email_service.py
Fournit une interface unique pour tous les envois d'email.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailError(Exception):
    """Exception levée en cas d'erreur d'envoi d'email."""
    pass


class EmailService:
    """Service centralisé pour tous les envois d'email."""

    def __init__(
        self,
        smtp_host: str = None,
        smtp_port: int = 587,
        smtp_user: str = None,
        smtp_password: str = None,
        from_email: str = None,
        from_name: str = "Immo2000"
    ):
        """Initialiser le service d'email."""
        self.smtp_host = smtp_host or os.getenv("SMTP_HOST", "localhost")
        self.smtp_port = int(smtp_port or os.getenv("SMTP_PORT", 587))
        # Supporter SMTP_USER et EMAIL_USER
        self.smtp_user = smtp_user or os.getenv("SMTP_USER") or os.getenv("EMAIL_USER", "")
        # Supporter SMTP_PASSWORD et EMAIL_PASSWORD
        self.smtp_password = smtp_password or os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASSWORD", "")
        self.from_email = from_email or os.getenv("SMTP_FROM_EMAIL", "noreply@immo2000.fr")
        self.from_name = from_name

    def send(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Envoyer un email - Interface moderne (anglais).

        Args:
            to_email: Email du destinataire
            to_name: Nom du destinataire
            subject: Sujet
            html_content: Corps HTML
            text_content: Corps texte (fallback)

        Returns:
            True si succès
        """
        return self.envoyer_email(
            destinataire=to_email,
            sujet=subject,
            corps_html=html_content,
            corps_texte=text_content,
            nom_destinataire=to_name
        )

    def envoyer_email(
        self,
        destinataire: str,
        sujet: str,
        corps_html: str,
        corps_texte: Optional[str] = None,
        nom_destinataire: Optional[str] = None
    ) -> bool:
        """
        Envoyer un email - Interface historique (français).

        Args:
            destinataire: Email du destinataire
            sujet: Sujet
            corps_html: Corps HTML
            corps_texte: Corps texte (fallback)
            nom_destinataire: Nom du destinataire

        Returns:
            True si succès, False sinon
        """
        try:
            # Créer le message MIME
            msg = MIMEMultipart("alternative")
            msg["Subject"] = sujet
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = f"{nom_destinataire} <{destinataire}>" if nom_destinataire else destinataire

            # Ajouter les contenus
            if corps_texte:
                part1 = MIMEText(corps_texte, "plain", _charset="utf-8")
                msg.attach(part1)

            part2 = MIMEText(corps_html, "html", _charset="utf-8")
            msg.attach(part2)

            # Mode développement : juste log
            if self.smtp_host == "localhost" or not self.smtp_user:
                logger.info(f"[DEV MODE] Email à {destinataire} - Sujet: {sujet}")
                return True

            # Mode production : envoyer via SMTP
            logger.info(f"Envoi email à {destinataire} - Sujet: {sujet}")
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"✅ Email envoyé à {destinataire}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Erreur SMTP auth: {e}")
            raise EmailError(f"Erreur SMTP: Authentification échouée")
        except smtplib.SMTPException as e:
            logger.error(f"❌ Erreur SMTP: {e}")
            raise EmailError(f"Erreur SMTP: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Erreur email à {destinataire}: {e}")
            raise EmailError(f"Erreur d'envoi d'email: {str(e)}")

    def send_annonce_published(
        self,
        to_email: str,
        to_name: str,
        annonce_titre: str,
        annonce_url: str
    ) -> bool:
        """Envoyer notification: annonce publiée."""
        subject = "Votre annonce a été publiée ! 🎉"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bonjour {to_name},</h2>
                <p>Bonne nouvelle ! Votre annonce <strong>{annonce_titre}</strong> vient d'être publiée.</p>
                <p><a href="{annonce_url}">Voir l'annonce</a></p>
                <p>Cordialement,<br>L'équipe Immo2000</p>
            </body>
        </html>
        """
        return self.send(to_email, to_name, subject, html_content)

    def send_annonce_sold(
        self,
        to_email: str,
        to_name: str,
        annonce_titre: str
    ) -> bool:
        """Envoyer notification: annonce vendue."""
        subject = "Votre annonce a été vendue ! 🎊"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bonjour {to_name},</h2>
                <p>Félicitations ! Votre annonce <strong>{annonce_titre}</strong> a été vendue.</p>
                <p>Cordialement,<br>L'équipe Immo2000</p>
            </body>
        </html>
        """
        return self.send(to_email, to_name, subject, html_content)

    @staticmethod
    def generer_email_feedback(
        visite,
        acheteur,
        annonce,
        est_rappel: bool = True
    ) -> str:
        """Générer le HTML pour un email de feedback."""
        nom_acheteur = acheteur.utilisateur.prenom if acheteur and acheteur.utilisateur else "Ami"
        adresse = annonce.adresse if annonce else "Bien immobilier"
        code_postal = annonce.code_postal if annonce else ""
        ville = annonce.ville if annonce else ""
        date_heure = visite.date_heure.strftime("%d/%m/%Y à %H:%M") if visite.date_heure else ""

        if est_rappel:
            titre = "Votre avis compte pour nous !"
            intro = f"Vous avez visité <strong>{adresse} ({code_postal} {ville})</strong> le <strong>{date_heure}</strong>."
            message = "Pouvez-vous nous laisser un <strong>feedback</strong> ?"
        else:
            titre = "Merci pour votre feedback !"
            intro = f"Merci d'avoir visité <strong>{adresse}</strong>."
            message = "Consultez votre feedback et celui des autres acheteurs."

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; color: #333;">
    <h2>{titre}</h2>
    <p>{intro}</p>
    <p>{message}</p>
    <p>Merci,<br>L'équipe Immo2000</p>
</body>
</html>"""
        return html


# Instance singleton pour facilité d'accès
_email_service = None


def get_email_service() -> EmailService:
    """Obtenir l'instance singleton du service d'email."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


# Export pour facilité d'accès
email_service = get_email_service()
