/**
 * Baileys Batch WhatsApp Sender with DB Deduplication & Rate Limiting.
 * Pure Node.js WebSockets client — fast, lightweight, and resilient.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-batch-baileys.ts
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import { Pool } from 'pg'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'
import { saveBaileysAuthToRedis, loadBaileysAuthFromRedis } from '../src/outreach/whatsapp/baileys-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'
import { logOutreachMessage } from '../src/outreach/whatsapp/log-message'

dotenv.config()

const AUTH_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys_auth')

const artists = [
  { id: 331, name: 'Dipuh mehndi artist',                    phone: '+918980306183' },
  { id: 266, name: 'Mehndi By Monali',                       phone: '+918849402240' },
  { id: 329, name: "Nidhi's Creative Mehndi & Nails",        phone: '+918849528228' },
  { id: 350, name: 'Honey Mehndi Art',                       phone: '+919898218996' },
  { id: 297, name: 'Mehndikka by Ushma',                     phone: '+919724207812' },
  { id: 309, name: 'Ahmedabad Mehndi Designer',              phone: '+917801818943' },
  { id: 307, name: 'Dhvani Mehndi art',                      phone: '+919510556227' },
  { id: 289, name: 'Prachi Mehndi and Nail Art in Ahmedabad',phone: '+919033965485' },
  { id: 306, name: 'VIRHANT MEHNDI ART & CLASSES',           phone: '+919054461672' },
  { id: 282, name: 'JALPA SHAH MEHANDI Art',                 phone: '+919574506318' },
]

function buildMessage(name: string): string {
  const shortName = name
    .replace(/\b(artist|art|classes|class|designer|mehandi|mehndi|henna|in\s+ahmedabad|ahmedabad)\b/gi, '')
    .replace(/[&]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')
    .trim() || name

  return `🙏 Namaste ${shortName} Team,

Aapka Ahmedabad me Mehndi work aur Google par 5★ rating sach me impressive hai! ✨

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist Marketplace launch kar rahe hain, jaha clients directly verified artists se connect karte hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Hidden Charges
• Bridal & Event Booking Alerts

👉 *Join Free Today:* https://www.artistora.com/register

Profile listing ya setup karne me agar aapko koi bhi guidance ya assistance chahiye, to aap hume yaha message kar sakte hain — we are happy to guide you! 👍

Warm regards,
Team Artistora | Ahmedabad`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getAlreadyContactedPhones(): Promise<Set<string>> {
  const contacted = new Set<string>()
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const res = await pool.query(`
      SELECT recipient_phone FROM (
        SELECT da.phone as recipient_phone, om.status
        FROM outreach_messages om
        JOIN discovered_artists da ON om.artist_id = da.id
        WHERE om.status = 'sent'
      ) sub
    `)
    for (const row of res.rows) {
      if (row.recipient_phone) {
        contacted.add(row.recipient_phone.replace(/\D/g, ''))
      }
    }
    await pool.end()
  } catch (err: any) {
    console.warn('[Deduplication] DB query warning:', err.message)
  }
  return contacted
}

async function startBatch() {
  console.log(`[Batch] Checking outreach status for ${artists.length} Mehndi artists...`)

  const alreadyContacted = await getAlreadyContactedPhones()
  const pendingArtists = artists.filter(a => {
    const clean = a.phone.replace(/\D/g, '')
    return !alreadyContacted.has(clean) && !alreadyContacted.has(clean.slice(-10))
  })

  console.log(`[Batch] ${alreadyContacted.size} artists already contacted. ${pendingArtists.length} pending to send.`)
  if (pendingArtists.length === 0) {
    console.log('🎉 All artists in this batch have already received messages! Nothing to send.')
    process.exit(0)
  }

  // Restore credentials from Redis if needed
  if (!fs.existsSync(AUTH_DIR) || fs.readdirSync(AUTH_DIR).length === 0) {
    console.log('[Auth] Restoring Baileys credentials from Redis...')
    await loadBaileysAuthFromRedis(AUTH_DIR)
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Artistora Outreach', 'Chrome', '120.0.0'],
  })

  let isProcessing = false

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await saveBaileysAuthToRedis(AUTH_DIR)
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n=========================================')
      console.log('📱 SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE:')
      console.log('=========================================\n')
      qrcode.generate(qr, { small: true })
      console.log('\nWaiting for scan...')
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect && !isProcessing) {
        setTimeout(startBatch, 3000)
      } else if (statusCode === DisconnectReason.loggedOut) {
        console.log('[Baileys] Logged out. Re-run with --fresh.')
        try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }) } catch {}
        process.exit(1)
      }
    } else if (connection === 'open') {
      console.log('\n=========================================')
      console.log(`🚀 Connected to WhatsApp Web via Baileys!`)
      console.log(`Sending to ${pendingArtists.length} pending artists...`)
      console.log('=========================================\n')

      if (isProcessing) return
      isProcessing = true

      await saveCreds()
      await saveBaileysAuthToRedis(AUTH_DIR)

      for (let i = 0; i < pendingArtists.length; i++) {
        const { name, phone } = pendingArtists[i]
        const cleanPhone = validateAndNormalizePhone(phone)
        const message = buildMessage(name)

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`[${i + 1}/${pendingArtists.length}] Sending to: ${name} (${phone})`)
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

        if (!cleanPhone) {
          console.error(`[${i + 1}/${pendingArtists.length}] ❌ Invalid phone: ${phone}`)
          continue
        }

        const jid = `${cleanPhone}@s.whatsapp.net`
        let sendSuccess = false
        let sendError: string | undefined
        let messageSid: string | undefined

        try {
          const sent = await sock.sendMessage(jid, { text: message })
          messageSid = sent?.key?.id || undefined
          sendSuccess = true
          console.log(`[${i + 1}/${pendingArtists.length}] ✅ Message sent to ${cleanPhone}`)
        } catch (err: any) {
          sendError = err.message
          console.error(`[${i + 1}/${pendingArtists.length}] ❌ Send failed: ${err.message}`)
        }

        // Log to Payload CMS
        try {
          await logOutreachMessage(cleanPhone, message, {
            channel: 'whatsapp',
            status: sendSuccess ? 'sent' : 'failed',
            campaignName: 'batch_mehndi_01',
            templateUsed: 'custom',
            messageSid,
            error: sendError,
          })
        } catch (err: any) {
          console.error('[Batch] Payload logging warning:', err.message)
        }

        if (i < pendingArtists.length - 1) {
          const delaySec = 45 + Math.floor(Math.random() * 20) // 45–65s safe rate limit
          console.log(`⏳ Waiting ${delaySec}s before next message...`)
          await sleep(delaySec * 1000)
        }
      }

      console.log('\n🎉 Batch send completed successfully!')
      process.exit(0)
    }
  })
}

startBatch().catch((err) => {
  console.error('Fatal error in batch:', err)
  process.exit(1)
})
