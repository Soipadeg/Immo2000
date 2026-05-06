"""
Routes Flask pour la gestion des réservations de visites.

Endpoints:
- POST /api/v1/visites                   → Créer une nouvelle visite
- GET /api/v1/visites                    → Lister les visites (acheteur ou vendeur)
- DELETE /api/v1/visites/<id>            → Annuler une visite
- GET /api/v1/visites/<id>/download.ics  → Télécharger le fichier .ics
- GET /api/v1/visites/info               → Infos publiques
"""

from flask import Blueprint, request, jsonify, send_file
from pydantic import ValidationError
from io import BytesIO
from src.services.visites import VisitesService, VisitesError
from src.schemas.visites import VisiteInput, VisiteOutput
from src.auth.decorators import token_required
from src.models.visites import Visite
from src.models.annonces import Annonce
from src.models.acheteurs import Acheteur

# Blueprint
visites_bp = Blueprint("visites", __name__, url_prefix="/api/v1/visites")


# ===== POST: Créer une visite =====

@visites_bp.route("", methods=["POST"])
@token_required
def creer_visite(current_user):
    """
    Créer une nouvelle réservation de visite.

    Authentification: JWT token requis (acheteur)

    Input JSON:
    {
        "acheteur_id": 1,
        "annonce_id": 5,
        "date_heure": "2026-05-20T14:00:00"
    }

    Output JSON (200):
    {
        "status": "success",
        "data": {
            "id": 1,
            "acheteur_id": 1,
            "annonce_id": 5,
            "date_heure": "2026-05-20T14:00:00",
            "statut": "confirmee",
            "score_matching": 5,
            "message": "Visite créée avec succès. Notification envoyée au vendeur."
        }
    }

    Error Responses:
    - 400: Erreur de validation (date invalide, annonce/acheteur introuvable, etc.)
    - 403: Score de matching insuffisant (< 5)
    - 422: Données invalides selon Pydantic
    - 500: Erreur serveur
    """
    try:
        # Valider les données d'entrée avec Pydantic
        data = request.get_json()
        visite_input = VisiteInput(**data)

        # Créer la visite via le service
        result = VisitesService.creer_visite(
            acheteur_id=visite_input.acheteur_id,
            annonce_id=visite_input.annonce_id,
            date_heure_str=visite_input.date_heure
        )

        return jsonify({
            "status": "success",
            "data": result
        }), 201

    except ValidationError as e:
        # Erreur Pydantic (données invalides)
        errors = []
        for error in e.errors():
            field = ".".join(str(x) for x in error["loc"])
            msg = error["msg"]
            errors.append(f"{field}: {msg}")

        return jsonify({
            "status": "error",
            "error": "Données invalides",
            "details": errors
        }), 422

    except VisitesError as e:
        # Erreur métier
        error_msg = str(e)

        # Déterminer le code HTTP
        if "score" in error_msg.lower():
            code = 403  # Forbidden: score insuffisant
        elif "passé" in error_msg.lower():
            code = 400  # Bad request: date invalide
        elif "existe" in error_msg.lower() or "introuvable" in error_msg.lower():
            code = 400  # Bad request: ressource inexistante
        else:
            code = 400  # Bad request: autre erreur

        return jsonify({
            "status": "error",
            "error": error_msg
        }), code

    except Exception as e:
        # Erreur serveur non gérée
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500


# ===== GET: Lister les visites =====

