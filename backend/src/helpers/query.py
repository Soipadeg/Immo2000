"""
Helpers centralisés pour les CRUD operations.

Évite la duplication de code et centralise les patterns:
- Pagination
- Eager loading (joinedload)
- Permission checks
"""

from sqlalchemy.orm import Session, joinedload
from typing import Tuple, List, Any, Callable, Optional
from functools import wraps


# ===== PAGINATION =====

class PaginationParams:
    """Paramètres de pagination standardisés."""

    DEFAULT_SKIP = 0
    DEFAULT_LIMIT = 20
    MAX_LIMIT = 100

    def __init__(self, skip: int = None, limit: int = None):
        """Initialiser avec validation."""
        self.skip = max(0, int(skip or self.DEFAULT_SKIP))
        self.limit = min(int(limit or self.DEFAULT_LIMIT), self.MAX_LIMIT)

    def to_dict(self) -> dict:
        """Retourner dict pour query."""
        return {"skip": self.skip, "limit": self.limit}


def paginate_query(query, skip: int = 0, limit: int = 20) -> Tuple[List, int]:
    """
    Paginer une query SQLAlchemy.

    Returns:
        (items, total_count)
    """
    pagination = PaginationParams(skip, limit)
    total = query.count()
    items = query.offset(pagination.skip).limit(pagination.limit).all()
    return items, total


# ===== EAGER LOADING =====

def with_relationships(model_class: type, *relationships: str):
    """
    Décorateur pour charger automatiquement les relationships.

    Exemple:
        @with_relationships(Offre, 'annonce', 'acheteur')
        def list_offers(db, skip, limit):
            query = db.query(Offre)
            return query  # relationships seront automatiquement loadées
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Appeler la fonction pour obtenir la query
            query = func(*args, **kwargs)

            # Appliquer les joinedload
            for rel in relationships:
                if hasattr(model_class, rel):
                    query = query.options(joinedload(getattr(model_class, rel)))

            return query
        return wrapper
    return decorator


# ===== PERMISSION CHECKS =====

class PermissionError(Exception):
    """Exception levée quand l'utilisateur n'a pas les permissions."""
    pass


def check_permission(condition: bool, message: str = "Permission denied"):
    """Vérifier une permission, lever exception si False."""
    if not condition:
        raise PermissionError(message)


def check_owner(model_obj: Any, user_id: int, owner_field: str = "utilisateur_id"):
    """Vérifier que l'utilisateur est propriétaire."""
    if getattr(model_obj, owner_field, None) != user_id:
        raise PermissionError("Vous n'êtes pas propriétaire de cet objet")


def check_any_permission(model_obj: Any, user_id: int, *owner_fields: str):
    """Vérifier que l'utilisateur est propriétaire d'au moins un champ."""
    if not any(getattr(model_obj, field, None) == user_id for field in owner_fields):
        raise PermissionError("Vous n'avez pas accès à cet objet")


# ===== RESPONSE STANDARDIZATION =====

class Response:
    """Format standardisé pour les réponses API."""

    @staticmethod
    def success(data: Any = None, message: str = "Success", meta: dict = None) -> dict:
        """Retourner une réponse de succès."""
        response = {
            "success": True,
            "data": data,
            "message": message
        }
        if meta:
            response["meta"] = meta
        return response

    @staticmethod
    def error(message: str = "Error", code: int = 400, details: Any = None) -> tuple:
        """Retourner une réponse d'erreur avec status code."""
        response = {
            "success": False,
            "error": message,
            "code": code
        }
        if details:
            response["details"] = details
        return response, code

    @staticmethod
    def paginated(items: List, total: int, skip: int, limit: int) -> dict:
        """Retourner une réponse paginée."""
        return Response.success(
            data=items,
            meta={
                "total": total,
                "skip": skip,
                "limit": limit,
                "pages": (total + limit - 1) // limit,
                "current_page": (skip // limit) + 1
            }
        )
