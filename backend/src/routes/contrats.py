"""
Routes Flask pour les contrats d'exclusivité.

Endpoints :
- POST   /api/v1/contrats/exclusivite  → Signer le contrat d'exclusivité (JWT required)
"""

from flask import Blueprint, request, jsonify
from src.auth.models import db
from src.auth.decorators import token_required

# Blueprint
contrats_bp = Blueprint("contrats", __name__, url_prefix="/api/v1/contrats")


@contrats_bp.route("/exclusivite", methods=["POST"])
@token_required
def sign_contrat_exclusivite(current_user):
    """
    Signe le contrat d'exclusivité (étape 3 du tunnel).

    Accessibilité: JWT required (utilisateur authentifié)

    Accepts:
        - accepte (bool): L'utilisateur accepte le contrat [REQUIRED]

    Returns:
        200: {
            "message": "Contrat d'exclusivité signé avec succès",
            "has_exclusivity_contract": true
        }
        400: Si l'utilisateur n'accepte pas le contrat
    """
    try:
        data = request.get_json()
        accepte = data.get("accepte", False)

        if not accepte:
            return jsonify({
                "error": "Vous devez accepter les conditions du contrat pour signer"
            }), 400

        # Importer le modèle User ici pour éviter les imports circulaires
        from src.auth.models import User

        # Récupérer l'utilisateur
        user = User.query.filter_by(utilisateur_id=current_user["user_id"]).first()

        if not user:
            return jsonify({"error": "Utilisateur introuvable"}), 404

        # Marquer comme ayant signé le contrat
        user.has_exclusivity_contract = True
        db.session.commit()

        return jsonify({
            "message": "Contrat d'exclusivité signé avec succès ! Les outils IA seront bientôt disponibles.",
            "has_exclusivity_contract": True
        }), 200

    except ValueError as e:
        db.session.rollback()
        print(f"[ERROR] sign_contrat_exclusivite (validation): {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] sign_contrat_exclusivite: {e}")
        return jsonify({"error": str(e)}), 500