@visites_bp.route("", methods=["GET"])
@token_required
def lister_visites(current_user):
    """
    Lister les visites de l'utilisateur connecté.

    Authentification: JWT token requis

    Query Parameters:
    - role: 'vendeur' ou 'acheteur' (auto-détecté par le rôle de l'utilisateur)
    - statut: Optionnel ('confirmee', 'annulee', 'terminee')

    Output JSON (200):
    {
        "status": "success",
        "data": [
            {
                "id": 1,
                "acheteur_id": 1,
                "annonce_id": 5,
                "date_heure": "2026-05-20T14:00:00",
                "statut": "confirmee",
                "created_at": "2026-05-06T10:30:00",
                "updated_at": "2026-05-06T10:30:00"
            }
        ]
    }

    Error Responses:
    - 400: Paramètres invalides
    - 500: Erreur serveur
    """
    try:
        statut = request.args.get("statut", None)

        # Déterminer le rôle de l'utilisateur
        role = current_user.get("role")

        if role == "vendeur":
            # Lister les visites pour les annonces du vendeur
            vendeur_id = current_user.get("utilisateur_id")
            visites = VisitesService.lister_visites_vendeur(vendeur_id, statut=statut)

        elif role == "acheteur":
            # Lister les visites de l'acheteur
            # On doit chercher l'acheteur_id basé sur utilisateur_id
            from src.models.acheteurs import Acheteur
            acheteur = Acheteur.query.filter_by(utilisateur_id=current_user.get("utilisateur_id")).first()
            if not acheteur:
                return jsonify({
                    "status": "error",
                    "error": "Acheteur non trouvé pour cet utilisateur."
                }), 400

            visites = VisitesService.lister_visites_acheteur(acheteur.id, statut=statut)

        else:
            return jsonify({
                "status": "error",
                "error": f"Rôle invalide: {role}. Doit être 'acheteur' ou 'vendeur'."
            }), 400

        return jsonify({
            "status": "success",
            "data": visites,
            "count": len(visites)
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500


# ===== DELETE: Annuler une visite =====

@visites_bp.route("/<int:visite_id>", methods=["DELETE"])
@token_required
def annuler_visite(current_user, visite_id):
    """
    Annuler une visite existante.

    Authentification: JWT token requis

    Path Parameters:
    - visite_id: ID de la visite à annuler

    Output JSON (200):
    {
        "status": "success",
        "data": {
            "id": 1,
            "statut": "annulee",
            "message": "Visite annulée avec succès."
        }
    }

    Error Responses:
    - 400: Visite inexistante ou déjà annulée
    - 404: Visite non trouvée
    - 500: Erreur serveur
    """
    try:
        result = VisitesService.annuler_visite(visite_id)

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except VisitesError as e:
        error_msg = str(e)

        if "n'existe pas" in error_msg.lower():
            code = 404
        else:
            code = 400

        return jsonify({
            "status": "error",
            "error": error_msg
        }), code

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500


# ===== GET: Télécharger fichier .ics =====

@visites_bp.route("/<int:visite_id>/download.ics", methods=["GET"])
@token_required
def download_ics(current_user, visite_id):
    """
    Télécharger un fichier iCalendar (.ics) pour ajouter la visite au calendrier mobile.

    Authentification: ✅ Requise (JWT)
    Accès: Acheteur ou vendeur de la visite uniquement

    Path Parameters:
    - visite_id: ID de la visite

    Response (200):
    Fichier .ics (Content-Type: text/calendar)
    Filename: visite-{id}.ics

    Error Responses:
    - 403: Utilisateur n'a pas accès à cette visite
    - 404: Visite non trouvée
    - 500: Erreur lors de la génération du fichier
    """
    try:
        # Récupérer la visite
        visite = Visite.query.filter_by(id=visite_id).first()
        if not visite:
            return jsonify({
                "status": "error",
                "error": f"Visite #{visite_id} inexistante"
            }), 404

        # Vérifier les permissions: acheteur ou vendeur seulement
        utilisateur_id = current_user.get("utilisateur_id")
        role = current_user.get("role")

        # Récupérer l'annonce et l'acheteur pour vérifier accès
        annonce = Annonce.query.filter_by(annonce_id=visite.annonce_id).first()
        acheteur = Acheteur.query.filter_by(id=visite.acheteur_id).first()

        # Vérification: vendeur OU acheteur de cette visite
        is_vendeur = (annonce and annonce.utilisateur_id == utilisateur_id)
        is_acheteur = (acheteur and acheteur.utilisateur_id == utilisateur_id)

        if not (is_vendeur or is_acheteur):
            return jsonify({
                "status": "error",
                "error": "Vous n'avez pas accès à cette visite."
            }), 403

        # Générer le fichier .ics
        ics_content = VisitesService.generer_fichier_ics(visite_id)

        # Servir le fichier
        ics_file = BytesIO(ics_content)
        return send_file(
            ics_file,
            mimetype="text/calendar",
            as_attachment=True,
            download_name=f"visite-{visite_id}.ics"
        )

    except VisitesError as e:
        error_msg = str(e)
        code = 404 if "inexistante" in error_msg.lower() else 400

        return jsonify({
            "status": "error",
            "error": error_msg
        }), code

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur lors de la génération du fichier: {str(e)}"
        }), 500


