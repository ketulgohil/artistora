/**
 * Universal Database Backup Script (Node / TypeScript)
 *
 * Works with Neon, Supabase, and local PostgreSQL without depending on
 * system pg_dump version or search_path settings.
 *
 * Usage:
 *   npx tsx scripts/backup-db.ts
 *   npm run db:backup
 */

import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { Client } from 'pg'

config({ path: path.resolve(process.cwd(), '.env') })
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  config({ path: path.resolve(process.cwd(), '.env.local') })
}

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!DB_URL) {
  console.error('❌ Error: DATABASE_URL is not set in environment or .env file.')
  process.exit(1)
}

const BACKUP_DIR = path.resolve(process.cwd(), 'backups')
fs.mkdirSync(BACKUP_DIR, { recursive: true })

function formatSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL'
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  }
  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`
  }
  return `'${String(val).replace(/'/g, "''")}'`
}

async function backup() {
  const host = DB_URL?.replace(/.*@([^:/]*).*/, '$1') || 'database'
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Artistora Database Backup Tool         ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`📡 Connecting to: ${host}...`)

  const client = new Client({ connectionString: DB_URL })
  await client.connect()

  // Ensure public schema is in search_path
  await client.query('SET search_path = public, pg_catalog;')

  try {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const backupFile = path.join(BACKUP_DIR, `db_backup_${timestamp}.sql`)

    // Get all public tables
    const tablesRes = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)

    const tables = tablesRes.rows.map(r => r.table_name)
    console.log(`📋 Found ${tables.length} tables to backup.\n`)

    const sqlLines: string[] = [
      `-- Artistora Database Backup`,
      `-- Created at: ${new Date().toISOString()}`,
      `-- Host: ${host}`,
      `-- Tables: ${tables.length}`,
      ``,
      `SET search_path = public, pg_catalog;`,
      `BEGIN;`,
      `SET CONSTRAINTS ALL DEFERRED;`,
      `SET session_replication_role = 'replica';`,
      ``,
    ]

    let totalRows = 0

    for (const table of tables) {
      // Get column names
      const colsRes = await client.query<{ column_name: string }>(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table])

      const columns = colsRes.rows.map(c => c.column_name)
      if (columns.length === 0) continue

      // Fetch rows from public schema
      const dataRes = await client.query(`SELECT * FROM public."${table}"`)
      const rows = dataRes.rows
      totalRows += rows.length

      sqlLines.push(`-- Table: public."${table}" (${rows.length} rows)`)
      sqlLines.push(`TRUNCATE TABLE public."${table}" CASCADE;`)

      if (rows.length > 0) {
        const quotedCols = columns.map(c => `"${c}"`).join(', ')
        const CHUNK_SIZE = 50

        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE)
          const valueRows = chunk.map(row => {
            const values = columns.map(col => formatSqlValue(row[col])).join(', ')
            return `(${values})`
          }).join(',\n  ')

          sqlLines.push(`INSERT INTO public."${table}" (${quotedCols}) VALUES\n  ${valueRows};`)
        }
      }

      sqlLines.push('')
      console.log(`  ✓ Backed up "${table}" (${rows.length} rows)`)
    }

    // Reset replication role and commit
    sqlLines.push(`SET session_replication_role = 'origin';`)
    sqlLines.push(`COMMIT;`)

    fs.writeFileSync(backupFile, sqlLines.join('\n'), 'utf-8')
    const stat = fs.statSync(backupFile)
    const sizeKb = (stat.size / 1024).toFixed(1)

    console.log('\n──────────────────────────────────────────')
    console.log(`✅ Backup completed successfully!`)
    console.log(`📁 File: ${backupFile}`)
    console.log(`📊 Total: ${tables.length} tables, ${totalRows} rows (${sizeKb} KB)`)
    console.log('──────────────────────────────────────────')
  } finally {
    await client.end()
  }
}

backup().catch((err) => {
  console.error('❌ Backup failed:', err.message)
  process.exit(1)
})
