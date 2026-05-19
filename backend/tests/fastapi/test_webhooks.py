"""Tests pour les webhooks."""
import pytest
import json


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
