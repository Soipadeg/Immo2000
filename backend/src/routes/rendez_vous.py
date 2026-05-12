"""
Routes Flask pour les rendez-vous de visite.

Endpoints:
- POST   /api/v1/rendez-vous              → Proposer un RDV (JWT required)
- GET    /api/v1/rendez-vous              → Lister mes RDV (JWT required)
- GET    /api/v1/rendez-vous/{id}         → Détail RDV (JWT required)
- PUT    /api/v1/rendez-vous/{id}         → Accepter/Refuser/Contre-proposer (JWT required)
- DELETE /api/v1/rendez-vous/{id}         → Annuler RDV (JWT required)
"""

from flask import Blueprint, request, jsonify, send_file
from datetime import datetime, timedelta
from src.auth.models import db
from src.auth.decorators import token_required
from src.models.rendez_vous import RendezVous
from src.models.historique_rdv import HistoriqueRDV
from src.models.annonces import Annonce
from src.models.utilisateurs import Utilisateur
from src.models.notifications import Notification, NotificationType
from src.schemas.rendez_vous import (
    CreateRDV,
    UpdateRDV,
    RDVResponse,
    RDVListResponse,
)
from pydantic import ValidationError
import io

# Blueprint
rdv_bp = Blueprint("rendez_vous", __name__, url_prefix="/api/v1/rendez-vous")


# ============================================================================
# HELPERS
# ============================================================================

def ajouter_historique(rdv_id, utilisateur_id, action, date_proposée=None, message=None):
    """
    Créer une entrée dans l'historique RDV.

    Args:
        rdv_id: ID du RDV
        utilisateur_id: ID de l'utilisateur qui a fait l'action
        action: Type d'action ('creation', 'acceptation', 'refus', 'contre_proposition')
        date_proposée: Date proposée (si applicable)
        message: Message accompagnant (optionnel)
    """
    historique = HistoriqueRDV(
        rdv_id=rdv_id,
        utilisateur_id=utilisateur_id,
        action=action,
        date_proposée=date_proposée,
        message=message
    )
    db.session.add(historique)


