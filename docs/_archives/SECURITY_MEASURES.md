# 🔐 Immo2000 - Mesures de Sécurité et Conformité RGPD

## Résumé Exécutif

Le système de sécurité complet de Immo2000 inclut:
- **2FA TOTP** - Double authentification basée sur le temps
- **Vérification d'Identité** - Intégration Yousign/Veriff
- **Conformité RGPD** - Droit d'accès, suppression, export de données
- **Audit & Monitoring** - Logging complet de toutes les actions sensibles
- **Protection XSS** - Sanitization des entrées utilisateur
- **Rate Limiting** - Protection contre les attaques par force brute
- **HTTP Security Headers** - HSTS, CSP, X-Frame-Options

## Composants Implémentés

### 1. 🔑 Double Authentification (2FA)

| Aspect | Détail |
|--------|--------|
| **Type** | TOTP (Time-based One-Time Password) |
| **Durée** | 30 secondes par code |
| **Codes de Secours** | 10 codes générés lors de l'activation |
| **Fournisseurs Supportés** | Google Authenticator, Microsoft Authenticator, Authy |
| **Stockage Secret** | Base de données (à chiffrer en production) |
| **Route Activastion** | `/api/v1/security/2fa/setup` |
| **Vérification Login** | `/api/v1/security/2fa/verify` |

**Flux Utilisateur:**
```
1. Utilisateur accède à /security/profile
2. Clique "Activer 2FA"
3. Redirection vers /security/2fa/setup
4. Scanne QR code avec son authenticateur
5. Rentre le code généré
6. Confirmation et affichage des codes de secours
```

### 2. ✓ Vérification d'Identité

| Aspect | Détail |
|--------|--------|
| **Fournisseurs** | Yousign (France) ou Veriff (International) |
| **Types de Documents** | Passport, ID Card, Driving License |
| **Durée Validité** | 5 années après vérification |
| **Webhooks** | Callbacks de statut (approved/rejected/expired) |
| **Logs** | Historique complet dans `identity_verification_logs` |
| **Route Démarrage** | `/api/v1/security/identity/start` |

**Intégration Yousign:**
```python
provider = "yousign"
# Appel API: POST https://api.yousign.com/procedure/create
# Retour: URL de redirection + ID de vérification
# Callback: POST /api/v1/security/identity/callback
```

### 3. 📋 Conformité RGPD

#### 3.1 Droit d'Accès aux Données
```
Route: POST /api/v1/security/rgpd/export-data
Statut: 'data_export'
Délai: 30 jours
Format: JSON/CSV
```

**Données Exportées:**
- Profil utilisateur (nom, email, téléphone, adresse)
- Historique de transactions
- Documents signés
- Historique de connexions
- Préférences et paramètres

#### 3.2 Droit à l'Oubli (Suppression)
```
Route: POST /api/v1/security/rgpd/delete-account
Statut: 'delete_account'
Délai: 30 jours (confirmation requise)
Anonymisation: Email -> "deleted_<id>@immo2000.fr"
```

**Processus:**
```
1. Utilisateur demande suppression
2. Token de confirmation envoyé par email
3. Utilisateur confirme via lien email
4. Compte anonymisé et désactivé après 30j
5. Données conservées pour conformité légale (6 ans)
```

#### 3.3 Droit de Rectification
```
Route: PATCH /api/v1/utilisateurs/<id>
Logs: Tous les changements enregistrés dans audit_logs
```

#### 3.4 Droit à la Portabilité
```
Route: POST /api/v1/security/rgpd/export-data
Format: JSON standard
Inclusion: Tous les champs, relations, documents
```

### 4. 📊 Audit & Logging

