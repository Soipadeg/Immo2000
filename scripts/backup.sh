#!/bin/bash
#
# Immo2000 PostgreSQL Backup Script
# Automated backup with rotation and compression
#

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-.}/backups"
RETENTION_DAYS=${RETENTION_DAYS:-30}
DATABASE_USER=${DATABASE_USER:-immobilier}
DATABASE_NAME=${DATABASE_NAME:-immo2000_db}
DATABASE_HOST=${DATABASE_HOST:-localhost}
DATABASE_PORT=${DATABASE_PORT:-5432}
COMPRESS=${COMPRESS:-true}
UPLOAD_TO_S3=${UPLOAD_TO_S3:-false}
AWS_S3_BUCKET=${AWS_S3_BUCKET:-immo2000-backups}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/immo2000_${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting PostgreSQL backup..."

# Create backup
echo "Creating backup: $BACKUP_FILE"
PGPASSWORD="${DATABASE_PASSWORD}" pg_dump \
    --host="$DATABASE_HOST" \
    --port="$DATABASE_PORT" \
    --username="$DATABASE_USER" \
    --format=plain \
    --verbose \
    "$DATABASE_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully"

    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  Size: $FILE_SIZE"
else
    echo "✗ Backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Compress backup if enabled
if [ "$COMPRESS" = true ]; then
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"

    if [ -f "$BACKUP_FILE_COMPRESSED" ]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
        echo "✓ Backup compressed successfully"
        echo "  Size: $COMPRESSED_SIZE"
        BACKUP_FILE="$BACKUP_FILE_COMPRESSED"
    fi
fi

# Upload to S3 if enabled
if [ "$UPLOAD_TO_S3" = true ]; then
    echo "Uploading backup to S3..."
    if aws s3 cp "$BACKUP_FILE" "s3://${AWS_S3_BUCKET}/$(basename $BACKUP_FILE)" --region eu-west-1; then
        echo "✓ Backup uploaded to S3"
    else
        echo "⚠ S3 upload failed (backup still available locally)"
    fi
fi

# Rotate old backups
echo "Rotating old backups (keeping last $RETENTION_DAYS days)..."
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

find "$BACKUP_DIR" -name "immo2000_*.sql.gz" -type f | while read backup; do
    BACKUP_DATE=$(echo "$(basename $backup)" | sed 's/immo2000_\([0-9]*\)_[0-9]*.sql.gz/\1/')
    if [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
        echo "  Removing old backup: $(basename $backup)"
        rm -f "$backup"
    fi
done

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR" | tail -10

echo ""
echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Backup completed successfully"
