"""
Routes pour la gestion des biens immobiliers.

Endpoints :
- GET /api/biens : Voir tous les biens (ou les siens selon le rôle)
- POST /api/biens : Créer un bien (vendeurs seulement)
- GET /api/biens/me : Mes biens personnels
- GET /api/biens/stats : Statistiques (agents seulement)
- GET /api/biens/<bien_id> : Détails d'un bien
"""

from flask import Blueprint, request, jsonify, current_app
from src.auth.decorators import token_required, role_required
from src.auth.models import User, db
from src.models.biens import Bien
from src.crud.biens import (
    create_bien as crud_create_bien,
    get_bien as crud_get_bien,
    get_user_biens as crud_get_user_biens,
    list_biens as crud_list_biens,
    update_bien as crud_update_bien,
    delete_bien as crud_delete_bien,
    get_bien_stats as crud_get_bien_stats,
)
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError, ForbiddenError
from datetime import datetime

biens_bp = Blueprint("biens", __name__, url_prefix="/api/v1/biens")


@biens_bp.route("", methods=["GET"])
@token_required
@handle_errors()
def list_biens(current_user):
    """
    Récupérer la liste des biens.
    Accessible à : Tous les utilisateurs
    """
    # Récupérer les filtres depuis les query params
    filters = {
        "type_bien": request.args.get("type_bien"),
        "ville": request.args.get("ville"),
        "code_postal": request.args.get("code_postal"),
        "surface_min": request.args.get("surface_min", type=int),
        "surface_max": request.args.get("surface_max", type=int),
        "etat": request.args.get("etat"),
    }

    # Pagination
    limit = request.args.get("limit", default=50, type=int)
    offset = request.args.get("offset", default=0, type=int)

    if limit > 100:
        limit = 100
    if limit < 1:
        raise ValidationError('limit must be >= 1')

    # Récupérer les biens
    biens, total = crud_list_biens(filters=filters, limit=limit, offset=offset)

    current_app.logger.info(f"User {current_user['user_id']} ({current_user['role']}) listing properties")

    return {
        "biens": [bien.to_dict() for bien in biens],
        "count": len(biens),
        "total": total,
        "limit": limit,
        "offset": offset,
        "role": current_user["role"]
    }


@biens_bp.route("", methods=["POST"])
@token_required
@role_required(roles=["vendeur"])
@handle_errors()
def create_bien(current_user):
    """
    Créer un nouveau bien immobilier.
    Accessible à : Vendeurs seulement
    """
    data = request.get_json()
    if not data:
        raise ValidationError('Request body must be JSON')

    # Validation des champs requis
    adresse = data.get("adresse", "").strip()
    surface = data.get("surface")
    type_bien = data.get("type_bien", "").strip()

    if not adresse or not surface or not type_bien:
        raise ValidationError('Missing required fields: adresse, surface, type_bien')

    try:
        surface = int(surface)
    except ValueError:
        raise ValidationError('Surface must be an integer')

    if surface <= 0:
        raise ValidationError('Surface must be positive')

    # Valider le type de bien
    valid_types = ["appartement", "maison", "terrain", "commercial"]
    if type_bien not in valid_types:
        raise ValidationError(f'type_bien must be one of {valid_types}')

    # Récupérer les paramètres optionnels
    code_postal = data.get("code_postal", "").strip()
    ville = data.get("ville", "").strip()

    if not code_postal or not ville:
        raise ValidationError('code_postal and ville are required')

    # Créer le bien via CRUD
    bien = crud_create_bien(
        utilisateur_id=current_user["user_id"],
        adresse=adresse,
        code_postal=code_postal,
        ville=ville,
        surface=surface,
        type_bien=type_bien,
        nombre_pieces=data.get("nombre_pieces"),
        nombre_chambres=data.get("nombre_chambres"),
        nombre_salles_bain=data.get("nombre_salles_bain"),
        etage=data.get("etage"),
        date_construction=data.get("date_construction"),
        description=data.get("description"),
        prix_demande=data.get("prix_demande"),
        etat=data.get("etat", "bon"),
        equipements=data.get("equipements"),
        commodites=data.get("commodites"),
    )

    current_app.logger.info(f"Vendor {current_user['user_id']} creating property: {adresse}")

    return {
        "message": "Bien créé avec succès",
        "bien": bien.to_dict(),
        "bien_id": bien.bien_id,
        "utilisateur_id": current_user["user_id"],
        "timestamp": datetime.utcnow().isoformat(),
    }, 201


@biens_bp.route("/me", methods=["GET"])
@token_required
@handle_errors()
def my_biens(current_user):
    """
    Récupérer mes propres biens.
    Accessible à : Tous les utilisateurs
    """
    # Récupérer les biens de l'utilisateur
    biens = crud_get_user_biens(utilisateur_id=current_user["user_id"])

    current_app.logger.info(f"User {current_user['user_id']} listing their properties")

    return {
        "biens": [bien.to_dict() for bien in biens],
        "count": len(biens),
        "utilisateur_id": current_user["user_id"]
    }


@biens_bp.route("/stats", methods=["GET"])
@token_required
@role_required(roles=["agent"])
@handle_errors()
def get_stats(current_user):
    """
    Récupérer les statistiques sur les biens (agents seulement).
    Accessible à : Agents seulement
    """
    # Récupérer les statistiques
    stats = crud_get_bien_stats()

    current_app.logger.info(f"Agent {current_user['user_id']} requesting stats")

    return {
        "stats": stats,
    }


@biens_bp.route("/<int:bien_id>", methods=["GET"])
@token_required
@handle_errors()
def get_bien(current_user, bien_id):
    """
    Récupérer les détails d'un bien spécifique.
    Accessible à : Tous les utilisateurs
    """
    if bien_id <= 0:
        raise ValidationError('bien_id must be positive')

    current_app.logger.info(f"User {current_user['user_id']} viewing property {bien_id}")

    return {
        "bien": {
            "bien_id": bien_id,
            "adresse": "123 Rue de Paris",
            "surface": 50,
            "type_bien": "appartement",
            "utilisateur_id": 1,
            "utilisateur": {
                "nom": "Dupont",
                "prenom": "Jean",
                "email": "jean@example.com"
            }
        },
        "note": "Implementation pending: create Bien model (SQLAlchemy)"
    }


__all__ = ["biens_bp"]
