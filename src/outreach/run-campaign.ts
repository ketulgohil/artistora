/**
 * Bulk WhatsApp Campaign — Send personalized messages to discovered artists.
 *
 * Usage:
 *   npx tsx src/outreach/run-campaign.ts                    # Dry run (preview only)
 *   npx tsx src/outreach/run-campaign.ts --send             # Actually send
 *   npx tsx src/outreach/run-campaign.ts --send --limit 10  # Send to max 10 artists
 *   npx tsx src/outreach/run-campaign.ts --send --template gujarati_welcome
 *   npx tsx src/outreach/run-campaign.ts --send --area "SG Highway"
 *   npx tsx src/outreach/run-campaign.ts --send --service mehndi
 *   npx tsx src/outreach/run-campaign.ts --stats             # Show stats
 */

import { Client, LocalAuth } from 'whatsapp-web.js'
import { createRequire } from 'module'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

const require = createRequire(import.meta.url)

// Load .env file
config({ path: path.resolve(process.cwd(), '.env') })

// Database connection
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

const SESSION_DIR = './whatsapp-session'
const SENT_LOG = './outreach-sent.json'
const DRY_RUN = !process.argv.includes('--send')
const LIMIT = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--limit') || '999')
const TEMPLATE_ID = process.argv.find((_, i, a) => a[i - 1] === '--template') || 'gujarati_welcome'
const AREA_FILTER = process.argv.find((_, i, a) => a[i - 1] === '--area')
const SERVICE_FILTER = process.argv.find((_, i, a) => a[i - 1] === '--service')
const SHOW_STATS = process.argv.includes('--stats')

// ── Message Templates ──

const TEMPLATES: Record<string, (vars: { name: string; services: string; area: string; businessLine: string }) => string> = {
  gujarati_welcome: (v) => `🙏 નમસ્તે ${v.name},

${v.businessLine}

હું Artistora (artistora.com) ટીમ વતી વાત કરી રહ્યો/રહી છું — અમે અમદાવાદની સૌથી ભરોસાપાત્ર Artist Marketplace બનાવી રહ્યા છીએ, જ્યાં ગ્રાહકો સીધા Artist ને Book કરી શકે છે.

આ પ્લેટફોર્મ પર જોડાવાથી તમને શું મળશે:

🎨 *Free Artist Profile* — તમારું Portfolio, ફોટો, ભાવ બધું એક જગ્યાએ
📩 *Direct Bookings* — ગ્રાહકો સીધા તમને Message/Call કરશે
✅ *Verified Badge* — ભરોસાની નિશાની, વધુ ગ્રાહકો મળશે
💰 *Zero Commission* — એકદમ Free!
📱 *Free Marketing* — અમારા પ્લેટફોર્મ પરથી ગ્રાહકો તમને શોધશે
🔔 *Booking Alerts* — નવા Enquiry ની તરત Notification

👉 *ફ્રીમાં જોડાઓ:* artistora.com/register

કોઈ પ્રશ્ન હોય તો અહીં Reply કરો! 😊

— Team Artistora`,

  gujarati_wedding_season: (v) => `🙏 નમસ્તે ${v.name},

લગ્ન સીઝન શરૂ થવા આવી છે! 💍

Artistora (artistora.com) પર હાલમાં ${v.services} માટે ગ્રાહકોની ભારે Demand છે — અમદાવાદના વિવિધ વિસ્તારોમાંથી Bookings આવી રહી છે.

${v.businessLine}

હવે Profile બનાવવાથી તમે Wedding Season માં વધુ Bookings મેળવી શકશો:

🎨 *Free Artist Profile + Portfolio*
📩 *Direct Customer Bookings*
✅ *Verified Badge*
💰 *Zero Commission — Totally Free!*

👉 *હમણાં જ જોડાઓ:* artistora.com/register

— Team Artistora`,

  gujarati_features: (v) => `🙏 નમસ્તે ${v.name},

${v.businessLine}

Artistora શું છે અને તમારા માટે કેમ જરૂરી છે:

📌 *Artistora = અમદાવાદનું Artist Marketplace*

🔹 ગ્રાહકો Artistora પર આવે છે → તમારા Category માં Search કરે છે → તમારો Profile જુએ છે → Book કરે છે

🔹 તમારે કંઈ કરવાની જરૂર નથી — ગ્રાહકો જાતે તમને શોધે છે!

🔹 *Portfolio Gallery* — તમારા Best Work Upload કરો
🔹 *Pricing* — તમારા Price Set કરો (Fixed / Hourly / Package)
🔹 *Booking System* — Customer Request → તમે Accept/Reject કરો
🔹 *Reviews* — ગ્રાહકો Rating & Review આપે → Trust વધે
🔹 *Dashboard* — બધું એક જગ્યાએ જુઓ

👉 *ફ્રીમાં Register કરો:* artistora.com/register

💰 એકદમ Free!
📞 કોઈ Question હોય તો અહીં Reply કરો

— Team Artistora`,

  gujarati_referral: (v) => `🙏 નમસ્તે ${v.name},

180+ Artists અમદાવાદથી Artistora સાથે જોડાઈ ચૂક્યા છે!

${v.services} ના Artists ને દર મહિને સરેરાશ ₹15,000-50,000 ના Extra Bookings મળી રહ્યા છે.

${v.businessLine}

🔹 Free Profile + Portfolio
🔹 Direct Customer Bookings
🔹 Verified Badge
🔹 Zero Commission — Always Free
🔹 No Setup Fees — Ever

👉 *હમણાં જ જોડાઓ:* artistora.com/register

⏳ Early Bird Artists ને Homepage પર Featured કરવામાં આવશે!

— Team Artistora`,

  english_warm: (v) => `Hi ${v.name}! 👋

${v.businessLine}

I'm reaching out from Artistora (artistora.com) — we're building Ahmedabad's #1 platform for verified artists like you.

Why join Artistora?
🎨 Free Artist Profile with Portfolio
📩 Direct Bookings from Customers
✅ Verified Badge for Trust
💰 Zero Commission — Totally Free!
📱 Free Marketing — Customers Find You
🔔 Instant Booking Alerts

👉 Join free: artistora.com/register

Questions? Just reply here!

— Team Artistora`,
}

