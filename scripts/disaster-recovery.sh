#!/bin/bash

###############################################################################
# Disaster Recovery Plan
#
# Comprehensive disaster recovery procedures
# Handles database restoration, service recovery, and health verification
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RECOVERY_LOG="disaster-recovery-$(date +%Y%m%d_%H%M%S).log"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose-prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$RECOVERY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$RECOVERY_LOG"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$RECOVERY_LOG"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$RECOVERY_LOG"
}

step() {
    echo -e "\n${BLUE}========== $1 ==========${NC}" | tee -a "$RECOVERY_LOG"
}

check_environment() {
    step "Checking Environment"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    log "Docker found: $(docker --version)"

    # Check docker-compose
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed"
    fi
    log "docker-compose found: $(docker-compose --version)"

    # Check compose file
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    fi
    log "Docker Compose file found"

    # Check backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory not found: $BACKUP_DIR"
    fi
    log "Backup directory: $BACKUP_DIR"

    # List available backups
    local backup_count=$(find "$BACKUP_DIR" -name "*.sql.gz" 2>/dev/null | wc -l)
    log "Available backups: $backup_count"

    if [ $backup_count -eq 0 ]; then
        warning "No backups found!"
    fi
}

stop_services() {
    step "Stopping Services"

    log "Stopping Docker Compose services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down 2>&1 | tee -a "$RECOVERY_LOG"

    log "Services stopped"
    sleep 2
}

start_services() {
    step "Starting Services"

    log "Starting Docker Compose services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d 2>&1 | tee -a "$RECOVERY_LOG"

    log "Waiting for services to be ready..."
    sleep 5
}

verify_docker_services() {
    step "Verifying Docker Services"

    log "Service status:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps | tee -a "$RECOVERY_LOG"

    # Check if critical services are running
    local services=("postgres" "redis" "backend")
    for service in "${services[@]}"; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log "✓ $service is running"
        else
            error "$service is not running"
        fi
    done
}

verify_database_connection() {
    step "Verifying Database Connection"

    local postgres_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q postgres)

    if [ -z "$postgres_container" ]; then
        error "PostgreSQL container not found"
    fi

    log "Testing database connection..."

    if docker exec "$postgres_container" pg_isready -U immobilier > /dev/null 2>&1; then
        log "✓ Database connection successful"

        # Show database info
        docker exec "$postgres_container" psql -U immobilier -l | tee -a "$RECOVERY_LOG"
    else
        error "Cannot connect to database"
    fi
}

verify_redis_connection() {
    step "Verifying Redis Connection"

    local redis_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)

    if [ -z "$redis_container" ]; then
        error "Redis container not found"
    fi

    log "Testing Redis connection..."

    if docker exec "$redis_container" redis-cli ping > /dev/null 2>&1; then
        log "✓ Redis connection successful"

        # Show Redis info
        docker exec "$redis_container" redis-cli info stats | tee -a "$RECOVERY_LOG"
    else
        error "Cannot connect to Redis"
    fi
}

verify_backend_api() {
    step "Verifying Backend API"

    log "Testing API endpoints..."

    # Wait for backend to be ready
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            log "✓ Backend API is responding"

            # Test specific endpoints
            curl -s http://localhost:5000/api/annonces \
                | head -c 100 >> "$RECOVERY_LOG"
            echo "" >> "$RECOVERY_LOG"

            return 0
        fi

        attempt=$((attempt + 1))
        sleep 1
    done

    warning "Backend API is not responding (may take longer to start)"
}

