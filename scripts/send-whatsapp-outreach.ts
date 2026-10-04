/**
 * Multi-Category Automated WhatsApp Outreach Runner (Baileys + Redis).
 * Dispatches personalized WhatsApp outreach messages to 10 Mehndi Artists, 10 Decorators & Planners,
 * and 10 Makeup Artists (total 30 artists) in Ahmedabad with Redis session persistence.
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
  Browsers,
  makeCacheableSignalKeyStore,
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
const logger = pino({ level: 'silent' })

// Silence noisy low-level libsignal ratchet/session dumps to keep terminal clean
const isLibsignalNoise = (str: string) =>
  str.includes('Closing session') ||
  str.includes('Decrypted message with closed session') ||
  str.includes('Closing open session') ||
  str.includes('SessionEntry') ||
  str.includes('Bad MAC') ||
  str.includes('Session error:') ||
  str.includes('_chains:') ||
  str.includes('registrationId:') ||
  str.includes('currentRatchet:') ||
  str.includes('Failed to decrypt message with any known session')

const originalConsoleLog = console.log
const originalConsoleInfo = console.info
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

console.log = (...args: any[]) => {
  const firstArg = typeof args[0] === 'string' ? args[0] : ''
  if (isLibsignalNoise(firstArg)) return
  originalConsoleLog.apply(console, args)
}

console.info = (...args: any[]) => {
  const firstArg = typeof args[0] === 'string' ? args[0] : ''
  if (isLibsignalNoise(firstArg)) return
  originalConsoleInfo.apply(console, args)
}

console.warn = (...args: any[]) => {
  const firstArg = typeof args[0] === 'string' ? args[0] : ''
  if (isLibsignalNoise(firstArg)) return
  originalConsoleWarn.apply(console, args)
}

console.error = (...args: any[]) => {
  const firstArg = typeof args[0] === 'string' ? args[0] : ''
  if (isLibsignalNoise(firstArg)) return
  originalConsoleError.apply(console, args)
}

interface OutreachTarget {
  id: number | string
  name: string
  phone: string
  category: 'mehndi' | 'decor' | 'makeup' | 'nail' | 'nail-artists'
  cleanName?: string
}

interface ContactedHistory {
  phones: Set<string>
  artistIds: Set<string>
  lastContactDates: Map<string, string>
}

// Curated verified lists of Ahmedabad artists per category
const CURATED_TARGETS: Record<'mehndi' | 'decor' | 'makeup' | 'nail', OutreachTarget[]> = {
  nail: [
    {
      id: 1082,
      name: 'kalindi beauty studio(salon)& nails academy',
      phone: '+918200051770',
      category: 'nail',
      cleanName: 'Kalindi Beauty & Nails',
    },
    {
      id: 1083,
      name: 'Salonishrivastava_makeup_nails',
      phone: '+917874028552',
      category: 'nail',
      cleanName: 'Salonishrivastava Nails',
    },
    {
      id: 1084,
      name: 'MAHENDI & NAILS BY RIYA',
      phone: '+919265397895',
      category: 'nail',
      cleanName: 'Riya Nails & Mehndi',
    },
    {
      id: 1085,
      name: 'Vaishali Nail and mehndi classes',
      phone: '+918780853194',
      category: 'nail',
      cleanName: 'Vaishali Nail Art',
    },
    {
      id: 1086,
      name: 'Anita_Mehndi_&_Nail_ classes',
      phone: '+919725730602',
      category: 'nail',
      cleanName: 'Anita Nail Art Studio',
    },
    {
      id: 1087,
      name: 'Komal Mehandi And Nail Art',
      phone: '+918866764694',
      category: 'nail',
      cleanName: 'Komal Nail Art',
    },
    {
      id: 1088,
      name: 'Mehndi & Nails by Pooja',
      phone: '+918799034634',
      category: 'nail',
      cleanName: 'Pooja Nail Art',
    },
    {
      id: 1089,
      name: 'Disha Mehndi & nails studio & Academy',
      phone: '+919824130928',
      category: 'nail',
      cleanName: 'Disha Nails Studio',
    },
    {
      id: 1090,
      name: 'Swati’s Mehndi & Nails',
      phone: '+919978551255',
      category: 'nail',
      cleanName: 'Swati Nails Studio',
    },
    {
      id: 1091,
      name: 'AR Nail Studio & Academy',
      phone: '+919773416612',
      category: 'nail',
      cleanName: 'AR Nail Studio',
    },
  ],
  mehndi: [
    {
      id: 331,
      name: 'Dipuh mehndi artist',
      phone: '+918980306183',
      category: 'mehndi',
      cleanName: 'Dipuh Mehndi Artist',
    },
    {
      id: 266,
      name: 'Mehndi By Monali',
      phone: '+918849402240',
      category: 'mehndi',
      cleanName: 'Mehndi By Monali',
    },
    {
      id: 329,
      name: "Nidhi's Creative Mehndi & Nails",
      phone: '+918849528228',
      category: 'mehndi',
      cleanName: "Nidhi's Creative Mehndi",
    },
    {
      id: 350,
      name: 'Honey Mehndi Art',
      phone: '+919898218996',
      category: 'mehndi',
      cleanName: 'Honey Mehndi Art',
    },
    {
      id: 297,
      name: 'Mehndikka by Ushma',
      phone: '+919724207812',
      category: 'mehndi',
      cleanName: 'Mehndikka by Ushma',
    },
    {
      id: 309,
      name: 'Ahmedabad Mehndi Designer',
      phone: '+917801818943',
      category: 'mehndi',
      cleanName: 'Ahmedabad Mehndi Designer',
    },
    {
      id: 307,
      name: 'Dhvani Mehndi art',
      phone: '+919510556227',
      category: 'mehndi',
      cleanName: 'Dhvani Mehndi Art',
    },
    {
      id: 289,
      name: 'Prachi Mehndi and Nail Art in Ahmedabad',
      phone: '+919033965485',
      category: 'mehndi',
      cleanName: 'Prachi Mehndi Art',
    },
    {
      id: 306,
      name: 'VIRHANT MEHNDI ART & CLASSES',
      phone: '+919054461672',
      category: 'mehndi',
      cleanName: 'Virhant Mehndi Art',
    },
    {
      id: 282,
      name: 'JALPA SHAH MEHANDI Art',
      phone: '+919574506318',
      category: 'mehndi',
      cleanName: 'Jalpa Shah Mehndi Art',
    },
  ],
  decor: [
    {
      id: 945,
      name: 'Shree Krishna Events Planner',
      phone: '+917874111551',
      category: 'decor',
      cleanName: 'Shree Krishna Events',
    },
    {
      id: 521,
      name: 'Ganesh Decoration & Events',
      phone: '+919033517592',
      category: 'decor',
      cleanName: 'Ganesh Decoration & Events',
    },
    {
      id: 505,
      name: 'Pacific Events - Event Planner in Ahmedabad',
      phone: '+918487989345',
      category: 'decor',
      cleanName: 'Pacific Events',
    },
    {
      id: 466,
      name: 'Sanskruti Events - Sound/Lights/Decoration',
      phone: '+919824501931',
      category: 'decor',
      cleanName: 'Sanskruti Events',
    },
    {
      id: 495,
      name: 'Dreamy Creation Events',
      phone: '+917575888678',
      category: 'decor',
      cleanName: 'Dreamy Creation Events',
    },
    {
      id: 469,
      name: 'Ganesh Event, Decorater & Wedding Planner',
      phone: '+917990332880',
      category: 'decor',
      cleanName: 'Ganesh Event & Decorater',
    },
    {
      id: 480,
      name: 'Rhythm Events & Decor',
      phone: '+919099059950',
      category: 'decor',
      cleanName: 'Rhythm Events & Decor',
    },
    {
      id: 486,
      name: 'Dream Decoration & Event',
      phone: '+919624449366',
      category: 'decor',
      cleanName: 'Dream Decoration & Event',
    },
    {
      id: 492,
      name: 'Leo Decor& Event planner',
      phone: '+919879019054',
      category: 'decor',
      cleanName: 'Leo Decor & Events',
    },
    {
      id: 472,
      name: 'SK Corporation | Wedding Decorator in Ahmedabad',
      phone: '+919879000277',
      category: 'decor',
      cleanName: 'SK Corporation Decor',
    },
  ],
  makeup: [
    {
      id: 429,
      name: 'mamta soni makeover',
      phone: '+917359888542',
      category: 'makeup',
      cleanName: 'Mamta Soni Makeover',
    },
    {
      id: 911,
      name: 'Miracle Makeup Studio',
      phone: '+919924513366',
      category: 'makeup',
      cleanName: 'Miracle Makeup Studio',
    },
    {
      id: 408,
      name: 'Mamta Joshi Makeover & Salon',
      phone: '+919624838382',
      category: 'makeup',
      cleanName: 'Mamta Joshi',
    },
    {
      id: 442,
      name: 'Makeup Therapy by Madhu',
      phone: '+919726207198',
      category: 'makeup',
      cleanName: 'Madhu (Makeup Therapy)',
    },
    {
      id: 450,
      name: 'Makeover by Hetal',
      phone: '+919909289299',
      category: 'makeup',
      cleanName: 'Hetal (Makeover by Hetal)',
    },
    {
      id: 436,
      name: 'Deepika Solanki Makeover',
      phone: '+919974223292',
      category: 'makeup',
      cleanName: 'Deepika Solanki',
    },
    {
      id: 435,
      name: 'Heena Rohra Makeup Artist',
      phone: '+919879554486',
      category: 'makeup',
      cleanName: 'Heena Rohra',
    },
    {
      id: 402,
      name: 'Asmi Shah Makeovers',
      phone: '+919998188158',
      category: 'makeup',
      cleanName: 'Asmi Shah',
    },
    {
      id: 857,
      name: 'Sweta Patel (The Magic Touch)',
      phone: '+919879667744',
      category: 'makeup',
      cleanName: 'Sweta Patel',
    },
    {
      id: 600,
      name: "RR's Makeovers",
      phone: '+919904123456',
      category: 'makeup',
      cleanName: "RR's Makeovers",
    },
  ],
}

function cleanArtistName(name: string): string {
  return (
    name
      .replace(
        /\b(in\s+ahmedabad|ahmedabad|artist|art|classes|class|designer|mehandi|mehndi|henna|makeup|makeover|studio|event|events|planner|decorator|decoration)\b/gi,
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
  category: 'mehndi' | 'decor' | 'makeup' | 'nail',
  limit: number,
  contacted: ContactedHistory,
): Promise<OutreachTarget[]> {
  const resultList: OutreachTarget[] = []
  const seenPhonesInBatch = new Set<string>()

  try {
    const res = await payload.find({
      collection: 'discovered-artists',
      limit: 2000,
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
      if (category === 'nail') {
        return combined.includes('nail')
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

// WhatsApp Safety Limits & Anti-Ban Protections
const DAILY_WHATSAPP_CAP = 15 // Meta safe threshold for cold outbound messages per 24h
const JITTER_MIN_SECONDS = 90 // Min 1.5 minutes between consecutive messages
const JITTER_MAX_SECONDS = 160 // Max 2.5+ minutes between consecutive messages
const MICRO_BATCH_SIZE = 3 // Take a 3-minute pause every 3 messages
const MICRO_BATCH_PAUSE_MS = 180000 // 3-minute micro-break

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Checks how many WhatsApp messages have been sent in the last 24 hours.
 */