// ── Message Randomization (makes each message slightly unique) ──

const GREETINGS = ['🙏 નમસ્તે', '🙏 નમસ્કાર', 'Hello', 'Hi']
const CLOSINGS = ['— Team Artistora', '— Artistora Team', '— Artistora', 'Artistora Team']
const CTA_EMOJIS = ['👉', '▶️', '🔗', '📱']
const ENDING_LINES = [
  'કોઈ પ્રશ્ન હોય તો અહીં Reply કરો! 😊',
  'Questions? Reply here! 😊',
  'Reply કરો કોઈ પણ પ્રશ્ન માટે! 😊',
]

function randomizeMessage(message: string): string {
  // Randomly swap closing
  const closingIdx = Math.floor(Math.random() * CLOSINGS.length)
  message = message.replace(/— Team Artistora$/m, CLOSINGS[closingIdx])
  
  // Randomly swap CTA emoji
  if (Math.random() > 0.5) {
    const emoji = CTA_EMOJIS[Math.floor(Math.random() * CTA_EMOJIS.length)]
    message = message.replace(/👉/g, emoji)
  }
  
  // Randomly swap ending line
  if (Math.random() > 0.7) {
    const ending = ENDING_LINES[Math.floor(Math.random() * ENDING_LINES.length)]
    message = message.replace(/કોઈ પ્રશ્ન હોય તો અહીં Reply કરો! 😊/, ending)
  }
  
  return message
}

// ── Helpers ──

function loadSentLog(): Record<string, string> {
  try {
    if (fs.existsSync(SENT_LOG)) {
      return JSON.parse(fs.readFileSync(SENT_LOG, 'utf-8'))
    }
  } catch {}
  return {}
}

function saveSentLog(log: Record<string, string>): void {
  fs.writeFileSync(SENT_LOG, JSON.stringify(log, null, 2))
}

function generateBusinessLine(artist: any): string {
  return ''
}

// ── Database Query ──

async function queryArtists(filters: { area?: string; service?: string; limit: number; offset: number }) {
  const { Client: PgClient } = require('pg')
  const pg = new PgClient({ connectionString: DB_URL })
  await pg.connect()

  let where = 'WHERE phone IS NOT NULL AND phone != \'\''
  const params: any[] = []

  if (filters.area) {
    params.push(`%${filters.area}%`)
    where += ` AND (area ILIKE $${params.length} OR city ILIKE $${params.length})`
  }
  if (filters.service) {
    params.push(`%${filters.service}%`)
    where += ` AND specializations ILIKE $${params.length}`
  }

  // Exclude already sent
  const sent = loadSentLog()
  const sentIds = Object.keys(sent)
  if (sentIds.length > 0) {
    params.push(sentIds)
    where += ` AND id::text != ALL($${params.length}::text[])`
  }

  params.push(filters.limit)
  params.push(filters.offset)

  const query = `
    SELECT DISTINCT ON (phone) id, business_name, name, phone, whatsapp_number, specializations,
           area, city, rating, review_count, source, lead_score
    FROM discovered_artists
    ${where}
    ORDER BY phone, lead_score DESC NULLS LAST, rating DESC NULLS LAST
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `

  const result = await pg.query(query, params)
  await pg.end()
  return result.rows
}

