"""
Schémas Pydantic pour les messages.

Validation des données d'entrée et de sortie pour les endpoints de messagerie.
"""

from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional


class CreateMessage(BaseModel):
    """Schéma pour créer un message."""

    receiver_id: int = Field(..., description="ID du destinataire")
    annonce_id: int = Field(..., description="ID de l'annonce concernée")
    contenu: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Contenu du message (1 à 2000 caractères)"
    )

    @validator('contenu')
    def contenu_not_empty(cls, v):
        """Valider que le contenu n'est pas vide."""
        if not v.strip():
            raise ValueError('Le contenu du message ne peut pas être vide')
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "receiver_id": 2,
                "annonce_id": 1,
                "contenu": "Bonjour, je suis intéressé par cette annonce. Pouvez-vous me donner plus d'informations?"
            }
        }


class MessageResponse(BaseModel):
    """Schéma de réponse pour un message."""

    message_id: int
    sender_id: int
    receiver_id: int
    annonce_id: int
    contenu: str
    date_creation: datetime
    lu: bool
    date_lecture: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        """Convertir depuis un objet ORM SQLAlchemy."""
        return cls(
            message_id=obj.message_id,
            sender_id=obj.sender_id,
            receiver_id=obj.receiver_id,
            annonce_id=obj.annonce_id,
            contenu=obj.contenu,
            date_creation=obj.date_creation,
            lu=obj.lu,
            date_lecture=obj.date_lecture
        )


class MessageDetailResponse(MessageResponse):
    """Schéma de réponse détaillé pour un message."""

    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    annonce_titre: Optional[str] = None

    @classmethod
    def from_orm_with_details(cls, message_obj, sender_obj, receiver_obj, annonce_obj):
        """Convertir avec les détails des utilisateurs et de l'annonce."""
        return cls(
            message_id=message_obj.message_id,
            sender_id=message_obj.sender_id,
            receiver_id=message_obj.receiver_id,
            annonce_id=message_obj.annonce_id,
            contenu=message_obj.contenu,
            date_creation=message_obj.date_creation,
            lu=message_obj.lu,
            date_lecture=message_obj.date_lecture,
            sender_name=f"{sender_obj.prenom} {sender_obj.nom}" if sender_obj else None,
            receiver_name=f"{receiver_obj.prenom} {receiver_obj.nom}" if receiver_obj else None,
            annonce_titre=annonce_obj.titre if annonce_obj else None
        )


class MessageListResponse(BaseModel):
    """Schéma de réponse pour une liste de messages."""

    messages: list[MessageDetailResponse]
    total: int
    skip: int
    limit: int

    class Config:
        schema_extra = {
            "example": {
                "messages": [
                    {
                        "message_id": 1,
                        "sender_id": 1,
                        "receiver_id": 2,
                        "annonce_id": 1,
                        "contenu": "Bonjour...",
                        "date_creation": "2026-05-11T10:30:00",
                        "lu": True,
                        "date_lecture": "2026-05-11T10:35:00",
                        "sender_name": "Jean Dupont",
                        "receiver_name": "Marie Martin",
                        "annonce_titre": "Belle maison à Paris"
                    }
                ],
                "total": 5,
                "skip": 0,
                "limit": 20
            }
        }


class ErrorResponse(BaseModel):
    """Schéma de réponse pour les erreurs."""

    error: str
    code: int
    details: Optional[dict] = None

    class Config:
        schema_extra = {
            "example": {
                "error": "Message not found",
                "code": 404,
                "details": {"message_id": 1}
            }
        }
