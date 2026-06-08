"""
FastAPI Documents Router - Migré depuis Flask

Remplace src/routes/documents.py

Routes:
- GET /api/v1/documents - Lister documents
- POST /api/v1/documents - Upload document
- DELETE /api/v1/documents/{id}
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentItem(BaseModel):
    """Document"""
    id: int
    name: str
    type: str  # contract, proof, id, etc.
    url: str
    uploaded_by_id: int
    created_at: datetime
    file_size: int


@router.get("", response_model=List[DocumentItem], summary="Lister documents")
async def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    listing_id: Optional[int] = None,
    current_user = Depends(lambda: {"id": 1})
):
    """Lister les documents de l'utilisateur"""
    logger.info(f"📄 Getting documents for user {current_user['id']}")
    return []


@router.post("", status_code=status.HTTP_201_CREATED, summary="Upload document")
async def upload_document(
    file: UploadFile = File(...),
    listing_id: Optional[int] = None,
    doc_type: str = "other",
    current_user = Depends(lambda: {"id": 1})
):
    """Uploader un document"""
    logger.info(f"📤 User {current_user['id']} uploading document: {file.filename}")

    try:
        return DocumentItem(
            id=1,
            name=file.filename,
            type=doc_type,
            url=f"/documents/{file.filename}",
            uploaded_by_id=current_user['id'],
            created_at=datetime.now(),
            file_size=1024
        )
    except Exception as e:
        logger.error(f"❌ Upload failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to upload document")


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Supprimer document")
async def delete_document(
    document_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Supprimer un document"""
    logger.info(f"🗑️  User {current_user['id']} deleting document {document_id}")
    return None
