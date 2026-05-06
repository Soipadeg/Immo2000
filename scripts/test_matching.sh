#!/bin/bash
# ====================================================================
# Script de test pour l'endpoint /matching
# ====================================================================
#
# Cet script teste l'endpoint de matching avec curl.
# Assurez-vous que le serveur Flask est en cours d'exécution!
#
# Usage:
#   chmod +x test_matching.sh
#   ./test_matching.sh
#
# ====================================================================

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000"
API_VERSION="/api/v1"

# Token JWT (à remplacer avec un vrai token!)
# Vous pouvez obtenir un token en vous connectant d'abord
JWT_TOKEN="${JWT_TOKEN:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6MTcxNDk4OTI2OH0.example}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🏠 TEST ENDPOINT /matching${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ========== TEST 1: Health check ==========
echo -e "${YELLOW}[1] Health Check...${NC}"
curl -s "${BASE_URL}/health" | jq . || echo "Health check failed!"
echo ""

# ========== TEST 2: Récupérer les stats ==========
echo -e "${YELLOW}[2] Récupérer les statistiques...${NC}"
curl -s -X GET "${BASE_URL}${API_VERSION}/matching/stats" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" | jq . || echo "Stats failed!"
echo ""

# ========== TEST 3: Appel principal du matching ==========
echo -e "${YELLOW}[3] Appel au endpoint /matching (acheteur_id: 1)${NC}"
echo -e "${BLUE}Request:${NC}"
echo '{
  "acheteur_id": 1
}' | jq .

echo -e "${BLUE}Response:${NC}"
curl -s -X POST "${BASE_URL}${API_VERSION}/matching" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"acheteur_id": 1}' | jq . || echo "Matching request failed!"
echo ""

# ========== TEST 4: Matching sans acheteur_id spécifié ==========
echo -e "${YELLOW}[4] Matching avec l'utilisateur courant (sans acheteur_id)${NC}"
curl -s -X POST "${BASE_URL}${API_VERSION}/matching" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq . || echo "Matching request failed!"
echo ""

echo -e "${GREEN}✅ Tests complétés!${NC}"
echo ""
echo -e "${BLUE}Tips:${NC}"
echo "- Remplacez JWT_TOKEN avec un vrai token JWT"
echo "- Remplacez acheteur_id avec un ID valide"
echo "- Voir MATCHING_ALGORITHM.md pour plus de détails"
