"""Tests pour les webhooks."""
import pytest
import json


# ============================================================================
# Phase 6g Fixtures
# ============================================================================

@pytest.fixture
def webhook_transaction(db_session):
    """Transaction de test pour les webhooks (sans dépendances complexes)."""
    from src.models.notaires import TransactionNotaire

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
# Stripe Webhooks
# ============================================================================

class TestStripeWebhook:
    """Tests du webhook Stripe."""

    def test_webhook_payment_intent_succeeded(self, client, db_session):
        """Test webhook payment_intent.succeeded."""
        from src.models.paiements import Paiement

        # Créer un paiement de test
        paiement = Paiement(
            transaction_notaire_id=1,
            utilisateur_id=1,
            montant=10000,
            type_paiement="depot",
            stripe_payment_intent_id="pi_test123",
            statut="en_attente",
            date_paiement=None
        )
        db_session.add(paiement)
        db_session.commit()

        # Envoyer l'événement webhook
        webhook_data = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_test123",
                    "status": "succeeded"
                }
            }
        }

        response = client.post(
            "/api/v1/paiements/webhook/stripe",
            json=webhook_data
        )

        assert response.status_code == 200

        # Vérifier que le paiement est mis à jour
        updated_paiement = db_session.query(Paiement).filter(
            Paiement.stripe_payment_intent_id == "pi_test123"
        ).first()
        assert updated_paiement.statut == "reussi"

    def test_webhook_charge_failed(self, client, db_session):
        """Test webhook charge.failed."""
        from src.models.paiements import Paiement

        # Créer un paiement de test
        paiement = Paiement(
            transaction_notaire_id=1,
            utilisateur_id=1,
            montant=10000,
            type_paiement="depot",
            stripe_payment_intent_id="pi_test456",
            statut="en_attente",
            date_paiement=None
        )
        db_session.add(paiement)
        db_session.commit()

        # Envoyer l'événement webhook
        webhook_data = {
            "type": "charge.failed",
            "data": {
                "object": {
                    "payment_intent": "pi_test456"
                }
            }
        }

        response = client.post(
            "/api/v1/paiements/webhook/stripe",
            json=webhook_data
        )

        assert response.status_code == 200

        # Vérifier que le paiement est marqué comme échoué
        updated_paiement = db_session.query(Paiement).filter(
            Paiement.stripe_payment_intent_id == "pi_test456"
        ).first()
        assert updated_paiement.statut == "echoue"

    def test_webhook_charge_refunded(self, client, db_session):
        """Test webhook charge.refunded."""
        from src.models.paiements import Paiement

        # Créer un paiement de test
        paiement = Paiement(
            transaction_notaire_id=1,
            utilisateur_id=1,
            montant=10000,
            type_paiement="depot",
            stripe_payment_intent_id="pi_test789",
            statut="reussi",
            date_paiement=None
        )
        db_session.add(paiement)
        db_session.commit()

        # Envoyer l'événement webhook
        webhook_data = {
            "type": "charge.refunded",
            "data": {
                "object": {
                    "payment_intent": "pi_test789"
                }
            }
        }

        response = client.post(
            "/api/v1/paiements/webhook/stripe",
            json=webhook_data
        )

        assert response.status_code == 200

        # Vérifier que le paiement est marqué comme remboursé
        updated_paiement = db_session.query(Paiement).filter(
            Paiement.stripe_payment_intent_id == "pi_test789"
        ).first()
        assert updated_paiement.statut == "remboursé"

    def test_webhook_missing_signature(self, client):
        """Test webhook sans signature."""
        webhook_data = {
            "type": "payment_intent.succeeded",
            "data": {}
        }

        response = client.post(
            "/api/v1/paiements/webhook/stripe",
            json=webhook_data
        )

        # Peut être 400 ou 401 selon l'implémentation
        assert response.status_code in [400, 401]


