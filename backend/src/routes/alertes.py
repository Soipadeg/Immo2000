"""
Routes Flask pour les alertes d'annonces.

Endpoints:
- GET    /api/v1/alertes                → Lister les alertes de l'utilisateur (JWT required)
- POST   /api/v1/alertes                → Créer une alerte (JWT required)
- GET    /api/v1/alertes/{id}           → Récupérer une alerte (JWT + owner check)
- PUT    /api/v1/alertes/{id}           → Mettre à jour une alerte (JWT + owner check)
- DELETE /api/v1/alertes/{id}           → Supprimer une alerte (JWT + owner check)
- POST   /api/v1/alertes/{id}/toggle    → Activer/désactiver une alerte
"""

from flask import Blueprint, request, jsonify
from src.auth.models import db
from src.auth.decorators import token_required
from src.models.alertes import AlerteAnnonce
from src.schemas.alertes import (
    CreateAlerteAnnonce,
    UpdateAlerteAnnonce,
    AlerteAnnonceResponse,
    AlerteAnnonceListResponse,
)
from pydantic import ValidationError

# Blueprint
alertes_bp = Blueprint("alertes", __name__, url_prefix="/api/v1/alertes")


@alertes_bp.route("", methods=["GET"])
@token_required
def list_alertes(current_user):
    """
    GET /api/v1/alertes
    Lister toutes les alertes de l'utilisateur connecté.

    Query parameters:
        skip (int): Nombre de résultats à ignorer (default: 0)
        limit (int): Limite de résultats (default: 20, max: 100)

    Returns:
        200 OK + AlerteAnnonceListResponse
        401 Unauthorized
    """
    try:
        skip = int(request.args.get("skip", 0))
        limit = int(request.args.get("limit", 20))
        limit = min(limit, 100)  # Limite max 100

        # Récupérer les alertes de l'utilisateur
        alertes_query = AlerteAnnonce.query.filter_by(
            utilisateur_id=current_user["user_id"]
        ).order_by(AlerteAnnonce.date_creation.desc())

        total = alertes_query.count()
        alertes = alertes_query.offset(skip).limit(limit).all()

        response = AlerteAnnonceListResponse(
            items=[AlerteAnnonceResponse.from_orm(a) for a in alertes],
            total=total,
            skip=skip,
            limit=limit,
        )
        return jsonify(response.dict()), 200

    except Exception as e:
        return jsonify({"error": str(e), "code": 400}), 400


@alertes_bp.route("", methods=["POST"])
@token_required
def create_alerte(current_user):
    """
    POST /api/v1/alertes
    Créer une nouvelle alerte (JWT required).

    Request body: CreateAlerteAnnonce (Pydantic validated)

    Returns:
        201 Created + AlerteAnnonceResponse
        400 Bad Request (validation error)
        401 Unauthorized
    """
    try:
        data = request.get_json()
        alerte_data = CreateAlerteAnnonce(**data)

        # Créer l'alerte
        alerte = AlerteAnnonce(
            utilisateur_id=current_user["user_id"],
            nom=alerte_data.nom,
            ville=alerte_data.ville,
            code_postal=alerte_data.code_postal,
            type_bien=alerte_data.type_bien,
            prix_min=alerte_data.prix_min,
            prix_max=alerte_data.prix_max,
            surface_min=alerte_data.surface_min,
            surface_max=alerte_data.surface_max,
            nombre_pieces_min=alerte_data.nombre_pieces_min,
            nombre_pieces_max=alerte_data.nombre_pieces_max,
            dpe=alerte_data.dpe,
            ascenseur=alerte_data.ascenseur,
            balcon=alerte_data.balcon,
            terrasse=alerte_data.terrasse,
            jardin=alerte_data.jardin,
            piscine=alerte_data.piscine,
            parking=alerte_data.parking,
            frequence=alerte_data.frequence,
            email_notification=alerte_data.email_notification,
        )

        db.session.add(alerte)
        db.session.commit()

        response = AlerteAnnonceResponse.from_orm(alerte)
        return jsonify(response.dict()), 201

    except ValidationError as e:
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
        db.session.rollback()
        return jsonify({"error": str(e), "code": 400}), 400


@alertes_bp.route("/<int:alerte_id>", methods=["GET"])
@token_required
def get_alerte(current_user, alerte_id):
    """
    GET /api/v1/alertes/{id}
    Récupérer une alerte (owner check).

    Returns:
        200 OK + AlerteAnnonceResponse
        403 Forbidden (not owner)
        404 Not Found
    """
    try:
        alerte = AlerteAnnonce.query.filter_by(
            alerte_id=alerte_id,
            utilisateur_id=current_user["user_id"]
        ).first()

        if not alerte:
            return jsonify({"error": "Alerte non trouvée", "code": 404}), 404

        response = AlerteAnnonceResponse.from_orm(alerte)
        return jsonify(response.dict()), 200

    except Exception as e:
        return jsonify({"error": str(e), "code": 400}), 400


@alertes_bp.route("/<int:alerte_id>", methods=["PUT"])
@token_required
def update_alerte(current_user, alerte_id):
    """
    PUT /api/v1/alertes/{id}
    Mettre à jour une alerte (owner check).

    Request body: UpdateAlerteAnnonce (Pydantic validated)

    Returns:
        200 OK + AlerteAnnonceResponse
        403 Forbidden (not owner)
        404 Not Found
        400 Bad Request
    """
    try:
        alerte = AlerteAnnonce.query.filter_by(
            alerte_id=alerte_id,
            utilisateur_id=current_user["user_id"]
        ).first()

        if not alerte:
            return jsonify({"error": "Alerte non trouvée", "code": 404}), 404

        data = request.get_json()
        alerte_data = UpdateAlerteAnnonce(**data)

        # Mettre à jour les champs fournis
        for field, value in alerte_data.dict(exclude_unset=True).items():
            if value is not None:
                setattr(alerte, field, value)

        db.session.commit()

        response = AlerteAnnonceResponse.from_orm(alerte)
        return jsonify(response.dict()), 200

    except ValidationError as e:
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
        db.session.rollback()
        return jsonify({"error": str(e), "code": 400}), 400


@alertes_bp.route("/<int:alerte_id>", methods=["DELETE"])
@token_required
def delete_alerte(current_user, alerte_id):
    """
    DELETE /api/v1/alertes/{id}
    Supprimer une alerte (owner check).

    Returns:
        204 No Content
        403 Forbidden (not owner)
        404 Not Found
    """
    try:
        alerte = AlerteAnnonce.query.filter_by(
            alerte_id=alerte_id,
            utilisateur_id=current_user["user_id"]
        ).first()

        if not alerte:
            return jsonify({"error": "Alerte non trouvée", "code": 404}), 404

        db.session.delete(alerte)
        db.session.commit()

        return "", 204

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "code": 400}), 400


@alertes_bp.route("/<int:alerte_id>/toggle", methods=["POST"])
@token_required
def toggle_alerte(current_user, alerte_id):
    """
    POST /api/v1/alertes/{id}/toggle
    Activer/désactiver une alerte.

    Returns:
        200 OK + AlerteAnnonceResponse
        403 Forbidden (not owner)
        404 Not Found
    """
    try:
        alerte = AlerteAnnonce.query.filter_by(
            alerte_id=alerte_id,
            utilisateur_id=current_user["user_id"]
        ).first()

        if not alerte:
            return jsonify({"error": "Alerte non trouvée", "code": 404}), 404

        alerte.actif = not alerte.actif
        db.session.commit()

        response = AlerteAnnonceResponse.from_orm(alerte)
        return jsonify(response.dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "code": 400}), 400