# ===== GET: Info publique (sans auth) =====

@visites_bp.route("/info", methods=["GET"])
def info_visites():
    """
    Obtenir les informations publiques sur les visites.

    Sans authentification.

    Output JSON (200):
    {
        "status": "success",
        "data": {
            "min_score_matching": 5,
            "statuts_valides": ["confirmee", "annulee", "terminee"],
            "description": "..."
        }
    }
    """
    return jsonify({
        "status": "success",
        "data": {
            "min_score_matching": 5,
            "statuts_valides": ["confirmee", "annulee", "terminee"],
            "description": "Un acheteur peut réserver une visite si son score de matching est >= 5 pour cette annonce."
        }
    }), 200


# ===== PUT: Modifier une visite =====

@visites_bp.route("/<int:visite_id>", methods=["PUT"])
@token_required
def modifier_visite(current_user, visite_id):
    """
    Modifier une visite existante (date/heure et/ou statut).

    Authentification: JWT token requis

    Path Parameters:
    - visite_id: ID de la visite à modifier

    Input JSON (au moins un champ):
    {
        "date_heure": "2026-05-25T15:00:00",  // ISO 8601, optionnel
        "statut": "confirmee"  // "confirmee" ou "annulee", optionnel
    }

    Output JSON (200):
    {
        "status": "success",
        "data": {
            "id": 1,
            "date_heure": "2026-05-25T15:00:00",
            "statut": "confirmee",
            "message": "RDV modifié avec succès. Notifications envoyées."
        }
    }

    Error Responses:
    - 400: Erreur de validation, visite dans le passé, etc.
    - 403: Utilisateur non autorisé
    - 404: Visite non trouvée
    - 500: Erreur serveur
    """
    try:
        data = request.get_json() or {}

        # Au moins un champ doit être fourni
        if not data or (not data.get("date_heure") and not data.get("statut")):
            return jsonify({
                "status": "error",
                "error": "Veuillez fournir au moins 'date_heure' ou 'statut'."
            }), 400

        # Modifier la visite
        result = VisitesService.modifier_visite(
            visite_id=visite_id,
            utilisateur_id=current_user.get("utilisateur_id"),
            date_heure_str=data.get("date_heure"),
            statut=data.get("statut")
        )

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except VisitesError as e:
        error_msg = str(e)

        if "autorisé" in error_msg.lower():
            code = 403
        elif "existe" in error_msg.lower():
            code = 404
        else:
            code = 400

        return jsonify({
            "status": "error",
            "error": error_msg
        }), code

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500


# ===== POST: Soumettre un feedback =====

