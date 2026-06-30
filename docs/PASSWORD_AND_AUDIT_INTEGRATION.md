# 🔐 Password Policy & Audit Logs - Integration Guide

## Quick Start

### 1. Password Validation dans Auth Routes

```python
# backend/src/routes/auth.py
from backend.src.validators.password import PasswordValidator
from flask import request, jsonify

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user with strong password validation."""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Validate password strength
    is_valid, message = PasswordValidator.validate(password)
    if not is_valid:
        return {'error': message}, 400

    # Rest of registration logic...
    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return {'message': 'User created successfully'}, 201


@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """Change password with validation."""
    data = request.json
    new_password = data.get('new_password')

    # Detailed validation with score
    result = PasswordValidator.validate_with_score(new_password)

    if not result['is_valid']:
        return {
            'error': result['message'],
            'score': result['score'],
            'strength': result['strength'],
            'requirements': result['requirements'],
        }, 400

    # Update password
    user = User.query.get(g.user_id)
    user.set_password(new_password)
    db.session.commit()

    return {
        'message': 'Password changed successfully',
        'strength': result['strength']
    }, 200
```

---

### 2. Audit Logging dans Routes Existantes

#### Méthode A: Decorator Simple
```python
from backend.src.decorators.audit import audit_action
from backend.src.models.audit import AuditActionType

@app.route('/api/v1/listings/create', methods=['POST'])
@token_required
@audit_action(AuditActionType.LISTING_CREATE, 'listing')
def create_listing():
    """Create a new listing."""
    # ... existing code
    pass
```

#### Méthode B: Decorator avec Resource ID
```python
@app.route('/api/v1/listings/<int:listing_id>/update', methods=['PUT'])
@token_required
@audit_action_detailed(
    AuditActionType.LISTING_UPDATE,
    'listing',
    extract_resource_id=lambda args, kwargs, result: kwargs.get('listing_id')
)
def update_listing(listing_id):
    """Update a listing."""
    # ... existing code
    pass
```

#### Méthode C: Tracking des Changes
```python
@app.route('/api/v1/users/<int:user_id>/update', methods=['PUT'])
@token_required
@track_changes(
    AuditActionType.USER_UPDATE,
    'user',
    get_old_value=lambda: {'email': current_user.email},
    get_new_value=lambda: {'email': request.json['email']}
)
def update_user(user_id):
    """Update user profile."""
    # ... existing code
    pass
```

---

## 3. Voir les Logs en Admin

### API Endpoints

```bash
# Get all audit logs
curl -H "Authorization: Bearer $TOKEN" \
  https://immo2000.fr/api/v1/admin/audit/logs

# Get logs for specific user
curl -H "Authorization: Bearer $TOKEN" \
  https://immo2000.fr/api/v1/admin/audit/logs/user/1

# Get audit statistics
curl -H "Authorization: Bearer $TOKEN" \
  https://immo2000.fr/api/v1/admin/audit/stats

# Get security events
curl -H "Authorization: Bearer $TOKEN" \
  https://immo2000.fr/api/v1/admin/audit/security-events

# Export audit logs as CSV
curl -H "Authorization: Bearer $TOKEN" \
  https://immo2000.fr/api/v1/admin/audit/export > audit_logs.csv
```

### Filtrage

```bash
# Logs for last 7 days
curl -H "Authorization: Bearer $TOKEN" \
  "https://immo2000.fr/api/v1/admin/audit/logs?start_date=2024-06-19&end_date=2024-06-26"

# Only failed logins
curl -H "Authorization: Bearer $TOKEN" \
  "https://immo2000.fr/api/v1/admin/audit/logs?action=login_failed&status=failure"

# Specific user activity
curl -H "Authorization: Bearer $TOKEN" \
  "https://immo2000.fr/api/v1/admin/audit/logs?user_id=5"

# Pagination
curl -H "Authorization: Bearer $TOKEN" \
  "https://immo2000.fr/api/v1/admin/audit/logs?page=2&per_page=100"
```

---

## 4. Intégration au Backend

### Step 1: Register Blueprint
```python
# backend/src/app.py
from backend.src.routes.admin_audit import audit_bp

app.register_blueprint(audit_bp)
```

### Step 2: Create Database Tables
```bash
# Generate migration
flask db migrate -m "Add audit logs and security events"

# Apply migration
flask db upgrade
```

