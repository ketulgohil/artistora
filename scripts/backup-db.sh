#!/bin/bash
# Pre-migration backup script for PostgreSQL database (Neon / Supabase / Local)
# Run BEFORE any schema change or migration
# Usage: ./scripts/backup-db.sh

set -e

# Delegate to the universal TypeScript backup script which handles Neon/Supabase poolers
# and avoids pg_dump client/server version mismatch issues.
npx tsx "$(dirname "$0")/backup-db.ts" "$@"
