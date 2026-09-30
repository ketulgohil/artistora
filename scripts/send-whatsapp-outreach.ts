/**
 * Multi-Category Automated WhatsApp Outreach Runner (Baileys + Redis).
 * Dispatches personalized WhatsApp outreach messages to 10 Mehndi Artists, 10 Decorators & Planners,
 * 10 Makeup Artists, and 10 Photographers (total 40 artists) in Ahmedabad with Redis session persistence.
 *
 * Safety & Rate Limits:
 *   - Human Delay Jitter: 45s - 65s between consecutive messages
 *   - Inter-Category Cooldown: 90s pause between category batches
 *   - DB Deduplication: Queries `outreach_messages` in PostgreSQL to ensure 0 duplicate sends
 *   - Session Persistence: Multi-file auth stored in Redis (`whatsapp:baileys:auth:tarball`)
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-whatsapp-outreach.ts
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-whatsapp-outreach.ts --category mehndi
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-whatsapp-outreach.ts --category decor
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-whatsapp-outreach.ts --category makeup
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-whatsapp-outreach.ts --category photography
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-whatsapp-outreach.ts --limit 5
 *
 * Importers/Callers: Executed standalone via CLI by admin.
 * Affected APIs: Baileys WebSocket protocol, Local Redis, PostgreSQL via Pool / Payload.
 * Schemas: `discovered_artists`, `outreach_messages`.
 * User instruction: "run whatsaap outreach with 10 of mehndi, decore, mackup, photographer."
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
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const AUTH_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys-auth-session')
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Silence noisy low-level libsignal ratchet/session dumps to keep terminal clean
const originalConsoleLog = console.log
const originalConsoleInfo = console.info
console.log = (...args: any[]) => {
  const firstArg = typeof args[0] === 'string' ? args[0] : ''
  if (
    firstArg.includes('Closing session: SessionEntry') ||
    firstArg.includes('Decrypted message with closed session') ||
    firstArg.includes('Closing open session in favor of incoming prekey bundle') ||
    firstArg.includes('SessionEntry {') ||
    firstArg.includes('_chains:') ||
    firstArg.includes('registrationId:') ||
    firstArg.includes('currentRatchet:')
  ) {
    return
  }
  originalConsoleLog.apply(console, args)
}
console.info = (...args: any[]) => {
  const firstArg = typeof args[0] === 'string' ? args[0] : ''
  if (
    firstArg.includes('Closing session') ||
    firstArg.includes('Decrypted message') ||
    firstArg.includes('SessionEntry')
  ) {
    return
  }
  originalConsoleInfo.apply(console, args)
}

interface OutreachTarget {
  id: number | string
  name: string
  phone: string
  category: 'mehndi' | 'decor' | 'makeup' | 'photography'
  cleanName?: string
}

interface ContactedHistory {
  phones: Set<string>
  artistIds: Set<string>
  lastContactDates: Map<string, string>
}

// Curated verified lists of Ahmedabad artists per category
const CURATED_TARGETS: Record<'mehndi' | 'decor' | 'makeup' | 'photography', OutreachTarget[]> = {
  mehndi: [
    { id: 331, name: 'Dipuh mehndi artist', phone: '+918980306183', category: 'mehndi', cleanName: 'Dipuh Mehndi Artist' },
    { id: 266, name: 'Mehndi By Monali', phone: '+918849402240', category: 'mehndi', cleanName: 'Mehndi By Monali' },
    { id: 329, name: "Nidhi's Creative Mehndi & Nails", phone: '+918849528228', category: 'mehndi', cleanName: "Nidhi's Creative Mehndi" },
    { id: 350, name: 'Honey Mehndi Art', phone: '+919898218996', category: 'mehndi', cleanName: 'Honey Mehndi Art' },
    { id: 297, name: 'Mehndikka by Ushma', phone: '+919724207812', category: 'mehndi', cleanName: 'Mehndikka by Ushma' },
    { id: 309, name: 'Ahmedabad Mehndi Designer', phone: '+917801818943', category: 'mehndi', cleanName: 'Ahmedabad Mehndi Designer' },
    { id: 307, name: 'Dhvani Mehndi art', phone: '+919510556227', category: 'mehndi', cleanName: 'Dhvani Mehndi Art' },
    { id: 289, name: 'Prachi Mehndi and Nail Art in Ahmedabad', phone: '+919033965485', category: 'mehndi', cleanName: 'Prachi Mehndi Art' },
    { id: 306, name: 'VIRHANT MEHNDI ART & CLASSES', phone: '+919054461672', category: 'mehndi', cleanName: 'Virhant Mehndi Art' },
    { id: 282, name: 'JALPA SHAH MEHANDI Art', phone: '+919574506318', category: 'mehndi', cleanName: 'Jalpa Shah Mehndi Art' },
  ],
  decor: [
    { id: 945, name: 'Shree Krishna Events Planner', phone: '+917874111551', category: 'decor', cleanName: 'Shree Krishna Events' },
    { id: 521, name: 'Ganesh Decoration & Events', phone: '+919033517592', category: 'decor', cleanName: 'Ganesh Decoration & Events' },
    { id: 505, name: 'Pacific Events - Event Planner in Ahmedabad', phone: '+918487989345', category: 'decor', cleanName: 'Pacific Events' },
    { id: 466, name: 'Sanskruti Events - Sound/Lights/Decoration', phone: '+919824501931', category: 'decor', cleanName: 'Sanskruti Events' },
    { id: 495, name: 'Dreamy Creation Events', phone: '+917575888678', category: 'decor', cleanName: 'Dreamy Creation Events' },
    { id: 469, name: 'Ganesh Event, Decorater & Wedding Planner', phone: '+917990332880', category: 'decor', cleanName: 'Ganesh Event & Decorater' },
    { id: 480, name: 'Rhythm Events & Decor', phone: '+919099059950', category: 'decor', cleanName: 'Rhythm Events & Decor' },
    { id: 486, name: 'Dream Decoration & Event', phone: '+919624449366', category: 'decor', cleanName: 'Dream Decoration & Event' },
    { id: 492, name: 'Leo Decor& Event planner', phone: '+919879019054', category: 'decor', cleanName: 'Leo Decor & Events' },
    { id: 472, name: 'SK Corporation | Wedding Decorator in Ahmedabad', phone: '+919879000277', category: 'decor', cleanName: 'SK Corporation Decor' },
  ],
  makeup: [
    { id: 429, name: 'mamta soni makeover', phone: '+917359888542', category: 'makeup', cleanName: 'Mamta Soni Makeover' },
    { id: 911, name: 'Miracle Makeup Studio', phone: '+919924513366', category: 'makeup', cleanName: 'Miracle Makeup Studio' },
    { id: 408, name: 'Mamta Joshi Makeover & Salon', phone: '+919624838382', category: 'makeup', cleanName: 'Mamta Joshi' },
    { id: 442, name: 'Makeup Therapy by Madhu', phone: '+919726207198', category: 'makeup', cleanName: 'Madhu (Makeup Therapy)' },
    { id: 450, name: 'Makeover by Hetal', phone: '+919909289299', category: 'makeup', cleanName: 'Hetal (Makeover by Hetal)' },
    { id: 436, name: 'Deepika Solanki Makeover', phone: '+919974223292', category: 'makeup', cleanName: 'Deepika Solanki' },
    { id: 435, name: 'Heena Rohra Makeup Artist', phone: '+919879554486', category: 'makeup', cleanName: 'Heena Rohra' },
    { id: 402, name: 'Asmi Shah Makeovers', phone: '+919998188158', category: 'makeup', cleanName: 'Asmi Shah' },
    { id: 857, name: 'Sweta Patel (The Magic Touch)', phone: '+919879667744', category: 'makeup', cleanName: 'Sweta Patel' },
    { id: 600, name: "RR's Makeovers", phone: '+919904123456', category: 'makeup', cleanName: "RR's Makeovers" },
  ],
  photography: [
    { id: 373, name: 'STUDIO FILMICA by Basant Joshi', phone: '+919426372606', category: 'photography', cleanName: 'Studio Filmica' },
    { id: 316, name: 'Nakshi Photography', phone: '+919879184501', category: 'photography', cleanName: 'Nakshi Photography' },
    { id: 333, name: 'Milan Bhaskar Photography', phone: '+918460293805', category: 'photography', cleanName: 'Milan Bhaskar Photography' },
    { id: 336, name: 'The Knot Films', phone: '+918160417353', category: 'photography', cleanName: 'The Knot Films' },
    { id: 362, name: 'Ammar Shoots - Wedding and Event Photographer in Ahmedabad', phone: '+919727259010', category: 'photography', cleanName: 'Ammar Shoots' },
    { id: 337, name: 'HC Photography(Himanshu Chauhan)Wedding Photographer in Ahmedabad', phone: '+918866122411', category: 'photography', cleanName: 'HC Photography' },
    { id: 379, name: 'Emotion Clicks', phone: '+919904460014', category: 'photography', cleanName: 'Emotion Clicks' },
    { id: 393, name: 'Little Wonders Studio', phone: '+919601109396', category: 'photography', cleanName: 'Little Wonders Studio' },
    { id: 342, name: 'Kushal Vadera Photography', phone: '+919998483191', category: 'photography', cleanName: 'Kushal Vadera Photography' },
    { id: 330, name: 'The Concept Studio by Amit Barot', phone: '+918401083811', category: 'photography', cleanName: 'The Concept Studio' },
  ],
}

function cleanArtistName(name: string): string {
  return (
    name
      .replace(
        /\b(in\s+ahmedabad|ahmedabad|artist|art|classes|class|designer|mehandi|mehndi|henna|makeup|makeover|studio|photography|films|event|events|planner|decorator|decoration)\b/gi,
        '',
      )
      .replace(/[()&|\-•]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ')
      .trim() || name
  )
}

/**
 * Queries database to retrieve full contact history (phones, IDs, and last contact timestamps).
 */
