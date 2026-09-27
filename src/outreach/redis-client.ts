/**
 * Unified Redis Client for Outreach & WhatsApp Sessions
 *
 * Supports:
 * 1. Local / TCP Redis via `ioredis` (default for local dev when `REDIS_URL` is present)
 *    - Unconstrained payloads (up to 512MB)
 *    - Blazing fast sub-millisecond response
 * 2. Cloud Redis via `@upstash/redis` (fallback for serverless or when REDIS_URL not set)
 */

import { config } from 'dotenv'
import * as path from 'path'
import IORedis from 'ioredis'
import { Redis as UpstashRedis } from '@upstash/redis'

config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

export interface UnifiedRedis {
  clientType: 'ioredis' | 'upstash'
  get<T = string>(key: string): Promise<T | null>
  set(key: string, value: string | number | Buffer, options?: { ex?: number; px?: number }): Promise<any>
  del(...keys: string[]): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number | boolean>
  getBuffer(key: string): Promise<Buffer | null>
  setBuffer(key: string, buffer: Buffer, options?: { ex?: number }): Promise<void>
  isLocal(): boolean
  quit(): Promise<void>
}

let cachedClient: UnifiedRedis | null = null

export function getUnifiedRedis(): UnifiedRedis {
  if (cachedClient) return cachedClient

  const redisUrl = process.env.REDIS_URL
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl) {
    try {
      const io = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      })

      io.on('error', (err) => {
        console.error('[Redis] IORedis error:', err.message)
      })

      const client: UnifiedRedis = {
        clientType: 'ioredis',
        isLocal: () => redisUrl.includes('127.0.0.1') || redisUrl.includes('localhost'),
        async get<T = string>(key: string): Promise<T | null> {
          const val = await io.get(key)
          if (val === null) return null
          try {
            return JSON.parse(val) as T
          } catch {
            return val as unknown as T
          }
        },
        async set(key: string, value: string | number | Buffer, options?: { ex?: number; px?: number }): Promise<any> {
          const strVal = typeof value === 'object' && !Buffer.isBuffer(value) ? JSON.stringify(value) : value
          if (options?.ex) {
            return io.set(key, strVal as any, 'EX', options.ex)
          }
          if (options?.px) {
            return io.set(key, strVal as any, 'PX', options.px)
          }
          return io.set(key, strVal as any)
        },
        async del(...keys: string[]): Promise<number> {
          if (keys.length === 0) return 0
          return io.del(...keys)
        },
        async incr(key: string): Promise<number> {
          return io.incr(key)
        },
        async expire(key: string, seconds: number): Promise<number | boolean> {
          return io.expire(key, seconds)
        },
        async getBuffer(key: string): Promise<Buffer | null> {
          return io.getBuffer(key)
        },
        async setBuffer(key: string, buffer: Buffer, options?: { ex?: number }): Promise<void> {
          if (options?.ex) {
            await io.set(key, buffer, 'EX', options.ex)
          } else {
            await io.set(key, buffer)
          }
        },
        async quit(): Promise<void> {
          try {
            await io.quit()
          } catch {}
          cachedClient = null
        },
      }

      cachedClient = client
      return client
    } catch (err: any) {
      console.warn('[Redis] Failed to initialize ioredis, falling back to Upstash:', err.message)
    }
  }

  if (upstashUrl && upstashToken) {
    const upstash = new UpstashRedis({ url: upstashUrl, token: upstashToken })

    const client: UnifiedRedis = {
      clientType: 'upstash',
      isLocal: () => false,
      async get<T = string>(key: string): Promise<T | null> {
        return upstash.get<T>(key)
      },
      async set(key: string, value: string | number | Buffer, options?: { ex?: number; px?: number }): Promise<any> {
        if (Buffer.isBuffer(value)) {
          value = value.toString('base64')
        }
        return upstash.set(key, value, options as any)
      },
      async del(...keys: string[]): Promise<number> {
        if (keys.length === 0) return 0
        return upstash.del(...keys)
      },
      async incr(key: string): Promise<number> {
        return upstash.incr(key)
      },
      async expire(key: string, seconds: number): Promise<number | boolean> {
        return upstash.expire(key, seconds)
      },
      async getBuffer(key: string): Promise<Buffer | null> {
        const b64 = await upstash.get<string>(key)
        if (!b64) return null
        return Buffer.from(b64, 'base64')
      },
      async setBuffer(key: string, buffer: Buffer, options?: { ex?: number }): Promise<void> {
        await upstash.set(key, buffer.toString('base64'), options as any)
      },
      async quit(): Promise<void> {
        cachedClient = null
      },
    }

    cachedClient = client
    return client
  }

  throw new Error('No Redis configuration found. Set REDIS_URL or UPSTASH_REDIS_REST_URL in .env')
}
