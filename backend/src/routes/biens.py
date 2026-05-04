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
from datetime import datetime

bp = Blueprint("biens", __name__, url_prefix="/api/biens")


@bp.route("", methods=["GET"])
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
        # TODO: Implémenter les requêtes avec SQLAlchemy
        # Exemple :
        # query = Bien.query
        #
        # if current_user["role"] == "vendeur":
        #     query = query.filter_by(utilisateur_id=current_user["user_id"])
        #
        # type_bien = request.args.get("type_bien")
        # if type_bien:
        #     query = query.filter_by(type_bien=type_bien)
        #
        # biens = query.all()

        current_app.logger.info(f"User {current_user['user_id']} ({current_user['role']}) listing properties")

        return {
            "biens": [],
            "count": 0,
            "role": current_user["role"],
            "note": "Implementation pending: create Bien model (SQLAlchemy)"
        }, 200

    except Exception as e:
        current_app.logger.error(f"List biens error: {str(e)}")
        return {"error": "Internal server error"}, 500


@bp.route("", methods=["POST"])
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

        # TODO: Sauvegarder en base avec SQLAlchemy
        # bien = Bien(
        #     utilisateur_id=current_user["user_id"],
        #     adresse=adresse,
        #     surface=surface,
        #     type_bien=type_bien,
        #     code_postal=data.get("code_postal"),
        #     ville=data.get("ville"),
        #     nombre_pieces=data.get("nombre_pieces"),
        #     nombre_chambres=data.get("nombre_chambres"),
        #     etage=data.get("etage"),
        #     date_construction=data.get("date_construction"),
        #     description=data.get("description")
        # )
        # db.session.add(bien)
        # db.session.commit()

        current_app.logger.info(f"Vendor {current_user['user_id']} creating property: {adresse}")

        return {
            "message": "Bien créé avec succès",
            "bien_id": None,  # TODO: Remplacer par bien.bien_id
            "utilisateur_id": current_user["user_id"],
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Implementation pending: create Bien model (SQLAlchemy)"
        }, 201

    except Exception as e:
        current_app.logger.error(f"Create bien error: {str(e)}")
        return {"error": "Internal server error"}, 500


@bp.route("/me", methods=["GET"])
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
        # TODO: Implémenter avec SQLAlchemy
        # biens = Bien.query.filter_by(utilisateur_id=current_user["user_id"]).all()

        current_app.logger.info(f"User {current_user['user_id']} listing their properties")

        return {
            "biens": [],
            "count": 0,
            "utilisateur_id": current_user["user_id"],
            "note": "Implementation pending: create Bien model (SQLAlchemy)"
        }, 200

    except Exception as e:
        current_app.logger.error(f"My biens error: {str(e)}")
        return {"error": "Internal server error"}, 500


@bp.route("/stats", methods=["GET"])
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
        # TODO: Calculer les statistiques depuis la base
        # total_biens = Bien.query.count()
        # total_utilisateurs = User.query.count()
        # etc.

        current_app.logger.info(f"Agent {current_user['user_id']} requesting stats")

        return {
            "stats": {
                "total_biens": 0,
                "total_utilisateurs": 0,
                "distribution_types": {
                    "appartement": 0,
                    "maison": 0,
                    "terrain": 0,
                    "commercial": 0
                },
                "surface_moyenne": 0,
                "estimations_moyennes": 0
            },
            "note": "Implementation pending: create Bien model (SQLAlchemy)"
        }, 200

    except Exception as e:
        current_app.logger.error(f"Stats error: {str(e)}")
        return {"error": "Internal server error"}, 500


@bp.route("/<int:bien_id>", methods=["GET"])
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


__all__ = ["bp"]
