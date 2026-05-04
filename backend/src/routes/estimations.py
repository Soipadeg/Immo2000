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

bp = Blueprint("estimations", __name__, url_prefix="/api/estimations")


@bp.route("", methods=["POST"])
@token_required
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
    try:
        data = request.get_json()

        # Validation
        if not data:
            return {"error": "Request body must be JSON"}, 400

        adresse = data.get("adresse", "").strip()
        surface = data.get("surface")
        type_bien = data.get("type_bien", "").strip()

        if not adresse or not surface or not type_bien:
            return {"error": "Missing required fields: adresse, surface, type_bien"}, 400

        try:
            surface = int(surface)
        except ValueError:
            return {"error": "Surface must be an integer"}, 400

        # Valider le type de bien
        valid_types = ["appartement", "maison", "terrain", "commercial"]
        if type_bien not in valid_types:
            return {"error": f"type_bien must be one of {valid_types}"}, 400

        # Appeler l'API Melo
        current_app.logger.info(f"User {current_user['user_id']} requesting estimation for {adresse}")

        result = get_estimation_melo(
            adresse=adresse,
            surface=surface,
            type_bien=type_bien
        )

        # Vérifier le statut de la réponse
        if result.get("metadata", {}).get("status") == "success":
            # TODO: Sauvegarder en base (voir INTEGRATION_MELO.md Section 3)
            # estimation_id = inserer_estimation_melo(current_user["user_id"], result)

            return {
                "message": "Estimation créée avec succès",
                "estimation": result,
                "user_id": current_user["user_id"],
                "timestamp": datetime.utcnow().isoformat()
            }, 201

        else:
            error_msg = result.get("metadata", {}).get("error", "Unknown error")
            current_app.logger.warning(f"Melo API error: {error_msg}")
            return {
                "error": f"Melo API error: {error_msg}"
            }, 400

    except Exception as e:
        current_app.logger.error(f"Estimation creation error: {str(e)}")
        return {"error": "Internal server error"}, 500


@bp.route("/compare", methods=["POST"])
@token_required
@role_required(roles=["vendeur", "agent"])
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
    try:
        data = request.get_json()

        if not data or not data.get("biens"):
            return {"error": "biens array is required"}, 400

        biens = data.get("biens", [])

        # Valider qu'on a au moins 2 biens
        if len(biens) < 2:
            return {"error": "At least 2 properties required for comparison"}, 400

        # Valider chaque bien
        for bien in biens:
            if not bien.get("adresse") or not bien.get("surface") or not bien.get("type_bien"):
                return {"error": "Each property must have adresse, surface, and type_bien"}, 400

        try:
            # Construire la liste de biens avec surface correctement typée
            biens_formatted = [
                {
                    "adresse": bien["adresse"],
                    "surface": int(bien["surface"]),
                    "type_bien": bien["type_bien"]
                }
                for bien in biens
            ]
        except ValueError:
            return {"error": "Surface must be an integer for all properties"}, 400

        # Appeler la fonction de comparaison Melo
        current_app.logger.info(f"User {current_user['user_id']} comparing {len(biens_formatted)} properties")

        result = compare_biens(biens_formatted)

        return {
            "message": "Comparaison effectuée avec succès",
            "comparison": result,
            "count": len(biens_formatted),
            "user_id": current_user["user_id"],
            "timestamp": datetime.utcnow().isoformat()
        }, 200

    except Exception as e:
        current_app.logger.error(f"Comparison error: {str(e)}")
        return {"error": "Internal server error"}, 500


@bp.route("", methods=["GET"])
@token_required
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
    try:
        # TODO: Implémenter la requête en base
        # if current_user["role"] == "agent":
        #     estimations = Estimation.query.all()
        # else:
        #     estimations = Estimation.query.filter_by(utilisateur_id=current_user["user_id"]).all()

        # Pour l'instant, retourner une liste vide (à adapter avec SQLAlchemy)
        return {
            "estimations": [],
            "count": 0,
            "note": "Implementation pending: see INTEGRATION_MELO.md Section 3"
        }, 200

    except Exception as e:
        current_app.logger.error(f"Get estimations error: {str(e)}")
        return {"error": "Internal server error"}, 500


__all__ = ["bp"]
