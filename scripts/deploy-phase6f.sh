#!/bin/bash
# Phase 6f Production Deployment Script
# Usage: ./deploy-phase6f.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ========================================
# 1. Validation
# ========================================
log_info "=== Phase 6f Deployment for $ENVIRONMENT ==="

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

if [[ "$ENVIRONMENT" == "production" && ! -f "$PROJECT_ROOT/.env.production" ]]; then
    log_error ".env.production not found. Create it with production credentials."
    exit 1
fi

cd "$PROJECT_ROOT"

# ========================================
# 2. Build Docker Images
# ========================================
log_info "Building Docker images..."

if [ -f "Dockerfile.backend" ]; then
    docker build -t immo2000-backend:latest -f Dockerfile.backend .
    log_success "Backend image built"
else
    log_error "Dockerfile.backend not found"
    exit 1
fi

if [ -f "Dockerfile.frontend" ]; then
    docker build -t immo2000-frontend:latest -f Dockerfile.frontend frontend/
    log_success "Frontend image built"
else
    log_warn "Dockerfile.frontend not found - skipping frontend build"
fi

# ========================================
# 3. Run Tests
# ========================================
log_info "Running tests..."

COMPOSE_FILE="docker-compose-prod.yml"

# Start services
docker-compose -f $COMPOSE_FILE up -d postgres redis

# Wait for services
log_info "Waiting for services to start..."
sleep 10

# Run tests
if docker-compose -f $COMPOSE_FILE run --rm backend pytest tests/ -v --tb=short; then
    log_success "All tests passed"
else
    log_error "Tests failed"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
fi

# ========================================
# 4. Database Migrations
# ========================================
log_info "Running database migrations..."

if docker-compose -f $COMPOSE_FILE run --rm backend python -m alembic upgrade head; then
    log_success "Database migrations completed"
else
    log_error "Database migrations failed"
    exit 1
fi

# ========================================
# 5. Deploy
# ========================================
log_info "Starting deployment..."

if [ "$ENVIRONMENT" == "production" ]; then
    ENV_FILE=".env.production"
    COMPOSE_EXTRA_ARGS="--file docker-compose-prod.yml"
else
    ENV_FILE=".env.staging"
    COMPOSE_EXTRA_ARGS="--file docker-compose-prod.yml"
fi

# Start all services
docker-compose -f docker-compose-prod.yml \
    --env-file $ENV_FILE \
    up -d

log_success "Services started"

# ========================================
# 6. Health Checks
# ========================================
log_info "Running health checks..."

# Wait for backend
for i in {1..30}; do
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        log_success "Backend health check passed"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Backend health check failed after 30 attempts"
        docker-compose -f docker-compose-prod.yml logs backend
        exit 1
    fi
    log_info "Waiting for backend... ($i/30)"
    sleep 2
done

# Check API
if curl -f http://localhost:8000/api/v1/health >/dev/null 2>&1; then
    log_success "API health check passed"
else
    log_warn "API health check failed"
fi

# ========================================
# 7. Summary
# ========================================
log_success "=== Deployment Complete ==="
echo ""
log_info "Services running:"
docker-compose -f docker-compose-prod.yml ps
echo ""
log_info "Access points:"
echo "  - Frontend: http://localhost/"
echo "  - Backend API: http://localhost/api/v1"
echo "  - Swagger UI: http://localhost/api/v1/docs"
echo ""
log_info "Useful commands:"
echo "  - View logs:       docker-compose -f docker-compose-prod.yml logs -f"
echo "  - Stop services:   docker-compose -f docker-compose-prod.yml down"
echo "  - Database shell:  docker-compose -f docker-compose-prod.yml exec postgres psql -U postgres -d immo2000"
echo ""
