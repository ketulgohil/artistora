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
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const path = require('path') as typeof import('path')
const fs = require('fs') as typeof import('fs')

const SESSION_DIR = './whatsapp-session'
const SESSION_DIR_SESSION = path.join(SESSION_DIR, 'session')

async function main() {
  const phone = process.argv[2]
  const message = process.argv[3]

  if (!phone || !message) {
    console.error('Usage: npx tsx src/outreach/whatsapp/send-with-redis.ts <phone> <message>')
    process.exit(1)
  }

  // Normalize phone
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const chatId = `${cleanPhone}@c.us`

  console.log(`[WhatsApp] Target: ${cleanPhone}`)

  // Step 1: Restore session from Redis BEFORE creating client
  console.log('[WhatsApp] Restoring session from Redis...')
  fs.mkdirSync(SESSION_DIR_SESSION, { recursive: true })
  const restored = await loadSessionFromRedis(SESSION_DIR_SESSION)
  if (restored) {
    console.log('[WhatsApp] ✅ Session restored from Redis')
  } else {
    console.log('[WhatsApp] ⚠️ No session in Redis — will need QR scan')
  }

  // Step 2: Create client (LocalAuth will use the restored session files)
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

    try {
      await client.sendMessage(chatId, message)
      console.log(`[WhatsApp] ✅ Message sent to ${cleanPhone}`)
    } catch (err: any) {
      console.error(`[WhatsApp] ❌ Send failed: ${err.message}`)
    }

    // Save session back to Redis
    try {
      await saveSessionToRedis(SESSION_DIR_SESSION)
      console.log('[WhatsApp] ✅ Session saved to Redis for next time')
    } catch (err: any) {
      console.error('[WhatsApp] Session save warning:', err.message)
    }

    await client.destroy()
    process.exit(0)
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
