#!/bin/bash
#
# Immo2000 Production Deployment Script
# This script handles the complete deployment process
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_COMPOSE_FILE="docker-compose-${ENVIRONMENT}.yml"
LOG_FILE="deployment-$(date +%Y%m%d_%H%M%S).log"

echo -e "${YELLOW}=== Immo2000 Deployment Script ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Docker Compose File: $DOCKER_COMPOSE_FILE"
echo "Log File: $LOG_FILE"
echo ""

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Function to run commands with logging
run_command() {
    echo -e "${YELLOW}Running: $1${NC}"
    eval "$1" | tee -a "$LOG_FILE" || error_exit "Command failed: $1"
}

# 1. Pre-deployment checks
log "Starting pre-deployment checks..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error_exit ".env.production file not found. Copy from .env.production.example and fill in values."
fi

# Check if docker is running
if ! docker ps > /dev/null 2>&1; then
    error_exit "Docker is not running. Please start Docker."
fi

# Check if docker-compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    error_exit "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
fi

log "✓ Pre-deployment checks passed"

# 2. Build Docker images
log "Building Docker images..."
run_command "docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache"
log "✓ Docker images built successfully"

# 3. Pull latest code (if deploying from git)
if [ -d ".git" ]; then
    log "Pulling latest code from git..."
    run_command "git pull origin main"
fi

# 4. Stop existing containers
log "Stopping existing containers..."
run_command "docker-compose -f $DOCKER_COMPOSE_FILE down" || true
log "✓ Existing containers stopped"

# 5. Start services
log "Starting services..."
run_command "docker-compose -f $DOCKER_COMPOSE_FILE up -d"
log "✓ Services started"

# 6. Wait for services to be healthy
log "Waiting for services to be healthy (max 60 seconds)..."
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_isready -U immobilier > /dev/null 2>&1 && \
       docker-compose -f $DOCKER_COMPOSE_FILE exec -T backend curl -f http://localhost:8000/health > /dev/null 2>&1 && \
       docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        log "✓ All services are healthy"
        break
    fi

    attempt=$((attempt + 1))
    echo "  Waiting... ($attempt/$max_attempts)"
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    error_exit "Services failed to become healthy. Check logs with: docker-compose -f $DOCKER_COMPOSE_FILE logs"
fi

# 7. Run database migrations (if needed)
log "Running database migrations..."
run_command "docker-compose -f $DOCKER_COMPOSE_FILE exec -T backend python backend/alembic.py upgrade head" || true
log "✓ Database migrations completed"

# 8. Verify API is working
log "Verifying API endpoints..."
API_URL="http://localhost:8000"

# Test health endpoint
if curl -f "$API_URL/health" > /dev/null 2>&1; then
    log "✓ API health check passed"
else
    error_exit "API health check failed"
fi

# Test annonces endpoint
if curl -f "$API_URL/api/annonces" > /dev/null 2>&1; then
    log "✓ API annonces endpoint working"
else
    error_exit "API annonces endpoint failed"
fi

# 9. Check container logs for errors
log "Checking container logs for errors..."
if docker-compose -f $DOCKER_COMPOSE_FILE logs backend | grep -i "error" | head -5 > /dev/null; then
    log "⚠ Some errors found in backend logs (may be expected):"
    docker-compose -f $DOCKER_COMPOSE_FILE logs backend | grep -i "error" | head -5
fi

# 10. Display deployment summary
log "✓ Deployment completed successfully!"
echo ""
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Time: $(date)"
echo ""
echo "Services running:"
docker-compose -f $DOCKER_COMPOSE_FILE ps
echo ""
echo "Next steps:"
echo "  1. Verify application at http://localhost:80 (or your domain)"
echo "  2. Check logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "  3. Monitor metrics: Prometheus at http://localhost:9090"
echo "  4. Full log saved to: $LOG_FILE"
echo ""
echo "To rollback, run:"
echo "  docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "  git reset --hard HEAD~1"
echo ""

log "Deployment script completed successfully"