async function getWhatsAppSentCountLast24Hours(payload: any): Promise<number> {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recent = await payload.find({
      collection: 'outreach-messages',
      where: {
        and: [
          { channel: { equals: 'whatsapp' } },
          { status: { equals: 'sent' } },
          { sentAt: { greater_than_equal: yesterday } },
        ],
      },
      limit: 200,
    })
    return recent.docs.length
  } catch {
    return 0
  }
}

/**
 * WhatsApp Dynamic Spintax Engine (1,600+ unique message variations).
 * Generates unique, natural, conversational messages for every single artist.
 * Uses category-specific phrasing, short conversational pitch, opt-out note, and NO raw links.
 */
function buildMessage(artist: OutreachTarget): string {
  const shortName = artist.cleanName || cleanArtistName(artist.name)

  const cat = artist.category
  const isMehndi = cat === 'mehndi'
  const isNail = cat === 'nail' || cat === 'nail-artists'
  const isMakeup = cat === 'makeup'
  const isDecor = cat === 'decor'

  const greetings = [
    `🙏 Namaste ${shortName} ji,`,
    `🙏 Namaste ${shortName} Team,`,
    `Hello ${shortName} ji,`,
    `Kem cho ${shortName} Team! 🙏`,
    `Hi ${shortName},`,
  ]

  let compliments: string[] = []
  let serviceLabel = ''

  if (isMehndi) {
    serviceLabel = 'Mehndi Art'
    compliments = [
      `Aapka Ahmedabad me bridal mehndi design work sach me bahut sundar aur impressive hai! ✨`,
      `Aapka bridal mehndi & henna artwork Ahmedabad me kafi popular aur aesthetic hai! 🌿`,
      `Aapke Ahmedabad wedding mehndi designs hume bahut unique aur detailed lage! ✨`,
      `Aapka intricate mehndi portfolio aur client reviews Ahmedabad me bahut badhiya hain! 👍`,
    ]
  } else if (isNail) {
    serviceLabel = 'Nail Art & Extensions'
    compliments = [
      `Aapka bridal nail art, extensions aur creative nail styling Ahmedabad me sach me bahut aesthetic aur clean hai! 💅✨`,
      `Aapka nail studio work aur bridal nail extension portfolio Ahmedabad me kafi stylish aur trendy hai! 💅`,
      `Aapke bridal nail designs aur gel art finishes sach me bahut professional aur elegant hain! ✨`,
      `Aapka nail artistry work Ahmedabad me bahut creative aur graceful hai! 👍`,
    ]
  } else if (isMakeup) {
    serviceLabel = 'Bridal Makeup & Makeover'
    compliments = [
      `Aapka bridal makeover aur makeup styling Ahmedabad me sach me bahut aesthetic hai! ✨`,
      `Aapke bridal makeup looks aur styling work Ahmedabad weddings me kafi popular hain! 💄`,
      `Aapka bridal makeover portfolio aur glam finishes sach me bahut professional hain! ✨`,
      `Aapka makeup artistry work Ahmedabad me bahut popular aur graceful hai! 👍`,
    ]
  } else {
    serviceLabel = 'Event & Wedding Decor'
    compliments = [
      `Aapka wedding decor & mandap setup work Ahmedabad me sach me bahut grand aur aesthetic hai! ✨`,
      `Aapke stage decor aur wedding theme concepts Ahmedabad venues par bahut impressive hain! 🎪`,
      `Aapka event decoration and planning portfolio Ahmedabad me kafi popular hai! ✨`,
    ]
  }

  const intros = [
    `Hum *Artistora* (artistora.com) se hain — Ahmedabad ka exclusive marketplace jaha clients directly verified ${serviceLabel} artists se connect karte hain.`,
    `Hum *Artistora* — Ahmedabad-focused platform build kar rahe hain jo upcoming wedding season ke liye brides aur families ko direct verified artists se connect karta hai.`,
    `Hum *Artistora* launch kar rahe hain — Ahmedabad ka dedicated artist platform jaha aapko direct client booking inquiries milti hain with 0% commission.`,
  ]

  const valueProps = [
    `Aapke liye hum ek *Free Dedicated Profile & Portfolio Page* provide kar rahe hain, jisme direct client calls & WhatsApp bookings aati hain bina kisi commission ya middleman ke.`,
    `Upcoming wedding season ke liye hum verified local artists ko onboard kar rahe hain jisme 100% direct client contact aur zero commission rehta hai.`,
    `Aap apna verified profile listing claim kar sakte hain jisse aapko Ahmedabad ke high-intent client leads directly WhatsApp par milenge (0% fees).`,
  ]

  const callsToAction = [
    `Kya hum aapki free profile activate karein? Agar haan, to bas yaha *'YES'* reply karein — hamari team aapki profile setup kar degi! 👍`,
    `Agar aap apna free artist profile list karna chahte hain, to bas yaha *'YES'* reply karein — we will guide you! 👍`,
    `Kya aap upcoming wedding season ke direct bookings ke liye interested hain? Yaha reply karein to hum details share karte hain! 👍`,
  ]

  const signoffs = [
    `Warm regards,\nTeam Artistora | Ahmedabad\n_(Agar interested nahi hain to 'STOP' reply karein)_`,
    `Best regards,\nTeam Artistora • Ahmedabad\n_(Not interested? Reply 'STOP' to opt out)_`,
    `Dhanyawad,\nTeam Artistora | Ahmedabad\n_(Aage message na chahiye to 'STOP' likhein)_`,
  ]

  const greeting = pickRandom(greetings)
  const compliment = pickRandom(compliments)
  const intro = pickRandom(intros)
  const valueProp = pickRandom(valueProps)
  const cta = pickRandom(callsToAction)
  const signoff = pickRandom(signoffs)

  return `${greeting}\n\n${compliment}\n\n${intro}\n\n${valueProp}\n\n👉 ${cta}\n\n${signoff}`
}

