"""
Services pour les intégrations externes (Phase 3 - Parcours de Vente).

Intégrations:
- DocuSign : Signature électronique (compromis, acte authentique)
- Stripe : Paiements (dépôt, solde, frais)
- SendGrid : Emails automatiques
- AWS S3 : Archivage des documents
"""

import os
import logging
import json
from typing import Optional, Dict, Any
from datetime import datetime
import requests
from decimal import Decimal

logger = logging.getLogger(__name__)


class DocuSignService:
    """Service pour l'intégration DocuSign."""

    def __init__(self):
        """Initialiser le service DocuSign avec les clés du .env"""
        self.client_id = os.getenv('DOCUSIGN_CLIENT_ID')
        self.private_key = os.getenv('DOCUSIGN_PRIVATE_KEY')
        self.user_id = os.getenv('DOCUSIGN_USER_ID')
        self.base_url = os.getenv('DOCUSIGN_BASE_URL', 'https://demo.docusign.net/restapi')
        self.oauth_url = os.getenv('DOCUSIGN_OAUTH_URL', 'account-d.docusign.com')
        self.access_token = None
        self.token_expiration = None

    def get_access_token(self) -> Optional[str]:
        """
        Obtenir un access token JWT pour DocuSign OAuth.

        Returns:
            Token d'accès ou None si erreur
        """
        if self.access_token and self.token_expiration > datetime.utcnow():
            return self.access_token

        try:
            # TODO: Implémenter l'authentification JWT
            # Utiliser docusign-esign pour générer le JWT et obtenir le token
            logger.info("🔐 DocuSign: Obtention access token")
            # import docusign
            # oauth = docusign.OAuth.from_file(...)
            # self.access_token = oauth.get_token()
            return self.access_token
        except Exception as e:
            logger.error(f"❌ DocuSign: Erreur authentification: {e}")
            return None

    def generer_lien_signature(
        self,
        contrat_pdf_url: str,
        email_signataire: str,
        nom_signataire: str,
        type_document: str = "compromis"
    ) -> Optional[str]:
        """
        Générer un lien de signature pour un document.

        Args:
            contrat_pdf_url: URL du PDF à signer
            email_signataire: Email du signataire
            nom_signataire: Nom du signataire
            type_document: Type du document (compromis, acte_authentique)

        Returns:
            URL de signature DocuSign ou None si erreur
        """
        try:
            token = self.get_access_token()
            if not token:
                raise Exception("Impossible d'obtenir le token DocuSign")

            logger.info(f"📝 DocuSign: Génération lien signature pour {email_signataire}")

            # TODO: Implémenter l'envoi du document via DocuSign API
            # 1. Télécharger le PDF depuis contrat_pdf_url
            # 2. Créer un enveloppe DocuSign
            # 3. Ajouter le destinataire
            # 4. Retourner l'URL de signature

            # Exemple de réponse:
            signature_url = f"https://demo.docusign.net/ds/consume/{type_document}..."
            return signature_url

        except Exception as e:
            logger.error(f"❌ DocuSign: Erreur génération lien: {e}")
            return None

    def verifier_signature(self, envelope_id: str) -> bool:
        """
        Vérifier si un document a été signé.

        Args:
            envelope_id: ID de l'enveloppe DocuSign

        Returns:
            True si signé, False sinon
        """
        try:
            # TODO: Implémenter la vérification
            logger.info(f"✅ DocuSign: Vérification signature {envelope_id}")
            return True
        except Exception as e:
            logger.error(f"❌ DocuSign: Erreur vérification: {e}")
            return False

    def telecharger_document_signe(self, envelope_id: str) -> Optional[bytes]:
        """
        Télécharger un document après signature.

        Args:
            envelope_id: ID de l'enveloppe DocuSign

        Returns:
            Contenu du PDF signé ou None si erreur
        """
        try:
            # TODO: Implémenter le téléchargement
            logger.info(f"📥 DocuSign: Téléchargement document {envelope_id}")
            return None
        except Exception as e:
            logger.error(f"❌ DocuSign: Erreur téléchargement: {e}")
            return None


