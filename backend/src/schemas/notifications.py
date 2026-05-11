"""
Schémas Pydantic pour les notifications.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    """Schéma de base pour une notification"""
    type: str
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    action_url: Optional[str] = None
    icon: Optional[str] = None


class NotificationCreate(NotificationBase):
    """Schéma pour créer une notification"""
    pass


class NotificationUpdate(BaseModel):
    """Schéma pour mettre à jour une notification"""
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    """Schéma pour la réponse de notification"""
    notification_id: int
    user_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class NotificationListResponse(BaseModel):
    """Schéma pour la réponse liste de notifications"""
    success: bool
    data: list[NotificationResponse]
    pagination: dict


class UnreadCountResponse(BaseModel):
    """Schéma pour la réponse du compte de notifications non lues"""
    success: bool
    unread_count: int
    has_unread: bool


class NotificationSummaryResponse(BaseModel):
    """Schéma pour un résumé de notifications"""
    total: int
    unread: int
    has_unread: bool
