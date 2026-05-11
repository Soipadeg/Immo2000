"""
CRUD operations for documents (diagnostics, compromis, photos, etc.)
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.models.documents import Document, DocumentType
from src.models.annonces import Annonce
from src.auth.models import User
from sqlalchemy import and_, desc


def upload_document(
    db: Session,
    annonce_id: int,
    nom: str,
    type_doc: str,
    url: str,
    taille: int,
    mime_type: str,
    visible_pour_tous: bool = True,
    date_expiration: datetime = None
) -> Document:
    """
    Upload a new document for an annonce
    """
    document = Document(
        annonce_id=annonce_id,
        type=type_doc,
        nom=nom,
        url=url,
        taille=taille,
        mime_type=mime_type,
        date_upload=datetime.utcnow(),
        date_expiration=date_expiration,
        visible_pour_tous=visible_pour_tous,
        telecharge=0
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_document(db: Session, document_id: int) -> Document:
    """
    Get a document by ID
    """
    return db.query(Document).filter(Document.document_id == document_id).first()


def list_documents_for_annonce(
    db: Session,
    annonce_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[list[Document], int]:
    """
    List documents for a specific annonce
    Returns (documents, total_count)
    """
    query = db.query(Document).filter(Document.annonce_id == annonce_id)
    total = query.count()

    documents = query.order_by(desc(Document.date_upload)).offset(skip).limit(limit).all()
    return documents, total


def list_documents_by_type(
    db: Session,
    annonce_id: int,
    type_doc: str,
    skip: int = 0,
    limit: int = 20
) -> tuple[list[Document], int]:
    """
    List documents of a specific type for an annonce
    """
    query = db.query(Document).filter(
        and_(Document.annonce_id == annonce_id, Document.type == type_doc)
    )
    total = query.count()

    documents = query.order_by(desc(Document.date_upload)).offset(skip).limit(limit).all()
    return documents, total


def list_documents_by_vendor(
    db: Session,
    vendor_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[list[Document], int]:
    """
    List all documents uploaded by a vendor (across all their annonces)
    """
    query = db.query(Document).join(Annonce).filter(
        Annonce.vendeur_id == vendor_id
    )
    total = query.count()

    documents = query.order_by(desc(Document.date_upload)).offset(skip).limit(limit).all()
    return documents, total


def delete_document(db: Session, document_id: int, vendor_id: int) -> bool:
    """
    Delete a document (only vendor can delete their own documents)
    """
    document = db.query(Document).join(Annonce).filter(
        and_(Document.document_id == document_id, Annonce.vendeur_id == vendor_id)
    ).first()

    if not document:
        return False

    db.delete(document)
    db.commit()
    return True


def increment_download_count(db: Session, document_id: int) -> Document:
    """
    Increment the download counter for a document
    """
    document = db.query(Document).filter(Document.document_id == document_id).first()
    if document:
        document.telecharge += 1
        db.commit()
        db.refresh(document)
    return document


def get_download_count(db: Session, document_id: int) -> int:
    """
    Get the number of downloads for a document
    """
    document = db.query(Document).filter(Document.document_id == document_id).first()
    return document.telecharge if document else 0


def update_document_expiration(
    db: Session,
    document_id: int,
    date_expiration: datetime,
    vendor_id: int
) -> Document:
    """
    Update document expiration date
    """
    document = db.query(Document).join(Annonce).filter(
        and_(Document.document_id == document_id, Annonce.vendeur_id == vendor_id)
    ).first()

    if document:
        document.date_expiration = date_expiration
        db.commit()
        db.refresh(document)

    return document


def update_document_visibility(
    db: Session,
    document_id: int,
    visible_pour_tous: bool,
    vendor_id: int
) -> Document:
    """
    Update document visibility
    """
    document = db.query(Document).join(Annonce).filter(
        and_(Document.document_id == document_id, Annonce.vendeur_id == vendor_id)
    ).first()

    if document:
        document.visible_pour_tous = visible_pour_tous
        db.commit()
        db.refresh(document)

    return document


def get_expired_documents(db: Session) -> list[Document]:
    """
    Get all expired documents (for cleanup or notification)
    """
    now = datetime.utcnow()
    return db.query(Document).filter(
        and_(Document.date_expiration.isnot(None), Document.date_expiration < now)
    ).all()


def delete_expired_documents(db: Session) -> int:
    """
    Delete all expired documents and return count
    """
    now = datetime.utcnow()
    count = db.query(Document).filter(
        and_(Document.date_expiration.isnot(None), Document.date_expiration < now)
    ).delete()
    db.commit()
    return count


def get_document_stats_for_annonce(db: Session, annonce_id: int) -> dict:
    """
    Get document statistics for an annonce
    """
    documents = db.query(Document).filter(Document.annonce_id == annonce_id).all()

    total_size = sum(doc.taille for doc in documents)
    total_downloads = sum(doc.telecharge for doc in documents)

    type_breakdown = {}
    for doc in documents:
        type_breakdown[doc.type] = type_breakdown.get(doc.type, 0) + 1

    return {
        'total_documents': len(documents),
        'total_size_bytes': total_size,
        'total_downloads': total_downloads,
        'type_breakdown': type_breakdown
    }
