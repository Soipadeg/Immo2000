"""
Routes Flask pour les FAQ Immo2000.

Endpoints:
- GET /api/v1/faq → Récupérer toutes les FAQ
- GET /api/v1/faq?role=acheteur → FAQ des acheteurs
- GET /api/v1/faq?role=vendeur → FAQ des vendeurs
- GET /api/v1/faq/search?q=... → Rechercher une FAQ
- GET /api/v1/faq/stats → Statistiques FAQ
"""

from flask import Blueprint, request, jsonify
from src.services.faq import get_faq_service
from src.decorators.error_handling import handle_errors, ValidationError

# Blueprint
faq_bp = Blueprint("faq", __name__, url_prefix="/api/v1/faq")


@faq_bp.route("", methods=["GET"])
@handle_errors()
def get_faq():
    """
    GET /api/v1/faq
    Récupérer toutes les FAQ ou filtrer par rôle.

    Query parameters:
        - role: 'acheteur' ou 'vendeur' (optionnel)

    Response:
    {
        "status": "success",
        "data": {
            "acheteur": [...],
            "vendeur": [...],
            "total": 20
        }
    }
    """
    faq_service = get_faq_service()
    role = request.args.get("role", "").lower()

    if role in ["acheteur", "vendeur"]:
        data = {role: faq_service.get_faq_by_role(role)}
    else:
        data = faq_service.get_all_faq()

    data["total"] = len(data.get("acheteur", [])) + len(data.get("vendeur", []))

    return {
        "status": "success",
        "data": data,
    }, 200


@faq_bp.route("/search", methods=["GET"])
@handle_errors()
def search_faq():
    """
    GET /api/v1/faq/search?q=...
    Rechercher une FAQ.

    Query parameters:
        - q: Terme de recherche (requis)
        - role: 'acheteur', 'vendeur' ou '' pour tous (optionnel)

    Response:
    {
        "status": "success",
        "data": {
            "query": "estimation",
            "results": [...],
            "count": 5
        }
    }
    """
    query = request.args.get("q", "").strip()
    role = request.args.get("role", "").lower()

    if not query:
        raise ValidationError("Le paramètre 'q' est requis.")

    faq_service = get_faq_service()
    results = faq_service.search_faq(query, role if role else None)

    return {
        "status": "success",
        "data": {
            "query": query,
            "role": role if role else "tous",
            "results": results,
            "count": len(results),
        },
    }, 200


@faq_bp.route("/stats", methods=["GET"])
@handle_errors()
def faq_stats():
    """
    GET /api/v1/faq/stats
    Récupérer les statistiques des FAQ.

    Response:
    {
        "status": "success",
        "data": {
            "total_acheteur": 10,
            "total_vendeur": 10,
            "total": 20,
            "categories_acheteur": [...],
            "categories_vendeur": [...]
        }
    }
    """
    faq_service = get_faq_service()
    stats = faq_service.get_stats()

    return {
        "status": "success",
        "data": stats,
    }, 200


@faq_bp.route("/health", methods=["GET"])
@handle_errors()
def health():
    """
    GET /api/v1/faq/health
    Vérifier que le service FAQ est opérationnel.

    Response:
    {
        "status": "ok",
        "faq_loaded": true
    }
    """
    faq_service = get_faq_service()
    stats = faq_service.get_stats()

    return {
        "status": "ok",
        "faq_loaded": stats["total"] > 0,
        "total_faq": stats["total"],
    }, 200
