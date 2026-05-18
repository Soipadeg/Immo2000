# Exemples d'Implémentation - Refactorisation admin.py

## Structure Proposée

```
backend/src/routes/
├── admin/
│   ├── __init__.py              # Entry point
│   ├── dashboard.py             # 5 routes: dashboard, analytics, stats
│   ├── users.py                 # 8 routes: CRUD + search + role/suspend
│   ├── listings.py              # 4 routes: moderation (approve/reject/remove)
│   ├── transactions.py          # 5 routes: CRUD offers + actions
│   ├── settings.py              # 4 routes: CRUD system settings
│   └── analytics.py             # 3 routes: advanced analytics + audit
```

---

## 📝 Exemple 1 : admin_settings.py

**Raison** : Module le plus simple, zéro dépendances ORM

```python
"""
Routes Flask pour la gestion des paramètres système (TASK 5).
URL prefix: /api/v1
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from src.auth.models import db
from src.auth.decorators import token_required, admin_required
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError

logger = logging.getLogger(__name__)

# Blueprint
admin_settings_bp = Blueprint("admin_settings", __name__, url_prefix="/api/v1")


@admin_settings_bp.route("/admin/settings", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_settings(current_user):
    """
    GET /api/v1/admin/settings
    Récupérer tous les paramètres système.
    """
    try:
        result = db.session.execute(db.text("""
            SELECT parametre_id, cle_parametre, valeur_parametre,
                   type_parametre, description, date_modification
            FROM parametres_systeme
            ORDER BY cle_parametre
        """))
        settings = [
            {
                "parametre_id": row.parametre_id,
                "cle_parametre": row.cle_parametre,
                "valeur_parametre": row.valeur_parametre,
                "type_parametre": row.type_parametre,
                "description": row.description,
                "date_modification": row.date_modification.isoformat() if row.date_modification else None
            }
            for row in result
        ]

        logger.info(f"Admin {current_user['user_id']} retrieved {len(settings)} system settings")

        return {
            "total": len(settings),
            "settings": settings
        }
    except Exception as e:
        logger.warning(f"Settings table unavailable: {str(e)}")
        db.session.rollback()
        raise ValidationError(f"Impossible de récupérer les paramètres: {str(e)}")


@admin_settings_bp.route("/admin/settings/<setting_key>", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_setting(current_user, setting_key):
    """GET /api/v1/admin/settings/{setting_key}"""
    try:
        result = db.session.execute(db.text("""
            SELECT parametre_id, cle_parametre, valeur_parametre,
                   type_parametre, description, date_modification
            FROM parametres_systeme
            WHERE cle_parametre = :key
        """), {"key": setting_key})
        row = result.first()

        if not row:
            raise NotFoundError(f"Paramètre '{setting_key}' non trouvé")

        return {
            "parametre_id": row.parametre_id,
            "cle_parametre": row.cle_parametre,
            "valeur_parametre": row.valeur_parametre,
            "type_parametre": row.type_parametre,
            "description": row.description,
            "date_modification": row.date_modification.isoformat() if row.date_modification else None
        }

    except NotFoundError:
        raise
    except Exception as e:
        logger.warning(f"Error fetching setting {setting_key}: {str(e)}")
        db.session.rollback()
        raise NotFoundError(f"Paramètre '{setting_key}' non trouvé")


@admin_settings_bp.route("/admin/settings/<setting_key>", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def update_setting(current_user, setting_key):
    """POST /api/v1/admin/settings/{setting_key}"""
    data = request.get_json() or {}
    nouvelle_valeur = data.get("valeur_parametre")

    if nouvelle_valeur is None:
        raise ValidationError("Le champ 'valeur_parametre' est requis")

    nouvelle_valeur = str(nouvelle_valeur).strip()

    if not nouvelle_valeur:
        raise ValidationError("La valeur ne peut pas être vide")

    try:
        # Récupérer le paramètre actuel
        result = db.session.execute(db.text("""
            SELECT parametre_id, cle_parametre, valeur_parametre,
                   type_parametre, description
            FROM parametres_systeme
            WHERE cle_parametre = :key
        """), {"key": setting_key})
        row = result.first()

        if not row:
            raise NotFoundError(f"Paramètre '{setting_key}' non trouvé")

        ancien_valeur = row.valeur_parametre
        parametre_id = row.parametre_id
        type_parametre = row.type_parametre

        # Valider selon le type
        if type_parametre == 'boolean':
            if nouvelle_valeur.lower() not in ['true', 'false']:
                raise ValidationError(f"Valeur booléenne invalide: '{nouvelle_valeur}'")

        elif type_parametre == 'integer':
            try:
                int(nouvelle_valeur)
            except ValueError:
                raise ValidationError(f"Valeur entière invalide: '{nouvelle_valeur}'")

        # Mettre à jour
        db.session.execute(db.text("""
            UPDATE parametres_systeme
            SET valeur_parametre = :valeur, date_modification = CURRENT_TIMESTAMP
            WHERE cle_parametre = :key
        """), {"valeur": nouvelle_valeur, "key": setting_key})
        db.session.commit()

        logger.warning(f"Admin {current_user['user_id']} updated setting '{setting_key}': '{ancien_valeur}' → '{nouvelle_valeur}'")

        return {
            "updated": True,
            "parametre_id": parametre_id,
            "cle_parametre": setting_key,
            "ancien_valeur": ancien_valeur,
            "nouvelle_valeur": nouvelle_valeur,
            "type_parametre": type_parametre,
            "message": f"Paramètre '{setting_key}' a été mis à jour avec succès"
        }

    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        logger.error(f"Error updating setting {setting_key}: {str(e)}")
        db.session.rollback()
        raise ValidationError(f"Erreur lors de la mise à jour du paramètre: {str(e)}")


@admin_settings_bp.route("/admin/settings/reset", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def reset_settings(current_user):
    """POST /api/v1/admin/settings/reset - Réinitialiser aux defaults"""
    data = request.get_json() or {}
    confirm = data.get("confirm", False)

    if not confirm:
        raise ValidationError("La confirmation est requise (confirm: true)")

    try:
        default_settings = {
            'email_notifications_enabled': 'true',
            'sms_notifications_enabled': 'false',
            'rate_limit_requests_per_hour': '1000',
            'rate_limit_listings_per_user_per_month': '50',
            'auto_approve_listings': 'false',
            'approval_timeout_days': '7',
            'auto_archive_days': '180',
            'maintenance_mode': 'false',
            'debug_mode': 'false',
            'max_upload_size_mb': '50',
            'email_from_address': 'noreply@immo2000.fr',
            'support_email': 'support@immo2000.fr',
            'listing_image_quality': '85',
            'session_timeout_minutes': '30',
            'password_expiry_days': '90'
        }

        count = 0
        for cle, valeur in default_settings.items():
            db.session.execute(db.text("""
                UPDATE parametres_systeme
                SET valeur_parametre = :valeur, date_modification = CURRENT_TIMESTAMP
                WHERE cle_parametre = :key
            """), {"valeur": valeur, "key": cle})
            count += 1

        db.session.commit()

        logger.warning(f"Admin {current_user['user_id']} RESET all system settings to defaults")

        return {
            "reset": True,
            "parametres_resetted": count,
            "message": f"{count} paramètres ont été réinitialisés aux valeurs par défaut"
        }

    except Exception as e:
        logger.error(f"Error resetting settings: {str(e)}")
        db.session.rollback()
        raise ValidationError(f"Erreur lors de la réinitialisation: {str(e)}")
```

