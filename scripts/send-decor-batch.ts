/**
 * Batch WhatsApp outreach sender — Decor & Event Planner campaign (batch_decor_01).
 * Restores session from Local Docker Redis, skips already-contacted artists via DB check,
 * sends with 45–65s human jitter, and logs results to Payload CMS.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-decor-batch.ts
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
        contacted.add(row.recipient_phone.replace(/\D/g, ''))
      }
    }
    await pool.end()
  } catch (err: any) {
    console.warn('[DB Check] Could not fetch contacted artists:', err.message)
  }
  return contacted
}

async function main() {
  console.log('=== Artistora WhatsApp Outreach: Decor & Event Planners (Batch 01) ===\n')

  // 1. Session Restoration from Redis
  console.log('[1/4] Checking Local Docker Redis for saved session...')
  const restored = await loadSessionFromRedis(BASE_DIR)
  if (restored) {
    console.log('✅ Session restored from Docker Redis!')
  } else {
    console.log('ℹ️  No session found in Redis; will initialize new session and save after QR scan.')
  }

  // 2. Filter Already Contacted
  console.log('\n[2/4] Verifying contact status against database...')
  const contacted = await getAlreadyContactedPhones()
  const pending = artists.filter(a => {
    const digits = a.phone.replace(/\D/g, '')
    return !contacted.has(digits)
  })

  console.log(`Total target artists: ${artists.length}`)
  console.log(`Already contacted:    ${artists.length - pending.length}`)
  console.log(`Pending outreach:     ${pending.length}`)

  if (pending.length === 0) {
    console.log('\n🎉 All target decor artists have already been contacted. Exiting.')
    process.exit(0)
  }

  // 3. Initialize WhatsApp Web Client
  console.log('\n[3/4] Initializing WhatsApp Web client...')
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: BASE_DIR }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  })

  let isReady = false

  client.on('qr', (qr: string) => {
    console.log('\n⚠️  WhatsApp authentication required. Please scan this QR code:')
    qrcode.generate(qr, { small: true })
  })

  client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated successfully!')
  })

  client.on('ready', async () => {
    console.log('🚀 WhatsApp Client ready for automated outreach!\n')
    isReady = true

    // Backup freshly authenticated session to Docker Redis
    await saveSessionToRedis(BASE_DIR)

    console.log('[4/4] Starting promotional dispatch...')
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < pending.length; i++) {
      const artist = pending[i]
      const msg = buildMessage(artist.id, artist.name)
      const cleanPhone = validateAndNormalizePhone(artist.phone)

      if (!cleanPhone) {
        console.warn(`❌ Invalid phone number for [${artist.id}] ${artist.name}: ${artist.phone}`)
        failureCount++
        continue
      }

      const recipientJid = `${cleanPhone}@c.us`
      console.log(`\n[${i + 1}/${pending.length}] Sending to: ${artist.name} (+${cleanPhone})...`)

      try {
        await client.sendMessage(recipientJid, msg)
        console.log(`✅ Sent successfully to ${artist.name}!`)
        successCount++

        // Log message to database
        await logOutreachMessage({
          artistId: artist.id,
          recipientPhone: artist.phone,
          messageText: msg,
          status: 'sent',
          campaign: 'batch_decor_01',
          platform: 'whatsapp',
        })

        // Human jitter delay (45 to 65 seconds) between messages
        if (i < pending.length - 1) {
          const jitterSec = Math.floor(Math.random() * 21) + 45
          console.log(`⏳ Waiting ${jitterSec}s jitter before next message...`)
          await sleep(jitterSec * 1000)
        }
      } catch (err: any) {
        console.error(`❌ Failed to send to ${artist.name}:`, err.message)
        failureCount++

        await logOutreachMessage({
          artistId: artist.id,
          recipientPhone: artist.phone,
          messageText: msg,
          status: 'failed',
          errorMessage: err.message,
          campaign: 'batch_decor_01',
          platform: 'whatsapp',
        })
      }
    }

    console.log(`\n=== Batch Dispatch Complete ===`)
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Failed:  ${failureCount}`)

    // Update Redis session backup
    await saveSessionToRedis(BASE_DIR)

    await client.destroy()
    process.exit(0)
  })

  client.on('auth_failure', (msg: string) => {
    console.error('❌ WhatsApp Authentication failure:', msg)
    process.exit(1)
  })

  await client.initialize()
}

main().catch(err => {
  console.error('Fatal outreach error:', err)
  process.exit(1)
})
