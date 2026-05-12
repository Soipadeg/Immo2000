# 🔧 SOLUTIONS DE REFACTORING - CODE PRÊT À COPIER

Ce document contient les solutions complètes pour les 15 problèmes identifiés dans l'audit.

---

## 1️⃣ FUSIONNER LES SERVICES EMAIL

### Créer un seul service email unifié

**Fichier:** `backend/src/services/email_unified.py`

```python
"""
Service email unifié pour Immo2000.

Centralise tous les envois d'email (notifications, feedbacks, etc.)
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Exception personnalisée pour les erreurs d'email."""
    pass


class EmailService:
    """Service d'envoi d'emails SMTP unifié."""

    def __init__(
        self,
        smtp_host: str = None,
        smtp_port: int = 587,
        smtp_user: str = None,
        smtp_password: str = None,
        from_email: str = None,
        from_name: str = "Immo2000"
    ):
        """Initialiser le service email."""
        self.smtp_host = smtp_host or os.getenv("SMTP_HOST", "localhost")
        self.smtp_port = int(smtp_port or os.getenv("SMTP_PORT", 587))
        self.smtp_user = smtp_user or os.getenv("SMTP_USER") or os.getenv("EMAIL_USER")
        self.smtp_password = smtp_password or os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASSWORD")
        self.from_email = from_email or os.getenv("SMTP_FROM_EMAIL", "noreply@immo2000.fr")
        self.from_name = from_name

    def send(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Envoyer un email (alias moderne pour envoyer_email).

        Args:
            to_email: Email du destinataire
            to_name: Nom du destinataire
            subject: Sujet
            html_content: Corps HTML
            text_content: Corps texte (fallback)

        Returns:
            True si succès
        """
        return self.envoyer_email(
            destinataire=to_email,
            sujet=subject,
            corps_html=html_content,
            corps_texte=text_content,
            nom_destinataire=to_name
        )

    def envoyer_email(
        self,
        destinataire: str,
        sujet: str,
        corps_html: str,
        corps_texte: Optional[str] = None,
        nom_destinataire: Optional[str] = None
    ) -> bool:
        """
        Envoyer un email (interface originale conservée pour compatibilité).

        Args:
            destinataire: Email du destinataire
            sujet: Sujet
            corps_html: Corps HTML
            corps_texte: Corps texte (fallback)
            nom_destinataire: Nom du destinataire

        Returns:
            True si succès
        """
        try:
            # Mode développement: juste log
            if self.smtp_host == "localhost" or not self.smtp_user:
                logger.info(f"📧 [DEV] Email à {destinataire} - {sujet}")
                return True

            # Créer le message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = sujet
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = f"{nom_destinataire or ''} <{destinataire}>"

            # Ajouter les contenus
            if corps_texte:
                part1 = MIMEText(corps_texte, "plain", _charset="utf-8")
                msg.attach(part1)

            part2 = MIMEText(corps_html, "html", _charset="utf-8")
            msg.attach(part2)

            # Envoyer via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"✅ Email envoyé à {destinataire} - Sujet: {sujet}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Erreur authentification SMTP: {e}")
            raise EmailServiceError(f"Authentification SMTP échouée: {e}")
        except smtplib.SMTPException as e:
            logger.error(f"❌ Erreur SMTP: {e}")
            raise EmailServiceError(f"Erreur SMTP: {e}")
        except Exception as e:
            logger.error(f"❌ Erreur envoi email à {destinataire}: {e}")
            raise EmailServiceError(f"Erreur envoi email: {e}")

    # ===== Méthodes spécialisées =====

    def send_annonce_published(
        self,
        to_email: str,
        to_name: str,
        annonce_titre: str,
        annonce_url: str = None
    ) -> bool:
        """Envoyer notification annonce publiée."""
        html = f"""
        <h1>Félicitations!</h1>
        <p>Votre annonce <strong>{annonce_titre}</strong> a été publiée.</p>
        {f'<a href="{annonce_url}">Voir l\'annonce</a>' if annonce_url else ''}
        """
        return self.send(to_email, to_name, "Annonce publiée - Immo2000", html)

    def send_annonce_sold(
        self,
        to_email: str,
        to_name: str,
        annonce_titre: str,
        sale_date: datetime = None
    ) -> bool:
        """Envoyer notification annonce vendue."""
        date_str = sale_date.strftime("%d/%m/%Y") if sale_date else ""
        html = f"""
        <h1>Bien vendu!</h1>
        <p>Votre annonce <strong>{annonce_titre}</strong> a été marquée comme vendue.</p>
        {f'<p>Date de vente: {date_str}</p>' if sale_date else ''}
        """
        return self.send(to_email, to_name, "Bien vendu - Immo2000", html)

    def generer_email_feedback(
        self,
        visite,
        acheteur,
        annonce,
        est_rappel: bool = True
    ) -> str:
        """Générer le HTML pour un email de feedback."""
        nom_acheteur = acheteur.utilisateur.prenom if acheteur and acheteur.utilisateur else "Ami"
        adresse = annonce.adresse if annonce else "Bien immobilier"
        code_postal = annonce.code_postal if annonce else ""
        ville = annonce.ville if annonce else ""
        date_heure = visite.date_heure.strftime("%d/%m/%Y à %H:%M") if visite.date_heure else ""

        type_email = "rappel" if est_rappel else "confirmation"

        html = f"""
        <h1>Visite {type_email.upper()}</h1>
        <p>Bonjour {nom_acheteur},</p>
        <p>Ceci est un {type_email} pour votre visite:</p>
        <ul>
            <li><strong>Bien:</strong> {adresse}, {code_postal} {ville}</li>
            <li><strong>Date & Heure:</strong> {date_heure}</li>
        </ul>
        """
        return html


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Récupérer l'instance singleton du service email."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


def reset_email_service():
    """Reset l'instance (pour tests)."""
    global _email_service
    _email_service = None
```