class TestDocuSignWebhook:
    """Tests du webhook DocuSign."""

    def test_webhook_envelope_completed(self, client, db_session, sample_transaction):
        """Test webhook envelope.completed."""
        from src.models.documents import Document

        # Créer un document de test
        document = Document(
            transaction_notaire_id=sample_transaction.transaction_notaire_id,
            type_document="compromis",
            url_s3="s3://bucket/document.pdf",
            statut_signature="en_attente_signature",
            docusign_envelope_id="envelope123",
            date_creation=None
        )
        db_session.add(document)
        db_session.commit()

        # Envoyer l'événement webhook
        webhook_data = {
            "data": {
                "envelopeId": "envelope123",
                "status": "completed"
            }
        }

        response = client.post(
            "/api/v1/documents/webhook/docusign",
            json=webhook_data
        )

        assert response.status_code == 200

        # Vérifier que le document est marqué comme signé
        updated_doc = db_session.query(Document).filter(
            Document.docusign_envelope_id == "envelope123"
        ).first()
        assert updated_doc.statut_signature == "signe"
        assert updated_doc.date_signature is not None

    def test_webhook_envelope_declined(self, client, db_session, sample_transaction):
        """Test webhook envelope.declined."""
        from src.models.documents import Document

        # Créer un document de test
        document = Document(
            transaction_notaire_id=sample_transaction.transaction_notaire_id,
            type_document="compromis",
            url_s3="s3://bucket/document.pdf",
            statut_signature="en_attente_signature",
            docusign_envelope_id="envelope456",
            date_creation=None
        )
        db_session.add(document)
        db_session.commit()

        # Envoyer l'événement webhook
        webhook_data = {
            "data": {
                "envelopeId": "envelope456",
                "status": "declined"
            }
        }

        response = client.post(
            "/api/v1/documents/webhook/docusign",
            json=webhook_data
        )

        assert response.status_code == 200

        # Vérifier que le document est marqué comme refusé
        updated_doc = db_session.query(Document).filter(
            Document.docusign_envelope_id == "envelope456"
        ).first()
        assert updated_doc.statut_signature == "refuse"

    def test_webhook_unknown_envelope(self, client):
        """Test webhook pour une enveloppe inconnue."""
        webhook_data = {
            "data": {
                "envelopeId": "unknown_envelope",
                "status": "completed"
            }
        }

        response = client.post(
            "/api/v1/documents/webhook/docusign",
            json=webhook_data
        )

        # Devrait retourner succès même si document non trouvé
        assert response.status_code == 200

    def test_webhook_missing_envelope_id(self, client):
        """Test webhook sans ID enveloppe."""
        webhook_data = {
            "data": {
                "status": "completed"
            }
        }

        response = client.post(
            "/api/v1/documents/webhook/docusign",
            json=webhook_data
        )

        assert response.status_code == 400


# ============================================================================
# Phase 6g - Transaction-level DocuSign Webhook Tests
# ============================================================================

