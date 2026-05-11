"""
API routes for favorites
"""

from flask import Blueprint, request, jsonify
from src.auth.decorators import token_required
from src.auth.models import User
from src import db
from src.crud import favoris as crud_favoris
from src.schemas.favoris import (
    FavoriCreate, FavoriResponse, FavoriListResponse,
    TopRatedAnnonceResponse, MostFavoritedAnnonceResponse
)

favoris_bp = Blueprint('favoris', __name__, url_prefix='/api/v1/favoris')


@favoris_bp.route('', methods=['POST'])
@token_required
def add_favorite(current_user: User):
    """
    Add an annonce to favorites
    """
    try:
        data = request.get_json()
        annonce_id = data.get('annonce_id')

        if not annonce_id:
            return jsonify({'error': 'annonce_id is required'}), 400

        favori = crud_favoris.add_favorite(
            db.session,
            user_id=current_user.user_id,
            annonce_id=annonce_id,
            note=data.get('note'),
            commentaire=data.get('commentaire')
        )

        return jsonify({
            'favori_id': favori.favori_id,
            'annonce_id': favori.annonce_id,
            'date_ajout': favori.date_ajout.isoformat(),
            'message': 'Added to favorites'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/<int:annonce_id>', methods=['DELETE'])
@token_required
def remove_favorite(current_user: User, annonce_id: int):
    """
    Remove an annonce from favorites
    """
    try:
        success = crud_favoris.remove_favorite(
            db.session,
            user_id=current_user.user_id,
            annonce_id=annonce_id
        )

        if not success:
            return jsonify({'error': 'Favorite not found'}), 404

        return jsonify({'message': 'Removed from favorites'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_favorites(current_user: User, user_id: int):
    """
    Get user's favorites
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        skip = request.args.get('skip', 0, type=int)
        limit = request.args.get('limit', 50, type=int)

        favorites, total = crud_favoris.get_user_favorites(db.session, user_id, skip, limit)

        return jsonify({
            'items': [FavoriResponse.from_orm(f).dict() for f in favorites],
            'total': total,
            'skip': skip,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/user/<int:user_id>/count', methods=['GET'])
@token_required
def get_favorite_count(current_user: User, user_id: int):
    """
    Get favorite count for a user
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        count = crud_favoris.get_user_favorite_count(db.session, user_id)
        return jsonify({'user_id': user_id, 'count': count}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/check/<int:annonce_id>', methods=['GET'])
@token_required
def check_is_favorite(current_user: User, annonce_id: int):
    """
    Check if annonce is in user's favorites
    """
    try:
        is_fav = crud_favoris.is_favorite(
            db.session,
            user_id=current_user.user_id,
            annonce_id=annonce_id
        )

        return jsonify({
            'annonce_id': annonce_id,
            'is_favorite': is_fav
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/<int:annonce_id>/count', methods=['GET'])
def get_annonce_favorite_count(annonce_id: int):
    """
    Get number of times annonce was favorited
    """
    try:
        count = crud_favoris.get_annonce_favorite_count(db.session, annonce_id)
        return jsonify({'annonce_id': annonce_id, 'favorite_count': count}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/user/<int:user_id>/note', methods=['PUT'])
@token_required
def update_favorite_note(current_user: User, user_id: int):
    """
    Update favorite rating/note
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        annonce_id = data.get('annonce_id')
        note = data.get('note')

        if not annonce_id or note is None:
            return jsonify({'error': 'annonce_id and note are required'}), 400

        if not 1 <= note <= 5:
            return jsonify({'error': 'note must be between 1 and 5'}), 400

        favori = crud_favoris.update_favorite_note(
            db.session, current_user.user_id, annonce_id, note
        )

        if not favori:
            return jsonify({'error': 'Favorite not found'}), 404

        return jsonify({'message': 'Note updated', 'note': note}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/user/<int:user_id>/comment', methods=['PUT'])
@token_required
def update_favorite_comment(current_user: User, user_id: int):
    """
    Update favorite comment
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        annonce_id = data.get('annonce_id')
        commentaire = data.get('commentaire')

        if not annonce_id:
            return jsonify({'error': 'annonce_id is required'}), 400

        favori = crud_favoris.update_favorite_comment(
            db.session, current_user.user_id, annonce_id, commentaire
        )

        if not favori:
            return jsonify({'error': 'Favorite not found'}), 404

        return jsonify({'message': 'Comment updated'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/top-rated', methods=['GET'])
def get_top_rated():
    """
    Get top rated annonces
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        top = crud_favoris.get_top_rated_annonces(db.session, limit)

        return jsonify({
            'top_rated': [
                {
                    'annonce_id': a['annonce_id'],
                    'titre': a['titre'],
                    'avg_rating': round(a['avg_rating'], 2),
                    'favorite_count': a['favorite_count']
                }
                for a in top
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/most-favorited', methods=['GET'])
def get_most_favorited():
    """
    Get most favorited annonces
    """
    try:
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 10, type=int)

        most = crud_favoris.get_most_favorited_annonces(db.session, days, limit)

        return jsonify({
            'most_favorited': [
                {
                    'annonce_id': m['annonce_id'],
                    'titre': m['titre'],
                    'count': m['count']
                }
                for m in most
            ],
            'days': days
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@favoris_bp.route('/user/<int:user_id>/breakdown', methods=['GET'])
@token_required
def get_favorite_breakdown(current_user: User, user_id: int):
    """
    Get breakdown of user's favorites by type and city
    """
    try:
        # Verify ownership
        if current_user.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        types = crud_favoris.get_user_favorite_types(db.session, user_id)
        villes = crud_favoris.get_user_favorite_villes(db.session, user_id)

        return jsonify({
            'by_type': types,
            'by_ville': villes
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