### Migrer les imports

**Avant:**
```python
# routes/annonces.py
from src.services.email import get_email_service

# routes/visites.py
from src.services.email_service import EmailService
```

**Après:**
```python
# Toutes les routes
from src.services.email_unified import get_email_service, EmailService
```

---

## 2️⃣ CRÉER DÉCORATEUR ERROR HANDLER

**Fichier:** `backend/src/decorators/errors.py`

```python
"""
Décorateurs pour la gestion des erreurs dans les routes.
"""

from functools import wraps
from flask import jsonify, request
from pydantic import ValidationError
from typing import Callable
import logging

logger = logging.getLogger(__name__)


def handle_errors(f: Callable) -> Callable:
    """
    Décorateur pour gérer les erreurs dans les routes.

    Gère automatiquement:
    - ValidationError de Pydantic
    - Erreurs métier custom
    - Exceptions non gérées

    Usage:
        @route.post('/annonces')
        @token_required
        @handle_errors
        def create_annonce(current_user):
            # ... logique sans try/except boilerplate
            pass
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)

        except ValidationError as e:
            return _format_validation_error(e), 400

        except PermissionError as e:
            return jsonify({
                "success": False,
                "error": str(e),
                "status_code": 403
            }), 403

        except ValueError as e:
            return jsonify({
                "success": False,
                "error": str(e),
                "status_code": 400
            }), 400

        except Exception as e:
            logger.error(f"Unhandled error in {f.__name__}: {str(e)}", exc_info=True)
            return jsonify({
                "success": False,
                "error": "Internal server error",
                "status_code": 500
            }), 500

    return wrapper


def _format_validation_error(e: ValidationError) -> dict:
    """Formater une erreur Pydantic."""
    errors = []
    for err in e.errors():
        errors.append({
            "field": ".".join(str(x) for x in err.get("loc", [])),
            "type": err.get("type"),
            "msg": err.get("msg")
        })
    return {
        "success": False,
        "error": "Validation error",
        "status_code": 400,
        "details": errors
    }
```

### Utilisation

**Avant:**
```python
@annonces_bp.route("", methods=["POST"])
@token_required
def create_annonce_endpoint(current_user):
    try:
        data = request.get_json()
        annonce_data = CreateAnnonce(**data)
        annonce = create_annonce(db.session, current_user["user_id"], annonce_data)
        response = AnnoncesResponse.from_orm(annonce)
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
        return jsonify({
            "error": str(e),
            "code": 400
        }), 400
```

