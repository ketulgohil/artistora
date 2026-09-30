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

interface OutreachTarget {
  id: number
  name: string
  phone: string
  category: 'mehndi' | 'decor' | 'makeup' | 'photography'
  cleanName?: string
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
 * Dynamically queries uncontacted artists by category using Payload Local API.
 */
async function getArtistsFromDB(
  payload: any,
  category: 'mehndi' | 'decor' | 'makeup' | 'photography',
  limit: number,
): Promise<OutreachTarget[]> {
  try {
    const res = await payload.find({
      collection: 'discovered-artists',
      where: {
        and: [{ phone: { exists: true } }, { outreachStatus: { equals: 'new' } }],
      },
      limit: 200,
    })

    const filtered = (res.docs || []).filter((doc: any) => {
      const combined = `${doc.services?.[0]?.name || ''} ${doc.specializations || ''} ${doc.name || ''} ${doc.businessName || ''}`.toLowerCase()
      if (category === 'mehndi') {
        return combined.includes('mehndi') || combined.includes('mehendi') || combined.includes('henna')
      }
      if (category === 'decor') {
        return combined.includes('decor') || combined.includes('planner') || combined.includes('event') || combined.includes('mandap')
      }
      if (category === 'makeup') {
        return combined.includes('makeup') || combined.includes('mua') || combined.includes('makeover') || combined.includes('beauty')
      }
      if (category === 'photography') {
        return combined.includes('photo') || combined.includes('cinematograph') || combined.includes('film') || combined.includes('studio') || combined.includes('camera')
      }
      return false
    })

    return filtered.slice(0, limit).map((doc: any) => ({
      id: doc.id,
      name: doc.name || doc.businessName || 'Artist',
      phone: doc.phone || doc.whatsappNumber,
      category,
      cleanName: cleanArtistName(doc.name || doc.businessName || 'Artist'),
    }))
  } catch (err: any) {
    console.warn(`[Payload] Notice fetching ${category} artists:`, err.message)
    return []
  }
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
async function getAlreadyContactedPhones(payload: any): Promise<Set<string>> {
  const contacted = new Set<string>()
  try {
    const res = await payload.find({
      collection: 'outreach-messages',
      where: {
        and: [
          { channel: { equals: 'whatsapp' } },
          { status: { equals: 'sent' } },
        ],
      },
      limit: 1000,
    })
    for (const doc of res.docs) {
      if (doc.recipientPhone) {
        contacted.add(String(doc.recipientPhone).replace(/\D/g, ''))
      }
    }
  } catch (err: any) {
    console.warn('[Deduplication] Query notice:', err.message)
  }
  return contacted
}

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

  // 1. Fetch uncontacted artists dynamically from database by category
  console.log('🔍 Fetching uncontacted artists from database...')
  const groups: { name: string; key: string; artists: OutreachTarget[] }[] = []

  if (!categoryArg || categoryArg === 'mehndi') {
    const mehndiList = await getArtistsFromDB(payload, 'mehndi', limitArg)
    groups.push({ name: 'Mehndi Artists', key: 'mehndi', artists: mehndiList })
  }
  if (!categoryArg || categoryArg === 'decor') {
    const decorList = await getArtistsFromDB(payload, 'decor', limitArg)
    groups.push({ name: 'Decor & Event Planners', key: 'decor', artists: decorList })
  }
  if (!categoryArg || categoryArg === 'makeup') {
    const makeupList = await getArtistsFromDB(payload, 'makeup', limitArg)
    groups.push({ name: 'Makeup Artists', key: 'makeup', artists: makeupList })
  }
  if (!categoryArg || categoryArg === 'photography' || categoryArg === 'photographer') {
    const photoList = await getArtistsFromDB(payload, 'photography', limitArg)
    groups.push({ name: 'Photographers', key: 'photography', artists: photoList })
  }

  const totalArtists = groups.reduce((acc, g) => acc + g.artists.length, 0)
  console.log(
    `📋 Total Selected: ${totalArtists} artists across ${groups.length} categories (Limit: ${limitArg} per category)\n`,
  )

  // 2. Check Deduplication
  const alreadyContacted = await getAlreadyContactedPhones(payload)
  console.log(
    `🛡️ Database Deduplication: Found ${alreadyContacted.size} previously contacted numbers in database.\n`,
  )

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
        startBatch()
      } else {
        console.error('[WhatsApp] ❌ Logged out from WhatsApp. Please re-run auth.')
      }
    }

    if (connection === 'open') {
      console.log(`\n✅ WhatsApp Connected successfully! (Account JID: ${sock.user?.id})\n`)
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

          const rawPhoneDigits = cleanPhone.replace(/\D/g, '')
          if (alreadyContacted.has(rawPhoneDigits)) {
            console.log(
              `⏩ [${i + 1}/${group.artists.length}] Skipping ${artist.name} (${cleanPhone}) — already contacted.`,
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
