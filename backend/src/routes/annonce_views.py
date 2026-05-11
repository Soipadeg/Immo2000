"""
API routes for annonce views and analytics
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User, db
from src.crud import annonce_views as crud_views
from src.schemas.annonce_views import (
    AnnonceViewCreate, AnnonceViewResponse, ViewStatsResponse,
    TrendingAnnonceResponse, VendorViewStatsResponse
)

views_bp = Blueprint('views', __name__, url_prefix='/api/v1/views')


@views_bp.route('', methods=['POST'])
def record_view():
    """
    Record a view for an annonce
    """
    try:
        data = request.get_json()

        view = crud_views.record_view(
            db.session,
            annonce_id=data.get('annonce_id'),
            user_id=data.get('user_id'),
            ip_address=request.remote_addr,
            source=data.get('source', 'direct'),
            duree_vue=data.get('duree_vue', 0)
        )

        return jsonify(AnnonceViewResponse.from_orm(view).dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@views_bp.route('/<int:annonce_id>/stats', methods=['GET'])
def get_view_stats(annonce_id: int):
    """
    Get comprehensive view statistics for an annonce
    """
    try:
        stats = crud_views.get_view_stats(db.session, annonce_id)

        return jsonify({
            'annonce_id': annonce_id,
            'total_views': stats['total_views'],
            'weekly_views': [
                {'date': str(v['date']), 'count': v['count']}
                for v in stats['weekly_views']
            ],
            'views_by_source': stats['views_by_source'],
            'avg_view_duration_seconds': stats['avg_view_duration_seconds']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/<int:annonce_id>/weekly', methods=['GET'])
def get_weekly_views(annonce_id: int):
    """
    Get weekly view breakdown
    """
    try:
        weekly = crud_views.get_weekly_views(db.session, annonce_id)

        return jsonify({
            'annonce_id': annonce_id,
            'data': [{'date': str(v['date']), 'count': v['count']} for v in weekly]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/<int:annonce_id>/monthly', methods=['GET'])
def get_monthly_views(annonce_id: int):
    """
    Get monthly view breakdown
    """
    try:
        months = request.args.get('months', 3, type=int)
        monthly = crud_views.get_monthly_views(db.session, annonce_id, months)

        return jsonify({
            'annonce_id': annonce_id,
            'months': months,
            'data': [{'date': str(v['date']), 'count': v['count']} for v in monthly]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/<int:annonce_id>/sources', methods=['GET'])
def get_views_by_source(annonce_id: int):
    """
    Get view breakdown by source
    """
    try:
        sources = crud_views.get_views_by_source(db.session, annonce_id)
        total = sum(sources.values())

        return jsonify({
            'annonce_id': annonce_id,
            'sources': sources,
            'total': total
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/vendor/<int:vendor_id>/summary', methods=['GET'])
@token_required
def get_vendor_view_summary(current_user: User, vendor_id: int):
    """
    Get view statistics for all vendor's annonces
    """
    try:
        # Verify ownership
        if current_user.user_id != vendor_id:
            return jsonify({'error': 'Unauthorized'}), 403

        total = crud_views.get_vendor_total_views(db.session, vendor_id)
        by_annonce = crud_views.get_vendor_views_by_annonce(db.session, vendor_id)

        return jsonify({
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
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/trending', methods=['GET'])
def get_trending_annonces():
    """
    Get trending annonces
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        trending = crud_views.get_trending_annonces(db.session, limit)

        return jsonify({
            'trending': [
                {
                    'annonce_id': a['annonce_id'],
                    'titre': a['titre'],
                    'views': a['views']
                }
                for a in trending
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/<int:annonce_id>/count', methods=['GET'])
def get_view_count(annonce_id: int):
    """
    Get total view count for an annonce
    """
    try:
        count = crud_views.get_annonce_view_count(db.session, annonce_id)
        return jsonify({'annonce_id': annonce_id, 'views': count}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/<int:annonce_id>/avg-duration', methods=['GET'])
def get_avg_duration(annonce_id: int):
    """
    Get average view duration
    """
    try:
        duration = crud_views.get_avg_view_duration(db.session, annonce_id)

        return jsonify({
            'annonce_id': annonce_id,
            'avg_duration_seconds': duration
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@views_bp.route('/<int:annonce_id>', methods=['GET'])
def list_annonce_views(annonce_id: int):
    """
    List all views for an annonce
    """
    try:
        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 100, type=int)

        views, total = crud_views.list_views_for_annonce(db.session, annonce_id, skip, limit)

        return jsonify({
            'items': [AnnonceViewResponse.from_orm(v).dict() for v in views],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
