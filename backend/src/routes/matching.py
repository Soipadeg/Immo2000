"""
Routes Flask pour le système de matching acheteur-annonces.

Endpoint principal:
- POST /api/v1/matching  → Récupérer les annonces triées par score de pertinence

Pour Gilbert: Ce endpoint compare les critères de l'acheteur avec toutes les annonces
et retourne les meilleures propositions classées par score décroissant.
"""

from flask import Blueprint, request, jsonify
from src.auth.models import db
from src.auth.decorators import token_required
from src.models.acheteurs import Acheteur
from src.models.annonces import Annonce
from src.services.matching import MatchingCalculator

# Blueprint
matching_bp = Blueprint("matching", __name__, url_prefix="/api/v1/matching")

# Constantes
MAX_RESULTS = 10  # Limiter à 10 annonces max (les meilleures)
MIN_SCORE_THRESHOLD = 5  # Score minimum pour recommander une annonce (filtrer les matchs faibles)


@matching_bp.route("", methods=["POST"])
@token_required
def get_matching_annonces(current_user):
    """
    POST /api/v1/matching
    Récupère les annonces les mieux adaptées aux critères de l'acheteur.

    Request body:
    {
        "acheteur_id": 1  (optionnel: si omis, utilise current_user.user_id)
    }

    Response:
    {
        "status": "success",
        "annonces": [
            {
                "annonce_id": 101,
                "adresse": "45 rue de la Paix, Paris",
                "ville": "Paris",
                "prix": 250000,
                "surface": 75,
                "type_bien": "appartement",
                "score": 21
            },
            ...
        ],
        "total": 2,
        "message": "2 annonces trouvées"
    }

    Erreurs possibles:
    - 400: Bad Request (données invalides)
    - 401: Unauthorized (pas authentifié)
    - 404: Not Found (acheteur non trouvé)
    - 500: Internal Server Error
    """

    try:
        # 1️⃣ Récupérer et valider l'acheteur_id
        data = request.get_json() or {}
        acheteur_id = data.get("acheteur_id")

        if not acheteur_id:
            # Si pas d'acheteur_id fourni, utiliser le profil acheteur de l'utilisateur courant
            acheteur_id = current_user.user_id

        # 2️⃣ Récupérer l'acheteur depuis la BD
        acheteur = Acheteur.query.filter_by(acheteur_id=acheteur_id).first()

        if not acheteur:
            return jsonify(
                {
                    "status": "error",
                    "message": f"Acheteur {acheteur_id} non trouvé",
                    "code": "ACHETEUR_NOT_FOUND",
                }
            ), 404

        # Vérifier que l'acheteur appartient bien à l'utilisateur courant (sauf si admin)
        # TODO: Implémenter vérification des droits (owner check) si besoin
        # if acheteur.utilisateur_id != current_user.user_id and not current_user.is_admin:
        #     return jsonify({"status": "error", "message": "Unauthorized"}), 403

        # 3️⃣ Convertir l'acheteur en dictionnaire pour le scoring
        acheteur_dict = {
            "acheteur_id": acheteur.acheteur_id,
            "budget_max": float(acheteur.budget_max),
            "ville_recherchee": acheteur.ville_recherchee,
            "surface_min": acheteur.surface_min,
            "type_bien_recherche": acheteur.type_bien_recherche,
            "nombre_pieces_min": acheteur.nombre_pieces_min,
            "dpe_ideale": acheteur.dpe_ideale,
        }

        # 4️⃣ Récupérer TOUTES les annonces publiées
        # TODO: Ajouter pagination si trop d'annonces
        annonces = Annonce.query.filter_by(statut="publiée").all()

        if not annonces:
            return jsonify(
                {
                    "status": "success",
                    "annonces": [],
                    "total": 0,
                    "message": "Aucune annonce publiée pour le moment",
                }
            ), 200

        # 5️⃣ Calculer le score pour chaque annonce
        annonces_avec_scores = []

        for annonce in annonces:
            # Convertir en dictionnaire
            annonce_dict = {
                "annonce_id": annonce.annonce_id,
                "prix": float(annonce.prix) if annonce.prix else 0,
                "ville": annonce.ville,
                "surface": annonce.surface,
                "type_bien": annonce.type_bien,
                "adresse": annonce.adresse,
                "titre": annonce.titre,
                "date_creation": annonce.date_creation.isoformat() if annonce.date_creation else None,
            }

            # Calculer le score
            score = MatchingCalculator.calculate_score(annonce_dict, acheteur_dict)

            # Ajouter à la liste si score >= seuil minimum
            if score >= MIN_SCORE_THRESHOLD:
                annonces_avec_scores.append(
                    {
                        "annonce_id": annonce.annonce_id,
                        "adresse": annonce.adresse,
                        "titre": annonce.titre,
                        "ville": annonce.ville,
                        "prix": float(annonce.prix) if annonce.prix else 0,
                        "surface": annonce.surface,
                        "type_bien": annonce.type_bien,
                        "score": score,
                        "date_creation": annonce.date_creation.isoformat() if annonce.date_creation else None,
                    }
                )

        # 6️⃣ Trier par score décroissant (meilleures en premier), puis par date (plus récentes)
        annonces_avec_scores.sort(
            key=lambda x: (x["score"], x["date_creation"]), reverse=True
        )

        # 7️⃣ Limiter à MAX_RESULTS
        top_annonces = annonces_avec_scores[:MAX_RESULTS]

        # 8️⃣ Retourner la réponse
        return jsonify(
            {
                "status": "success",
                "annonces": top_annonces,
                "total": len(top_annonces),
                "message": f"{len(top_annonces)} annonce(s) trouvée(s) (sur {len(annonces_avec_scores)} avec score >= {MIN_SCORE_THRESHOLD})",
                "acheteur": {
                    "acheteur_id": acheteur.acheteur_id,
                    "budget_max": float(acheteur.budget_max),
                    "ville": acheteur.ville_recherchee,
                    "surface_min": acheteur.surface_min,
                    "type_bien": acheteur.type_bien_recherche,
                },
            }
        ), 200

    except ValueError as e:
        # Erreur de validation
        return jsonify(
            {
                "status": "error",
                "message": f"Erreur de validation: {str(e)}",
                "code": "VALIDATION_ERROR",
            }
        ), 400

    except Exception as e:
        # Erreur serveur
        return jsonify(
            {
                "status": "error",
                "message": f"Erreur serveur: {str(e)}",
                "code": "SERVER_ERROR",
            }
        ), 500


@matching_bp.route("/stats", methods=["GET"])
@token_required
def get_matching_stats(current_user):
    """
    GET /api/v1/matching/stats
    Retourne des statistiques sur les annonces et acheteurs.

    Response:
    {
        "status": "success",
        "total_annonces": 150,
        "annonces_publiees": 120,
        "total_acheteurs": 45,
        "acheteurs_actifs": 40
    }
    """
    try:
        total_annonces = Annonce.query.count()
        annonces_publiees = Annonce.query.filter_by(statut="publiée").count()
        total_acheteurs = Acheteur.query.count()
        acheteurs_actifs = Acheteur.query.filter_by(actif=True).count()

        return jsonify(
            {
                "status": "success",
                "total_annonces": total_annonces,
                "annonces_publiees": annonces_publiees,
                "total_acheteurs": total_acheteurs,
                "acheteurs_actifs": acheteurs_actifs,
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"status": "error", "message": str(e), "code": "SERVER_ERROR"}
        ), 500
