"""
Routes pour gérer les créneaux de disponibilité des vendeurs.

Endpoints:
- POST /creneaux : Créer un nouveau créneau
- GET /creneaux : Récupérer tous les créneaux (pour l'utilisateur)
- GET /creneaux/<int:creneau_id> : Détails d'un créneau
- DELETE /creneaux/<int:creneau_id> : Supprimer un créneau
- GET /vendeurs/<int:vendeur_id>/creneaux : Récupérer les créneaux d'un vendeur
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from src.auth.models import db, User
from src.auth.decorators import token_required
from src.models.creneaux import CreneauDisponible


creneaux_bp = Blueprint("creneaux", __name__, url_prefix="/api/creneaux")


@creneaux_bp.route("", methods=["POST"])
@token_required
def creer_creneau(current_user):
    """
    Créer un nouveau créneau de disponibilité pour le vendeur actuel.

    Body JSON:
        jour (str): Date/heure ISO 8601 (e.g., "2025-01-15T00:00:00")
        heure_debut (str): Heure de début au format "HH:MM"
        heure_fin (str): Heure de fin au format "HH:MM"

    Returns:
        201: {"message": "Créneau créé", "creneau": {...}}
        400: {"error": "Champs manquants ou invalides"}
    """
    try:
        data = request.get_json() or {}

        # Validation
        jour = data.get("jour")
        heure_debut = data.get("heure_debut")
        heure_fin = data.get("heure_fin")

        if not all([jour, heure_debut, heure_fin]):
            return jsonify({"error": "Champs manquants: jour, heure_debut, heure_fin"}), 400

        # Vérifier le format de l'heure (HH:MM)
        for heure in [heure_debut, heure_fin]:
            try:
                datetime.strptime(heure, "%H:%M")
            except ValueError:
                return jsonify({"error": f"Format heure invalide: {heure} (attendu HH:MM)"}), 400

        # Vérifier que heure_debut < heure_fin
        debut = datetime.strptime(heure_debut, "%H:%M")
        fin = datetime.strptime(heure_fin, "%H:%M")
        if debut >= fin:
            return jsonify({"error": "heure_debut doit être inférieure à heure_fin"}), 400

        # Parser la date
        try:
            jour_dt = datetime.fromisoformat(jour.replace("Z", "+00:00"))
        except ValueError:
            return jsonify({"error": f"Format date invalide: {jour} (attendu ISO 8601)"}), 400

        # Créer le créneau
        nouveau_creneau = CreneauDisponible(
            utilisateur_id=current_user.utilisateur_id,
            jour=jour_dt,
            heure_debut=heure_debut,
            heure_fin=heure_fin,
            est_disponible=True
        )

        db.session.add(nouveau_creneau)
        db.session.commit()

        return jsonify({
            "message": "Créneau créé avec succès",
            "creneau": nouveau_creneau.to_dict()
        }), 201

    except ValueError as e:
        db.session.rollback()
        logger.error(f"Erreur création créneau (données invalides): {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur création créneau: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@creneaux_bp.route("", methods=["GET"])
@token_required
def get_mes_creneaux(current_user):
    """
    Récupérer tous les créneaux de disponibilité de l'utilisateur actuel.

    Query parameters:
        jour (optional): Filtrer par date (ISO 8601)
        seulement_disponibles (optional): Si 'true', retourner seulement les créneaux disponibles

    Returns:
        200: {"creneaux": [...]}
    """
    try:
        query = CreneauDisponible.query.filter_by(utilisateur_id=current_user.utilisateur_id)

        # Filtrage optionnel
        jour = request.args.get("jour")
        if jour:
            try:
                jour_dt = datetime.fromisoformat(jour.replace("Z", "+00:00"))
                # Filtrer par jour (minuit à minuit)
                from sqlalchemy import func
                query = query.filter(
                    func.date(CreneauDisponible.jour) == jour_dt.date()
                )
            except ValueError:
                return jsonify({"error": "Format date invalide"}), 400

        # Seulement les créneaux disponibles
        if request.args.get("seulement_disponibles", "").lower() == "true":
            query = query.filter_by(est_disponible=True)

        creneaux = query.order_by(CreneauDisponible.jour).all()

        return jsonify({
            "creneaux": [c.to_dict() for c in creneaux],
            "count": len(creneaux)
        }), 200

    except ValueError as e:
        logger.error(f"Erreur récupération créneaux (paramètres invalides): {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur récupération créneaux: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@creneaux_bp.route("/<int:creneau_id>", methods=["GET"])
@token_required
def get_creneau(current_user, creneau_id):
    """
    Récupérer les détails d'un créneau spécifique.

    Returns:
        200: {"creneau": {...}}
        404: {"error": "Créneau non trouvé"}
        403: {"error": "Accès non autorisé"}
    """
    try:
        creneau = CreneauDisponible.query.get(creneau_id)

        if not creneau:
            return jsonify({"error": "Créneau non trouvé"}), 404

        # Vérifier que l'utilisateur est propriétaire du créneau
        if creneau.utilisateur_id != current_user.utilisateur_id:
            return jsonify({"error": "Accès non autorisé"}), 403

        return jsonify({"creneau": creneau.to_dict()}), 200

    except ValueError as e:
        logger.error(f"Erreur récupération créneau (ID invalide): {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur récupération créneau: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@creneaux_bp.route("/<int:creneau_id>", methods=["DELETE"])
@token_required
def supprimer_creneau(current_user, creneau_id):
    """
    Supprimer un créneau de disponibilité.

    Returns:
        200: {"message": "Créneau supprimé"}
        404: {"error": "Créneau non trouvé"}
        403: {"error": "Accès non autorisé"}
    """
    try:
        creneau = CreneauDisponible.query.get(creneau_id)

        if not creneau:
            return jsonify({"error": "Créneau non trouvé"}), 404

        # Vérifier que l'utilisateur est propriétaire
        if creneau.utilisateur_id != current_user.utilisateur_id:
            return jsonify({"error": "Accès non autorisé"}), 403

        # Supprimer le créneau (et les RDV associés si de_cascade)
        db.session.delete(creneau)
        db.session.commit()

        return jsonify({"message": "Créneau supprimé avec succès"}), 200

    except ValueError as e:
        db.session.rollback()
        logger.error(f"Erreur suppression créneau (ID invalide): {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur suppression créneau: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@creneaux_bp.route("/vendeurs/<int:vendeur_id>/creneaux", methods=["GET"])
def get_creneaux_vendeur(vendeur_id):
    """
    Récupérer les créneaux disponibles d'un vendeur (endpoint public).

    Retourne seulement les créneaux encore disponibles.

    Query parameters:
        jour (optional): Filtrer par date

    Returns:
        200: {"creneaux": [...]}
        404: {"error": "Vendeur non trouvé"}
    """
    try:
        vendeur = User.query.get(vendeur_id)
        if not vendeur:
            return jsonify({"error": "Vendeur non trouvé"}), 404

        query = CreneauDisponible.query.filter_by(
            utilisateur_id=vendeur_id,
            est_disponible=True
        )

        # Filtrage optionnel par jour
        jour = request.args.get("jour")
        if jour:
            try:
                jour_dt = datetime.fromisoformat(jour.replace("Z", "+00:00"))
                from sqlalchemy import func
                query = query.filter(
                    func.date(CreneauDisponible.jour) == jour_dt.date()
                )
            except ValueError:
                return jsonify({"error": "Format date invalide"}), 400

        creneaux = query.order_by(CreneauDisponible.jour).all()

        return jsonify({
            "vendeur_id": vendeur_id,
            "creneaux": [c.to_dict() for c in creneaux],
            "count": len(creneaux)
        }), 200

    except ValueError as e:
        logger.error(f"Erreur récupération créneaux vendeur (paramètres invalides): {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur récupération créneaux vendeur: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@creneaux_bp.route("/<int:creneau_id>/marquer-reserve", methods=["PUT"])
@token_required
def marquer_creneau_reserve(current_user, creneau_id):
    """
    Marquer un créneau comme réservé (n'est plus disponible).

    Utilisé après qu'un RDV soit accepté sur ce créneau.

    Returns:
        200: {"message": "Créneau marqué comme réservé"}
        404: {"error": "Créneau non trouvé"}
        403: {"error": "Accès non autorisé"}
    """
    try:
        creneau = CreneauDisponible.query.get(creneau_id)

        if not creneau:
            return jsonify({"error": "Créneau non trouvé"}), 404

        # Vérifier que l'utilisateur est propriétaire
        if creneau.utilisateur_id != current_user.utilisateur_id:
            return jsonify({"error": "Accès non autorisé"}), 403

        creneau.est_disponible = False
        db.session.commit()

        return jsonify({"message": "Créneau marqué comme réservé"}), 200

    except ValueError as e:
        db.session.rollback()
        logger.error(f"Erreur marquage créneau réservé (ID invalide): {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur marquage créneau réservé: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@creneaux_bp.route("/<int:creneau_id>/marquer-disponible", methods=["PUT"])
@token_required
def marquer_creneau_disponible(current_user, creneau_id):
    """
    Marquer un créneau comme à nouveau disponible.

    Utilisé si un RDV est refusé et qu'on veut libérer le créneau.

    Returns:
        200: {"message": "Créneau marqué comme disponible"}
        404: {"error": "Créneau non trouvé"}
        403: {"error": "Accès non autorisé"}
    """
    try:
        creneau = CreneauDisponible.query.get(creneau_id)

        if not creneau:
            return jsonify({"error": "Créneau non trouvé"}), 404

        # Vérifier que l'utilisateur est propriétaire
        if creneau.utilisateur_id != current_user.utilisateur_id:
            return jsonify({"error": "Accès non autorisé"}), 403

        creneau.est_disponible = True
        db.session.commit()

        return jsonify({"message": "Créneau marqué comme disponible"}), 200

    except ValueError as e:
        db.session.rollback()
        logger.error(f"Erreur marquage créneau disponible (ID invalide): {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur marquage créneau disponible: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
