"""
Pydantic schemas for favorites
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class FavoriCreate(BaseModel):
    """Schema for adding a favorite"""
    annonce_id: int
    note: Optional[int] = Field(None, ge=1, le=5)
    commentaire: Optional[str] = Field(None, max_length=500)


class FavoriUpdate(BaseModel):
    """Schema for updating a favorite"""
    note: Optional[int] = Field(None, ge=1, le=5)
    commentaire: Optional[str] = Field(None, max_length=500)


class FavoriResponse(BaseModel):
    """Schema for favorite response"""
    favori_id: int
    user_id: int
    annonce_id: int
    date_ajout: datetime
    note: Optional[int]
    commentaire: Optional[str]

    class Config:
        from_attributes = True


class FavoriDetailResponse(FavoriResponse):
    """Extended favorite response with annonce details"""
    annonce_titre: Optional[str] = None
    annonce_prix: Optional[float] = None
    annonce_ville: Optional[str] = None
    annonce_adresse: Optional[str] = None
    annonce_type: Optional[str] = None


class FavoriListResponse(BaseModel):
    """Schema for paginated favorite list"""
    items: List[FavoriDetailResponse]
    total: int
    skip: int
    limit: int


class FavoriCountResponse(BaseModel):
    """Schema for favorite count"""
    annonce_id: int
    count: int


class TopRatedAnnonceResponse(BaseModel):
    """Schema for top rated annonce"""
    annonce_id: int
    titre: str
    avg_rating: float
    favorite_count: int


class MostFavoritedAnnonceResponse(BaseModel):
    """Schema for most favorited annonce"""
    annonce_id: int
    titre: str
    count: int


class FavoriBreakdownResponse(BaseModel):
    """Schema for favorite breakdown"""
    type_bien: Optional[str]
    ville: Optional[str]
    count: int


class FavoriStatsResponse(BaseModel):
    """Schema for favorite statistics"""
    total_favorites: int
    favorite_types: dict
    favorite_villes: dict
    avg_rating: Optional[float] = None
    user_preferences: Optional[dict] = None


class AddFavoriResponse(BaseModel):
    """Schema for successful favorite addition"""
    favori_id: int
    annonce_id: int
    date_ajout: datetime
    message: str = "Added to favorites"


class RemoveFavoriResponse(BaseModel):
    """Schema for successful favorite removal"""
    annonce_id: int
    message: str = "Removed from favorites"
