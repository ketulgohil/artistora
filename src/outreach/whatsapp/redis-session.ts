/**
 * WhatsApp Session Persistence via Upstash Redis
 *
 * Saves the critical Chromium profile files (Cookies, Local Storage, Session Storage,
 * IndexedDB) to Redis so the WhatsApp session survives process restarts without
 * requiring QR code re-scanning.
 *
 * Total payload: ~10KB compressed — well within Upstash free tier limits.
 */

import { Redis } from '@upstash/redis'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
config({ path: path.resolve(process.cwd(), '.env') })

const REDIS_KEY = 'whatsapp:session:tarball'
const CRITICAL_PATHS = [
  'Default/Cookies',
  'Default/Cookies-journal',
  'Default/Local Storage',
  'Default/Session Storage',
  'Default/IndexedDB',
]

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required')
  return new Redis({ url, token })
}

/**
 * Save the critical WhatsApp session files to Redis as a compressed tarball.
 */
export async function saveSessionToRedis(sessionDir: string): Promise<boolean> {
  try {
    const redis = getRedis()
    const tmpPath = path.join('/tmp', `wa-session-${Date.now()}.tar.gz`)

    // Build tar with only critical auth files
    const existingPaths = CRITICAL_PATHS.filter(p =>
      fs.existsSync(path.join(sessionDir, p))
    )

    if (existingPaths.length === 0) {
      console.error('[RedisSession] No critical session files found to save')
      return false
    }

    const tarArgs = existingPaths.map(p => `"${p}"`).join(' ')
    execSync(`tar czf "${tmpPath}" -C "${sessionDir}" ${tarArgs}`, {
      stdio: 'pipe',
      timeout: 10000,
    })

    const buf = fs.readFileSync(tmpPath)
    fs.unlinkSync(tmpPath)

    // Store as base64 string
    const b64 = buf.toString('base64')
    await redis.set(REDIS_KEY, b64)

    console.log(`[RedisSession] ✅ Saved ${(buf.length / 1024).toFixed(1)}KB session to Redis`)
    return true
  } catch (err: any) {
    console.error('[RedisSession] Failed to save:', err.message)
    return false
  }
}

/**
 * Restore WhatsApp session files from Redis.
 * Returns true if session was restored, false if no session found.
 */
export async function loadSessionFromRedis(sessionDir: string): Promise<boolean> {
  try {
    const redis = getRedis()
    const b64 = await redis.get<string>(REDIS_KEY)

    if (!b64) {
      console.log('[RedisSession] No session found in Redis')
      return false
    }

    const buf = Buffer.from(b64, 'base64')
    const tmpPath = path.join('/tmp', `wa-session-restore-${Date.now()}.tar.gz`)
    fs.writeFileSync(tmpPath, buf)

    // Ensure session directory exists
    fs.mkdirSync(sessionDir, { recursive: true })

    // Extract over existing directory
    execSync(`tar xzf "${tmpPath}" -C "${sessionDir}"`, {
      stdio: 'pipe',
      timeout: 10000,
    })

    fs.unlinkSync(tmpPath)

    console.log(`[RedisSession] ✅ Restored ${(buf.length / 1024).toFixed(1)}KB session from Redis`)
    return true
  } catch (err: any) {
    console.error('[RedisSession] Failed to restore:', err.message)
    return false
  }
}

/**
 * Delete session from Redis.
 */
export async function deleteSessionFromRedis(): Promise<void> {
  try {
    const redis = getRedis()
    await redis.del(REDIS_KEY)
    console.log('[RedisSession] Session deleted from Redis')
  } catch (err: any) {
    console.error('[RedisSession] Failed to delete:', err.message)
  }
}
