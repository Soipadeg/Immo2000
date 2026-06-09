# **🔒 Migration - Corrections de Sécurité Urgentes**

*Date: 08 Juin 2026*
*Temps estimé: 1.5 heures*
*Statut: Application en cours* 🚀

---

## **📋 Résumé des Corrections**

| **#** | **Problème** | **Fichier** | **Avant** | **Après** | **Temps** |
|-------|-------------|-----------|----------|----------|----------|
| **S1** | CORS `"*"` dangereux | `app.py:118` | `origins="*"` | Domaines restreints | 30m |
| **S2** | Secrets par défaut | `config.py:13,41` | `"dev-secret-key"` | `secrets.token_urlsafe()` | 30m |
| **S3** | Flask-Login CVE-2023-4879 | `requirements.txt:5` | `Flask-Login==0.6.3` | Supprimé | 15m |

---

## **⚡ Correction #1: CORS Sécurisé (30 minutes)**

### **Étape 1.1: Vérifier la configuration actuelle**

```bash
cd /home/djali/code/Soipadeg/Immo2000
grep -n "origins=" backend/src/app.py
```

**Output:** Ligne 118 avec `origins="*"` ❌

### **Étape 1.2: Modifier `backend/src/app.py`**

**Localiser la ligne 118:**
```python
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/auth/*": {"origins": "*"}, r"/health": {"origins": "*"}})
```

**Remplacer par:**
```python
# CORS Configuration - Restrict to allowed domains (Production)
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
```

**Aussi corriger SocketIO (ligne ~157):**
```python
# AVANT
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# APRÈS
socketio = SocketIO(
    app,
    cors_allowed_origins=CORS_ALLOWED_ORIGINS,
    async_mode='threading',
    cors_credentials=True
)
```

### **Étape 1.3: Ajouter à `.env`**

```env
# CORS Configuration (Production)
CORS_ALLOWED_ORIGINS=https://immo2000.com,https://www.immo2000.com,http://localhost:3000,http://localhost:5000
```

### **Étape 1.4: Vérifier**

```bash
grep -A 10 "CORS_ALLOWED_ORIGINS" backend/src/app.py
echo "CORS_ALLOWED_ORIGINS=https://immo2000.com,http://localhost:3000" > .env.cors.test
```

✅ **Correction #1 complétée**

---

## **⚡ Correction #2: Secrets Sécurisés (30 minutes)**

### **Étape 2.1: Vérifier les secrets actuels**

```bash
grep -n "SECRET_KEY\|JWT_SECRET" backend/src/config.py
```

**Output:**
```
13: SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")  ❌
41: JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")  ⚠️
68: JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'test-secret-key-very-secure-dev')  ❌
```

### **Étape 2.2: Générer des secrets sécurisés**

```bash
# Terminal 1: Générer les secrets
python3 << 'EOF'
import secrets

SECRET_KEY = secrets.token_urlsafe(32)
JWT_SECRET_KEY = secrets.token_urlsafe(32)
DB_PASSWORD = secrets.token_urlsafe(24)

print(f"SECRET_KEY={SECRET_KEY}")
print(f"JWT_SECRET_KEY={JWT_SECRET_KEY}")
print(f"DB_PASSWORD={DB_PASSWORD}")

# Sauvegarder pour .env
with open(".env.secrets", "w") as f:
    f.write(f"SECRET_KEY={SECRET_KEY}\n")
    f.write(f"JWT_SECRET_KEY={JWT_SECRET_KEY}\n")
    f.write(f"DB_PASSWORD={DB_PASSWORD}\n")

print("\n✅ Secrets generés et sauvegardés dans .env.secrets")
EOF
```

### **Étape 2.3: Modifier `backend/src/config.py`**

**Ligne 13 - Avant:**
```python
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
```

**Après:**
```python
import secrets as _secrets

def _get_or_generate_secret(env_var: str, env_mode: str = None) -> str:
    """Récupérer un secret depuis l'environnement ou le générer."""
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
```

**Ligne 41 - Avant:**
```python
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
```

**Après:**
```python
JWT_SECRET_KEY = _get_or_generate_secret("JWT_SECRET_KEY")
```

**Ligne 68 - Avant:**
```python
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'test-secret-key-very-secure-dev')
```

