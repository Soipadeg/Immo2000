"""
API routes for search history
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User, db
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from src.crud import search_history as crud_search
from src.schemas.search_history import (
    SearchHistoryCreate, SearchHistoryResponse, SearchPreferencesResponse,
    SearchAnalyticsResponse
)

search_bp = Blueprint('search', __name__, url_prefix='/api/v1/searches')


@search_bp.route('', methods=['POST'])
@token_required
@handle_errors()
def record_search(current_user: User):
    """
    Record a search query
    """
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

    return {'data': SearchHistoryResponse.from_orm(search).dict()}, 201


@search_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
@handle_errors()
def get_user_searches(current_user: User, user_id: int):
    """
    Get search history for a user
    """
    # Verify ownership
    if current_user.user_id != user_id:
        raise ForbiddenError('Unauthorized')

    skip = request.args.get('skip', 0, type=int)
    limit = request.args.get('limit', 50, type=int)

    searches, total = crud_search.get_user_searches(db.session, user_id, skip, limit)

    return {
        'items': [SearchHistoryResponse.from_orm(s).dict() for s in searches],
        'total': total,
        'skip': skip,
        'limit': limit
    }


@search_bp.route('/user/<int:user_id>/recent', methods=['GET'])
@token_required
@handle_errors()
def get_recent_searches(current_user: User, user_id: int):
    """
    Get recent searches for a user
    """
    # Verify ownership
    if current_user.user_id != user_id:
        raise ForbiddenError('Unauthorized')

    days = request.args.get('days', 30, type=int)
    limit = request.args.get('limit', 10, type=int)

    searches = crud_search.get_recent_user_searches(db.session, user_id, days, limit)

    return {
        'items': [SearchHistoryResponse.from_orm(s).dict() for s in searches],
        'days': days
    }


@search_bp.route('/user/<int:user_id>/preferences', methods=['GET'])
@token_required
@handle_errors()
def get_user_preferences(current_user: User, user_id: int):
    """
    Get user's search preferences
    """
    # Verify ownership
    if current_user.user_id != user_id:
        raise ForbiddenError('Unauthorized')

    prefs = crud_search.get_user_search_preferences(db.session, user_id)

    return {'data': prefs}


@search_bp.route('/trending', methods=['GET'])
@handle_errors()
def get_trending_searches():
    """
    Get trending search terms
    """
    days = request.args.get('days', 7, type=int)
    limit = request.args.get('limit', 10, type=int)

    trending = crud_search.get_trending_searches(db.session, days, limit)

    return {
        'trending': [
            {
                'ville': t['ville'],
                'type_bien': t['type_bien'],
                'count': t['count']
            }
            for t in trending
        ],
        'days': days
    }


@search_bp.route('/popular/villes', methods=['GET'])
@handle_errors()
def get_popular_villes():
    """
    Get most popular cities searched
    """
    days = request.args.get('days', 30, type=int)
    limit = request.args.get('limit', 10, type=int)

    villes = crud_search.get_popular_villes(db.session, days, limit)

    return {
        'villes': villes,
        'days': days
    }


@search_bp.route('/popular/types', methods=['GET'])
@handle_errors()
def get_popular_types():
    """
    Get most popular property types searched
    """
    days = request.args.get('days', 30, type=int)
    limit = request.args.get('limit', 10, type=int)

    types = crud_search.get_popular_types(db.session, days, limit)

    return {
        'types': types,
        'days': days
    }


@search_bp.route('/analytics', methods=['GET'])
@handle_errors()
def get_search_analytics():
    """
    Get comprehensive search analytics
    """
    days = request.args.get('days', 7, type=int)
    limit = request.args.get('limit', 10, type=int)

    trending = crud_search.get_trending_searches(db.session, days, limit)
    villes = crud_search.get_popular_villes(db.session, days, limit)
    types = crud_search.get_popular_types(db.session, days, limit)

    return {
        'trending_searches': [
            {'ville': t['ville'], 'type_bien': t['type_bien'], 'count': t['count']}
            for t in trending
        ],
        'popular_villes': villes,
        'popular_types': types,
        'days': days
    }


@search_bp.route('/ville/<string:ville>/stats', methods=['GET'])
@handle_errors()
def get_ville_stats(ville: str):
    """
    Get search statistics for a city
    """
    days = request.args.get('days', 30, type=int)

    stats = crud_search.get_search_stats_by_ville(db.session, ville, days)

    return {'data': stats}


@search_bp.route('/<int:search_id>', methods=['DELETE'])
@token_required
@handle_errors()
def delete_search(current_user: User, search_id: int):
    """
    Delete a search record
    """
    success = crud_search.delete_search(db.session, search_id, current_user.user_id)

    if not success:
        raise ForbiddenError('Search not found or unauthorized')

    return {'message': 'Search deleted'}