list_backups() {
    step "Available Backups"

    if [ ! -d "$BACKUP_DIR" ]; then
        warning "Backup directory not found: $BACKUP_DIR"
        return
    fi

    local backups=($(find "$BACKUP_DIR" -name "*.sql.gz" -type f | sort -rn))

    if [ ${#backups[@]} -eq 0 ]; then
        error "No backups found in $BACKUP_DIR"
    fi

    echo "Most recent backups:" | tee -a "$RECOVERY_LOG"
    for i in "${!backups[@]}"; do
        if [ $i -ge 5 ]; then break; fi
        local size=$(du -h "${backups[$i]}" | cut -f1)
        local date=$(stat -f %Sm -t "%Y-%m-%d %H:%M:%S" "${backups[$i]}" 2>/dev/null || \
                    stat -c %y "${backups[$i]}" | cut -d' ' -f1-2 2>/dev/null)
        echo "  [$i] $(basename "${backups[$i]}") - $size - $date" | tee -a "$RECOVERY_LOG"
    done
}

restore_from_backup() {
    local backup_file=$1

    step "Restoring from Backup"

    if [ -z "$backup_file" ]; then
        list_backups

        read -p "Enter backup index (0-4) or full path: " -r

        if [[ $REPLY =~ ^[0-4]$ ]]; then
            local backups=($(find "$BACKUP_DIR" -name "*.sql.gz" -type f | sort -rn))
            backup_file="${backups[$REPLY]}"
        else
            backup_file="$REPLY"
        fi
    fi

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi

    log "Restoring from: $(basename "$backup_file")"

    # Run restore script
    if [ -f "./scripts/restore.sh" ]; then
        bash ./scripts/restore.sh "$backup_file" "immo2000_db" | tee -a "$RECOVERY_LOG"
    else
        error "Restore script not found: ./scripts/restore.sh"
    fi
}

health_check() {
    step "Running Health Checks"

    local health_status=0

    # Check services
    log "Checking service status..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        log "✓ Services are running"
    else
        warning "Some services are not running"
        health_status=1
    fi

    # Check database
    log "Checking database..."
    local postgres_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q postgres)
    if docker exec "$postgres_container" pg_isready -U immobilier > /dev/null 2>&1; then
        log "✓ Database is accessible"
    else
        warning "Database is not accessible"
        health_status=1
    fi

    # Check Redis
    log "Checking Redis cache..."
    local redis_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)
    if docker exec "$redis_container" redis-cli ping > /dev/null 2>&1; then
        log "✓ Redis is accessible"
    else
        warning "Redis is not accessible"
        health_status=1
    fi

    # Check API
    log "Checking backend API..."
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        log "✓ API is accessible"
    else
        warning "API is not accessible"
        health_status=1
    fi

    return $health_status
}

generate_recovery_report() {
    step "Generating Recovery Report"

    local report_file="recovery-report-$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "Disaster Recovery Report"
        echo "Generated: $(date)"
        echo ""
        echo "Recovery Steps Executed:"
        tail -50 "$RECOVERY_LOG"
    } > "$report_file"

    log "Recovery report saved: $report_file"
}

# Menu
show_menu() {
    echo ""
    echo -e "${BLUE}=== Disaster Recovery Menu ===${NC}"
    echo "1) Full Recovery (all steps)"
    echo "2) Restore from Backup"
    echo "3) Health Check"
    echo "4) Stop Services"
    echo "5) Start Services"
    echo "6) Exit"
    echo ""
}

# Main execution
main() {
    log "================================"
    log "DISASTER RECOVERY PROCEDURE"
    log "================================"

    case "${1:-menu}" in
        full)
            check_environment
            stop_services
            start_services
            verify_docker_services
            verify_database_connection
            verify_redis_connection
            sleep 5
            verify_backend_api
            health_check
            generate_recovery_report
            ;;

        restore)
            restore_from_backup "${2:-}"
            ;;

        health)
            health_check
            ;;

        stop)
            stop_services
            ;;

        start)
            start_services
            verify_docker_services
            ;;

        *)
            echo "Disaster Recovery Script"
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  full      Full disaster recovery (all steps)"
            echo "  restore   Restore from backup"
            echo "  health    Run health checks"
            echo "  stop      Stop all services"
            echo "  start     Start all services"
            echo ""
            echo "Example:"
            echo "  $0 full"
            echo "  $0 restore ./backups/backup.sql.gz"
            exit 0
            ;;
    esac
}

# Run
main "$@"
