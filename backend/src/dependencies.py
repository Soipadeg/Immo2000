"""
FastAPI Dependencies - Phase 3

Dépendances réutilisables pour les routes
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


# ===== DATABASE DEPENDENCY =====

async def get_database() -> AsyncSession:
    """Get async database session"""
    from src.database import get_db
    async for db in get_db():
        yield db


# ===== AUTHENTICATION DEPENDENCIES =====

async def get_current_user(request) -> dict:
    """Get current authenticated user from request"""
    # Extract from JWT token in Authorization header
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")

        # In production, verify JWT token here
        # For now, return mock user
        return {"id": 1, "email": "user@example.com", "role": "user"}

    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user and verify admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_optional_user(request) -> Optional[dict]:
    """Get optional authenticated user (no error if not authenticated)"""
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            return None

        # In production, verify JWT token here
        return {"id": 1, "email": "user@example.com", "role": "user"}
    except (ValueError, IndexError):
        return None


# ===== PERMISSION DEPENDENCIES =====

async def verify_listing_owner(
    listing_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
) -> dict:
    """Verify that current user owns the listing"""
    # In production, query database
    # For now, just verify listing exists
    logger.info(f"🔐 Verifying listing {listing_id} ownership for user {current_user['id']}")
    return {"listing_id": listing_id, "user_id": current_user["id"]}


async def verify_contract_access(
    contract_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_database)
) -> dict:
    """Verify that current user can access the contract"""
    logger.info(f"🔐 Verifying contract {contract_id} access for user {current_user['id']}")
    return {"contract_id": contract_id, "user_id": current_user["id"]}


# ===== VALIDATION DEPENDENCIES =====

async def validate_pagination(
    skip: int = 0,
    limit: int = 20
) -> dict:
    """Validate pagination parameters"""
    if skip < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="skip must be >= 0"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="limit must be between 1 and 100"
        )

    return {"skip": skip, "limit": limit}


async def validate_price_range(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
) -> dict:
    """Validate price range parameters"""
    if min_price is not None and min_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price must be >= 0"
        )

    if max_price is not None and max_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_price must be >= 0"
        )

    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price must be <= max_price"
        )

    return {"min_price": min_price, "max_price": max_price}


# ===== CACHING DEPENDENCIES =====

async def get_cache():
    """Get cache service"""
    from src.services.cache_service import cache_service
    return cache_service


async def check_cache(
    cache_key: str,
    cache = Depends(get_cache)
) -> Optional[any]:
    """Check if data exists in cache"""
    try:
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"💾 Cache hit for {cache_key}")
        return cached_data
    except Exception as e:
        logger.warning(f"⚠️  Cache check failed: {e}")
        return None


# ===== QUERY PARAMETER DEPENDENCIES =====

async def get_sort_params(
    sort_by: str = "created_at",
    order: str = "desc"
) -> dict:
    """Get and validate sort parameters"""
    valid_sort_fields = ["created_at", "price", "name", "views"]
    valid_orders = ["asc", "desc"]

    if sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"sort_by must be one of {valid_sort_fields}"
        )

    if order not in valid_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"order must be one of {valid_orders}"
        )

    return {"sort_by": sort_by, "order": order}


async def get_filter_params(
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    min_rooms: Optional[int] = None
) -> dict:
    """Get and validate filter parameters"""
    if min_rooms is not None and min_rooms < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_rooms must be >= 1"
        )

    return {
        "city": city,
        "property_type": property_type,
        "min_rooms": min_rooms
    }
