import pg from 'pg'
import dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

let _pool: pg.Pool | null = null

/**
 * Returns a singleton PostgreSQL Pool instance for direct database aggregations
 * and high-performance queries.
 */
export function getDbPool(): pg.Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_URL is not defined in environment.')
    }

    const isRemote =
      connectionString.includes('sslmode=') ||
      connectionString.includes('supabase.com') ||
      connectionString.includes('neon.tech') ||
      connectionString.includes('pooler') ||
      connectionString.includes('amazonaws.com')

    _pool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 8000,
      ssl: isRemote ? { rejectUnauthorized: false } : false,
    })

    _pool.on('error', (err) => {
      console.warn('PostgreSQL Pool unexpected client error:', err.message)
    })
  }

  return _pool
}

/**
 * Helper to run a parameterized SQL query with automatic pool resolution.
 */
export async function queryDb<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  const pool = getDbPool()
  return pool.query<T>(text, params)
}

/**
 * Closes the PostgreSQL connection pool.
 */
export async function closeDbPool(): Promise<void> {
  if (_pool) {
    await _pool.end().catch(() => {})
    _pool = null
  }
}
