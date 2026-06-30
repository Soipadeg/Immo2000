# 🟡 Medium Priority - Après Production

**Date**: 26 Juin 2026
**Estimé**: 4-6 heures de travail
**Quand**: 1-2 semaines après déploiement production

---

## 📋 Recommandations Classées par Impact vs Effort

```
Impact vs Effort Matrix:

IMMEDIATE (Faire après déploiement prod - Week 1-2)
┌────────────────────────────────────┐
│ 🟡 Audit Logs (1-2h) - Sécurité    │
│ 🟡 Password Policy (30min) - Auth  │
│ 🟡 Google OAuth (1h) - UX          │
│ 🟡 Database Indexes (2h) - Perf    │
└────────────────────────────────────┘

SOON (À faire après 2-4 weeks)
┌────────────────────────────────────┐
│ 🟠 Logs Centralisés ELK (4-6h)     │
│ 🟠 E2E Tests Cypress (2-3h)        │
│ 🟠 Alert System Avancé (2h)        │
└────────────────────────────────────┘

NICE-TO-HAVE (Optional)
┌────────────────────────────────────┐
│ 🔵 Lazy Loading Frontend (2h)      │
│ 🔵 PWA Service Worker (2-3h)       │
│ 🔵 Performance Tuning CDN (1-2h)   │
└────────────────────────────────────┘
```

---

## 🟡 Audit Logs Implementation (1-2h)

### Objectif
Logger toutes les actions critiques pour conformité RGPD + debugging

### Fichiers à Créer/Modifier

#### 1. Model Audit Log
```python
# backend/src/models/audit.py (créer)
from sqlalchemy import DateTime, String, JSON
from datetime import datetime

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(String(50))  # login, create, update, delete, export, etc
    resource_type = db.Column(String(50))  # user, listing, transaction, etc
    resource_id = db.Column(db.Integer)
    changes = db.Column(JSON)  # Before/After values
    ip_address = db.Column(String(45))
    user_agent = db.Column(String(255))
    created_at = db.Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AuditLog {self.id}: {self.action} by {self.user_id}>"
```

#### 2. Audit Decorator
```python
# backend/src/decorators/audit.py (créer)
from functools import wraps
from src.models.audit import AuditLog
from flask import request, g

def audit_action(action_type):
    """Décorateur pour logger les actions"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)

            # Log action
            try:
                user_id = g.user_id if hasattr(g, 'user_id') else None
                log = AuditLog(
                    user_id=user_id,
                    action=action_type,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent')
                )
                db.session.add(log)
                db.session.commit()
            except:
                pass  # Don't fail if logging fails

            return result
        return decorated_function
    return decorator
```

#### 3. Appliquer aux Routes Critiques
```python
# backend/src/routes/annonces.py
@annonces_bp.route('/create', methods=['POST'])
@audit_action('create_listing')
def create_listing():
    # ... existing code
    pass

@annonces_bp.route('/<id>/update', methods=['PUT'])
@audit_action('update_listing')
def update_listing(id):
    # ... existing code
    pass
```

#### 4. Endpoint pour Voir Logs (Admin)
```python
@admin_bp.route('/audit-logs', methods=['GET'])
@token_required
def get_audit_logs():
    """Voir les logs d'audit (admin only)"""
    if not g.user.is_admin:
        return {"error": "Unauthorized"}, 403

    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return {"logs": [log.to_dict() for log in logs]}, 200
```

### Vérification
```bash
# 1. Créer migration
flask db migrate -m "Add audit logs"
flask db upgrade

# 2. Tester
curl -X POST https://immo2000.fr/api/v1/annonces/create \
  -H "Authorization: Bearer $TOKEN"

# 3. Vérifier logs
curl https://immo2000.fr/api/v1/admin/audit-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🟡 Password Policy (30min)

### Objectif
Validation forte des passwords (OWASP)

### Implementation
```python
# backend/src/validators/password.py (créer)
import re
from pydantic import field_validator

class PasswordValidator:
    MIN_LENGTH = 12
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_NUMBERS = True
    REQUIRE_SPECIAL = True

    @staticmethod
    def validate(password: str) -> bool:
        """Valider un password"""
        if len(password) < PasswordValidator.MIN_LENGTH:
            raise ValueError(f"Password doit avoir au moins {PasswordValidator.MIN_LENGTH} caractères")

        if PasswordValidator.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            raise ValueError("Password doit contenir au moins une majuscule")

        if PasswordValidator.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            raise ValueError("Password doit contenir au moins une minuscule")

        if PasswordValidator.REQUIRE_NUMBERS and not re.search(r'\d', password):
            raise ValueError("Password doit contenir au moins un chiffre")

        if PasswordValidator.REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValueError("Password doit contenir au moins un caractère spécial")

        return True

# Dans auth routes
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    PasswordValidator.validate(data['password'])  # Will raise on invalid
    # ... rest of registration
```

### Vérification
```bash
# Test weak password
curl -X POST https://immo2000.fr/api/v1/auth/register \
  -d '{"email": "test@test.com", "password": "weak"}' \
  # Should return: "Password must have at least 12 characters"

# Test strong password
curl -X POST https://immo2000.fr/api/v1/auth/register \
  -d '{"email": "test@test.com", "password": "SecurePass123!"}' \
  # Should succeed
```

---

## 🟡 Google OAuth (1h)

### Objectif
Permettre login/signup avec Google

### Setup
```bash
# 1. Google Cloud Console
# https://console.cloud.google.com/
# - Create OAuth 2.0 credentials (Web application)
# - Authorized redirect URIs: https://immo2000.fr/auth/google/callback

