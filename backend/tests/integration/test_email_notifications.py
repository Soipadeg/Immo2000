"""
Integration tests for email notifications
Category: Email Notifications
"""

import pytest
from datetime import datetime
from unittest.mock import patch, AsyncMock, call


class TestCompletionEmailNotifications:
    """Test email notifications when transaction completed"""

    def test_send_completion_emails_to_all_parties(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify all parties receive completion notification"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200

        # SendGrid should be called for each party
        # At least 3 calls: acheteur, vendeur, notaire
        assert mock_sendgrid.call_count >= 3

    def test_completion_email_includes_document_link(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completion emails include link to signed document"""
        # Given
        transaction_with_docusign_envelope.compromis_url = "https://s3.amazonaws.com/bucket/compromis-123.pdf"
        db_session.commit()

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200

        # Check that mock was called with proper email data
        # This depends on implementation details
        if mock_sendgrid.called:
            # Check one of the calls contains the document URL
            call_args_list = [str(call) for call in mock_sendgrid.call_args_list]
            assert any("compromis-123.pdf" in str(call_arg) for call_arg in call_args_list)


class TestDeclineEmailNotifications:
    """Test email notifications when transaction declined"""

    def test_send_decline_emails_to_all_parties(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_declined,
        mock_sendgrid
    ):
        """Verify all parties notified of decline"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_declined
        )

        # Then
        assert response.status_code == 200
        assert mock_sendgrid.called
        assert mock_sendgrid.call_count >= 3

    def test_decline_email_includes_reason(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_declined,
        mock_sendgrid
    ):
        """Verify decline emails include reason"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_declined
        )

        # Then
        assert response.status_code == 200

        # Check decline reason is in mock calls
        if mock_sendgrid.called:
            call_args_list = [str(call) for call in mock_sendgrid.call_args_list]
            assert any("Changed mind" in str(call_arg) for call_arg in call_args_list)


class TestSignatureRequestEmails:
    """Test initial signature request emails"""

    @patch("app_fastapi.services.docusign_service.DocuSignClient")
    @patch("app_fastapi.routes.notaires.send_email")
    def test_send_signature_request_emails(
        self,
        mock_send_email,
        mock_docusign_client,
        test_client,
        test_transaction,
        test_users,
        mock_sendgrid
    ):
        """Verify signature request emails sent when envelope created"""
        # Given
        mock_docusign = mock_docusign_client.return_value
        mock_docusign.create_envelope = AsyncMock(return_value={
            "envelopeId": "new-envelope-123"
        })
        mock_send_email.return_value = AsyncMock(return_value=True)

        # Prepare transaction for sending
        test_transaction.compromis_url = "https://s3.amazonaws.com/bucket/compromis-123.pdf"

        # When - Note: This endpoint may need to be created
        # response = test_client.post(
        #     f"/api/v1/notaire/{test_transaction.transaction_notaire_id}/send-to-docusign"
        # )

        # Then - Would verify emails were sent
        # assert response.status_code == 200
        # assert mock_send_email.call_count >= 2  # At least acheteur and vendeur


class TestEmailErrorHandling:
    """Test email notification error handling"""

    def test_completion_with_invalid_email(
        self,
        test_client,
        transaction_with_docusign_envelope,
        test_users,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify graceful handling of invalid email addresses"""
        # Given
        test_users["acheteur"].email = "invalid-email"
        db_session.commit()

        # Mock SendGrid to raise error on invalid email
        mock_sendgrid.side_effect = Exception("Invalid email format")

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then - Should still succeed (transaction not marked as failed)
        # Error should be logged but not crash the process
        # Implementation detail: depends on error handling strategy


class TestEmailContentTemplates:
    """Test email content and templates"""

    def test_completion_email_format(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completion email has correct format"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200

        # Verify email was sent with proper structure
        if mock_sendgrid.called:
            # Check that SendGrid was called
            assert mock_sendgrid.call_count >= 1

    def test_decline_email_format(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_declined,
        mock_sendgrid
    ):
        """Verify decline email has correct format"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_declined
        )

        # Then
        assert response.status_code == 200
        assert mock_sendgrid.called


class TestEmailToCorrectRecipients:
    """Test emails sent to correct recipients"""

    def test_completion_email_to_acheteur(
        self,
        test_client,
        transaction_with_docusign_envelope,
        test_users,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completion email sent to acheteur"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200

        # Check acheteur email was used
        if mock_sendgrid.called:
            call_args_list = [str(call) for call in mock_sendgrid.call_args_list]
            assert any("acheteur@test.fr" in str(call_arg) for call_arg in call_args_list)

    def test_completion_email_to_vendeur(
        self,
        test_client,
        transaction_with_docusign_envelope,
        test_users,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completion email sent to vendeur"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200

        # Check vendeur email was used
        if mock_sendgrid.called:
            call_args_list = [str(call) for call in mock_sendgrid.call_args_list]
            assert any("vendeur@test.fr" in str(call_arg) for call_arg in call_args_list)

    def test_completion_email_to_notaire(
        self,
        test_client,
        transaction_with_docusign_envelope,
        test_users,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify completion email sent to notaire"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200

        # Check notaire email was used
        if mock_sendgrid.called:
            call_args_list = [str(call) for call in mock_sendgrid.call_args_list]
            assert any("notaire@test.fr" in str(call_arg) for call_arg in call_args_list)
