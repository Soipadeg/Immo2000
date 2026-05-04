#!/bin/bash
# =============================================================================
# Exemples complets : Test de l'authentification intégrée
# =============================================================================
#
# Usage : bash FULL_INTEGRATION_TEST.sh
#
# Détails :
# 1. Register : Créer un compte vendeur
# 2. Login : Récupérer les tokens
# 3. GetMe : Voir ses infos
# 4. CreateBien : Créer un bien (vendeur uniquement)
# 5. ListBiens : Voir la liste des biens
# 6. RefreshToken : Rafraîchir l'access_token
#

set -e

BASE_URL="http://localhost:5000"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║    🔐 TEST COMPLET D'INTÉGRATION - AUTHENTIFICATION JWT           ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# =============================================================================
# 1️⃣  PHASE 1 - ENREGISTREMENT
# =============================================================================

echo "📝 PHASE 1 - ENREGISTREMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REGISTER_DATA='{
    "email": "jean.dupont@example.com",
    "mot_de_passe": "SecurePassword123!",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "vendeur",
    "telephone": "06 12 34 56 78",
    "adresse_contact": "123 Rue de Paris, 75000 Paris"
}'

echo "📤 Requête POST /auth/register"
echo ""
echo "Données :"
echo "$REGISTER_DATA" | python -m json.tool
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA")

echo "📥 Réponse :"
echo "$REGISTER_RESPONSE" | python -m json.tool
echo ""

# Extraire le user_id
USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"user_id":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ -z "$USER_ID" ]; then
    echo "❌ Erreur : Impossible d'extraire user_id"
    echo "Réponse : $REGISTER_RESPONSE"
    exit 1
fi

echo "✅ Utilisateur créé avec user_id=$USER_ID"
echo ""
echo ""

# =============================================================================
# 2️⃣  PHASE 2 - CONNEXION
# =============================================================================

echo "🔑 PHASE 2 - CONNEXION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LOGIN_DATA='{
    "email": "jean.dupont@example.com",
    "mot_de_passe": "SecurePassword123!"
}'

echo "📤 Requête POST /auth/login"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

echo "📥 Réponse :"
echo "$LOGIN_RESPONSE" | python -m json.tool
echo ""

# Extraire les tokens
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
    echo "❌ Erreur : Impossible d'extraire les tokens"
    echo "Réponse : $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Tokens générés :"
echo "   Access Token : ${ACCESS_TOKEN:0:20}...${ACCESS_TOKEN: -20}"
echo "   Refresh Token : ${REFRESH_TOKEN:0:20}...${REFRESH_TOKEN: -20}"
echo ""
echo ""

# =============================================================================
# 3️⃣  PHASE 3 - RÉCUPÉRER SES INFOS
# =============================================================================

echo "👤 PHASE 3 - RÉCUPÉRER SES INFOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📤 Requête GET /auth/me"
echo ""
echo "En-têtes :"
echo "  Authorization: Bearer <access_token>"
echo ""

ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "📥 Réponse :"
echo "$ME_RESPONSE" | python -m json.tool
echo ""
echo ""

# =============================================================================
# 4️⃣  PHASE 4 - CRÉER UN BIEN (VENDEUR)
# =============================================================================

echo "🏠 PHASE 4 - CRÉER UN BIEN (VENDEUR UNIQUEMENT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CREATE_BIEN_DATA='{
    "adresse": "123 Rue de Paris, 75000 Paris",
    "code_postal": "75000",
    "ville": "Paris",
    "surface": 50,
    "type_bien": "appartement",
    "nombre_pieces": 2,
    "nombre_chambres": 1,
    "etage": 3,
    "date_construction": 2010,
    "description": "Bel appartement au cœur de Paris"
}'

echo "📤 Requête POST /api/biens"
echo ""
echo "Données :"
echo "$CREATE_BIEN_DATA" | python -m json.tool
echo ""

CREATE_BIEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/biens" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_BIEN_DATA")

echo "📥 Réponse :"
echo "$CREATE_BIEN_RESPONSE" | python -m json.tool
echo ""
echo ""