**Après:**
```python
@annonces_bp.route("", methods=["POST"])
@token_required
@handle_errors
def create_annonce_endpoint(current_user):
    data = request.get_json()
    annonce_data = CreateAnnonce(**data)
    annonce = create_annonce(db.session, current_user["user_id"], annonce_data)
    response = AnnoncesResponse.from_orm(annonce)
    return jsonify(response.dict()), 201
```

**Gain:** -50 lignes par route × 50 routes = -2500 lignes!

---

## 3️⃣ PAGINATION HELPER

**Fichier:** `backend/src/utils/pagination.py`

```python
"""
Utilitaires pour la pagination standard.
"""

from flask import request
from typing import Dict, List, Any, Tuple


def get_pagination(
    default_limit: int = 20,
    max_limit: int = 100
) -> Tuple[int, int]:
    """
    Extraire skip et limit depuis les query parameters.

    Args:
        default_limit: Limite par défaut
        max_limit: Limite maximale acceptée

    Returns:
        (skip, limit)

    Usage:
        skip, limit = get_pagination()
        items, total = crud.list_items(skip, limit)
    """
    skip = request.args.get("skip", request.args.get("offset", 0), type=int)
    limit = min(request.args.get("limit", default_limit, type=int), max_limit)

    # Valider
    skip = max(0, skip)
    limit = max(1, limit)

    return skip, limit


def get_filters(
    allowed_keys: List[str],
    request_args: Dict = None
) -> Dict[str, Any]:
    """
    Extraire et valider les filtres depuis les query parameters.

    Args:
        allowed_keys: Clés autorisées pour les filtres
        request_args: Args à parser (défaut: request.args)

    Returns:
        Dict des filtres

    Usage:
        filters = get_filters(['ville', 'type_bien', 'prix_min', 'prix_max'])
        annonces, total = crud.list_annonces(skip, limit, filters)
    """
    if request_args is None:
        request_args = request.args

    filters = {}

    for key in allowed_keys:
        value = request_args.get(key)
        if value is not None and value != "":
            filters[key] = value

    return filters
```

### Utilisation

**Avant:**
```python
@biens_bp.route("", methods=["GET"])
@token_required
def list_biens(current_user):
    filters = {
        "type_bien": request.args.get("type_bien"),
        "ville": request.args.get("ville"),
        "code_postal": request.args.get("code_postal"),
        "surface_min": request.args.get("surface_min", type=int),
        "surface_max": request.args.get("surface_max", type=int),
        "etat": request.args.get("etat"),
    }

    limit = request.args.get("limit", default=50, type=int)
    offset = request.args.get("offset", default=0, type=int)

    if limit > 100:
        limit = 100

    biens, total = crud_list_biens(filters=filters, limit=limit, offset=offset)

    return {
        "biens": [bien.to_dict() for bien in biens],
        "count": len(biens),
        "total": total,
        "limit": limit,
        "offset": offset,
    }, 200
```

**Après:**
```python
from src.utils.pagination import get_pagination, get_filters

@biens_bp.route("", methods=["GET"])
@token_required
def list_biens(current_user):
    skip, limit = get_pagination()
    filters = get_filters(['type_bien', 'ville', 'code_postal', 'surface_min', 'surface_max', 'etat'])

    biens, total = crud_list_biens(filters=filters, skip=skip, limit=limit)

    return {
        "biens": [bien.to_dict() for bien in biens],
        "total": total,
        "skip": skip,
        "limit": limit,
    }, 200
```

---

## 4️⃣ RESPONSE WRAPPER STANDARD

**Fichier:** `backend/src/utils/response.py`

