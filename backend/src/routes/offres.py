"""
API routes for purchase offers
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User
from src import db
from src.models.annonces import Annonce
from src.crud import offres as crud_offres
from src.schemas.offres import (
    OffreCreate, OffreResponse, OffreListResponse,
    OffreStatsResponse, OffreDetailResponse
)

offres_bp = Blueprint('offres', __name__, url_prefix='/api/v1/offres')


@offres_bp.route('', methods=['POST'])
@token_required
def create_offer(current_user: User):
    """
    Create a new purchase offer
    """
    try:
        data = request.get_json()

        offre = crud_offres.create_offer(
            db.session,
            annonce_id=data.get('annonce_id'),
            acheteur_id=current_user.user_id,
            prix_propose=data.get('prix_propose'),
            message=data.get('message'),
            conditions=data.get('conditions')
        )

        return jsonify({
            'offre_id': offre.offre_id,
            'annonce_id': offre.annonce_id,
            'prix_propose': offre.prix_propose,
            'date_offre': offre.date_offre.isoformat(),
            'message': 'Offer created successfully'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:offre_id>', methods=['GET'])
@token_required
def get_offer(current_user: User, offre_id: int):
    """
    Get offer details
    """
    try:
        offre = crud_offres.get_offer_with_permission_check(
            db.session, offre_id, current_user.user_id
        )

        if not offre:
            return jsonify({'error': 'Offer not found or unauthorized'}), 403

        return jsonify(OffreResponse.from_orm(offre).dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/annonce/<int:annonce_id>', methods=['GET'])
@token_required
def list_annonce_offers(current_user: User, annonce_id: int):
    """
    List offers for an annonce (vendor only)
    """
    try:
        # Verify vendor ownership
        annonce = db.session.query(Annonce).filter_by(annonce_id=annonce_id).first()
        if not annonce or annonce.vendeur_id != current_user.user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 50, type=int)

        offers, total = crud_offres.list_offers_for_annonce(
            db.session, annonce_id, skip, limit
        )

        return jsonify({
            'items': [OffreResponse.from_orm(o).dict() for o in offers],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/buyer', methods=['GET'])
@token_required
def get_buyer_offers(current_user: User):
    """
    Get offers made by the current buyer
    """
    try:
        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 50, type=int)

        offers, total = crud_offres.list_offers_for_buyer(
            db.session, current_user.user_id, skip, limit
        )

        return jsonify({
            'items': [OffreResponse.from_orm(o).dict() for o in offers],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/vendor', methods=['GET'])
@token_required
def get_vendor_offers(current_user: User):
    """
    Get all offers for vendor's annonces
    """
    try:
        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 50, type=int)

        offers, total = crud_offres.list_offers_for_vendor(
            db.session, current_user.user_id, skip, limit
        )

        return jsonify({
            'items': [OffreResponse.from_orm(o).dict() for o in offers],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:offre_id>/status', methods=['PUT'])
@token_required
def update_offer_status(current_user: User, offre_id: int):
    """
    Update offer status (vendor only)
    """
    try:
        data = request.get_json()
        new_status = data.get('statut')

        if not new_status:
            return jsonify({'error': 'statut is required'}), 400

        offre = crud_offres.update_offer_status(
            db.session, offre_id, new_status, current_user.user_id
        )

        if not offre:
            return jsonify({'error': 'Offer not found or unauthorized'}), 403

        return jsonify({
            'offre_id': offre.offre_id,
            'statut': offre.statut,
            'date_reponse': offre.date_reponse.isoformat(),
            'message': 'Offer status updated'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:offre_id>/accept', methods=['POST'])
@token_required
def accept_offer(current_user: User, offre_id: int):
    """
    Accept an offer (vendor only)
    """
    try:
        offre = crud_offres.accept_offer(db.session, offre_id, current_user.user_id)

        if not offre:
            return jsonify({'error': 'Offer not found or unauthorized'}), 403

        return jsonify({
            'offre_id': offre.offre_id,
            'statut': 'acceptee',
            'message': 'Offer accepted'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:offre_id>/reject', methods=['POST'])
@token_required
def reject_offer(current_user: User, offre_id: int):
    """
    Reject an offer (vendor only)
    """
    try:
        offre = crud_offres.reject_offer(db.session, offre_id, current_user.user_id)

        if not offre:
            return jsonify({'error': 'Offer not found or unauthorized'}), 403

        return jsonify({
            'offre_id': offre.offre_id,
            'statut': 'refusee',
            'message': 'Offer rejected'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:offre_id>/counter', methods=['POST'])
@token_required
def make_counter_offer(current_user: User, offre_id: int):
    """
    Make a counter offer (vendor only)
    """
    try:
        data = request.get_json()
        new_price = data.get('new_price')

        if not new_price:
            return jsonify({'error': 'new_price is required'}), 400

        offre = crud_offres.counter_offer(db.session, offre_id, new_price, current_user.user_id)

        if not offre:
            return jsonify({'error': 'Offer not found or unauthorized'}), 403

        return jsonify({
            'offre_id': offre.offre_id,
            'prix_propose': offre.prix_propose,
            'statut': 'negociation',
            'message': 'Counter offer made'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:offre_id>/withdraw', methods=['POST'])
@token_required
def withdraw_offer(current_user: User, offre_id: int):
    """
    Withdraw an offer (buyer only)
    """
    try:
        offre = crud_offres.withdraw_offer(db.session, offre_id, current_user.user_id)

        if not offre:
            return jsonify({'error': 'Offer not found or unauthorized'}), 403

        return jsonify({
            'offre_id': offre.offre_id,
            'statut': 'retiree',
            'message': 'Offer withdrawn'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/vendor/pending', methods=['GET'])
@token_required
def get_pending_offers(current_user: User):
    """
    Get pending offers for vendor's annonces
    """
    try:
        offers = crud_offres.get_pending_offers(db.session, current_user.user_id)

        return jsonify({
            'items': [OffreResponse.from_orm(o).dict() for o in offers],
            'total': len(offers)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/vendor/pending/count', methods=['GET'])
@token_required
def get_pending_count(current_user: User):
    """
    Get count of pending offers for vendor
    """
    try:
        count = crud_offres.get_pending_offer_count(db.session, current_user.user_id)
        return jsonify({'pending_count': count}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:annonce_id>/stats', methods=['GET'])
def get_annonce_offer_stats(annonce_id: int):
    """
    Get offer statistics for an annonce
    """
    try:
        stats = crud_offres.get_offer_stats_for_annonce(db.session, annonce_id)

        return jsonify({
            'annonce_id': annonce_id,
            'total_offers': stats['total_offers'],
            'avg_proposed_price': stats['avg_proposed_price'],
            'min_proposed_price': stats['min_proposed_price'],
            'max_proposed_price': stats['max_proposed_price']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/vendor/stats', methods=['GET'])
@token_required
def get_vendor_offer_stats(current_user: User):
    """
    Get comprehensive offer statistics for vendor
    """
    try:
        stats = crud_offres.get_offer_stats_for_vendor(db.session, current_user.user_id)

        return jsonify(stats), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@offres_bp.route('/<int:offre_id>', methods=['DELETE'])
@token_required
def delete_offer(current_user: User, offre_id: int):
    """
    Delete an offer
    """
    try:
        success = crud_offres.delete_offer(db.session, offre_id, current_user.user_id)

        if not success:
            return jsonify({'error': 'Offer not found or unauthorized'}), 403

        return jsonify({'message': 'Offer deleted'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
