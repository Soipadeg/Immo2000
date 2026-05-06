"""
Schémas Pydantic pour la validation des requêtes/réponses visites.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class VisiteInput(BaseModel):
    """Schéma de validation pour la création d'une visite."""

    acheteur_id: int = Field(..., gt=0, description="ID de l'acheteur")
    annonce_id: int = Field(..., gt=0, description="ID de l'annonce")
    date_heure: str = Field(
        ...,
        description="Date et heure de la visite en format ISO 8601 (ex: 2026-05-20T14:00:00)"
    )

    @validator("date_heure")
    def validate_date_format(cls, v):
        """Valider que la date est au format ISO 8601."""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Format de date invalide. Utilisez ISO 8601 (ex: 2026-05-20T14:00:00)")
        return v

    class Config:
        schema_extra = {
            "example": {
                "acheteur_id": 1,
                "annonce_id": 5,
                "date_heure": "2026-05-20T14:00:00"
            }
        }


class VisiteOutput(BaseModel):
    """Schéma de validation pour la réponse de création d'une visite."""

    id: int
    acheteur_id: int
    annonce_id: int
    date_heure: str
    statut: str
    score_matching: int
    message: str

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "acheteur_id": 1,
                "annonce_id": 5,
                "date_heure": "2026-05-20T14:00:00",
                "statut": "confirmee",
                "score_matching": 5,
                "message": "Visite créée avec succès. Notification envoyée au vendeur."
            }
        }


class VisiteResponse(BaseModel):
    """Schéma de visite pour GET requests."""

    id: int
    acheteur_id: int
    annonce_id: int
    date_heure: str
    statut: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "acheteur_id": 1,
                "annonce_id": 5,
                "date_heure": "2026-05-20T14:00:00",
                "statut": "confirmee",
                "created_at": "2026-05-06T10:30:00",
                "updated_at": "2026-05-06T10:30:00"
            }
        }


class ErrorResponse(BaseModel):
    """Schéma de réponse d'erreur."""

    status: str = "error"
    error: str
    code: int

    class Config:
        schema_extra = {
            "example": {
                "status": "error",
                "error": "La date de visite ne peut pas être dans le passé.",
                "code": 400
            }
        }
