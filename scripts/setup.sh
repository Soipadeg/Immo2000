#!/usr/bin/env bash
# Script de démarrage complet pour Immo2000

set -e  # Exit on error

echo "=============================================="
echo "🚀 Immo2000 - Startup Script"
echo "=============================================="
echo

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Python
echo -e "${BLUE}1. Checking Python...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python ${python_version}${NC}"
echo

# 2. Check .env
echo -e "${BLUE}2. Checking .env...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  .env not found, creating from .env.example${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Edit backend/.env and set JWT_SECRET_KEY!${NC}"
    echo
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env exists${NC}"
fi
echo

# 3. Install dependencies
echo -e "${BLUE}3. Installing dependencies...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -q -r requirements.txt
cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo

# 4. Test authentication
echo -e "${BLUE}4. Testing authentication system...${NC}"
cd backend
python scripts/test_auth_quick.py
cd ..
echo

# 5. Display next steps
echo "=============================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "=============================================="
echo
echo -e "${BLUE}Next steps:${NC}"
echo "1. Start the server:"
echo -e "   ${YELLOW}cd backend && python -m flask run${NC}"
echo
echo "2. In another terminal, test endpoints:"
echo -e "   ${YELLOW}curl -X POST http://localhost:5000/auth/login ...${NC}"
echo
echo "3. Read documentation:"
echo -e "   ${YELLOW}cat QUICKSTART_AUTH.md${NC}"
echo -e "   ${YELLOW}cat AUTHENTICATION.md${NC}"
echo
echo "4. Run full test suite:"
echo -e "   ${YELLOW}cd backend && pytest tests/test_auth.py -v${NC}"
echo