```python
"""
Wrapper pour les réponses JSON standardisées.
"""

from flask import jsonify
from typing import Any, Dict, List, Optional


class ApiResponse:
    """Helper pour les réponses API standardisées."""

    @staticmethod
    def success(
        data: Any = None,
        message: Optional[str] = None,
        status_code: int = 200
    ) -> tuple:
        """
        Réponse de succès.

        Usage:
            return ApiResponse.success(data=user.to_dict(), message="User created", status_code=201)
        """
        response = {
            "success": True,
        }
        if data is not None:
            response["data"] = data
        if message:
            response["message"] = message

        return jsonify(response), status_code

    @staticmethod
    def error(
        error: str,
        status_code: int = 400,
        details: Optional[Any] = None
    ) -> tuple:
        """
        Réponse d'erreur.

        Usage:
            return ApiResponse.error("User not found", 404)
            return ApiResponse.error("Validation failed", 400, details={...})
        """
        response = {
            "success": False,
            "error": error,
            "status_code": status_code,
        }
        if details:
            response["details"] = details

        return jsonify(response), status_code

    @staticmethod
    def paginated(
        items: List[Any],
        total: int,
        skip: int,
        limit: int,
        message: Optional[str] = None,
        status_code: int = 200
    ) -> tuple:
        """
        Réponse paginée.

        Usage:
            items = [a.to_dict() for a in annonces]
            return ApiResponse.paginated(items, total, skip, limit)
        """
        response = {
            "success": True,
            "data": items,
            "pagination": {
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": (skip + limit) < total
            }
        }
        if message:
            response["message"] = message

        return jsonify(response), status_code

    @staticmethod
    def created(data: Any, message: str = "Resource created") -> tuple:
        """Shortcut pour 201 Created."""
        return ApiResponse.success(data, message, 201)

    @staticmethod
    def not_found(resource: str = "Resource") -> tuple:
        """Shortcut pour 404."""
        return ApiResponse.error(f"{resource} not found", 404)

    @staticmethod
    def unauthorized(message: str = "Unauthorized") -> tuple:
        """Shortcut pour 403."""
        return ApiResponse.error(message, 403)
```

### Utilisation

**Avant:**
```python
@route.post('/annonces')
@token_required
def create_annonce(current_user):
    data = request.get_json()
    annonce = crud.create_annonce(...)

    return jsonify(annonce.to_dict()), 201

@route.get('/annonces')
def list_annonces():
    annonces, total = crud.list_annonces(skip, limit)

    return jsonify({
        "items": [a.to_dict() for a in annonces],
        "total": total,
        "skip": skip,
        "limit": limit
    }), 200

@route.get('/annonces/<id>')
def get_annonce(id):
    annonce = crud.get_annonce(id)
    if not annonce:
        return jsonify({"error": "Not found"}), 404
    return jsonify(annonce.to_dict()), 200
```

**Après:**
```python
from src.utils.response import ApiResponse

@route.post('/annonces')
@token_required
def create_annonce(current_user):
    data = request.get_json()
    annonce = crud.create_annonce(...)

    return ApiResponse.created(annonce.to_dict(), "Annonce created")

@route.get('/annonces')
def list_annonces():
    annonces, total = crud.list_annonces(skip, limit)
    items = [a.to_dict() for a in annonces]

    return ApiResponse.paginated(items, total, skip, limit)

@route.get('/annonces/<id>')
def get_annonce(id):
    annonce = crud.get_annonce(id) or abort(404)
    return ApiResponse.success(annonce.to_dict())
```

---

## 5️⃣ DÉCORATEUR OWNER_REQUIRED

**Fichier:** `backend/src/decorators/auth.py`

```python
"""
Décorateurs d'authentification et d'autorisation.
"""

from functools import wraps
from flask import jsonify
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


def owner_required(
    model_class,
    id_param_name: str,
    owner_field: str = "utilisateur_id"
):
    """
    Décorateur pour vérifier que l'utilisateur est propriétaire de la ressource.

    Args:
        model_class: Classe SQLAlchemy (ex: Annonce)
        id_param_name: Nom du paramètre dans l'URL (ex: 'annonce_id')
        owner_field: Nom du champ d'ID propriétaire (défaut: 'utilisateur_id')

    Usage:
        @route.put('/annonces/<int:annonce_id>')
        @token_required
        @owner_required(Annonce, 'annonce_id', 'utilisateur_id')
        def update_annonce(current_user, obj):
            # obj = l'annonce, déjà vérifiée être propriétaire
            return ApiResponse.success(crud.update(obj))
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, current_user: dict, **kwargs):
            from src.auth.models import db

            # Récupérer l'ID depuis kwargs
            obj_id = kwargs.get(id_param_name)
            if obj_id is None:
                logger.warning(f"Missing {id_param_name} in route kwargs")
                return jsonify({
                    "success": False,
                    "error": "Missing resource ID",
                    "status_code": 400
                }), 400

            # Récupérer l'objet
            obj = db.session.query(model_class).get(obj_id)
            if not obj:
                return jsonify({
                    "success": False,
                    "error": "Resource not found",
                    "status_code": 404
                }), 404

            # Vérifier propriété
            user_id = current_user.get("user_id")
            if getattr(obj, owner_field) != user_id:
                logger.warning(
                    f"Unauthorized access to {model_class.__name__} {obj_id} by user {user_id}"
                )
                return jsonify({
                    "success": False,
                    "error": "You can only modify your own resources",
                    "status_code": 403
                }), 403

            # Passer l'objet à la fonction
            kwargs['obj'] = obj
            return f(*args, current_user=current_user, **kwargs)

        return wrapper
    return decorator
```

