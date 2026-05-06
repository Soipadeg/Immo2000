#!/usr/bin/env bash

# ====================================================================
# Script pour démarrer le serveur Flask avec l'environnement correct
# ====================================================================
#
# Usage:
#   chmod +x run.sh
#   ./run.sh
#

set -e

echo "🚀 Démarrage du serveur Immo2000..."
echo ""

cd /home/djali/code/Soipadeg/Immo2000/backend

# Variables d'environnement
export PYTHONPATH=.
export FLASK_APP=src.app:create_app
export FLASK_ENV=development
export FLASK_DEBUG=1

echo "📁 Répertoire courant: $(pwd)"
echo "📦 PYTHONPATH: $PYTHONPATH"
echo "📝 FLASK_APP: $FLASK_APP"
echo "⚙️  FLASK_ENV: $FLASK_ENV"
echo ""

# Lancer Flask
python -m flask run --host=0.0.0.0 --port=5000
