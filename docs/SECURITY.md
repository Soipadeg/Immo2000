# 🔐 Security Guide - Immo2000

**Version**: 2.0.0
**Status**: ✅ PRODUCTION READY
**Last Updated**: 2026-06-09
**Compliance**: GDPR, Security Best Practices

---

## 📖 Table of Contents

1. [Security Overview](#-security-overview)
2. [Authentication & Authorization](#-authentication--authorization)
3. [Two-Factor Authentication (2FA)](#-two-factor-authentication-2fa)
4. [Identity Verification](#-identity-verification)
5. [GDPR Compliance](#-gdpr-compliance)
6. [Audit & Logging](#-audit--logging)
7. [Threat Detection](#-threat-detection)
8. [XSS Protection](#-xss-protection)
9. [Rate Limiting](#-rate-limiting)
10. [HTTP Security Headers](#-http-security-headers)
11. [Security Implementation Guide](#-security-implementation-guide)
12. [Security Fixes & Migration](#-security-fixes--migration)
13. [Best Practices](#-best-practices)

---

## 🌐 Security Overview

Immo2000 implements a comprehensive security system including:

| Feature | Status | Description |
|---------|--------|-------------|
| ✅ **JWT Authentication** | ✅ Implemented | Token-based authentication with expiration |
| ✅ **Two-Factor Authentication (2FA)** | ✅ Implemented | TOTP-based 2FA with Google/Microsoft Authenticator |
| ✅ **Identity Verification** | ✅ Implemented | Yousign/Veriff integration for KYC |
| ✅ **GDPR Compliance** | ✅ Implemented | Full GDPR compliance (access, delete, export, rectify) |
| ✅ **Audit Logging** | ✅ Implemented | Complete logging of all sensitive actions |
| ✅ **Threat Detection** | ✅ Implemented | Automated detection of suspicious activities |
| ✅ **XSS Protection** | ✅ Implemented | Input sanitization and output encoding |
| ✅ **Rate Limiting** | ✅ Implemented | Protection against brute force attacks |
| ✅ **HTTP Security Headers** | ✅ Implemented | HSTS, CSP, X-Frame-Options, etc. |
| ✅ **Data Encryption** | ✅ Implemented | Encryption of sensitive data at rest |
| ✅ **Secure Session Management** | ✅ Implemented | Secure, HttpOnly, SameSite cookies |

---

## 🔑 Authentication & Authorization

### JWT Token-Based Authentication

**Implementation:**
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Token Expiration**: 24 hours (configurable)
- **Refresh Token Expiration**: 7 days (configurable)
- **Storage**: Client-side (localStorage or cookies)

**User Roles:**
| Role | Description | Permissions |
|------|-------------|-------------|
| `UTILISATEUR` | Buyer/Seller | View/list/create own data |
| `NOTAIRE` | Notary Professional | View own dossiers, manage transactions |
| `ADMINISTRATEUR` | System Admin | Full access, user management, audit |

**Authentication Flow:**
```
User → POST /auth/login (email + password)
      ↓
Server validates credentials
      ↓
Generate JWT token
      ↓
Return {access_token, user_id, role}
      ↓
Client stores token
      ↓
All requests include: Authorization: Bearer <token>
```

**Token Verification:**
```python
from jwt import decode, ExpiredSignatureError, InvalidTokenError

try:
    payload = decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    user_id = payload['sub']
    role = payload['role']
except ExpiredSignatureError:
    return {"error": "Token expired"}, 401
except InvalidTokenError:
    return {"error": "Invalid token"}, 401
```

### Password Security

**Hashing:**
- **Algorithm**: bcrypt
- **Rounds**: 12 (configurable)
- **Salt**: Automatic per password

**Implementation:**
```python
from werkzeug.security import generate_password_hash, check_password_hash

# Hash password
password_hash = generate_password_hash(password, method='bcrypt', salt_length=12)

# Verify password
check_password_hash(password_hash, password)
```

---

## 🔐 Two-Factor Authentication (2FA)

### Overview

- **Type**: TOTP (Time-based One-Time Password)
- **Code Duration**: 30 seconds
- **Backup Codes**: 10 codes generated on activation
- **Supported Apps**: Google Authenticator, Microsoft Authenticator, Authy
- **Secret Storage**: Database (encrypted in production)

### User Flow

```
1. User accesses /security/profile
2. Clicks "Enable 2FA"
3. Redirects to /security/2fa/setup
4. Scans QR code with authenticator app
5. Enters generated code
6. Confirmation and display of backup codes
7. 2FA required for subsequent logins
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/security/2fa/setup` | Generate secret + QR code |
| POST | `/api/v1/security/2fa/setup` | Activate 2FA |
| POST | `/api/v1/security/2fa/disable` | Disable 2FA |
| POST | `/api/v1/security/2fa/verify` | Verify 2FA code on login |

### Implementation

```python
import pyotp
import qrcode
from io import BytesIO
import base64

# Generate TOTP secret
secret = pyotp.random_base32()

# Create TOTP object
totp = pyotp.TOTP(secret, interval=30)

# Generate QR code URL
qr_uri = totp.provisioning_uri(
    name="user@example.com",
    issuer_name="Immo2000"
)

# Generate QR code image
def generate_qr_code(uri):
    img = qrcode.make(uri)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()

# Verify code
totp.verify(user_code, valid_window=1)  # Allows 1 code before/after

# Generate backup codes
backup_codes = [pyotp.random_base32() for _ in range(10)]
```

### Database Schema

```sql
CREATE TABLE security_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES utilisateurs(utilisateur_id),
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_backup_codes JSONB,  -- Array of backup codes
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🆔 Identity Verification

### Overview

- **Providers**: Yousign (France) or Veriff (International)
- **Document Types**: Passport, ID Card, Driving License
- **Validity**: 5 years after verification
- **Webhooks**: Status callbacks (approved/rejected/expired)
- **Logs**: Complete history in `identity_verification_logs`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/security/identity/start` | Start verification (Yousign/Veriff) |
| POST | `/api/v1/security/identity/callback` | Verification webhook |
| GET | `/api/v1/security/identity/status` | Check verification status |

### Yousign Integration

```python
import requests
import json

# Start verification
response = requests.post(
    "https://api.yousign.com/procedure/create",
    headers={
        "Authorization": f"Bearer {YOUSIGN_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "name": "Identity Verification",
        "description": "KYC for Immo2000",
        "type": "sign",
        "files": [{
            "name": "user-document",
            "type": "signature"
        }],
        "members": [{
            "email": user.email,
            "firstname": user.prenom,
            "lastname": user.nom,
            "phone": user.telephone
        }],
        "archive": False
    }
)

# Response includes redirect URL
data = response.json()
redirect_url = data["url"]
procedure_id = data["id"]
```

### Veriff Integration

```python
response = requests.post(
    "https://api.veriff.me/v1/sessions",
    headers={
        "Authorization": f"Bearer {VERIFF_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "vendorData": user.id,
        "callback": "https://yourdomain.com/api/v1/security/identity/callback",
        "person": {
            "firstName": user.prenom,
            "lastName": user.nom
        }
    }
)

data = response.json()
redirect_url = data["url"]
verification_id = data["id"]
```

### Database Schema

```sql
CREATE TABLE identity_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES utilisateurs(utilisateur_id),
    provider VARCHAR(50) NOT NULL,  -- 'yousign' or 'veriff'
    provider_id VARCHAR(255) NOT NULL,  -- Provider's verification ID
    status VARCHAR(50) NOT NULL,  -- 'pending', 'approved', 'rejected', 'expired'
    document_type VARCHAR(50),  -- 'passport', 'id_card', 'driving_license'
    document_number VARCHAR(100),
    document_country VARCHAR(100),
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,  -- 5 years after verification
    rejection_reason TEXT,
    metadata JSONB,  -- Additional provider-specific data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE identity_verification_logs (
    id SERIAL PRIMARY KEY,
    identity_verification_id INTEGER REFERENCES identity_verifications(id),
    action VARCHAR(100) NOT NULL,  -- 'created', 'submitted', 'approved', 'rejected'
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 📋 GDPR Compliance

Immo2000 is fully GDPR compliant with all required data subject rights.

### Data Subject Rights

| Right | Endpoint | Description | Deadline |
|-------|----------|-------------|----------|
| Access | `POST /api/v1/security/rgpd/export-data` | Get all personal data | 30 days |
| Rectification | `PATCH /api/v1/utilisateurs/{id}` | Update personal data | Immediate |
| Erasure (Right to be Forgotten) | `POST /api/v1/security/rgpd/delete-account` | Delete account | 30 days |
| Portability | `POST /api/v1/security/rgpd/export-data` | Export data in standard format | 30 days |
| Object | Various | Object to processing | Immediate |
| Restrict Processing | Various | Restrict processing | Immediate |

### Data Export

**Endpoint:** `POST /api/v1/security/rgpd/export-data`

**Process:**
1. User requests data export
2. System collects all user data
3. Data packaged in JSON/CSV format
4. Download link sent via email
5. Link expires after 7 days

**Exported Data:**
- User profile (nom, prenom, email, telephone, adresse)
- Transaction history
- Signed documents
- Connection history
- Preferences and settings
- Messages and conversations
- Offers and listings

### Account Deletion (Right to be Forgotten)

**Endpoint:** `POST /api/v1/security/rgpd/delete-account`

**Process:**
1. User requests account deletion
2. Confirmation token sent via email
3. User confirms via email link
4. Account anonymized (not deleted, for legal compliance)
5. Account deactivated after 30 days
6. Data retained for 6 years (legal requirement)

**Anonymization:**
```python
# Anonymize user data
user.email = f"deleted_{user.id}@immo2000.fr"
user.nom = f"Deleted User {user.id}"
user.prenom = "Anonymized"
user.telephone = None
user.adresse_contact = None
user.auth_method = "deleted"
user.mot_de_passe_hash = None  # Clear password
user.actif = False
user.updated_at = datetime.utcnow()
```

### Data Rectification

**Endpoint:** `PATCH /api/v1/utilisateurs/{id}`

**Process:**
- All user data updates logged in audit_logs
- Previous values stored for history
- Changes take effect immediately

### Consent Management

**Implementation:**
- Consent stored in database
- Consent versioning for audit trail
- Easy withdrawal mechanism
- Granular consent (marketing, analytics, etc.)

**Database Schema:**
```sql
CREATE TABLE user_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES utilisateurs(utilisateur_id),
    consent_type VARCHAR(100) NOT NULL,  -- 'marketing', 'analytics', 'terms', 'privacy'
    consent_version VARCHAR(50) NOT NULL,  -- Version of terms/privacy policy
    granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP,
    withdrawn_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Audit & Logging

### Audit Logs

All sensitive actions are logged in the `audit_logs` table.

**Database Schema:**
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(utilisateur_id),
    action VARCHAR(100) NOT NULL,          -- LOGIN, DELETE_DATA, SIGN_DOCUMENT, etc.
    action_category VARCHAR(50) NOT NULL, -- 'auth', 'data', 'transaction', 'admin', 'security'
    resource_type VARCHAR(50),           -- 'user', 'transaction', 'listing', 'offer', 'document'
    resource_id INTEGER,
    old_value JSONB,                     -- Previous state (for updates)
    new_value JSONB,                     -- New state (for updates/deletes)
    details JSONB,
    status VARCHAR(20) NOT NULL,         -- 'success', 'failed', 'attempted'
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    country_code VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(50),             -- 'desktop', 'mobile', 'tablet'
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_user ON audit_logs(utilisateur_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_status ON audit_logs(status);
CREATE INDEX idx_audit_risk ON audit_logs(risk_level);
```

### Tracked Actions

| Category | Action | Risk Level | Description |
|----------|--------|------------|-------------|
| auth | LOGIN | low | Successful login |
| auth | LOGIN_2FA | medium | 2FA verification during login |
| auth | FAILED_LOGIN | medium | Failed login attempt |
| auth | FAILED_2FA | high | Failed 2FA attempt |
| auth | LOGOUT | low | User logout |
| data | DELETE_DATA | high | User requested data deletion |
| data | EXPORT_DATA | medium | User requested data export |
| data | UPDATE_PROFILE | low | User updated profile |
| security | ENABLE_2FA | medium | User enabled 2FA |
| security | DISABLE_2FA | medium | User disabled 2FA |
| security | START_IDENTITY_VERIFICATION | medium | Started identity verification |
| security | COMPLETE_IDENTITY_VERIFICATION | high | Completed identity verification |
| transaction | CREATE_TRANSACTION | medium | New transaction created |
| transaction | SIGN_DOCUMENT | high | Document signed |
| transaction | PAYMENT | high | Payment processed |
| admin | CREATE_USER | medium | Admin created user |
| admin | DELETE_USER | high | Admin deleted user |
| admin | UPDATE_USER | medium | Admin updated user |

### Logging Implementation

```python
from src.security.audit import AuditLogger

# Log an action
audit = AuditLogger(user_id, request)
audit.log_action(
    action="CREATE_TRANSACTION",
    action_category="transaction",
    resource_type="transaction",
    resource_id=transaction_id,
    details={"amount": amount, "type": transaction_type},
    status="success"
)

# Log with old/new values for updates
audit.log_update(
    action="UPDATE_PROFILE",
    action_category="data",
    resource_type="user",
    resource_id=user_id,
    old_value={"email": old_email},
    new_value={"email": new_email},
    status="success"
)

# Log failed attempt
audit.log_action(
    action="FAILED_LOGIN",
    action_category="auth",
    details={"reason": "invalid_password"},
    status="failed",
    risk_level="medium"
)
```

---

## 🚨 Threat Detection

### Alert System

The system automatically detects and responds to suspicious activities.

**Detected Threats:**

```python
from src.security.audit import ThreatDetector

detector = ThreatDetector()

# Failed login attempts
if detector.detect_brute_force(user_id, ip_address):
    action = "lock_account_temporarily"
    severity = "high"
    alert = detector.create_alert(
        alert_type="BRUTE_FORCE_ATTEMPT",
        user_id=user_id,
        ip_address=ip_address,
        severity=severity,
        action_taken=action
    )

# Unusual IPs
if detector.detect_unusual_ip(user_id, ip_address, country_code):
    severity = "medium"
    action = "require_2fa_verification"
    alert = detector.create_alert(
        alert_type="UNUSUAL_LOCATION",
        user_id=user_id,
        ip_address=ip_address,
        country_code=country_code,
        severity=severity,
        action_taken=action
    )

# Rapid actions (possible automation)
if detector.detect_rapid_actions(user_id, actions_per_minute=10):
    severity = "high"
    action = "alert_user_and_lock"
    alert = detector.create_alert(
        alert_type="RAPID_ACTIONS",
        user_id=user_id,
        actions_count=actions_per_minute,
        severity=severity,
        action_taken=action
    )

# Multiple failed 2FA attempts
if detector.detect_2fa_brute_force(user_id, failed_attempts=3):
    severity = "critical"
    action = "lock_account"
    alert = detector.create_alert(
        alert_type="2FA_BRUTE_FORCE",
        user_id=user_id,
        failed_attempts=failed_attempts,
        severity=severity,
        action_taken=action
    )
```

**Alert Levels:**
| Level | Color | Response |
|-------|-------|----------|
| low | 🟢 | Log only |
| medium | 🟡 | Log + notify user |
| high | 🔴 | Log + notify user + temporary lock |
| critical | 🚨 | Log + notify user + permanent lock + admin alert |

**Database Schema:**
```sql
CREATE TABLE security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES utilisateurs(utilisateur_id),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,  -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    details JSONB,
    action_taken VARCHAR(100),
    ip_address VARCHAR(45),
    resolved BOOLEAN DEFAULT false,
    resolved_by INTEGER REFERENCES utilisateurs(utilisateur_id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_event_user ON security_events(user_id);
CREATE INDEX idx_security_event_type ON security_events(alert_type);
CREATE INDEX idx_security_event_severity ON security_events(severity);
CREATE INDEX idx_security_event_created ON security_events(created_at);
```

---

## 🛡️ XSS Protection

### Implementation

Immo2000 uses the `bleach` library for automatic input sanitization.

**Default Sanitization:**
```python
from src.security.auth_advanced import XSSProtection

# Clean user input
input_clean = XSSProtection.clean_input(user_input)

# With custom allowed tags
input_clean = XSSProtection.clean_input(
    user_input,
    allowed_tags=['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br']
)
```

**Decorator for Automatic Sanitization:**
```python
from src.security.auth_advanced import XSSProtection

@XSSProtection.clean_decorator
@app.route('/api/v1/messages', methods=['POST'])
def create_message():
    # request.json['text'] is automatically sanitized
    text = request.json['text']
    # Safe to use
    return {"status": "ok"}
```

**Manual Sanitization:**
```python
from bleach import clean

# Basic sanitization
clean_text = clean(
    user_input,
    tags=[],  # No HTML tags allowed
    attributes={},
    strip=True
)

# Allow some formatting
clean_text = clean(
    user_input,
    tags=['p', 'a', 'strong', 'em'],
    attributes={'a': ['href', 'title']},
    strip=False
)
```

**Output Encoding:**
```python
from markupsafe import escape
from flask import escape as flask_escape

# Automatic in Flask templates
{{ user_input }}  # Auto-escaped

# Manual escaping
safe_text = escape(user_input)

# For JSON responses
return json.dumps({"text": user_input})  # Safe, JSON encodes properly
```

---

## 🚦 Rate Limiting

### Implementation

Rate limiting protects against brute force attacks and abuse.

**Default Limits:**
- Login: 10 attempts per minute per IP
- API: 100 requests per hour per user
- RGPD: 1 request per day per user
- 2FA: 5 attempts per minute per user

**Configuration:**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Apply to specific routes
@app.route('/auth/login')
@limiter.limit("10 per minute")
def login():
    pass

@app.route('/api/v1/endpoint')
@limiter.limit("100 per hour")
def api_endpoint():
    pass

# Exempt health check
@app.route('/api/v1/health')
@limiter.exempt
def health_check():
    pass
```

**Custom Rate Limit:**
```python
from src.security.auth_advanced import RateLimiter

# Check if user/IP is rate limited
if RateLimiter.is_rate_limited(user_id, ip_address, action="login"):
    return {"error": "Too many attempts"}, 429
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🔐 HTTP Security Headers

### Implemented Headers

| Header | Value | Purpose |
|--------|-------|---------|
| **Strict-Transport-Security** | max-age=31536000; includeSubDomains; preload | Force HTTPS for 1 year |
| **Content-Security-Policy** | default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: | Restrict resource loading |
| **X-Content-Type-Options** | nosniff | Prevent MIME sniffing |
| **X-Frame-Options** | DENY | Prevent clickjacking |
| **X-XSS-Protection** | 1; mode=block | Enable browser XSS protection |
| **Referrer-Policy** | strict-origin-when-cross-origin | Control referrer information |
| **Permissions-Policy** | camera=(), microphone=(), geolocation=() | Restrict browser features |

### Implementation

```python
from flask_talisman import Talisman

# Configure security headers
Talisman(
    app,
    force_https=True if app.config.get('ENV') == 'production' else False,
    strict_transport_security=True,
    strict_transport_security_max_age=31536000,
    strict_transport_security_preload=True,
    strict_transport_security_include_subdomains=True,
    content_security_policy={
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:", "https:"],
        'font-src': ["'self'", "https:"],
        'connect-src': ["'self'", "https:"],
        'frame-ancestors': ["'none'"],
    },
    content_security_policy_nonce_in=['script-src'],
    x_content_type_options=True,
    x_frame_options='DENY',
    x_xss_protection=True,
    referrer_policy='strict-origin-when-cross-origin',
    permissions_policy=[
        ('camera', []),
        ('microphone', []),
        ('geolocation', []),
        ('payment', [])
    ]
)
```

### Cookie Security

```python
from flask import session

# Configure session cookie
app.config.update(
    SESSION_COOKIE_SECURE=True,  # Only send over HTTPS
    SESSION_COOKIE_HTTPONLY=True,  # Not accessible via JavaScript
    SESSION_COOKIE_SAMESITE='Lax',  # or 'Strict' for better security
    PERMANENT_SESSION_LIFETIME=3600,  # 1 hour
    SESSION_TYPE='redis',  # Store sessions in Redis
    SESSION_REDIS=redis.from_url(REDIS_URL)
)
```

---

## 🔧 Security Implementation Guide

---

### Step 1: Add Security Files

**Required Files:**
```
backend/
├── src/
│   ├── security/
│   │   ├── __init__.py
│   │   ├── auth_advanced.py    # 2FA, XSS, RateLimiter
│   │   ├── audit.py           # Audit logging, ThreatDetector
│   │   └── models.py          # Security models
│   │
│   ├── models/
│   │   └── security.py        # SQLAlchemy security models
│   │
│   └── routes/
│       └── security.py        # Security endpoints
```

### Step 2: Update app.py

```python
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from src.routes.security import security_bp
from src.models.security import (
    SecurityProfile, 
    AuditLog, 
    RGPDRequest, 
    IdentityVerificationLog, 
    SecurityEvent
)

def configure_security(app):
    # HTTPS and security headers
    Talisman(app,
        force_https=True if app.config.get('ENV') == 'production' else False,
        strict_transport_security=True,
        strict_transport_security_max_age=31536000,
        content_security_policy={
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", "data:", "https:"]
        }
    )

    # Rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )

    # Register blueprint
    app.register_blueprint(security_bp)

    return app

# Initialize
app = Flask(__name__)
app = configure_security(app)
```

### Step 3: Create Database Tables

```bash
# Using Alembic migrations
cd backend
flask db migrate -m "Add security and RGPD models"
flask db upgrade

# Or manually
python -c "
from src.app import app, db
from src.models.security import *
with app.app_context():
    db.create_all()
    print('✅ Security tables created')
"
```

### Step 4: Update User Model

```python
class User(db.Model):
    # ... existing fields ...

    # Security profile relationship
    security_profile = db.relationship('SecurityProfile', uselist=False, backref='user')

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
```

### Step 5: Configure Environment Variables

```env
# Security
SECRET_KEY=your-super-secret-key-32-chars-minimum
JWT_SECRET_KEY=your-jwt-secret-key-32-chars-minimum
SECRET_2FA_ENCRYPTION_KEY=your-2fa-encryption-key-32-bytes

# Rate Limiting
RATELIMIT_ENABLED=true
RATELIMIT_LOGIN=10 per minute
RATELIMIT_API=100 per hour
RATELIMIT_2FA=5 per minute

# Identity Verification (Optional)
# Choose one provider:
YOUSIGN_API_KEY=your-yousign-api-key
YOUSIGN_API_URL=https://api.yousign.com

# OR
VERIFF_API_KEY=your-veriff-api-key
VERIFF_API_URL=https://api.veriff.me

# RGPD
DPO_EMAIL=dpo@immo2000.fr
SUPPORT_EMAIL=support@immo2000.fr
RGPD_DATA_RETENTION_DAYS=30

# Security Headers
ENABLE_HSTS=true
HSTS_MAX_AGE=31536000
```

### Step 6: Install Dependencies

```bash
pip install pyotp==2.9.0 qrcode[pil]==8.2 cryptography==41.0.7 bleach==6.2.0 \
    requests==2.31.0 flask-limiter==3.3.1 flask-talisman==1.1.0
```

---

## ⚡ Security Fixes & Migration

---

### Critical Security Fixes

These fixes address urgent security vulnerabilities that must be applied immediately.

---

#### 🔴 Fix #1: Secure CORS Configuration (Critical)

**Problem:** `origins="*"` allows any website to access the API, enabling CSRF and data leakage attacks.

**Before:**
```python
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

**After:**
```python
import os

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5000"  # Default for development
).split(",")

CORS(app, resources={
    r"/api/*": {
        "origins": CORS_ALLOWED_ORIGINS,
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "supports_credentials": True
    },
    r"/auth/*": {
        "origins": CORS_ALLOWED_ORIGINS,
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "OPTIONS"],
        "supports_credentials": True
    },
    r"/health": {
        "origins": "*"  # Health check can be public
    }
})

# Also fix SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins=CORS_ALLOWED_ORIGINS,
    async_mode='threading',
    cors_credentials=True
)
```

**Environment Variable:**
```env
# Production
CORS_ALLOWED_ORIGINS=https://immo2000.com,https://www.immo2000.com

# Development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,http://localhost:5173
```

**Verification:**
```bash
# Check headers
curl -I http://localhost:8000/api/v1/health
# Should include: Access-Control-Allow-Origin: https://yourdomain.com
```

---

#### 🔴 Fix #2: Secure Default Secrets (Critical)

**Problem:** Hardcoded default secrets can be exploited if environment variables are not set.

**Before:**
```python
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'test-secret-key-very-secure-dev')
```

**After:**
```python
import secrets as _secrets

def _get_or_generate_secret(env_var: str, env_mode: str = None) -> str:
    """Get secret from environment or generate one."""
    value = os.getenv(env_var)
    if not value:
        if os.getenv("FLASK_ENV", "development") == "production":
            raise ValueError(
                f"❌ SECURITY ERROR: {env_var} MUST be set in production!\n"
                f"Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        # Dev mode: generate temporary secret
        return f"dev-{_secrets.token_urlsafe(32)}"
    return value

SECRET_KEY = _get_or_generate_secret("SECRET_KEY")
JWT_SECRET_KEY = _get_or_generate_secret("JWT_SECRET_KEY")
```

**Generate New Secrets:**
```bash
# Generate secure secrets
python3 << 'EOF'
import secrets

SECRET_KEY = secrets.token_urlsafe(32)
JWT_SECRET_KEY = secrets.token_urlsafe(32)
DB_PASSWORD = secrets.token_urlsafe(24)

print(f"SECRET_KEY={SECRET_KEY}")
print(f"JWT_SECRET_KEY={JWT_SECRET_KEY}")
print(f"DB_PASSWORD={DB_PASSWORD}")

# Save to .env
with open(".env.secrets", "w") as f:
    f.write(f"SECRET_KEY={SECRET_KEY}\n")
    f.write(f"JWT_SECRET_KEY={JWT_SECRET_KEY}\n")
    f.write(f"DB_PASSWORD={DB_PASSWORD}\n")

print("\n✅ Secrets generated")
EOF
```

**Update .env:**
```env
# Add generated secrets to .env
SECRET_KEY=your-generated-secret-key-32-chars
JWT_SECRET_KEY=your-generated-jwt-secret-32-chars
DB_PASSWORD=your-generated-db-password-24-chars
```

**Never commit secrets to version control!**

---

#### 🔴 Fix #3: Flask-Login CVE-2023-4879 (High)

**Problem:** Vulnerability in Flask-Login < 0.6.3 allows session fixation attacks.

**Solution:**
```bash
# Update Flask-Login to latest version
pip install --upgrade flask-login

# Or pin to secure version
pip install flask-login>=0.6.3
```

**Update requirements.txt:**
```txt
Flask-Login>=0.6.3
```

**Verification:**
```bash
pip show Flask-Login | grep Version
# Should show version >= 0.6.3
```

---

#### ⚠️ Fix #4: SQL Injection Protection (High)

**Problem:** Raw SQL queries without parameterization can lead to SQL injection.

**Before:**
```python
# VULNERABLE - SQL Injection
user_id = request.args.get('user_id')
query = f"SELECT * FROM users WHERE id = {user_id}"
result = db.engine.execute(query)
```

**After:**
```python
# SAFE - Using SQLAlchemy ORM
user_id = request.args.get('user_id')
user = User.query.get(user_id)

# OR using parameterized queries
query = "SELECT * FROM users WHERE id = :user_id"
result = db.engine.execute(query, user_id=user_id)
```

**Always use ORM or parameterized queries!**

---

#### ⚠️ Fix #5: Password Hashing Security (Medium)

**Problem:** Weak password hashing can be brute-forced.

**Before:**
```python
# VULNERABLE - SHA256 without salt
import hashlib
password_hash = hashlib.sha256(password.encode()).hexdigest()
```

**After:**
```python
# SAFE - bcrypt with automatic salt
from werkzeug.security import generate_password_hash, check_password_hash

# Hash password (automatic salt)
password_hash = generate_password_hash(password, method='bcrypt', salt_length=12)

# Verify password
check_password_hash(password_hash, password)
```

**Configuration:**
```python
# In config.py
BCRYPT_LOG_ROUNDS = 12  # Higher = more secure but slower
```

---

#### ⚠️ Fix #6: Session Security (Medium)

**Problem:** Session cookies can be stolen or manipulated.

**Before:**
```python
# VULNERABLE - Insecure session configuration
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_SAMESITE'] = None
```

**After:**
```python
# SAFE - Secure session configuration
app.config.update(
    SESSION_COOKIE_SECURE=True,  # Only send over HTTPS
    SESSION_COOKIE_HTTPONLY=True,  # Not accessible via JavaScript
    SESSION_COOKIE_SAMESITE='Lax',  # or 'Strict'
    PERMANENT_SESSION_LIFETIME=3600,  # 1 hour
    SESSION_TYPE='redis',  # Store sessions in Redis
    SESSION_REDIS=redis.from_url(REDIS_URL)
)
```

---

### Migration Checklist

| Task | File | Status |
|------|------|--------|
| Fix CORS configuration | `backend/src/app.py` | ✅ Required |
| Update default secrets | `backend/src/config.py` | ✅ Required |
| Update Flask-Login | `backend/requirements.txt` | ✅ Required |
| Review SQL queries | All backend files | ✅ Recommended |
| Update password hashing | Auth routes | ✅ Recommended |
| Configure secure sessions | `backend/src/app.py` | ✅ Recommended |
| Enable rate limiting | `backend/src/app.py` | ✅ Recommended |
| Add security headers | `backend/src/app.py` | ✅ Recommended |

---

## ✅ Best Practices

---

### Authentication

1. ✅ **Use Strong Password Policies**
   - Minimum 12 characters
   - Require uppercase, lowercase, numbers, special chars
   - Check against common passwords

2. ✅ **Implement Account Lockout**
   - Lock account after 5 failed attempts
   - Unlock after 15 minutes or manual reset

3. ✅ **Use Secure Password Reset**
   - Time-limited tokens (1 hour)
   - Single-use tokens
   - Email verification required

4. ✅ **Implement Session Timeout**
   - Inactivity timeout: 30 minutes
   - Absolute timeout: 8 hours
   - Require re-authentication for sensitive actions

5. ✅ **Use 2FA for Sensitive Actions**
   - Login (optional but recommended)
   - Payment processing
   - Document signing
   - Account changes

---

### Authorization

1. ✅ **Principle of Least Privilege**
   - Users have minimum required permissions
   - Regular permission reviews

2. ✅ **Implement Role-Based Access Control (RBAC)**
   - Clear role definitions
   - Role hierarchy
   - Permission inheritance

3. ✅ **Always Check Permissions**
   ```python
   @app.route('/admin/users')
   @admin_required  # Custom decorator
   def admin_users():
       pass
   ```

4. ✅ **Resource-Level Authorization**
   ```python
   @app.route('/api/v1/transactions/<int:transaction_id>')
   def get_transaction(transaction_id):
       transaction = Transaction.query.get(transaction_id)
       if not transaction:
           return {"error": "Not found"}, 404
       
       # Check if user owns the transaction
       if transaction.user_id != current_user.id:
           return {"error": "Unauthorized"}, 403
       
       return {"data": transaction}
   ```

---

### Data Protection

1. ✅ **Encrypt Sensitive Data at Rest**
   - Database encryption (TDE)
   - Application-level encryption for PII
   - Encrypted backups

2. ✅ **Mask Sensitive Data in Logs**
   ```python
   # Never log full sensitive data
   # BAD: logger.info(f"User password: {password}")
   # GOOD: logger.info(f"User {user_id} attempted login")
   
   # Use masking for partial data
   masked_email = f"{email[:2]}***{email[-2:]}"  # j***@example.com
   ```

3. ✅ **Implement Data Classification**
   - Public data: No restrictions
   - Internal data: Authentication required
   - Confidential data: 2FA required
   - Secret data: Admin only

4. ✅ **Regular Data Audits**
   - Review data retention policies
   - Delete unused data
   - Verify data access logs

---

### API Security

1. ✅ **Use HTTPS Everywhere**
   - Enforce HTTPS in production
   - Use HSTS headers
   - Redirect HTTP to HTTPS

2. ✅ **Validate All Input**
   - Use Pydantic models for request validation
   - Validate data types, lengths, formats
   - Reject malformed data

3. ✅ **Sanitize All Output**
   - Escape HTML in responses
   - Prevent XSS in JSON responses
   - Use proper encoding

4. ✅ **Implement Rate Limiting**
   - Limit login attempts
   - Limit API requests
   - Protect against DDoS

5. ✅ **Use CSRF Protection**
   - CSRF tokens for state-changing requests
   - SameSite cookie attribute
   - Origin header validation

---

### Monitoring & Incident Response

1. ✅ **Implement Comprehensive Logging**
   - Log all authentication events
   - Log all sensitive actions
   - Log errors and warnings

2. ✅ **Set Up Alerts**
   - Failed login attempts
   - High error rates
   - Suspicious activities
   - Service outages

3. ✅ **Regular Security Audits**
   - Quarterly penetration testing
   - Code reviews for security issues
   - Dependency vulnerability scanning

4. ✅ **Incident Response Plan**
   - Define incident severity levels
   - Document response procedures
   - Identify response team
   - Practice incident scenarios

5. ✅ **Disaster Recovery Plan**
   - Regular backups
   - Test backup restoration
   - Define RTO and RPO
   - Document recovery procedures

---

## 📚 Additional Resources

- [GDPR Official Website](https://gdpr-info.eu/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Python Security Best Practices](https://github.com/vhf/awesome-python-security)

---

**Documentation Version**: 2.0.0
**Last Updated**: 2026-06-09
**Status**: ✅ PRODUCTION READY