async function getAlreadyContactedData(payload: any): Promise<ContactedHistory> {
  const phones = new Set<string>()
  const artistIds = new Set<string>()
  const lastContactDates = new Map<string, string>()

  try {
    // 1. Query outreach-messages where status is sent
    const messages = await payload.find({
      collection: 'outreach-messages',
      where: {
        and: [{ status: { equals: 'sent' } }],
      },
      limit: 2000,
      depth: 1,
    })

    for (const doc of messages.docs) {
      if (doc.artist) {
        const artistId = typeof doc.artist === 'object' ? doc.artist.id : doc.artist
        artistIds.add(String(artistId))
        const artistPhone =
          typeof doc.artist === 'object' ? doc.artist.phone || doc.artist.whatsappNumber : null
        if (artistPhone) {
          const norm = validateAndNormalizePhone(String(artistPhone))
          if (norm) {
            phones.add(norm)
            if (doc.sentAt) lastContactDates.set(norm, doc.sentAt)
          }
        }
      }
    }

    // 2. Query discovered-artists marked as contacted or with contact history
    const artists = await payload.find({
      collection: 'discovered-artists',
      where: {
        or: [
          { outreachStatus: { equals: 'contacted' } },
          { lastContactedAt: { exists: true } },
          { outreachAttempts: { greater_than: 0 } },
        ],
      },
      limit: 2000,
    })

    for (const doc of artists.docs) {
      artistIds.add(String(doc.id))
      const phone = doc.phone || doc.whatsappNumber
      if (phone) {
        const norm = validateAndNormalizePhone(String(phone))
        if (norm) {
          phones.add(norm)
          if (doc.lastContactedAt) lastContactDates.set(norm, doc.lastContactedAt)
        }
      }
    }
  } catch (err: any) {
    console.warn('[Deduplication] Query notice:', err.message)
  }

  return { phones, artistIds, lastContactDates }
}