class TestTransactionDocuSignWebhook:
    """Tests du webhook DocuSign au niveau des transactions (Phase 6g)."""

    def test_webhook_envelope_completed_finalize_transaction(self, client, db_session):
        """Test que webhook completed finalise la transaction."""
        from src.models.notaires import TransactionNotaire

        # Créer une transaction de test
        transaction = TransactionNotaire(
            offre_id=1,
            annonce_id=1,
            acheteur_id=1,
            vendeur_id=1,
            notaire_id=1,
            statut="compromis_envoye",
            prix_compromis=250000,
            frais_notaire=2500,
            frais_immo2000=5000,
            docusign_envelope_id="envelope-phase6g-123"
        )
        db_session.add(transaction)
        db_session.commit()
        db_session.refresh(transaction)

        payload = {
            "envelopeId": "envelope-phase6g-123",
            "status": "completed",
            "completedDateTime": "2026-05-19T12:00:00Z",
            "recipientStatuses": [
                {
                    "type": "signer",
                    "email": "vendeur@test.com",
                    "status": "completed",
                    "signedDateTime": "2026-05-19T12:00:00Z"
                },
                {
                    "type": "signer",
                    "email": "acheteur@test.com",
                    "status": "completed",
                    "signedDateTime": "2026-05-19T12:00:00Z"
                }
            ]
        }

        response = client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["envelope_id"] == "envelope-phase6g-123"
        assert data["transaction_id"] == transaction.transaction_notaire_id

        # Vérifier que la transaction est finalisée
        updated_txn = db_session.query(TransactionNotaire).filter(
            TransactionNotaire.transaction_notaire_id == transaction.transaction_notaire_id
        ).first()
        assert updated_txn.statut == "finalisee"
        assert updated_txn.date_completion is not None

    def test_webhook_envelope_declined_set_status(self, client, db_session):
        """Test que webhook declined met le statut à signature_refusee."""
        from src.models.notaires import TransactionNotaire

        transaction = TransactionNotaire(
            offre_id=1,
            annonce_id=1,
            acheteur_id=1,
            vendeur_id=1,
            notaire_id=1,
            statut="compromis_envoye",
            prix_compromis=250000,
            docusign_envelope_id="envelope-decline-456"
        )
        db_session.add(transaction)
        db_session.commit()
        db_session.refresh(transaction)

        payload = {
            "envelopeId": "envelope-decline-456",
            "status": "declined",
            "recipientStatuses": [
                {
                    "type": "signer",
                    "email": "acheteur@test.com",
                    "status": "declined",
                    "declinedDateTime": "2026-05-19T11:00:00Z",
                    "declinedReason": "Ne peut pas signer"
                }
            ]
        }

        response = client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=payload
        )

        assert response.status_code == 200

        # Vérifier que la transaction est refusée
        updated_txn = db_session.query(TransactionNotaire).filter(
            TransactionNotaire.transaction_notaire_id == transaction.transaction_notaire_id
        ).first()
        assert updated_txn.statut == "signature_refusee"
        assert "acheteur@test.com" in updated_txn.notes_internes

    def test_webhook_envelope_sent_update_status(self, client, db_session):
        """Test que webhook sent met à jour le statut."""
        from src.models.notaires import TransactionNotaire

        transaction = TransactionNotaire(
            offre_id=1,
            annonce_id=1,
            acheteur_id=1,
            vendeur_id=1,
            notaire_id=1,
            statut="compromis_envoye",
            prix_compromis=250000,
            docusign_envelope_id="envelope-sent-789"
        )
        db_session.add(transaction)
        db_session.commit()
        db_session.refresh(transaction)

        payload = {
            "envelopeId": "envelope-sent-789",
            "status": "sent",
            "sentDateTime": "2026-05-19T10:00:00Z"
        }

        response = client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=payload
        )

        assert response.status_code == 200

        updated_txn = db_session.query(TransactionNotaire).filter(
            TransactionNotaire.transaction_notaire_id == transaction.transaction_notaire_id
        ).first()
        assert updated_txn.statut == "compromis_envoye_confirme"

    def test_webhook_envelope_voided_set_status(self, client, db_session):
        """Test que webhook voided met le statut à compromis_annule."""
        from src.models.notaires import TransactionNotaire

        transaction = TransactionNotaire(
            offre_id=1,
            annonce_id=1,
            acheteur_id=1,
            vendeur_id=1,
            notaire_id=1,
            statut="compromis_envoye",
            prix_compromis=250000,
            docusign_envelope_id="envelope-void-000"
        )
        db_session.add(transaction)
        db_session.commit()
        db_session.refresh(transaction)

        payload = {
            "envelopeId": "envelope-void-000",
            "status": "voided",
            "voidedDateTime": "2026-05-19T11:00:00Z",
            "voidedReason": "Erreur administrateur"
        }

        response = client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=payload
        )

        assert response.status_code == 200

        updated_txn = db_session.query(TransactionNotaire).filter(
            TransactionNotaire.transaction_notaire_id == transaction.transaction_notaire_id
        ).first()
        assert updated_txn.statut == "compromis_annule"

    def test_webhook_envelope_not_found(self, client):
        """Test webhook pour une enveloppe inexistante (transaction non trouvée)."""
        payload = {
            "envelopeId": "unknown-envelope-999",
            "status": "completed"
        }

        response = client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=payload
        )

        # Devrait retourner succès avec statut ignored
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ignored"
        assert data["reason"] == "envelope_not_found"

    def test_webhook_creates_audit_trail(self, client, db_session):
        """Test que le webhook crée une entrée d'audit trail."""
        from src.models.notaires import TransactionNotaire, HistoriqueNotaire

        transaction = TransactionNotaire(
            offre_id=1,
            annonce_id=1,
            acheteur_id=1,
            vendeur_id=1,
            notaire_id=1,
            statut="compromis_envoye",
            prix_compromis=250000,
            docusign_envelope_id="envelope-audit-111"
        )
        db_session.add(transaction)
        db_session.commit()
        db_session.refresh(transaction)

        payload = {
            "envelopeId": "envelope-audit-111",
            "status": "completed",
            "completedDateTime": "2026-05-19T12:00:00Z",
            "recipientStatuses": []
        }

        response = client.post(
            "/api/v1/webhooks/docusign/envelope-status",
            json=payload
        )

        assert response.status_code == 200

        # Vérifier qu'un audit log a été créé
        audit_log = db_session.query(HistoriqueNotaire).filter(
            HistoriqueNotaire.transaction_notaire_id == transaction.transaction_notaire_id
        ).first()
        assert audit_log is not None
        assert audit_log.action == "SIGNATURE_COMPLETE"
        assert audit_log.transaction_notaire_id == transaction.transaction_notaire_id
        response = client.get("/api/v1/webhooks/docusign/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "DocuSign Webhooks"
        assert "timestamp" in data
