/**
 * Persistent WhatsApp Client Service
 *
 * Keeps a WhatsApp client alive in memory, drains a file-based queue, and
 * persists rate-limit state + session to Redis so restarts don't cause bursts
 * or require QR re-scanning.
 *
 * Usage:
 *   npx tsx src/outreach/whatsapp/client-service.ts
 */

import { createRequire } from 'module'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { saveSessionToRedis, loadSessionFromRedis } from './redis-session'
import { logOutreachMessage } from './log-message'
import { getUnifiedRedis } from '../redis-client'

config({ path: path.resolve(process.cwd(), '.env') })

const require2 = createRequire(import.meta.url)
const { Client, LocalAuth } = require2('whatsapp-web.js')
const qrcode = require2('qrcode-terminal')

const SESSION_DIR = '/tmp/whatsapp-session'
const QUEUE_DIR = path.join(process.cwd(), '.whatsapp-queue')

// Redis keys
const REDIS_KEY_STATE = 'whatsapp:client:state'
const REDIS_KEY_QR = 'whatsapp:client:qr'
const REDIS_KEY_LAST_ACTIVE = 'whatsapp:client:last_active'
const REDIS_KEY_NEXT_SEND = 'whatsapp:rate:next_send_at'     // epoch ms
const REDIS_KEY_SENT_COUNT = 'whatsapp:rate:sent_count'      // total sent today
const REDIS_KEY_SENT_DATE = 'whatsapp:rate:sent_date'        // YYYY-MM-DD

// Rate-limit config
const RATE_LIMIT_MIN_MS = 35_000   // minimum gap between messages
const RATE_LIMIT_MAX_MS = 75_000   // maximum gap between messages
const BATCH_SIZE = 15              // pause after this many messages
const BATCH_PAUSE_MIN_MS = 5 * 60_000
const BATCH_PAUSE_MAX_MS = 10 * 60_000
const DAILY_CAP = 50               // hard daily limit to avoid bans
const MAX_RETRIES = 3              // per-message retry limit