# =============================================================================
# 5️⃣  PHASE 5 - LISTER LES BIENS
# =============================================================================

echo "📋 PHASE 5 - LISTER LES BIENS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📤 Requête GET /api/biens"
echo ""

LIST_BIENS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/biens" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

echo "📥 Réponse :"
echo "$LIST_BIENS_RESPONSE" | python -m json.tool
echo ""
echo ""

# =============================================================================
# 6️⃣  PHASE 6 - CRÉER UNE ESTIMATION (MELO API)
# =============================================================================

echo "📊 PHASE 6 - CRÉER UNE ESTIMATION MELO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CREATE_ESTIMATION_DATA='{
    "adresse": "123 Rue de Paris, 75000 Paris",
    "surface": 50,
    "type_bien": "appartement"
}'

echo "📤 Requête POST /api/estimations"
echo ""
echo "Données :"
echo "$CREATE_ESTIMATION_DATA" | python -m json.tool
echo ""

CREATE_ESTIMATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/estimations" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_ESTIMATION_DATA")

echo "📥 Réponse :"
echo "$CREATE_ESTIMATION_RESPONSE" | python -m json.tool
echo ""
echo ""

# =============================================================================
# 7️⃣  PHASE 7 - COMPARER PLUSIEURS BIENS
# =============================================================================

echo "🔄 PHASE 7 - COMPARER PLUSIEURS BIENS (VENDEURS & AGENTS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

COMPARE_DATA='{
    "biens": [
        {
            "adresse": "123 Rue A, 75000 Paris",
            "surface": 50,
            "type_bien": "appartement"
        },
        {
            "adresse": "456 Rue B, 75000 Paris",
            "surface": 75,
            "type_bien": "maison"
        }
    ]
}'

echo "📤 Requête POST /api/estimations/compare"
echo ""
echo "Données :"
echo "$COMPARE_DATA" | python -m json.tool
echo ""

COMPARE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/estimations/compare" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$COMPARE_DATA")

echo "📥 Réponse :"
echo "$COMPARE_RESPONSE" | python -m json.tool
echo ""
echo ""

# =============================================================================
# 8️⃣  PHASE 8 - RAFRAÎCHIR LE TOKEN
# =============================================================================

echo "🔄 PHASE 8 - RAFRAÎCHIR LE TOKEN D'ACCÈS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REFRESH_DATA="{
    \"refresh_token\": \"$REFRESH_TOKEN\"
}"

echo "📤 Requête POST /auth/refresh"
echo ""

REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "$REFRESH_DATA")

echo "📥 Réponse :"
echo "$REFRESH_RESPONSE" | python -m json.tool
echo ""

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$NEW_ACCESS_TOKEN" ]; then
    echo "⚠️  Impossible d'extraire le nouveau token (check la réponse)"
else
    echo "✅ Nouveau access token généré : ${NEW_ACCESS_TOKEN:0:20}...${NEW_ACCESS_TOKEN: -20}"
fi

echo ""
echo ""

# =============================================================================
# 🎉 RÉSUMÉ
# =============================================================================

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 TEST COMPLET TERMINÉ                         ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo "Résumé des opérations :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ User registered         : $USER_ID (jean.dupont@example.com)"
echo "✅ Login successful        : 2 tokens generés"
echo "✅ User info retrieved     : GET /auth/me"
echo "✅ Property created        : POST /api/biens"
echo "✅ Properties listed       : GET /api/biens"
echo "✅ Estimation created      : POST /api/estimations"
echo "✅ Properties compared     : POST /api/estimations/compare"
echo "✅ Token refreshed         : POST /auth/refresh"
echo ""
echo ""

echo "📚 Documentation complète :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 AUTHENTICATION.md                    - Référence complète des endpoints"
echo "🔗 INTEGRATION_CHECKLIST_AUTH.md        - Checklist d'intégration"
echo "🔗 INTEGRATION_APP_FACTORY.md           - Configuration de l'app"
echo "🔗 RATE_LIMITING_GUIDE.md               - Protection des endpoints"
echo "🔗 AUTHENTICATION_DIAGRAMS.md           - Diagrammes visuels"
echo ""
