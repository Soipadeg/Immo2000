"""
Configuration OpenAPI/Swagger pour la documentation des API

OpenAPI setup:
1. Flasgger est utilisé pour auto-générer la documentation
2. La documentation est accessible sur /apidocs (Swagger UI)
3. Le fichier OpenAPI JSON est disponible sur /apispec

Pour ajouter de la documentation à vos endpoints:
    @app.route('/api/v1/annonces', methods=['GET'])
    def list_annonces():
        '''
        List all real estate listings
        ---
        tags:
          - Annonces
        parameters:
          - name: page
            in: query
            type: integer
            required: false
            description: Page number
        responses:
          200:
            description: List of annonces
            schema:
              type: array
              items:
                $ref: '#/definitions/Annonce'
        '''
        pass

Voir aussi:
- https://github.com/flasgger/flasgger
- https://swagger.io/
"""

from flasgger import Swagger
import os


def init_openapi(app):
    """
    Initialiser Swagger/OpenAPI pour documenter les APIs

    Args:
        app: Application Flask

    Returns:
        Swagger: Instance Swagger
    """

    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec',
                "route": '/apispec.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/apidocs"
    }

    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "Immo2000 API",
            "version": "1.0.0",
            "description": """
            ### Real Estate Platform API

            Complete REST API for Immo2000 platform with the following features:

            **Core Features:**
            - Annonces Management (Create, Read, Update, Delete listings)
            - Authentication & Authorization (JWT, OAuth2)
            - Matching System (Recommend properties to users)
            - Notifications (Real-time updates)

            **Advanced Features:**
            - Parcours de Vente (Sales Process Management)
            - Loan Simulator (Credit estimation)
            - Video Visits (Virtual property visits)
            - Chatbot (AI-powered customer support)

            **Security (Phase 6G):**
            - 2FA/TOTP (Two-factor authentication)
            - RGPD Compliance (Data export, deletion, privacy)
            - Audit Trails (Complete action logging)
            - Identity Verification (Yousign/Veriff integration)

            **Contact & Support:**
            - Email: support@immo2000.fr
            - Website: https://immo2000.fr
            - Documentation: https://docs.immo2000.fr
            """,
            "contact": {
                "name": "Immo2000 Support",
                "email": "support@immo2000.fr"
            }
        },
        "basePath": "/api",
        "schemes": ["https", "http"],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            }
        }
    }

    swagger = Swagger(
        app,
        config=swagger_config,
        template=swagger_template
    )

    return swagger


def register_model_definition(app, model_name: str, schema: dict):
    """
    Enregistrer une définition de modèle OpenAPI

    Args:
        app: Application Flask
        model_name: Nom du modèle
        schema: Schéma JSON Schema

    Exemple:
        register_model_definition(app, 'Annonce', {
            'type': 'object',
            'properties': {
                'id': {'type': 'integer'},
                'titre': {'type': 'string'},
                'prix': {'type': 'number'}
            },
            'required': ['id', 'titre', 'prix']
        })
    """
    # Flasgger utilise le système de docstrings pour les définitions
    # Ajouter les définitions directement dans les docstrings des routes
    pass


# === Common API Response Schemas ===

RESPONSE_SCHEMAS = {
    "Annonce": {
        "type": "object",
        "properties": {
            "id": {"type": "integer", "description": "Annonce ID"},
            "titre": {"type": "string", "description": "Property title"},
            "description": {"type": "string", "description": "Detailed description"},
            "prix": {"type": "number", "description": "Price in EUR"},
            "surface": {"type": "number", "description": "Surface in m2"},
            "adresse": {"type": "string", "description": "Full address"},
            "type_bien": {"type": "string", "enum": ["Appartement", "Maison", "Local", "Terrain"]},
            "nb_pieces": {"type": "integer"},
            "date_creation": {"type": "string", "format": "date-time"},
            "utilisateur_id": {"type": "integer"}
        },
        "required": ["titre", "prix", "adresse", "type_bien"]
    },

    "User": {
        "type": "object",
        "properties": {
            "id": {"type": "integer"},
            "email": {"type": "string", "format": "email"},
            "nom": {"type": "string"},
            "prenom": {"type": "string"},
            "role": {"type": "string", "enum": ["vendeur", "acheteur", "notaire", "admin"]},
            "date_creation": {"type": "string", "format": "date-time"},
            "is_verified": {"type": "boolean"},
            "is_active": {"type": "boolean"}
        },
        "required": ["email", "role"]
    },

    "Error": {
        "type": "object",
        "properties": {
            "error": {"type": "string", "description": "Error message"},
            "status": {"type": "integer", "description": "HTTP status code"},
            "timestamp": {"type": "string", "format": "date-time"},
            "path": {"type": "string", "description": "Request path"},
            "details": {"type": "object", "description": "Additional error details"}
        },
        "required": ["error", "status"]
    }
}


def get_common_responses():
    """
    Obtenir les réponses communes pour les endpoints

    Returns:
        dict: Réponses communes (401, 403, 404, 500)
    """
    return {
        "400": {
            "description": "Bad Request - Invalid input",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "401": {
            "description": "Unauthorized - Missing or invalid token",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "403": {
            "description": "Forbidden - Insufficient permissions",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "404": {
            "description": "Not Found - Resource not found",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "500": {
            "description": "Internal Server Error",
            "schema": {"$ref": "#/definitions/Error"}
        }
    }
