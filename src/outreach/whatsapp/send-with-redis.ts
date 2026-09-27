/**
 * Send WhatsApp message with Redis session persistence.
 *
 * Usage:
 *   npx tsx src/outreach/whatsapp/send-with-redis.ts <phone> <message>
 *
 * Restores session from Redis before starting. After sending, saves back to Redis.
 * Survives process restarts — no QR scan needed (until session expires).
 */

import { saveSessionToRedis, loadSessionFromRedis } from './redis-session'
import { validateAndNormalizePhone } from './queue-send'
import { logOutreachMessage } from './log-message'
import { createRequire } from 'module'
import * as path from 'path'
import * as fs from 'fs'

const require = createRequire(import.meta.url)
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const BASE_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/whatsapp-session'
const SESSION_DIR_SESSION = path.join(BASE_DIR, 'session')

async function main() {
  const phoneArg = process.argv[2]
  const message = process.argv[3]

  if (!phoneArg || !message) {
    console.error('Usage: npx tsx src/outreach/whatsapp/send-with-redis.ts <phone> <message>')
    process.exit(1)
  }

  const cleanPhone = validateAndNormalizePhone(phoneArg)
  if (!cleanPhone) {
    console.error(`[WhatsApp] ❌ Invalid phone number "${phoneArg}". Must be a valid 10-digit Indian mobile number.`)
    process.exit(1)
  }

  const chatId = `${cleanPhone}@c.us`
  console.log(`[WhatsApp] Target: ${cleanPhone}`)

  // Step 1: Restore session from Redis BEFORE creating client
  console.log('[WhatsApp] Restoring session from Redis...')
  fs.mkdirSync(SESSION_DIR_SESSION, { recursive: true })

  // Clean stale lock files
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.unlinkSync(path.join(SESSION_DIR_SESSION, f)) } catch {}
  }

  const restored = await loadSessionFromRedis(SESSION_DIR_SESSION)
  if (restored) {
    console.log('[WhatsApp] ✅ Session restored from Redis')
  } else {
    console.log('[WhatsApp] ⚠️ No session in Redis — will need QR scan')
  }

  // Step 2: Create client (LocalAuth will use the restored session files)
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: BASE_DIR }),
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

  client.on('qr', (qr: string) => {
    console.log('\n[WhatsApp] Scan this QR code:\n')
    qrcode.generate(qr, { small: true })
    console.log('\n[WhatsApp] Waiting for scan...')
  })

  client.on('authenticated', () => {
    console.log('[WhatsApp] ✅ Authenticated!')
  })

  client.on('auth_failure', (msg: string) => {
    console.error('[WhatsApp] ❌ Auth failure:', msg)
    process.exit(1)
  })

  client.on('ready', async () => {
    console.log('[WhatsApp] Connected! Sending message...')

    let sendSuccess = false
    let sendError: string | undefined
    let messageSid: string | undefined

    try {
      const response = await client.sendMessage(chatId, message)
      messageSid = response?.id?.id || undefined
      sendSuccess = true
      console.log(`[WhatsApp] ✅ Message sent to ${cleanPhone}`)
    } catch (err: any) {
      sendError = err.message
      console.error(`[WhatsApp] ❌ Send failed: ${err.message}`)
    }

    // Log to Payload CMS (outreach-messages & discovered-artists)
    try {
      await logOutreachMessage(cleanPhone, message, {
        channel: 'whatsapp',
        status: sendSuccess ? 'sent' : 'failed',
        campaignName: 'direct_send',
        templateUsed: 'custom',
        messageSid,
        error: sendError,
      })
    } catch (err: any) {
      console.error('[WhatsApp] Payload log warning:', err.message)
    }

    // Save session back to Redis
    try {
      await saveSessionToRedis(SESSION_DIR_SESSION)
      console.log('[WhatsApp] ✅ Session saved to Redis for next time')
    } catch (err: any) {
      console.error('[WhatsApp] Session save warning:', err.message)
    }

    await client.destroy()
    process.exit(sendSuccess ? 0 : 1)
  })

  client.on('disconnected', (reason: string) => {
    console.log('[WhatsApp] Disconnected:', reason)
    process.exit(1)
  })

  console.log('[WhatsApp] Initializing client...')
  client.initialize().catch((err: Error) => {
    console.error('[WhatsApp] Init failed:', err.message)
    process.exit(1)
  })

  // Timeout after 2 minutes
  setTimeout(() => {
    console.error('[WhatsApp] ❌ Timeout — no response in 2 minutes')
    client.destroy().catch(() => {})
    process.exit(1)
  }, 120_000)
}

main()
