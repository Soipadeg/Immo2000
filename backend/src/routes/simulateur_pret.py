"""
Routes Flask pour le simulateur de prêt immobilier.

Endpoint principal:
- POST /api/v1/simulateur-pret  → Simulation de capacité d'emprunt et mensualités

Pour Gilbert: Ce endpoint permet à un acheteur d'estimer:
- Combien il peut emprunter max (capacité d'emprunt)
- Quelle sera sa mensualité
- Quel sera le coût total du crédit
- Détail mois par mois (tableau d'amortissement)
"""

from flask import Blueprint, request, jsonify
from pydantic import BaseModel, Field, validator
from src.services.simulateur_pret import CalculatricePret, SimulateurPretError
from src.auth.decorators import token_required

# Blueprint
simulateur_bp = Blueprint("simulateur", __name__, url_prefix="/api/v1/simulateur-pret")


# ===== SCHÉMAS PYDANTIC =====

class SimulateurInput(BaseModel):
    """Paramètres d'entrée pour la simulation."""

    revenu_mensuel_net: float = Field(..., gt=0, description="Revenu mensuel net en euros")
    apport: float = Field(default=0, ge=0, description="Apport personnel en euros")
    taux_interet: float = Field(default=3.5, ge=0, le=15, description="Taux d'intérêt annuel en %")
    duree_ans: int = Field(default=20, ge=1, le=30, description="Durée du prêt en années")
    taux_assurance: float = Field(default=0.3, ge=0, description="Taux d'assurance annuel en %")

    class Config:
        json_schema_extra = {
            "example": {
                "revenu_mensuel_net": 3000,
                "apport": 50000,
                "taux_interet": 3.5,
                "duree_ans": 20,
                "taux_assurance": 0.3,
            }
        }


class TableauAmortissementLigne(BaseModel):
    """Une ligne du tableau d'amortissement."""

    mois: int
    capital_restant: float
    interets: float
    assurance: float
    mensualite: float


class SimulateurOutput(BaseModel):
    """Résultat de la simulation."""

    capacite_emprunt: float = Field(description="Montant max empruntable en euros")
    mensualite: float = Field(description="Mensualité en euros")
    cout_total_credit: float = Field(description="Coût total du crédit en euros")
    tableau_amortissement: list[TableauAmortissementLigne] = Field(
        description="12 premières lignes du tableau d'amortissement"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "capacite_emprunt": 181047.06,
                "mensualite": 1095.26,
                "cout_total_credit": 262862.82,
                "tableau_amortissement": [
                    {
                        "mois": 1,
                        "capital_restant": 180525.11,
                        "interets": 528.05,
                        "assurance": 45.26,
                        "mensualite": 1095.26,
                    },
                    {
                        "mois": 2,
                        "capital_restant": 180001.64,
                        "interets": 526.53,
                        "assurance": 45.26,
                        "mensualite": 1095.26,
                    },
                ],
            }
        }


# ===== ENDPOINT =====

@simulateur_bp.route("", methods=["POST"])
@token_required
def simuler_pret(current_user):
    """
    POST /api/v1/simulateur-pret
    Simule un prêt immobilier et retourne la capacité d'emprunt, mensualité et tableau d'amortissement.

    Request body:
    {
        "revenu_mensuel_net": 3000,  (obligatoire)
        "apport": 50000,              (optionnel, défaut: 0)
        "taux_interet": 3.5,          (optionnel, défaut: 3.5%)
        "duree_ans": 20,              (optionnel, défaut: 20 ans)
        "taux_assurance": 0.3         (optionnel, défaut: 0.3%)
    }

    Response (200 OK):
    {
        "capacite_emprunt": 181047.06,
        "mensualite": 1095.26,
        "cout_total_credit": 262862.82,
        "tableau_amortissement": [...]
    }

    Erreurs possibles:
    - 400: Bad Request (données invalides)
    - 401: Unauthorized (pas authentifié)
    - 422: Unprocessable Entity (validation Pydantic)
    - 500: Internal Server Error
    """

    try:
        # 1️⃣ Récupérer et valider l'input avec Pydantic
        data = request.get_json()

        if not data:
            return jsonify(
                {
                    "status": "error",
                    "message": "Body JSON requis",
                    "code": "EMPTY_BODY",
                }
            ), 400

        # Valider avec Pydantic
        try:
            input_data = SimulateurInput(**data)
        except ValueError as e:
            return jsonify(
                {
                    "status": "error",
                    "message": f"Validation échouée: {str(e)}",
                    "code": "VALIDATION_ERROR",
                }
            ), 422

        # 2️⃣ Calculer le prêt
        result = CalculatricePret.calculer_pret(
            revenu_mensuel_net=input_data.revenu_mensuel_net,
            apport=input_data.apport,
            taux_interet=input_data.taux_interet,
            duree_ans=input_data.duree_ans,
            taux_assurance=input_data.taux_assurance,
        )

        # 3️⃣ Convertir le tableau d'amortissement en objets Pydantic
        tableau_amortissement = [
            TableauAmortissementLigne(**ligne)
            for ligne in result["tableau_amortissement"]
        ]

        # 4️⃣ Créer la réponse
        output = SimulateurOutput(
            capacite_emprunt=result["capacite_emprunt"],
            mensualite=result["mensualite"],
            cout_total_credit=result["cout_total_credit"],
            tableau_amortissement=tableau_amortissement,
        )

        return jsonify(
            {
                "status": "success",
                "data": output.dict(),
                "message": "Simulation effectuée avec succès",
            }
        ), 200

    except SimulateurPretError as e:
        # Erreur métier (revenu négatif, durée invalide, etc.)
        return jsonify(
            {
                "status": "error",
                "message": str(e),
                "code": "INVALID_PARAMETERS",
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


@simulateur_bp.route("/info", methods=["GET"])
def get_info():
    """
    GET /api/v1/simulateur-pret/info
    Retourne les paramètres par défaut et les contraintes.

    Response:
    {
        "defauts": {
            "taux_interet": 3.5,
            "duree_ans": 20,
            "taux_assurance": 0.3
        },
        "limites": {
            "taux_interet": {"min": 0, "max": 15},
            "duree_ans": {"min": 1, "max": 30},
            "taux_assurance": {"min": 0},
            "revenu_mensuel_net": {"min": 1}
        }
    }
    """
    return jsonify(
        {
            "status": "success",
            "defauts": {
                "taux_interet": CalculatricePret.TAUX_INTERET_DEFAUT,
                "duree_ans": CalculatricePret.DUREE_ANS_DEFAUT,
                "taux_assurance": CalculatricePret.TAUX_ASSURANCE_DEFAUT,
            },
            "limites": {
                "taux_interet": {
                    "min": 0,
                    "max": CalculatricePret.TAUX_USURE_MAX,
                },
                "duree_ans": {"min": 1, "max": 30},
                "taux_assurance": {"min": 0},
                "revenu_mensuel_net": {"min": 1},
                "apport": {"min": 0},
            },
            "ratio_capacite": CalculatricePret.RATIO_CAPACITE,
            "message": "Utilise ces valeurs pour valider les inputs côté frontend",
        }
    ), 200