# 2. Update .env.production
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://immo2000.fr/auth/google/callback
```

### Implementation
```python
# backend/src/routes/oauth.py (si n'existe pas)
from google.auth.transport import requests
from google.oauth2 import id_token

@oauth_bp.route('/google/login', methods=['POST'])
def google_login():
    """Initier Google OAuth login"""
    redirect_uri = f"{os.getenv('DOMAIN')}/auth/google/callback"
    return {
        "auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id={os.getenv('GOOGLE_CLIENT_ID')}&redirect_uri={redirect_uri}&response_type=code&scope=email%20profile"
    }, 200

@oauth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Callback après Google auth"""
    code = request.args.get('code')

    # Échange le code contre un token
    token_response = requests.urlopen(
        'https://oauth2.googleapis.com/token',
        data=urlencode({
            'client_id': os.getenv('GOOGLE_CLIENT_ID'),
            'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': f"{os.getenv('DOMAIN')}/auth/google/callback"
        }).encode()
    )

    tokens = json.loads(token_response.read())
    id_token_str = tokens['id_token']

    # Valide le token
    try:
        idinfo = id_token.verify_oauth2_token(id_token_str, requests.Request(), os.getenv('GOOGLE_CLIENT_ID'))

        # Crée ou update l'utilisateur
        user = User.query.filter_by(email=idinfo['email']).first()
        if not user:
            user = User(
                email=idinfo['email'],
                first_name=idinfo.get('given_name'),
                last_name=idinfo.get('family_name'),
                google_id=idinfo['sub']
            )
            db.session.add(user)
            db.session.commit()

        # Crée JWT token
        token = create_access_token(user.id)

        return {
            "token": token,
            "user": user.to_dict()
        }, 200
    except ValueError:
        return {"error": "Invalid token"}, 401
```

### Vérification
```bash
# 1. Test login initiation
curl https://immo2000.fr/api/v1/auth/google/login

# 2. Tester callback (après Google redirect)
curl "https://immo2000.fr/api/v1/auth/google/callback?code=YOUR_CODE"
```

---

## 🟠 Logs Centralisés (4-6h)

### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)
```bash
# docker-compose addition
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

logstash:
  image: docker.elastic.co/logstash/logstash:8.0.0
  volumes:
    - ./devops/logstash.conf:/usr/share/logstash/pipeline/logstash.conf

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
```

### Option 2: AWS CloudWatch
```python
# More cloud-native, less to manage
# backend/src/integrations/cloudwatch.py
import boto3
import logging
from watchtower import CloudWatchLogHandler

def init_cloudwatch():
    handler = CloudWatchLogHandler(
        log_group='/immo2000/backend',
        stream_name='production'
    )
    logging.getLogger().addHandler(handler)
```

---

## 🔵 E2E Tests with Cypress (2-3h)

### Scenarios à Tester
```javascript
// frontend/cypress/e2e/auth.cy.js
describe('Authentication', () => {
  it('should register new user', () => {
    cy.visit('/auth/register')
    cy.get('[data-testid="email"]').type('test@test.com')
    cy.get('[data-testid="password"]').type('SecurePass123!')
    cy.get('[data-testid="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should login existing user', () => {
    cy.login('test@test.com', 'SecurePass123!')
    cy.url().should('include', '/dashboard')
  })
})

// frontend/cypress/e2e/listings.cy.js
describe('Listings', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should create a listing', () => {
    cy.visit('/listings/new')
    cy.get('[data-testid="title"]').type('Beautiful Apartment')
    cy.get('[data-testid="price"]').type('500000')
    cy.get('[data-testid="submit"]').click()
    cy.contains('Listing created successfully').should('be.visible')
  })
})
```

---

## 📋 Checklist - Après Production (Week 1-2)

### Monitoring
- [ ] Vérifier Sentry pour erreurs
- [ ] Vérifier Prometheus metrics
- [ ] Vérifier logs (volume normal?)
- [ ] Vérifier certificat SSL (expire dans 90 jours)

### Performance
- [ ] Temps de réponse API < 500ms (P95)
- [ ] Uptime > 99.5%
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] DB connections healthy

### Sécurité
- [ ] Pas de secrets dans les logs
- [ ] Pas de vulnérabilités Snyk
- [ ] Pas de faux positifs Trivy
- [ ] Rate limiting fonctionne
- [ ] CSRF tokens fonctionnent

### Fonctionnalités
- [ ] Signup/Login marchent
- [ ] Annonces créables
- [ ] Paiements fonctionnent
- [ ] Emails envoyés
- [ ] Webhooks reçus

### Backups
- [ ] Backup daily exécuté
- [ ] Backup uploadé en S3
- [ ] Tester restauration (optionnel)

---

## 🚀 Commandes Rapides

```bash
# Après déploiement production

# 1. Vérifier santé
curl -I https://immo2000.fr/health

# 2. Vérifier logs récents
docker-compose -f docker-compose-prod.yml logs --tail=100 backend

# 3. Vérifier Sentry
# https://sentry.io/organizations/your-org/issues/?project=your-project

# 4. Vérifier Prometheus
curl https://immo2000.fr/prometheus/api/v1/query?query=up

# 5. Vérifier backups
aws s3 ls s3://immo2000-backups/backups/postgresql/ --recursive | tail -5

# 6. Test quick endpoint
curl -X GET https://immo2000.fr/api/v1/health | jq .
```

---

## 📞 Support Urgent

Si problème en production:

1. Vérifier les logs: `docker-compose logs backend`
2. Vérifier Sentry: https://sentry.io
3. Vérifier status page: https://www.statuspage.io
4. Contacter support team

---

**À faire dans 1-2 semaines après production!** 🚀
