/**
 * Baileys Batch WhatsApp Outreach Sender — Makeup Artist campaign (batch_makeup_01).
 * Pure Node.js WebSockets client using Baileys with Local Docker Redis auth persistence.
 *
 * Importers/Callers: Executed standalone via CLI by developer/admin (`NODE_OPTIONS="--no-deprecation" node --import tsx scripts/send-makeup-baileys.ts`).
 * Affected APIs: Baileys WebSocket WhatsApp protocol (`@whiskeysockets/baileys`), Redis session auth (`src/outreach/whatsapp/baileys-session.ts`), Payload CMS `logOutreachMessage`.
 * Schemas: `discovered_artists` and `outreach_messages` collections in PostgreSQL.
 * User instruction: "i would like to sent out 20 mackup artist promotion message can you do that and show me message please."
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

// Short name overrides for clean, personalized messaging
const SHORT_NAME_OVERRIDES: Record<number, string> = {
  429: 'Mamta Soni',
  911: 'Miracle Makeup Studio',
  408: 'Mamta Joshi',
  442: 'Madhu (Makeup Therapy)',
  450: 'Hetal (Makeover by Hetal)',
  436: 'Deepika Solanki',
  435: 'Heena Rohra',
  402: 'Asmi Shah',
  857: 'Sweta Patel (The Magic Touch)',
  600: "RR's Makeovers",
  411: 'Zaini Beauty Salon',
  423: 'Bhoomi Patel',
  425: 'Diksha Duggal',
  531: 'Girija Beauty Care',
  430: 'Ms Teli Studio',
  601: 'Komal Rajput',
  602: 'Himani Shah',
  861: 'Harshida Chaudhari',
  608: 'Dhara Beauty Salon',
  860: 'Honey Shah',
}

const artists = [
  { id: 429, name: 'mamta soni makeover', phone: '+917359888542' },
  { id: 911, name: 'Miracle Makeup Studio & Beauty Care', phone: '+919033772506' },
  {
    id: 408,
    name: 'Mamta Joshi Makeover - Bridal Make-up/Hairstyle Artist',
    phone: '+919974124473',
  },
  { id: 442, name: 'Makeup Therapy by Madhu', phone: '+919999278874' },
  { id: 450, name: 'Makeover by Hetal | Makeup Artist in Vasna', phone: '+919427959302' },
  { id: 436, name: 'Deepika Solanki Makeup Studio & Academy', phone: '+919265032319' },
  { id: 435, name: 'Makeup By Heena Rohra | Bridal Makeup Artist', phone: '+919638802386' },
  { id: 402, name: 'Asmi Shah Makeup Studio', phone: '+919898667420' },
  { id: 857, name: 'The magic touch by sweta patel makeup artist', phone: '+919510608435' },
  { id: 600, name: "RR's Makeovers Salon", phone: '+919213418686' },
  { id: 411, name: 'Zaini Beauty Salon', phone: '+919825785635' },
  { id: 423, name: 'Bhoomi Patel Makeup Studio & Academy', phone: '+917383214481' },
  { id: 425, name: 'Diksha Duggal Makeovers - Makeup | Salon | Academy', phone: '+919978196525' },
  { id: 531, name: 'Girija Beauty Care', phone: '+918347292989' },
  { id: 430, name: 'Ms Teli - Makeup & Hair Studio', phone: '+919712998225' },
  { id: 601, name: 'Komal Rajput makeup, makeover', phone: '+917046314770' },
  { id: 602, name: 'Makeup by Himani Shah', phone: '+917624018992' },
  { id: 861, name: 'Harshida Chaudhari Makeup Artist', phone: '+918488838120' },
  { id: 608, name: 'DharaBeautySalon.Ahmedabad', phone: '+918460597525' },
  { id: 860, name: 'Honey shah Makeover', phone: '+917096164535' },
]

function getShortName(id: number, name: string): string {
  if (SHORT_NAME_OVERRIDES[id]) return SHORT_NAME_OVERRIDES[id]
  return (
    name
      .replace(
        /\b(makeup|makeover|make-up|beauty|salon|parlour|studio|academy|artist|bridal|hair|hairstyle|in\s+ahmedabad|ahmedabad|wedding|by\s+\w+)\b/gi,
        '',
      )
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
  return `🙏 નમસ્તે ${shortName} Team,

તમારું Bridal & Party Makeup portfolio જોઈને ઘણું જ સરસ લાગ્યું — તમારા makeup looks અને styling ખરેખર ખૂબ જ graceful અને elegant છે! 💄✨

અમે *Artistora* (artistora.com) — અમદાવાદનું exclusive Artist Marketplace શરૂ કરી રહ્યા છીએ, જ્યાં ગ્રાહકો સીધા verified artists સાથે connect થાય છે.

🚀 *તમારા માટે ફાયદા:*
• ફ્રી Dedicated Profile & Portfolio Page
• ગ્રાહકોના સીધા Call & WhatsApp Bookings
• 0% કમિશન / કોઈ Hidden Charges નહીં
• Bridal, Pre-Wedding, Sangeet & Party Makeup ના Booking Alerts

👉 *આજે જ ફ્રીમાં જોડાઓ:* https://www.artistora.com/register?role=artist&type=makeup-artists

Profile બનાવવા કે setup કરવામાં કોઈપણ guidance કે મદદ જોઈતી હોય તો તમે અહીં message કરી શકો છો — we are happy to guide you! 👍

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
  console.log('🚀 [Baileys Makeup Artist Outreach] Initializing...')

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
              campaignName: 'batch_makeup_01',
              templateUsed: 'gujarati_welcome',
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
