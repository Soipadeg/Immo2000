"""
Error handling decorator for Flask routes.

Centralise la gestion des erreurs et génère des réponses JSON standardisées.
Remplace 50+ instances de try/except boilerplate.

Exemple:
    @app.route('/offers')
    @handle_errors()
    def list_offers():
        # Code métier - pas besoin de try/except!
        offers = db.query(Offre).all()
        return {"data": offers}  # Automatiquement wrappée en JSON
"""

from functools import wraps
from typing import Callable, Any, Tuple, Union
from flask import jsonify, request
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
import logging
import traceback

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base exception pour les erreurs API prévisibles."""

    def __init__(self, message: str, code: int = 400, details: Any = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)


class ValidationError(APIError):
    """Erreur de validation d'entrée."""

    def __init__(self, message: str, details: Any = None):
        super().__init__(message, code=400, details=details)


class NotFoundError(APIError):
    """Ressource non trouvée."""

    def __init__(self, message: str = "Ressource non trouvée", details: Any = None):
        super().__init__(message, code=404, details=details)


class ForbiddenError(APIError):
    """Accès forbidden (permission denied)."""

    def __init__(self, message: str = "Accès refusé", details: Any = None):
        super().__init__(message, code=403, details=details)


class UnauthorizedError(APIError):
    """Non authentifié."""

    def __init__(self, message: str = "Non authentifié", details: Any = None):
        super().__init__(message, code=401, details=details)


def handle_errors(
    auto_json: bool = True,
    log_errors: bool = True
) -> Callable:
    """
    Décorateur pour gérer les erreurs dans les routes Flask.

    Args:
        auto_json: Wrapper automatiquement les réponses en JSON standardisé
        log_errors: Logger les erreurs (sauf ValidationError)

    Returns:
        Réponse JSON standardisée {success, data/error, code}
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)

                # Si la fonction retourne déjà un tuple (response, code)
                if isinstance(result, tuple) and len(result) == 2:
                    data, code = result
                    if isinstance(code, int):
                        return (
                            jsonify({
                                "success": True,
                                "data": data,
                                "code": code
                            }) if auto_json else data,
                            code
                        )

                # Sinon, wrapper en réponse de succès
                return (
                    jsonify({
                        "success": True,
                        "data": result,
                        "code": 200
                    }) if auto_json else result,
                    200
                )

            except ValidationError as e:
                # Erreurs de validation : 400
                response = {
                    "success": False,
                    "error": e.message,
                    "code": e.code
                }
                if e.details:
                    response["details"] = e.details
                return jsonify(response), e.code

            except (NotFoundError, NoResultFound) as e:
                # Ressource non trouvée : 404
                message = str(e) if not isinstance(e, NotFoundError) else e.message
                return jsonify({
                    "success": False,
                    "error": message,
                    "code": 404
                }), 404

            except ForbiddenError as e:
                # Accès refusé : 403
                return jsonify({
                    "success": False,
                    "error": e.message,
                    "code": 403
                }), 403

            except UnauthorizedError as e:
                # Non authentifié : 401
                return jsonify({
                    "success": False,
                    "error": e.message,
                    "code": 401
                }), 401

            except (SQLAlchemyError, ValueError, TypeError, KeyError) as e:
                # Erreurs attendues : 400
                if log_errors:
                    logger.warning(f"Request error: {type(e).__name__}: {str(e)}")

                return jsonify({
                    "success": False,
                    "error": "Erreur de requête: " + str(e)[:100],
                    "code": 400
                }), 400

            except RuntimeError as e:
                # Erreurs inattendues : 500
                if log_errors:
                    logger.error(f"Unexpected RuntimeError in {func.__name__}: {str(e)}", exc_info=True)

                return jsonify({
                    "success": False,
                    "error": "Erreur serveur interne",
                    "code": 500,
                    "details": str(e) if __debug__ else None  # Only in debug
                }), 500
            except Exception as e:
                # Erreurs inattendues : 500
                if log_errors:
                    logger.error(f"Unexpected error in {func.__name__}:", exc_info=True)
                    logger.error(traceback.format_exc(), exc_info=True)

                return jsonify({
                    "success": False,
                    "error": "Erreur serveur interne",
                    "code": 500,
                    "details": str(e) if __debug__ else None  # Only in debug
                }), 500

        return wrapper
    return decorator
