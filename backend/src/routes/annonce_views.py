"""
API routes for annonce views and analytics
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User, db
from src.crud import annonce_views as crud_views
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from src.schemas.annonce_views import (
    AnnonceViewCreate, AnnonceViewResponse, ViewStatsResponse,
    TrendingAnnonceResponse, VendorViewStatsResponse
)

views_bp = Blueprint('views', __name__, url_prefix='/api/v1/views')


@views_bp.route('', methods=['POST'])
@handle_errors()
def record_view():
    """
    Record a view for an annonce
    """
    data = request.get_json()
    if not data.get('annonce_id'):
        raise ValidationError('annonce_id is required')
    if not data.get('user_id'):
        raise ValidationError('user_id is required')

    view = crud_views.record_view(
        db.session,
        annonce_id=data.get('annonce_id'),
        user_id=data.get('user_id'),
        ip_address=request.remote_addr,
        source=data.get('source', 'direct'),
        duree_vue=data.get('duree_vue', 0)
    )

    return {'annonce_id': view.annonce_id, 'view_id': view.view_id}, 201


@views_bp.route('/<int:annonce_id>/stats', methods=['GET'])
@handle_errors()
def get_view_stats(annonce_id: int):
    """
    Get comprehensive view statistics for an annonce
    """
    stats = crud_views.get_view_stats(db.session, annonce_id)
    if not stats:
        raise NotFoundError('Annonce not found')

    return {
        'annonce_id': annonce_id,
        'total_views': stats['total_views'],
        'weekly_views': [
            {'date': str(v['date']), 'count': v['count']}
            for v in stats['weekly_views']
        ],
        'views_by_source': stats['views_by_source'],
        'avg_view_duration_seconds': stats['avg_view_duration_seconds']
    }


@views_bp.route('/<int:annonce_id>/weekly', methods=['GET'])
@handle_errors()
def get_weekly_views(annonce_id: int):
    """
    Get weekly view breakdown
    """
    weekly = crud_views.get_weekly_views(db.session, annonce_id)

    return {
        'annonce_id': annonce_id,
        'data': [{'date': str(v['date']), 'count': v['count']} for v in weekly]
    }


@views_bp.route('/<int:annonce_id>/monthly', methods=['GET'])
@handle_errors()
def get_monthly_views(annonce_id: int):
    """
    Get monthly view breakdown
    """
    months = request.args.get('months', 3, type=int)
    if months < 1 or months > 24:
        raise ValidationError('months must be between 1 and 24')

    monthly = crud_views.get_monthly_views(db.session, annonce_id, months)

    return {
        'annonce_id': annonce_id,
        'months': months,
        'data': [{'date': str(v['date']), 'count': v['count']} for v in monthly]
    }


@views_bp.route('/<int:annonce_id>/sources', methods=['GET'])
@handle_errors()
def get_views_by_source(annonce_id: int):
    """
    Get view breakdown by source
    """
    sources = crud_views.get_views_by_source(db.session, annonce_id)
    total = sum(sources.values())

    return {
        'annonce_id': annonce_id,
        'sources': sources,
        'total': total
    }


@views_bp.route('/vendor/<int:vendor_id>/summary', methods=['GET'])
@token_required
@handle_errors()
def get_vendor_view_summary(current_user: User, vendor_id: int):
    """
    Get view statistics for all vendor's annonces
    """
    # Verify ownership
    if current_user.user_id != vendor_id:
        raise ForbiddenError('Unauthorized')

    total = crud_views.get_vendor_total_views(db.session, vendor_id)
    by_annonce = crud_views.get_vendor_views_by_annonce(db.session, vendor_id)

    return {
        'vendor_id': vendor_id,
        'total_views': total,
        'by_annonce': [
            {
                'annonce_id': a['annonce_id'],
                'titre': a['titre'],
                'views': a['views']
            }
            for a in by_annonce
        ]
    }


@views_bp.route('/trending', methods=['GET'])
@handle_errors()
def get_trending_annonces():
    """
    Get trending annonces
    """
    limit = request.args.get('limit', 10, type=int)
    if limit < 1 or limit > 100:
        raise ValidationError('limit must be between 1 and 100')

    trending = crud_views.get_trending_annonces(db.session, limit)

    return {
        'trending': [
            {
                'annonce_id': a['annonce_id'],
                'titre': a['titre'],
                'views': a['views']
            }
            for a in trending
        ]
    }


@views_bp.route('/<int:annonce_id>/count', methods=['GET'])
@handle_errors()
def get_view_count(annonce_id: int):
    """
    Get total view count for an annonce
    """
    count = crud_views.get_annonce_view_count(db.session, annonce_id)
    return {'annonce_id': annonce_id, 'views': count}


@views_bp.route('/<int:annonce_id>/avg-duration', methods=['GET'])
@handle_errors()
def get_avg_duration(annonce_id: int):
    """
    Get average view duration
    """
    duration = crud_views.get_avg_view_duration(db.session, annonce_id)

    return {
        'annonce_id': annonce_id,
        'avg_duration_seconds': duration
    }


@views_bp.route('/<int:annonce_id>', methods=['GET'])
@handle_errors()
def list_annonce_views(annonce_id: int):
    """
    List all views for an annonce
    """
    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    if limit > 500:
        raise ValidationError('limit must be <= 500')

    views, total = crud_views.list_views_for_annonce(db.session, annonce_id, skip, limit)

    return {
        'items': [{'annonce_id': v.annonce_id, 'view_id': v.view_id} for v in views],
        'total': total,
        'skip': skip,
        'limit': limit
    }