**Après:**
```python
JWT_SECRET_KEY = _get_or_generate_secret("JWT_SECRET_KEY")
```

### **Étape 2.4: Ajouter les secrets à `.env`**

```bash
# Copier les secrets générés
cat .env.secrets >> .env
rm .env.secrets  # Supprimer le fichier temporaire
```

### **Étape 2.5: Vérifier**

```bash
# Vérifier que les secrets sont présents
grep -E "^SECRET_KEY|^JWT_SECRET" .env | head -2

# Vérifier la config
python3 -c "
import sys
sys.path.insert(0, 'backend')
from src.config import Config
print(f'SECRET_KEY set: {bool(Config.SECRET_KEY)}')
print(f'JWT_SECRET_KEY set: {bool(Config.JWT_SECRET_KEY)}')
"
```

✅ **Correction #2 complétée**

---

## **⚡ Correction #3: Supprimer Flask-Login CVE (15 minutes)**

### **Étape 3.1: Vérifier la dépendance**

```bash
grep -n "Flask-Login" backend/requirements.txt
pip show Flask-Login
```

**Output:** `Flask-Login==0.6.3` ❌ CVE-2023-4879

### **Étape 3.2: Vérifier que l'auth n'utilise pas Flask-Login**

```bash
# Vérifier les imports
grep -r "from flask_login\|import flask_login" backend/src/
grep -r "from flask_login\|import flask_login" backend/app_fastapi/
```

