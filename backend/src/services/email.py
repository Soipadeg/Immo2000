"""
Service d'email pour les notifications automatiques.

Fournit les fonctionnalités :
- send_email() : Envoyer un email via SMTP
- send_annonce_published() : Email de notification annonce publiée
- send_annonce_sold() : Email de notification annonce vendue
"""

import smtplib
import logging
from typing import Optional, List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os


logger = logging.getLogger(__name__)


class EmailError(Exception):
    """Exception levée quand l'envoi d'email échoue."""
    pass


class EmailService:
    """Service d'envoi d'emails avec configuration SMTP."""

    def __init__(
        self,
        smtp_host: str = None,
        smtp_port: int = 587,
        smtp_user: str = None,
        smtp_password: str = None,
        from_email: str = None,
        from_name: str = "Immo2000"
    ):
        """
        Initialiser le service d'email.

        Args:
            smtp_host: Serveur SMTP (défaut: os.getenv("SMTP_HOST"))
            smtp_port: Port SMTP (défaut: 587)
            smtp_user: Utilisateur SMTP (défaut: os.getenv("SMTP_USER"))
            smtp_password: Mot de passe SMTP (défaut: os.getenv("SMTP_PASSWORD"))
            from_email: Adresse email d'envoi (défaut: os.getenv("SMTP_FROM_EMAIL"))
            from_name: Nom d'affichage (défaut: "Immo2000")
        """
        self.smtp_host = smtp_host or os.getenv("SMTP_HOST", "localhost")
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user or os.getenv("SMTP_USER", "")
        self.smtp_password = smtp_password or os.getenv("SMTP_PASSWORD", "")
        self.from_email = from_email or os.getenv("SMTP_FROM_EMAIL", "noreply@immo2000.fr")
        self.from_name = from_name

    def send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Envoyer un email.

        Args:
            to_email: Adresse email du destinataire
            to_name: Nom du destinataire
            subject: Sujet de l'email
            html_content: Contenu HTML de l'email
            text_content: Contenu texte (fallback pour HTML)

        Returns:
            True si envoyé avec succès, False sinon

        Raises:
            EmailError: Si la configuration SMTP est invalide
        """
        try:
            # Créer le message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = f"{to_name} <{to_email}>"

            # Ajouter les contenus
            if text_content:
                part1 = MIMEText(text_content, "plain", _charset="utf-8")
                msg.attach(part1)

            part2 = MIMEText(html_content, "html", _charset="utf-8")
            msg.attach(part2)

            # Envoyer l'email
            logger.info(f"Envoi d'email à {to_email} (sujet: {subject})")

            if self.smtp_host == "localhost" or not self.smtp_user:
                # Mode développement : juste log
                logger.info(f"[DEV MODE] Email seraitenvoyé à {to_email}")
                return True

            # Mode production : envoyer via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email envoyé avec succès à {to_email}")
            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("Erreur SMTP: Authentification échouée")
            raise EmailError("Erreur SMTP: Authentification échouée")
        except smtplib.SMTPException as e:
            logger.error(f"Erreur SMTP: {str(e)}")
            raise EmailError(f"Erreur SMTP: {str(e)}")
        except Exception as e:
            logger.error(f"Erreur d'envoi d'email: {str(e)}")
            raise EmailError(f"Erreur d'envoi d'email: {str(e)}")

    def send_annonce_published(
        self,
        to_email: str,
        to_name: str,
        annonce_titre: str,
        annonce_url: str
    ) -> bool:
        """
        Envoyer un email de notification annonce publiée.

        Args:
            to_email: Adresse email du destinataire
            to_name: Nom du destinataire
            annonce_titre: Titre de l'annonce
            annonce_url: URL pour voir l'annonce

        Returns:
            True si envoyé avec succès
        """
        subject = "Votre annonce a été publiée ! 🎉"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Bonjour {to_name},</h2>

                <p>Bonne nouvelle ! Votre annonce <strong>{annonce_titre}</strong> vient d'être publiée.</p>

                <p>
                    <a href="{annonce_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Voir l'annonce
                    </a>
                </p>

                <p>
                    Elle est maintenant visible pour tous les acheteurs potentiels.
                    Vous pouvez la gérer depuis votre tableau de bord.
                </p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                <p style="color: #666; font-size: 12px;">
                    Immo2000 - Plateforme immobilière
                </p>
            </body>
        </html>
        """

        text_content = f"""
        Bonjour {to_name},

        Bonne nouvelle ! Votre annonce "{annonce_titre}" vient d'être publiée.

        Lien: {annonce_url}

        Elle est maintenant visible pour tous les acheteurs potentiels.

        Immo2000 - Plateforme immobilière
        """

        return self.send_email(to_email, to_name, subject, html_content, text_content)

    def send_annonce_sold(
        self,
        to_email: str,
        to_name: str,
        annonce_titre: str,
        sale_date: datetime = None
    ) -> bool:
        """
        Envoyer un email de notification annonce vendue.

        Args:
            to_email: Adresse email du destinataire
            to_name: Nom du destinataire
            annonce_titre: Titre de l'annonce
            sale_date: Date de vente

        Returns:
            True si envoyé avec succès
        """
        subject = "Votre bien a été vendu ! 🎊"

        date_str = sale_date.strftime("%d/%m/%Y") if sale_date else "aujourd'hui"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>Félicitations {to_name},</h2>

                <p>Nous avons le plaisir de vous annoncer que votre bien <strong>{annonce_titre}</strong> a été vendu le <strong>{date_str}</strong>.</p>

                <p>Merci d'avoir utilisé Immo2000 pour cette transaction.</p>

                <p>Vous pouvez consulter votre historique de ventes dans votre tableau de bord.</p>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                <p style="color: #666; font-size: 12px;">
                    Immo2000 - Plateforme immobilière
                </p>
            </body>
        </html>
        """

        text_content = f"""
        Félicitations {to_name},

        Nous avons le plaisir de vous annoncer que votre bien "{annonce_titre}" a été vendu le {date_str}.

        Merci d'avoir utilisé Immo2000 pour cette transaction.

        Immo2000 - Plateforme immobilière
        """

        return self.send_email(to_email, to_name, subject, html_content, text_content)


# Instance globale du service
_email_service = None


def get_email_service() -> EmailService:
    """Obtenir l'instance du service d'email."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
