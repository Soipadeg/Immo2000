"""
CRUD operations for documents (diagnostics, compromis, photos, etc.)
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.models.documents import Document, DocumentType, DocumentRequis
from src.models.annonces import Annonce
from src.auth.models import User
from sqlalchemy import and_, desc
from typing import Optional, List, Tuple, Dict, Any


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


# ============================================================================
# DOCUMENTS OBLIGATOIRES (DocumentRequis)
# ============================================================================

def initialiser_documents_requis(db: Session, annonce_id: int) -> List[DocumentRequis]:
    """
    Initialise les 5 documents obligatoires pour une nouvelle annonce.

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce

    Returns:
        Liste des documents créés
    """
    documents = []
    types_requis = [
        "titre_propriete",
        "carte_identite",
        "pv_ag",
        "reglement_copropriete",
        "diagnostics"
    ]

    for type_doc in types_requis:
        doc = DocumentRequis(
            annonce_id=annonce_id,
            type_document=type_doc,
            statut="manquant"
        )
        db.add(doc)
        documents.append(doc)

    db.commit()
    return documents


def uploader_document_requis(
    db: Session,
    annonce_id: int,
    type_document: str,
    url_document: str,
    taille: int,
    mime_type: str = "application/pdf"
) -> DocumentRequis:
    """
    Upload un document obligatoire pour une annonce.

    Args:
        db: Session SQLAlchemy
        annonce_id: ID de l'annonce
        type_document: Type du document
        url_document: URL du document stocké
        taille: Taille du fichier en bytes
        mime_type: Type MIME du fichier

    Returns:
        Document créé ou mis à jour
    """
    types_valides = [
        "titre_propriete", "carte_identite", "pv_ag",
        "reglement_copropriete", "diagnostics"
    ]
    if type_document not in types_valides:
        raise ValueError(f"Type de document invalide: {type_document}")

    # Chercher le document existant
    document = db.query(DocumentRequis).filter(
        and_(DocumentRequis.annonce_id == annonce_id,
             DocumentRequis.type_document == type_document)
    ).first()

    if not document:
        document = DocumentRequis(
            annonce_id=annonce_id,
            type_document=type_document
        )
        db.add(document)

    # Mettre à jour le document
    document.url_document = url_document
    document.taille = taille
    document.mime_type = mime_type
    document.statut = "soumis"
    document.date_submission = datetime.utcnow()
    document.motif_rejet = None

    db.commit()
    db.refresh(document)
    return document


def valider_document_requis(
    db: Session,
    document_requis_id: int,
    accepte: bool = True,
    motif_rejet: Optional[str] = None
) -> DocumentRequis:
    """
    Valide ou rejette un document soumis (opération admin).
    """
    document = db.query(DocumentRequis).filter(
        DocumentRequis.document_requis_id == document_requis_id
    ).first()

    if not document:
        raise ValueError(f"Document {document_requis_id} non trouvé")

    if accepte:
        document.statut = "valide"
        document.date_validation = datetime.utcnow()
        document.motif_rejet = None
    else:
        document.statut = "rejete"
        document.motif_rejet = motif_rejet or "Rejeté par l'administrateur"

    db.commit()
    db.refresh(document)
    return document


def obtenir_statut_documents(db: Session, annonce_id: int) -> Dict[str, Any]:
    """
    Obtient le statut complet des documents d'une annonce.
    """
    documents = db.query(DocumentRequis).filter(
        DocumentRequis.annonce_id == annonce_id
    ).all()

    if not documents:
        return {
            "documents": [],
            "tous_valides": False,
            "nombre_valides": 0,
            "manquants": [
                "titre_propriete", "carte_identite", "pv_ag",
                "reglement_copropriete", "diagnostics"
            ],
        }

    documents_dict = [doc.to_dict() for doc in documents]

    valides = [doc for doc in documents if doc.statut == "valide"]
    manquants = [doc.type_document for doc in documents if doc.statut == "manquant"]
    rejetes = [doc for doc in documents if doc.statut == "rejete"]

    tous_valides = len(valides) == len(documents) and len(rejetes) == 0

    return {
        "documents": documents_dict,
        "tous_valides": tous_valides,
        "nombre_valides": len(valides),
        "total_requis": len(documents),
        "manquants": manquants,
        "rejetes": [{"type": doc.type_document, "motif": doc.motif_rejet} for doc in rejetes],
    }


def peux_publier_annonce(db: Session, annonce_id: int) -> Tuple[bool, str]:
    """
    Vérifie si une annonce peut être publiée (tous les documents valides).
    """
    statut = obtenir_statut_documents(db, annonce_id)

    if not statut["documents"]:
        return False, "Aucun document trouvé."

    if not statut["tous_valides"]:
        if statut["manquants"]:
            manquants_str = ", ".join(statut["manquants"])
            return False, f"Documents manquants: {manquants_str}"

        if statut["rejetes"]:
            rejetes_str = ", ".join([r["type"] for r in statut["rejetes"]])
            return False, f"Documents rejetés: {rejetes_str}"

    return True, "Tous les documents sont valides."


def obtenir_documents_annonce(db: Session, annonce_id: int) -> List[DocumentRequis]:
    """Récupère tous les documents d'une annonce."""
    return db.query(DocumentRequis).filter(
        DocumentRequis.annonce_id == annonce_id
    ).all()


def supprimer_documents_annonce(db: Session, annonce_id: int) -> int:
    """Supprime tous les documents d'une annonce."""
    count = db.query(DocumentRequis).filter(
        DocumentRequis.annonce_id == annonce_id
    ).delete()
    db.commit()
    return count
