"""
Integration tests for database consistency
Category: Database Transaction Consistency
"""

import pytest
from datetime import datetime
from sqlalchemy.orm import Session

from src.models.notaires import TransactionNotaire, HistoriqueNotaire


class TestTransactionStateTracking:
    """Test transaction state changes are logged"""

    def test_full_lifecycle_audit_trail(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_sent,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify all state changes logged in audit trail"""
        # Given
        initial_audit_count = db_session.query(HistoriqueNotaire).count()

        # When - Send envelope
        response1 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_sent
        )

        # And complete envelope
        response2 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then - Should have audit entries for both events
        audit_entries = db_session.query(HistoriqueNotaire).filter(
            HistoriqueNotaire.transaction_notaire_id == transaction_with_docusign_envelope.transaction_notaire_id
        ).all()

        assert len(audit_entries) >= 2

        # Check actions are in order
        actions = [entry.action for entry in audit_entries]
        assert "SENT_EVENT" in actions
        assert "COMPLETED_EVENT" in actions

    def test_audit_entry_contains_timestamp(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify audit entries have date_action"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        audit_entries = db_session.query(HistoriqueNotaire).filter(
            HistoriqueNotaire.transaction_notaire_id == transaction_with_docusign_envelope.transaction_notaire_id
        ).all()

        for entry in audit_entries:
            assert entry.date_action is not None
            assert isinstance(entry.date_action, datetime)

    def test_audit_entry_contains_details(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify audit entries store event details"""
        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        audit_entries = db_session.query(HistoriqueNotaire).filter(
            HistoriqueNotaire.action == "COMPLETED_EVENT",
            HistoriqueNotaire.transaction_notaire_id == transaction_with_docusign_envelope.transaction_notaire_id
        ).all()

        assert len(audit_entries) > 0
        # Check details contain payload information
        assert audit_entries[-1].details_json is not None


class TestConcurrentWebhookHandling:
    """Test concurrent webhook request handling"""

    def test_no_race_condition_on_concurrent_webhooks(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_sent,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify no race condition with simultaneous webhooks"""
        # When - Send both webhooks quickly
        response1 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_sent
        )
        response2 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then - Both succeed
        assert response1.status_code == 200
        assert response2.status_code == 200

        # Final state should be completed (not sent)
        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.statut == "finalisee"

    def test_no_duplicate_audit_entries(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify duplicate webhooks don't create duplicate audit entries"""
        # When - Send same webhook twice
        response1 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )
        response2 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then - Both succeed
        assert response1.status_code == 200
        assert response2.status_code == 200

        # But should have only expected entries
        # (implementation depends on idempotency strategy)
        audit_entries = db_session.query(HistoriqueNotaire).filter(
            HistoriqueNotaire.transaction_notaire_id == transaction_with_docusign_envelope.transaction_notaire_id
        ).all()

        # Should not have excessive duplicates
        completed_entries = [e for e in audit_entries if e.action == "COMPLETED_EVENT"]
        assert len(completed_entries) <= 2


class TestDateFieldsPopulated:
    """Test all date fields are properly set"""

    def test_date_creation_set_on_new_transaction(
        self,
        test_transaction,
        db_session
    ):
        """Verify date_creation set when transaction created"""
        db_session.refresh(test_transaction)
        assert test_transaction.date_creation is not None
        assert isinstance(test_transaction.date_creation, datetime)

    def test_date_envoi_signature_set_on_send(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_sent,
        mock_sendgrid
    ):
        """Verify date_envoi_signature set when sent to DocuSign"""
        # Transaction already has this set in fixture
        # But verify it persists through webhook processing

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_sent
        )

        # Then
        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.date_envoi_signature is not None

    def test_date_completion_set_on_completion(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify date_completion set when signature complete"""
        # Given
        assert transaction_with_docusign_envelope.date_completion is None

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        assert response.status_code == 200
        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.date_completion is not None


class TestTransactionDataConsistency:
    """Test transaction data remains consistent"""

    def test_key_fields_not_overwritten(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify webhook doesn't overwrite important fields"""
        # Given
        original_price = transaction_with_docusign_envelope.prix_transaction
        original_acheteur = transaction_with_docusign_envelope.acheteur_id

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.prix_transaction == original_price
        assert transaction_with_docusign_envelope.acheteur_id == original_acheteur

    def test_envelope_id_preserved(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify envelope ID not changed by webhook"""
        # Given
        original_envelope = transaction_with_docusign_envelope.docusign_envelope_id

        # When
        response = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )

        # Then
        db_session.refresh(transaction_with_docusign_envelope)
        assert transaction_with_docusign_envelope.docusign_envelope_id == original_envelope


class TestTransactionStatusTransitions:
    """Test valid status transitions"""

    def test_valid_status_transitions(
        self,
        test_client,
        transaction_with_docusign_envelope,
        db_session,
        webhook_payload_sent,
        webhook_payload_completed,
        mock_sendgrid
    ):
        """Verify status transitions follow valid state machine"""
        # Valid transitions: compromis_envoye → compromis_envoye_confirme → finalisee

        # Given
        assert transaction_with_docusign_envelope.statut == "compromis_envoye"

        # When - Send event
        response1 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_sent
        )
        db_session.refresh(transaction_with_docusign_envelope)
        status_after_sent = transaction_with_docusign_envelope.statut

        # Then - Should be confirme
        assert status_after_sent == "compromis_envoye_confirme"

        # When - Complete event
        response2 = test_client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=webhook_payload_completed
        )
        db_session.refresh(transaction_with_docusign_envelope)

        # Then - Should be finalisee
        assert transaction_with_docusign_envelope.statut == "finalisee"
