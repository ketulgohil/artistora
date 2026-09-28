/**
 * Batch WhatsApp outreach sender — Photographer campaign (batch_photographer_01).
 * Restores session from Local Redis, skips already-contacted artists via DB check,
 * sends with 45–65s jitter, logs to Payload CMS.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-photographer-batch.ts
 */

import { saveSessionToRedis, loadSessionFromRedis } from '../src/outreach/whatsapp/redis-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'
import { logOutreachMessage } from '../src/outreach/whatsapp/log-message'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import { createRequire } from 'module'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config()

const require = createRequire(import.meta.url)
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const BASE_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/whatsapp-session'
const SESSION_DIR_SESSION = path.join(BASE_DIR, 'session')

// shortName overrides for names where auto-extraction produces awkward results
const SHORT_NAME_OVERRIDES: Record<number, string> = {
  373: 'Studio Filmica',
  362: 'Ammar Shoots',
  337: 'HC Photography',
  330: 'The Concept Studio',
}

const artists = [
  { id: 373, name: 'STUDIO FILMICA by Basant Joshi',                                    phone: '+919426372606' },
  { id: 316, name: 'Nakshi Photography',                                                 phone: '+919879184501' },
  { id: 333, name: 'Milan Bhaskar Photography',                                          phone: '+918460293805' },
  { id: 336, name: 'The Knot Films',                                                     phone: '+918160417353' },
  { id: 362, name: 'Ammar Shoots - Wedding and Event Photographer in Ahmedabad',         phone: '+919727259010' },
  { id: 337, name: 'HC Photography(Himanshu Chauhan)Wedding Photographer in Ahmedabad', phone: '+918866122411' },
  { id: 379, name: 'Emotion Clicks',                                                     phone: '+919904460014' },
  { id: 393, name: 'Little Wonders Studio',                                              phone: '+919601109396' },
  { id: 342, name: 'Kushal Vadera Photography',                                          phone: '+919998483191' },
  { id: 330, name: 'The Concept Studio by Amit Barot',                                  phone: '+918401083811' },
]

function getShortName(id: number, name: string): string {
  if (SHORT_NAME_OVERRIDES[id]) return SHORT_NAME_OVERRIDES[id]
  return (
    name
      .replace(/\b(photography|photographer|photos|photo|studio|media|production|films|film|clicks|click|pictures|picture|creator|digital|lab|shoots|shoot|in\s+ahmedabad|ahmedabad|wedding|event|by\s+\w+)\b/gi, '')
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

👉 *Join Free Today:* https://www.artistora.com/register

Profile listing ya setup karne me agar aapko koi bhi guidance ya assistance chahiye, to aap hume yaha message kar sakte hain — we are happy to guide you! 👍

Warm regards,
Team Artistora | Ahmedabad`
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

async function getAlreadyContactedPhones(): Promise<Set<string>> {
  const contacted = new Set<string>()
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const res = await pool.query(`
      SELECT da.phone AS recipient_phone
      FROM outreach_messages om
      JOIN discovered_artists da ON om.artist_id = da.id
      WHERE om.status = 'sent'
    `)
    for (const row of res.rows) {
      if (row.recipient_phone) {
        const clean = row.recipient_phone.replace(/\D/g, '')
        contacted.add(clean)
        contacted.add(clean.slice(-10))
      }
    }
    await pool.end()
  } catch (err: any) {
    console.warn('[Deduplication] DB query warning:', err.message)
  }
  return contacted
}

async function main() {
  console.log(`[Batch] Checking outreach status for ${artists.length} photographers...`)

  const alreadyContacted = await getAlreadyContactedPhones()
  const pendingArtists = artists.filter(a => {
    const clean = a.phone.replace(/\D/g, '')
    return !alreadyContacted.has(clean) && !alreadyContacted.has(clean.slice(-10))
  })

  console.log(`[Batch] ${alreadyContacted.size} total already contacted. ${pendingArtists.length} photographers pending.`)
  if (pendingArtists.length === 0) {
    console.log('🎉 All photographers in this batch have already received messages! Nothing to send.')
    process.exit(0)
  }

  console.log('\n📋 Will send to:')
  for (const a of pendingArtists) {
    console.log(`   • [${a.id}] ${a.name} → "Namaste ${getShortName(a.id, a.name)} Team"`)
  }
  console.log()

  // Restore session from Redis
  console.log('[Batch] Restoring session from Local Redis...')
  fs.mkdirSync(SESSION_DIR_SESSION, { recursive: true })
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.unlinkSync(path.join(SESSION_DIR_SESSION, f)) } catch {}
  }

  await loadSessionFromRedis(SESSION_DIR_SESSION)

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
    console.log('\n[WhatsApp] QR scan requested:\n')
    qrcode.generate(qr, { small: true })
  })

  client.on('authenticated', () => {
    console.log('[Batch] ✅ Authenticated with WhatsApp Web!')
  })

  client.on('ready', async () => {
    console.log('\n=========================================')
    console.log(`🚀 WhatsApp Client is READY! Sending to ${pendingArtists.length} photographers...`)
    console.log('=========================================\n')

    for (let i = 0; i < pendingArtists.length; i++) {
      const { id, name, phone } = pendingArtists[i]
      const cleanPhone = validateAndNormalizePhone(phone)
      const message = buildMessage(id, name)

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[${i + 1}/${pendingArtists.length}] Sending to: ${name} (${phone})`)
      console.log(`      → Namaste ${getShortName(id, name)} Team`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

      if (!cleanPhone) {
        console.error(`[${i + 1}/${pendingArtists.length}] ❌ Invalid phone: ${phone}`)
        continue
      }

      const chatId = `${cleanPhone}@c.us`
      let sendSuccess = false
      let sendError: string | undefined
      let messageSid: string | undefined

      try {
        const response = await client.sendMessage(chatId, message)
        messageSid = response?.id?.id || undefined
        sendSuccess = true
        console.log(`[${i + 1}/${pendingArtists.length}] ✅ Message sent to ${cleanPhone}`)
      } catch (err: any) {
        sendError = err.message
        console.error(`[${i + 1}/${pendingArtists.length}] ❌ Send failed: ${err.message}`)
      }

      // Log to Payload CMS
      try {
        await logOutreachMessage(cleanPhone!, message, {
          channel: 'whatsapp',
          status: sendSuccess ? 'sent' : 'failed',
          campaignName: 'batch_photographer_01',
          templateUsed: 'custom',
          messageSid,
          error: sendError,
        })
      } catch (err: any) {
        console.error('[Batch] Payload logging warning:', err.message)
      }

      if (i < pendingArtists.length - 1) {
        const delaySec = 45 + Math.floor(Math.random() * 20) // 45–65s
        console.log(`⏳ Waiting ${delaySec}s before next message...`)
        await sleep(delaySec * 1000)
      }
    }

    console.log('\n🎉 Photographer batch send completed!')
    try {
      await saveSessionToRedis(SESSION_DIR_SESSION)
      console.log('[Batch] ✅ Session saved to Redis')
    } catch {}

    await client.destroy().catch(() => {})
    process.exit(0)
  })

  client.initialize().catch((err: Error) => {
    console.error('[Batch] Init failed:', err.message)
    process.exit(1)
  })
}

main()
