"""
Routes Flask pour le système de matching acheteur-annonces.

Endpoint principal:
- POST /api/v1/matching  → Récupérer les annonces triées par score de pertinence

Pour Gilbert: Ce endpoint compare les critères de l'acheteur avec toutes les annonces
et retourne les meilleures propositions classées par score décroissant.
"""

from flask import Blueprint, request, jsonify
from src.auth.models import db, User
from src.auth.decorators import token_required
from src.models.annonces import Annonce
from src.services.matching import MatchingCalculator
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError

# Blueprint
matching_bp = Blueprint("matching", __name__, url_prefix="/api/v1/matching")

# Constantes
MAX_RESULTS = 10  # Limiter à 10 annonces max (les meilleures)
MIN_SCORE_THRESHOLD = 5  # Score minimum pour recommander une annonce (filtrer les matchs faibles)


@matching_bp.route("", methods=["POST"])
@token_required
@handle_errors()
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

    # 1️⃣ Récupérer et valider l'utilisateur_id
    data = request.get_json() or {}
    utilisateur_id = data.get("utilisateur_id")

    if not utilisateur_id:
        # Si pas d'utilisateur_id fourni, utiliser l'utilisateur courant
        utilisateur_id = current_user.utilisateur_id

    # 2️⃣ Récupérer l'utilisateur depuis la BD
    acheteur = User.query.filter_by(utilisateur_id=utilisateur_id).first()

    if not acheteur:
        raise NotFoundError(f"Utilisateur {utilisateur_id} non trouvé")

    # 3️⃣ Vérifier qu'il a défini au moins les critères minimaux
    if not acheteur.budget_max or not acheteur.ville_recherchee:
        raise ValidationError("Veuillez définir un budget et une ville de recherche dans votre profil")

    # 4️⃣ Convertir l'utilisateur en dictionnaire pour le scoring
    acheteur_dict = {
        "utilisateur_id": acheteur.utilisateur_id,
        "budget_max": float(acheteur.budget_max) if acheteur.budget_max else 0,
        "ville_recherchee": acheteur.ville_recherchee,
        "surface_min": acheteur.surface_min or 0,
        "type_bien_recherche": acheteur.type_bien_recherche or "appartement",
        "nombre_pieces_min": acheteur.nombre_pieces_min,
        "dpe_ideale": acheteur.dpe_ideale,
    }

    # 5️⃣ Récupérer TOUTES les annonces publiées
    annonces = Annonce.query.filter_by(statut="publiée").all()

    if not annonces:
        return {
            "status": "success",
            "annonces": [],
            "total": 0,
            "message": "Aucune annonce publiée pour le moment",
        }, 200

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
    return {
        "status": "success",
        "annonces": top_annonces,
        "total": len(top_annonces),
        "message": f"{len(top_annonces)} annonce(s) trouvée(s) (sur {len(annonces_avec_scores)} avec score >= {MIN_SCORE_THRESHOLD})",
        "utilisateur": {
            "utilisateur_id": acheteur.utilisateur_id,
            "nom": acheteur.nom,
            "prenom": acheteur.prenom,
            "budget_max": float(acheteur.budget_max) if acheteur.budget_max else None,
            "ville": acheteur.ville_recherchee,
            "surface_min": acheteur.surface_min,
            "type_bien": acheteur.type_bien_recherche,
        },
    }, 200


@matching_bp.route("/stats", methods=["GET"])
@token_required
@handle_errors()
def get_matching_stats(current_user):
    """
    GET /api/v1/matching/stats
    Retourne des statistiques sur les annonces et utilisateurs avec critères acheteur.

    Response:
    {
        "status": "success",
        "total_annonces": 150,
        "annonces_publiees": 120,
        "total_utilisateurs": 45,
        "utilisateurs_avec_criteres": 40
    }
    """
    total_annonces = Annonce.query.count()
    annonces_publiees = Annonce.query.filter_by(statut="publiée").count()
    total_utilisateurs = User.query.filter_by(role="user").count()
    utilisateurs_avec_criteres = User.query.filter_by(role="user", actif=True).filter(
        User.budget_max.isnot(None),
        User.ville_recherchee.isnot(None)
    ).count()

    return {
        "status": "success",
        "total_annonces": total_annonces,
        "annonces_publiees": annonces_publiees,
        "total_utilisateurs": total_utilisateurs,
        "utilisateurs_avec_criteres": utilisateurs_avec_criteres,
    }, 200