### Step 3: Update Requirements (if needed)
```
# Already included in requirements.txt
SQLAlchemy>=1.4.0
Flask-SQLAlchemy>=2.5.0
```

---

## 5. Testing

```bash
# Run password validation tests
pytest backend/tests/test_password_and_audit.py::TestPasswordValidator -v

# Run audit logging tests
pytest backend/tests/test_password_and_audit.py::TestAuditLogging -v

# Run all tests
pytest backend/tests/test_password_and_audit.py -v
```

---

## 6. Monitor Audit Logs

### Common Queries

```python
# Get all failed logins in last 24h
from datetime import datetime, timedelta
from backend.src.models.audit import AuditLog, AuditActionType

last_24h = datetime.utcnow() - timedelta(days=1)
failed_logins = AuditLog.query.filter(
    AuditLog.action == AuditActionType.LOGIN_FAILED,
    AuditLog.created_at >= last_24h
).all()

for login in failed_logins:
    print(f"Failed login from {login.ip_address} for user {login.user_id}")


# Find suspicious activity (multiple failures from same IP)
suspicious_ips = db.session.query(
    AuditLog.ip_address,
    db.func.count(AuditLog.id).label('failure_count')
).filter(
    AuditLog.action == AuditActionType.LOGIN_FAILED,
    AuditLog.created_at >= last_24h
).group_by(AuditLog.ip_address).having(
    db.func.count(AuditLog.id) > 5
).all()

for ip, count in suspicious_ips:
    print(f"IP {ip} has {count} failed login attempts")
```

---

## 7. Password Requirements Checklist

Users must create passwords with:
- ✅ Minimum 12 characters
- ✅ At least 1 UPPERCASE letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*(),.?":{}|<>)
- ✅ No spaces
- ✅ No 4+ repeating characters
- ✅ Not in common password blocklist

### Examples

✅ Valid:
- `SecurePass123!@`
- `MyP@ssw0rd2024`
- `Immo2000#RealEstate`

❌ Invalid:
- `password123` (too common)
- `Pass1!` (too short)
- `PASS1!` (no lowercase)
- `pass1!` (no uppercase)
- `Pass!@#$` (no numbers)
- `Pass1111!` (too many repeats)

---

## 8. Audit Log Retention Policy

Logs are stored permanently for compliance, but can be archived:

```python
# Archive old logs (older than 90 days)
from datetime import datetime, timedelta

cutoff_date = datetime.utcnow() - timedelta(days=90)
old_logs = AuditLog.query.filter(AuditLog.created_at < cutoff_date).all()

# Export to CSV/S3 before deleting
# (Implementation left to operations team)
```

---

## 9. Security Best Practices

✅ DO:
- Review audit logs regularly
- Set up alerts for suspicious activity (brute force, permission denied)
- Archive logs older than 90 days
- Restrict admin access to audit logs
- Use strong authentication for admin panel

❌ DON'T:
- Share audit log access with non-admin users
- Delete audit logs (they're legally required)
- Ignore security events
- Ignore repeated failed logins

---

## 10. Monitoring & Alerts

### Set up alerts for:
1. **Failed Logins**: > 5 failures from same IP in 1 hour
2. **Admin Actions**: All admin deletions and updates
3. **Data Export**: All data export requests
4. **Permission Denied**: Multiple permission denied attempts
5. **Unusual Times**: Logins outside business hours

Example:

```python
# Check for brute force attempt
failed_attempts = AuditLog.query.filter(
    AuditLog.action == AuditActionType.LOGIN_FAILED,
    AuditLog.ip_address == "192.168.1.100",
    AuditLog.created_at >= datetime.utcnow() - timedelta(hours=1)
).count()

if failed_attempts > 5:
    # ALERT: Possible brute force attack
    create_security_event(
        event_type="brute_force",
        severity="high",
        description=f"Brute force attempt from {ip_address}",
        ip_address="192.168.1.100"
    )
    # Consider blocking IP
```

---

## Done ✅

Password Policy + Audit Logs are now ready to deploy!

- Run migrations: `flask db upgrade`
- Register routes: Add blueprint to app.py
- Test: `pytest backend/tests/test_password_and_audit.py -v`
- Deploy to staging first
- Monitor audit logs in production