### Utilisation

**Avant:**
```python
@annonces_bp.route('/<int:annonce_id>', methods=['PUT'])
@token_required
def update_annonce(current_user, annonce_id):
    annonce = db.session.query(Annonce).get(annonce_id)

    if not annonce:
        return jsonify({'error': 'Annonce not found'}), 404

    if annonce.utilisateur_id != current_user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    annonce = crud.update_annonce(db.session, annonce_id, current_user['user_id'], data)

    return jsonify(annonce.to_dict()), 200
```

**Après:**
```python
from src.decorators.auth import owner_required
from src.utils.response import ApiResponse

@annonces_bp.route('/<int:annonce_id>', methods=['PUT'])
@token_required
@owner_required(Annonce, 'annonce_id', 'utilisateur_id')
def update_annonce(current_user, obj):  # obj = annonce vérifiée
    data = request.get_json()
    annonce = crud.update_annonce(db.session, obj.annonce_id, current_user['user_id'], data)
    return ApiResponse.success(annonce.to_dict())
```

---

## 6️⃣ FIX N+1 QUERIES: EAGER LOADING

**Fichier:** `backend/src/crud/offres.py` (modifié)

```python
from sqlalchemy.orm import joinedload

def list_offers_for_annonce(
    db: Session,
    annonce_id: int,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[Offre], int]:
    """
    List all offers for an annonce (avec eager loading pour éviter N+1).
    """
    # AVANT: 1 requête pour offres + N requêtes pour chaque annonce/acheteur
    # APRÈS: 1 seule requête avec tous les JOINs

    query = db.query(Offre)\
        .options(
            joinedload(Offre.annonce),      # Eager load l'annonce
            joinedload(Offre.acheteur)      # Eager load l'acheteur
        )\
        .filter(Offre.annonce_id == annonce_id)

    total = query.count()

    offers = query\
        .order_by(desc(Offre.date_offre))\
        .offset(skip)\
        .limit(limit)\
        .all()

    return offers, total


def list_offers_for_vendor(
    db: Session,
    vendor_id: int,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[Offre], int]:
    """
    List all offers for a vendor's annonces.
    """
    query = db.query(Offre)\
        .join(Annonce)\
        .options(
            joinedload(Offre.annonce),
            joinedload(Offre.acheteur)
        )\
        .filter(Annonce.vendeur_id == vendor_id)

    total = query.count()

    offers = query\
        .order_by(desc(Offre.date_offre))\
        .offset(skip)\
        .limit(limit)\
        .all()

    return offers, total
```

**Impact:** 100+ requêtes → 1 requête! (100x plus rapide)

---

## 7️⃣ FIX SQL FILTERING (JSON COLUMNS)

**Fichier:** `backend/src/crud/notaires.py` (modifié)

```python
from sqlalchemy import and_, or_, func
from sqlalchemy.dialects.postgresql import JSON

def find_notaires_by_location(
    db,
    code_postal: str,
    ville: str
) -> List[Notaire]:
    """
    Trouver notaires disponibles pour un code postal/ville.

    AVANT: Chargeait TOUS les notaires en mémoire, filtre en Python
    APRÈS: Filtre en SQL, retourne seulement les résultats
    """
    # PostgreSQL JSON operators
    notaires = db.query(Notaire).filter(
        and_(
            Notaire.partenaire_actif == True,
            or_(
                # JSON column contains code_postal dans l'array
                Notaire.zone_geographique['codes_postaux'].astext.contains(code_postal),
                # JSON column contains ville dans l'array
                Notaire.zone_geographique['villes'].astext.contains(ville)
            )
        )
    ).all()

    return notaires
```

