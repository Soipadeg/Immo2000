#!/bin/bash

###############################################################################
# PostgreSQL Restore Script for Immo2000 Production
#
# Usage:
#   ./restore-postgres.sh backups/immo2000_backup_20240626_120000.sql.gz    # Restore from file
#   ./restore-postgres.sh s3                                                  # Download from S3 and restore
#
# WARNING: This will OVERWRITE the current database!
#
###############################################################################

set -euo pipefail

# Configuration
DB_CONTAINER="${DB_CONTAINER:-immo2000_postgres_prod}"
DB_NAME="${DB_NAME:-immo2000}"
DB_USER="${DB_USER:-immo2000}"
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-eu-west-1}"
S3_PATH="backups/postgresql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to restore from file
restore_from_file() {
    local backup_file="$1"

    if [ ! -f "${backup_file}" ]; then
        log_error "Backup file not found: ${backup_file}"
        exit 1
    fi

    log_warn "⚠️  WARNING: This will DELETE all data in database '${DB_NAME}' and restore from backup"
    log_warn "⚠️  Press Ctrl+C to cancel (5 seconds)..."
    sleep 5

    log_info "Starting restore process from ${backup_file}..."

    # Check if database container is running
    if ! docker ps | grep -q "${DB_CONTAINER}"; then
        log_error "Database container '${DB_CONTAINER}' is not running"
        exit 1
    fi

    # Drop and recreate database
    log_info "Dropping existing database..."
    docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" || true

    log_info "Creating new database..."
    docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};" || true

    # Restore from backup
    log_info "Restoring data from backup..."
    if gzip -dc "${backup_file}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"; then
        log_info "✅ Restore completed successfully"
        return 0
    else
        log_error "Restore failed"
        return 1
    fi
}

# Function to restore from S3
restore_from_s3() {
    if [ -z "${S3_BUCKET}" ]; then
        log_error "S3_BUCKET is not configured"
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi

    log_info "Listing available backups on S3..."
    aws s3 ls "s3://${S3_BUCKET}/${S3_PATH}/" \
        --region "${S3_REGION}" \
        --recursive | grep "immo2000_backup" | tail -10

    log_info "Enter the backup filename to restore (from list above):"
    read -p "Filename: " backup_filename

    if [ -z "${backup_filename}" ]; then
        log_error "No filename provided"
        exit 1
    fi

    local s3_path="s3://${S3_BUCKET}/${S3_PATH}/${backup_filename}"
    local local_file="/tmp/${backup_filename}"

    log_info "Downloading ${backup_filename} from S3..."
    if aws s3 cp "${s3_path}" "${local_file}" --region "${S3_REGION}"; then
        log_info "✅ Download completed"
        restore_from_file "${local_file}"
        rm "${local_file}"
    else
        log_error "Failed to download backup from S3"
        exit 1
    fi
}

# Main logic
if [ $# -eq 0 ]; then
    log_error "Usage: $0 <backup_file> or $0 s3"
    exit 1
fi

if [ "$1" = "s3" ]; then
    restore_from_s3
else
    restore_from_file "$1"
fi
