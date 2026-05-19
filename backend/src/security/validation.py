"""
Validation d'input et sanitization pour l'API Admin
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List
import re
from html import escape

class SanitizedStr(str):
    """String qui est automatiquement sanitizée (XSS protection)"""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            return v
        # Escaper les caractères HTML
        return escape(v.strip())


class RoleChangeRequest(BaseModel):
    """Validation pour changement de rôle"""
    new_role: str = Field(..., pattern='^(user|admin)$')

    class Config:
        schema_extra = {
            "example": {"new_role": "admin"}
        }


class SuspendUserRequest(BaseModel):
    """Validation pour suspension d'utilisateur"""
    duration_hours: int = Field(..., gt=0, le=8760)  # Max 1 an
    reason: Optional[SanitizedStr] = Field(None, max_length=500)

    class Config:
        schema_extra = {
            "example": {
                "duration_hours": 24,
                "reason": "Comportement suspect"
            }
        }


class ListingApprovalRequest(BaseModel):
    """Validation pour approbation d'annonce"""
    pass  # Pas de paramètres requis


class ListingRejectionRequest(BaseModel):
    """Validation pour rejet d'annonce"""
    reason: SanitizedStr = Field(..., min_length=10, max_length=500)

    class Config:
        schema_extra = {
            "example": {
                "reason": "Photos insuffisantes ou données manquantes"
            }
        }


class TransactionActionRequest(BaseModel):
    """Validation pour actions sur transactions"""
    reason: Optional[SanitizedStr] = Field(None, max_length=500)

    class Config:
        schema_extra = {
            "example": {
                "reason": "Accord obtenu à prix différent"
            }
        }


class SettingsUpdateRequest(BaseModel):
    """Validation pour update de paramètres"""
    value: str = Field(..., max_length=1000)

    @validator('value')
    def validate_value(cls, v):
        """Validation basique de la valeur"""
        if not v or not str(v).strip():
            raise ValueError('Value cannot be empty')
        return str(v).strip()

    class Config:
        schema_extra = {
            "example": {"value": "true"}
        }


class DeleteUserRequest(BaseModel):
    """Validation pour suppression d'utilisateur"""
    confirm: bool = Field(..., description="Confirmation de suppression")
    reason: Optional[SanitizedStr] = Field(None, max_length=500)

    @validator('confirm')
    def validate_confirm(cls, v):
        if not v:
            raise ValueError('Suppression doit être confirmée')
        return v

    class Config:
        schema_extra = {
            "example": {
                "confirm": True,
                "reason": "Utilisateur inactif"
            }
        }


class SearchRequest(BaseModel):
    """Validation pour recherche"""
    q: SanitizedStr = Field(..., min_length=2, max_length=100)

    class Config:
        schema_extra = {
            "example": {"q": "jean dupont"}
        }


class PaginationParams(BaseModel):
    """Validation pour paramètres de pagination"""
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=500)

    class Config:
        schema_extra = {
            "example": {"skip": 0, "limit": 50}
        }


# Fonctions de validation utiles
def validate_email(email: str) -> bool:
    """Valider un format email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_input(text: str) -> str:
    """Sanitizer un input texte (XSS protection)"""
    if not isinstance(text, str):
        return text

    # Escaper les caractères HTML
    text = escape(text)

    # Retirer les caractères de contrôle
    text = ''.join(char for char in text if ord(char) >= 32 or char == '\n')

    return text.strip()


def validate_phone(phone: str) -> bool:
    """Valider un numéro de téléphone"""
    # Format: +33 ou 0, suivi de 9 chiffres
    pattern = r'^(?:\+33|0)[1-9](?:[0-9]{8})$'
    return bool(re.match(pattern, phone.replace(' ', '').replace('.', '')))


def validate_url(url: str) -> bool:
    """Valider une URL"""
    pattern = r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[a-zA-Z0-9._~:/?#[\]@!$&\'()*+,;=-]*)?$'
    return bool(re.match(pattern, url))


class ValidationError(Exception):
    """Exception pour erreur de validation"""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(message)


def validate_request_data(data: dict, required_fields: list = None,
                         allowed_fields: list = None) -> dict:
    """
    Valider les données d'une requête

    Args:
        data: Dictionnaire à valider
        required_fields: Champs obligatoires
        allowed_fields: Champs autorisés (rejecter les autres)

    Returns:
        Données validées

    Raises:
        ValidationError si validation échoue
    """
    if not data:
        raise ValidationError('Données manquantes')

    # Vérifier les champs obligatoires
    if required_fields:
        for field in required_fields:
            if field not in data or data[field] is None:
                raise ValidationError(f'Champ requis: {field}', field)

    # Vérifier les champs autorisés
    if allowed_fields:
        for field in data:
            if field not in allowed_fields:
                raise ValidationError(f'Champ non autorisé: {field}', field)

    # Sanitizer les strings
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_input(value)
        else:
            sanitized[key] = value

    return sanitized
