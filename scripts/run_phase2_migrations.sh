#!/bin/bash
# Script to run Phase 2 database migrations for Immo2000 Enhanced Dashboard

set -e

echo "🚀 Starting Phase 2 database migrations..."
echo ""

DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-immo2000}
DB_HOST=${POSTGRES_HOST:-localhost}

echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "🔗 Host: $DB_HOST"
echo ""

# Run migrations
echo "📝 Running migration 011: Create documents table..."
psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -f database/migrations/011_create_documents_table.sql
echo "✅ Migration 011 complete"
echo ""

echo "📝 Running migration 012: Create annonce_views table..."
psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -f database/migrations/012_create_annonce_views_table.sql
echo "✅ Migration 012 complete"
echo ""

echo "📝 Running migration 013: Create search_history table..."
psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -f database/migrations/013_create_search_history_table.sql
echo "✅ Migration 013 complete"
echo ""

echo "📝 Running migration 014: Create favoris table..."
psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -f database/migrations/014_create_favoris_table.sql
echo "✅ Migration 014 complete"
echo ""

echo "📝 Running migration 015: Create offres table..."
psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -f database/migrations/015_create_offres_table.sql
echo "✅ Migration 015 complete"
echo ""

echo "🎉 All Phase 2 migrations completed successfully!"
echo ""
echo "📈 New tables created:"
echo "  - documents"
echo "  - annonce_views"
echo "  - search_history"
echo "  - favoris"
echo "  - offres"
echo ""
echo "🚀 Ready to deploy Phase 2 enhanced dashboard!"
