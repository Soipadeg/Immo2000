# Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Installer les dépendances de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements et installer les dépendances Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.12-slim

WORKDIR /app

# Installer les dépendances d'exécution (PostgreSQL client, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copier les dépendances Python depuis le builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copier le code source (backend + static files)
COPY backend/ /app/backend/
COPY static/ /app/static/

# Ajouter le répertoire local aux chemins Python
ENV PATH=/usr/local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend:$PYTHONPATH \
    FLASK_APP=src.app \
    FLASK_ENV=development

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# User non-root pour sécurité
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Port d'exposition
EXPOSE 5000

# Commande de démarrage
CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "src.app:create_app()"]
