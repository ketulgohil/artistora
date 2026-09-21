#!/bin/bash
# Restore database from backup
# USE WITH CAUTION - this will overwrite the current database

set -e

DB_URL="${DATABASE_URL}"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./scripts/restore-db.sh <backup_file.sql>"
  echo "Available backups:"
  ls -la ./backups/*.sql 2>/dev/null || echo "  No backups found"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
echo "   Backup file: $BACKUP_FILE"
echo "   Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

echo "🔄 Restoring database..."
psql "$DB_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully from: $BACKUP_FILE"
else
  echo "❌ Restore failed!"
  exit 1
fi
