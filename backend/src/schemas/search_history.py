"""
Pydantic schemas for search history
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class SearchHistoryCreate(BaseModel):
    """Schema for recording a search"""
    ville: Optional[str] = None
    type_bien: Optional[str] = None
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    surface_min: Optional[float] = Field(None, ge=0)
    surface_max: Optional[float] = Field(None, ge=0)
    pieces_min: Optional[int] = Field(None, ge=1)
    nombre_resultats: int = 0


class SearchHistoryResponse(BaseModel):
    """Schema for search history record response"""
    search_id: int
    user_id: Optional[int]
    ville: Optional[str]
    type_bien: Optional[str]
    budget_min: Optional[float]
    budget_max: Optional[float]
    surface_min: Optional[float]
    surface_max: Optional[float]
    pieces_min: Optional[int]
    date_search: datetime
    nombre_resultats: int

    class Config:
        from_attributes = True


class SearchPreferencesResponse(BaseModel):
    """Schema for user's search preferences"""
    avg_budget_min: Optional[float] = None
    avg_budget_max: Optional[float] = None
    avg_surface_min: Optional[float] = None
    most_common_ville: Optional[str] = None
    most_common_type: Optional[str] = None
    total_searches: int


class TrendingSearchResponse(BaseModel):
    """Schema for trending search terms"""
    ville: Optional[str] = None
    type_bien: Optional[str] = None
    count: int


class SearchVilleStatsResponse(BaseModel):
    """Schema for search statistics by city"""
    ville: str
    total_searches: int
    avg_budget_min: float
    avg_budget_max: float
    type_breakdown: Dict[str, int]


class PopularVilleResponse(BaseModel):
    """Schema for popular city"""
    ville: str
    count: int


class PopularTypeResponse(BaseModel):
    """Schema for popular property type"""
    type_bien: str
    count: int


class SearchHistoryListResponse(BaseModel):
    """Schema for paginated search history"""
    items: List[SearchHistoryResponse]
    total: int
    skip: int
    limit: int


class SearchAnalyticsResponse(BaseModel):
    """Schema for search analytics"""
    trending_searches: List[TrendingSearchResponse]
    popular_villes: List[PopularVilleResponse]
    popular_types: List[PopularTypeResponse]
    total_searches_7days: int
    total_searches_30days: int