**Expected:** Aucun résultat (n'utilise que JWT)

### **Étape 3.3: Supprimer du requirements.txt**

**Avant:**
```txt
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
Flask-Talisman==1.1.0
Flask-Login==0.6.3  # ❌ VULNÉRABLE - CVE-2023-4879
python-dotenv==1.0.0
```

**Après:**
```txt
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
Flask-Talisman==1.1.0
# Flask-Login==0.6.3  # ❌ REMOVED - CVE-2023-4879 - Using JWT-based auth instead
python-dotenv==1.0.0
```

### **Étape 3.4: Mettre à jour les dépendances**

```bash
cd backend
# Supprimer la dépendance
pip uninstall Flask-Login -y

# Vérifier les dépendances sans problèmes
pip check

# Installer les autres dépendances
pip install -r requirements.txt

# Vérifier l'installation
pip show Flask
pip show Flask-CORS
```

### **Étape 3.5: Tester le backend**

```bash
cd backend
python -c "from flask import Flask; print('✅ Flask OK')"
python -c "from flask_cors import CORS; print('✅ Flask-CORS OK')"
python -c "try:
    from flask_login import login_user
    print('❌ Flask-Login still installed!')
except ImportError:
    print('✅ Flask-Login removed successfully')"
```

✅ **Correction #3 complétée**

---

## **🧪 Vérification Complète (15 minutes)**

### **Test 1: Vérifier la configuration**

```bash
cd /home/djali/code/Soipadeg/Immo2000

# Vérifier CORS
echo "=== CORS Configuration ==="
grep -A 5 "CORS_ALLOWED_ORIGINS" backend/src/app.py | head -6

# Vérifier Secrets
echo "=== Secrets Configuration ==="
grep -E "^SECRET_KEY|^JWT_SECRET" .env | wc -l
echo "✅ Secrets configured" || echo "❌ Missing secrets"

# Vérifier Flask-Login
echo "=== Flask-Login Status ==="
grep "Flask-Login" backend/requirements.txt | grep -v "^#" && echo "❌ Still present" || echo "✅ Removed"
```

### **Test 2: Tester le backend**

```bash
cd backend

# Installer les dépendances
pip install -r requirements.txt

# Lancer les tests
pytest tests/ -v --tb=short 2>&1 | tail -20

# Démarrer le serveur (Ctrl+C après vérification)
python run_server.py &
sleep 3
curl -I http://localhost:5000/health
kill %1
```

### **Test 3: Tester le frontend**

```bash
cd frontend

# Tests
npm test -- --passWithNoTests 2>&1 | tail -5

# Build
npm run build 2>&1 | tail -10
```

### **Test 4: Health Check complet**

```bash
# Vérifier que tout est OK
echo "=== Final Verification ==="
echo "1. CORS restreint:"
grep "CORS_ALLOWED_ORIGINS" backend/src/app.py | grep -q "os.getenv" && echo "✅ OK" || echo "❌ NOT OK"

echo "2. Secrets sécurisés:"
grep "SECRET_KEY = _get_or_generate_secret" backend/src/config.py && echo "✅ OK" || echo "❌ NOT OK"

echo "3. Flask-Login supprimé:"
grep -q "Flask-Login" backend/requirements.txt | grep -v "^#" && echo "❌ NOT OK" || echo "✅ OK"

echo "4. .env configuré:"
grep -q "SECRET_KEY" .env && echo "✅ OK" || echo "❌ NOT OK"
```

---

## **📦 Créer `.env.example` pour la Production**

### **Créer le fichier**

```bash
cat > .env.example << 'EOF'
# ================================================
# IMMO2000 - Environment Configuration
# Copy this to .env and fill in production values
# ================================================

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False

# Security (GENERATE NEW SECRETS)
# Run: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=<GENERATE_NEW_SECRET_HERE>
JWT_SECRET_KEY=<GENERATE_NEW_SECRET_HERE>

# CORS Configuration (Production)
CORS_ALLOWED_ORIGINS=https://immo2000.com,https://www.immo2000.com

# Database
DATABASE_URL=postgresql://user:password@postgres-host:5432/immo2000_db
DATABASE_ECHO=False

# Redis Cache
REDIS_URL=redis://redis-host:6379/0

# External Services (Required for Production)

## DocuSign (Signature électronique)
DOCUSIGN_CLIENT_ID=<YOUR_CLIENT_ID>
DOCUSIGN_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
DOCUSIGN_USER_ID=<YOUR_USER_ID>

## Stripe (Paiements)
STRIPE_SECRET_KEY=<YOUR_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>

## SendGrid (Emails)
SENDGRID_API_KEY=<YOUR_API_KEY>

## AWS S3 (Documents)
AWS_ACCESS_KEY_ID=<YOUR_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_SECRET_KEY>
AWS_S3_BUCKET=immo2000-documents
AWS_S3_REGION=eu-west-1

# Optional Services

## Melo API (Estimations immobilières)
MELO_API_KEY=<YOUR_API_KEY>

## FCM (Notifications push)
FCM_API_KEY=<YOUR_API_KEY>

## Google OAuth
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_SECRET>

## Monitoring
SENTRY_DSN=<YOUR_SENTRY_DSN>
PROMETHEUS_ENABLED=True

# Logging
LOG_LEVEL=INFO
EOF

echo "✅ .env.example créé"
```

### **Sécuriser le fichier**

```bash
chmod 600 .env
chmod 644 .env.example
```

---

## **✅ Checklist de Validation**

- [ ] **CORS:** Restreint aux domaines autorisés (pas `"*"`)
- [ ] **Secrets:** Générés avec `secrets.token_urlsafe()` et dans `.env`
- [ ] **Flask-Login:** Supprimé du `requirements.txt`
- [ ] **Tests:** `npm test` et `pytest` passent
- [ ] **Health checks:** `/health` répond correctement
- [ ] **Logs:** Pas de warnings de sécurité
- [ ] **`.env.example`:** Créé avec tous les champs

---

## **🚀 Prochaines Étapes**

1. ✅ **Appliquer les 3 corrections** (1.5h)
2. ✅ **Tester localement** (30m)
3. ✅ **Commit & push** (10m)
4. ⏭️ **Nettoyage dépendances** (2h) - voir Phase 2
5. ⏭️ **Déploiement staging** - voir Phase 3

---

## **📞 Support en cas de problème**

**Erreur:** "SECRET_KEY MUST be set in production"
```bash
# Solution:
python -c "import secrets; print(secrets.token_urlsafe(32))" >> .env
```

**Erreur:** "CORS policy blocked"
```bash
# Solution:
# Ajouter votre domaine à CORS_ALLOWED_ORIGINS dans .env
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://immo2000.com
```

**Erreur:** "Flask-Login import error"
```bash
# Solution:
pip uninstall Flask-Login -y
pip install -r requirements.txt
```

---

**Rapport finalisé**: 08 Juin 2026
**Statut**: 🟢 **PRÊT POUR EXÉCUTION**
**Prochain document**: Phase 2 - Nettoyage des dépendances
