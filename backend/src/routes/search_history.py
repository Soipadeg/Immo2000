"""
API routes for search history
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User, db
from src.crud import search_history as crud_search
from src.schemas.search_history import (
    SearchHistoryCreate, SearchHistoryResponse, SearchPreferencesResponse,
    SearchAnalyticsResponse
)

search_bp = Blueprint('search', __name__, url_prefix='/api/v1/searches')


@search_bp.route('', methods=['POST'])
@token_required
def record_search(current_user: User):
    """
    Record a search query
    """
    try:
        data = request.get_json()

        search = crud_search.record_search(
            db.session,
            user_id=current_user.user_id,
            ville=data.get('ville'),
            type_bien=data.get('type_bien'),
            budget_min=data.get('budget_min'),
            budget_max=data.get('budget_max'),
            surface_min=data.get('surface_min'),
            surface_max=data.get('surface_max'),
            pieces_min=data.get('pieces_min'),
            nombre_resultats=data.get('nombre_resultats', 0)
        )

        return jsonify(SearchHistoryResponse.from_orm(search).dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@search_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_searches(current_user: User, user_id: int):
    """
    Get search history for a user
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 50, type=int)

        searches, total = crud_search.get_user_searches(db.session, user_id, skip, limit)

        return jsonify({
            'items': [SearchHistoryResponse.from_orm(s).dict() for s in searches],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/user/<int:user_id>/recent', methods=['GET'])
@token_required
def get_recent_searches(current_user: User, user_id: int):
    """
    Get recent searches for a user
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 10, type=int)

        searches = crud_search.get_recent_user_searches(db.session, user_id, days, limit)

        return jsonify({
            'items': [SearchHistoryResponse.from_orm(s).dict() for s in searches],
            'days': days
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/user/<int:user_id>/preferences', methods=['GET'])
@token_required
def get_user_preferences(current_user: User, user_id: int):
    """
    Get user's search preferences
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        prefs = crud_search.get_user_search_preferences(db.session, user_id)

        return jsonify(prefs), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/trending', methods=['GET'])
def get_trending_searches():
    """
    Get trending search terms
    """
    try:
        days = request.args.get('days', 7, type=int)
        limit = request.args.get('limit', 10, type=int)

        trending = crud_search.get_trending_searches(db.session, days, limit)

        return jsonify({
            'trending': [
                {
                    'ville': t['ville'],
                    'type_bien': t['type_bien'],
                    'count': t['count']
                }
                for t in trending
            ],
            'days': days
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/popular/villes', methods=['GET'])
def get_popular_villes():
    """
    Get most popular cities searched
    """
    try:
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 10, type=int)

        villes = crud_search.get_popular_villes(db.session, days, limit)

        return jsonify({
            'villes': villes,
            'days': days
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/popular/types', methods=['GET'])
def get_popular_types():
    """
    Get most popular property types searched
    """
    try:
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 10, type=int)

        types = crud_search.get_popular_types(db.session, days, limit)

        return jsonify({
            'types': types,
            'days': days
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/analytics', methods=['GET'])
def get_search_analytics():
    """
    Get comprehensive search analytics
    """
    try:
        days = request.args.get('days', 7, type=int)
        limit = request.args.get('limit', 10, type=int)

        trending = crud_search.get_trending_searches(db.session, days, limit)
        villes = crud_search.get_popular_villes(db.session, days, limit)
        types = crud_search.get_popular_types(db.session, days, limit)

        return jsonify({
            'trending_searches': [
                {'ville': t['ville'], 'type_bien': t['type_bien'], 'count': t['count']}
                for t in trending
            ],
            'popular_villes': villes,
            'popular_types': types,
            'days': days
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/ville/<string:ville>/stats', methods=['GET'])
def get_ville_stats(ville: str):
    """
    Get search statistics for a city
    """
    try:
        days = request.args.get('days', 30, type=int)

        stats = crud_search.get_search_stats_by_ville(db.session, ville, days)

        return jsonify(stats), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@search_bp.route('/<int:search_id>', methods=['DELETE'])
@token_required
def delete_search(current_user: User, search_id: int):
    """
    Delete a search record
    """
    try:
        success = crud_search.delete_search(db.session, search_id, current_user.user_id)

        if not success:
            return jsonify({'error': 'Search not found or unauthorized'}), 403

        return jsonify({'message': 'Search deleted'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