---

## 📝 Exemple 2 : admin_listings.py

**Raison** : Modulation de la modération des annonces

```python
"""
Routes Flask pour la modération des annonces (TASK 3).
URL prefix: /api/v1
"""

from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from datetime import datetime
import logging

from src.auth.models import db, User
from src.auth.decorators import token_required, admin_required
from src.decorators.error_handling import handle_errors, ValidationError, NotFoundError
from src.models.annonces import Annonce

logger = logging.getLogger(__name__)

# Blueprint
admin_listings_bp = Blueprint("admin_listings", __name__, url_prefix="/api/v1")


@admin_listings_bp.route("/admin/listings/pending", methods=["GET"])
@token_required
@admin_required
@handle_errors()
def get_pending_listings(current_user):
    """
    GET /api/v1/admin/listings/pending
    Lister toutes les annonces en attente de modération (statut brouillon).
    """
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 100)

    # Annonces en attente de modération = statut 'brouillon'
    query = db.session.query(Annonce).filter(Annonce.statut == "brouillon")
    total = query.count()

    listings = query.order_by(desc(Annonce.date_creation)).offset(skip).limit(limit).all()

    listings_data = []
    for listing in listings:
        user = db.session.query(User).filter(User.utilisateur_id == listing.utilisateur_id).first()
        listings_data.append({
            "annonce_id": listing.annonce_id,
            "titre": listing.titre,
            "description": listing.description,
            "prix": listing.prix,
            "surface": listing.surface,
            "type_bien": listing.type_bien,
            "adresse": listing.adresse,
            "ville": listing.ville,
            "code_postal": listing.code_postal,
            "nombre_pieces": listing.nombre_pieces,
            "utilisateur_id": listing.utilisateur_id,
            "utilisateur_email": user.email if user else "Unknown",
            "utilisateur_nom": f"{user.prenom} {user.nom}" if user else "Unknown",
            "date_creation": listing.date_creation.isoformat() if listing.date_creation else None,
            "statut": listing.statut,
            "photos": listing.photos or []
        })

    logger.info(f"Admin {current_user['user_id']} viewed pending listings (total: {total})")

    return {
        "items": listings_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@admin_listings_bp.route("/admin/listings/<int:listing_id>/approve", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def approve_listing(current_user, listing_id):
    """POST /api/v1/admin/listings/{listing_id}/approve"""

    # Récupérer l'annonce
    listing = db.session.query(Annonce).filter(Annonce.annonce_id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Aucune annonce avec l'ID {listing_id}")

    if listing.statut != "brouillon":
        raise ValidationError(f"Annonce n'est pas en attente de modération (statut actuel: {listing.statut})")

    # Approuver: brouillon → publiée
    previous_statut = listing.statut
    listing.statut = "publiée"
    listing.date_statut = datetime.utcnow()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} APPROVED listing {listing_id} ({listing.titre})")

    return {
        "approved": True,
        "annonce_id": listing_id,
        "titre": listing.titre,
        "previous_statut": previous_statut,
        "new_statut": listing.statut,
        "message": f"Annonce '{listing.titre}' a été approuvée et publiée"
    }


@admin_listings_bp.route("/admin/listings/<int:listing_id>/reject", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def reject_listing(current_user, listing_id):
    """POST /api/v1/admin/listings/{listing_id}/reject"""

    listing = db.session.query(Annonce).filter(Annonce.annonce_id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Aucune annonce avec l'ID {listing_id}")

    if listing.statut != "brouillon":
        raise ValidationError(f"Annonce n'est pas en attente de modération (statut actuel: {listing.statut})")

    data = request.get_json() or {}
    reason = data.get("reason", "").strip()

    if reason and len(reason) > 500:
        raise ValidationError("La raison du rejet ne doit pas dépasser 500 caractères")

    # Rejeter: brouillon → archivée + stocker la raison
    previous_statut = listing.statut
    listing.statut = "archivée"
    listing.date_statut = datetime.utcnow()

    # Stocker la raison du rejet dans les métadonnées
    if not listing.photos:
        listing.photos = {}
    if isinstance(listing.photos, list):
        listing.photos = {}

    listing.photos["rejection_reason"] = reason or "Raison non spécifiée"
    listing.photos["rejected_by_admin_id"] = current_user["user_id"]
    listing.photos["rejected_at"] = datetime.utcnow().isoformat()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} REJECTED listing {listing_id} ({listing.titre}) - Reason: {reason}")

    return {
        "rejected": True,
        "annonce_id": listing_id,
        "titre": listing.titre,
        "previous_statut": previous_statut,
        "new_statut": listing.statut,
        "reason": reason or "Raison non spécifiée",
        "message": f"Annonce '{listing.titre}' a été rejetée"
    }


@admin_listings_bp.route("/admin/listings/<int:listing_id>/remove", methods=["POST"])
@token_required
@admin_required
@handle_errors()
def remove_listing(current_user, listing_id):
    """POST /api/v1/admin/listings/{listing_id}/remove"""

    listing = db.session.query(Annonce).filter(Annonce.annonce_id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Aucune annonce avec l'ID {listing_id}")

    if listing.statut not in ["publiée", "brouillon"]:
        raise ValidationError(f"Annonce ne peut pas être supprimée (statut actuel: {listing.statut})")

    data = request.get_json() or {}
    reason = data.get("reason", "").strip()

    if reason and len(reason) > 500:
        raise ValidationError("La raison de suppression ne doit pas dépasser 500 caractères")

    # Supprimer: publiée/brouillon → archivée
    previous_statut = listing.statut
    listing.statut = "archivée"
    listing.date_statut = datetime.utcnow()

    # Stocker la raison de suppression dans les métadonnées
    if not listing.photos:
        listing.photos = {}
    if isinstance(listing.photos, list):
        listing.photos = {}

    listing.photos["removal_reason"] = reason or "Raison non spécifiée"
    listing.photos["removed_by_admin_id"] = current_user["user_id"]
    listing.photos["removed_at"] = datetime.utcnow().isoformat()

    db.session.commit()

    logger.warning(f"Admin {current_user['user_id']} REMOVED listing {listing_id} ({listing.titre}) - Reason: {reason}")

    return {
        "removed": True,
        "annonce_id": listing_id,
        "titre": listing.titre,
        "previous_statut": previous_statut,
        "new_statut": listing.statut,
        "reason": reason or "Raison non spécifiée",
        "message": f"Annonce '{listing.titre}' a été supprimée par modération"
    }
```

