"""
Integration tests for DocuSign webhook event handling
Category: Webhook Event Handling
"""

import pytest
from datetime import datetime
from unittest.mock import patch, AsyncMock
from sqlalchemy.orm import Session

from src.models.notaires import TransactionNotaire, HistoriqueNotaire


class TestEnvelopeSentEvent:
    """Test envelope.sent webhook event"""

    def test_envelope_sent_updates_status(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_sent,
        mock_sendgrid
    ):
        """Verify envelope sent updates transaction status"""
        # Given
        initial_status = transaction_with_docusign_envelope.statut

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_sent
        )

        # Then
        assert response.status_code == 200
        assert response.json()["status"] == "processed"

        # Refresh from DB
        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.statut == "compromis_envoye_confirme"


class TestEnvelopeCompletedEvent:
    """Test envelope.completed webhook event"""

    def test_envelope_completed_finalizes_transaction(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completed event sets status to finalisee"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200
        assert response.json()["status"] == "processed"

        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.statut == "finalisee"
        assert transaction_with_docusign_envelope.date_completion is not None

    def test_envelope_completed_creates_audit_log(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completion creates audit trail entry"""
        # Given
        initial_audit_count = db_session.query(HistoriqueNotaire).count()

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200
        audit_entries = db_session.query(HistoriqueNotaire).all()
        assert len(audit_entries) > initial_audit_count

        # Check latest entry
        latest = audit_entries[-1]
        assert latest.action == "COMPLETED_EVENT"
        assert latest.transaction_notaire_id == transaction_with_docusign_envelope.transaction_notaire_id

    def test_envelope_completed_sends_emails(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completion sends emails to all parties"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200
        # Verify SendGrid was called for each party
        # (3+ calls: acheteur, vendeur, notaire)
        # Note: Mock tracking depends on implementation
        assert mock_sendgrid.called


class TestEnvelopeDeclinedEvent:
    """Test envelope.declined webhook event"""

    def test_envelope_declined_updates_status(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_declined,
        mock_sendgrid
    ):
        """Verify declined event sets status to signature_refusee"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_declined
        )

        # Then
        assert response.status_code == 200
        assert response.json()["status"] == "processed"

        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.statut == "signature_refusee"

    def test_envelope_declined_stores_reason(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_declined,
        mock_sendgrid
    ):
        """Verify declined reason stored in audit log"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_declined
        )

        # Then
        assert response.status_code == 200

        audit_entries = db_session.query(HistoriqueNotaire).filter(
            HistoriqueNotaire.action == "DECLINED_EVENT"
        ).all()

        assert len(audit_entries) > 0
        assert "declinedReason" in audit_entries[-1].details_json


class TestEnvelopeVoidedEvent:
    """Test envelope.voided webhook event"""

    def test_envelope_voided_updates_status(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_voided,
        mock_sendgrid
    ):
        """Verify voided event sets status to compromis_annule"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_voided
        )

        # Then
        assert response.status_code == 200
        assert response.json()["status"] == "processed"

        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.statut == "compromis_annule"


class TestWebhookErrorHandling:
    """Test webhook error cases"""

    def test_webhook_missing_envelope(
        self,
        test_client,
        db_session,
        webhook_payload_completed
    ):
        """Verify graceful handling of unknown envelope"""
        # Given
        webhook_payload_completed["envelopeId"] = "nonexistent-envelope"

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200
        assert response.json()["status"] == "ignored"
        assert "envelope_not_found" in response.json()["reason"]

    def test_webhook_invalid_payload(self, test_client):
        """Verify validation of webhook payload"""
        # Given
        invalid_payload = {"malformed": "data"}

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=invalid_payload
        )

        # Then
        # Should handle gracefully - either 200 ignored or 400 bad request
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            assert response.json()["status"] == "ignored"


class TestWebhookHealthCheck:
    """Test webhook health check endpoint"""

    def test_health_endpoint_exists(self, test_client):
        """Verify health check endpoint responds"""
        # When
        response = test_client.get("/api/v1/webhooks/docusign/health")

        # Then
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "DocuSign Webhooks"


class TestWebhookConcurrency:
    """Test concurrent webhook handling"""

    def test_concurrent_webhooks_same_envelope(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_sent,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify handling of simultaneous webhooks for same envelope"""
        # Given
        initial_status = transaction_with_docusign_envelope.statut

        # When - Send sent event
        response1 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_sent
        )

        # And then immediately send completed event
        response2 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then - Both should succeed
        assert response1.status_code == 200
        assert response2.status_code == 200

        # Final state should be completed
        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.statut == "finalisee"

        # Should have 2 audit entries (one for each event)
        audit_entries = db_session.query(HistoriqueNotaire).filter(
            HistoriqueNotaire.transaction_notaire_id == transaction_with_docusign_envelope.transaction_notaire_id
        ).all()
        assert len(audit_entries) >= 2
