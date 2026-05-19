#!/bin/bash
# Script pour exécuter les tests (backend + frontend)

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 TEST SUITE - Immo2000 Admin Panel"
echo "═══════════════════════════════════════════════════════════════"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# TESTS BACKEND
# ============================================================================

echo -e "\n${YELLOW}📝 TESTS BACKEND - 28 Endpoints Admin${NC}"
echo "═════════════════════════════════════════════════════════════════"

cd /home/djali/code/Soipadeg/Immo2000/backend

# Vérifier que pytest est installé
if ! python -m pytest --version > /dev/null 2>&1; then
    echo -e "${RED}❌ pytest non installé${NC}"
    echo "Installation: pip install pytest pytest-cov pytest-flask pytest-mock factory-boy"
    exit 1
fi

# Exécuter les tests
echo -e "\n${YELLOW}1️⃣ Tests unitaires - 28 endpoints${NC}"
python -m pytest tests/test_admin_endpoints.py -v --tb=short

echo -e "\n${YELLOW}2️⃣ Coverage des tests${NC}"
python -m pytest tests/test_admin_endpoints.py --cov=src.routes --cov=src.models --cov-report=html --cov-report=term

# ============================================================================
# TESTS FRONTEND
# ============================================================================

echo -e "\n${YELLOW}📝 TESTS FRONTEND - Composants Admin${NC}"
echo "═════════════════════════════════════════════════════════════════"

cd /home/djali/code/Soipadeg/Immo2000/frontend

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm non trouvé${NC}"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installation des dépendances...${NC}"
    npm install --legacy-peer-deps
fi

# Exécuter les tests frontend
echo -e "\n${YELLOW}1️⃣ Tests unitaires - Composants React${NC}"
npm run test -- src/__tests__/adminPages.test.jsx --run

echo -e "\n${YELLOW}2️⃣ Coverage frontend${NC}"
npm run test:coverage -- --run

# ============================================================================
# RÉSUMÉ
# ============================================================================

echo -e "\n${GREEN}✅ TOUS LES TESTS SONT TERMINÉS${NC}"
echo "═════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Tests backend: 28 endpoints validés${NC}"
echo -e "${GREEN}✓ Tests frontend: 6 composants validés${NC}"
echo -e "${GREEN}✓ Coverage: Généré en ./htmlcov (backend) et ./coverage (frontend)${NC}"
echo "═════════════════════════════════════════════════════════════════"