**Table: `audit_logs`**
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    utilisateur_id INTEGER,
    action VARCHAR(100),          -- LOGIN, DELETE_DATA, SIGN_DOCUMENT, etc.
    action_category VARCHAR(50),  -- 'auth', 'data', 'transaction', 'admin'
    resource_type VARCHAR(50),    -- 'user', 'transaction', 'listing', 'offer'
    resource_id INTEGER,
    details JSON,
    status VARCHAR(20),           -- 'success', 'failed', 'attempted'
    risk_level VARCHAR(20),       -- 'low', 'medium', 'high', 'critical'
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    country_code VARCHAR(2),
    timestamp DATETIME
);
```

**Actions Tracées:**
- ✅ LOGIN - Connexion réussie
- ✅ LOGIN_2FA - Vérification 2FA
- ✅ FAILED_2FA - Échec 2FA
- ✅ DELETE_DATA - Suppression de données
- ✅ EXPORT_DATA - Export de données
- ✅ DELETE_ACCOUNT - Suppression de compte
- ✅ ENABLE_2FA - Activation 2FA
- ✅ DISABLE_2FA - Désactivation 2FA
- ✅ START_IDENTITY_VERIFICATION - Démarrage vérification
- ✅ COMPLETE_IDENTITY_VERIFICATION - Vérification complétée
- ✅ CREATE_TRANSACTION - Création de transaction
- ✅ SIGN_DOCUMENT - Signature de document
- ✅ UPDATE_PROFILE - Modification de profil

### 5. 🚨 Détection des Menaces

**AlertSystem - Détecte:**
```python
# Tentatives de connexion échouées
if failed_logins > 5 in 24h:
    action = "lock_account"

# IPs inhabituelles
if ip not in recent_ips:
    severity = "medium"
    action = "require_verification"

# Actions rapides suspectes
if actions > 10 in 1 minute:
    severity = "high"
    action = "alert_user"
```

**Stockage: `security_events` table**

### 6. 🛡️ Protection XSS

```python
from src.security.auth_advanced import XSSProtection

# Sanitization automatique
input_clean = XSSProtection.clean_input(user_input)

# Ou via décorateur
@XSSProtection.clean_decorator
def create_post(text):
    # text est déjà sanitisé
    pass
```

**Utilisation de `bleach` library:**
- Suppression des tags HTML dangereux
- Whitelist des tags autorisés (p, a, strong, em, etc.)
- Échappement des attributs dangereux

### 7. 🔒 Rate Limiting

```python
from src.security.auth_advanced import RateLimiter

# Vérification par IP
if RateLimiter.is_rate_limited(ip):
    return "Trop de tentatives", 429