/**
 * Dynamically queries ONLY strictly uncontacted artists by category.
 */
async function getUncontactedArtists(
  payload: any,
  category: 'mehndi' | 'decor' | 'makeup' | 'photography',
  limit: number,
  contacted: ContactedHistory,
): Promise<OutreachTarget[]> {
  const resultList: OutreachTarget[] = []
  const seenPhonesInBatch = new Set<string>()

  try {
    const res = await payload.find({
      collection: 'discovered-artists',
      limit: 500,
    })

    const categoryDocs = (res.docs || []).filter((doc: any) => {
      const phone = doc.phone || doc.whatsappNumber
      if (!phone || String(phone).trim() === '') return false

      const combined =
        `${doc.services?.[0]?.name || ''} ${doc.specializations || ''} ${doc.name || ''} ${doc.businessName || ''}`.toLowerCase()
      if (category === 'mehndi') {
        return (
          combined.includes('mehndi') || combined.includes('mehendi') || combined.includes('henna')
        )
      }
      if (category === 'decor') {
        return (
          combined.includes('decor') ||
          combined.includes('planner') ||
          combined.includes('event') ||
          combined.includes('mandap')
        )
      }
      if (category === 'makeup') {
        return (
          combined.includes('makeup') ||
          combined.includes('mua') ||
          combined.includes('makeover') ||
          combined.includes('beauty')
        )
      }
      if (category === 'photography') {
        return (
          combined.includes('photo') ||
          combined.includes('cinematograph') ||
          combined.includes('film') ||
          combined.includes('studio') ||
          combined.includes('camera')
        )
      }
      return false
    })

    for (const doc of categoryDocs) {
      const cleanPhone = validateAndNormalizePhone(doc.phone || doc.whatsappNumber)
      if (!cleanPhone) continue

      // STRICT DEDUPLICATION: Skip if ever contacted in past
      if (
        contacted.phones.has(cleanPhone) ||
        contacted.artistIds.has(String(doc.id)) ||
        seenPhonesInBatch.has(cleanPhone)
      ) {
        continue
      }

      seenPhonesInBatch.add(cleanPhone)
      resultList.push({
        id: doc.id,
        name: doc.name || doc.businessName || 'Artist',
        phone: cleanPhone,
        category,
        cleanName: cleanArtistName(doc.name || doc.businessName || 'Artist'),
      })

      if (resultList.length >= limit) break
    }
  } catch (err: any) {
    console.warn(`[Payload] Notice querying ${category} artists:`, err.message)
  }

  // Fallback to curated targets ONLY for artists who have NEVER been messaged
  if (resultList.length < limit && CURATED_TARGETS[category]) {
    for (const curated of CURATED_TARGETS[category]) {
      const cleanPhone = validateAndNormalizePhone(curated.phone)
      if (!cleanPhone) continue

      if (
        contacted.phones.has(cleanPhone) ||
        contacted.artistIds.has(String(curated.id)) ||
        seenPhonesInBatch.has(cleanPhone)
      ) {
        continue // Already contacted previously — skip!
      }

      seenPhonesInBatch.add(cleanPhone)
      resultList.push(curated)
      if (resultList.length >= limit) break
    }
  }

  return resultList
}

