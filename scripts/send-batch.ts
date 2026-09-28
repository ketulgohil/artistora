/**
 * Batch WhatsApp outreach sender with persistent single-session connection & deduplication.
 * Checks database to skip already-contacted artists so no one receives duplicate messages.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-batch.ts
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
  return new Promise(res => setTimeout(res, ms))
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

async function main() {
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
    console.log(`🚀 WhatsApp Client is READY! Sending to ${pendingArtists.length} remaining artists...`)
    console.log('=========================================\n')

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
        const delaySec = 45 + Math.floor(Math.random() * 20) // 45–65s
        console.log(`⏳ Waiting ${delaySec}s before next message...`)
        await sleep(delaySec * 1000)
      }
    }

    console.log('\n🎉 Remaining batch send completed!')
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