def generer_ical(rdv):
    """
    Générer un fichier iCal (.ics) pour un RDV.

    Args:
        rdv: Object RendezVous

    Returns:
        bytes: Contenu du fichier .ics
    """
    from src.models.annonces import Annonce
    from src.auth.models import User

    annonce = Annonce.query.get(rdv.annonce_id)
    acheteur = User.query.get(rdv.acheteur_id)
    vendeur = User.query.get(rdv.vendeur_id)

    if not annonce or not acheteur or not vendeur:
        return None

    # Format iCal (RFC 5545)
    date_str = rdv.date_confirmée.strftime("%Y%m%dT%H%M%S") if rdv.date_confirmée else rdv.date_proposée.strftime("%Y%m%dT%H%M%S")
    uid = f"rdv-{rdv.rdv_id}@immo2000.fr"

    ical = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Immo2000//NONSGML v1.0//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Rendez-vous Immo2000
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
UID:{uid}
DTSTAMP:{datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")}
DTSTART:{date_str}
SUMMARY:Visite - {annonce.titre}
DESCRIPTION:Visite de bien immobilier\\nAdresse: {annonce.adresse}\\nVendeur: {vendeur.prenom} {vendeur.nom}\\nTéléphone: {vendeur.telephone or 'Non renseigné'}
LOCATION:{annonce.adresse}, {annonce.code_postal} {annonce.ville}
CONTACT:Acheteur: {acheteur.email}\\nVendeur: {vendeur.email}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR"""

    return ical.encode('utf-8')


# Blueprint
rdv_bp = Blueprint("rendez_vous", __name__, url_prefix="/api/v1/rendez-vous")


@rdv_bp.route("", methods=["POST"])
@token_required
def create_rdv(current_user):
    """
    POST /api/v1/rendez-vous
    Créer un nouveau RDV (acheteur propose date/heure).

    Request body: CreateRDV (Pydantic validated)

    Returns:
        201 Created + RDVResponse
        400 Bad Request (validation error)
        401 Unauthorized (no JWT)
        404 Not Found (annonce n'existe pas)
    """
    try:
        # Valider les données
        data = request.get_json()
        rdv_data = CreateRDV(**data)

        # Vérifier que l'annonce existe
        annonce = Annonce.query.filter_by(annonce_id=rdv_data.annonce_id).first()
        if not annonce:
            return jsonify({"error": "Annonce non trouvée"}), 404

        # Vérifier que l'acheteur n'est pas le vendeur
        if annonce.utilisateur_id == current_user["user_id"]:
            return jsonify({"error": "Vous ne pouvez pas proposer un RDV pour votre propre annonce"}), 400

        # Vérifier qu'il n'y a pas déjà un RDV en cours pour ce bien
        existing_rdv = RendezVous.query.filter(
            RendezVous.annonce_id == rdv_data.annonce_id,
            RendezVous.acheteur_id == current_user["user_id"],
            RendezVous.statut != "refusé"
        ).first()
        if existing_rdv:
            return jsonify({"error": "Vous avez déjà un RDV en cours pour cette annonce"}), 400

        # Créer le RDV
        rdv = RendezVous(
            annonce_id=rdv_data.annonce_id,
            acheteur_id=current_user["user_id"],
            vendeur_id=annonce.utilisateur_id,
            date_proposée=rdv_data.date_proposée,
            message_dernier=rdv_data.message,
            dernier_proposant="acheteur",
            statut="en_attente_vendeur"
        )

        db.session.add(rdv)
        db.session.commit()

        # Ajouter à l'historique
        ajouter_historique(
            rdv.rdv_id,
            current_user["user_id"],
            "creation",
            rdv_data.date_proposée,
            rdv_data.message
        )

        # Créer une notification pour le vendeur
        notification = Notification(
            user_id=annonce.utilisateur_id,
            type=NotificationType.MESSAGE_RECEIVED,
            title="Nouveau RDV proposé",
            message=f"Un acheteur souhaite visiter votre annonce '{annonce.titre}'",
            related_entity_type="rendez_vous",
            related_entity_id=rdv.rdv_id,
            icon="📅"
        )
        db.session.add(notification)
        db.session.commit()

        response = RDVResponse.from_orm(rdv)
        return jsonify(response.dict()), 201

    except ValidationError as e:
        errors = [{"field": ".".join(str(x) for x in err.get("loc", [])), "msg": err.get("msg")} for err in e.errors()]
        return jsonify({"error": "Validation error", "details": errors}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@rdv_bp.route("", methods=["GET"])
@token_required
def list_rdv(current_user):
    """
    GET /api/v1/rendez-vous?skip=0&limit=20&statut=confirmé&role=acheteur
    Lister mes RDV (JWT required).

    Query parameters:
        skip (int): Nombre de résultats à ignorer (default: 0)
        limit (int): Limite de résultats (default: 20)
        statut (str): Filtrer par statut (en_attente_vendeur, en_attente_acheteur, confirmé, refusé)
        role (str): 'acheteur' ou 'vendeur' (pour filtrer son rôle)

    Returns:
        200 OK + RDVListResponse (paginated)
    """
    try:
        skip = request.args.get("skip", 0, type=int)
        limit = request.args.get("limit", 20, type=int)
        statut = request.args.get("statut", None)
        role = request.args.get("role", None)

        # Construire la requête
        query = RendezVous.query

        # Filtrer par rôle de l'utilisateur
        if role == "acheteur":
            query = query.filter_by(acheteur_id=current_user["user_id"])
        elif role == "vendeur":
            query = query.filter_by(vendeur_id=current_user["user_id"])
        else:
            # Par défaut, afficher les RDV où l'utilisateur est impliqué
            from sqlalchemy import or_
            query = query.filter(
                or_(
                    RendezVous.acheteur_id == current_user["user_id"],
                    RendezVous.vendeur_id == current_user["user_id"]
                )
            )

        # Filtrer par statut
        if statut:
            query = query.filter_by(statut=statut)

        # Pagination
        total = query.count()
        rdv_list = query.offset(skip).limit(limit).all()

        # Répondre
        response = RDVListResponse(
            items=[RDVResponse.from_orm(rdv) for rdv in rdv_list],
            total=total,
            skip=skip,
            limit=limit
        )
        return jsonify(response.dict()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@rdv_bp.route("/<int:rdv_id>", methods=["GET"])
@token_required
def get_rdv(current_user, rdv_id):
    """
    GET /api/v1/rendez-vous/{id}
    Récupérer détail d'un RDV (JWT required).

    Returns:
        200 OK + RDVResponse
        404 Not Found
        403 Forbidden (pas autorisé)
    """
    try:
        rdv = RendezVous.query.filter_by(rdv_id=rdv_id).first()

        if not rdv:
            return jsonify({"error": "RDV non trouvé"}), 404

        # Vérifier que l'utilisateur est impliqué dans le RDV
        if rdv.acheteur_id != current_user["user_id"] and rdv.vendeur_id != current_user["user_id"]:
            return jsonify({"error": "Non autorisé"}), 403

        response = RDVResponse.from_orm(rdv)
        return jsonify(response.dict()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@rdv_bp.route("/<int:rdv_id>", methods=["PUT"])
@token_required
def update_rdv(current_user, rdv_id):
    """
    PUT /api/v1/rendez-vous/{id}
    Accepter, refuser ou contre-proposer un RDV.

    Request body: UpdateRDV

    Logique:
    - Si action="accepter" → valide la date proposée
    - Si action="refuser" + date_proposée → contre-propose
    - Si action="refuser" sans date → refuse définitivement

    Si les 2 acceptent la même date → RDV confirmé automatiquement

    Returns:
        200 OK + RDVResponse
        400 Bad Request
        404 Not Found
        403 Forbidden
    """
    try:
        rdv = RendezVous.query.filter_by(rdv_id=rdv_id).first()

        if not rdv:
            return jsonify({"error": "RDV non trouvé"}), 404

        # Vérifier que l'utilisateur est impliqué dans le RDV
        if rdv.acheteur_id != current_user["user_id"] and rdv.vendeur_id != current_user["user_id"]:
            return jsonify({"error": "Non autorisé"}), 403

        # Valider les données
        data = request.get_json()
        rdv_data = UpdateRDV(**data)

        # Déterminer qui répond
        is_acheteur = rdv.acheteur_id == current_user["user_id"]
        is_vendeur = rdv.vendeur_id == current_user["user_id"]

        # Vérifier le statut actuel
        if is_acheteur and rdv.statut not in ["en_attente_acheteur"]:
            return jsonify({"error": "Vous ne pouvez pas répondre à ce RDV dans son statut actuel"}), 400
        if is_vendeur and rdv.statut not in ["en_attente_vendeur"]:
            return jsonify({"error": "Vous ne pouvez pas répondre à ce RDV dans son statut actuel"}), 400

        # Traiter la réponse
        if rdv_data.action == "accepter":
            # Accepter la date proposée
            rdv.date_confirmée = rdv.date_proposée
            rdv.statut = "confirmé"
            rdv.message_dernier = rdv_data.message or "RDV accepté"
            rdv.dernier_proposant = "acheteur" if is_acheteur else "vendeur"

            # Créer notification pour l'autre
            other_id = rdv.vendeur_id if is_acheteur else rdv.acheteur_id
            notification = Notification(
                user_id=other_id,
                type=NotificationType.MESSAGE_RECEIVED,
                title="RDV confirmé",
                message=f"Votre rendez-vous de visite a été confirmé",
                related_entity_type="rendez_vous",
                related_entity_id=rdv.rdv_id,
                icon="✓"
            )
            db.session.add(notification)

        elif rdv_data.action == "refuser":
            if rdv_data.date_proposée:
                # Contre-proposer une date
                rdv.date_proposée = rdv_data.date_proposée
                rdv.message_dernier = rdv_data.message or "Nouvelle date proposée"
                rdv.dernier_proposant = "acheteur" if is_acheteur else "vendeur"

                # Basculer le statut en attente vers l'autre utilisateur
                if is_acheteur:
                    rdv.statut = "en_attente_vendeur"
                else:
                    rdv.statut = "en_attente_acheteur"

                # Notification pour l'autre
                other_id = rdv.vendeur_id if is_acheteur else rdv.acheteur_id
                notification = Notification(
                    user_id=other_id,
                    type=NotificationType.MESSAGE_RECEIVED,
                    title="Nouvelle date proposée",
                    message=f"Une nouvelle date a été proposée pour votre RDV",
                    related_entity_type="rendez_vous",
                    related_entity_id=rdv.rdv_id,
                    icon="⏰"
                )
                db.session.add(notification)
            else:
                # Refuser définitivement
                rdv.statut = "refusé"
                rdv.message_dernier = rdv_data.message or "RDV refusé"
                rdv.dernier_proposant = "acheteur" if is_acheteur else "vendeur"

                # Ajouter à l'historique
                ajouter_historique(
                    rdv_id,
                    current_user["user_id"],
                    "refus",
                    None,
                    rdv_data.message
                )

                # Notification pour l'autre
                other_id = rdv.vendeur_id if is_acheteur else rdv.acheteur_id
                notification = Notification(
                    user_id=other_id,
                    type=NotificationType.MESSAGE_RECEIVED,
                    title="RDV refusé ✗",
                    message=f"Votre rendez-vous de visite a été refusé",
                    related_entity_type="rendez_vous",
                    related_entity_id=rdv.rdv_id,
                    icon="✗"
                )
                db.session.add(notification)
        else:
            return jsonify({"error": "Action invalide (accepter ou refuser)"}), 400

        # Commit tous les changements
        db.session.commit()

        response = RDVResponse.from_orm(rdv)
        return jsonify(response.dict()), 200

    except ValidationError as e:
        errors = [{"field": ".".join(str(x) for x in err.get("loc", [])), "msg": err.get("msg")} for err in e.errors()]
        return jsonify({"error": "Validation error", "details": errors}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@rdv_bp.route("/<int:rdv_id>", methods=["DELETE"])
@token_required
def delete_rdv(current_user, rdv_id):
    """
    DELETE /api/v1/rendez-vous/{id}
    Annuler un RDV (JWT required).

    Returns:
        200 OK
        404 Not Found
        403 Forbidden
    """
    try:
        rdv = RendezVous.query.filter_by(rdv_id=rdv_id).first()

        if not rdv:
            return jsonify({"error": "RDV non trouvé"}), 404

        # Vérifier que l'utilisateur est impliqué dans le RDV
        if rdv.acheteur_id != current_user["user_id"] and rdv.vendeur_id != current_user["user_id"]:
            return jsonify({"error": "Non autorisé"}), 403

        # Annuler le RDV
        rdv.statut = "refusé"
        ajouter_historique(
            rdv_id,
            current_user["user_id"],
            "refus",
            None,
            "RDV annulé par l'utilisateur"
        )
        db.session.commit()

        return jsonify({"message": "RDV annulé"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@rdv_bp.route("/<int:rdv_id>/historique", methods=["GET"])
@token_required
def get_rdv_historique(current_user, rdv_id):
    """
    GET /api/v1/rendez-vous/{id}/historique
    Récupérer l'historique/timeline d'un RDV.

    Returns:
        200 OK + List of HistoriqueRDV
        404 Not Found
        403 Forbidden
    """
    try:
        rdv = RendezVous.query.filter_by(rdv_id=rdv_id).first()

        if not rdv:
            return jsonify({"error": "RDV non trouvé"}), 404

        # Vérifier que l'utilisateur est impliqué dans le RDV
        if rdv.acheteur_id != current_user["user_id"] and rdv.vendeur_id != current_user["user_id"]:
            return jsonify({"error": "Non autorisé"}), 403

        # Récupérer l'historique ordonné par date
        historique = HistoriqueRDV.query.filter_by(rdv_id=rdv_id).order_by(HistoriqueRDV.date_action).all()

        return jsonify([h.to_dict() for h in historique]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@rdv_bp.route("/<int:rdv_id>/ical", methods=["GET"])
@token_required
def export_rdv_ical(current_user, rdv_id):
    """
    GET /api/v1/rendez-vous/{id}/ical
    Exporter un RDV en format iCal (.ics).

    Compatible avec: Google Calendar, Outlook, Apple Calendar, etc.

    Returns:
        200 OK + File .ics
        404 Not Found
        403 Forbidden
    """
    try:
        rdv = RendezVous.query.filter_by(rdv_id=rdv_id).first()

        if not rdv:
            return jsonify({"error": "RDV non trouvé"}), 404

        # Vérifier que l'utilisateur est impliqué dans le RDV
        if rdv.acheteur_id != current_user["user_id"] and rdv.vendeur_id != current_user["user_id"]:
            return jsonify({"error": "Non autorisé"}), 403

        # Vérifier que le RDV est confirmé
        if rdv.statut != "confirmé":
            return jsonify({"error": "Seuls les RDV confirmés peuvent être exportés"}), 400

        # Générer le fichier iCal
        ical_content = generer_ical(rdv)

        if not ical_content:
            return jsonify({"error": "Erreur lors de la génération du fichier"}), 500

        # Retourner le fichier
        return send_file(
            io.BytesIO(ical_content),
            mimetype="text/calendar",
            as_attachment=True,
            download_name=f"rdv-{rdv_id}.ics"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 400
