"""
Schémas Pydantic pour les rendez-vous.

Validation et sérialisation des données RDV.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreateRDV(BaseModel):
    """
    Schéma pour créer un rendez-vous (POST /api/v1/rendez-vous).

    L'acheteur propose une date/heure initiale avec message.
    """

    annonce_id: int = Field(..., description="ID de l'annonce concernée")
    date_proposée: datetime = Field(..., description="Date et heure proposées")
    message: str = Field(..., min_length=1, max_length=500, description="Message proposé par l'acheteur")

    class Config:
        json_schema_extra = {
            "example": {
                "annonce_id": 1,
                "date_proposée": "2026-05-20T14:00:00",
                "message": "Bonjour, je serais disponible le 20 mai à 14h pour visiter"
            }
        }


class UpdateRDV(BaseModel):
    """
    Schéma pour répondre à un rendez-vous (PUT /api/v1/rendez-vous/{id}).

    L'autre utilisateur (acheteur ou vendeur) peut:
    - Accepter la date proposée
    - Refuser et proposer une nouvelle date
    """

    action: str = Field(..., description="'accepter' ou 'refuser'")
    date_proposée: Optional[datetime] = Field(None, description="Nouvelle date si refus et contre-proposition")
    message: Optional[str] = Field(None, min_length=1, max_length=500, description="Réponse/contre-proposition")

    class Config:
        json_schema_extra = {
            "example_accept": {
                "action": "accepter",
                "message": "Parfait, à bientôt!"
            },
            "example_refuse": {
                "action": "refuser",
                "date_proposée": "2026-05-21T15:00:00",
                "message": "Le 20 me convient pas, peut-être le 21 à 15h?"
            }
        }


class RDVResponse(BaseModel):
    """
    Schéma de réponse pour un rendez-vous.

    Utilisé pour GET, POST, PUT.
    """

    rdv_id: int
    annonce_id: int
    acheteur_id: int
    vendeur_id: int
    statut: str
    date_proposée: datetime
    date_confirmée: Optional[datetime] = None
    message_dernier: Optional[str] = None
    dernier_proposant: str
    date_création: datetime
    date_dernière_modification: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "rdv_id": 1,
                "annonce_id": 1,
                "acheteur_id": 2,
                "vendeur_id": 1,
                "statut": "confirmé",
                "date_proposée": "2026-05-20T14:00:00",
                "date_confirmée": "2026-05-20T14:00:00",
                "message_dernier": "Parfait, à bientôt!",
                "dernier_proposant": "acheteur",
                "date_création": "2026-05-12T10:00:00",
                "date_dernière_modification": "2026-05-12T11:30:00"
            }
        }


class RDVListResponse(BaseModel):
    """Réponse listée avec pagination."""

    items: list[RDVResponse]
    total: int
    skip: int
    limit: int
