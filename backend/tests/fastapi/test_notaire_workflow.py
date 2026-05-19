"""Tests pour le workflow complet notaire (Phase 6f)."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch


class TestNotaireWorkflow:
    """Tests du workflow complet du notaire."""

    def test_dashboard_notaire_liste_transactions(self, client, notaire_auth_headers, db_session):
        """Test: Notaire voit ses transactions assignées."""
        response = client.get(
            "/api/v1/notaires/1/dashboard",
            headers=notaire_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_valider_frais_success(self, client, notaire_auth_headers, db_session, sample_transaction):
        """Test: Notaire valide les frais avec calcul automatique 2%."""
        payload = {
            "montant_frais": 8000,
            "detail": "Frais de notaire standard",
            "action": "valider"
        }

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/frais/valider",
            json=payload,
            headers=notaire_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Frais validés avec succès"
        assert data["frais_notaire"] == 8000

        # Vérifier le calcul automatique 2%
        expected_immo2000 = sample_transaction.prix_compromis * 0.02
        assert abs(data["frais_immo2000"] - expected_immo2000) < 0.01

    def test_valider_frais_montant_invalide(self, client, notaire_auth_headers, sample_transaction):
        """Test: Validation échoue si montant <= 0."""
        payload = {
            "montant_frais": -100,
            "detail": "Frais négatifs",
            "action": "valider"
        }

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/frais/valider",
            json=payload,
            headers=notaire_auth_headers
        )

        assert response.status_code == 400

    def test_valider_frais_unauthorized_non_notaire(self, client, auth_headers, sample_transaction):
        """Test: Seul le notaire assigné peut valider."""
        payload = {
            "montant_frais": 8000,
            "detail": "Frais",
            "action": "valider"
        }

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/frais/valider",
            json=payload,
            headers=auth_headers  # Headers d'acheteur, pas notaire
        )

        assert response.status_code == 403

    def test_refuser_frais(self, client, notaire_auth_headers, sample_transaction):
        """Test: Notaire peut refuser les frais."""
        payload = {
            "montant_frais": 0,
            "action": "refuser"
        }

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/frais/valider",
            json=payload,
            headers=notaire_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "refusé" in data["message"].lower() or data["statut"] == "frais_refuses"

    @patch("app_fastapi.utils.pdf.generer_compromis_pdf")
    @patch("app_fastapi.utils.integrations.get_aws_client")
    def test_generer_compromis_success(
        self,
        mock_aws_client,
        mock_generer_pdf,
        client,
        notaire_auth_headers,
        db_session,
        sample_transaction
    ):
        """Test: Générer le compromis PDF."""
        # Setup
        from app_fastapi.utils.integrations import AWSIntegration

        mock_pdf_bytes = b"PDF_CONTENT_HERE"
        mock_generer_pdf.return_value = mock_pdf_bytes

        mock_aws = AsyncMock(spec=AWSIntegration)
        mock_aws.upload_document.return_value = "s3://bucket/compromis.pdf"
        mock_aws_client.return_value = mock_aws

        # D'abord, valider les frais
        frais_payload = {
            "montant_frais": 8000,
            "action": "valider"
        }
        client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/frais/valider",
            json=frais_payload,
            headers=notaire_auth_headers
        )

        # Ensuite générer le compromis
        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/compromis/generer",
            json={},
            headers=notaire_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "Compromis généré" in data["message"]
        assert "compromis_url" in data or "pdf_base64" in data

    def test_generer_compromis_frais_non_valides(self, client, notaire_auth_headers, sample_transaction):
        """Test: Ne peut pas générer compromis si frais non validés."""
        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/compromis/generer",
            json={},
            headers=notaire_auth_headers
        )

        assert response.status_code == 400
        assert "frais" in response.json()["detail"].lower()

    def test_generer_compromis_unauthorized(self, client, auth_headers, sample_transaction):
        """Test: Seul le notaire peut générer le compromis."""
        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/compromis/generer",
            json={},
            headers=auth_headers  # Headers d'acheteur
        )

        assert response.status_code == 403

    @patch("app_fastapi.utils.integrations.get_docusign_client")
    @patch("app_fastapi.utils.integrations.get_aws_client")
    @patch("app_fastapi.utils.pdf.generer_compromis_pdf")
    def test_envoyer_compromis_docusign(
        self,
        mock_generer_pdf,
        mock_aws_client,
        mock_docusign_client,
        client,
        notaire_auth_headers,
        db_session,
        sample_transaction
    ):
        """Test: Envoyer le compromis à DocuSign pour signature."""
        # Setup transaction avec compromis
        sample_transaction.compromis_url = "s3://bucket/compromis.pdf"
        db_session.commit()

        # Mock DocuSign client
        mock_docusign = AsyncMock()
        mock_docusign.send_envelope.return_value = {
            "envelopeId": "envelope123",
            "status": "sent"
        }
        mock_docusign_client.return_value = mock_docusign

        # Envoyer
        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/compromis/envoyer",
            json={"message": "Veuillez signer"},
            headers=notaire_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "Compromis envoyé" in data["message"]
        assert data["envelope_id"] == "envelope123"

    def test_envoyer_compromis_pas_genere(self, client, notaire_auth_headers, sample_transaction):
        """Test: Erreur si compromis pas généré."""
        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/compromis/envoyer",
            json={},
            headers=notaire_auth_headers
        )

        assert response.status_code == 400
        assert "aucun compromis" in response.json()["detail"].lower()

    def test_envoyer_compromis_unauthorized(self, client, auth_headers, sample_transaction):
        """Test: Seul le notaire peut envoyer."""
        sample_transaction.compromis_url = "s3://bucket/compromis.pdf"

        response = client.post(
            f"/api/v1/transactions/{sample_transaction.transaction_notaire_id}/compromis/envoyer",
            json={},
            headers=auth_headers
        )

        assert response.status_code == 403


class TestWorkflowComplet:
    """Test du workflow complet du notaire de bout en bout."""

    @patch("app_fastapi.utils.integrations.get_docusign_client")
    @patch("app_fastapi.utils.integrations.get_aws_client")
    @patch("app_fastapi.utils.pdf.generer_compromis_pdf")
    def test_workflow_complet_notaire(
        self,
        mock_generer_pdf,
        mock_aws_client,
        mock_docusign_client,
        client,
        auth_headers,
        vendor_auth_headers,
        notaire_auth_headers,
        db_session,
        sample_annonce,
        sample_offre
    ):
        """
        Test du workflow complet:
        1. Vendeur crée offre
        2. Acheteur accepte offre
        3. Vendeur assigne un notaire
        4. Notaire valide les frais
        5. Notaire génère le compromis
        6. Notaire envoie à DocuSign
        """
        from src.models.notaires import Notaire, TransactionNotaire

        # Setup
        sample_offre.statut = "acceptee"
        db_session.commit()

        # Créer une transaction pour l'offre acceptée
        transaction = TransactionNotaire(
            offre_id=sample_offre.offre_id,
            annonce_id=sample_annonce.annonce_id,
            acheteur_id=sample_offre.acheteur_id,
            vendeur_id=sample_offre.vendeur_id,
            prix_compromis=sample_offre.montant,
            statut="en_attente_notaire",
            date_creation=datetime.utcnow()
        )
        db_session.add(transaction)
        db_session.commit()
        db_session.refresh(transaction)

        # 1. Vendeur assigne un notaire (récupérer un notaire)
        notaire = db_session.query(Notaire).first()
        if notaire:
            response = client.post(
                f"/api/v1/transactions/{transaction.transaction_notaire_id}/select-notaire",
                json={"notaire_id": notaire.notaire_id},
                headers=vendor_auth_headers
            )
            assert response.status_code == 200

            # 2. Notaire valide les frais
            frais_response = client.post(
                f"/api/v1/transactions/{transaction.transaction_notaire_id}/frais/valider",
                json={
                    "montant_frais": 8000,
                    "detail": "Frais standard",
                    "action": "valider"
                },
                headers=notaire_auth_headers
            )
            assert frais_response.status_code == 200
            frais_data = frais_response.json()
            assert frais_data["frais_notaire"] == 8000

            # 3. Notaire génère le compromis
            mock_pdf_bytes = b"PDF_CONTENT"
            mock_generer_pdf.return_value = mock_pdf_bytes

            mock_aws = AsyncMock()
            mock_aws.upload_document.return_value = "s3://bucket/compromis.pdf"
            mock_aws_client.return_value = mock_aws

            compromis_response = client.post(
                f"/api/v1/transactions/{transaction.transaction_notaire_id}/compromis/generer",
                json={},
                headers=notaire_auth_headers
            )
            assert compromis_response.status_code == 200

            # 4. Notaire envoie à DocuSign
            mock_docusign = AsyncMock()
            mock_docusign.send_envelope.return_value = {
                "envelopeId": "envelope_test_123"
            }
            mock_docusign_client.return_value = mock_docusign

            envoyer_response = client.post(
                f"/api/v1/transactions/{transaction.transaction_notaire_id}/compromis/envoyer",
                json={},
                headers=notaire_auth_headers
            )
            assert envoyer_response.status_code == 200
            envoyer_data = envoyer_response.json()
            assert envoyer_data["envelope_id"] == "envelope_test_123"
