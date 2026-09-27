/**
 * WhatsApp Session Persistence via Unified Redis (Local Redis / Upstash)
 *
 * Saves critical Chromium profile files (Cookies, Local Storage, Session Storage, IndexedDB)
 * to Redis (Local Redis or Upstash chunked) so that WhatsApp authentication survives
 * process restarts without requiring QR code re-scanning.
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { getUnifiedRedis } from '../redis-client'

config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

const REDIS_KEY_COUNT = 'whatsapp:session:chunk_count'
const REDIS_KEY_PREFIX = 'whatsapp:session:chunk:'
const REDIS_KEY_TARBALL = 'whatsapp:session:tarball'
const CHUNK_SIZE = 1024 * 1024 // 1MB per chunk for Upstash

const CRITICAL_PATHS = [
  'Default/Cookies',
  'Default/Cookies-journal',
  'Default/Local Storage',
  'Default/Session Storage',
  'Default/IndexedDB',
]

/**
 * Save the WhatsApp session files to Redis.
 * - Local Redis (ioredis): Direct high-speed buffer/base64 upload without size limits.
 * - Upstash Redis: 1MB chunked upload to safely stay under Upstash 10MB limits.
 */
export async function saveSessionToRedis(sessionDir: string): Promise<boolean> {
  try {
    const redis = getUnifiedRedis()
    const tmpPath = path.join('/tmp', `wa-session-${Date.now()}.tar.gz`)

    const existingPaths = CRITICAL_PATHS.filter((p) =>
      fs.existsSync(path.join(sessionDir, p))
    )

    if (existingPaths.length === 0) {
      console.error('[RedisSession] No critical session files found to save')
      return false
    }

    const tarArgs = existingPaths.map((p) => `"${p}"`).join(' ')
    // Exclude heavy blob media caches and logs to optimize size and speed
    execSync(
      `GZIP=-9 tar --exclude='*.blob' --exclude='*.log' --exclude='*.tmp' -czf "${tmpPath}" -C "${sessionDir}" ${tarArgs}`,
      { stdio: 'pipe', timeout: 15000 }
    )

    const buf = fs.readFileSync(tmpPath)
    fs.unlinkSync(tmpPath)

    const sizeMb = (buf.length / (1024 * 1024)).toFixed(2)
    const isLocal = redis.clientType === 'ioredis'

    console.log(
      `[RedisSession] Saving ${sizeMb}MB compressed session to ${isLocal ? 'Local Redis (TCP)' : 'Upstash Redis'}...`
    )

    if (isLocal) {
      // Local Redis: Save directly to key without chunking limits
      const b64 = buf.toString('base64')
      await redis.set(REDIS_KEY_TARBALL, b64)

      // Clean legacy chunk keys if any
      const chunkCount = await redis.get<number>(REDIS_KEY_COUNT)
      if (chunkCount && typeof chunkCount === 'number') {
        const keysToDelete: string[] = [REDIS_KEY_COUNT]
        for (let i = 0; i < chunkCount; i++) {
          keysToDelete.push(`${REDIS_KEY_PREFIX}${i}`)
        }
        await redis.del(...keysToDelete).catch(() => {})
      }
      console.log(`[RedisSession] ✅ Saved session to Local Redis successfully (${sizeMb}MB)`)
      return true
    }

    // Upstash Redis: Chunked upload (1MB chunks)
    const b64 = buf.toString('base64')
    const totalChunks = Math.ceil(b64.length / CHUNK_SIZE)

    console.log(`[RedisSession] Uploading in ${totalChunks} chunk(s) to Upstash...`)
    await redis.del(REDIS_KEY_TARBALL).catch(() => {})

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = b64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      await redis.set(`${REDIS_KEY_PREFIX}${i}`, chunkData)
    }
    await redis.set(REDIS_KEY_COUNT, totalChunks)

    console.log(`[RedisSession] ✅ Saved session to Upstash successfully (${totalChunks} chunks)`)
    return true
  } catch (err: any) {
    console.error('[RedisSession] Failed to save session:', err.message)
    return false
  }
}

/**
 * Restore WhatsApp session files from Redis.
 */
export async function loadSessionFromRedis(sessionDir: string): Promise<boolean> {
  try {
    const redis = getUnifiedRedis()
    let b64: string | null = null

    // Check direct tarball key first (Local Redis / fast path)
    const directTarball = await redis.get<string>(REDIS_KEY_TARBALL)
    if (directTarball && typeof directTarball === 'string' && directTarball.length > 0) {
      b64 = directTarball
      console.log(`[RedisSession] Found session in direct tarball key`)
    } else {
      // Check chunked keys (Upstash format)
      const chunkCount = await redis.get<number>(REDIS_KEY_COUNT)
      if (chunkCount && typeof chunkCount === 'number' && chunkCount > 0) {
        console.log(`[RedisSession] Fetching session from ${chunkCount} chunk(s)...`)
        const chunks: string[] = []
        for (let i = 0; i < chunkCount; i++) {
          const chunk = await redis.get<string>(`${REDIS_KEY_PREFIX}${i}`)
          if (!chunk) {
            console.error(`[RedisSession] Missing chunk #${i}`)
            return false
          }
          chunks.push(chunk)
        }
        b64 = chunks.join('')
      }
    }

    if (!b64) {
      console.log('[RedisSession] No session found in Redis')
      return false
    }

    const buf = Buffer.from(b64, 'base64')
    const tmpPath = path.join('/tmp', `wa-session-restore-${Date.now()}.tar.gz`)
    fs.writeFileSync(tmpPath, buf)

    fs.mkdirSync(sessionDir, { recursive: true })

    execSync(`tar xzf "${tmpPath}" -C "${sessionDir}"`, {
      stdio: 'pipe',
      timeout: 15000,
    })

    fs.unlinkSync(tmpPath)

    console.log(`[RedisSession] ✅ Restored ${(buf.length / (1024 * 1024)).toFixed(2)}MB session from Redis`)
    return true
  } catch (err: any) {
    console.error('[RedisSession] Failed to restore session:', err.message)
    return false
  }
}

/**
 * Delete session from Redis.
 */
export async function deleteSessionFromRedis(): Promise<void> {
  try {
    const redis = getUnifiedRedis()
    const chunkCount = await redis.get<number>(REDIS_KEY_COUNT)
    if (chunkCount && typeof chunkCount === 'number') {
      const keys: string[] = [REDIS_KEY_COUNT]
      for (let i = 0; i < chunkCount; i++) {
        keys.push(`${REDIS_KEY_PREFIX}${i}`)
      }
      await redis.del(...keys)
    }
    await redis.del(REDIS_KEY_TARBALL)
    console.log('[RedisSession] Session deleted from Redis')
  } catch (err: any) {
    console.error('[RedisSession] Failed to delete session:', err.message)
  }
}