function getRedis() {
  return getUnifiedRedis()
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function getNextSendAllowedAt(): Promise<number> {
  try {
    const val = await getRedis().get<string>(REDIS_KEY_NEXT_SEND)
    return val ? parseInt(val) : 0
  } catch {
    return 0
  }
}

async function setNextSendAllowedAt(ms: number): Promise<void> {
  try {
    await getRedis().set(REDIS_KEY_NEXT_SEND, ms.toString(), { ex: 86400 })
  } catch {}
}

async function getDailySentCount(): Promise<number> {
  try {
    const redis = getRedis()
    const date = await redis.get<string>(REDIS_KEY_SENT_DATE)
    const today = new Date().toISOString().split('T')[0]
    if (date !== today) return 0
    const count = await redis.get<string>(REDIS_KEY_SENT_COUNT)
    return count ? parseInt(count) : 0
  } catch {
    return 0
  }
}

async function incrementDailySentCount(): Promise<number> {
  try {
    const redis = getRedis()
    const today = new Date().toISOString().split('T')[0]
    await redis.set(REDIS_KEY_SENT_DATE, today, { ex: 172800 })
    const newCount = await redis.incr(REDIS_KEY_SENT_COUNT)
    await redis.expire(REDIS_KEY_SENT_COUNT, 172800)
    return newCount
  } catch {
    return 0
  }
}

async function updateState(state: string) {
  try {
    const redis = getRedis()
    await redis.set(REDIS_KEY_STATE, state)
    if (state === 'connected') {
      await redis.set(REDIS_KEY_LAST_ACTIVE, Date.now().toString())
    }
  } catch {}
}

async function main() {
  console.log('[WhatsApp Service] Starting...')
  fs.mkdirSync(QUEUE_DIR, { recursive: true })

  // Restore session from Redis before creating client
  const lockDir = path.join(SESSION_DIR, 'session')
  fs.mkdirSync(lockDir, { recursive: true })
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.unlinkSync(path.join(lockDir, f)) } catch {}
  }

  console.log('[WhatsApp Service] Restoring session from Redis...')
  const restored = await loadSessionFromRedis(lockDir)
  if (restored) {
    console.log('[WhatsApp Service] Session restored from Redis')
  } else {
    console.log('[WhatsApp Service] No saved session — QR scan required')
  }

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: SESSION_DIR }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-zygote',
      ],
    },
  })

  client.on('qr', async (qr: string) => {
    console.log('\n[WhatsApp Service] Scan this QR code:\n')
    qrcode.generate(qr, { small: true })
    console.log('\n[WhatsApp Service] Waiting for scan...\n')
    await updateState('qr_pending')
    try {
      await getRedis().set(REDIS_KEY_QR, qr)
    } catch {}
  })

  client.on('authenticated', async () => {
    console.log('[WhatsApp Service] Authenticated')
    await updateState('authenticated')
  })

  client.on('auth_failure', async (msg: string) => {
    console.error('[WhatsApp Service] Auth failure:', msg)
    await updateState('auth_failure')
  })

  client.on('ready', async () => {
    console.log('[WhatsApp Service] Connected and ready')
    await updateState('connected')
    try { await getRedis().del(REDIS_KEY_QR) } catch {}
    // Persist session immediately on connect
    await saveSessionToRedis(lockDir).catch(() => {})
  })

  client.on('disconnected', async (reason: string) => {
    console.log('[WhatsApp Service] Disconnected:', reason)
    await updateState('disconnected')
    console.log('[WhatsApp Service] Reconnecting in 10s...')
    setTimeout(() => {
      client.initialize().catch((err: Error) => {
        console.error('[WhatsApp Service] Reconnect failed:', err.message)
      })
    }, 10_000)
  })

  // ── Queue processor ──

  const processing = new Set<string>()
  let consecutiveEmptyPolls = 0

  async function processQueue() {
    if (client.info === undefined) return // not connected

    const now = Date.now()
    const nextSendAt = await getNextSendAllowedAt()
    if (now < nextSendAt) return // still in rate-limit window

    const dailySent = await getDailySentCount()
    if (dailySent >= DAILY_CAP) {
      const resetIn = Math.ceil((new Date().setHours(24, 0, 0, 0) - now) / 60000)
      console.log(`[WhatsApp Service] Daily cap reached (${DAILY_CAP}). Resets in ${resetIn}min`)
      return
    }

    let files: string[]
    try {
      files = fs.readdirSync(QUEUE_DIR)
        .filter(f => f.endsWith('.json') && !f.endsWith('.sending'))
        .sort()
    } catch {
      return
    }

    if (files.length === 0) {
      consecutiveEmptyPolls++
      return
    }

    consecutiveEmptyPolls = 0

    // Process one message per poll tick to keep control over timing
    const file = files.find(f => !processing.has(f))
    if (!file) return

    const filePath = path.join(QUEUE_DIR, file)
    const sendingPath = filePath + '.sending'

    processing.add(file)
    try {
      fs.renameSync(filePath, sendingPath)

      const data = JSON.parse(fs.readFileSync(sendingPath, 'utf-8'))
      const attempts = (data.attempts || 0) + 1

      let phone = data.phone.replace(/[^\d]/g, '')
      if (phone.startsWith('0')) phone = `91${phone.slice(1)}`
      else if (phone.length === 10) phone = `91${phone}`
      const chatId = `${phone}@c.us`

      const sendRes = await client.sendMessage(chatId, data.message)
      const messageSid = sendRes?.id?.id || undefined

      // Log to Payload CMS
      await logOutreachMessage(phone, data.message, {
        channel: 'whatsapp',
        status: 'sent',
        campaignName: data.campaign || 'campaign_queue',
        templateUsed: data.template || 'custom',
        messageSid,
      }).catch((e) => console.error('[WhatsApp Service] Payload log error:', e.message))

      const totalSent = await incrementDailySentCount()
      const delay = totalSent % BATCH_SIZE === 0
        ? randomBetween(BATCH_PAUSE_MIN_MS, BATCH_PAUSE_MAX_MS)
        : randomBetween(RATE_LIMIT_MIN_MS, RATE_LIMIT_MAX_MS)

      await setNextSendAllowedAt(Date.now() + delay)

      if (totalSent % BATCH_SIZE === 0) {
        console.log(`[WhatsApp Service] Batch pause: ${Math.round(delay / 1000)}s after ${totalSent} sent today`)
      } else {
        console.log(`[WhatsApp Service] Sent to ${phone} (${totalSent}/${DAILY_CAP} today, next in ${Math.round(delay / 1000)}s)`)
      }

      await updateState('connected')

      // Save session to Redis every 10 messages to survive restarts mid-campaign
      if (totalSent % 10 === 0) {
        await saveSessionToRedis(lockDir).catch(() => {})
      }

      fs.unlinkSync(sendingPath)
    } catch (err: any) {
      console.error(`[WhatsApp Service] Send failed: ${file} — ${err.message}`)

      // Retry logic: re-queue with incremented attempt counter, or move to .error
      try {
        const data = JSON.parse(fs.readFileSync(sendingPath, 'utf-8'))
        const attempts = (data.attempts || 0) + 1

        if (attempts < MAX_RETRIES) {
          // Exponential backoff: 2min, 8min, 24min
          const retryDelay = Math.pow(2, attempts) * 2 * 60_000
          const retryAt = new Date(Date.now() + retryDelay).toISOString()
          const retryFile = filePath.replace(/\.json$/, `.retry${attempts}.json`)
          fs.writeFileSync(retryFile, JSON.stringify({ ...data, attempts, retryAt }))
          console.log(`[WhatsApp Service] Will retry (attempt ${attempts}/${MAX_RETRIES - 1}) at ${retryAt}`)
        } else {
          fs.renameSync(sendingPath, filePath + '.error')
          console.error(`[WhatsApp Service] Giving up after ${MAX_RETRIES} attempts: ${file}`)
        }

        if (fs.existsSync(sendingPath)) fs.unlinkSync(sendingPath)
      } catch {
        try { fs.renameSync(sendingPath, filePath + '.error') } catch {}
      }
    } finally {
      processing.delete(file)
    }
  }

  // Handle retry files that are due — rename them back to .json so they get picked up
  async function processRetries() {
    let files: string[]
    try {
      files = fs.readdirSync(QUEUE_DIR).filter(f => /\.retry\d+\.json$/.test(f))
    } catch {
      return
    }

    for (const file of files) {
      try {
        const filePath = path.join(QUEUE_DIR, file)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        if (data.retryAt && new Date(data.retryAt) <= new Date()) {
          const base = file.replace(/\.retry\d+\.json$/, `_retry_${Date.now()}.json`)
          fs.renameSync(filePath, path.join(QUEUE_DIR, base))
        }
      } catch {}
    }
  }

  // Fast poll (5s) when queue has items, slow poll (30s) when idle
  let pollInterval = 5_000
  setInterval(async () => {
    await processRetries()
    await processQueue()

    const newInterval = consecutiveEmptyPolls > 3 ? 30_000 : 5_000
    if (newInterval !== pollInterval) {
      pollInterval = newInterval
      console.log(`[WhatsApp Service] Queue empty, polling every ${pollInterval / 1000}s`)
    }
  }, 5_000)

  await updateState('initializing')
  client.initialize().catch((err: Error) => {
    console.error('[WhatsApp Service] Init failed:', err.message)
    process.exit(1)
  })

  async function shutdown() {
    console.log('\n[WhatsApp Service] Shutting down...')
    await updateState('shutdown')
    // Save session before exit
    await saveSessionToRedis(lockDir).catch(() => {})
    await client.destroy()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main()
