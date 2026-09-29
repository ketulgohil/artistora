/**
 * Send WhatsApp message using Baileys with Redis session persistence.
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation" node --import tsx src/outreach/whatsapp/send-with-redis.ts <phone> "<message>"
 *
 * Restores Baileys session from Redis before starting. After sending, saves back to Redis.
 * Survives process restarts — no QR scan needed (until session expires).
 */

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'
import { loadBaileysAuthFromRedis, saveBaileysAuthToRedis } from './baileys-session'
import { validateAndNormalizePhone } from './queue-send'
import { logOutreachMessage } from './log-message'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const AUTH_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys-auth-session'

async function main() {
  const phoneArg = process.argv[2]
  const message = process.argv[3]

  if (!phoneArg || !message) {
    console.error(
      'Usage: node --import tsx src/outreach/whatsapp/send-with-redis.ts <phone> "<message>"',
    )
    process.exit(1)
  }

  const cleanPhone = validateAndNormalizePhone(phoneArg)
  if (!cleanPhone) {
    console.error(
      `[WhatsApp] ❌ Invalid phone number "${phoneArg}". Must be a valid 10-digit Indian mobile number.`,
    )
    process.exit(1)
  }

  const jid = `${cleanPhone}@s.whatsapp.net`
  console.log(`[WhatsApp] Target: ${cleanPhone} (${jid})`)

  // Step 1: Restore auth state from Redis
  console.log('[WhatsApp] Restoring Baileys session from Redis...')
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  const restored = await loadBaileysAuthFromRedis(AUTH_DIR)
  if (restored) {
    console.log('[WhatsApp] ✅ Session restored from Redis')
  } else {
    console.log('[WhatsApp] ⚠️ No session in Redis — QR scan may be required')
  }

  // Step 2: Initialize Baileys auth state & socket
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 30000,
  })

  sock.ev.on('creds.update', saveCreds)

  let sent = false
  let sendError: string | undefined
  let messageId: string | undefined

  const timeoutHandle = setTimeout(async () => {
    console.error('[WhatsApp] ❌ Timeout — no open connection within 60s')
    try {
      sock.end(undefined)
    } catch {}
    process.exit(1)
  }, 60_000)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n[WhatsApp] Scan this QR code to connect:\n')
      qrcode.generate(qr, { small: true })
      console.log('\n[WhatsApp] Waiting for QR scan...')
    }

    if (connection === 'open') {
      clearTimeout(timeoutHandle)
      console.log(`[WhatsApp] ✅ Connected as: ${sock.user?.id}`)
      console.log(`[WhatsApp] Sending message to ${cleanPhone}...`)

      try {
        const result = await sock.sendMessage(jid, { text: message })
        messageId = result?.key?.id || undefined
        sent = true
        console.log(`[WhatsApp] 🚀 Message dispatched successfully (ID: ${messageId || 'unknown'})`)
      } catch (err: any) {
        sendError = err.message
        console.error(`[WhatsApp] ❌ Send failed: ${err.message}`)
      }

      // Log to Payload CMS
      try {
        await logOutreachMessage(cleanPhone, message, {
          channel: 'whatsapp',
          status: sent ? 'sent' : 'failed',
          campaignName: 'direct_send',
          templateUsed: 'custom',
          messageSid: messageId,
          error: sendError,
        })
      } catch (err: any) {
        console.warn(`[WhatsApp] Payload logging notice: ${err.message}`)
      }

      // Save updated credentials back to Redis
      try {
        await saveBaileysAuthToRedis(AUTH_DIR)
      } catch (err: any) {
        console.warn(`[WhatsApp] Session save notice: ${err.message}`)
      }

      // Allow 2s for background socket ack flushing
      setTimeout(() => {
        try {
          sock.end(undefined)
        } catch {}
        process.exit(sent ? 0 : 1)
      }, 2000)
    } else if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      if (!sent && !shouldReconnect) {
        console.error('[WhatsApp] ❌ Logged out or disconnected permanently')
        clearTimeout(timeoutHandle)
        process.exit(1)
      }
    }
  })
}

main().catch((err) => {
  console.error('[WhatsApp] Fatal error:', err)
  process.exit(1)
})
