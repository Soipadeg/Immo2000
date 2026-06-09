"""
Service d'envoi d'emails via SMTP.

Gère l'envoi d'emails HTML pour les notifications de visite et feedbacks.
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Exception personnalisée pour les erreurs d'email."""
    pass


class EmailService:
    """Service pour envoyer des emails via SMTP."""

    @staticmethod
    def envoyer_email(
        destinataire: str,
        sujet: str,
        corps_html: str,
        corps_texte: Optional[str] = None
    ) -> bool:
        """
        Envoyer un email au format HTML.

        Args:
            destinataire: Adresse email du destinataire
            sujet: Sujet de l'email
            corps_html: Contenu HTML de l'email
            corps_texte: Contenu texte (fallback si HTML non supporté)

        Returns:
            True si succès, False si erreur

        Raises:
            EmailServiceError: En cas d'erreur SMTP ou configuration manquante
        """
        try:
            # Récupérer config SMTP des variables d'environnement
            smtp_host = os.getenv("SMTP_HOST")
            smtp_port = os.getenv("SMTP_PORT")
            email_user = os.getenv("EMAIL_USER")
            email_password = os.getenv("EMAIL_PASSWORD")

            # Vérifier que les variables d'env sont présentes
            if not all([smtp_host, smtp_port, email_user, email_password]):
                raise EmailServiceError(
                    "Variables SMTP manquantes (.env): SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASSWORD"
                )

            # Créer le message MIME
            msg = MIMEMultipart("alternative")
            msg["From"] = email_user
            msg["To"] = destinataire
            msg["Subject"] = sujet

            # Ajouter version texte (fallback)
            if corps_texte:
                msg.attach(MIMEText(corps_texte, "plain"))

            # Ajouter version HTML (préféré)
            msg.attach(MIMEText(corps_html, "html"))

            # Envoyer via SMTP
            with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                # Utiliser STARTTLS pour sécuriser la connexion
                server.starttls()
                # Se connecter
                server.login(email_user, email_password)
                # Envoyer le message
                server.send_message(msg)

            logger.info(f"✅ Email envoyé à {destinataire} - Sujet: {sujet}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Erreur authentification SMTP: {e}", exc_info=True)
            raise EmailServiceError(f"Authentification SMTP échouée: {e}")

        except smtplib.SMTPException as e:
            logger.error(f"❌ Erreur SMTP: {e}", exc_info=True)
            raise EmailServiceError(f"Erreur SMTP: {e}")

        except ValueError as e:
            logger.error(f"❌ Erreur envoi email à {destinataire} (validation): {e}", exc_info=True)
            raise EmailServiceError(f"Erreur envoi email: {e}")
        except Exception as e:
            logger.error(f"❌ Erreur envoi email à {destinataire}: {e}", exc_info=True)
            raise EmailServiceError(f"Erreur envoi email: {e}")

    @staticmethod
    def generer_email_feedback(
        visite,
        acheteur,
        annonce,
        est_rappel: bool = True
    ) -> str:
        """
        Générer le HTML pour un email de feedback.

        Args:
            visite: Objet Visite
            acheteur: Objet User (l'utilisateur acheteur)
            annonce: Objet Annonce
            est_rappel: True si c'est un rappel, False si confirmation

        Returns:
            Contenu HTML formaté
        """
        nom_acheteur = acheteur.prenom if acheteur else "Ami"
        adresse = annonce.adresse if annonce else "Bien immobilier"
        code_postal = annonce.code_postal if annonce else ""
        ville = annonce.ville if annonce else ""
        date_heure = visite.date_heure.strftime("%d/%m/%Y à %H:%M") if visite.date_heure else ""
        visite_id = visite.id
        annonce_id = annonce.annonce_id if annonce else ""

        if est_rappel:
            titre = "Votre avis compte pour nous !"
            bouton_text = "Laisser un feedback"
            intro = f"Vous avez visité l'annonce <strong>{adresse} ({code_postal} {ville})</strong> le <strong>{date_heure}</strong>."
            message = "Pouvez-vous nous laisser un <strong>feedback</strong> ? Cela nous aide à améliorer notre service et aide les autres acheteurs."
        else:
            titre = "Merci pour votre feedback !"
            bouton_text = "Voir votre avis"
            intro = f"Merci d'avoir visité l'annonce <strong>{adresse}</strong> et d'avoir pris le temps de nous laisser un avis."
            message = "Consultez votre feedback et celui des autres acheteurs."

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: #FFFFFF;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 20px;
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
            color: #2E86C1;
        }}
        h2 {{
            color: #2E86C1;
            margin-top: 20px;
            margin-bottom: 15px;
        }}
        p {{
            color: #333;
            line-height: 1.6;
            margin-bottom: 15px;
        }}
        .button {{
            background-color: #2E86C1;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s;
        }}
        .button:hover {{
            background-color: #1a5a96;
        }}
        .link {{
            color: #2E86C1;
            text-decoration: none;
        }}
        .link:hover {{
            text-decoration: underline;
        }}
        .details {{
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #2E86C1;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            text-align: center;
        }}
        .address {{
            font-style: italic;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 Immo2000</div>
        </div>

        <h2>{titre}</h2>
        <p>Bonjour {nom_acheteur},</p>

        <div class="details">
            <p><strong>Annonce:</strong> <span class="address">{adresse} ({code_postal} {ville})</span></p>
            <p><strong>Date de visite:</strong> {date_heure}</p>
        </div>

        <p>{intro}</p>
        <p>{message}</p>

        <center>
            <a href="https://immo2000.fr/feedback?visite_id={visite_id}" class="button">{bouton_text}</a>
        </center>

        <p>Ou <a href="https://immo2000.fr/annonces/{annonce_id}" class="link">consultez l'annonce</a>.</p>

        <div class="footer">
            <p>© 2026 Immo2000. Tous droits réservés.</p>
            <p><a href="https://immo2000.fr" class="link">immo2000.fr</a></p>
            <p><small>Cet email a été envoyé à {acheteur.email if acheteur else destinataire}.</small></p>
        </div>
    </div>
</body>
</html>
"""
        return html

    @staticmethod
    def generer_email_modification_rdv(
        vendeur,
        acheteur,
        annonce,
        visite,
        est_modification: bool = True
    ) -> str:
        """
        Générer le HTML pour un email de modification/annulation de RDV.

        Args:
            vendeur: Objet Utilisateur (vendeur)
            acheteur: Objet Acheteur
            annonce: Objet Annonce
            visite: Objet Visite
            est_modification: True si modification, False si annulation

        Returns:
            Contenu HTML formaté
        """
        nom_vendeur = vendeur.prenom if vendeur else "Propriétaire"
        nom_acheteur = acheteur.prenom if acheteur else "Acheteur"
        adresse = annonce.adresse if annonce else "Bien immobilier"
        date_heure = visite.date_heure.strftime("%d/%m/%Y à %H:%M") if visite.date_heure else ""

        if est_modification:
            titre = "Modification de votre RDV"
            message = f"Le RDV pour l'annonce <strong>{adresse}</strong> a été <strong>déplacé</strong> au <strong>{date_heure}</strong>."
            icone = "🔔"
        else:
            titre = "Annulation de votre RDV"
            message = f"Le RDV pour l'annonce <strong>{adresse}</strong> a été <strong>annulé</strong>."
            icone = "❌"

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: #FFFFFF;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 20px;
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
            color: #2E86C1;
        }}
        h2 {{
            color: #2E86C1;
            margin-top: 20px;
            margin-bottom: 15px;
        }}
        p {{
            color: #333;
            line-height: 1.6;
            margin-bottom: 15px;
        }}
        .alert {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }}
        .alert-danger {{
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
        }}
        .details {{
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #2E86C1;
            margin: 20px 0;
        }}
        .footer {{
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            text-align: center;
        }}
        .link {{
            color: #2E86C1;
            text-decoration: none;
        }}
        .link:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 Immo2000</div>
        </div>

        <h2>{icone} {titre}</h2>

        <p>Bonjour {nom_vendeur},</p>

        <div class="alert {'alert-danger' if not est_modification else ''}">
            <p>{message}</p>
        </div>

        <div class="details">
            <p><strong>Annonce:</strong> {adresse}</p>
            <p><strong>Acheteur:</strong> {nom_acheteur}</p>
            <p><strong>Date et heure:</strong> {date_heure if est_modification else 'Annulé'}</p>
        </div>

        <p>Pour consulter tous vos RDV, connectez-vous à votre <a href="https://immo2000.fr/dashboard" class="link">dashboard</a>.</p>

        <div class="footer">
            <p>© 2026 Immo2000. Tous droits réservés.</p>
            <p><a href="https://immo2000.fr" class="link">immo2000.fr</a></p>
        </div>
    </div>
</body>
</html>
"""
        return html

    @staticmethod
    def generer_email_verification(prenom: str, verification_url: str) -> str:
        """
        Génère l'HTML d'un email de vérification d'email (RGPD compliance).

        Args:
            prenom (str): Prénom de l'utilisateur.
            verification_url (str): URL complète du lien de vérification.

        Returns:
            str: HTML formaté de l'email.
        """
        html = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérifiez votre adresse email - Immo2000</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
        }}
        .content {{
            padding: 30px 20px;
            color: #333;
            line-height: 1.6;
        }}
        .verification-button {{
            display: inline-block;
            background-color: #0066cc;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }}
        .verification-button:hover {{
            background-color: #0052a3;
        }}
        .footer {{
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }}
        .alert {{
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .link {{
            color: #0066cc;
            text-decoration: none;
        }}
        .link:hover {{
            text-decoration: underline;
        }}
        .code {{
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 10px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 Immo2000</div>
        </div>

        <div class="content">
            <h2>Vérifiez votre adresse email</h2>

            <p>Bonjour {prenom},</p>

            <p>Bienvenue sur Immo2000 ! Pour finaliser la création de votre compte et activer tous nos services,
            veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.</p>

            <div class="alert">
                <strong>⏱️ Important :</strong> Ce lien est valable pendant 24 heures.
            </div>

            <p style="text-align: center;">
                <a href="{verification_url}" class="verification-button">✓ Vérifier mon email</a>
            </p>

            <p>Ou copiez ce lien dans votre navigateur :</p>
            <div class="code">{verification_url}</div>

            <p>Si vous n'avez pas créé de compte Immo2000, ignorez cet email.</p>

            <p><strong>Pourquoi vérifier votre email ?</strong></p>
            <ul>
                <li>Conformité RGPD (protection de vos données)</li>
                <li>Sécurité de votre compte</li>
                <li>Réception des notifications importantes</li>
            </ul>

            <p>Cordialement,<br><strong>L'équipe Immo2000</strong></p>
        </div>

        <div class="footer">
            <p>© 2026 Immo2000. Tous droits réservés.</p>
            <p><a href="https://immo2000.fr" class="link">immo2000.fr</a> |
            <a href="https://immo2000.fr/legal/cgu.html" class="link">CGU</a> |
            <a href="https://immo2000.fr/legal/politique-confidentialite.html" class="link">Politique de confidentialité</a></p>
            <p><small>Vous recevez cet email car vous avez créé un compte sur Immo2000.</small></p>
        </div>
    </div>
</body>
</html>
"""
        return html

    @staticmethod
    def generer_email_reset_password(prenom: str, reset_code: str) -> str:
        """
        Génère l'HTML d'un email de réinitialisation de mot de passe.

        Args:
            prenom (str): Prénom de l'utilisateur.
            reset_code (str): Code de réinitialisation à 6 chiffres.

        Returns:
            str: HTML formaté de l'email.
        """
        html = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialiser votre mot de passe - Immo2000</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #ff6b6b 0%, #cc0000 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
        }}
        .content {{
            padding: 30px 20px;
            color: #333;
            line-height: 1.6;
        }}
        .code-box {{
            background-color: #f5f5f5;
            border: 2px solid #ff6b6b;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }}
        .code-box .code {{
            font-size: 32px;
            font-weight: bold;
            color: #ff6b6b;
            letter-spacing: 4px;
            font-family: monospace;
        }}
        .alert {{
            background-color: #ffe0e0;
            border: 1px solid #ff6b6b;
            color: #cc0000;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .footer {{
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }}
        .link {{
            color: #ff6b6b;
            text-decoration: none;
        }}
        .link:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 Immo2000</div>
        </div>

        <div class="content">
            <h2>Réinitialiser votre mot de passe</h2>

            <p>Bonjour {prenom},</p>

            <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de sécurité :</p>

            <div class="code-box">
                <div class="code">{reset_code}</div>
            </div>

            <p>Entrez ce code dans l'application pour créer un nouveau mot de passe sécurisé.</p>

            <div class="alert">
                <strong>⏱️ Important :</strong> Ce code est valable pendant 10 minutes seulement.
            </div>

            <p><strong>Vous ne l'avez pas demandé ?</strong><br>
            Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
            Votre mot de passe reste inchangé et sécurisé.</p>

            <p>Besoin d'aide ? Contactez-nous :</p>
            <ul>
                <li>📧 Email : <a href="mailto:support@immo2000.fr" class="link">support@immo2000.fr</a></li>
                <li>🌐 Site : <a href="https://immo2000.fr" class="link">immo2000.fr</a></li>
            </ul>
        </div>

        <div class="footer">
            <p>© 2024 Immo2000. Tous droits réservés.</p>
            <p><a href="https://immo2000.fr" class="link">immo2000.fr</a></p>
        </div>
    </div>
</body>
</html>
"""
        return html

    @staticmethod
    def generer_email_2fa(prenom: str, two_fa_code: str) -> str:
        """
        Génère l'HTML d'un email avec le code 2FA.

        Args:
            prenom (str): Prénom de l'utilisateur.
            two_fa_code (str): Code 2FA à 6 chiffres.

        Returns:
            str: HTML formaté de l'email.
        """
        html = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre code de sécurité - Immo2000</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
        }}
        .content {{
            padding: 30px 20px;
            color: #333;
            line-height: 1.6;
        }}
        .code-box {{
            background-color: #f5f5f5;
            border: 2px solid #4caf50;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }}
        .code-box .code {{
            font-size: 36px;
            font-weight: bold;
            color: #4caf50;
            letter-spacing: 6px;
            font-family: monospace;
        }}
        .alert {{
            background-color: #e8f5e9;
            border: 1px solid #4caf50;
            color: #2e7d32;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .footer {{
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }}
        .link {{
            color: #4caf50;
            text-decoration: none;
        }}
        .link:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔐 Immo2000 - Authentification</div>
        </div>

        <div class="content">
            <h2>Code de sécurité 2FA</h2>

            <p>Bonjour {prenom},</p>

            <p>Vous avez initié une connexion à votre compte Immo2000. Pour sécuriser votre accès, voici votre code de vérification :</p>

            <div class="code-box">
                <div class="code">{two_fa_code}</div>
            </div>

            <p>Entrez ce code pour terminer votre connexion.</p>

            <div class="alert">
                <strong>⏱️ Important :</strong> Ce code est valable pendant 5 minutes seulement.
            </div>

            <p><strong>Vous ne vous connectiez pas ?</strong><br>
            Si vous ne vous connectiez pas à votre compte, ignorez simplement cet email.
            Votre compte reste sécurisé.</p>

            <p><strong>🔒 Conseils de sécurité :</strong></p>
            <ul>
                <li>Ne partagez jamais ce code avec quiconque</li>
                <li>Immo2000 ne demandera jamais votre code par email ou téléphone</li>
                <li>Signalez tout accès suspect</li>
            </ul>

            <p>Besoin d'aide ? Contactez-nous :</p>
            <ul>
                <li>📧 Email : <a href="mailto:support@immo2000.fr" class="link">support@immo2000.fr</a></li>
                <li>🌐 Site : <a href="https://immo2000.fr" class="link">immo2000.fr</a></li>
            </ul>
        </div>

        <div class="footer">
            <p>© 2024 Immo2000. Tous droits réservés.</p>
            <p><a href="https://immo2000.fr" class="link">immo2000.fr</a></p>
        </div>
    </div>
</body>
</html>
"""
        return html
