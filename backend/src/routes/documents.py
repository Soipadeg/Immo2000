"""
API routes for document management
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User, db
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from src.models.annonces import Annonce
from src.crud import documents as crud_documents
from src.schemas.documents import (
    DocumentCreate, DocumentResponse, DocumentListResponse,
    DocumentStatsResponse, DocumentDetailResponse
)
from datetime import datetime, timedelta
import os

documents_bp = Blueprint('documents', __name__, url_prefix='/api/v1/documents')


@documents_bp.route('', methods=['POST'])
@token_required
@handle_errors()
def upload_document(current_user: User):
    """
    Upload a new document for an annonce
    """
    annonce_id = request.form.get('annonce_id', type=int)
    doc_type = request.form.get('type')

    if not annonce_id or not doc_type:
        raise ValidationError('annonce_id and type are required')

    # Verify annonce ownership
    annonce = db.session.query(Annonce).filter_by(annonce_id=annonce_id).first()
    if not annonce or annonce.vendeur_id != current_user.user_id:
        raise ForbiddenError('Annonce not found or unauthorized')

    # Check file
    if 'file' not in request.files:
        raise ValidationError('No file provided')

    file = request.files['file']
    if file.filename == '':
        raise ValidationError('No file selected')

    # Validate file size (50MB max)
    file.seek(0, os.SEEK_END)
    taille = file.tell()
    file.seek(0)
    if taille > 52428800:  # 50MB
        raise ValidationError('File too large (max 50MB)')

    # Save file (simplified - in production use proper file storage like S3)
    filename = f"{annonce_id}_{doc_type}_{datetime.utcnow().timestamp()}"
    file_path = f"/uploads/documents/{filename}"
    file.save(f"./static{file_path}")

    # Create document record
    document = crud_documents.upload_document(
        db.session,
        annonce_id=annonce_id,
        nom=file.filename,
        type_doc=doc_type,
        url=file_path,
        taille=taille,
        mime_type=file.content_type,
        visible_pour_tous=request.form.get('visible_pour_tous', True) == 'true'
    )

    return {
        'document_id': document.document_id,
        'nom': document.nom,
        'type': document.type,
        'taille': document.taille,
        'url': document.url,
        'message': 'Document uploaded successfully'
    }, 201


@documents_bp.route('/<int:document_id>', methods=['GET'])
@handle_errors()
def get_document(document_id: int):
    """
    Get document details
    """
    document = crud_documents.get_document(db.session, document_id)
    if not document:
        raise NotFoundError('Document not found')

    return {'data': DocumentResponse.from_orm(document).dict()}


@documents_bp.route('/annonce/<int:annonce_id>', methods=['GET'])
@handle_errors()
def list_annonce_documents(annonce_id: int):
    """
    List documents for an annonce
    """
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 20, type=int)

    documents, total = crud_documents.list_documents_for_annonce(
        db.session, annonce_id, skip, limit
    )

    return {
        'items': [DocumentResponse.from_orm(d).dict() for d in documents],
        'total': total,
        'skip': skip,
        'limit': limit
    }


@documents_bp.route('/type/<string:doc_type>', methods=['GET'])
@handle_errors()
def list_documents_by_type(doc_type: str):
    """
    List documents by type for an annonce
    """
    annonce_id = request.args.get('annonce_id', type=int)
    if not annonce_id:
        raise ValidationError('annonce_id required')

    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 20, type=int)

    documents, total = crud_documents.list_documents_by_type(
        db.session, annonce_id, doc_type, skip, limit
    )

    return {
        'items': [DocumentResponse.from_orm(d).dict() for d in documents],
        'total': total,
        'skip': skip,
        'limit': limit
    }


@documents_bp.route('/<int:document_id>', methods=['DELETE'])
@token_required
@handle_errors()
def delete_document(current_user: User, document_id: int):
    """
    Delete a document
    """
    success = crud_documents.delete_document(
        db.session, document_id, current_user.user_id
    )

    if not success:
        raise ForbiddenError('Document not found or unauthorized')

    return {'message': 'Document deleted successfully'}


@documents_bp.route('/<int:document_id>/download', methods=['POST'])
@handle_errors()
def download_document(document_id: int):
    """
    Track document download and increment counter
    """
    document = crud_documents.increment_download_count(db.session, document_id)
    if not document:
        raise NotFoundError('Document not found')

    return {'message': 'Download tracked', 'count': document.telecharge}


@documents_bp.route('/<int:document_id>/stats', methods=['GET'])
@handle_errors()
def get_document_stats(document_id: int):
    """
    Get document statistics
    """
    document = crud_documents.get_document(db.session, document_id)
    if not document:
        raise NotFoundError('Document not found')

    return {
        'document_id': document_id,
        'downloads': document.telecharge,
        'uploaded': document.date_upload.isoformat(),
        'size_mb': round(document.taille / 1024 / 1024, 2)
    }


@documents_bp.route('/annonce/<int:annonce_id>/stats', methods=['GET'])
@handle_errors()
def get_annonce_document_stats(annonce_id: int):
    """
    Get document statistics for an annonce
    """
    stats = crud_documents.get_document_stats_for_annonce(db.session, annonce_id)
    return {'data': stats}


@documents_bp.route('/<int:document_id>/visibility', methods=['PUT'])
@token_required
@handle_errors()
def update_visibility(current_user: User, document_id: int):
    """
    Update document visibility
    """
    data = request.get_json()
    visible = data.get('visible_pour_tous')

    if visible is None:
        raise ValidationError('visible_pour_tous is required')

    document = crud_documents.update_document_visibility(
        db.session, document_id, visible, current_user.user_id
    )

    if not document:
        raise ForbiddenError('Document not found or unauthorized')

    return {'message': 'Visibility updated', 'visible': visible}


@documents_bp.route('/<int:document_id>/expiration', methods=['PUT'])
@token_required
@handle_errors()
def update_expiration(current_user: User, document_id: int):
    """
    Update document expiration date
    """
    data = request.get_json()
    days = data.get('expire_in_days', type=int)

    if days is None or days < 0:
        raise ValidationError('expire_in_days must be positive')

    date_expiration = datetime.utcnow() + timedelta(days=days)

    document = crud_documents.update_document_expiration(
        db.session, document_id, date_expiration, current_user.user_id
    )

    if not document:
        raise ForbiddenError('Document not found or unauthorized')

    return {'message': 'Expiration updated', 'expires': date_expiration.isoformat()}