async function countArtists(filters: { area?: string; service?: string }) {
  const { Client: PgClient } = require('pg')
  const pg = new PgClient({ connectionString: DB_URL })
  await pg.connect()

  let where = 'WHERE phone IS NOT NULL AND phone != \'\''
  const params: any[] = []

  if (filters.area) {
    params.push(`%${filters.area}%`)
    where += ` AND (area ILIKE $${params.length} OR city ILIKE $${params.length})`
  }
  if (filters.service) {
    params.push(`%${filters.service}%`)
    where += ` AND specializations ILIKE $${params.length}`
  }

  const sent = loadSentLog()
  const sentIds = Object.keys(sent)
  if (sentIds.length > 0) {
    params.push(sentIds)
    where += ` AND id::text != ALL($${params.length}::text[])`
  }

  const result = await pg.query(`SELECT COUNT(*) as total FROM discovered_artists ${where}`, params)
  await pg.end()
  return parseInt(result.rows[0].total)
}

// ── Stats ──

async function showStats() {
  const { Client: PgClient } = require('pg')
  const pg = new PgClient({ connectionString: DB_URL })
  await pg.connect()

  const total = await pg.query('SELECT COUNT(*) as total, COUNT(phone) as with_phone FROM discovered_artists')
  const byService = await pg.query(`
    SELECT specializations, COUNT(*) as count
    FROM discovered_artists
    WHERE phone IS NOT NULL AND specializations IS NOT NULL
    GROUP BY specializations ORDER BY count DESC LIMIT 10
  `)
  const byArea = await pg.query(`
    SELECT COALESCE(area, 'Unknown') as area, COUNT(*) as count
    FROM discovered_artists
    WHERE phone IS NOT NULL
    GROUP BY area ORDER BY count DESC LIMIT 10
  `)

  const sent = loadSentLog()

  console.log('\n📊 Outreach Stats')
  console.log('─'.repeat(50))
  console.log(`Total Artists: ${total.rows[0].total}`)
  console.log(`With Phone: ${total.rows[0].with_phone}`)
  console.log(`Already Sent: ${Object.keys(sent).length}`)
  console.log(`Remaining: ${parseInt(total.rows[0].with_phone) - Object.keys(sent).length}`)

  console.log('\n📌 By Service:')
  for (const row of byService.rows) {
    console.log(`  ${row.specializations}: ${row.count}`)
  }

  console.log('\n📍 By Area:')
  for (const row of byArea.rows) {
    console.log(`  ${row.area}: ${row.count}`)
  }

  await pg.end()
}

// ── Main ──

