"""
Schémas Pydantic pour les alertes d'annonces.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CreateAlerteAnnonce(BaseModel):
    """
    Schéma pour la création d'une alerte (POST /alertes).
    """

    nom: str = Field(..., min_length=1, max_length=200, description="Nom de l'alerte")

    # Critères
    ville: Optional[str] = Field(default=None, description="Ville")
    code_postal: Optional[str] = Field(default=None, description="Code postal (5 chiffres)")
    type_bien: Optional[str] = Field(default=None, description="Type de bien")
    prix_min: Optional[float] = Field(default=None, ge=0, description="Prix minimum")
    prix_max: Optional[float] = Field(default=None, ge=0, description="Prix maximum")
    surface_min: Optional[float] = Field(default=None, gt=0, description="Surface minimale")
    surface_max: Optional[float] = Field(default=None, gt=0, description="Surface maximale")
    nombre_pieces_min: Optional[int] = Field(default=None, ge=1, description="Nombre pièces min")
    nombre_pieces_max: Optional[int] = Field(default=None, ge=1, description="Nombre pièces max")
    dpe: Optional[str] = Field(default=None, description="DPE (A-G)")

    # Équipements
    ascenseur: bool = Field(default=False)
    balcon: bool = Field(default=False)
    terrasse: bool = Field(default=False)
    jardin: bool = Field(default=False)
    piscine: bool = Field(default=False)
    parking: bool = Field(default=False)

    # Configuration
    frequence: str = Field(default="quotidienne", description="'quotidienne', 'hebdomadaire', 'immediatement'")
    email_notification: bool = Field(default=True)

    class Config:
        json_schema_extra = {
            "example": {
                "nom": "Appartement Paris 3 pièces",
                "ville": "Paris",
                "type_bien": "appartement",
                "prix_min": 300000,
                "prix_max": 500000,
                "surface_min": 80,
                "surface_max": 120,
                "nombre_pieces_min": 3,
                "nombre_pieces_max": 3,
                "ascenseur": True,
                "parking": True,
                "frequence": "quotidienne",
                "email_notification": True,
            }
        }


class UpdateAlerteAnnonce(BaseModel):
    """
    Schéma pour la mise à jour d'une alerte (PUT /alertes/{id}).
    """

    nom: Optional[str] = Field(default=None, min_length=1, max_length=200)
    ville: Optional[str] = None
    code_postal: Optional[str] = None
    type_bien: Optional[str] = None
    prix_min: Optional[float] = None
    prix_max: Optional[float] = None
    surface_min: Optional[float] = None
    surface_max: Optional[float] = None
    nombre_pieces_min: Optional[int] = None
    nombre_pieces_max: Optional[int] = None
    dpe: Optional[str] = None
    ascenseur: Optional[bool] = None
    balcon: Optional[bool] = None
    terrasse: Optional[bool] = None
    jardin: Optional[bool] = None
    piscine: Optional[bool] = None
    parking: Optional[bool] = None
    frequence: Optional[str] = None
    email_notification: Optional[bool] = None
    actif: Optional[bool] = None


class AlerteAnnonceResponse(BaseModel):
    """
    Schéma de réponse pour une alerte.
    """

    alerte_id: int
    utilisateur_id: int
    nom: str
    ville: Optional[str]
    code_postal: Optional[str]
    type_bien: Optional[str]
    prix_min: Optional[float]
    prix_max: Optional[float]
    surface_min: Optional[float]
    surface_max: Optional[float]
    nombre_pieces_min: Optional[int]
    nombre_pieces_max: Optional[int]
    dpe: Optional[str]
    ascenseur: bool
    balcon: bool
    terrasse: bool
    jardin: bool
    piscine: bool
    parking: bool
    actif: bool
    frequence: str
    email_notification: bool
    date_creation: datetime
    date_derniere_notification: Optional[datetime]
    date_derniere_modification: datetime

    class Config:
        from_attributes = True


class AlerteAnnonceListResponse(BaseModel):
    """
    Schéma de réponse pour la liste des alertes.
    """

    items: list[AlerteAnnonceResponse]
    total: int
    skip: int
    limit: int
