#!/bin/bash

###############################################################################
# Restore Database from Backup
#
# Restores PostgreSQL database from compressed backup file
# Usage: ./restore.sh [backup_file] [database_name]
###############################################################################

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

# Configuration
BACKUPS_DIR="${BACKUPS_DIR:-./backups}"
DOCKER_CONTAINER="${DOCKER_CONTAINER:-immo2000-postgres-1}"
DB_USER="${DB_USER:-immobilier}"
DB_NAME="${DB_NAME:-immo2000_db}"
LOG_FILE="restore-$(date +%Y%m%d_%H%M%S).log"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

usage() {
    cat << EOF
Usage: $0 [backup_file] [database_name]

Arguments:
    backup_file     Path to backup file (required)
    database_name   Database name to restore to (default: $DB_NAME)

Examples:
    $0 ./backups/immo2000_db_backup_20240605.sql.gz
    $0 ./backups/immo2000_db_backup_20240605.sql.gz immo2000_prod

Environment Variables:
    BACKUPS_DIR         Backups directory (default: ./backups)
    DOCKER_CONTAINER    Docker PostgreSQL container (default: $DOCKER_CONTAINER)
    DB_USER            Database user (default: $DB_USER)
    DB_NAME            Database name (default: $DB_NAME)
EOF
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if backup file provided
    if [ -z "$1" ]; then
        error "No backup file specified"
        usage
    fi

    # Check if backup file exists
    if [ ! -f "$1" ]; then
        error "Backup file not found: $1"
        exit 1
    fi

    # Check if Docker container running
    if ! docker ps | grep -q "$DOCKER_CONTAINER"; then
        error "PostgreSQL container not running: $DOCKER_CONTAINER"
        error "Start with: docker-compose up -d postgres"
        exit 1
    fi

    log "Prerequisites OK"
}

get_file_size() {
    local file=$1
    if command -v du &> /dev/null; then
        du -h "$file" | cut -f1
    else
        ls -lh "$file" | awk '{print $5}'
    fi
}

decompress_backup() {
    local backup_file=$1
    local decompressed_file="${backup_file%.gz}"

    log "Decompressing backup: $backup_file"
    log "Original size: $(get_file_size "$backup_file")"

    # Check if already decompressed
    if [ -f "$decompressed_file" ]; then
        warning "Decompressed file already exists: $decompressed_file"
        echo "$decompressed_file"
        return
    fi

    if gunzip -k "$backup_file"; then
        log "Decompression successful"
        log "Decompressed size: $(get_file_size "$decompressed_file")"
        echo "$decompressed_file"
    else
        error "Failed to decompress backup"
        exit 1
    fi
}

create_pre_restore_dump() {
    local db_name=$1
    local pre_restore_backup="backup-pre-restore-$(date +%Y%m%d_%H%M%S).sql.gz"

    log "Creating pre-restore backup of $db_name..."

    docker exec "$DOCKER_CONTAINER" pg_dump \
        -U "$DB_USER" \
        "$db_name" | gzip > "$BACKUPS_DIR/$pre_restore_backup" 2>/dev/null

    if [ $? -eq 0 ]; then
        log "Pre-restore backup created: $pre_restore_backup"
        echo "$pre_restore_backup"
    else
        warning "Failed to create pre-restore backup"
        return 1
    fi
}

restore_database() {
    local backup_file=$1
    local db_name=$2

    log "Restoring database: $db_name"
    log "From backup: $(basename "$backup_file")"

    # Check if database exists
    if docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -lqt \
        | cut -d \| -f 1 | grep -qw "$db_name"; then

        warning "Database '$db_name' already exists"
        read -p "Drop existing database? (y/N): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Dropping existing database: $db_name"
            docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -c \
                "DROP DATABASE IF EXISTS $db_name;" || true
        else
            error "Cannot restore without dropping existing database"
            exit 1
        fi
    fi

    # Create database
    log "Creating database: $db_name"
    docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" \
        -c "CREATE DATABASE $db_name;" || {
        error "Failed to create database"
        exit 1
    }

    # Restore from backup
    log "Restoring data from backup..."
    local start_time=$(date +%s)

    if docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" "$db_name" \
        < "$backup_file" > /dev/null 2>&1; then

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log "Database restored successfully"
        log "Restore duration: ${duration}s"
    else
        error "Failed to restore database"
        exit 1
    fi
}

verify_restore() {
    local db_name=$1

    log "Verifying restore..."

    # Count tables
    local table_count=$(docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" \
        "$db_name" -c "SELECT count(*) FROM information_schema.tables \
        WHERE table_schema='public';" | tail -1)

    log "Tables found: $table_count"

    if [ "$table_count" -gt 0 ]; then
        log "Restore verification: OK"
        return 0
    else
        error "No tables found in restored database"
        return 1
    fi
}

cleanup() {
    local decompressed=$1

    if [ -z "$KEEP_DECOMPRESSED" ] && [ -f "$decompressed" ]; then
        log "Cleaning up decompressed file..."
        rm -f "$decompressed"
    fi
}

# Main execution
main() {
    local backup_file=$1
    local db_name=${2:-$DB_NAME}

    log "================================"
    log "PostgreSQL Database Restore"
    log "================================"
    log "Backup file: $backup_file"
    log "Database: $db_name"
    log "Container: $DOCKER_CONTAINER"
    log "Log file: $LOG_FILE"

    # Prerequisites
    check_prerequisites "$backup_file"

    # Decompress if needed
    local decompressed_file="$backup_file"
    if [[ $backup_file == *.gz ]]; then
        decompressed_file=$(decompress_backup "$backup_file")
    fi

    # Create pre-restore backup
    pre_restore_backup=$(create_pre_restore_dump "$db_name")

    # Restore
    restore_database "$decompressed_file" "$db_name"

    # Verify
    if verify_restore "$db_name"; then
        log "================================"
        log "RESTORE SUCCESSFUL"
        log "Database: $db_name"
        log "Pre-restore backup: $pre_restore_backup (in case of rollback)"
        log "================================"
    else
        error "RESTORE VERIFICATION FAILED"
        exit 1
    fi

    # Cleanup
    cleanup "$decompressed_file"
}

# Run main
main "$@"
