"""
Pydantic schemas for purchase offers
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime


class OffreCreate(BaseModel):
    """Schema for creating an offer"""
    annonce_id: int
    prix_propose: float = Field(..., gt=0)
    message: Optional[str] = Field(None, max_length=1000)
    conditions: Optional[Dict] = None


class OffreUpdate(BaseModel):
    """Schema for updating an offer"""
    prix_propose: Optional[float] = Field(None, gt=0)
    message: Optional[str] = Field(None, max_length=1000)
    conditions: Optional[Dict] = None


class OffreStatusUpdate(BaseModel):
    """Schema for updating offer status"""
    statut: str = Field(..., min_length=1)

    @validator('statut')
    def validate_statut(cls, v):
        valid_statuts = ['proposee', 'acceptee', 'refusee', 'negociation', 'retiree', 'finalisee']
        if v not in valid_statuts:
            raise ValueError(f'Invalid status. Must be one of: {", ".join(valid_statuts)}')
        return v


class CounterOffreRequest(BaseModel):
    """Schema for counter offer"""
    new_price: float = Field(..., gt=0)
    message: Optional[str] = Field(None, max_length=1000)


class OffreResponse(BaseModel):
    """Schema for offer response"""
    offre_id: int
    annonce_id: int
    acheteur_id: int
    prix_propose: float
    statut: str
    message: Optional[str]
    date_offre: datetime
    date_reponse: Optional[datetime]
    conditions: Optional[Dict]

    class Config:
        from_attributes = True


class OffreDetailResponse(OffreResponse):
    """Extended offer response with annonce and buyer details"""
    annonce_titre: Optional[str] = None
    annonce_prix: Optional[float] = None
    annonce_adresse: Optional[str] = None
    acheteur_nom: Optional[str] = None
    acheteur_email: Optional[str] = None
    acheteur_phone: Optional[str] = None
    price_difference_percent: Optional[float] = None


class OffreListResponse(BaseModel):
    """Schema for paginated offer list"""
    items: List[OffreResponse]
    total: int
    skip: int
    limit: int


class OffreStatsResponse(BaseModel):
    """Schema for offer statistics"""
    total_offers: int
    status_breakdown: Dict[str, int]
    avg_proposed_price: float
    min_proposed_price: float
    max_proposed_price: float
    avg_response_time_hours: Optional[float] = None


class OffreAnnonceStatsResponse(BaseModel):
    """Schema for offer statistics per annonce"""
    total_offers: int
    avg_proposed_price: float
    min_proposed_price: float
    max_proposed_price: float
    last_offer: Optional[OffreResponse] = None


class PendingOffresResponse(BaseModel):
    """Schema for pending offers"""
    items: List[OffreDetailResponse]
    count: int


class CreateOffreResponse(BaseModel):
    """Schema for successful offer creation"""
    offre_id: int
    annonce_id: int
    prix_propose: float
    date_offre: datetime
    message: str = "Offer created successfully"


class UpdateOffreResponse(BaseModel):
    """Schema for successful offer update"""
    offre_id: int
    statut: str
    date_reponse: datetime
    message: str = "Offer updated successfully"


class OffreStatusStats(BaseModel):
    """Schema for offer status statistics"""
    proposee: int
    acceptee: int
    refusee: int
    negociation: int
    retiree: int
    finalisee: int


class OffresAnalyticsResponse(BaseModel):
    """Schema for comprehensive offers analytics"""
    total_offers: int
    status_stats: OffreStatusStats
    avg_price: float
    price_range: Dict[str, float]
    response_time_stats: Dict[str, float]
    top_offers: List[OffreDetailResponse]