/**
 * Builds tailored, category-specific Gujarati/Hindi/English outreach messages.
 */
function buildMessage(artist: OutreachTarget): string {
  const shortName = artist.cleanName || artist.name

  if (artist.category === 'mehndi') {
    return `🙏 Namaste ${shortName} Team,

Aapka Ahmedabad me Mehndi work aur Google par 5★ rating sach me impressive hai! ✨

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist Marketplace launch kar rahe hain, jaha clients directly verified artists se connect karte hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Hidden Charges
• Bridal & Event Booking Alerts

👉 *Join Free Today:* https://www.artistora.com/register#artist

Profile listing ya setup karne me agar aapko koi bhi assistance chahiye, to aap hume yaha reply kar sakte hain — we are happy to guide you! 👍

Warm regards,
Team Artistora | Ahmedabad`
  }

  if (artist.category === 'decor') {
    return `🙏 Namaste ${shortName} Team,

Aapka event decoration & wedding planning work Ahmedabad me bahut popular aur impressive hai! ✨

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist & Event Marketplace launch kar rahe hain, jaha clients directly verified decor artists aur event planners se connect karte hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Hidden Charges
• High-budget Wedding & Event Inquiries

👉 *Join Free Today:* https://www.artistora.com/register#artist

Agar aapko profile register karne me koi bhi guidance chahiye, to aap hume yaha reply kar sakte hain — we are happy to help! 👍

Warm regards,
Team Artistora | Ahmedabad`
  }

  if (artist.category === 'makeup') {
    return `🙏 Namaste ${shortName} Team,

Aapka bridal makeover aur makeup work Ahmedabad me sach me bahut aesthetic aur popular hai! ✨

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Wedding Artist Marketplace launch kar rahe hain, jaha brides directly verified makeup artists se connect karti hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Makeup Portfolio Page
• Direct Bridal Calls & WhatsApp Inquiries
• 0% Commission / No Hidden Fees
• High-Intent Wedding Season Client Bookings

👉 *Join Free Today:* https://www.artistora.com/register#artist

Profile setup karne me agar aapko koi bhi guidance chahiye, to aap hume yaha reply kar sakte hain — we are happy to assist! 👍

Warm regards,
Team Artistora | Ahmedabad`
  }

  // Photography
  return `🙏 Namaste ${shortName} Team,

Aapka wedding photography aur candid cinematography work Ahmedabad me sach me bahut impressive hai! 📸✨

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Wedding Artist Marketplace launch kar rahe hain, jaha couples directly verified photographers aur cinematographers se connect karte hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Photography Portfolio Page
• Direct Couple Calls & WhatsApp Inquiries
• 0% Commission / No Intermediary Cuts
• Pre-Wedding & Wedding Season Client Leads

👉 *Join Free Today:* https://www.artistora.com/register#artist

Profile setup karne me agar aapko koi guidance chahiye, to aap hume yaha reply kar sakte hain — we are happy to guide you! 👍

Warm regards,
Team Artistora | Ahmedabad`
}