# Limites par défaut
- LOGIN: 10 tentatives par minute
- API: 100 requêtes par heure
- RGPD: 1 demande par jour
```

### 8. 🔐 Headers de Sécurité HTTP

| Header | Valeur | Objectif |
|--------|--------|----------|
| **HSTS** | max-age=31536000 | Force HTTPS |
| **CSP** | default-src 'self' | Prévient injections |
| **X-Frame-Options** | DENY | Prévient clickjacking |
| **X-Content-Type-Options** | nosniff | Prévient MIME sniffing |
| **X-XSS-Protection** | 1; mode=block | Prévient XSS |

Implémentation via Flask-Talisman.

## Architecture Sécurité

```
┌─────────────────────────────────────────┐
│         Frontend (React)                 │
│   ┌──────────────────────────────────┐   │
│   │ 2FA Setup | RGPD | Profile Sécurité│
│   └──────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │ HTTPS Only
┌──────────────────▼──────────────────────┐
│    Backend Sécurité (Flask)              │
│  ┌────────────────────────────────────┐  │
│  │ Routes: /api/v1/security/*          │  │
│  │ Rate Limiting | CORS | CSP Headers  │  │
│  │ XSS Protection | Input Validation   │  │
│  └────────────────────────────────────┘  │
│                    │                      │
│  ┌────────────────────────────────────┐  │
│  │ Utilitaires:                        │  │
│  │ - TwoFactorAuth (pyotp)             │  │
│  │ - IdentityVerification (API calls)  │  │
│  │ - XSSProtection (bleach)            │  │
│  │ - RateLimiter (IP-based)            │  │
│  │ - AuditLogger (async logging)       │  │
│  └────────────────────────────────────┘  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  Base de Données (PostgreSQL)            │
│  ┌────────────────────────────────────┐  │
│  │ Modèles:                           │  │
│  │ - SecurityProfile (2FA, vérif)     │  │
│  │ - AuditLog (actions, risques)      │  │
│  │ - RGPDRequest (export, suppression)│  │
│  │ - IdentityVerificationLog (vérif) │  │
│  │ - SecurityEvent (détection)        │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Checklist de Déploiement Production

### ✅ Avant le Déploiement

- [ ] Installer les dépendances: `pip install -r requirements.txt`
- [ ] Générer la clé de chiffrement 2FA
- [ ] Configurer les variables `.env`
- [ ] Créer les tables: `flask db upgrade`
- [ ] Tester les migrations en staging
- [ ] Configurer les webhooks (Yousign/Veriff)
- [ ] Mettre à jour DNS pour HTTPS
- [ ] Obtenir certificat SSL/TLS
- [ ] Configurer CORS pour domaines approuvés
- [ ] Revoir la politique de sécurité (CSP, HSTS)

### ✅ Configuration Production

```python
# app.py
ENVIRONMENT = 'production'
DEBUG = False
TESTING = False

# Security
HSTS_ENABLED = True
FORCE_HTTPS = True
SECURE_COOKIES = True
SECURE_COOKIE_HTTPONLY = True
SECURE_COOKIE_SECURE = True
SECURE_COOKIE_SAMESITE = 'Lax'

# Rate Limiting
RATELIMIT_STORAGE_URL = "redis://localhost:6379"
RATELIMIT_LOGIN = "5 per minute"
RATELIMIT_API = "50 per hour"
RATELIMIT_RGPD = "1 per day"

# Audit Logging
AUDIT_LOG_RETENTION_DAYS = 2555  # 7 ans
AUDIT_LOG_MIN_RISK_LEVEL = "low"
```

### ✅ Monitoring & Alerting

```python
# Mettre en place des alertes pour:
if AuditLog.query.filter(
    AuditLog.risk_level == 'critical',
    AuditLog.timestamp > datetime.utcnow() - timedelta(hours=1)
).count() > 0:
    send_security_alert()

if SecurityEvent.query.filter(
    SecurityEvent.severity == 'critical'
).count() > 0:
    send_admin_alert()
```

### ✅ Tests

```bash
# Tests de sécurité
pytest tests/test_security.py -v

# Test 2FA
pytest tests/test_security.py::test_2fa_setup

# Test RGPD
pytest tests/test_security.py::test_rgpd_export

# Test rate limiting
pytest tests/test_security.py::test_rate_limiting

# Test XSS protection
pytest tests/test_security.py::test_xss_protection
```

### ✅ Documentation

- [ ] Guide d'utilisateur final
- [ ] API documentation (Swagger)
- [ ] Procédure support (réinitialisation 2FA)
- [ ] Politique de sécurité
- [ ] Plan de réaction incidents

## Conformité Légale

### 🇫🇷 France
- **Signature Électronique**: Conforme eIDAS/ESID
- **RGPD**: Conforme EU 2016/679
- **Notaire**: Signature authentifiée par vérification d'identité

### 🇪🇺 Europe
- **RGPD**: Audits, consentement, droit à l'oubli
- **PCI-DSS**: Si stockage de paiements (externe recommandé)
- **HTTPS**: Obligatoire pour données personnelles

## Incidents de Sécurité

**Procédure en cas de détection:**

1. **Alert déclenché** → `SecurityEvent` créé avec `severity='critical'`
2. **Email alert** → Envoyé aux admins
3. **Logging** → `AuditLog` enregistré
4. **Action automatique** → Blocage IP, verrouillage compte, réinitialisation de session
5. **Investigation** → Consulter dashboard admin (à implémenter)
6. **Communication** → Notifier utilisateur si nécessaire

**Requête inspection:**
```python
# Consulter les événements critiques du jour
critical_events = SecurityEvent.query.filter(
    SecurityEvent.severity == 'critical',
    SecurityEvent.timestamp > datetime.utcnow() - timedelta(days=1)
).all()
```

## Ressources

- **2FA**: https://github.com/pyauth/pyotp
- **QR Codes**: https://github.com/lincolnloop/python-qrcode
- **Cryptographie**: https://cryptography.io
- **XSS Protection**: https://github.com/mozilla/bleach
- **RGPD**: https://ec.europa.eu/info/law/law-topic/data-protection_en
- **HTTP Security**: https://owasp.org/www-community/attacks/

## Support

**Pour les problèmes de sécurité:**
- Email: `security@immo2000.fr`
- Format: Décrivez le problème, donnez les étapes à reproduire, l'environnement

**Pour les questions RGPD:**
- Email: `dpo@immo2000.fr`
- Politique complète: `/docs/RGPD_POLICY.md`

---

**Version**: 1.0.0
**Date**: 2024
**Responsable**: Équipe Sécurité
**Révision**: Annuelle obligatoire
**Dernière mise à jour**: {{ now }}
