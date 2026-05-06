"""
Schémas Pydantic pour la validation des données de feedback.
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional


class FeedbackInput(BaseModel):
    """Schéma de validation pour la création/modification de feedback."""

    visite_id: int = Field(..., gt=0, description="ID de la visite")
    note: int = Field(..., ge=1, le=5, description="Note de 1 à 5")
    commentaire: Optional[str] = Field(None, max_length=1000, description="Avis textuel")

    @field_validator("commentaire")
    @classmethod
    def validate_commentaire(cls, v):
        """Vérifier que le commentaire n'est pas vide s'il est fourni."""
        if v is not None and isinstance(v, str):
            v = v.strip()
            if v == "":
                raise ValueError("Le commentaire ne peut pas être vide")
        return v


class FeedbackReponseInput(BaseModel):
    """Schéma de validation pour la réponse du vendeur au feedback."""

    reponse_vendeur: str = Field(..., min_length=1, max_length=1000, description="Réponse du vendeur")

    @field_validator("reponse_vendeur")
    @classmethod
    def validate_reponse(cls, v):
        """Vérifier que la réponse n'est pas vide."""
        if isinstance(v, str):
            v = v.strip()
            if v == "":
                raise ValueError("La réponse ne peut pas être vide")
        return v


class FeedbackOutput(BaseModel):
    """Schéma de sortie pour un feedback."""

    id: int
    visite_id: int
    acheteur_id: int
    note: int
    commentaire: Optional[str]
    reponse_vendeur: Optional[str]
    created_at: datetime
    updated_at: datetime
    message: Optional[str] = None

    class Config:
        from_attributes = True


class FeedbackPublicOutput(BaseModel):
    """Schéma public de feedback (sans acheteur_id pour la confidentialité)."""

    id: int
    visite_id: int
    note: int
    commentaire: Optional[str]
    reponse_vendeur: Optional[str]
    created_at: datetime


class ErrorResponse(BaseModel):
    """Schéma générique de réponse d'erreur."""

    status: str = "error"
    error: str
    code: Optional[str] = None
