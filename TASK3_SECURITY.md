# TÂCHE 3: Sécurité & Logging 🔐

## Vue d'ensemble

Implémentation complète d'un système de sécurité robuste pour l'API Admin incluant:
- **Audit Trail**: Logging de toutes les actions admin
- **Rate Limiting**: Protection contre les abus
- **Input Validation**: Validation et sanitization strictes
- **Encryption**: Chiffrement des données sensibles
- **Structured Logging**: Logs centralisés et analysables

---

## 1. Audit Trail System

### Model: AdminAuditLog

Table pour enregistrer toutes les actions administrateur:

```python
class AdminAuditLog(db.Model):
    log_id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, nullable=False, index=True)
    admin_email = db.Column(db.String(255), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # 'approve', 'reject', etc
    resource_type = db.Column(db.String(50), nullable=False)  # 'user', 'listing'
    resource_id = db.Column(db.Integer)
    old_value = db.Column(db.JSON)  # Avant changement
    new_value = db.Column(db.JSON)  # Après changement
    status_code = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    reason = db.Column(db.String(500))  # Pour rejets/suppressions
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
```

### Décorateur @log_admin_action

Utilisé pour logger automatiquement les actions:

```python
from src.security import log_admin_action

@log_admin_action('approve', 'listing', 'listing_id')
def approve_listing(listing_id):
    # Action...
    return response
```

### Endpoints

#### GET /api/v1/admin/audit-logs

Récupérer les logs d'audit filtrés:

```bash
curl -X GET "http://localhost:5000/api/v1/admin/audit-logs?admin_id=5&action=approve&days=7&limit=50" \
  -H "Authorization: Bearer TOKEN"
```

**Paramètres**:
- `admin_id`: ID admin (optionnel)
- `action`: Type d'action (optionnel)
- `resource_type`: Type de ressource (optionnel)
- `days`: Remonter N jours (défaut: 30)
- `skip`: Offset (défaut: 0)
- `limit`: Limite par page (défaut: 100, max: 500)

**Réponse**:
```json
{
  "data": [
    {
      "log_id": 1,
      "admin_id": 5,
      "admin_email": "admin@immo2000.fr",
      "action": "approve",
      "resource_type": "listing",
      "resource_id": 123,
      "status_code": 200,
      "ip_address": "192.168.1.1",
      "user_agent": "...",
      "reason": null,
      "timestamp": "2024-01-15T10:30:00"
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 50,
    "total": 145
  }
}
```

#### GET /api/v1/admin/audit-logs/export

Exporter les logs en CSV:

```bash
curl -X GET "http://localhost:5000/api/v1/admin/audit-logs/export" \
  -H "Authorization: Bearer TOKEN" \
  -o audit-logs.csv
```

#### GET /api/v1/admin/security/status

Récupérer le statut de sécurité du système:

```bash
curl -X GET "http://localhost:5000/api/v1/admin/security/status" \
  -H "Authorization: Bearer TOKEN"
```

**Réponse**:
```json
{
  "status": "ok",
  "failed_actions_24h": 3,
  "suspicious_ips": [
    {
      "ip": "192.168.1.10",
      "failed_count": 6
    }
  ],
  "top_active_admins": [
    {
      "admin_id": 5,
      "email": "admin@immo2000.fr",
      "actions": 145
    }
  ]
}
```

---

## 2. Rate Limiting

### Configuration

Rate limiting par IP et par utilisateur:

```python
from src.security import apply_rate_limit

@apply_rate_limit(max_requests=100, window_seconds=3600)
@admin_required
def expensive_operation():
    # Cette opération est limitée à 100 requêtes par heure
    pass
```

### Table: RateLimitLog

```sql
CREATE TABLE rate_limit_log (
    log_id SERIAL PRIMARY KEY,
    identifier VARCHAR(100),  -- IP ou user_id
    endpoint VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Réponse quand rate-limited

Status HTTP 429:

```json
{
  "code": 429,
  "error": "Trop de requêtes. Veuillez réessayer plus tard.",
  "success": false,
  "remaining_requests": 0
}
```

---

## 3. Input Validation & Sanitization

### Modèles Pydantic

Validation stricte des inputs:

```python
from src.security.validation import (
    RoleChangeRequest,
    SuspendUserRequest,
    ListingRejectionRequest,
    SettingsUpdateRequest,
    DeleteUserRequest
)

@app.route('/user/<id>/role', methods=['POST'])
def change_role(id):
    data = RoleChangeRequest(**request.json)
    # data.new_role est validé et sûr
```

### Sanitization (XSS Protection)

```python
from src.security.validation import SanitizedStr

# Échappe automatiquement les caractères HTML
text = SanitizedStr.validate("<script>alert('xss')</script>")
# Résultat: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
```

### Validation Email, Téléphone, URL

```python
from src.security.validation import validate_email, validate_phone, validate_url

validate_email("admin@immo2000.fr")  # True
validate_phone("+33612345678")      # True
validate_url("https://immo2000.fr") # True
```

---

## 4. Data Encryption

### Chiffrement des données sensibles

Pour les champs contenant des données sensibles:
- `offres.conditions` (détails des négociations)
- `audit_logs.reason` (raisons des actions)
- Messages confidentiels

### Utilisation

```python
from src.security import encrypt_reason, decrypt_reason
from src.security import encrypt_conditions, decrypt_conditions

