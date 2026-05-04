#!/usr/bin/env bash
# Exemple complet d'utilisation du système d'authentification JWT

cat << 'EOF'
🔐 EXEMPLE COMPLET - Authentification JWT Immo2000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ce script montre un exemple complet de flux d'authentification :
1. S'inscrire (register)
2. Se connecter (login)
3. Accéder à une route protégée (me)
4. Rafraîchir le token (refresh)

⚠️  PRÉREQUIS :
  - Serveur lancé : python -m flask run (port 5000)
  - curl installé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 CONFIGURATION
API_URL="http://localhost:5000"
EMAIL="demo@example.com"
PASSWORD="DemoPassword123!"
NOM="Martin"
PRENOM="Paul"
ROLE="vendeur"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  INSCRIPTION (S'enregistrer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "mot_de_passe": "DemoPassword123!",
    "nom": "Martin",
    "prenom": "Paul",
    "role": "vendeur",
    "telephone": "+33612345678",
    "adresse_contact": "123 Rue de Paris"
  }'

✅ RESPONSE (201 Created):
{
  "message": "User created successfully",
  "user_id": 1,
  "email": "demo@example.com"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2️⃣  CONNEXION (Login)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "mot_de_passe": "DemoPassword123!"
  }'

✅ RESPONSE (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJyb2xlIjoidmVuZGV1ciIsImV4cCI6MTcxNzUwMDAwMCwiaWF0IjoxNzE3NDEzNjAwLCJ0eXBlIjoiYWNjZXNzIn0.XXX...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MTgwMTg0MDAsImlhdCI6MTcxNzQxMzYwMCwidHlwZSI6InJlZnJlc2gifQ.YYY...",
  "token_type": "Bearer",
  "expires_in": 86400
}

💾 SAUVEGARDER LES TOKENS :
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3️⃣  RÉCUPÉRER L'UTILISATEUR COURANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

✅ RESPONSE (200 OK):
{
  "utilisateur_id": 1,
  "email": "demo@example.com",
  "nom": "Martin",
  "prenom": "Paul",
  "role": "vendeur",
  "telephone": "+33612345678",
  "adresse_contact": "123 Rue de Paris",
  "actif": true,
  "date_inscription": "2026-05-04T10:30:00",
  "date_derniere_connexion": "2026-05-04T12:45:00"
}

❌ Si token expiré (401 Unauthorized):
{
  "error": "Invalid or expired token"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4️⃣  RAFRAÎCHIR LE TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quand l'access_token est expiré, utiliser le refresh_token :

curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

✅ RESPONSE (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}

💾 SAUVEGARDER LE NOUVEAU TOKEN :
export ACCESS_TOKEN="<nouveau_access_token>"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5️⃣  UTILISER LE TOKEN POUR ACCÉDER À UNE ROUTE PROTÉGÉE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exemple : Route protégée par @token_required

curl -X GET http://localhost:5000/api/biens \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

✅ RESPONSE (200 OK):
{
  "biens": [
    {
      "bien_id": 1,
      "adresse": "123 Rue de Paris",
      "surface": 50,
      "type_bien": "appartement"
    }
  ]
}

❌ Sans token (401 Unauthorized):
{
  "error": "Missing or invalid Authorization header"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6️⃣  ROUTE AVEC RESTRICTION DE RÔLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exemple : Route protégée par @token_required + @role_required(roles=["agent"])

curl -X GET http://localhost:5000/admin/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

✅ Si role=agent (200 OK):
{
  "stats": {
    "total_users": 1000,
    "total_properties": 5000
  }
}

❌ Si role!=agent (403 Forbidden):
{
  "error": "Forbidden. Required roles: agent. Got: vendeur"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 COMMENT ÇA FONCTIONNE ?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. REGISTRATION
   └─► Crée user en DB
       └─► Hash mot de passe avec bcrypt
           └─► Return user_id

2. LOGIN
   └─► Cherche user par email
       └─► Vérifie password (bcrypt.checkpw)
           └─► Génère JWT access_token + refresh_token
               └─► Return tokens

3. REQUEST AVEC TOKEN
   └─► Client envoie : "Authorization: Bearer <token>"
       └─► API extrait le token
           └─► Vérifie signature (HS256)
               └─► Vérifie expiration
                   └─► Cherche user en DB
                       └─► Exécute route

4. REFRESH
   └─► Client envoie refresh_token
       └─► API vérifie signature + expiration
           └─► Génère nouveau access_token
               └─► Return access_token

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 CONSEILS D'UTILISATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Stockage des tokens :
   • Access token : Memory/localStorage (expiration 24h = secure)
   • Refresh token : HTTP-only secure cookie (meilleur en prod)

✅ Toujours inclure le token :
   curl -H "Authorization: Bearer <token>" ...

✅ Gérer l'expiration :
   if response.status_code == 401 and "expired" in response.json():
       refresh_token()
       retry_request()

✅ Sécurité :
   • Jamais exposer le token en URL
   • Utiliser HTTPS en production
   • Clé secrète JWT forte (32+ chars)
   • Ne jamais hardcoder les tokens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 PLUS D'INFO ?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lire :
  • QUICKSTART_AUTH.md     - Démarrage 5 min
  • AUTHENTICATION.md      - Documentation complète
  • AUTHENTICATION_DIAGRAMS.md - Visuels

Exécuter :
  • python scripts/test_auth_quick.py - Test rapide
  • pytest tests/test_auth.py -v     - Tests complets

EOF
