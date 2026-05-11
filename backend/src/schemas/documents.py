"""
Pydantic schemas for documents
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class DocumentCreate(BaseModel):
    """Schema for creating a document"""
    annonce_id: int
    nom: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1)
    mime_type: Optional[str] = None
    taille: int = Field(..., gt=0, le=52428800)  # Max 50MB
    visible_pour_tous: bool = True
    date_expiration: Optional[datetime] = None

    @validator('nom')
    def validate_nom(cls, v):
        if not v or not v.strip():
            raise ValueError('nom cannot be empty')
        return v.strip()


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata"""
    nom: Optional[str] = Field(None, min_length=1, max_length=255)
    visible_pour_tous: Optional[bool] = None
    date_expiration: Optional[datetime] = None


class DocumentResponse(BaseModel):
    """Schema for document response"""
    document_id: int
    annonce_id: int
    nom: str
    type: str
    url: str
    taille: int
    mime_type: Optional[str]
    date_upload: datetime
    date_expiration: Optional[datetime]
    visible_pour_tous: bool
    telecharge: int

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    """Extended document response with annonce info"""
    annonce_titre: Optional[str] = None
    annonce_adresse: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Schema for paginated document list"""
    items: List[DocumentResponse]
    total: int
    skip: int
    limit: int


class DocumentStatsResponse(BaseModel):
    """Schema for document statistics"""
    total_documents: int
    total_size_bytes: int
    total_downloads: int
    type_breakdown: dict  # {"type": count}


class DocumentUploadResponse(BaseModel):
    """Schema for successful document upload"""
    document_id: int
    nom: str
    type: str
    taille: int
    url: str
    message: str = "Document uploaded successfully"
