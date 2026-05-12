"""
Routes pour les estimations immobilières (intégrées avec Melo API).

Endpoints :
- POST /api/estimations : Créer une estimation avec Melo API
- POST /api/estimations/compare : Comparer plusieurs biens
- GET /api/estimations : Voir toutes les estimations (agent) ou les siennes (user)
"""

from flask import Blueprint, request, jsonify, current_app
from src.auth.decorators import token_required, role_required
from src.melo_api import get_estimation_melo, compare_biens
from datetime import datetime
from src.decorators.error_handling import handle_errors, ValidationError

estimations_bp = Blueprint("estimations", __name__, url_prefix="/api/v1/estimations")


@estimations_bp.route("", methods=["POST"])
@token_required
@handle_errors()
def create_estimation(current_user):
    """
    Créer une estimation avec l'API Melo.

    Accessible à : Tous les utilisateurs

    Request JSON:
        {
            "adresse": "123 Rue de Paris, 75000 Paris",
            "surface": 50,
            "type_bien": "appartement"
        }

    Response:
        201 Created : {
            "message": "Estimation créée avec succès",
            "estimation": {...},
            "user_id": 1,
            "timestamp": "2026-05-04T12:00:00"
        }

        400 Bad Request : {
            "error": "Missing required fields" | "Invalid property type" | ...
        }
    """
    data = request.get_json()

    if not data:
        raise ValidationError("Request body must be JSON")

    adresse = data.get("adresse", "").strip()
    surface = data.get("surface")
    type_bien = data.get("type_bien", "").strip()

    if not adresse or not surface or not type_bien:
        raise ValidationError("Missing required fields: adresse, surface, type_bien")

    try:
        surface = int(surface)
    except ValueError:
        raise ValidationError("Surface must be an integer")

    valid_types = ["appartement", "maison", "terrain", "commercial"]
    if type_bien not in valid_types:
        raise ValidationError(f"type_bien must be one of {valid_types}")

    current_app.logger.info(f"User {current_user['user_id']} requesting estimation for {adresse}")

    result = get_estimation_melo(
        adresse=adresse,
        surface=surface,
        type_bien=type_bien
    )

    if result.get("metadata", {}).get("status") == "success":
        return {
            "message": "Estimation créée avec succès",
            "estimation": result,
            "user_id": current_user["user_id"],
            "adresse": adresse,
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        error_msg = result.get("metadata", {}).get("error", "Unknown error")
        current_app.logger.warning(f"Melo API error: {error_msg}")
        raise ValidationError(f"Melo API error: {error_msg}")


@estimations_bp.route("/compare", methods=["POST"])
@token_required
@role_required(roles=["vendeur", "agent"])
@handle_errors()
def compare_estimations(current_user):
    """
    Comparer les estimations de plusieurs biens.

    Accessible à : Vendeurs et agents

    Request JSON:
        {
            "biens": [
                {
                    "adresse": "123 Rue A, 75000 Paris",
                    "surface": 50,
                    "type_bien": "appartement"
                },
                {
                    "adresse": "456 Rue B, 75000 Paris",
                    "surface": 75,
                    "type_bien": "maison"
                }
            ]
        }

    Response:
        200 OK : {
            "message": "Comparaison effectuée",
            "comparison": {...},
            "count": 2,
            "user_id": 1
        }

        400 Bad Request : {
            "error": "At least 2 properties required"
        }
    """
    data = request.get_json()

    if not data or not data.get("biens"):
        raise ValidationError("biens array is required")

    biens = data.get("biens", [])

    if len(biens) < 2:
        raise ValidationError("At least 2 properties required for comparison")

    for bien in biens:
        if not bien.get("adresse") or not bien.get("surface") or not bien.get("type_bien"):
            raise ValidationError("Each property must have adresse, surface, and type_bien")

    try:
        biens_formatted = [
            {
                "adresse": bien["adresse"],
                "surface": int(bien["surface"]),
                "type_bien": bien["type_bien"]
            }
            for bien in biens
        ]
    except ValueError:
        raise ValidationError("Surface must be an integer for all properties")

    current_app.logger.info(f"User {current_user['user_id']} comparing {len(biens_formatted)} properties")

    result = compare_biens(biens_formatted)

    return {
        "message": "Comparaison effectuée avec succès",
        "comparison": result,
        "count": len(biens_formatted),
        "user_id": current_user["user_id"],
        "timestamp": datetime.utcnow().isoformat()
    }


@estimations_bp.route("", methods=["GET"])
@token_required
@handle_errors()
def get_estimations(current_user):
    """
    Récupérer les estimations.

    Accessible à : Tous les utilisateurs
    - Agents voient toutes les estimations
    - Les autres voient seulement les leurs

    Response:
        200 OK : {
            "estimations": [
                {
                    "estimation_id": 1,
                    "adresse": "123 Rue de Paris",
                    "prix_estime": 250000,
                    "date": "2026-05-04",
                    "utilisateur_id": 1
                }
            ],
            "count": 1
        }
    """
    return {
        "estimations": [],
        "count": 0,
        "note": "Estimations retournées via Melo API (pas de persistance actuellement)",
        "hint": "Utilisez POST /api/v1/estimations pour créer une estimation Melo"
    }


__all__ = ["estimations_bp"]
