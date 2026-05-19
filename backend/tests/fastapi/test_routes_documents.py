"""Tests pour les routes documents."""
import pytest


class TestDocumentsRoutes:
    """Tests des routes /documents."""

    def test_upload_document_success(self, client, auth_headers, sample_transaction, db_session):
        """Test upload d'un document réussi."""
        payload = {
            "transaction_id": sample_transaction.transaction_notaire_id,
            "type_document": "compromis",
            "url_s3": "s3://bucket/document.pdf"
        }

        response = client.post(
            "/api/v1/documents/upload",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["type_document"] == "compromis"
        assert data["url_s3"] == "s3://bucket/document.pdf"
        assert data["statut_signature"] == "en_attente"

    def test_upload_document_missing_transaction(self, client, auth_headers):
        """Test upload d'un document avec transaction inexistante."""
        payload = {
            "transaction_id": 9999,
            "type_document": "compromis",
            "url_s3": "s3://bucket/document.pdf"
        }

        response = client.post(
            "/api/v1/documents/upload",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_get_document_success(self, client, auth_headers, db_session, sample_transaction):
        """Test récupération d'un document."""
        from src.models.documents import Document
        from datetime import datetime

        # Créer un document de test
        document = Document(
            transaction_notaire_id=sample_transaction.transaction_notaire_id,
            type_document="compromis",
            url_s3="s3://bucket/document.pdf",
            statut_signature="en_attente",
            date_creation=datetime.utcnow()
        )
        db_session.add(document)
        db_session.commit()
        db_session.refresh(document)

        response = client.get(
            f"/api/v1/documents/{document.document_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["type_document"] == "compromis"
        assert data["url_s3"] == "s3://bucket/document.pdf"

    def test_get_document_not_found(self, client, auth_headers):
        """Test récupération d'un document inexistant."""
        response = client.get(
            "/api/v1/documents/9999",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_sign_document_success(self, client, auth_headers, db_session, sample_transaction):
        """Test envoi d'un document pour signature."""
        from src.models.documents import Document
        from datetime import datetime

        # Créer un document de test
        document = Document(
            transaction_notaire_id=sample_transaction.transaction_notaire_id,
            type_document="compromis",
            url_s3="s3://bucket/document.pdf",
            statut_signature="en_attente",
            date_creation=datetime.utcnow()
        )
        db_session.add(document)
        db_session.commit()
        db_session.refresh(document)

        payload = {
            "signature": "envelope123"
        }

        response = client.post(
            f"/api/v1/documents/{document.document_id}/sign",
            json=payload,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["docusign_envelope_id"] == "envelope123"
        assert data["statut_signature"] == "en_attente_signature"

    def test_get_documents_by_transaction(self, client, auth_headers, db_session, sample_transaction):
        """Test récupération des documents d'une transaction."""
        from src.models.documents import Document
        from datetime import datetime

        # Créer plusieurs documents
        doc1 = Document(
            transaction_notaire_id=sample_transaction.transaction_notaire_id,
            type_document="compromis",
            url_s3="s3://bucket/doc1.pdf",
            statut_signature="en_attente",
            date_creation=datetime.utcnow()
        )
        doc2 = Document(
            transaction_notaire_id=sample_transaction.transaction_notaire_id,
            type_document="acte",
            url_s3="s3://bucket/doc2.pdf",
            statut_signature="en_attente",
            date_creation=datetime.utcnow()
        )
        db_session.add_all([doc1, doc2])
        db_session.commit()

        response = client.get(
            f"/api/v1/documents/transaction/{sample_transaction.transaction_notaire_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_get_documents_unauthorized(self, client, auth_headers, db_session):
        """Test récupération des documents sans permission."""
        from app_fastapi.utils.auth import create_access_token

        # Créer un autre utilisateur
        token = create_access_token(
            data={"user_id": 999, "role": "acheteur"},
            expires_delta=pytest.importorskip("datetime").timedelta(hours=1)
        )
        other_headers = {"Authorization": f"Bearer {token}"}

        response = client.get(
            "/api/v1/documents/transaction/1",
            headers=other_headers
        )

        assert response.status_code == 403
