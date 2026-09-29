/**
 * Baileys Batch WhatsApp Outreach Sender — Photographer campaign (batch_photographer_01).
 * Pure Node.js WebSockets client using Baileys with Local Docker Redis auth persistence.
 *
 * Run: NODE_OPTIONS="--no-deprecation" node --import tsx scripts/send-photographer-baileys.ts
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'
import {
  saveBaileysAuthToRedis,
  loadBaileysAuthFromRedis,
} from '../src/outreach/whatsapp/baileys-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'
import { logOutreachMessage } from '../src/outreach/whatsapp/log-message'
import { getPayloadClient } from '../src/lib/payload'

dotenv.config()

const AUTH_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys_auth')

// Short name overrides for clean, personalized messaging
const SHORT_NAME_OVERRIDES: Record<number, string> = {
  373: 'Studio Filmica',
  362: 'Ammar Shoots',
  337: 'HC Photography',
  330: 'The Concept Studio',
}

const artists = [
  { id: 373, name: 'STUDIO FILMICA by Basant Joshi', phone: '+919426372606' },
  { id: 316, name: 'Nakshi Photography', phone: '+919879184501' },
  { id: 333, name: 'Milan Bhaskar Photography', phone: '+918460293805' },
  { id: 336, name: 'The Knot Films', phone: '+918160417353' },
  {
    id: 362,
    name: 'Ammar Shoots - Wedding and Event Photographer in Ahmedabad',
    phone: '+919727259010',
  },
  {
    id: 337,
    name: 'HC Photography(Himanshu Chauhan)Wedding Photographer in Ahmedabad',
    phone: '+918866122411',
  },
  { id: 379, name: 'Emotion Clicks', phone: '+919904460014' },
  { id: 393, name: 'Little Wonders Studio', phone: '+919601109396' },
  { id: 342, name: 'Kushal Vadera Photography', phone: '+919998483191' },
  { id: 330, name: 'The Concept Studio by Amit Barot', phone: '+918401083811' },
]

function getShortName(id: number, name: string): string {
  if (SHORT_NAME_OVERRIDES[id]) return SHORT_NAME_OVERRIDES[id]
  return (
    name
      .replace(
        /\b(photography|photographer|photos|photo|studio|media|production|films|film|clicks|click|pictures|picture|creator|digital|lab|shoots|shoot|in\s+ahmedabad|ahmedabad|wedding|event|by\s+\w+)\b/gi,
        '',
      )
      .replace(/[()&\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ')
      .trim() || name
  )
}

function buildMessage(id: number, name: string): string {
  const shortName = getShortName(id, name)
  return `🙏 Namaste ${shortName} Team,

Aapka wedding photography portfolio dekh ke laga ki aap sach me stories capture karte hain — har frame me emotion hai! 📸

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist Marketplace launch kar rahe hain, jaha clients directly verified artists se connect karte hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Hidden Charges
• Wedding, Pre-Wedding & Event Booking Alerts

👉 *Join Free Today:* https://www.artistora.com/register?role=artist&type=photographers

Profile listing ya setup karne me agar aapko koi bhi guidance ya assistance chahiye, to aap hume yaha message kar sakte hain — we are happy to guide you! 👍

Warm regards,
Team Artistora | Ahmedabad`
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function getAlreadyContactedPhones(): Promise<Set<string>> {
  const contacted = new Set<string>()
  try {
    const payload = await getPayloadClient()
    const sentMessages = await payload.find({
      collection: 'outreach-messages',
      where: {
        and: [{ channel: { equals: 'whatsapp' } }, { status: { equals: 'sent' } }],
      },
      limit: 1000,
    })
    for (const msg of sentMessages.docs) {
      if (msg.recipientPhone) {
        const norm = validateAndNormalizePhone(msg.recipientPhone)
        if (norm) contacted.add(norm)
      }
    }

    const contactedArtists = await payload.find({
      collection: 'discovered-artists',
      where: {
        outreachStatus: { equals: 'contacted' },
      },
      limit: 1000,
    })
    for (const artist of contactedArtists.docs) {
      if (artist.phone) {
        const norm = validateAndNormalizePhone(artist.phone)
        if (norm) contacted.add(norm)
      }
    }
  } catch (err: any) {
    console.warn('[DB Check] Warning fetching contacted numbers:', err.message)
  }
  return contacted
}

async function main() {
  console.log('🚀 [Baileys Photographer Outreach] Initializing...')

  fs.mkdirSync(AUTH_DIR, { recursive: true })
  console.log(`[Baileys Auth] Restoring session from Redis to ${AUTH_DIR}...`)
  const restored = await loadBaileysAuthFromRedis(AUTH_DIR)
  if (restored) {
    console.log('[Baileys Auth] ✅ Session restored from Redis')
  } else {
    console.log('[Baileys Auth] ⚠️ No session in Redis — QR scan required')
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000,
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n[Baileys Auth] ⚠️ QR Scan Required:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log(
        `[Baileys Connection] Closed (status: ${statusCode}). Reconnect: ${shouldReconnect}`,
      )
    }

    if (connection === 'open') {
      console.log(`[Baileys Connection] ✅ Connected as: ${sock.user?.id}`)
      await saveBaileysAuthToRedis(AUTH_DIR)

      const contacted = await getAlreadyContactedPhones()
      console.log(`[DB Check] Found ${contacted.size} already-contacted phones in DB`)

      let sentCount = 0
      let skippedCount = 0
      let failCount = 0

      for (let i = 0; i < artists.length; i++) {
        const artist = artists[i]
        const cleanPhone = validateAndNormalizePhone(artist.phone)

        if (!cleanPhone) {
          console.log(
            `[${i + 1}/${artists.length}] ❌ Invalid phone: ${artist.phone} (${artist.name})`,
          )
          failCount++
          continue
        }

        if (contacted.has(cleanPhone)) {
          console.log(
            `[${i + 1}/${artists.length}] ⏭️  Skipping already-contacted: ${artist.name} (${cleanPhone})`,
          )
          skippedCount++
          continue
        }

        const msgBody = buildMessage(artist.id, artist.name)
        const jid = `${cleanPhone}@s.whatsapp.net`

        console.log(
          `\n[${i + 1}/${artists.length}] 📤 Sending to ${artist.name} (${cleanPhone})...`,
        )

        try {
          const sent = await sock.sendMessage(jid, { text: msgBody })
          console.log(
            `[${i + 1}/${artists.length}] ✅ Message sent! (ID: ${sent?.key?.id || 'unknown'})`,
          )
          sentCount++
          contacted.add(cleanPhone)

          try {
            await logOutreachMessage(cleanPhone, msgBody, {
              channel: 'whatsapp',
              status: 'sent',
              campaignName: 'batch_photographer_01',
              templateUsed: 'warm_intro_hi',
              messageSid: sent?.key?.id,
            })
          } catch (e: any) {
            console.warn(`[Log] Failed to log to Payload: ${e.message}`)
          }
        } catch (err: any) {
          console.error(`[${i + 1}/${artists.length}] ❌ Send error to ${cleanPhone}:`, err.message)
          failCount++
        }

        if (i < artists.length - 1) {
          const jitter = Math.floor(Math.random() * 20000) + 45000 // 45-65s
          console.log(`⏳ Sleeping ${Math.round(jitter / 1000)}s before next message...`)
          await sleep(jitter)
        }
      }

      console.log('\n========================================')
      console.log(
        `[Batch Finished] Sent: ${sentCount} | Skipped: ${skippedCount} | Failed: ${failCount}`,
      )
      console.log('========================================')

      await saveBaileysAuthToRedis(AUTH_DIR)
      await sleep(3000)
      sock.end(undefined)
      process.exit(0)
    }
  })
}

main().catch((err) => {
  console.error('[Baileys] Fatal error:', err)
  process.exit(1)
})
