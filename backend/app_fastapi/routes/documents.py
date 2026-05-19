"""Routes FastAPI pour les documents."""
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import logging

from app_fastapi.models import DocumentResponse, DocumentUploadRequest, DocumentSignRequest
from app_fastapi.utils.auth import get_current_user
from app_fastapi.utils.errors import NotFoundError
from app_fastapi.utils.integrations import get_docusign_client, get_sendgrid_client
from shared.database import get_db
from src.models.documents import Document
from src.models.notaires import TransactionNotaire

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, summary="Uploader un document")
async def upload_document(
    data: DocumentUploadRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Uploader un document (compromis ou acte) sur S3."""

    # Vérifier que la transaction existe
    transaction = db.query(TransactionNotaire).filter(
        TransactionNotaire.transaction_notaire_id == data.transaction_id
    ).first()

    if not transaction:
        raise NotFoundError("Transaction", data.transaction_id)

    # Créer l'enregistrement du document
    document = Document(
        transaction_notaire_id=data.transaction_id,
        type_document=data.type_document,
        url_s3=data.url_s3,
        statut_signature="en_attente",
        date_creation=datetime.utcnow()
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document

@router.get("/{document_id}", response_model=DocumentResponse, summary="Récupérer un document")
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Récupérer les détails d'un document."""
    document = db.query(Document).filter(
        Document.document_id == document_id
    ).first()

    if not document:
        raise NotFoundError("Document", document_id)

    return document

@router.post("/{document_id}/sign", response_model=DocumentResponse, summary="Signer un document")
async def sign_document(
    document_id: int,
    data: DocumentSignRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Envoyer un document pour signature (DocuSign)."""
    try:
        docusign = get_docusign_client()
        sendgrid = get_sendgrid_client()

        document = db.query(Document).filter(
            Document.document_id == document_id
        ).first()

        if not document:
            raise NotFoundError("Document", document_id)

        # Mettre à jour le statut du document
        document.statut_signature = "en_attente_signature"
        document.docusign_envelope_id = data.signature  # Store envelope ID

        db.commit()
        db.refresh(document)

        # Envoyer notification en background
        background_tasks.add_task(
            sendgrid.send_transaction_notification,
            user.get("email", "user@example.com"),
            document.transaction_notaire_id,
            "document_signed"
        )

        logger.info(f"Document {document_id} envoyé pour signature")

        return document
    except Exception as e:
        logger.error(f"Erreur lors de la signature: {e}")

@router.get("/transaction/{transaction_id}", response_model=List[DocumentResponse], summary="Documents d'une transaction")
async def get_documents_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Récupérer tous les documents d'une transaction."""

    # Vérifier que la transaction existe et que l'utilisateur y a accès
    transaction = db.query(TransactionNotaire).filter(
        TransactionNotaire.transaction_notaire_id == transaction_id
    ).first()

    if not transaction:
        raise NotFoundError("Transaction", transaction_id)

    if transaction.acheteur_id != user["user_id"] and transaction.vendeur_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé à ces documents"
        )

    documents = db.query(Document).filter(
        Document.transaction_notaire_id == transaction_id
    ).all()

    return documents

@router.post("/webhook/docusign", summary="Webhook DocuSign")
async def docusign_webhook(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Webhook pour les événements DocuSign.

    Gère: envelope_complete (signature complétée)
    """
    try:
        # Extraire les données de l'enveloppe
        envelope_data = request.get("data", {})
        envelope_id = envelope_data.get("envelopeId")
        status = envelope_data.get("status")

        if not envelope_id:
            raise HTTPException(status_code=400, detail="Envelope ID manquant")

        # Trouver le document correspondant
        document = db.query(Document).filter(
            Document.docusign_envelope_id == envelope_id
        ).first()

        if not document:
            # Document non trouvé mais pas d'erreur - juste ignorer
            return {"status": "success", "message": "Document non trouvé"}

        # Mettre à jour le statut du document
        if status == "completed":
            document.statut_signature = "signe"
            document.date_signature = datetime.utcnow()
        elif status == "declined":
            document.statut_signature = "refuse"
        elif status == "voided":
            document.statut_signature = "annule"

        db.commit()

        return {"status": "success", "envelope_id": envelope_id, "document_status": status}

    except Exception as e:
        # Log l'erreur mais retourne succès pour éviter que DocuSign renvoie le webhook
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erreur webhook DocuSign: {e}")
        return {"status": "error", "message": str(e)}