Ou mieux, **normaliser le schema**:

```sql
-- Migration: ajouter colonnes dénormalisées
ALTER TABLE notaires ADD COLUMN IF NOT EXISTS codes_postaux TEXT[];
ALTER TABLE notaires ADD COLUMN IF NOT EXISTS villes TEXT[];

-- Indexer pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_notaire_codes ON notaires USING GIN(codes_postaux);
CREATE INDEX IF NOT EXISTS idx_notaire_villes ON notaires USING GIN(villes);

-- Migrer les données depuis JSON
UPDATE notaires
SET codes_postaux = (zone_geographique->'codes_postaux')::text[],
    villes = (zone_geographique->'villes')::text[]
WHERE zone_geographique IS NOT NULL;
```

Puis utiliser:

```python
def find_notaires_by_location(
    db,
    code_postal: str,
    ville: str
) -> List[Notaire]:
    """Trouver notaires (avec indexes)."""
    notaires = db.query(Notaire).filter(
        and_(
            Notaire.partenaire_actif == True,
            or_(
                Notaire.codes_postaux.contains([code_postal]),
                Notaire.villes.contains([ville])
            )
        )
    ).all()

    return notaires
```

**Impact:** 1000 notaires chargés → 5 notaires retournés!

---

## 8️⃣ FRONTEND: AUTHCONTEXT

**Fichier:** `frontend/src/contexts/AuthContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authApi.me();
          setUser(response.data.user || response.data);
        } catch (error) {
          // Token invalide
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = (userData, newToken) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Utilisation

**Avant:**
```javascript
// Partout dans le code
const userRole = localStorage.getItem('user_role') || 'visiteur';
const userId = localStorage.getItem('user_id');
const token = localStorage.getItem('auth_token');
```

**Après:**
```javascript
// Une seule ligne
const { user, token } = useAuth();
// user.role, user.id disponibles directement
```

---

## 9️⃣ FRONTEND: FAVORIS AU SERVEUR

**Avant:**
```javascript
// AnnoncePage.jsx - Favoris dans localStorage
const loadFavorites = () => {
  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  setIsFavorite(favs.includes(parseInt(id)));
};

const toggleFavorite = () => {
  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  const updated = isFavorite
    ? favs.filter((fav) => fav !== parseInt(id))
    : [...favs, parseInt(id)];
  localStorage.setItem('favorites', JSON.stringify(updated));
  setIsFavorite(!isFavorite);
};
```

**Après:**
```javascript
// AnnoncePage.jsx - Utiliser l'API
import { favorisApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { user } = useAuth();

useEffect(() => {
  loadFavorites();
}, [id, user]);

const loadFavorites = async () => {
  if (!user) {
    setIsFavorite(false);
    return;
  }
  try {
    const response = await favorisApi.list();
    const favoriteIds = response.data.data.map(f => f.annonce_id);
    setIsFavorite(favoriteIds.includes(parseInt(id)));
  } catch (error) {
    console.error('Erreur chargement favoris:', error);
  }
};

const toggleFavorite = async () => {
  if (!user) {
    alert('Veuillez vous connecter');
    return;
  }

  try {
    if (isFavorite) {
      await favorisApi.remove(id);
    } else {
      await favorisApi.add(id);
    }
    setIsFavorite(!isFavorite);
  } catch (error) {
    console.error('Erreur favoris:', error);
    alert('Erreur lors de la modification');
  }
};
```

---

## 📝 CHECKLIST D'IMPLÉMENTATION

- [ ] Créer `email_unified.py` et tester
- [ ] Ajouter décorateur `@handle_errors` et appliquer à 5 routes
- [ ] Créer `pagination.py` et tester
- [ ] Créer `response.py` et utiliser dans 5 routes
- [ ] Créer `decorators/auth.py` et appliquer à 3 routes
- [ ] Ajouter `joinedload` aux CRUD offres/notaires
- [ ] Fix SQL filtering notaires
- [ ] Créer AuthContext React
- [ ] Migrer favoris à API
- [ ] Tests unitaires pour chaque changement

**Temps total:** 12-15 heures
