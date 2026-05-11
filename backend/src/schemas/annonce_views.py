"""
Pydantic schemas for annonce views and analytics
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class AnnonceViewCreate(BaseModel):
    """Schema for recording a view"""
    annonce_id: int
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    source: str = Field(default='direct', min_length=1)
    duree_vue: int = Field(default=0, ge=0)


class AnnonceViewResponse(BaseModel):
    """Schema for view record response"""
    view_id: int
    annonce_id: int
    user_id: Optional[int]
    ip_address: Optional[str]
    date_view: datetime
    source: str
    duree_vue: int

    class Config:
        from_attributes = True


class ViewDayResponse(BaseModel):
    """Schema for daily view count"""
    date: datetime
    count: int


class ViewStatsResponse(BaseModel):
    """Schema for view statistics"""
    total_views: int
    weekly_views: List[ViewDayResponse]
    views_by_source: Dict[str, int]
    avg_view_duration_seconds: float
    last_view: Optional[AnnonceViewResponse] = None


class ViewBreakdownResponse(BaseModel):
    """Schema for view source breakdown"""
    source: str
    count: int
    percentage: float


class ViewTrendResponse(BaseModel):
    """Schema for view trend data"""
    date: str
    count: int
    change_percent: Optional[float] = None


class VendorViewStatsResponse(BaseModel):
    """Schema for vendor's view statistics across annonces"""
    annonce_id: int
    titre: str
    views: int


class TrendingAnnonceResponse(BaseModel):
    """Schema for trending annonce"""
    annonce_id: int
    titre: str
    views: int
    rank: Optional[int] = None


class ViewStatsListResponse(BaseModel):
    """Schema for paginated view stats"""
    items: List[AnnonceViewResponse]
    total: int
    skip: int
    limit: int
