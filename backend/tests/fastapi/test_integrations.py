"""Tests pour les clients d'intégration."""
import pytest
from unittest.mock import AsyncMock, patch
import httpx


class TestStripeIntegration:
    """Tests de l'intégration Stripe."""

    @pytest.mark.asyncio
    async def test_get_payment_intent(self, mock_stripe):
        """Test récupération d'un payment intent."""
        from app_fastapi.utils.integrations import StripeIntegration

        stripe = StripeIntegration("test_key")
        stripe.get_payment_intent = mock_stripe.get_payment_intent

        result = await stripe.get_payment_intent("pi_test123")

        assert result["id"] == "pi_test123"
        assert result["status"] == "succeeded"
        mock_stripe.get_payment_intent.assert_called_once_with("pi_test123")

    @pytest.mark.asyncio
    async def test_retrieve_charge(self, mock_stripe):
        """Test récupération d'une charge."""
        from app_fastapi.utils.integrations import StripeIntegration

        stripe = StripeIntegration("test_key")
        stripe.retrieve_charge = mock_stripe.retrieve_charge

        mock_stripe.retrieve_charge.return_value = {
            "id": "ch_test123",
            "amount": 50000,
            "status": "succeeded"
        }

        result = await stripe.retrieve_charge("ch_test123")

        assert result["id"] == "ch_test123"
        assert result["amount"] == 50000


class TestDocuSignIntegration:
    """Tests de l'intégration DocuSign."""

    @pytest.mark.asyncio
    async def test_get_envelope_status(self, mock_docusign):
        """Test récupération du statut d'une enveloppe."""
        from app_fastapi.utils.integrations import DocuSignIntegration

        docusign = DocuSignIntegration("test_key", "test_account")
        docusign.get_envelope_status = mock_docusign.get_envelope_status

        result = await docusign.get_envelope_status("envelope123")

        assert result["envelopeId"] == "envelope123"
        assert result["status"] == "completed"
        mock_docusign.get_envelope_status.assert_called_once_with("envelope123")


class TestSendGridIntegration:
    """Tests de l'intégration SendGrid."""

    @pytest.mark.asyncio
    async def test_send_email(self, mock_sendgrid):
        """Test envoi d'email."""
        from app_fastapi.utils.integrations import SendGridIntegration

        sendgrid = SendGridIntegration("test_key")
        sendgrid.send_email = mock_sendgrid.send_email

        mock_sendgrid.send_email.return_value = {"message_id": "msg123"}

        result = await sendgrid.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>Test</p>"
        )

        assert result["message_id"] == "msg123"
        mock_sendgrid.send_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_transaction_notification(self, mock_sendgrid):
        """Test envoi de notification de transaction."""
        from app_fastapi.utils.integrations import SendGridIntegration

        sendgrid = SendGridIntegration("test_key")
        sendgrid.send_transaction_notification = mock_sendgrid.send_transaction_notification

        result = await sendgrid.send_transaction_notification(
            recipient_email="user@example.com",
            transaction_id=1,
            event_type="payment_confirmed"
        )

        assert result is True
        mock_sendgrid.send_transaction_notification.assert_called_once()


class TestAWSIntegration:
    """Tests de l'intégration AWS S3."""

    @pytest.mark.asyncio
    async def test_upload_document(self):
        """Test upload d'un document."""
        from app_fastapi.utils.integrations import AWSIntegration

        aws = AWSIntegration("access_key", "secret_key", "bucket")

        result = await aws.upload_document(b"content", "test.pdf")

        assert "bucket" in result
        assert "test.pdf" in result

    @pytest.mark.asyncio
    async def test_get_document_url(self):
        """Test génération d'une URL présignée."""
        from app_fastapi.utils.integrations import AWSIntegration

        aws = AWSIntegration("access_key", "secret_key", "bucket")

        result = await aws.get_document_url("test.pdf")

        assert "bucket" in result
        assert "test.pdf" in result


class TestIntegrationInitialization:
    """Tests de l'initialisation des intégrations."""

    def test_init_integrations(self):
        """Test initialisation des clients d'intégration."""
        from app_fastapi.utils.integrations import (
            init_integrations,
            get_stripe_client,
            get_docusign_client,
            get_sendgrid_client,
            get_aws_client
        )

        init_integrations(
            stripe_key="test_stripe",
            docusign_key="test_docusign",
            docusign_account="account123",
            sendgrid_key="test_sendgrid",
            aws_access_key="access",
            aws_secret_key="secret",
            aws_bucket="bucket"
        )

        # Vérifier que les clients sont disponibles
        assert get_stripe_client() is not None
        assert get_docusign_client() is not None
        assert get_sendgrid_client() is not None
        assert get_aws_client() is not None

    def test_get_client_before_init(self):
        """Test obtention d'un client avant initialisation."""
        from app_fastapi.utils.integrations import stripe_client, get_stripe_client

        # Reset le client
        import app_fastapi.utils.integrations as integrations_module
        integrations_module.stripe_client = None

        with pytest.raises(RuntimeError):
            get_stripe_client()