---

## 📝 Exemple 3 : Fichier d'Enregistrement (__init__.py)

**Pour enregistrer tous les blueprints**

```python
"""
Routes administrateur - Point d'entrée pour tous les blueprints.
"""

from flask import Blueprint
from .dashboard import admin_dashboard_bp
from .users import admin_users_bp
from .listings import admin_listings_bp
from .transactions import admin_transactions_bp
from .settings import admin_settings_bp
from .analytics import admin_analytics_bp

def register_admin_routes(app):
    """
    Enregistrer tous les blueprints administrateur auprès de l'application Flask.

    Appeler dans main Flask app:
        from src.routes.admin import register_admin_routes
        register_admin_routes(app)
    """
    app.register_blueprint(admin_dashboard_bp)
    app.register_blueprint(admin_users_bp)
    app.register_blueprint(admin_listings_bp)
    app.register_blueprint(admin_transactions_bp)
    app.register_blueprint(admin_settings_bp)
    app.register_blueprint(admin_analytics_bp)
```

---

## 🔄 Migration dans main app

**Avant** (`run_server.py` ou `__init__.py`) :

```python
from src.routes import admin

app.register_blueprint(admin.admin_bp)
```

**Après** :

```python
from src.routes.admin import register_admin_routes

register_admin_routes(app)
```

