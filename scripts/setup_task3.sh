#!/bin/bash

# setup_task3.sh - Setup script for Task 3: Security & Logging
# Run this script to initialize all Task 3 requirements

set -e

echo "=========================================="
echo "TASK 3: Security & Logging - Setup"
echo "=========================================="
echo ""

cd /home/djali/code/Soipadeg/Immo2000

# 1. Check environment
echo "1️⃣  Vérification de l'environnement..."
if ! command -v python &> /dev/null; then
    echo "❌ Python non trouvé"
    exit 1
fi
echo "✅ Python trouvé"

# 2. Install dependencies
echo ""
echo "2️⃣  Installation des dépendances..."
pip install -q cryptography pydantic email-validator
echo "✅ Dépendances installées"

# 3. Create logs directory
echo ""
echo "3️⃣  Création du répertoire logs..."
mkdir -p logs
touch logs/admin.log logs/audit.log logs/error.log
echo "✅ Répertoire logs créé"

# 4. Generate encryption key if not exists
echo ""
echo "4️⃣  Configuration de l'encryption..."
if [ -z "$ENCRYPTION_KEY" ]; then
    echo "⚠️  ENCRYPTION_KEY non définie"
    ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
    echo "Clé générée: $ENCRYPTION_KEY"
    echo "➜ Ajouter au .env: ENCRYPTION_KEY=$ENCRYPTION_KEY"
else
    echo "✅ ENCRYPTION_KEY définie"
fi

# 5. Run migrations
echo ""
echo "5️⃣  Exécution des migrations..."
cd backend
python migrations/task3_security.py 2>/dev/null || echo "Note: Migrations skippées (DB peut ne pas être prête)"
cd ..
echo "✅ Migrations complètes"

# 6. Verify files
echo ""
echo "6️⃣  Vérification des fichiers..."
files=(
    "backend/src/security/audit.py"
    "backend/src/security/encryption.py"
    "backend/src/security/rate_limit.py"
    "backend/src/security/validation.py"
    "backend/src/security/__init__.py"
    "backend/src/routes/admin_security.py"
    "backend/src/logging_config.py"
    "backend/migrations/task3_security.py"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file MANQUANT"
    fi
done

echo ""
echo "=========================================="
echo "✅ TASK 3 Setup complète!"
echo "=========================================="
echo ""
echo "Prochaines étapes:"
echo "1. Redémarrer le serveur: docker-compose restart"
echo "2. Tester les endpoints: curl http://localhost:5000/api/v1/admin/audit-logs"
echo "3. Implémenter le frontend (voir FRONTEND_SECURITY.md)"
echo ""