@visites_bp.route("/../feedbacks", methods=["POST"], endpoint="soumettre_feedback")
@token_required
def soumettre_feedback(current_user):
    """
    Soumettre un feedback pour une visite (acheteur uniquement).

    Authentification: JWT token requis

    Input JSON:
    {
        "visite_id": 1,
        "note": 4,
        "commentaire": "Belle visite, mais la cuisine est un peu petite."
    }

    Output JSON (201):
    {
        "status": "success",
        "data": {
            "id": 1,
            "visite_id": 1,
            "note": 4,
            "commentaire": "Belle visite, mais la cuisine est un peu petite.",
            "created_at": "2026-05-20T16:00:00",
            "message": "Feedback enregistré. Merci !"
        }
    }

    Error Responses:
    - 400: Visite n'a pas encore eu lieu, feedback déjà existant, etc.
    - 404: Visite non trouvée
    - 422: Données invalides
    - 500: Erreur serveur
    """
    try:
        from src.models.acheteurs import Acheteur

        # Récupérer l'acheteur_id de l'utilisateur connecté
        acheteur = Acheteur.query.filter_by(utilisateur_id=current_user.get("utilisateur_id")).first()
        if not acheteur:
            return jsonify({
                "status": "error",
                "error": "Vous devez être un acheteur pour laisser un feedback."
            }), 403

        # Valider les données
        data = request.get_json()
        from src.schemas.feedbacks import FeedbackInput
        feedback_input = FeedbackInput(**data)

        # Soumettre le feedback
        result = VisitesService.soumettre_feedback(
            acheteur_id=acheteur.id,
            visite_id=feedback_input.visite_id,
            note=feedback_input.note,
            commentaire=feedback_input.commentaire
        )

        return jsonify({
            "status": "success",
            "data": result
        }), 201

    except ValidationError as e:
        errors = []
        for error in e.errors():
            field = ".".join(str(x) for x in error["loc"])
            msg = error["msg"]
            errors.append(f"{field}: {msg}")

        return jsonify({
            "status": "error",
            "error": "Données invalides",
            "details": errors
        }), 422

    except VisitesError as e:
        error_msg = str(e)
        code = 404 if "existe" in error_msg.lower() else 400

        return jsonify({
            "status": "error",
            "error": error_msg
        }), code

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500


# ===== GET: Récupérer le feedback d'une visite =====

@visites_bp.route("/<int:visite_id>/feedback", methods=["GET"])
@token_required
def recuperer_feedback(current_user, visite_id):
    """
    Récupérer le feedback d'une visite.

    Authentification: JWT token requis (vendeur ou acheteur de la visite)

    Path Parameters:
    - visite_id: ID de la visite

    Output JSON (200):
    {
        "status": "success",
        "data": {
            "id": 1,
            "visite_id": 1,
            "acheteur_id": 2,
            "note": 4,
            "commentaire": "Belle visite, mais la cuisine est un peu petite.",
            "reponse_vendeur": "Merci pour votre retour...",
            "created_at": "2026-05-20T16:00:00"
        }
    }

    Error Responses:
    - 403: Utilisateur non autorisé
    - 404: Visite ou feedback non trouvé
    - 500: Erreur serveur
    """
    try:
        result = VisitesService.recuperer_feedback(
            visite_id=visite_id,
            utilisateur_id=current_user.get("utilisateur_id")
        )

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except VisitesError as e:
        error_msg = str(e)

        if "autorisé" in error_msg.lower():
            code = 403
        elif "existe" in error_msg.lower():
            code = 404
        else:
            code = 400

        return jsonify({
            "status": "error",
            "error": error_msg
        }), code

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500


# ===== GET: Dashboard vendeur - Tous les feedbacks =====

