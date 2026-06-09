# 🔐 Guide d'Intégration de la Sécurité et Conformité RGPD

## Vue d'ensemble

Ce guide explique comment intégrer tous les composants de sécurité et de conformité RGPD dans votre application Immo2000.

## Composants Créés

### 1. **Fichiers de Sécurité**
- `src/security/auth_advanced.py` - Utilitaires de sécurité (2FA, vérification d'identité, XSS)
- `src/security/audit.py` - Logging d'audit et détection des menaces
- `src/models/security.py` - Modèles SQLAlchemy pour sécurité/RGPD
- `src/routes/security.py` - Routes Flask pour 2FA, RGPD, vérification d'identité

### 2. **Templates Jinja2**
- `src/templates/security/2fa_setup.html` - Configuration 2FA avec QR code
- `src/templates/security/rgpd.html` - Gestion des données RGPD
- `src/templates/security/profile.html` - Profil de sécurité utilisateur

### 3. **Migrations**
- `migrations/versions/001_add_security_models.py` - Création des tables de sécurité

### 4. **Dépendances**
```
pyotp==2.9.0              # TOTP 2FA
qrcode[pil]==8.2          # Génération QR codes
cryptography==41.0.7      # Chiffrement
bleach==6.2.0             # Protection XSS
requests==2.31.0          # Appels API
flask-limiter==3.3.1      # Rate limiting
flask-talisman==1.1.0     # Sécurité HTTP
```

## Étapes d'Intégration

### Étape 1: Mettre à jour app.py

Ajoutez à votre `backend/src/app.py`:

```python
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from src.routes.security import security_bp
from src.models.security import SecurityProfile, AuditLog, RGPDRequest, IdentityVerificationLog, SecurityEvent

# Initialiser les middlewares de sécurité
def configure_security(app):
    # HTTPS et headers de sécurité
    Talisman(app,
        force_https=True if app.config.get('ENV') == 'production' else False,
        strict_transport_security=True,
        strict_transport_security_max_age=31536000,
        content_security_policy={
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],  # À restreindre
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
        }
    )

    # Rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )

    # Enregistrer les blueprints
    app.register_blueprint(security_bp)

    return app

# Appeler au démarrage
app = Flask(__name__)
app = configure_security(app)
```

### Étape 2: Créer les Tables de Base de Données

```bash
# Dans le répertoire backend/
cd backend

# Créer la migration
flask db migrate -m "Add security and RGPD models"

# Appliquer la migration
flask db upgrade
```

Ou exécutez directement:

```bash
python -c "
from src.app import app, db
from src.models.security import *
with app.app_context():
    db.create_all()
    print('✅ Tables de sécurité créées')
"
```

### Étape 3: Configurer les Variables d'Environnement

Ajoutez à `.env`:

```env
# Sécurité 2FA
SECRET_2FA_ENCRYPTION_KEY=<votre-clé-chiffrement-32-bytes>

# Fournisseurs de Vérification d'Identité (optionnel)
# Choisir YOUSIGN ou VERIFF
YOUSIGN_API_KEY=<votre-clé-api-yousign>
YOUSIGN_API_URL=https://api.yousign.com

VERIFF_API_KEY=<votre-clé-api-veriff>
VERIFF_API_URL=https://api.veriff.me

# Email pour RGPD
DPO_EMAIL=dpo@immo2000.fr
SUPPORT_EMAIL=support@immo2000.fr

# Rate Limiting
RATELIMIT_ENABLED=true
RATELIMIT_LOGIN=10 per minute
RATELIMIT_API=100 per hour
```

### Étape 4: Mettre à Jour le Modèle User

Assurez-vous que votre modèle `User` a ces champs (ou assurez-vous qu'il y a une relation avec `SecurityProfile`):

```python
class User(db.Model):
    # ... champs existants ...

    # Relation avec le profil de sécurité
    security_profile = db.relationship('SecurityProfile', uselist=False, backref='user')

    def verify_password(self, password):
        # Votre implémentation existante
        return check_password_hash(self.password_hash, password)
```

### Étape 5: Initialiser la Base de Données avec les Tables de Sécurité

```python
from src.models.security import db

# Dans le contexte de l'application
with app.app_context():
    db.create_all()
```

## Routes Disponibles

### 2FA (Double Authentification)

```
GET  /api/v1/security/2fa/setup           - Générer secret + QR code
POST /api/v1/security/2fa/setup           - Activer 2FA
POST /api/v1/security/2fa/disable         - Désactiver 2FA
POST /api/v1/security/2fa/verify          - Vérifier code 2FA à la connexion
```

### Vérification d'Identité

```
POST /api/v1/security/identity/start      - Démarrer vérification (Yousign/Veriff)
POST /api/v1/security/identity/callback   - Webhook de vérification
```

### RGPD (Gestion des Données)

```
GET  /api/v1/security/rgpd/status         - Statut des demandes RGPD
POST /api/v1/security/rgpd/export-data    - Demander export de données
POST /api/v1/security/rgpd/delete-account - Demander suppression de compte
POST /api/v1/security/rgpd/confirm-deletion/<token> - Confirmer suppression
```

### Profil de Sécurité

```
GET  /api/v1/security/profile             - Obtenir profil de sécurité
GET  /api/v1/security/audit-log           - Voir journal d'audit personnel
```

## Fonctionnalités Implémentées

### ✅ 2FA (TOTP)
- Génération de secrets avec `pyotp`
- QR codes générés avec `qrcode[pil]`
- Codes de secours stockés en JSON
- Vérification de tokens avec fenêtre de tolérance

### ✅ Vérification d'Identité
- Support de Yousign et Veriff (configurable)
- Webhooks de callback
- Historique de vérifications
- Expiration des vérifications (5 ans)

### ✅ RGPD
- Export de données personnelles
- Demandes de suppression de compte avec délai de confirmation
- Anonymisation progressive
- Trails d'audit complets

### ✅ Audit & Détection de Menaces
- Logging de toutes les actions sensibles
- Détection des tentatives de connexion échouées
- Alerte sur IPs inhabituelles
- Rate limiting par IP
- XSS protection via `bleach`

### ✅ Sécurité des En-têtes HTTP
- HSTS (Strict-Transport-Security)
- CSP (Content-Security-Policy)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)

## Workflow Utilisateur

### Activation du 2FA

1. Utilisateur accède à `/security/2fa/setup`
2. Template génère secret + QR code via GET
3. Utilisateur scanne le QR code avec son application d'auth
4. Utilisateur entre le code à 6 chiffres
5. Vérification et activation
6. Affichage des codes de secours

### Suppression de Compte (RGPD)

1. Utilisateur accède à `/security/rgpd`
2. Clique sur "Supprimer Mon Compte"
3. Entre son mot de passe et raison
4. Demande créée avec token de confirmation
5. Email envoyé avec lien de confirmation
6. Utilisateur confirme dans les 30 jours
7. Compte anonymisé et désactivé

## Fichiers de Logs et Audit

Les audit logs sont stockés dans:
- **Base de Données**: Tableau `audit_logs`
- **Fichiers**: `logs/audit_*.log` (via configuration logging)
- **Événements de Sécurité**: Tableau `security_events`

## Configuration pour Production

### 1. HTTPS Obligatoire
```python
Talisman(app, force_https=True)
```

### 2. Clés Chiffrées
```bash
# Générer une clé de 32 bytes
python -c "import secrets; print(secrets.token_hex(32))"
# Ajouter à .env comme SECRET_2FA_ENCRYPTION_KEY
```

### 3. Rate Limiting Strict
```env
RATELIMIT_LOGIN=5 per minute
RATELIMIT_API=50 per hour
RATELIMIT_RGPD=1 per day
```

### 4. CORS et Sécurité
```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

## Tests

### Test du 2FA
```bash
curl -X POST http://localhost:5000/api/v1/security/2fa/setup \
  -H "Content-Type: application/json"
```

### Test de RGPD Export
```bash
curl -X POST http://localhost:5000/api/v1/security/rgpd/export-data \
  -H "Content-Type: application/json" \
  -d '{"reason": "Transfert"}'
```

## Intégration Frontend

### 1. Bouton dans la barre de navigation
```html
<a href="/security/profile" class="nav-link">
  🔐 Sécurité
</a>
```

### 2. Menu utilisateur
Ajouter des liens vers:
- `/security/profile` - Profil de sécurité
- `/security/2fa/setup` - Configuration 2FA
- `/security/rgpd` - Gestion des données

### 3. Alertes au premier login
```javascript
// Après authentication réussie
if (!user.security_profile.is_2fa_enabled) {
    showAlert("⚠️ Activez le 2FA pour sécuriser votre compte");
}
if (!user.security_profile.identite_verifiee) {
    showAlert("⚠️ Vérifiez votre identité pour certaines fonctionnalités");
}
```

## Conformité Légale

### RGPD (Europe)
- ✅ Droit d'accès aux données
- ✅ Droit de rectification
- ✅ Droit à l'oubli
- ✅ Droit à la portabilité
- ✅ Audit trail complet
- ✅ Consentement et gestion de données

### Signature Digitale (France)
- ✅ Vérification d'identité obligatoire avant signature
- ✅ Intégration DocuSign/eSignatureCMS
- ✅ Preuve de signature (horodatage, logs)

### KYC (Know Your Customer)
- ✅ Vérification d'identité avec Yousign/Veriff
- ✅ Documents vérifiés
- ✅ Expiration de vérification

## Support et Maintenance

### Monitoring
- Surveiller les tables `security_events` et `audit_logs`
- Alertes sur `severity='critical'`
- Vérifier les tentatives de connexion échouées

### Nettoyage des Données
```python
# Supprimer les logs d'audit anciens (>1 an)
from datetime import datetime, timedelta

cutoff_date = datetime.utcnow() - timedelta(days=365)
AuditLog.query.filter(AuditLog.timestamp < cutoff_date).delete()
db.session.commit()
```

## Questions Fréquemment Posées

**Q: Que se passe-t-il si je perds mon téléphone avec l'authenticateur?**
R: Utilisez les codes de secours générés lors de l'activation du 2FA. Vous devrez réactiver le 2FA.

**Q: Comment puis-je exporter mes données?**
R: Allez à `/security/rgpd` et cliquez sur "Exporter Données". Un email vous enverra le lien de téléchargement dans les 30 jours.

**Q: La suppression est-elle immédiate?**
R: Non, vous avez 30 jours pour confirmer par email. Pendant ce délai, vous pouvez annuler.

**Q: Qui peut accéder à mes audit logs?**
R: Seul vous pouvez voir votre propre audit log via `/api/v1/security/audit-log`. Les admins ont accès à tous les logs via un dashboard séparé (à implémenter).

---

**Dernière mise à jour**: {{ now.strftime('%Y-%m-%d') }}
**Responsable**: Équipe de Sécurité
**Support**: security@immo2000.fr
