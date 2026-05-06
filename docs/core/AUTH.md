# Authentification & Autorisation

## 📋 Vue d'ensemble

Système JWT complet avec création de compte, login, et contrôle d'accès basé sur les rôles (RBAC).

---

## 🔐 Endpoints

### Créer un compte
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "acheteur"  // ou "vendeur" ou "agent"
}
```

### Se connecter
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 1,
  "email": "user@example.com",
  "role": "acheteur"
}
```

### Vérifier le token
```
GET /auth/me
Authorization: Bearer {TOKEN}
```

---

## 🏗️ Architecture

### Model (`backend/src/models/utilisateur.py`)
```python
class Utilisateur(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nom = db.Column(db.String(100))
    prenom = db.Column(db.String(100))
    role = db.Column(db.String(50), default="acheteur")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Service Auth (`backend/src/services/auth.py`)
```python
class AuthService:
    @staticmethod
    def creer_utilisateur(email, password, nom, prenom, role="acheteur")

    @staticmethod
    def authentifier(email, password) -> Optional[Utilisateur]

    @staticmethod
    def generer_token(utilisateur_id, email, role) -> str

    @staticmethod
    def verifier_token(token) -> Optional[Dict]
```

### Utils (`backend/src/auth/utils.py`)
```python
def hash_password(password: str) -> str
def verify_password(password: str, hash: str) -> bool
```

### Décorateur (`backend/src/auth/decorators.py`)
```python
@token_required
def route_protegee(current_user):
    # current_user contient: {"user_id": 1, "email": "...", "role": "..."}
    pass
```

---

## 🔑 JWT Token

### Structure
```
Header:
{
  "typ": "JWT",
  "alg": "HS256"
}

Payload:
{
  "user_id": 1,
  "email": "user@example.com",
  "role": "acheteur",
  "iat": 1704067200,
  "exp": 1704153600  // 24h après création
}

Signature: HMAC-SHA256(secret)
```

### Durée de validité
- **24 heures** par défaut
- Token expiré retourne **401 Unauthorized**

---

## 👥 Rôles et permissions

### Rôles disponibles

| Rôle | Description | Permissions principales |
|------|-------------|------------------------|
| `acheteur` | Client cherchant un bien | Voir annonces, créer visites, donner feedback |
| `vendeur` | Propriétaire vendant | Créer/modifier annonces, voir visites, statistiques |
| `agent` | Agent immobilier | Comme vendeur + gestion multi-vendeur |
| `admin` | Administrateur | Accès complet |

### Matrice d'accès

| Endpoint | Acheteur | Vendeur | Agent | Admin |
|----------|----------|---------|-------|-------|
| GET /annonces | ✅ | ✅ | ✅ | ✅ |
| POST /annonces | ❌ | ✅ | ✅ | ✅ |
| PUT /annonces/{id} | ❌ | ✅* | ✅* | ✅ |
| DELETE /annonces/{id} | ❌ | ✅* | ✅* | ✅ |
| POST /visites | ✅ | ❌ | ❌ | ✅ |
| GET /feedbacks/vendeur | ❌ | ✅ | ✅ | ✅ |
| DELETE /users | ❌ | ❌ | ❌ | ✅ |

*Seulement ses propres ressources

---

## 🔒 Sécurité

### Hachage des mots de passe
- **Algorithme**: bcrypt (via werkzeug)
- **Salt rounds**: 12
- Les mots de passe ne sont jamais stockés en clair

### JWT Secret
```env
JWT_SECRET_KEY=your_secret_key_here_min_32_chars
```

### HTTPS en production
- Tous les tokens doivent être transmis via HTTPS
- Cookie secure + httpOnly recommandé en production

### Protection CSRF
- À implémenter pour les formulaires en production

---

## 💡 Cas d'usage

### 1. Créer un compte acheteur
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "acheteur@example.com",
    "password": "MySecurePass123!",
    "nom": "Martin",
    "prenom": "Pierre",
    "role": "acheteur"
  }'
```

### 2. Se connecter et obtenir le token
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "acheteur@example.com",
    "password": "MySecurePass123!"
  }'
```

### 3. Utiliser le token pour une requête protégée
```bash
curl http://localhost:5000/api/v1/visites \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. Vérifier mon profil
```bash
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer {TOKEN}"
```

---

## ⚠️ Erreurs courantes

| Code | Erreur | Solution |
|------|--------|----------|
| 400 | Email déjà utilisé | Utiliser un autre email ou réinitialiser |
| 401 | Email ou mot de passe incorrect | Vérifier les identifiants |
| 401 | Token expiré | Se reconnecter pour obtenir un nouveau token |
| 403 | Forbidden | Vous n'avez pas les droits pour cette action |

---

## 📝 Configuration

### Variables d'environnement (`.env`)
```env
JWT_SECRET_KEY=your_secret_key_here_at_least_32_chars
JWT_EXPIRATION_HOURS=24
```

### Best practices
1. Changer `JWT_SECRET_KEY` en production
2. Utiliser HTTPS pour toutes les requêtes
3. Stocker le token du côté client (localStorage ou sessionStorage)
4. Implémenter la déconnexion (token blacklist)

---

## 🔄 Flow d'authentification

```
1. User remplit form (email, password, nom, prenom, role)
   ↓
2. POST /auth/register → Hash password, create user
   ↓
3. User logs in avec email/password
   ↓
4. POST /auth/login → Verify password, generate JWT token
   ↓
5. Client reçoit token
   ↓
6. Pour toute requête protégée:
   - Client envoie: Authorization: Bearer {TOKEN}
   - Server vérifie signature + expiration
   - Si OK → execute requête
   - Si KO → retourne 401
```

---

## 🚀 Améliorations futures

- [ ] Token refresh endpoint
- [ ] Two-factor authentication (2FA)
- [ ] Mot de passe oublié / Reset
- [ ] Social login (Google, Facebook)
- [ ] Session management
- [ ] Rate limiting sur login
