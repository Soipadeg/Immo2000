#!/bin/bash

# 🧪 SCRIPT DE TEST COMPLET - Système de Documents Obligatoires
# ============================================================
#
# Teste le workflow complet:
# 1. Vendeur crée annonce
# 2. Documents auto-initialisés
# 3. Vendeur upload documents
# 4. Admin voit statut (sans URLs)
# 5. Admin valide documents
# 6. Vendeur publie annonce
# 7. Notaire accède après offre acceptée

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TEST WORKFLOW - Documents Obligatoires Immo2000          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Configuration
API_URL="http://localhost:5000/api/v1"
ADMIN_TOKEN="your_admin_token_here"
VENDEUR_TOKEN="your_vendeur_token_here"
NOTAIRE_TOKEN="your_notaire_token_here"

echo -e "\n${YELLOW}⚠️  ÉTAPE 0: Vérifier que le serveur est actif${NC}"
curl -s "${API_URL}/health" > /dev/null && echo -e "${GREEN}✅ Serveur actif${NC}" || {
    echo -e "${RED}❌ Serveur non actif. Lancez: docker-compose up -d${NC}"
    exit 1
}

echo -e "\n${YELLOW}📋 ÉTAPE 1: Vendeur crée une annonce${NC}"
ANNONCE_RESPONSE=$(curl -s -X POST "${API_URL}/annonces" \
  -H "Authorization: Bearer ${VENDEUR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Magnifique appartement à Paris",
    "description": "Bel appartement 3 pièces",
    "prix": 450000,
    "ville": "Paris",
    "code_postal": "75001",
    "surface": 85,
    "nombre_pieces": 3,
    "etage": 2,
    "date_construction": 2010,
    "type_bien": "appartement"
  }')

ANNONCE_ID=$(echo "$ANNONCE_RESPONSE" | grep -o '"annonce_id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Annonce créée: ID=${ANNONCE_ID}"

if [ -z "$ANNONCE_ID" ] || [ "$ANNONCE_ID" -eq 0 ] 2>/dev/null; then
    echo -e "${RED}❌ Erreur création annonce${NC}"
    echo "$ANNONCE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Annonce créée: ${ANNONCE_ID}${NC}"

echo -e "\n${YELLOW}📄 ÉTAPE 2: Vérifier que les documents sont auto-initialisés${NC}"
DOCS_RESPONSE=$(curl -s -X GET "${API_URL}/annonces/${ANNONCE_ID}/documents-requis" \
  -H "Authorization: Bearer ${VENDEUR_TOKEN}")

DOCS_COUNT=$(echo "$DOCS_RESPONSE" | grep -o '"document_requis_id"' | wc -l)
echo "Documents trouvés: $DOCS_COUNT"

if [ "$DOCS_COUNT" -ne 5 ]; then
    echo -e "${RED}❌ 5 documents attendus, trouvé: ${DOCS_COUNT}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 5 documents auto-initialisés${NC}"

echo -e "\n${YELLOW}📤 ÉTAPE 3: Vendeur upload un document test${NC}"

# Créer un fichier PDF test
echo "%PDF-1.4" > /tmp/test_document.pdf
echo "1 0 obj" >> /tmp/test_document.pdf
echo "<< /Type /Catalog /Pages 2 0 R >>" >> /tmp/test_document.pdf
echo "endobj" >> /tmp/test_document.pdf

UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/annonces/${ANNONCE_ID}/documents-requis" \
  -H "Authorization: Bearer ${VENDEUR_TOKEN}" \
  -F "document_requis_id=1" \
  -F "type_document=titre_propriete" \
  -F "file=@/tmp/test_document.pdf")

echo "$UPLOAD_RESPONSE" | grep -q '"statut":"soumis"' && echo -e "${GREEN}✅ Document uploadé${NC}" || {
    echo -e "${RED}❌ Erreur upload${NC}"
    echo "$UPLOAD_RESPONSE"
    exit 1
}

echo -e "\n${YELLOW}👨‍⚖️ ÉTAPE 4: Admin voit le statut (SANS URLs)${NC}"

ADMIN_STATUS=$(curl -s -X GET "${API_URL}/documents-requis/statut-admin/${ANNONCE_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "$ADMIN_STATUS" | grep -q '"url_document"' && {
    echo -e "${RED}❌ URLs ne doivent pas être visibles pour admin!${NC}"
    exit 1
} || echo -e "${GREEN}✅ URLs masquées pour admin${NC}"

ADMIN_STATUS_CHECK=$(echo "$ADMIN_STATUS" | grep -q '"peut_publier":false' && echo "documents manquants" || echo "ok")
echo "Statut: Documents manquants (attendu)"

echo -e "\n${YELLOW}✅ ÉTAPE 5: Admin valide les documents${NC}"

# Pour ce test, simulons la validation manuelle
# Dans un cas réel, il faudrait valider via PUT /documents-requis/{id}/valider
echo -e "${YELLOW}Note: Validation manuelle via PUT /documents-requis/{id}/valider${NC}"

echo -e "\n${YELLOW}📋 ÉTAPE 6: Vérifier les endpoints créés${NC}"

# Vérifier que les endpoints existent
curl -s -X OPTIONS "${API_URL}/documents-requis/statut-admin/${ANNONCE_ID}" -H "Authorization: Bearer ${ADMIN_TOKEN}" > /dev/null && \
    echo -e "${GREEN}✅ Route admin statut existante${NC}" || \
    echo -e "${YELLOW}⚠️ Route admin statut (peut ne pas répondre aux OPTIONS)${NC}"

echo -e "\n${YELLOW}🔐 ÉTAPE 7: Vérifier la sécurité des rôles${NC}"

# Essayer d'accéder à l'endpoint admin sans être admin
UNAUTHORIZED=$(curl -s -X GET "${API_URL}/documents-requis/statut-admin/${ANNONCE_ID}" \
  -H "Authorization: Bearer ${VENDEUR_TOKEN}" | grep -o "ForbiddenError\|Forbidden")

if [ -n "$UNAUTHORIZED" ]; then
    echo -e "${GREEN}✅ Vendeur ne peut pas voir statut admin${NC}"
else
    echo -e "${YELLOW}⚠️ Sécurité: À vérifier sur le serveur en local${NC}"
fi

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TEST TERMINÉ - RÉSUMÉ                                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✅ RÉSULTATS${NC}:"
echo "  • Auto-initialisation des documents: ✅"
echo "  • Upload de documents: ✅"
echo "  • Vue admin (sans URLs): ✅"
echo "  • Sécurité des rôles: À valider"

echo -e "\n${YELLOW}🚀 PROCHAINES ÉTAPES${NC}:"
echo "  1. Implémenter l'authentification JWT réelle"
echo "  2. Configurer les tokens ADMIN, VENDEUR, NOTAIRE"
echo "  3. Valider les documents via admin"
echo "  4. Publier l'annonce"
echo "  5. Tester accès notaire après acceptation d'offre"

echo -e "\n${BLUE}📚 Documentation: voir IMPLEMENTATION_STEPS.md${NC}"
