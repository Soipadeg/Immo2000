"""
FastAPI Listings Router - Migration from Flask

Remplace src/routes/annonces.py Flask blueprint:
- GET /api/v1/listings - Get all listings
- POST /api/v1/listings - Create listing
- GET /api/v1/listings/{id} - Get listing details
- PUT /api/v1/listings/{id} - Update listing
- DELETE /api/v1/listings/{id} - Delete listing
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/listings", tags=["listings"])


# ===== SCHEMAS =====

class PropertyDetails(BaseModel):
    """Property details"""
    type: str = Field(..., description="Property type: apartment, house, land, etc.")
    rooms: int = Field(..., ge=1, description="Number of rooms")
    bathrooms: int = Field(..., ge=1, description="Number of bathrooms")
    area: float = Field(..., gt=0, description="Property area in m²")
    address: str = Field(..., description="Full address")
    city: str = Field(..., description="City")
    postal_code: str = Field(..., description="Postal code")
    country: str = Field(default="France", description="Country")


class CreateListingRequest(BaseModel):
    """Create listing request"""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=5000)
    price: float = Field(..., gt=0, description="Price in EUR")
    property: PropertyDetails
    images: Optional[List[str]] = None
    features: Optional[List[str]] = None


class UpdateListingRequest(BaseModel):
    """Update listing request"""
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    property: Optional[PropertyDetails] = None
    features: Optional[List[str]] = None


class ListingResponse(BaseModel):
    """Listing response"""
    id: int
    title: str
    description: str
    price: float
    property: PropertyDetails
    seller_id: int
    seller_name: str
    created_at: datetime
    updated_at: datetime
    images: List[str] = []
    features: List[str] = []
    status: str = "active"
    views_count: int = 0


class ListingListResponse(BaseModel):
    """Listing list response"""
    id: int
    title: str
    price: float
    city: str
    property_type: str
    area: float
    image: Optional[str] = None
    created_at: datetime


# ===== ROUTES =====

@router.get(
    "",
    response_model=List[ListingListResponse],
    summary="Get all listings"
)
async def get_listings(
    skip: int = Query(0, ge=0, description="Skip count"),
    limit: int = Query(20, ge=1, le=100, description="Limit count"),
    city: Optional[str] = Query(None, description="Filter by city"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort_by: str = Query("created_at", description="Sort field: created_at, price"),
):
    """
    Get all listings with optional filters

    Query parameters:
    - **skip**: Number of results to skip (pagination)
    - **limit**: Max results per page (default 20, max 100)
    - **city**: Filter by city name
    - **min_price**: Minimum price in EUR
    - **max_price**: Maximum price in EUR
    - **sort_by**: Sort by field (created_at, price)
    """
    logger.info(f"📋 Getting listings (skip={skip}, limit={limit}, city={city})")

    try:
        # TODO: Query database
        # listings = db.query(Listing)
        #   .filter_by(status='active')
        #   .filter(Listing.city == city) if city
        #   .filter(Listing.price >= min_price) if min_price
        #   .filter(Listing.price <= max_price) if max_price
        #   .order_by(sort_by)
        #   .offset(skip)
        #   .limit(limit)
        #   .all()

        return []  # Return dummy data for now
    except Exception as e:
        logger.error(f"❌ Failed to get listings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve listings"
        )


@router.post(
    "",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new listing"
)
async def create_listing(
    data: CreateListingRequest,
    current_user = Depends(lambda: {"id": 1})  # TODO: real user
):
    """
    Create a new property listing

    Required fields:
    - **title**: Listing title (5-200 characters)
    - **description**: Detailed description (20-5000 characters)
    - **price**: Price in EUR (must be > 0)
    - **property**: Property details (type, rooms, area, address, etc.)

    Optional:
    - **images**: List of image URLs
    - **features**: List of amenities/features
    """
    logger.info(f"📝 Creating listing: {data.title} by user {current_user['id']}")

    try:
        # TODO: Create in database
        # listing = Listing(
        #     title=data.title,
        #     description=data.description,
        #     price=data.price,
        #     seller_id=current_user['id'],
        #     ...
        # )
        # db.session.add(listing)
        # db.session.commit()

        return ListingResponse(
            id=1,
            title=data.title,
            description=data.description,
            price=data.price,
            property=data.property,
            seller_id=current_user['id'],
            seller_name="John Doe",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Failed to create listing: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create listing: {e}"
        )


@router.get(
    "/{listing_id}",
    response_model=ListingResponse,
    summary="Get listing details"
)
async def get_listing(listing_id: int):
    """
    Get detailed information about a specific listing

    Path parameters:
    - **listing_id**: ID of the listing to retrieve
    """
    logger.info(f"🔍 Getting listing {listing_id}")

    try:
        # TODO: Query database
        # listing = db.query(Listing).get(listing_id)
        # if not listing:
        #     raise HTTPException(status_code=404, detail="Listing not found")

        # Increment view count
        # listing.views += 1
        # db.session.commit()

        return ListingResponse(
            id=listing_id,
            title="Beautiful apartment in Paris",
            description="A lovely 2-bedroom apartment with stunning views",
            price=500000.0,
            property=PropertyDetails(
                type="apartment",
                rooms=2,
                bathrooms=1,
                area=75.0,
                address="123 Rue de la Paix",
                city="Paris",
                postal_code="75000"
            ),
            seller_id=1,
            seller_name="John Doe",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Failed to get listing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve listing"
        )


@router.put(
    "/{listing_id}",
    response_model=ListingResponse,
    summary="Update listing"
)
async def update_listing(
    listing_id: int,
    data: UpdateListingRequest,
    current_user = Depends(lambda: {"id": 1})  # TODO: real user
):
    """
    Update an existing listing

    Only the listing owner can update it.
    """
    logger.info(f"✏️ Updating listing {listing_id} by user {current_user['id']}")

    try:
        # TODO: Query and update database
        # listing = db.query(Listing).get(listing_id)
        # if not listing:
        #     raise HTTPException(status_code=404, detail="Listing not found")
        # if listing.seller_id != current_user['id']:
        #     raise HTTPException(status_code=403, detail="Not authorized")

        # Update fields
        # if data.title:
        #     listing.title = data.title
        # ... etc

        return ListingResponse(
            id=listing_id,
            title=data.title or "Updated title",
            description=data.description or "Updated description",
            price=data.price or 500000,
            property=data.property or PropertyDetails(...),
            seller_id=current_user['id'],
            seller_name="John Doe",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"❌ Failed to update listing: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update listing: {e}"
        )


@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete listing"
)
async def delete_listing(
    listing_id: int,
    current_user = Depends(lambda: {"id": 1})  # TODO: real user
):
    """
    Delete a listing

    Only the listing owner can delete it.
    """
    logger.info(f"🗑️ Deleting listing {listing_id} by user {current_user['id']}")

    try:
        # TODO: Query and delete from database
        # listing = db.query(Listing).get(listing_id)
        # if not listing:
        #     raise HTTPException(status_code=404, detail="Listing not found")
        # if listing.seller_id != current_user['id']:
        #     raise HTTPException(status_code=403, detail="Not authorized")
        # db.session.delete(listing)
        # db.session.commit()

        return None
    except Exception as e:
        logger.error(f"❌ Failed to delete listing: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete listing: {e}"
        )
