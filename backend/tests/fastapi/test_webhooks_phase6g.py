"""
Tests Phase 6g - Webhooks DocuSign au niveau Transaction
Tests des routes, notifications, et audit trail
"""

import pytest
from unittest.mock import patch, AsyncMock
from src.models.notaires import TransactionNotaire, HistoriqueNotaire


# ============================================================================
# Fixture
# ============================================================================

@pytest.fixture
def webhook_transaction(db_session):
    """Transaction de test pour les webhooks (sans dépendances complexes)."""
    transaction = TransactionNotaire(
        offre_id=1,
        annonce_id=1,
        acheteur_id=1,
        vendeur_id=1,
        notaire_id=1,
        statut="compromis_envoye",
        prix_compromis=250000,
        frais_notaire=2500,
        frais_immo2000=5000
    )
    db_session.add(transaction)
    db_session.commit()
    db_session.refresh(transaction)
    return transaction


# ============================================================================
# Tests - Webhook Completed
# ============================================================================

class TestWebhookCompleted:
    """Tests du webhook avec statut 'completed'."""

    def test_webhook_completed_finalizes_transaction(self, client, db_session, webhook_transaction):
        """Test que webhook completed finalise la transaction."""
        webhook_transaction.docusign_envelope_id = "envelope-complete-123"
        db_session.commit()

        payload = {
            "envelopeId": "envelope-complete-123",
            "status": "completed",
            "completedDateTime": "2026-05-19T12:00:00Z"
        }

        response = client.post("/api/v1/webhooks/docusign/envelope-status", json=payload)

        assert response.status_code == 200
        assert response.json()["status"] == "processed"

        updated = db_session.query(TransactionNotaire).filter_by(
            transaction_notaire_id=webhook_transaction.transaction_notaire_id
        ).first()
        assert updated.statut == "finalisee"

    def test_webhook_completed_creates_audit_log(self, client, db_session, webhook_transaction):
        """Test que completed crée un audit log."""
        webhook_transaction.docusign_envelope_id = "envelope-complete-234"
        db_session.commit()

        payload = {
            "envelopeId": "envelope-complete-234",
            "status": "completed"
        }

        response = client.post("/api/v1/webhooks/docusign/envelope-status", json=payload)
        assert response.status_code == 200

        audit = db_session.query(HistoriqueNotaire).filter_by(
            transaction_notaire_id=webhook_transaction.transaction_notaire_id
        ).first()
        assert audit is not None
        assert audit.action == "SIGNATURE_COMPLETE"


# ============================================================================
# Tests - Webhook Declined
# ============================================================================

class TestWebhookDeclined:
    """Tests du webhook avec statut 'declined'."""

    def test_webhook_declined_updates_status(self, client, db_session, webhook_transaction):
        """Test que webhook declined met le statut à signature_refusee."""
        webhook_transaction.docusign_envelope_id = "envelope-decline-123"
        db_session.commit()

        payload = {
            "envelopeId": "envelope-decline-123",
            "status": "declined",
            "recipientStatuses": [
                {
                    "type": "signer",
                    "email": "acheteur@test.com",
                    "status": "declined"
                }
            ]
        }

        response = client.post("/api/v1/webhooks/docusign/envelope-status", json=payload)
        assert response.status_code == 200

        updated = db_session.query(TransactionNotaire).filter_by(
            transaction_notaire_id=webhook_transaction.transaction_notaire_id
        ).first()
        assert updated.statut == "signature_refusee"
        assert "acheteur@test.com" in updated.notes_internes


# ============================================================================
# Tests - Webhook Sent
# ============================================================================

class TestWebhookSent:
    """Tests du webhook avec statut 'sent'."""

    def test_webhook_sent_updates_status(self, client, db_session, webhook_transaction):
        """Test que webhook sent met à jour le statut."""
        webhook_transaction.docusign_envelope_id = "envelope-sent-123"
        db_session.commit()

        payload = {
            "envelopeId": "envelope-sent-123",
            "status": "sent"
        }

        response = client.post("/api/v1/webhooks/docusign/envelope-status", json=payload)
        assert response.status_code == 200

        updated = db_session.query(TransactionNotaire).filter_by(
            transaction_notaire_id=webhook_transaction.transaction_notaire_id
        ).first()
        assert updated.statut == "compromis_envoye_confirme"


# ============================================================================
# Tests - Webhook Voided
# ============================================================================

class TestWebhookVoided:
    """Tests du webhook avec statut 'voided'."""

    def test_webhook_voided_updates_status(self, client, db_session, webhook_transaction):
        """Test que webhook voided annule la transaction."""
        webhook_transaction.docusign_envelope_id = "envelope-void-123"
        db_session.commit()

        payload = {
            "envelopeId": "envelope-void-123",
            "status": "voided"
        }

        response = client.post("/api/v1/webhooks/docusign/envelope-status", json=payload)
        assert response.status_code == 200

        updated = db_session.query(TransactionNotaire).filter_by(
            transaction_notaire_id=webhook_transaction.transaction_notaire_id
        ).first()
        assert updated.statut == "compromis_annule"


# ============================================================================
# Tests - Errors
# ============================================================================

class TestWebhookErrors:
    """Tests des erreurs et cas limites."""

    def test_webhook_envelope_not_found(self, client):
        """Test webhook avec enveloppe inexistante."""
        payload = {
            "envelopeId": "unknown-envelope-999",
            "status": "completed"
        }

        response = client.post("/api/v1/webhooks/docusign/envelope-status", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ignored"
        assert data["reason"] == "envelope_not_found"

    def test_webhook_health_check(self, client):
        """Test l'endpoint health du webhook."""
        response = client.get("/api/v1/webhooks/docusign/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
