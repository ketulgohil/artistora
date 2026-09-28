/**
 * Baileys Batch WhatsApp Outreach Sender — Decor & Event Planner campaign (batch_decor_01).
 * Pure Node.js WebSockets client using Baileys with Local Docker Redis auth persistence.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-decor-baileys.ts
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

// Short name overrides for clean, personalized messaging
const SHORT_NAME_OVERRIDES: Record<number, string> = {
  945: 'Shree Krishna Events',
  521: 'Ganesh Decoration & Events',
  505: 'Pacific Events',
  466: 'Sanskruti Events',
  495: 'Dreamy Creation Events',
  469: 'Ganesh Event & Decorater',
  480: 'Rhythm Events & Decor',
  486: 'Dream Decoration & Event',
  492: 'Leo Decor & Events',
  472: 'SK Corporation Decor',
}

const artists = [
  { id: 945, name: 'Shree Krishna Events Planner', phone: '+917874111551' },
  { id: 521, name: 'Ganesh Decoration & Events', phone: '+919033517592' },
  { id: 505, name: 'Pacific Events - Event Planner in Ahmedabad', phone: '+918487989345' },
  { id: 466, name: 'Sanskruti Events - Sound/Lights/Decoration', phone: '+919824501931' },
  { id: 495, name: 'Dreamy Creation Events', phone: '+917575888678' },
  { id: 469, name: 'Ganesh Event, Decorater & Wedding Planner', phone: '+917990332880' },
  { id: 480, name: 'Rhythm Events & Decor', phone: '+919099059950' },
  { id: 486, name: 'Dream Decoration & Event', phone: '+919624449366' },
  { id: 492, name: 'Leo Decor& Event planner', phone: '+919879019054' },
  { id: 472, name: 'SK Corporation | Wedding Decorator in Ahmedabad', phone: '+919879000277' },
]

function getShortName(id: number, name: string): string {
  if (SHORT_NAME_OVERRIDES[id]) return SHORT_NAME_OVERRIDES[id]
  return (
    name
      .replace(/\b(in\s+ahmedabad|ahmedabad|wedding|event|events|planner|planners|decorator|decorators|decoration|sound|lights)\b/gi, '')
      .replace(/[()&|\-]/g, '')
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

Aapka event decoration & wedding planning work Ahmedabad me bahut popular aur impressive hai! ✨

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist & Event Marketplace launch kar rahe hain, jaha clients directly verified decor artists aur event planners se connect karte hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Hidden Charges
• Wedding, Stage Decor, Mandap & Corporate Event Booking Alerts

👉 *Join Free Today:* https://www.artistora.com/register

Profile listing ya setup karne me agar aapko koi bhi guidance ya assistance chahiye, to aap hume yaha reply kar sakte hain — we are happy to assist you! 👍

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
  console.log(`[Batch Baileys] Checking outreach status for ${artists.length} Decor & Event planners...`)

  // 1. Check DB deduplication
  const alreadyContacted = await getAlreadyContactedPhones()
  const pendingArtists = artists.filter((a) => {
    const raw = a.phone.replace(/\D/g, '')
    return !alreadyContacted.has(raw)
  })

  console.log(`[Batch Baileys] Total: ${artists.length}, Already Contacted: ${artists.length - pendingArtists.length}, Pending: ${pendingArtists.length}`)

  if (pendingArtists.length === 0) {
    console.log('🎉 All Decor & Event artists have already been contacted. Done!')
    process.exit(0)
  }

  // 2. Restore Baileys Auth from Docker Redis
  console.log('[Batch Baileys] Restoring Baileys auth state from Docker Redis...')
  await loadBaileysAuthFromRedis(AUTH_DIR)

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const logger = pino({ level: 'silent' })

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
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
      console.log('\n⚠️  WhatsApp Baileys QR code scan required:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      console.log(`[Baileys] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`)

      if (shouldReconnect && !isProcessing) {
        startBatch()
      } else {
        console.error('❌ Logged out or closed. Re-authentication required.')
        process.exit(1)
      }
    } else if (connection === 'open') {
      if (isProcessing) return
      isProcessing = true

      console.log('✅ Baileys WhatsApp connection open and authenticated!')

      // Backup auth state to Docker Redis
      await saveBaileysAuthToRedis(AUTH_DIR)

      console.log(`\n🚀 Starting dispatch of ${pendingArtists.length} messages with 45–65s human jitter...\n`)

      let success = 0
      let failed = 0

      for (let i = 0; i < pendingArtists.length; i++) {
        const artist = pendingArtists[i]
        const normalizedPhone = validateAndNormalizePhone(artist.phone)

        if (!normalizedPhone) {
          console.warn(`[Skip] Invalid phone: ${artist.name} (${artist.phone})`)
          failed++
          continue
        }

        const jid = `${normalizedPhone}@s.whatsapp.net`
        const messageText = buildMessage(artist.id, artist.name)

        console.log(`[${i + 1}/${pendingArtists.length}] Sending to ${artist.name} (+${normalizedPhone})...`)

        try {
          await sock.sendMessage(jid, { text: messageText })
          console.log(`  ✅ Sent to ${artist.name}!`)
          success++

          try {
            await logOutreachMessage(artist.phone, messageText, {
              channel: 'whatsapp',
              status: 'sent',
              campaignName: 'batch_decor_01',
              templateUsed: 'custom',
            })
          } catch (logErr: any) {
            console.warn(`  [Log Warning] ${logErr.message}`)
          }
        } catch (err: any) {
          console.error(`  ❌ Failed for ${artist.name}: ${err.message}`)
          failed++

          try {
            await logOutreachMessage(artist.phone, messageText, {
              channel: 'whatsapp',
              status: 'failed',
              error: err.message,
              campaignName: 'batch_decor_01',
              templateUsed: 'custom',
            })
          } catch (logErr: any) {
            console.warn(`  [Log Warning] ${logErr.message}`)
          }
        }

        // Apply 45-65s jitter delay between messages
        if (i < pendingArtists.length - 1) {
          const delaySec = Math.floor(Math.random() * 21) + 45
          console.log(`  ⏳ Waiting ${delaySec}s before next message...`)
          await sleep(delaySec * 1000)
        }
      }

      console.log(`\n=== Batch Dispatch Complete ===`)
      console.log(`✅ Success: ${success} | ❌ Failed: ${failed}`)

      await saveBaileysAuthToRedis(AUTH_DIR)
      await sock.end(undefined)
      process.exit(0)
    }
  })
}

startBatch().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
