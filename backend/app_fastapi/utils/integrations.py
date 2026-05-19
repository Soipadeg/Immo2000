"""Intégrations asynchrones avec services externes (Stripe, DocuSign, SendGrid)."""
import httpx
import logging
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class StripeIntegration:
    """Intégration avec Stripe pour les paiements."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.stripe.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

    async def get_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Récupérer les détails d'un payment intent."""
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/payment_intents/{payment_intent_id}"
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def retrieve_charge(self, charge_id: str) -> Dict[str, Any]:
        """Récupérer les détails d'une charge."""
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/charges/{charge_id}"
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def refund_payment(self, payment_intent_id: str, amount: Optional[int] = None) -> Dict[str, Any]:
        """Rembourser un paiement."""
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/refunds"
            data = {"payment_intent": payment_intent_id}
            if amount:
                data["amount"] = amount

            response = await client.post(url, headers=self.headers, data=data)
            response.raise_for_status()
            return response.json()


class DocuSignIntegration:
    """Intégration avec DocuSign pour les signatures numériques."""

    def __init__(self, api_key: str, account_id: str, base_url: str = "https://demo.docusign.net"):
        self.api_key = api_key
        self.account_id = account_id
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    async def get_envelope_status(self, envelope_id: str) -> Dict[str, Any]:
        """Récupérer le statut d'une enveloppe (document à signer)."""
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/restapi/v2.1/accounts/{self.account_id}/envelopes/{envelope_id}"
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def send_envelope(
        self,
        document_url: str,
        signer_email: str,
        signer_name: str,
        subject: str,
        message: str
    ) -> Dict[str, Any]:
        """Envoyer un document pour signature."""
        payload = {
            "emailSubject": subject,
            "emailBlurb": message,
            "status": "sent",
            "recipients": {
                "signers": [
                    {
                        "email": signer_email,
                        "name": signer_name,
                        "recipientId": "1",
                        "routingOrder": "1"
                    }
                ]
            },
            "documents": [
                {
                    "documentBase64": "",  # À remplir avec le contenu du document
                    "name": "Document",
                    "fileExtension": "pdf",
                    "documentId": "1"
                }
            ]
        }

        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/restapi/v2.1/accounts/{self.account_id}/envelopes"
            response = await client.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()


class SendGridIntegration:
    """Intégration avec SendGrid pour les emails."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.sendgrid.com/v3"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str = "noreply@immo2000.fr",
        from_name: str = "Immo2000"
    ) -> Dict[str, Any]:
        """Envoyer un email via SendGrid."""
        payload = {
            "personalizations": [
                {
                    "to": [{"email": to_email}],
                    "subject": subject
                }
            ],
            "from": {
                "email": from_email,
                "name": from_name
            },
            "content": [
                {
                    "type": "text/html",
                    "value": html_content
                }
            ]
        }

        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/mail/send"
            response = await client.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def send_transaction_notification(
        self,
        recipient_email: str,
        transaction_id: int,
        event_type: str  # "payment_confirmed", "document_signed", "transaction_finalized"
    ) -> bool:
        """Envoyer une notification pour une transaction."""
        subject_map = {
            "payment_confirmed": "Paiement confirmé",
            "document_signed": "Document signé",
            "transaction_finalized": "Transaction finalisée"
        }

        subject = subject_map.get(event_type, "Notification Immo2000")
        html_content = f"""
        <html>
            <body>
                <h2>{subject}</h2>
                <p>Transaction #{transaction_id} a été mise à jour.</p>
                <p><a href="https://immo2000.fr/transactions/{transaction_id}">Voir détails</a></p>
            </body>
        </html>
        """

        try:
            await self.send_email(recipient_email, subject, html_content)
            return True
        except Exception as e:
            logger.error(f"Erreur SendGrid: {e}")
            return False


class AWSIntegration:
    """Intégration avec AWS S3 pour le stockage de documents."""

    def __init__(self, access_key: str, secret_key: str, bucket_name: str, region: str = "eu-west-1"):
        self.access_key = access_key
        self.secret_key = secret_key
        self.bucket_name = bucket_name
        self.region = region

    async def upload_document(self, file_content: bytes, file_name: str, content_type: str = "application/pdf") -> str:
        """Uploader un document sur S3."""
        # Note: Dans une implémentation réelle, utiliser boto3 de manière async
        # Pour maintenant, c'est un placeholder
        logger.info(f"Uploading {file_name} to S3")
        return f"s3://{self.bucket_name}/documents/{file_name}"

    async def get_document_url(self, file_name: str, expires_in: int = 3600) -> str:
        """Générer une URL présignée pour accéder à un document."""
        # URL placeholder - en production, générer une vraie URL S3 présignée
        return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/documents/{file_name}"


# Singletons pour les intégrations
stripe_client: Optional[StripeIntegration] = None
docusign_client: Optional[DocuSignIntegration] = None
sendgrid_client: Optional[SendGridIntegration] = None
aws_client: Optional[AWSIntegration] = None


def init_integrations(
    stripe_key: str,
    docusign_key: str,
    docusign_account: str,
    sendgrid_key: str,
    aws_access_key: str,
    aws_secret_key: str,
    aws_bucket: str
):
    """Initialiser les clients d'intégration."""
    global stripe_client, docusign_client, sendgrid_client, aws_client

    stripe_client = StripeIntegration(stripe_key)
    docusign_client = DocuSignIntegration(docusign_key, docusign_account)
    sendgrid_client = SendGridIntegration(sendgrid_key)
    aws_client = AWSIntegration(aws_access_key, aws_secret_key, aws_bucket)

    logger.info("Intégrations initialisées")


def get_stripe_client() -> StripeIntegration:
    """Récupérer le client Stripe."""
    if not stripe_client:
        raise RuntimeError("Stripe client not initialized")
    return stripe_client


def get_docusign_client() -> DocuSignIntegration:
    """Récupérer le client DocuSign."""
    if not docusign_client:
        raise RuntimeError("DocuSign client not initialized")
    return docusign_client


def get_sendgrid_client() -> SendGridIntegration:
    """Récupérer le client SendGrid."""
    if not sendgrid_client:
        raise RuntimeError("SendGrid client not initialized")
    return sendgrid_client


def get_aws_client() -> AWSIntegration:
    """Récupérer le client AWS."""
    if not aws_client:
        raise RuntimeError("AWS client not initialized")
    return aws_client
