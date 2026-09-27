#!/bin/bash
# Restore PostgreSQL database from backup
# USE WITH CAUTION - this will restore the database to the state in the backup file
# Usage: ./scripts/restore-db.sh <path_to_backup.sql> [--yes]

set -e

# Delegate to the universal TypeScript restore script
npx tsx "$(dirname "$0")/restore-db.ts" "$@"
