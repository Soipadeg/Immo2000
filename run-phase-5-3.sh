#!/bin/bash
# Script pour configurer et exécuter la Phase 5.3 - Testing

set -e

PROJECT_ROOT="/home/djali/code/Soipadeg/Immo2000"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "=========================================="
echo "Phase 5.3 - Testing Setup & Execution"
echo "=========================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"
echo "✅ Working in: $FRONTEND_DIR"
echo ""

# Étape 1: Installer les dépendances
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "✅ Dependencies installed"
echo ""

# Étape 2: Exécuter les tests unitaires
echo "🧪 Running unit tests..."
npm test -- --run 2>&1 | tee test-results.txt || true

echo ""
echo "✅ Unit tests completed"
echo ""

# Étape 3: Générer le rapport de couverture
echo "📊 Generating coverage report..."
npm run test:coverage 2>&1 | tee coverage-results.txt || true

echo ""
echo "=========================================="
echo "✅ Phase 5.3 Setup Complete"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "  1. Review test results in test-results.txt"
echo "  2. Check coverage in coverage/index.html"
echo "  3. Run E2E tests with: npm run e2e"
echo "  4. For interactive testing: npm run e2e"
echo ""
