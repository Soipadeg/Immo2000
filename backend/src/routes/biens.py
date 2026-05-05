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
from datetime import datetime

biens_bp = Blueprint("biens", __name__, url_prefix="/api/v1/biens")


@biens_bp.route("", methods=["GET"])
@token_required
def list_biens(current_user):
    """
    Récupérer la liste des biens.

    Accessible à : Tous les utilisateurs
    - Agents voient TOUS les biens
    - Vendeurs voient TOUS les biens
    - Acheteurs voient TOUS les biens

    Query params:
        ?type_bien=appartement  : Filtrer par type
        ?ville=Paris             : Filtrer par ville
        ?surface_min=50          : Surface minimum
        ?surface_max=100         : Surface maximum

    Response:
        200 OK : {
            "biens": [
                {
                    "bien_id": 1,
                    "adresse": "123 Rue de Paris, 75000",
                    "surface": 50,
                    "type_bien": "appartement",
                    "utilisateur_id": 1
                }
            ],
            "count": 1,
            "role": "vendeur"
        }
    """
    try:
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
        }, 200

    except Exception as e:
        current_app.logger.error(f"List biens error: {str(e)}")
        return {"error": "Internal server error"}, 500


@biens_bp.route("", methods=["POST"])
@token_required
@role_required(roles=["vendeur"])
def create_bien(current_user):
    """
    Créer un nouveau bien immobilier.

    Accessible à : Vendeurs seulement

    Request JSON:
        {
            "adresse": "123 Rue de Paris, 75000 Paris",
            "code_postal": "75000",
            "ville": "Paris",
            "surface": 50,
            "type_bien": "appartement",
            "nombre_pieces": 2,
            "nombre_chambres": 1,
            "etage": 3,
            "date_construction": 2010,
            "description": "Bel appartement au centre"
        }

    Response:
        201 Created : {
            "message": "Bien créé avec succès",
            "bien_id": 1,
            "utilisateur_id": 1
        }

        400 Bad Request : {
            "error": "Missing required fields"
        }
    """
    try:
        data = request.get_json()

        if not data:
            return {"error": "Request body must be JSON"}, 400

        # Validation des champs requis
        adresse = data.get("adresse", "").strip()
        surface = data.get("surface")
        type_bien = data.get("type_bien", "").strip()

        if not adresse or not surface or not type_bien:
            return {"error": "Missing required fields: adresse, surface, type_bien"}, 400

        try:
            surface = int(surface)
        except ValueError:
            return {"error": "Surface must be an integer"}, 400

        if surface <= 0:
            return {"error": "Surface must be positive"}, 400

        # Valider le type de bien
        valid_types = ["appartement", "maison", "terrain", "commercial"]
        if type_bien not in valid_types:
            return {"error": f"type_bien must be one of {valid_types}"}, 400

        # Récupérer les paramètres optionnels
        code_postal = data.get("code_postal", "").strip()
        ville = data.get("ville", "").strip()

        if not code_postal or not ville:
            return {"error": "code_postal and ville are required"}, 400

        try:
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

        except ValueError as e:
            return {"error": str(e)}, 400

    except Exception as e:
        current_app.logger.error(f"Create bien error: {str(e)}")
        return {"error": "Internal server error"}, 500


@biens_bp.route("/me", methods=["GET"])
@token_required
def my_biens(current_user):
    """
    Récupérer mes propres biens.

    Accessible à : Tous les utilisateurs (voir seulement les leurs)

    Response:
        200 OK : {
            "biens": [
                {
                    "bien_id": 1,
                    "adresse": "123 Rue de Paris",
                    "surface": 50,
                    "type_bien": "appartement"
                }
            ],
            "count": 1,
            "utilisateur_id": 1
        }
    """
    try:
        # Récupérer les biens de l'utilisateur
        biens = crud_get_user_biens(utilisateur_id=current_user["user_id"])

        current_app.logger.info(f"User {current_user['user_id']} listing their properties")

        return {
            "biens": [bien.to_dict() for bien in biens],
            "count": len(biens),
            "utilisateur_id": current_user["user_id"]
        }, 200

    except Exception as e:
        current_app.logger.error(f"My biens error: {str(e)}")
        return {"error": "Internal server error"}, 500


@biens_bp.route("/stats", methods=["GET"])
@token_required
@role_required(roles=["agent"])
def get_stats(current_user):
    """
    Récupérer les statistiques sur les biens (agents seulement).

    Accessible à : Agents seulement

    Response:
        200 OK : {
            "stats": {
                "total_biens": 1000,
                "total_utilisateurs": 500,
                "distribution_types": {
                    "appartement": 600,
                    "maison": 300,
                    "terrain": 50,
                    "commercial": 50
                },
                "surface_moyenne": 65.5,
                "estimations_moyennes": 250000
            }
        }
    """
    try:
        # Récupérer les statistiques
        stats = crud_get_bien_stats()

        current_app.logger.info(f"Agent {current_user['user_id']} requesting stats")

        return {
            "stats": stats,
        }, 200

    except Exception as e:
        current_app.logger.error(f"Stats error: {str(e)}")
        return {"error": "Internal server error"}, 500


@biens_bp.route("/<int:bien_id>", methods=["GET"])
@token_required
def get_bien(current_user, bien_id):
    """
    Récupérer les détails d'un bien spécifique.

    Accessible à : Tous les utilisateurs

    Response:
        200 OK : {
            "bien": {
                "bien_id": 1,
                "adresse": "123 Rue de Paris",
                "surface": 50,
                "type_bien": "appartement",
                "utilisateur_id": 1,
                "utilisateur": {
                    "nom": "Dupont",
                    "prenom": "Jean",
                    "email": "jean@example.com"
                }
            }
        }

        404 Not Found : {
            "error": "Property not found"
        }
    """
    try:
        # TODO: Chercher le bien en base
        # bien = Bien.query.get(bien_id)
        # if not bien:
        #     return {"error": "Property not found"}, 404

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
        }, 200

    except Exception as e:
        current_app.logger.error(f"Get bien error: {str(e)}")
        return {"error": "Internal server error"}, 500


__all__ = ["biens_bp"]
