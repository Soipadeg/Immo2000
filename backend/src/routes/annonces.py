"""
Routes Flask pour les annonces immobilières.

Endpoints :
- POST   /api/v1/annonces              → Créer annonce (JWT required)
- GET    /api/v1/annonces              → Lister annonces paginated (public)
- GET    /api/v1/annonces/{id}         → Récupérer annonce (public)
- PUT    /api/v1/annonces/{id}         → Mettre à jour (JWT + owner check)
- DELETE /api/v1/annonces/{id}         → Supprimer (JWT + owner check)
- POST   /api/v1/annonces/{id}/publier → Publier annonce (JWT + owner, BONUS)
- POST   /api/v1/annonces/{id}/archiver → Archiver annonce (JWT + owner)
- POST   /api/v1/annonces/{id}/vendre  → Marquer comme vendue (JWT + owner)
"""

from flask import Blueprint, request, jsonify
from src.auth.models import db
from src.auth.decorators import token_required
from src.models.annonces import Annonce
from src.schemas.annonces import (
    CreateAnnonce,
    UpdateAnnonce,
    AnnoncesResponse,
    AnnoncesListResponse,
    ErrorResponse,
)
from src.crud.annonces import (
    create_annonce,
    get_annonce,
    update_annonce,
    delete_annonce,
    list_annonces,
    publish_annonce,
    archive_annonce,
    sell_annonce,
    AnnoncesNotFoundError,
    AnnoncesUnauthorizedError,
    AnnoncesValidationError,
)
from pydantic import ValidationError

# Blueprint
annonces_bp = Blueprint("annonces", __name__, url_prefix="/api/v1/annonces")


@annonces_bp.route("", methods=["POST"])
@token_required
def create_annonce_endpoint(current_user):
    """
    POST /api/v1/annonces
    Créer une nouvelle annonce (JWT required).

    Request body: CreateAnnonce (Pydantic validated)

    Returns:
        201 Created + AnnoncesResponse
        400 Bad Request (validation error)
        401 Unauthorized (no JWT)
    """
    try:
        # Valider les données avec Pydantic
        data = request.get_json()
        annonce_data = CreateAnnonce(**data)

        # Créer l'annonce
        annonce = create_annonce(db.session, current_user["user_id"], annonce_data)

        # Répondre avec le schéma de réponse
        response = AnnoncesResponse.from_orm(annonce)
        return jsonify(response.dict()), 201

    except ValidationError as e:
        # Convertir les erreurs Pydantic en format JSON sérialisable
        errors = []
        for err in e.errors():
            errors.append({
                "field": ".".join(str(x) for x in err.get("loc", [])),
                "type": err.get("type"),
                "msg": err.get("msg")
            })
        return jsonify({
            "error": "Validation error",
            "code": 400,
            "details": errors
        }), 400
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400


