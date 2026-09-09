/**
 * Production-safe rate limiter using Upstash Redis (when configured),
 * with in-memory fallback for local development only.
 *
 * Environment variables (for production):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// ── In-memory fallback (dev only) ──
const devStores = new Map<string, Map<string, RateLimitEntry>>()
const isDev = process.env.NODE_ENV !== 'production'

if (isDev) {
  setInterval(() => {
    const now = Date.now()
    for (const [, store] of devStores) {
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key)
      }
    }
  }, 60_000)
}

// ── Upstash Redis client (lazy-loaded) ──
let redisClient: any = null

async function getRedis() {
  if (redisClient !== null) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  try {
    const { Redis } = await import('@upstash/redis')
    redisClient = new Redis({ url, token })
    return redisClient
  } catch {
    return null
  }
}

export interface RateLimitConfig {
  windowMs: number
  max: number
  keyPrefix?: string
}

/**
 * Rate-limit by composite key (e.g. "ip:userId" or just "ip").
 * Falls back to in-memory when Redis is unavailable.
 */
export async function rateLimitAsync(
  key: string,
  config: RateLimitConfig,
  routeName: string = 'default',
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = await getRedis()
  const now = Date.now()
  const resetAt = now + config.windowMs
  const storeKey = `${config.keyPrefix || routeName}:${key}`

  if (redis) {
    try {
      const result = await redis
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
    } catch {
      // Redis failure — fail closed for protected endpoints.
      return { allowed: false, remaining: 0, resetAt }
    }
  }

  // In-memory fallback (dev only)
  if (!isDev) {
    // Never silently disable protection in production.
    return { allowed: false, remaining: 0, resetAt }
  }

  const storeKeyDev = config.keyPrefix || 'default'
  if (!devStores.has(storeKeyDev)) devStores.set(storeKeyDev, new Map())
  const store = devStores.get(storeKeyDev)!
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
 * Synchronous rate limiter — use only in non-async contexts.
 * Prefer rateLimitAsync for all API routes.
 */
export function rateLimit(
  ip: string,
  config: RateLimitConfig,
  routeName: string = 'default',
): { allowed: boolean; remaining: number; resetAt: number } {
  if (!isDev) {
    // Synchronous limiter must never be used in production.
    return { allowed: false, remaining: 0, resetAt: Date.now() + config.windowMs }
  }
  const storeKey = config.keyPrefix || routeName
  if (!devStores.has(storeKey)) devStores.set(storeKey, new Map())
  const store = devStores.get(storeKey)!

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
 * Uses the platform-provided forwarded header (trusted on Vercel/Cloudflare).
 * Do NOT trust arbitrary x-forwarded-for from unknown sources.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