class StripeService:
    """Service pour l'intégration Stripe."""

    def __init__(self):
        """Initialiser le service Stripe avec les clés du .env"""
        self.secret_key = os.getenv('STRIPE_SECRET_KEY')
        self.public_key = os.getenv('STRIPE_PUBLIC_KEY')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

        # Importer stripe et configurer
        try:
            import stripe
            stripe.api_key = self.secret_key
            self.stripe = stripe
            logger.info("✅ Stripe: Service initialisé")
        except ImportError:
            logger.error("❌ Stripe: Module non installé")
            self.stripe = None

    def creer_payment_intent(
        self,
        montant: Decimal,
        devise: str = "eur",
        description: str = "",
        metadata: Dict[str, Any] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Créer un PaymentIntent Stripe.

        Args:
            montant: Montant en euros (Decimal)
            devise: Devise (eur, usd, etc.)
            description: Description du paiement
            metadata: Métadonnées personnalisées

        Returns:
            Dictionnaire avec client_secret et payment_intent_id ou None si erreur
        """
        try:
            if not self.stripe:
                raise Exception("Stripe non configuré")

            # Convertir montant en centimes pour Stripe
            amount_cents = int(montant * 100)

            intent = self.stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=devise,
                description=description,
                metadata=metadata or {}
            )

            logger.info(f"✅ Stripe: PaymentIntent créé {intent['id']}")

            return {
                'payment_intent_id': intent['id'],
                'client_secret': intent['client_secret'],
                'amount': montant,
                'currency': devise
            }

        except Exception as e:
            logger.error(f"❌ Stripe: Erreur création PaymentIntent: {e}")
            return None

    def confirmer_payment(self, payment_intent_id: str) -> Optional[Dict[str, Any]]:
        """
        Confirmer un PaymentIntent (après paiement client).

        Args:
            payment_intent_id: ID du PaymentIntent

        Returns:
            Détails du paiement confirmé ou None si erreur
        """
        try:
            if not self.stripe:
                raise Exception("Stripe non configuré")

            intent = self.stripe.PaymentIntent.retrieve(payment_intent_id)

            if intent['status'] == 'succeeded':
                logger.info(f"✅ Stripe: Paiement confirmé {payment_intent_id}")
                return {
                    'status': 'succeeded',
                    'charge_id': intent.get('charges')['data'][0]['id'] if intent.get('charges') else None,
                    'amount': intent['amount'] / 100
                }
            else:
                logger.warning(f"⚠️  Stripe: Paiement pas confirmé {payment_intent_id} ({intent['status']})")
                return None

        except Exception as e:
            logger.error(f"❌ Stripe: Erreur confirmation: {e}")
            return None

    def creer_remboursement(
        self,
        charge_id: str,
        montant: Optional[Decimal] = None,
        motif: str = "requested_by_customer"
    ) -> Optional[Dict[str, Any]]:
        """
        Créer un remboursement Stripe.

        Args:
            charge_id: ID de la charge à rembourser
            montant: Montant à rembourser (None = remboursement total)
            motif: Motif du remboursement

        Returns:
            Dictionnaire du remboursement ou None si erreur
        """
        try:
            if not self.stripe:
                raise Exception("Stripe non configuré")

            kwargs = {
                'charge': charge_id,
                'reason': motif
            }

            if montant:
                kwargs['amount'] = int(montant * 100)

            refund = self.stripe.Refund.create(**kwargs)

            logger.info(f"✅ Stripe: Remboursement créé {refund['id']}")

            return {
                'refund_id': refund['id'],
                'status': refund['status'],
                'amount': refund['amount'] / 100
            }

        except Exception as e:
            logger.error(f"❌ Stripe: Erreur remboursement: {e}")
            return None


class SendGridService:
    """Service pour l'intégration SendGrid."""

    def __init__(self):
        """Initialiser le service SendGrid avec la clé du .env"""
        self.api_key = os.getenv('SENDGRID_API_KEY')

        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            self.client = SendGridAPIClient(self.api_key)
            self.Mail = Mail
            logger.info("✅ SendGrid: Service initialisé")
        except ImportError:
            logger.error("❌ SendGrid: Module non installé")
            self.client = None
            self.Mail = None

    def envoyer_email(
        self,
        destinataire: str,
        sujet: str,
        contenu_html: str,
        expediteur: str = "noreply@immo2000.fr",
        nom_expediteur: str = "Immo2000"
    ) -> bool:
        """
        Envoyer un email via SendGrid.

        Args:
            destinataire: Email du destinataire
            sujet: Sujet du mail
            contenu_html: Contenu HTML du mail
            expediteur: Email de l'expéditeur
            nom_expediteur: Nom de l'expéditeur

        Returns:
            True si succès, False sinon
        """
        try:
            if not self.client:
                raise Exception("SendGrid non configuré")

            message = self.Mail(
                from_email=(expediteur, nom_expediteur),
                to_emails=destinataire,
                subject=sujet,
                html_content=contenu_html
            )

            response = self.client.send(message)

            if response.status_code == 202:
                logger.info(f"✅ SendGrid: Email envoyé à {destinataire}")
                return True
            else:
                logger.warning(f"⚠️  SendGrid: Status {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"❌ SendGrid: Erreur envoi email: {e}")
            return False

    def envoyer_email_offre_proposee(self, vendeur_email: str, acheteur_nom: str, montant: Decimal) -> bool:
        """Envoyer email notification nouvelle offre."""
        contenu = f"""
        <h2>Nouvelle offre reçue!</h2>
        <p>Un acheteur ({acheteur_nom}) a proposé <strong>{montant}€</strong> pour votre bien.</p>
        <p>Connectez-vous pour répondre: <a href="https://immo2000.fr">Immo2000</a></p>
        """
        return self.envoyer_email(vendeur_email, "Nouvelle offre sur votre annonce", contenu)

    def envoyer_email_rappel_offre(self, vendeur_email: str, montant: Decimal) -> bool:
        """Envoyer rappel pour offre en attente."""
        contenu = f"""
        <h2>Rappel: Offre en attente de réponse</h2>
        <p>Vous avez une offre de <strong>{montant}€</strong> qui attend votre réponse depuis 24h.</p>
        <p><a href="https://immo2000.fr/offres">Répondre maintenant</a></p>
        """
        return self.envoyer_email(vendeur_email, "Rappel: répondez à l'offre", contenu)

    def envoyer_email_paiement_depot(self, acheteur_email: str, montant: Decimal) -> bool:
        """Envoyer rappel pour paiement dépôt."""
        contenu = f"""
        <h2>Paiement du dépôt de garantie</h2>
        <p>Veuillez effectuer le paiement du dépôt de <strong>{montant}€</strong>.</p>
        <p><a href="https://immo2000.fr/transactions">Payer maintenant</a></p>
        """
        return self.envoyer_email(acheteur_email, "Paiement du dépôt de garantie", contenu)


class S3Service:
    """Service pour l'intégration AWS S3."""

    def __init__(self):
        """Initialiser le service S3 avec les clés du .env"""
        self.access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.bucket = os.getenv('AWS_S3_BUCKET')
        self.region = os.getenv('AWS_S3_REGION', 'eu-west-1')

        try:
            import boto3
            self.client = boto3.client(
                's3',
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region
            )
            logger.info("✅ AWS S3: Service initialisé")
        except ImportError:
            logger.error("❌ AWS S3: Module boto3 non installé")
            self.client = None

    def upload_fichier(
        self,
        contenu: bytes,
        nom_fichier: str,
        transaction_id: int,
        type_document: str = "document"
    ) -> Optional[str]:
        """
        Uploader un fichier sur S3.

        Args:
            contenu: Contenu du fichier (bytes)
            nom_fichier: Nom du fichier
            transaction_id: ID de la transaction (pour l'organisation du bucket)
            type_document: Type de document (compromis, acte, etc.)

        Returns:
            URL du fichier sur S3 ou None si erreur
        """
        try:
            if not self.client:
                raise Exception("S3 non configuré")

            # Chemin: transactions/{transaction_id}/{type_document}/{nom_fichier}
            key = f"transactions/{transaction_id}/{type_document}/{nom_fichier}"

            self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=contenu,
                ContentType="application/pdf"
            )

            url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"
            logger.info(f"✅ S3: Fichier uploadé {key}")
            return url

        except Exception as e:
            logger.error(f"❌ S3: Erreur upload: {e}")
            return None

    def telecharger_fichier(self, key: str) -> Optional[bytes]:
        """
        Télécharger un fichier depuis S3.

        Args:
            key: Clé du fichier (chemin dans S3)

        Returns:
            Contenu du fichier ou None si erreur
        """
        try:
            if not self.client:
                raise Exception("S3 non configuré")

            response = self.client.get_object(Bucket=self.bucket, Key=key)
            contenu = response['Body'].read()

            logger.info(f"✅ S3: Fichier téléchargé {key}")
            return contenu

        except Exception as e:
            logger.error(f"❌ S3: Erreur téléchargement: {e}")
            return None

    def supprimer_fichier(self, key: str) -> bool:
        """
        Supprimer un fichier de S3.

        Args:
            key: Clé du fichier

        Returns:
            True si succès, False sinon
        """
        try:
            if not self.client:
                raise Exception("S3 non configuré")

            self.client.delete_object(Bucket=self.bucket, Key=key)
            logger.info(f"✅ S3: Fichier supprimé {key}")
            return True

        except Exception as e:
            logger.error(f"❌ S3: Erreur suppression: {e}")
            return False


# Singletons pour accès global
_docusign_service = None
_stripe_service = None
_sendgrid_service = None
_s3_service = None


def get_docusign_service() -> DocuSignService:
    """Obtenir l'instance singleton du service DocuSign."""
    global _docusign_service
    if _docusign_service is None:
        _docusign_service = DocuSignService()
    return _docusign_service


def get_stripe_service() -> StripeService:
    """Obtenir l'instance singleton du service Stripe."""
    global _stripe_service
    if _stripe_service is None:
        _stripe_service = StripeService()
    return _stripe_service


def get_sendgrid_service() -> SendGridService:
    """Obtenir l'instance singleton du service SendGrid."""
    global _sendgrid_service
    if _sendgrid_service is None:
        _sendgrid_service = SendGridService()
    return _sendgrid_service


def get_s3_service() -> S3Service:
    """Obtenir l'instance singleton du service S3."""
    global _s3_service
    if _s3_service is None:
        _s3_service = S3Service()
    return _s3_service