/**
 * Emulates human presence, online state, and realistic typing behavior before message dispatch.
 */
async function sendHumanWhatsAppMessage(
  sock: any,
  jid: string,
  text: string,
): Promise<{ key?: { id?: string } }> {
  // 1. Mark presence as 'available'
  try {
    await sock.sendPresenceUpdate('available')
    await sleep(1500)
  } catch {}

  // 2. Mark presence as 'composing' (typing indicator)
  try {
    await sock.sendPresenceUpdate('composing', jid)
  } catch {}

  // 3. Human typing delay based on message length (3.5s to 7.5s)
  const typingSeconds = Math.min(7.5, Math.max(3.5, text.length / 45))
  console.log(`   ✍️ Simulating human typing presence (${typingSeconds.toFixed(1)}s)...`)
  await sleep(typingSeconds * 1000)

  // 4. Pause typing
  try {
    await sock.sendPresenceUpdate('paused', jid)
    await sleep(400)
  } catch {}

  // 5. Send message
  const result = await sock.sendMessage(jid, { text })
  return result
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

  // 1. Safety Check: Verify 24-Hour WhatsApp Rate Limit Quota
  const sentLast24h = await getWhatsAppSentCountLast24Hours(payload)
  console.log(`📊 24-Hour WhatsApp Activity: ${sentLast24h}/${DAILY_WHATSAPP_CAP} sent`)

  if (sentLast24h >= DAILY_WHATSAPP_CAP) {
    console.log(
      `\n🛑 SAFETY PAUSE: Daily WhatsApp limit of ${DAILY_WHATSAPP_CAP} reached in the last 24 hours.`,
    )
    console.log(
      `   To permanently protect your number from WhatsApp spam bans, outreach will resume tomorrow.\n`,
    )
    process.exit(0)
  }

  const safeBatchLimit = Math.min(limitArg, DAILY_WHATSAPP_CAP - sentLast24h)
  console.log(`🎯 Safe batch limit for this run: ${safeBatchLimit} messages (Anti-Ban Threshold)\n`)

  // 2. Check Full Outreach History from Database
  console.log('🔍 Analyzing database for previously contacted artists & past messages...')
  const contactHistory = await getAlreadyContactedData(payload)
  console.log(
    `🛡️ Contact History Audit: ${contactHistory.phones.size} unique phone numbers & ${contactHistory.artistIds.size} artist profiles on record.\n`,
  )

  // 3. Fetch strictly uncontacted artists dynamically from database by category
  console.log('🔍 Filtering strictly uncontacted artists for this run...')
  const groups: { name: string; key: string; artists: OutreachTarget[] }[] = []

  const requestedCategories = categoryArg
    ? categoryArg.split(',').map((c) => c.trim().toLowerCase())
    : []
  const shouldInclude = (cat: string) =>
    requestedCategories.length === 0 || requestedCategories.includes(cat)

  if (shouldInclude('mehndi')) {
    const mehndiList = await getUncontactedArtists(
      payload,
      'mehndi',
      safeBatchLimit,
      contactHistory,
    )
    groups.push({ name: 'Mehndi Artists', key: 'mehndi', artists: mehndiList })
  }
  if (shouldInclude('nail') || shouldInclude('nail-artists') || shouldInclude('nails')) {
    const nailList = await getUncontactedArtists(
      payload,
      'nail',
      safeBatchLimit,
      contactHistory,
    )
    groups.push({ name: 'Nail Artists', key: 'nail', artists: nailList })
  }
  if (shouldInclude('decor')) {
    const decorList = await getUncontactedArtists(payload, 'decor', safeBatchLimit, contactHistory)
    groups.push({ name: 'Decor & Event Planners', key: 'decor', artists: decorList })
  }
  if (shouldInclude('makeup')) {
    const makeupList = await getUncontactedArtists(
      payload,
      'makeup',
      safeBatchLimit,
      contactHistory,
    )
    groups.push({ name: 'Makeup Artists', key: 'makeup', artists: makeupList })
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
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    markOnlineOnConnect: true,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await saveBaileysAuthToRedis(AUTH_DIR)
  })

  let isProcessing = false
  let isConnected = false

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n[WhatsApp] Scan this QR code to authenticate:\n')
      qrcode.generate(qr, { small: true })
      console.log('\n[WhatsApp] Waiting for QR scan from WhatsApp mobile app...')
    }

    if (connection === 'close') {
      isConnected = false
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log(
        `\n[WhatsApp] Connection closed (status: ${statusCode}). Reconnecting: ${shouldReconnect}`,
      )
      if (!shouldReconnect || statusCode === 401) {
        console.error('[WhatsApp] ❌ Logged out from WhatsApp. Clearing expired session...')
        try {
          const { getUnifiedRedis } = await import('../src/outreach/redis-client')
          const redis = getUnifiedRedis()
          await redis.del('whatsapp:baileys:auth:tarball')
          fs.rmSync(AUTH_DIR, { recursive: true, force: true })
        } catch {}
      }
    }

    if (connection === 'open' && !isProcessing) {
      isProcessing = true
      isConnected = true
      console.log(`\n✅ WhatsApp Connected successfully! (Account JID: ${sock.user?.id})\n`)
      console.log('⏳ Allowing connection to settle before dispatching...')
      await sleep(3000)

      console.log('🚀 Starting dispatch across categories...\n')

      let overallSent = 0
      let overallSkipped = 0

      for (let gIdx = 0; gIdx < groups.length; gIdx++) {
        if (!isConnected) {
          console.warn('\n🛑 Disconnected from WhatsApp. Halting batch dispatch.')
          break
        }
        const group = groups[gIdx]
        console.log(`\n================================================================`)
        console.log(
          `🎯 Category [${gIdx + 1}/${groups.length}]: ${group.name} (${group.artists.length} targets)`,
        )
        console.log(`================================================================\n`)

        for (let i = 0; i < group.artists.length; i++) {
          if (!isConnected) {
            console.warn('\n🛑 Disconnected from WhatsApp. Halting batch dispatch.')
            break
          }
          const artist = group.artists[i]
          const cleanPhone = validateAndNormalizePhone(artist.phone)

          if (!cleanPhone) {
            console.log(
              `❌ [${i + 1}/${group.artists.length}] Invalid phone for ${artist.name}: ${artist.phone}`,
            )
            overallSkipped++
            continue
          }

          if (
            contactHistory.phones.has(cleanPhone) ||
            contactHistory.artistIds.has(String(artist.id))
          ) {
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
            const sendResult = await sendHumanWhatsAppMessage(sock, jid, messageText)
            const messageId = sendResult?.key?.id || undefined
            overallSent++
            contactHistory.phones.add(cleanPhone)
            contactHistory.artistIds.add(String(artist.id))

            console.log(
              `   ✅ Message delivered successfully! (Message ID: ${messageId || 'sent'})`,
            )

            // Log outreach in PostgreSQL
            try {
              await logOutreachMessage(cleanPhone, messageText, {
                artistId: artist.id,
                channel: 'whatsapp',
                campaignName: `ahmedabad_${group.key}_outreach_v2`,
                status: 'sent',
                messageSid: messageId,
              })
              console.log(`   💾 Logged outreach record in database.`)
            } catch (dbErr: any) {
              console.warn(`   ⚠️ DB log notice: ${dbErr.message}`)
            }

            // Micro-break every 3 messages (3 minutes) or standard jitter (90s - 160s)
            if (i < group.artists.length - 1) {
              if (overallSent % MICRO_BATCH_SIZE === 0) {
                console.log(
                  `\n☕ [Micro-Break] Pausing for ${(MICRO_BATCH_PAUSE_MS / 60000).toFixed(0)} minutes to maintain natural human pattern...`,
                )
                await sleep(MICRO_BATCH_PAUSE_MS)
              } else {
                const delaySeconds =
                  Math.floor(Math.random() * (JITTER_MAX_SECONDS - JITTER_MIN_SECONDS + 1)) +
                  JITTER_MIN_SECONDS
                console.log(
                  `   ⏳ Human jitter delay: waiting ${delaySeconds}s (${(delaySeconds / 60).toFixed(1)}m) before next message...`,
                )
                await sleep(delaySeconds * 1000)
              }
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
