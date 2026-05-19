"""
Utilitaires pour les réponses standardisées et la gestion des erreurs.
"""

from fastapi import HTTPException, status
from typing import Any, Optional, Dict


class APIError(HTTPException):
    """Exception personnalisée pour l'API."""

    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.error_code = error_code
        self.message = message
        self.details = details or {}

        # Construire le contenu de la réponse
        content = {
            "status": "error",
            "error": error_code,
            "message": message,
        }
        if details:
            content["details"] = details

        super().__init__(
            status_code=status_code,
            detail=content,
            headers=headers
        )


class NotFoundError(APIError):
    """Erreur 404."""

    def __init__(self, resource: str, resource_id: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            message=f"{resource} avec l'ID {resource_id} non trouvé(e)"
        )


class UnauthorizedError(APIError):
    """Erreur 401."""

    def __init__(self, message: str = "Non authentifié"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            message=message,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ForbiddenError(APIError):
    """Erreur 403."""

    def __init__(self, message: str = "Accès refusé"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            message=message
        )


class ValidationError(APIError):
    """Erreur 422."""

    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            message=message,
            details=details
        )


class ConflictError(APIError):
    """Erreur 409."""

    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT",
            message=message
        )


class InternalServerError(APIError):
    """Erreur 500."""

    def __init__(self, message: str = "Erreur interne du serveur"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_SERVER_ERROR",
            message=message
        )


# ============================================================================
# Réponses standardisées
# ============================================================================

def success_response(data: Any, message: Optional[str] = None) -> Dict:
    """
    Construire une réponse de succès.

    Example:
        return success_response({"id": 1, "name": "Item"})
    """
    return {
        "status": "success",
        "data": data,
        "message": message
    }


def error_response(
    error_code: str,
    message: str,
    details: Optional[Dict] = None
) -> Dict:
    """
    Construire une réponse d'erreur.
    """
    response = {
        "status": "error",
        "error": error_code,
        "message": message,
    }
    if details:
        response["details"] = details
    return response
