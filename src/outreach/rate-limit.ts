/**
 * Rate limiter for outreach messaging using Unified Redis (Local Redis / Upstash).
 * Falls back to in-memory rate limiting if Redis is not configured.
 *
 * This prevents WhatsApp/Instagram from banning the account
 * due to excessive message sending.
 */

import { getUnifiedRedis, UnifiedRedis } from './redis-client'

function getRedis(): UnifiedRedis | null {
  try {
    return getUnifiedRedis()
  } catch {
    return null
  }
}

// Channel-specific rate limits
const RATE_LIMITS = {
  whatsapp: {
    // WhatsApp: max ~50 messages per hour, ~200 per day (safe limits)
    messagesPerHour: 30,
    messagesPerDay: 150,
  },
  instagram_dm: {
    // Instagram: stricter — max ~20 DMs per hour, ~100 per day
    messagesPerHour: 15,
    messagesPerDay: 80,
  },
  email: {
    // Email via Resend free tier: 100/day, 3000/month
    messagesPerHour: 50,
    messagesPerDay: 100,
  },
  sms: {
    messagesPerHour: 20,
    messagesPerDay: 100,
  },
} as const

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function getMemoryCount(key: string, windowMs: number): number {
  const now = Date.now()
  const entry = memoryStore.get(key)
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return 1
  }
  entry.count++
  return entry.count
}

// Check if a message can be sent
export async function canSend(
  channel: keyof typeof RATE_LIMITS,
  campaignId?: string
): Promise<{ allowed: boolean; reason?: string; retryAfterMs?: number }> {
  const limits = RATE_LIMITS[channel]
  if (!limits) return { allowed: false, reason: `Unknown channel: ${channel}` }

  const campaignSuffix = campaignId ? `:${campaignId}` : ''
  const redis = getRedis()

  // Check hourly limit
  const hourlyKey = `outreach:rate:${channel}${campaignSuffix}:hour:${Math.floor(Date.now() / 3600000)}`
  // Check daily limit
  const dailyKey = `outreach:rate:${channel}${campaignSuffix}:day:${new Date().toISOString().split('T')[0]}`

  if (redis) {
    const rawHourly = await redis.get<number | string>(hourlyKey)
    const rawDaily = await redis.get<number | string>(dailyKey)
    const hourlyCount = rawHourly ? Number(rawHourly) : 0
    const dailyCount = rawDaily ? Number(rawDaily) : 0

    if (hourlyCount >= limits.messagesPerHour) {
      const hourResetMs = Math.ceil(Date.now() / 3600000) * 3600000 - Date.now()
      return { allowed: false, reason: 'Hourly limit reached', retryAfterMs: hourResetMs }
    }
    if (dailyCount >= limits.messagesPerDay) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return { allowed: false, reason: 'Daily limit reached', retryAfterMs: tomorrow.getTime() - Date.now() }
    }
  } else {
    // Fallback to in-memory
    const hourlyCount = getMemoryCount(hourlyKey, 3600000)
    const dailyCount = getMemoryCount(dailyKey, 86400000)

    if (hourlyCount > limits.messagesPerHour) {
      return { allowed: false, reason: 'Hourly limit reached (in-memory)' }
    }
    if (dailyCount > limits.messagesPerDay) {
      return { allowed: false, reason: 'Daily limit reached (in-memory)' }
    }
  }

  return { allowed: true }
}

// Record that a message was sent
export async function recordSent(
  channel: keyof typeof RATE_LIMITS,
  campaignId?: string
): Promise<void> {
  const campaignSuffix = campaignId ? `:${campaignId}` : ''
  const redis = getRedis()

  if (redis) {
    const hourlyKey = `outreach:rate:${channel}${campaignSuffix}:hour:${Math.floor(Date.now() / 3600000)}`
    const dailyKey = `outreach:rate:${channel}${campaignSuffix}:day:${new Date().toISOString().split('T')[0]}`

    try {
      await redis.incr(hourlyKey)
      await redis.expire(hourlyKey, 3600)
      await redis.incr(dailyKey)
      await redis.expire(dailyKey, 86400)
    } catch {}
  }
}

// Get current usage stats for a channel
export async function getUsageStats(
  channel: keyof typeof RATE_LIMITS
): Promise<{ hourlyUsed: number; hourlyLimit: number; dailyUsed: number; dailyLimit: number }> {
  const limits = RATE_LIMITS[channel]
  const hourlyKey = `outreach:rate:${channel}:hour:${Math.floor(Date.now() / 3600000)}`
  const dailyKey = `outreach:rate:${channel}:day:${new Date().toISOString().split('T')[0]}`
  const redis = getRedis()

  let hourlyUsed = 0
  let dailyUsed = 0

  if (redis) {
    const rawHourly = await redis.get<number | string>(hourlyKey)
    const rawDaily = await redis.get<number | string>(dailyKey)
    hourlyUsed = rawHourly ? Number(rawHourly) : 0
    dailyUsed = rawDaily ? Number(rawDaily) : 0
  } else {
    const hourlyEntry = memoryStore.get(hourlyKey)
    const dailyEntry = memoryStore.get(dailyKey)
    hourlyUsed = hourlyEntry && Date.now() <= hourlyEntry.resetAt ? hourlyEntry.count - 1 : 0
    dailyUsed = dailyEntry && Date.now() <= dailyEntry.resetAt ? dailyEntry.count - 1 : 0
  }

  return {
    hourlyUsed,
    hourlyLimit: limits.messagesPerHour,
    dailyUsed,
    dailyLimit: limits.messagesPerDay,
  }
}