# Encrypter une raison de rejet
encrypted = encrypt_reason("Photos insuffisantes")
# Later...
original = decrypt_reason(encrypted)

# Encrypter des conditions
conditions = {"prix_final": 250000, "date_clôture": "2024-01-31"}
encrypted = encrypt_conditions(conditions)
# Later...
original = decrypt_conditions(encrypted)
```

### Clé d'encryption

```bash
# Générer une clé
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Ajouter au .env
ENCRYPTION_KEY=your_generated_key_here
```

---

## 5. Structured Logging

### Logs Structurés (JSON)

Tous les logs admin sont en format JSON pour faciliter l'analyse:

```json
{
  "timestamp": "2024-01-15T10:30:00.123456",
  "level": "INFO",
  "logger": "admin.audit",
  "message": "Admin action: approve on listing",
  "admin_id": 5,
  "admin_email": "admin@immo2000.fr",
  "action": "approve",
  "resource_type": "listing",
  "resource_id": 123,
  "status_code": 200,
  "ip_address": "192.168.1.1"
}
```

### Fichiers de logs

- `logs/admin.log`: Toutes les actions admin (JSON)
- `logs/audit.log`: Audit trail détaillé (JSON)
- `logs/error.log`: Erreurs et warnings
- `logs/*.log.N`: Fichiers archivés (rotation)

### Configuration

```python
from src.logging_config import loggers

# Utiliser
loggers['audit'].info('Action importante', extra={
    'user_id': 5,
    'action': 'delete_user',
    'target_user_id': 10
})
```

---

## 6. Mise à jour des Endpoints Existants

### Intégration de l'Audit

Tous les endpoints modifiant des données doivent logger:

```python
@admin_bp.route("/admin/listings/<int:listing_id>/approve", methods=["POST"])
@log_admin_action('approve', 'listing', 'listing_id')
def approve_listing(listing_id):
    # ... implementation
```

### Validation des Inputs

```python
from src.security.validation import validate_request_data

@admin_bp.route("/admin/users/<int:user_id>/suspend", methods=["POST"])
def suspend_user(user_id):
    data = validate_request_data(
        request.json,
        required_fields=['duration_hours'],
        allowed_fields=['duration_hours', 'reason']
    )
    # data est sûr à utiliser
```

---

## 7. Configuration de sécurité

### .env

```
# Encryption
ENCRYPTION_KEY=your_generated_key_here

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=3600

# Audit Logging
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=365
```

### Variables d'environnement de déploiement

```
# Production
FLASK_ENV=production
DEBUG=false
ENCRYPTION_KEY=<generate_new_key>
SECRET_KEY=<strong_secret_key>
```

---

## 8. Tests

### Tests d'Audit

```python
def test_audit_log_created_on_action():
    # Effectuer une action
    response = client.post('/api/v1/admin/listings/123/approve',
                          headers=admin_headers)

    # Vérifier que le log a été créé
    log = AdminAuditLog.query.filter_by(
        admin_id=5,
        action='approve',
        resource_type='listing'
    ).first()

    assert log is not None
    assert log.resource_id == 123
    assert log.status_code == 200
```

### Tests de Rate Limiting

```python
def test_rate_limit_429():
    for i in range(101):
        response = client.get('/api/v1/admin/dashboard',
                             headers=admin_headers)

    assert response.status_code == 429
    assert response.json['error'].find('Trop de requêtes') >= 0
```

### Tests de Validation

```python
def test_sanitization_xss():
    from src.security.validation import sanitize_input

    malicious = "<script>alert('xss')</script>"
    safe = sanitize_input(malicious)

    assert '<script>' not in safe
    assert 'alert' in safe  # Texte reste mais échappé
```

---

## 9. Procédure de déploiement

### 1. Installation des dépendances

```bash
pip install cryptography>=41.0.7
pip install pydantic>=2.5.0
```

### 2. Créer les tables

```bash
python backend/migrations/task3_security.py
```

ou via alembic:

```bash
cd backend
alembic upgrade head
```

### 3. Générer la clé d'encryption

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Ajouter au .env: ENCRYPTION_KEY=...
```

### 4. Redémarrer le serveur

```bash
docker-compose restart immo2000_backend
```

### 5. Vérifier

```bash
# Consulter le statut de sécurité
curl http://localhost:5000/api/v1/admin/security/status \
  -H "Authorization: Bearer TOKEN"

# Consulter les logs d'audit
curl http://localhost:5000/api/v1/admin/audit-logs \
  -H "Authorization: Bearer TOKEN"

# Vérifier les fichiers de log
tail -f logs/admin.log
tail -f logs/audit.log
```

---

## 10. Checklist d'implémentation

- [ ] Tables audit_logs et rate_limit_log créées
- [ ] AdminAuditLog model fonctionnel
- [ ] Endpoints d'audit implémentés (GET /audit-logs, export, status)
- [ ] Rate limiting appliqué aux endpoints critiques
- [ ] Validation Pydantic appliquée à tous les inputs
- [ ] Encryption configurée pour données sensibles
- [ ] Logging structuré en JSON pour audit trail
- [ ] Tests passent pour tous les scénarios de sécurité
- [ ] Documentation complète et déploiement validé
- [ ] Clé d'encryption générée et stockée de manière sécurisée

---

**Status**: Task 3 - En cours d'implémentation ⚙️
