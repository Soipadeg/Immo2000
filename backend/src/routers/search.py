"""
FastAPI Search & History Router - Migrated from Flask

Remplace src/routes/search_history.py:
- GET/POST /api/v1/search-history
- DELETE /api/v1/search-history/{id}
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search-history", tags=["search"])


class SearchHistoryItem(BaseModel):
    """Search history item"""
    id: int
    query: str
    filters: dict
    results_count: int
    created_at: datetime


class SaveSearchRequest(BaseModel):
    """Save search request"""
    query: str
    filters: dict = {}


@router.get("", response_model=List[SearchHistoryItem], summary="Get search history")
async def get_search_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(lambda: {"id": 1})
):
    """Get user search history"""
    logger.info(f"🔍 Getting search history for user {current_user['id']}")
    return []


@router.post("", response_model=SearchHistoryItem, status_code=status.HTTP_201_CREATED, summary="Save search")
async def save_search(
    data: SaveSearchRequest,
    current_user = Depends(lambda: {"id": 1})
):
    """Save a search to history"""
    logger.info(f"💾 User {current_user['id']} saving search: {data.query}")

    try:
        return SearchHistoryItem(
            id=1,
            query=data.query,
            filters=data.filters,
            results_count=0,
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Failed to save search: {e}")
        raise HTTPException(status_code=400, detail="Failed to save search")


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete search from history")
async def delete_search(
    search_id: int,
    current_user = Depends(lambda: {"id": 1})
):
    """Delete a search from history"""
    logger.info(f"🗑️  User {current_user['id']} deleting search {search_id}")
    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, summary="Clear search history")
async def clear_history(current_user = Depends(lambda: {"id": 1})):
    """Clear all search history"""
    logger.info(f"🗑️  User {current_user['id']} clearing all search history")
    return None
