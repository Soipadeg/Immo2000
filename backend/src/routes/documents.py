"""
API routes for document management
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User, db
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
def upload_document(current_user: User):
    """
    Upload a new document for an annonce
    """
    try:
        annonce_id = request.form.get('annonce_id', type=int)
        doc_type = request.form.get('type')

        if not annonce_id or not doc_type:
            return jsonify({'error': 'annonce_id and type are required'}), 400

        # Verify annonce ownership
        annonce = db.session.query(Annonce).filter_by(annonce_id=annonce_id).first()
        if not annonce or annonce.vendeur_id != current_user.user_id:
            return jsonify({'error': 'Annonce not found or unauthorized'}), 403

        # Check file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate file size (50MB max)
        file.seek(0, os.SEEK_END)
        taille = file.tell()
        file.seek(0)

        if taille > 52428800:  # 50MB
            return jsonify({'error': 'File too large (max 50MB)'}), 400

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

        return jsonify({
            'document_id': document.document_id,
            'nom': document.nom,
            'type': document.type,
            'taille': document.taille,
            'url': document.url,
            'message': 'Document uploaded successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:document_id>', methods=['GET'])
def get_document(document_id: int):
    """
    Get document details
    """
    try:
        document = crud_documents.get_document(db.session, document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        return jsonify(DocumentResponse.from_orm(document).dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/annonce/<int:annonce_id>', methods=['GET'])
def list_annonce_documents(annonce_id: int):
    """
    List documents for an annonce
    """
    try:
        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 20, type=int)

        documents, total = crud_documents.list_documents_for_annonce(
            db.session, annonce_id, skip, limit
        )

        return jsonify({
            'items': [DocumentResponse.from_orm(d).dict() for d in documents],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/type/<string:doc_type>', methods=['GET'])
def list_documents_by_type(doc_type: str):
    """
    List documents by type for an annonce
    """
    try:
        annonce_id = request.args.get('annonce_id', type=int)
        if not annonce_id:
            return jsonify({'error': 'annonce_id required'}), 400

        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 20, type=int)

        documents, total = crud_documents.list_documents_by_type(
            db.session, annonce_id, doc_type, skip, limit
        )

        return jsonify({
            'items': [DocumentResponse.from_orm(d).dict() for d in documents],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:document_id>', methods=['DELETE'])
@token_required
def delete_document(current_user: User, document_id: int):
    """
    Delete a document
    """
    try:
        success = crud_documents.delete_document(
            db.session, document_id, current_user.user_id
        )

        if not success:
            return jsonify({'error': 'Document not found or unauthorized'}), 403

        return jsonify({'message': 'Document deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:document_id>/download', methods=['POST'])
def download_document(document_id: int):
    """
    Track document download and increment counter
    """
    try:
        document = crud_documents.increment_download_count(db.session, document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        return jsonify({'message': 'Download tracked', 'count': document.telecharge}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:document_id>/stats', methods=['GET'])
def get_document_stats(document_id: int):
    """
    Get document statistics
    """
    try:
        document = crud_documents.get_document(db.session, document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        return jsonify({
            'document_id': document_id,
            'downloads': document.telecharge,
            'uploaded': document.date_upload.isoformat(),
            'size_mb': round(document.taille / 1024 / 1024, 2)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/annonce/<int:annonce_id>/stats', methods=['GET'])
def get_annonce_document_stats(annonce_id: int):
    """
    Get document statistics for an annonce
    """
    try:
        stats = crud_documents.get_document_stats_for_annonce(db.session, annonce_id)
        return jsonify(stats), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:document_id>/visibility', methods=['PUT'])
@token_required
def update_visibility(current_user: User, document_id: int):
    """
    Update document visibility
    """
    try:
        data = request.get_json()
        visible = data.get('visible_pour_tous')

        if visible is None:
            return jsonify({'error': 'visible_pour_tous is required'}), 400

        document = crud_documents.update_document_visibility(
            db.session, document_id, visible, current_user.user_id
        )

        if not document:
            return jsonify({'error': 'Document not found or unauthorized'}), 403

        return jsonify({'message': 'Visibility updated', 'visible': visible}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@documents_bp.route('/<int:document_id>/expiration', methods=['PUT'])
@token_required
def update_expiration(current_user: User, document_id: int):
    """
    Update document expiration date
    """
    try:
        data = request.get_json()
        days = data.get('expire_in_days', type=int)

        if days is None or days < 0:
            return jsonify({'error': 'expire_in_days must be positive'}), 400

        date_expiration = datetime.utcnow() + timedelta(days=days)

        document = crud_documents.update_document_expiration(
            db.session, document_id, date_expiration, current_user.user_id
        )

        if not document:
            return jsonify({'error': 'Document not found or unauthorized'}), 403

        return jsonify({'message': 'Expiration updated', 'expires': date_expiration.isoformat()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
