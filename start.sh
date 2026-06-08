#!/bin/bash
# Démarrage FastAPI pour Railway/Heroku

# Aller au répertoire backend
cd "$(dirname "$0")/backend" || exit 1

# Démarrer Uvicorn
exec uvicorn src.main:create_app \
  --host 0.0.0.0 \
  --port ${PORT:-8000} \
  --workers ${WORKERS:-4}