---

## 📋 Checklist Étape par Étape

### Pour admin_settings.py :

- [ ] Créer fichier `backend/src/routes/admin/settings.py`
- [ ] Copier les 4 routes entièrement
- [ ] Remplacer `admin_bp` par `admin_settings_bp`
- [ ] Vérifier imports (db.text())
- [ ] Tester avec:
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
       http://localhost:5000/api/v1/admin/settings
  ```
- [ ] Supprimer les 4 routes de `admin.py`

### Pour admin_listings.py :

- [ ] Créer fichier `backend/src/routes/admin/listings.py`
- [ ] Importer `Annonce` depuis `src.models.annonces`
- [ ] Copier les 4 routes
- [ ] Remplacer `admin_bp` par `admin_listings_bp`
- [ ] Tester avec:
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
       http://localhost:5000/api/v1/admin/listings/pending
  ```
- [ ] Supprimer les 4 routes de `admin.py`

---

## 🧪 Tests d'Intégration

```python
# tests/test_admin_routes.py

import pytest
from src.routes.admin import register_admin_routes

def test_admin_settings(app, client):
    """Test que les routes de settings fonctionnent"""
    response = client.get(
        '/api/v1/admin/settings',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert response.status_code == 200
    assert 'settings' in response.json

def test_admin_listings_pending(app, client):
    """Test que les routes de listings fonctionnent"""
    response = client.get(
        '/api/v1/admin/listings/pending',
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert response.status_code == 200
    assert 'items' in response.json
```

---

## 📚 Résumé des Changements

| Fichier | Avant | Après | Action |
|---------|-------|-------|--------|
| `admin.py` | 1366 lignes, 27 routes | Supprimé | Décomposer |
| `admin/__init__.py` | N/A | Créer | Entry point |
| `admin/settings.py` | N/A | 173 lignes | Créer |
| `admin/listings.py` | N/A | 166 lignes | Créer |
| `admin/users.py` | N/A | 504 lignes | Créer |
| `admin/transactions.py` | N/A | 273 lignes | Créer |
| `admin/dashboard.py` | N/A | 392 lignes | Créer |
| `admin/analytics.py` | N/A | 168 lignes | Créer |

---

## ✅ Validation Finale

```bash
# 1. Vérifier que tous les imports résolvent
cd backend && python -m py_compile src/routes/admin/*.py

# 2. Vérifier que app démarre
python run_server.py

# 3. Vérifier que routes existent
curl http://localhost:5000/api/v1/admin/settings

# 4. Vérifier logs
grep "Admin.*accessed" logs/app.log
```

---

## 🎯 Conclusion

Cette refactorisation transforme un fichier monolithique de **1366 lignes** en 6 modules spécialisés, chacun avec une **responsabilité unique et bien définie**. Les avantages incluent :

- ✅ Maintenabilité améliorée
- ✅ Tests plus ciblés
- ✅ Réutilisabilité des patterns
- ✅ Scalabilité (ajout de nouvelles routes)
- ✅ Dépendances claires et documentées

Durée estimée : **10-12 jours** (incluant tests)