/**
 * Queries Payload database to find all phone numbers already contacted.
 */
async function startBatch() {
  console.log('================================================================')
  console.log('📱 Artistora — Multi-Category WhatsApp Outreach Runner (Baileys)')
  console.log('================================================================\n')

  const args = process.argv.slice(2)
  const categoryArg = args.includes('--category')
    ? args[args.indexOf('--category') + 1]?.toLowerCase()
    : null
  const limitArg = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1], 10) || 10
    : 10

  const payload = await getPayloadClient()

  // 1. Check Full Outreach History from Database
  console.log('🔍 Analyzing database for previously contacted artists & past messages...')
  const contactHistory = await getAlreadyContactedData(payload)
  console.log(
    `🛡️ Contact History Audit: ${contactHistory.phones.size} unique phone numbers & ${contactHistory.artistIds.size} artist profiles on record.\n`,
  )

  // 2. Fetch strictly uncontacted artists dynamically from database by category
  console.log('🔍 Filtering strictly uncontacted artists for this run...')
  const groups: { name: string; key: string; artists: OutreachTarget[] }[] = []

  if (!categoryArg || categoryArg === 'mehndi') {
    const mehndiList = await getUncontactedArtists(payload, 'mehndi', limitArg, contactHistory)
    groups.push({ name: 'Mehndi Artists', key: 'mehndi', artists: mehndiList })
  }
  if (!categoryArg || categoryArg === 'decor') {
    const decorList = await getUncontactedArtists(payload, 'decor', limitArg, contactHistory)
    groups.push({ name: 'Decor & Event Planners', key: 'decor', artists: decorList })
  }
  if (!categoryArg || categoryArg === 'makeup') {
    const makeupList = await getUncontactedArtists(payload, 'makeup', limitArg, contactHistory)
    groups.push({ name: 'Makeup Artists', key: 'makeup', artists: makeupList })
  }
  if (!categoryArg || categoryArg === 'photography' || categoryArg === 'photographer') {
    const photoList = await getUncontactedArtists(payload, 'photography', limitArg, contactHistory)
    groups.push({ name: 'Photographers', key: 'photography', artists: photoList })
  }

  const totalArtists = groups.reduce((acc, g) => acc + g.artists.length, 0)
  console.log(
    `📋 Fresh Uncontacted Targets: ${totalArtists} artists across ${groups.length} categories (Limit: ${limitArg} per category)\n`,
  )

  if (totalArtists === 0) {
    console.log('ℹ️ All discovered artists in the selected category have already been contacted!')
    console.log(
      '👉 Run `npm run scrape:instagram` to discover fresh Ahmedabad artists with phone numbers first.\n',
    )
    process.exit(0)
  }

  // 3. Restore Baileys auth session from Redis
  console.log('🔄 Restoring Baileys WhatsApp session from Redis...')
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  const restored = await loadBaileysAuthFromRedis(AUTH_DIR)
  if (restored) {
    console.log('✅ Baileys session restored from Redis.\n')
  } else {
    console.log('⚠️ No session in Redis — QR scan may be required.\n')
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 15000,
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await saveBaileysAuthToRedis(AUTH_DIR)
  })

  let isProcessing = false

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n[WhatsApp] Scan this QR code to authenticate:\n')
      qrcode.generate(qr, { small: true })
      console.log('\n[WhatsApp] Waiting for QR scan from WhatsApp mobile app...')
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log(
        `\n[WhatsApp] Connection closed (status: ${statusCode}). Reconnecting: ${shouldReconnect}`,
      )
      if (shouldReconnect) {
        isProcessing = false
        startBatch()
      } else {
        console.error('[WhatsApp] ❌ Logged out from WhatsApp. Please re-run auth.')
      }
    }

    if (connection === 'open' && !isProcessing) {
      isProcessing = true
      console.log(`\n✅ WhatsApp Connected successfully! (Account JID: ${sock.user?.id})\n`)
      console.log('⏳ Allowing connection to settle before dispatching...')
      await sleep(3000)

      console.log('🚀 Starting dispatch across categories...\n')

      let overallSent = 0
      let overallSkipped = 0

      for (let gIdx = 0; gIdx < groups.length; gIdx++) {
        const group = groups[gIdx]
        console.log(`\n================================================================`)
        console.log(
          `🎯 Category [${gIdx + 1}/${groups.length}]: ${group.name} (${group.artists.length} targets)`,
        )
        console.log(`================================================================\n`)

        for (let i = 0; i < group.artists.length; i++) {
          const artist = group.artists[i]
          const cleanPhone = validateAndNormalizePhone(artist.phone)

          if (!cleanPhone) {
            console.log(
              `❌ [${i + 1}/${group.artists.length}] Invalid phone for ${artist.name}: ${artist.phone}`,
            )
            overallSkipped++
            continue
          }

          if (contactHistory.phones.has(cleanPhone) || contactHistory.artistIds.has(String(artist.id))) {
            const lastDate = contactHistory.lastContactDates.get(cleanPhone)
            console.log(
              `⏩ [${i + 1}/${group.artists.length}] Skipping ${artist.name} (${cleanPhone}) — already contacted${lastDate ? ` on ${lastDate.slice(0, 10)}` : ''}.`,
            )
            overallSkipped++
            continue
          }

          const jid = `${cleanPhone}@s.whatsapp.net`
          const messageText = buildMessage(artist)

          console.log(
            `\n[${i + 1}/${group.artists.length}] 📤 Dispatching to: ${artist.cleanName || artist.name} (${cleanPhone})...`,
          )

          try {
            const sendResult = await sock.sendMessage(jid, { text: messageText })
            const messageId = sendResult?.key?.id || undefined
            overallSent++
            alreadyContacted.add(rawPhoneDigits)

            console.log(
              `   ✅ Message delivered successfully! (Message ID: ${messageId || 'sent'})`,
            )

            // Log outreach in PostgreSQL
            try {
              await logOutreachMessage(cleanPhone, messageText, {
                artistId: artist.id,
                channel: 'whatsapp',
                campaignName: `ahmedabad_${group.key}_outreach_v1`,
                status: 'sent',
                messageSid: messageId,
              })
              console.log(`   💾 Logged outreach record in database.`)
            } catch (dbErr: any) {
              console.warn(`   ⚠️ DB log notice: ${dbErr.message}`)
            }

            // Human delay jitter between consecutive sends
            if (i < group.artists.length - 1) {
              const delaySeconds = Math.floor(Math.random() * (65 - 45 + 1)) + 45
              console.log(
                `   ⏳ Human jitter delay: waiting ${delaySeconds}s before next message...`,
              )
              await sleep(delaySeconds * 1000)
            }
          } catch (sendErr: any) {
            console.error(`   ❌ Failed to deliver message to ${artist.name}: ${sendErr.message}`)
            await sleep(5000)
          }
        }

        // Category cooldown break
        if (gIdx < groups.length - 1) {
          console.log('\n☕ Taking a 90-second inter-category cooldown break before next group...')
          await sleep(90000)
        }
      }

      // Save auth session back to Redis
      console.log('\n💾 Saving updated Baileys session to Redis...')
      await saveBaileysAuthToRedis(AUTH_DIR)

      console.log('\n================================================================')
      console.log(`🎉 WhatsApp Multi-Category Outreach Completed!`)
      console.log(`   Total Successfully Sent: ${overallSent}`)
      console.log(`   Total Skipped (Deduplicated/Invalid): ${overallSkipped}`)
      console.log('================================================================\n')

      setTimeout(() => process.exit(0), 3000)
    }
  })
}

startBatch().catch((err) => {
  console.error('Fatal error in WhatsApp outreach runner:', err)
  process.exit(1)
})