async function main() {
  if (SHOW_STATS) {
    await showStats()
    return
  }

  const templateFn = TEMPLATES[TEMPLATE_ID]
  if (!templateFn) {
    console.error(`❌ Unknown template: ${TEMPLATE_ID}`)
    console.error(`Available: ${Object.keys(TEMPLATES).join(', ')}`)
    process.exit(1)
  }

  console.log('='.repeat(60))
  console.log(`[Campaign] Template: ${TEMPLATE_ID}`)
  console.log(`[Campaign] Mode: ${DRY_RUN ? '🔍 DRY RUN (preview)' : '📤 SENDING'}`)
  console.log(`[Campaign] Limit: ${LIMIT}`)
  if (AREA_FILTER) console.log(`[Campaign] Area: ${AREA_FILTER}`)
  if (SERVICE_FILTER) console.log(`[Campaign] Service: ${SERVICE_FILTER}`)
  console.log('='.repeat(60))

  const remaining = await countArtists({ area: AREA_FILTER, service: SERVICE_FILTER })
  console.log(`[Campaign] ${remaining} artists available to message\n`)

  if (remaining === 0) {
    console.log('[Campaign] No artists to message. Done!')
    return
  }

  const artists = await queryArtists({
    area: AREA_FILTER,
    service: SERVICE_FILTER,
    limit: Math.min(LIMIT, remaining),
    offset: 0,
  })

  console.log(`[Campaign] Fetched ${artists.length} artists\n`)

  // Preview first 5
  console.log('─'.repeat(60))
  console.log('📨 Message Preview (first 5):')
  console.log('─'.repeat(60))
  for (let i = 0; i < Math.min(5, artists.length); i++) {
    const a = artists[i]
    const phone = a.whatsapp_number || a.phone
    const rawName = a.name || a.business_name || ''
    const name = rawName === 'Results' ? '' : rawName
    const displayName = name || 'Artist'
    const services = a.specializations || 'Art'
    const businessLine = generateBusinessLine(a)

    // Use generic greeting if no valid name
    const greeting = name ? `🙏 નમસ્તે ${name},` : '🙏 નમસ્તે,'
    let message = templateFn({ name: name || '', services, area: a.area || '', businessLine }).replace(/^🙏 નમસ્તે [^,]*,/, greeting)
    // Remove extra blank lines from empty businessLine
    message = message.replace(/\n{3,}/g, '\n\n')
    message = randomizeMessage(message) // Add slight variation

    console.log(`\n[${i + 1}] ${displayName} | ${phone} | Score: ${a.lead_score || 'N/A'}`)
    console.log(`    Area: ${a.area || 'N/A'} | Services: ${services}`)
    console.log(`    Message (${message.length} chars):`)
    console.log(`    ${message.substring(0, 200)}...`)
  }
  console.log('\n' + '─'.repeat(60))

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN — No messages sent.')
    console.log(`   Run with --send to actually send to ${artists.length} artists.`)
    console.log(`   Or --send --limit 5 to start small.`)
    return
  }

  // ── Actually Send via Queue ──
  console.log('\n📤 Queuing messages for WhatsApp service...')

  const fs = require('fs')
  const path = require('path')
  const queueDir = path.join(process.cwd(), '.whatsapp-queue')
  fs.mkdirSync(queueDir, { recursive: true })

  const sentLog = loadSentLog()
  let sent = 0
  let failed = 0

  for (let i = 0; i < artists.length; i++) {
    const a = artists[i]
    const rawPhone = (a.whatsapp_number || a.phone).replace(/[^\d]/g, '')
    // Normalize: strip leading 0, ensure 91 prefix for Indian numbers
    const phone = rawPhone.startsWith('0') ? `91${rawPhone.slice(1)}` : rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
    const rawName = a.name || a.business_name || ''
    const name = rawName === 'Results' ? '' : rawName
    const displayName = name || 'Artist'
    const services = a.specializations || 'Art'
    const businessLine = generateBusinessLine(a)
    const greeting = name ? `🙏 નમસ્તે ${name},` : '🙏 નમસ્તે,'
    let message = templateFn({ name: name || '', services, area: a.area || '', businessLine }).replace(/^🙏 નમસ્તે [^,]*,/, greeting)
    message = message.replace(/\n{3,}/g, '\n\n')
    message = randomizeMessage(message) // Add slight variation

    try {
      // Write to queue file
      const filename = `${phone}_${Date.now()}.json`
      fs.writeFileSync(path.join(queueDir, filename), JSON.stringify({ phone, message, queuedAt: new Date().toISOString() }))
      sentLog[a.id] = new Date().toISOString()
      sent++
      console.log(`  [${i + 1}/${artists.length}] ✅ Queued for ${displayName} (${phone})`)
    } catch (err: any) {
      failed++
      console.log(`  [${i + 1}/${artists.length}] ❌ ${displayName} (${phone}): ${err.message}`)
    }

    // Save progress every 5 messages
    if ((i + 1) % 5 === 0) {
      saveSentLog(sentLog)
    }

    // Rate limit: 5-10 seconds between messages
    if (i < artists.length - 1) {
      const delay = 5000 + Math.random() * 5000
      await new Promise(r => setTimeout(r, delay))
    }
  }

  saveSentLog(sentLog)

  console.log('\n' + '='.repeat(60))
  console.log(`[Campaign] Done!`)
  console.log(`  Queued: ${sent}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total sent (all time): ${Object.keys(sentLog).length}`)
  console.log('='.repeat(60))
  console.log('\n💡 Messages are queued. The WhatsApp service will send them automatically.')
}

main().catch((err) => {
  console.error('[Campaign] Fatal error:', err)
  process.exit(1)
})
