#!/bin/bash

###############################################################################
# PostgreSQL Backup Script for Immo2000 Production
#
# Usage:
#   ./backup-postgres.sh                    # Backup to local directory
#   ./backup-postgres.sh s3                 # Backup and upload to S3
#   ./backup-postgres.sh s3 upload-only     # Upload existing backup to S3
#
# Cron job example (daily at 2 AM):
#   0 2 * * * cd /home/immo2000 && bash scripts/backup-postgres.sh s3 >> logs/backup.log 2>&1
#
###############################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-immo2000_postgres_prod}"
DB_NAME="${DB_NAME:-immo2000}"
DB_USER="${DB_USER:-immo2000}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/immo2000_backup_${TIMESTAMP}.sql.gz"

# AWS S3 Configuration (optional)
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

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log_info "Starting PostgreSQL backup..."
log_info "Database: ${DB_NAME}"
log_info "Backup file: ${BACKUP_FILE}"

# Check if database container is running
if ! docker ps | grep -q "${DB_CONTAINER}"; then
    log_error "Database container '${DB_CONTAINER}' is not running"
    exit 1
fi

# Create backup using docker exec
if docker exec "${DB_CONTAINER}" pg_dump \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --verbose \
    --no-password \
    --format=plain | gzip > "${BACKUP_FILE}"; then

    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log_info "✅ Backup completed successfully"
    log_info "Backup size: ${BACKUP_SIZE}"

    # Verify backup integrity
    if gzip -t "${BACKUP_FILE}"; then
        log_info "✅ Backup integrity verified"
    else
        log_error "Backup file is corrupted"
        rm "${BACKUP_FILE}"
        exit 1
    fi
else
    log_error "Backup failed"
    exit 1
fi

# Clean up old backups (local)
log_info "Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "immo2000_backup_*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete
log_info "✅ Old backups cleaned"

# Upload to S3 if requested
if [ "${1:-}" = "s3" ] && [ -n "${S3_BUCKET}" ]; then
    log_info "Uploading backup to S3..."

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Install it to enable S3 uploads."
        exit 1
    fi

    # Upload backup
    if aws s3 cp "${BACKUP_FILE}" \
        "s3://${S3_BUCKET}/${S3_PATH}/$(basename "${BACKUP_FILE}")" \
        --region "${S3_REGION}" \
        --sse AES256; then

        log_info "✅ Backup uploaded to S3"
        log_info "S3 location: s3://${S3_BUCKET}/${S3_PATH}/$(basename "${BACKUP_FILE}")"
    else
        log_error "Failed to upload backup to S3"
        exit 1
    fi

    # Clean up old S3 backups (keep last 30 days)
    log_info "Cleaning up S3 backups older than ${BACKUP_RETENTION_DAYS} days..."
    CUTOFF_DATE=$(date -d "${BACKUP_RETENTION_DAYS} days ago" +%Y-%m-%d)

    aws s3api list-objects-v2 \
        --bucket "${S3_BUCKET}" \
        --prefix "${S3_PATH}/" \
        --region "${S3_REGION}" \
        --query "Contents[?LastModified<'${CUTOFF_DATE}'].Key" \
        --output text | xargs -I {} aws s3 rm "s3://${S3_BUCKET}/{}" || true

    log_info "✅ Old S3 backups cleaned"

elif [ "${1:-}" = "s3" ] && [ -z "${S3_BUCKET}" ]; then
    log_warn "S3_BUCKET not configured. Skipping S3 upload."
fi

# Upload only mode (for existing backup)
if [ "${1:-}" = "s3" ] && [ "${2:-}" = "upload-only" ] && [ -n "${S3_BUCKET}" ]; then
    log_info "Uploading existing backup to S3..."

    LAST_BACKUP=$(ls -t "${BACKUP_DIR}"/immo2000_backup_*.sql.gz 2>/dev/null | head -1)
    if [ -z "${LAST_BACKUP}" ]; then
        log_error "No backup found to upload"
        exit 1
    fi

    aws s3 cp "${LAST_BACKUP}" \
        "s3://${S3_BUCKET}/${S3_PATH}/$(basename "${LAST_BACKUP}")" \
        --region "${S3_REGION}" \
        --sse AES256

    log_info "✅ Backup uploaded to S3"
fi

log_info "Backup process completed successfully!"
