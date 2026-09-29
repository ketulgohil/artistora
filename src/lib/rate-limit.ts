/**
 * Production-safe rate limiter supporting:
 * 1. Local / TCP Redis via IORedis (when REDIS_URL is configured)
 * 2. Cloud Redis via Upstash REST (when UPSTASH_REDIS_REST_URL is configured)
 * 3. In-memory sliding window fallback (when Redis is unavailable or times out)
 */

import IORedis from 'ioredis'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// ── In-memory store (active when Redis is unavailable or during local dev) ──
const memoryStores = new Map<string, Map<string, RateLimitEntry>>()

setInterval(() => {
  const now = Date.now()
  for (const [, store] of memoryStores) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }
}, 60_000)

let ioRedisClient: IORedis | null = null
let upstashClient: any = null
let redisChecked = false

async function getRedisClient(): Promise<{ type: 'ioredis' | 'upstash'; client: any } | null> {
  if (ioRedisClient) return { type: 'ioredis', client: ioRedisClient }
  if (upstashClient) return { type: 'upstash', client: upstashClient }
  if (redisChecked) return null

  // 1. Check local / standard TCP Redis
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    try {
      const io = new IORedis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
        lazyConnect: true,
      })
      await io.connect()
      ioRedisClient = io
      return { type: 'ioredis', client: io }
    } catch {
      // Local redis not reachable
    }
  }

  // 2. Check Upstash Redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token && !url.includes('summary-bird-136146')) {
    try {
      const { Redis } = await import('@upstash/redis')
      upstashClient = new Redis({ url, token })
      return { type: 'upstash', client: upstashClient }
    } catch {
      // Upstash unavailable
    }
  }

  redisChecked = true
  return null
}

export interface RateLimitConfig {
  windowMs: number
  max: number
  keyPrefix?: string
}

/**
 * Rate-limit by composite key (e.g. "ip:userId" or just "ip").
 * Uses Redis when configured and reachable with 400ms timeout, falls back to in-memory store.
 */
export async function rateLimitAsync(
  key: string,
  config: RateLimitConfig,
  routeName: string = 'default',
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Relax rate limits in development for localhost
  if (process.env.NODE_ENV === 'development' && (key === 'unknown' || key === 'localhost' || key === '127.0.0.1')) {
    return { allowed: true, remaining: 999, resetAt: Date.now() + config.windowMs }
  }

  const now = Date.now()
  const resetAt = now + config.windowMs
  const storeKey = `${config.keyPrefix || routeName}:${key}`

  try {
    const redisPromise = (async () => {
      const redis = await getRedisClient()
      if (!redis) return null

      if (redis.type === 'ioredis') {
        const result = await redis.client
          .multi()
          .incr(storeKey)
          .pexpire(storeKey, config.windowMs)
          .pttl(storeKey)
          .exec()

        if (result && result[0] && result[2]) {
          const count = Number(result[0][1]) || 1
          const ttl = Number(result[2][1]) || config.windowMs
          const actualReset = now + (ttl > 0 ? ttl : config.windowMs)
          return {
            allowed: count <= config.max,
            remaining: Math.max(0, config.max - count),
            resetAt: actualReset,
          }
        }
      } else if (redis.type === 'upstash') {
        const result = await redis.client
          .multi()
          .incr(storeKey)
          .pexpire(storeKey, config.windowMs)
          .pttl(storeKey)
          .exec()

        const count = Number(result[0]) || 1
        const ttl = Number(result[2]) || config.windowMs
        const actualReset = now + ttl
        return {
          allowed: count <= config.max,
          remaining: Math.max(0, config.max - count),
          resetAt: actualReset,
        }
      }
      return null
    })()

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 400))
    const result = await Promise.race([redisPromise, timeoutPromise])

    if (result) {
      return result
    }
  } catch (err) {
    // Fallback to in-memory on any Redis error
  }

  // In-memory fallback
  const storeKeyDev = config.keyPrefix || routeName
  if (!memoryStores.has(storeKeyDev)) memoryStores.set(storeKeyDev, new Map())
  const store = memoryStores.get(storeKeyDev)!
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

/**
 * Synchronous rate limiter — uses in-memory store.
 */
export function rateLimit(
  ip: string,
  config: RateLimitConfig,
  routeName: string = 'default',
): { allowed: boolean; remaining: number; resetAt: number } {
  if (process.env.NODE_ENV === 'development' && (ip === 'unknown' || ip === 'localhost' || ip === '127.0.0.1')) {
    return { allowed: true, remaining: 999, resetAt: Date.now() + config.windowMs }
  }

  const storeKey = config.keyPrefix || routeName
  if (!memoryStores.has(storeKey)) memoryStores.set(storeKey, new Map())
  const store = memoryStores.get(storeKey)!

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 10 },
  register: { windowMs: 60 * 60 * 1000, max: 5 },
  leadCreate: { windowMs: 60 * 60 * 1000, max: 10 },
  quoteCreate: { windowMs: 60 * 60 * 1000, max: 30 },
  quoteLookup: { windowMs: 15 * 60 * 1000, max: 30 },
  quoteAccept: { windowMs: 15 * 60 * 1000, max: 10 },
  bookingAction: { windowMs: 15 * 60 * 1000, max: 20 },
  upload: { windowMs: 60 * 60 * 1000, max: 50 },
  guestUpload: { windowMs: 60 * 60 * 1000, max: 10 },
  guestTokenValidate: { windowMs: 15 * 60 * 1000, max: 30 },
  forgotPassword: { windowMs: 15 * 60 * 1000, max: 10 },
  resetPassword: { windowMs: 15 * 60 * 1000, max: 10 },
} as const

/**
 * Extract client IP from the request.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}
