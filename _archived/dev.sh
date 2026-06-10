#!/bin/bash
# =========================================================================
# Immo2000 - Development Mode (Simple)
# Lance le backend FastAPI et le frontend Vite en parallèle
# =========================================================================

set -e

# Couleurs pour l'output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Immo2000 - Development Mode${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:${BACKEND_PORT}"
echo -e "${GREEN}Frontend:${NC} http://localhost:${FRONTEND_PORT}"
echo ""

# Fonction pour arrêter les serveurs
cleanup() {
    echo ""
    echo -e "${BLUE}Arrêt des serveurs...${NC}"
    # Tuer les processus enfants
    jobs -p | xargs kill -s TERM 2>/dev/null || true
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

# Vérifier les prérequis
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 n'est pas installé${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}❌ File not found: $BACKEND_DIR/.env${NC}"
    exit 1
fi

# Backend en arrière-plan
(
    cd "$BACKEND_DIR"
    # Vérifier venv
    if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
        echo -e "${BLUE}[Backend]${NC} Créer un virtual environment..."
        python3 -m venv venv
    fi

    # Activer le venv
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi

    echo -e "${GREEN}[Backend]${NC} Démarrage FastAPI sur le port $BACKEND_PORT..."
    echo -e "${GREEN}[Backend]${NC} (Premier démarrage peut prendre un moment...)"
    uvicorn src.main:create_app --host 0.0.0.0 --port $BACKEND_PORT --reload 2>&1 | sed "s/^/[Backend] /"
) &
BACKEND_PID=$!

# Frontend en arrière-plan
(
    cd "$FRONTEND_DIR"

    # Vérifier node_modules
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}[Frontend]${NC} Installer les dépendances npm..."
        npm install
    fi

    echo -e "${GREEN}[Frontend]${NC} Démarrage Vite sur le port $FRONTEND_PORT..."
    npm run dev -- --port $FRONTEND_PORT 2>&1 | sed "s/^/[Frontend] /"
) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Serveurs en cours de démarrage!${NC}"
echo ""
echo -e "${BLUE}📝 URLs:${NC}"
echo "   Backend:  http://localhost:${BACKEND_PORT}"
echo "   Frontend: http://localhost:${FRONTEND_PORT}"
echo "   Docs API: http://localhost:${BACKEND_PORT}/docs"
echo ""
echo "   Appuyez sur Ctrl+C pour arrêter..."
echo ""

# Attendre l'arrêt
wait