@annonces_bp.route("", methods=["GET"])
def list_annonces_endpoint():
    """
    GET /api/v1/annonces?skip=0&limit=20&ville=Paris&type_bien=maison&...
    Lister les annonces avec pagination et filtrage (public).

    Query parameters:
        skip (int): Nombre de résultats à ignorer (default: 0)
        limit (int): Limite de résultats (default: 20, max: 100)

    Filtres optionnels:
        ville (str): Filtrer par ville
        code_postal (str): Filtrer par code postal
        type_bien (str): Filtrer par type (maison, appartement, etc.)
        prix_min (float): Prix minimum
        prix_max (float): Prix maximum
        surface_min (float): Surface minimum
        surface_max (float): Surface maximale
        statut (str): Filtrer par statut (brouillon, publiée, vendue, archivée)
        utilisateur_id (int): Annonces d'un utilisateur spécifique
        search (str): Recherche texte (titre + description)

    Returns:
        200 OK + AnnoncesListResponse (paginated)
    """
    try:
        # Récupérer les paramètres de pagination
        skip = request.args.get("skip", 0, type=int)
        limit = request.args.get("limit", 20, type=int)

        # Construire le dictionnaire de filtres
        filters = {}

        # Filtres simples
        if request.args.get("ville"):
            filters["ville"] = request.args.get("ville")
        if request.args.get("code_postal"):
            filters["code_postal"] = request.args.get("code_postal")
        if request.args.get("type_bien"):
            filters["type_bien"] = request.args.get("type_bien")
        if request.args.get("statut"):
            filters["statut"] = request.args.get("statut")
        if request.args.get("utilisateur_id"):
            filters["utilisateur_id"] = request.args.get("utilisateur_id", type=int)
        if request.args.get("search"):
            filters["search"] = request.args.get("search")

        # Filtres numériques
        if request.args.get("prix_min"):
            filters["prix_min"] = float(request.args.get("prix_min"))
        if request.args.get("prix_max"):
            filters["prix_max"] = float(request.args.get("prix_max"))
        if request.args.get("surface_min"):
            filters["surface_min"] = float(request.args.get("surface_min"))
        if request.args.get("surface_max"):
            filters["surface_max"] = float(request.args.get("surface_max"))

        # Récupérer les annonces
        annonces, total = list_annonces(db.session, skip=skip, limit=limit, filters=filters)

        # Construire la réponse
        items = [AnnoncesResponse.from_orm(a) for a in annonces]
        response = AnnoncesListResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit
        )

        return jsonify(response.dict()), 200

    except ValueError as e:
        return jsonify({
            "error": "Invalid query parameter",
            "code": 400,
            "details": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400


@annonces_bp.route("/<int:annonce_id>", methods=["GET"])
def get_annonce_endpoint(annonce_id):
    """
    GET /api/v1/annonces/{id}
    Récupérer une annonce par son ID (public).

    Parameters:
        annonce_id (int): ID de l'annonce

    Returns:
        200 OK + AnnoncesResponse
        404 Not Found
    """
    try:
        annonce = get_annonce(db.session, annonce_id)
        response = AnnoncesResponse.from_orm(annonce)
        return jsonify(response.dict()), 200

    except AnnoncesNotFoundError as e:
        return jsonify({
            "error": str(e),
            "code": 404
        }), 404
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400


@annonces_bp.route("/<int:annonce_id>", methods=["PUT"])
@token_required
def update_annonce_endpoint(current_user, annonce_id):
    """
    PUT /api/v1/annonces/{id}
    Mettre à jour une annonce (JWT required + owner check).

    Parameters:
        annonce_id (int): ID de l'annonce

    Request body: UpdateAnnonce (Pydantic, tous champs optionnels)

    Returns:
        200 OK + AnnoncesResponse
        400 Bad Request (validation error)
        401 Unauthorized (no JWT)
        403 Forbidden (not owner)
        404 Not Found
    """
    try:
        # Valider les données avec Pydantic
        data = request.get_json() or {}
        annonce_data = UpdateAnnonce(**data)

        # Mettre à jour l'annonce
        annonce = update_annonce(
            db.session,
            annonce_id,
            current_user["user_id"],
            annonce_data
        )

        response = AnnoncesResponse.from_orm(annonce)
        return jsonify(response.dict()), 200

    except ValidationError as e:
        return jsonify({
            "error": "Validation error",
            "code": 400,
            "details": e.errors()
        }), 400
    except AnnoncesNotFoundError as e:
        return jsonify({
            "error": str(e),
            "code": 404
        }), 404
    except AnnoncesUnauthorizedError as e:
        return jsonify({
            "error": str(e),
            "code": 403
        }), 403
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400


@annonces_bp.route("/<int:annonce_id>", methods=["DELETE"])
@token_required
def delete_annonce_endpoint(current_user, annonce_id):
    """
    DELETE /api/v1/annonces/{id}
    Supprimer une annonce (JWT required + owner check).

    Parameters:
        annonce_id (int): ID de l'annonce

    Returns:
        204 No Content
        401 Unauthorized (no JWT)
        403 Forbidden (not owner)
        404 Not Found
    """
    try:
        delete_annonce(db.session, annonce_id, current_user["user_id"])
        return "", 204

    except AnnoncesNotFoundError as e:
        return jsonify({
            "error": str(e),
            "code": 404
        }), 404
    except AnnoncesUnauthorizedError as e:
        return jsonify({
            "error": str(e),
            "code": 403
        }), 403
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400


@annonces_bp.route("/<int:annonce_id>/publier", methods=["POST"])
@token_required
def publish_annonce_endpoint(current_user, annonce_id):
    """
    POST /api/v1/annonces/{id}/publier [BONUS]
    Publier une annonce (passer de "brouillon" à "publiée").

    Parameters:
        annonce_id (int): ID de l'annonce

    Returns:
        200 OK + AnnoncesResponse (avec statut="publiée")
        401 Unauthorized (no JWT)
        403 Forbidden (not owner)
        404 Not Found
        422 Unprocessable Entity (statut non-brouillon)
    """
    try:
        annonce = publish_annonce(db.session, annonce_id, current_user["user_id"])
        response = AnnoncesResponse.from_orm(annonce)
        return jsonify(response.dict()), 200

    except AnnoncesNotFoundError as e:
        return jsonify({
            "error": str(e),
            "code": 404
        }), 404
    except AnnoncesUnauthorizedError as e:
        return jsonify({
            "error": str(e),
            "code": 403
        }), 403
    except AnnoncesValidationError as e:
        return jsonify({
            "error": str(e),
            "code": 422
        }), 422
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400


@annonces_bp.route("/<int:annonce_id>/archiver", methods=["POST"])
@token_required
def archive_annonce_endpoint(current_user, annonce_id):
    """
    POST /api/v1/annonces/{id}/archiver
    Archiver une annonce.

    Parameters:
        annonce_id (int): ID de l'annonce

    Returns:
        200 OK + AnnoncesResponse (avec statut="archivée")
        401 Unauthorized (no JWT)
        403 Forbidden (not owner)
        404 Not Found
        422 Unprocessable Entity (annonce vendue)
    """
    try:
        annonce = archive_annonce(db.session, annonce_id, current_user["user_id"])
        response = AnnoncesResponse.from_orm(annonce)
        return jsonify(response.dict()), 200

    except AnnoncesNotFoundError as e:
        return jsonify({
            "error": str(e),
            "code": 404
        }), 404
    except AnnoncesUnauthorizedError as e:
        return jsonify({
            "error": str(e),
            "code": 403
        }), 403
    except AnnoncesValidationError as e:
        return jsonify({
            "error": str(e),
            "code": 422
        }), 422
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400


@annonces_bp.route("/<int:annonce_id>/vendre", methods=["POST"])
@token_required
def sell_annonce_endpoint(current_user, annonce_id):
    """
    POST /api/v1/annonces/{id}/vendre
    Marquer une annonce comme vendue.

    Parameters:
        annonce_id (int): ID de l'annonce

    Request body (optional):
        {
            "date_vente": "2026-05-04T10:00:00" (ISO format, optional)
        }

    Returns:
        200 OK + AnnoncesResponse (avec statut="vendue")
        401 Unauthorized (no JWT)
        403 Forbidden (not owner)
        404 Not Found
        422 Unprocessable Entity (annonce archivée)
    """
    try:
        data = request.get_json() or {}
        date_vente_str = data.get("date_vente")
        date_vente = None

        if date_vente_str:
            try:
                from datetime import datetime as dt
                date_vente = dt.fromisoformat(date_vente_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return jsonify({
                    "error": "Invalid date_vente format. Use ISO 8601 format (e.g., 2026-05-04T10:00:00)",
                    "code": 400
                }), 400

        annonce = sell_annonce(db.session, annonce_id, current_user["user_id"], date_vente)
        response = AnnoncesResponse.from_orm(annonce)
        return jsonify(response.dict()), 200

    except AnnoncesNotFoundError as e:
        return jsonify({
            "error": str(e),
            "code": 404
        }), 404
    except AnnoncesUnauthorizedError as e:
        return jsonify({
            "error": str(e),
            "code": 403
        }), 403
    except AnnoncesValidationError as e:
        return jsonify({
            "error": str(e),
            "code": 422
        }), 422
    except Exception as e:
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400
