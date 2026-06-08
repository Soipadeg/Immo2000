"""
FastAPI Favorites Router - Migrated from Flask

Remplace src/routes/favoris.py:
- GET /api/v1/favorites - Get user favorites
- POST /api/v1/favorites - Add to favorites
- DELETE /api/v1/favorites/{listing_id} - Remove from favorites
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/favorites", tags=["favorites"])


class FavoriteItem(BaseModel):
    """Favorite listing item"""
    id: int
    listing_id: int
    listing_title: str
    price: float
    city: str
    image: str = None
    added_at: datetime


class AddFavoriteRequest(BaseModel):
    """Add to favorites request"""
    listing_id: int


@router.get("", response_model=List[FavoriteItem], summary="Get user favorites")
async def get_favorites(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(lambda: {"id": 1})
):
    """Get all favorites for current user"""
    logger.info(f"❤️  Getting favorites for user {current_user['id']}")

    try:
        # TODO: Query database
        # favorites = db.query(Favorite).filter_by(user_id=current_user['id']).all()
        return []
    except Exception as e:
        logger.error(f"❌ Failed to get favorites: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve favorites")


@router.post("", status_code=status.HTTP_201_CREATED, summary="Add to favorites")
async def add_favorite(
    data: AddFavoriteRequest,
    current_user = Depends(lambda: {"id": 1})
):
    """Add a listing to favorites"""
    logger.info(f"❤️  User {current_user['id']} adding listing {data.listing_id} to favorites")

    try:
        # TODO: Add to database
        return {"message": "Added to favorites", "listing_id": data.listing_id}
    except Exception as e:
        logger.error(f"❌ Failed to add favorite: {e}")
        raise HTTPException(status_code=400, detail="Failed to add favorite")


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove from favorites")
async def remove_favorite(
    listing_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Remove a listing from favorites"""
    logger.info(f"💔 User {current_user['id']} removing listing {listing_id} from favorites")

    try:
        # TODO: Delete from database
        return None
    except Exception as e:
        logger.error(f"❌ Failed to remove favorite: {e}")
        raise HTTPException(status_code=400, detail="Failed to remove favorite")
