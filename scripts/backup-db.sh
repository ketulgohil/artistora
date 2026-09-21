#!/bin/bash
# Pre-migration backup script for Neon database
# Run BEFORE any Payload migration on production

set -e

DB_URL="${DATABASE_URL}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "📦 Creating database backup..."
echo "   Database: $(echo $DB_URL | sed 's/.*@\([^/]*\).*/\1/')"
echo "   Backup file: $BACKUP_FILE"

# Use pg_dump via neon's connection string
pg_dump "$DB_URL" > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Backup created successfully: $BACKUP_FILE"
  echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "❌ Backup failed!"
  exit 1
fi
