/**
 * Persistent WhatsApp Client Service
 *
 * Keeps a WhatsApp client alive in memory. The API endpoint sends messages
 * through this running client. If the client dies, it auto-reconnects.
 *
 * Usage:
 *   npx tsx src/outreach/whatsapp/client-service.ts
 *
 * This process should stay running. Other scripts/API send messages via:
 *   POST /api/outreach/whatsapp/send { phone, message }
 *
 * Session state is tracked in Redis so the API knows if WhatsApp is connected.
 */

import { createRequire } from 'module'
import { config } from 'dotenv'
import { Redis } from '@upstash/redis'
import * as fs from 'fs'
import * as path from 'path'

config({ path: path.resolve(process.cwd(), '.env') })

const require2 = createRequire(import.meta.url)
const { Client, LocalAuth } = require2('whatsapp-web.js')
const qrcode = require2('qrcode-terminal')

const SESSION_DIR = '/tmp/whatsapp-session'
const REDIS_KEY_STATE = 'whatsapp:client:state'
const REDIS_KEY_QR = 'whatsapp:client:qr'
const REDIS_KEY_LAST_ACTIVE = 'whatsapp:client:last_active'

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!
  return new Redis({ url, token })
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
  console.log('[WhatsApp Service] Starting persistent WhatsApp client...')

  // Clean stale lock files from previous force-kills
  const lockDir = path.join(SESSION_DIR, 'session')
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.unlinkSync(path.join(lockDir, f)) } catch {}
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
    console.log('\n[WhatsApp Service] QR code received — scan with WhatsApp:\n')
    qrcode.generate(qr, { small: true })
    console.log('\n[WhatsApp Service] Waiting for scan...\n')
    await updateState('qr_pending')
    // Store QR in Redis so API can show it
    try {
      const redis = getRedis()
      await redis.set(REDIS_KEY_QR, qr)
    } catch {}
  })

  client.on('authenticated', async () => {
    console.log('[WhatsApp Service] ✅ Authenticated!')
    await updateState('authenticated')
  })

  client.on('auth_failure', async (msg: string) => {
    console.error('[WhatsApp Service] ❌ Auth failure:', msg)
    await updateState('auth_failure')
  })

  client.on('ready', async () => {
    console.log('[WhatsApp Service] ✅ Connected and ready!')
    console.log('[WhatsApp Service] Listening for messages to send...\n')
    await updateState('connected')
    // Clear QR
    try {
      const redis = getRedis()
      await redis.del(REDIS_KEY_QR)
    } catch {}
  })

  client.on('disconnected', async (reason: string) => {
    console.log('[WhatsApp Service] Disconnected:', reason)
    await updateState('disconnected')
    // Auto-reconnect after 5 seconds
    console.log('[WhatsApp Service] Reconnecting in 5 seconds...')
    setTimeout(() => {
      client.initialize().catch((err: Error) => {
        console.error('[WhatsApp Service] Reconnect failed:', err.message)
      })
    }, 5000)
  })

  // Listen for messages from other processes via a simple file-based queue
  const queueDir = path.join(process.cwd(), '.whatsapp-queue')
  fs.mkdirSync(queueDir, { recursive: true })

  console.log('[WhatsApp Service] Queue directory:', queueDir)
  console.log('[WhatsApp Service] To send a message, create a file in the queue directory.')
  console.log('[WhatsApp Service] Format: {phone}_{timestamp}.json with {phone, message}\n')

  // Track files currently being processed to avoid duplicates
  const processing = new Set<string>()
  let lastSentAt = 0
  let sentCount = 0
  const RATE_LIMIT_MIN_MS = 30_000  // 30 seconds minimum between messages
  const RATE_LIMIT_MAX_MS = 60_000  // 60 seconds maximum between messages
  const BATCH_SIZE = 15             // Send 15 messages then pause
  const BATCH_PAUSE_MIN_MS = 5 * 60_000   // 5 minutes pause between batches
  const BATCH_PAUSE_MAX_MS = 10 * 60_000  // 10 minutes pause between batches

  function getRandomDelay(): number {
    return Math.floor(Math.random() * (RATE_LIMIT_MAX_MS - RATE_LIMIT_MIN_MS + 1)) + RATE_LIMIT_MIN_MS
  }

  function getBatchPause(): number {
    return Math.floor(Math.random() * (BATCH_PAUSE_MAX_MS - BATCH_PAUSE_MIN_MS + 1)) + BATCH_PAUSE_MIN_MS
  }

  // Poll queue every 5 seconds
  let nextSendAllowedAt = 0

  setInterval(async () => {
    if (client.info === undefined) return // not connected

    // Rate limit: respect minimum delay between messages
    if (Date.now() < nextSendAllowedAt) return

    try {
      const files = fs.readdirSync(queueDir).filter(f => f.endsWith('.json')).sort()
      for (const file of files) {
        if (processing.has(file)) continue // already being processed
        if (Date.now() < nextSendAllowedAt) break // rate limit hit

        const filePath = path.join(queueDir, file)
        const processingPath = filePath + '.sending'

        try {
          processing.add(file)
          // Move to .sending to prevent double-processing
          fs.renameSync(filePath, processingPath)

          const data = JSON.parse(fs.readFileSync(processingPath, 'utf-8'))
          // Normalize phone: strip leading 0, ensure 91 prefix
          let phone = data.phone.replace(/[^\d]/g, '')
          if (phone.startsWith('0')) phone = `91${phone.slice(1)}`
          else if (phone.length === 10) phone = `91${phone}`
          const chatId = `${phone}@c.us`

          await client.sendMessage(chatId, data.message)
          sentCount++
          const delay = getRandomDelay()
          nextSendAllowedAt = Date.now() + delay
          console.log(`[WhatsApp Service] ✅ Sent to ${phone} (${sentCount} sent, next in ${Math.round(delay/1000)}s)`)

          // Batch pause every 15 messages
          if (sentCount % BATCH_SIZE === 0) {
            const pause = getBatchPause()
            nextSendAllowedAt = Date.now() + pause
            console.log(`[WhatsApp Service] ⏸️  Batch pause: ${Math.round(pause/1000)}s (${sentCount} sent so far)`)
          }

          await updateState('connected')

          // Remove processed file
          fs.unlinkSync(processingPath)
        } catch (err: any) {
          console.error(`[WhatsApp Service] ❌ Failed: ${file} — ${err.message}`)
          // Move back from .sending so it can be retried
          try {
            if (fs.existsSync(processingPath)) fs.renameSync(processingPath, filePath + '.error')
          } catch {}
        } finally {
          processing.delete(file)
        }
      }
    } catch {}
  }, 5000)

  // Initialize
  await updateState('initializing')
  client.initialize().catch((err: Error) => {
    console.error('[WhatsApp Service] Init failed:', err.message)
    process.exit(1)
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[WhatsApp Service] Shutting down...')
    await updateState('shutdown')
    await client.destroy()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await updateState('shutdown')
    await client.destroy()
    process.exit(0)
  })
}

main()