@visites_bp.route("/vendeur/feedbacks", methods=["GET"])
@token_required
def obtenir_feedbacks_vendeur(current_user):
    """
    Obtenir tous les feedbacks de toutes les annonces du vendeur avec statistiques.

    Authentification: JWT token requis (vendeur)

    Query Parameters (optionnels):
    - note_min: int (1-5) - Filtrer feedbacks avec note >= note_min
    - note_max: int (1-5) - Filtrer feedbacks avec note <= note_max
    - date_debut: str (ISO format) - Filtrer feedbacks créés >= date_debut
    - date_fin: str (ISO format) - Filtrer feedbacks créés <= date_fin

    Example: /api/v1/visites/vendeur/feedbacks?note_min=4&date_debut=2026-05-01

    Output JSON (200):
    {
        "status": "success",
        "data": {
            "vendeur_id": 1,
            "stats_globales": {
                "total_feedbacks": 10,
                "note_moyenne": 4.3,
                "note_min": 3,
                "note_max": 5,
                "total_annonces": 5,
                "annonces_avec_feedbacks": 3
            },
            "annonces": [
                {
                    "annonce_id": 1,
                    "titre": "Bel appartement",
                    "adresse": "123 Rue de Paris",
                    "code_postal": "75001",
                    "ville": "Paris",
                    "prix": 200000,
                    "stats": {
                        "feedbacks_count": 3,
                        "note_moyenne": 4.67,
                        "note_min": 4,
                        "note_max": 5
                    },
                    "feedbacks": [
                        {
                            "id": 1,
                            "visite_id": 1,
                            "acheteur_id": 1,
                            "note": 5,
                            "commentaire": "Très belle propriété!",
                            "reponse_vendeur": "Merci beaucoup!",
                            "created_at": "2026-05-20T12:00:00",
                            "updated_at": "2026-05-21T14:00:00"
                        }
                    ]
                }
            ]
        }
    }

    Output JSON (401): Unauthorized - Token manquant ou invalide
    Output JSON (403): Forbidden - Vous n'êtes pas vendeur
    Output JSON (400): Bad Request - Paramètres invalides
    """
    try:
        # Vérifier que c'est un vendeur
        if current_user.get("role") != "vendeur":
            return jsonify({
                "status": "error",
                "error": "Seuls les vendeurs peuvent voir le dashboard des feedbacks"
            }), 403

        # Récupérer les paramètres de filtrage
        note_min = request.args.get("note_min", type=int)
        note_max = request.args.get("note_max", type=int)
        date_debut = request.args.get("date_debut", type=str)
        date_fin = request.args.get("date_fin", type=str)

        # Valider les paramètres
        if note_min is not None and (note_min < 1 or note_min > 5):
            return jsonify({
                "status": "error",
                "error": "note_min doit être entre 1 et 5"
            }), 400

        if note_max is not None and (note_max < 1 or note_max > 5):
            return jsonify({
                "status": "error",
                "error": "note_max doit être entre 1 et 5"
            }), 400

        # Appeler le service
        result = VisitesService.lister_feedbacks_vendeur(
            utilisateur_id=current_user["user_id"],
            note_min=note_min,
            note_max=note_max,
            date_debut=date_debut,
            date_fin=date_fin
        )

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except VisitesError as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 400

    except ValueError as e:
        return jsonify({
            "status": "error",
            "error": f"Paramètre invalide: {str(e)}"
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500


# ===== PUT: Ajouter une réponse du vendeur au feedback =====

feedbacks_bp = Blueprint("feedbacks", __name__, url_prefix="/api/v1/feedbacks")


@feedbacks_bp.route("/<int:feedback_id>/reponse", methods=["PUT"])
@token_required
def ajouter_reponse_vendeur(current_user, feedback_id):
    """
    Ajouter ou modifier la réponse du vendeur à un feedback.

    Authentification: JWT token requis (vendeur de l'annonce)

    Path Parameters:
    - feedback_id: ID du feedback

    Input JSON:
    {
        "reponse_vendeur": "Merci pour votre retour. Nous sommes heureux que vous ayez apprécié la visite..."
    }

    Output JSON (200):
    {
        "status": "success",
        "data": {
            "id": 1,
            "visite_id": 1,
            "acheteur_id": 2,
            "note": 4,
            "commentaire": "Belle visite...",
            "reponse_vendeur": "Merci pour votre retour...",
            "created_at": "2026-05-20T16:00:00"
        }
    }

    Error Responses:
    - 400: Données invalides
    - 403: Utilisateur non autorisé (seul le vendeur)
    - 404: Feedback non trouvé
    - 422: Validation Pydantic
    - 500: Erreur serveur
    """
    try:
        data = request.get_json()
        from src.schemas.feedbacks import FeedbackReponseInput
        reponse_input = FeedbackReponseInput(**data)

        result = VisitesService.ajouter_reponse_vendeur(
            feedback_id=feedback_id,
            utilisateur_id=current_user.get("utilisateur_id"),
            reponse_vendeur=reponse_input.reponse_vendeur
        )

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except ValidationError as e:
        errors = []
        for error in e.errors():
            field = ".".join(str(x) for x in error["loc"])
            msg = error["msg"]
            errors.append(f"{field}: {msg}")

        return jsonify({
            "status": "error",
            "error": "Données invalides",
            "details": errors
        }), 422

    except VisitesError as e:
        error_msg = str(e)

        if "autorisé" in error_msg.lower():
            code = 403
        elif "existe" in error_msg.lower():
            code = 404
        else:
            code = 400

        return jsonify({
            "status": "error",
            "error": error_msg
        }), code

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": f"Erreur serveur: {str(e)}"
        }), 500
