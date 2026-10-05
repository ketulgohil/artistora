/**
 * Dynamic WhatsApp Welcome & Feedback Message Dispatcher for Registered Artists.
 *
 * Automatically fetches registered artist details (name, slug, category, phone, portfolio count),
 * generates a personalized thank-you message with public profile link, dashboard portfolio upload CTA,
 * and requests platform feedback & suggestions.
 *
 * Usage:
 *   # 1. Send to artist by name, slug, or ID
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-registered-artist-welcome.ts --artist Nailxsakshi
 *
 *   # 2. Send to artist by phone
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-registered-artist-welcome.ts --phone 9510927830
 *
 *   # 3. Send to latest registered artist
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-registered-artist-welcome.ts --latest
 *
 *   # 4. Preview message without sending
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-registered-artist-welcome.ts --artist Nailxsakshi --preview
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'
import { getDbPool, closeDbPool, logWhatsAppOutreachMessage } from '../src/outreach/db'
import {
  loadBaileysAuthFromRedis,
  saveBaileysAuthToRedis,
} from '../src/outreach/whatsapp/baileys-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'
import { cleanArtistNameForGreeting } from '../src/outreach/instagram/messaging'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const AUTH_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys-auth-session'
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface RegisteredArtistRecord {
  id: number
  displayName: string
  slug: string
  phone: string
  whatsappNumber?: string | null
  artistType?: string | null
  portfolioCount: number
  createdAt: string
}

function getCategoryLabel(artistType?: string | null): string {
  const norm = (artistType || '').toLowerCase()
  if (norm.includes('nail')) return 'Nail Artist'
  if (norm.includes('mehndi') || norm.includes('henna')) return 'Mehndi Artist'
  if (norm.includes('makeup') || norm.includes('makeover')) return 'Makeup & Hair Artist'
  if (norm.includes('decor') || norm.includes('event')) return 'Decor & Event Planner'
  return 'Wedding & Event Artist'
}

function generateWelcomeMessage(artist: RegisteredArtistRecord): string {
  const shortName = cleanArtistNameForGreeting(artist.displayName) || 'Artist'
  const categoryLabel = getCategoryLabel(artist.artistType)
  const profileUrl = `https://www.artistora.com/artists/${artist.slug}`
  const dashboardUrl = `https://www.artistora.com/dashboard`

  const portfolioNote =
    artist.portfolioCount > 0
      ? `Aapka profile live ho chuka hai with ${artist.portfolioCount} portfolio image(s)! Aur bridal & event work showcase karne ke liye aap aur photos add kar sakte hain:`
      : `Ahmedabad ke clients se direct wedding & party inquiries paane ke liye, please apne dashboard me jaakar apne best work ke portfolio photos upload kar lijiye:`

  return `🙏 Namaste ${shortName} ji,

Thank you so much for joining *Artistora* (artistora.com) as a verified ${categoryLabel}! ✨

🌟 *Aapka Public Profile Live Hai:*
👉 ${profileUrl}

📸 *Next Step — Portfolio Showcase:*
${portfolioNote}
👉 ${dashboardUrl}

💬 *Aapka Feedback & Suggestions:*
Artistora ko artists ke liye aur behtar banane ke liye aapke suggestions aur feedback hamare liye bohot valuable hain. Agar platform use karne me koi bhi issue aaye ya koi naya feature chahiye, to please hume zaroor bataye!

Agar profile setup ya inquiries ke bare me koi bhi guidance chahiye, to aap hume yaha WhatsApp par directly message kar sakte hain — we are always here to help! 👍

Warm regards,
*Team Artistora | Ahmedabad*
https://www.artistora.com`
}

async function findRegisteredArtists(options: {
  artistQuery?: string
  phoneQuery?: string
  latest?: boolean
}): Promise<RegisteredArtistRecord[]> {
  const pool = getDbPool()

  let whereClause = ''
  const params: any[] = []

  if (options.phoneQuery) {
    const rawDigits = options.phoneQuery.replace(/[^\d]/g, '').slice(-10)
    params.push(`%${rawDigits}%`)
    whereClause = `WHERE a.phone LIKE $${params.length} OR a.whatsapp_number LIKE $${params.length}`
  } else if (options.artistQuery) {
    params.push(`%${options.artistQuery.toLowerCase().trim()}%`)
    whereClause = `WHERE LOWER(a.display_name) LIKE $${params.length} OR LOWER(a.slug) LIKE $${params.length}`
  }

  const query = `
    SELECT
      a.id,
      a.display_name AS "displayName",
      a.slug,
      a.phone,
      a.whatsapp_number AS "whatsappNumber",
      a.artist_type AS "artistType",
      a.created_at AS "createdAt",
      (SELECT COUNT(*)::int FROM artists_portfolio_images pi WHERE pi._parent_id = a.id) AS "portfolioCount"
    FROM artists a
    ${whereClause}
    ORDER BY a.id DESC
    LIMIT 10
  `

  const res = await pool.query(query, params)
  return res.rows
}

async function main() {
  const args = process.argv.slice(2)
  const isPreview = args.includes('--preview')
  const isLatest = args.includes('--latest')

  const artistIdx = args.indexOf('--artist')
  const artistQuery = artistIdx !== -1 ? args[artistIdx + 1] : undefined

  const phoneIdx = args.indexOf('--phone')
  const phoneQuery = phoneIdx !== -1 ? args[phoneIdx + 1] : undefined

  console.log('================================================================')
  console.log('🌟 Artistora — Registered Artist Welcome & Feedback Dispatcher')
  console.log('================================================================\n')

  const artists = await findRegisteredArtists({
    artistQuery,
    phoneQuery,
    latest: isLatest || (!artistQuery && !phoneQuery),
  })

  if (artists.length === 0) {
    console.log('❌ No matching registered artist found.')
    await closeDbPool()
    process.exit(1)
  }

  const targetArtist = artists[0]
  const cleanPhone = validateAndNormalizePhone(
    targetArtist.whatsappNumber || targetArtist.phone || '',
  )

  if (!cleanPhone) {
    console.error(
      `❌ Invalid phone number for artist "${targetArtist.displayName}": ${targetArtist.phone}`,
    )
    await closeDbPool()
    process.exit(1)
  }

  const message = generateWelcomeMessage(targetArtist)

  console.log(`🎯 Target Artist: ${targetArtist.displayName} (ID: ${targetArtist.id})`)
  console.log(`📱 Phone:         ${cleanPhone}`)
  console.log(`🎨 Category:      ${getCategoryLabel(targetArtist.artistType)}`)
  console.log(`🔗 Profile:       https://www.artistora.com/artists/${targetArtist.slug}`)
  console.log(`📸 Portfolio:     ${targetArtist.portfolioCount} image(s) uploaded`)
  console.log('----------------------------------------------------------------')
  console.log('📝 Rendered WhatsApp Message:')
  console.log('----------------------------------------------------------------')
  console.log(message)
  console.log('----------------------------------------------------------------\n')

  if (isPreview) {
    console.log('🔎 Preview mode complete (message not sent).')
    await closeDbPool()
    process.exit(0)
  }

  // Live dispatch via Baileys & Redis session
  console.log('🔌 Connecting to WhatsApp Baileys session...')
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  await loadBaileysAuthFromRedis(AUTH_DIR)

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const logger = pino({ level: 'silent' })

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 30000,
  })

  sock.ev.on('creds.update', saveCreds)

  const jid = `${cleanPhone.replace('+', '')}@s.whatsapp.net`

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'open') {
      console.log('✅ WhatsApp connected. Sending message...')
      try {
        await sock.sendPresenceUpdate('available')
        await sleep(1200)
        await sock.sendPresenceUpdate('composing', jid)
        await sleep(3800)

        const res = await sock.sendMessage(jid, { text: message })
        console.log(`🚀 Welcome & feedback message delivered! (ID: ${res?.key?.id})`)

        await logWhatsAppOutreachMessage({
          artistId: targetArtist.id,
          body: message,
          status: 'sent',
          campaignName: 'registered_artist_onboarding',
          templateUsed: 'custom',
        })

        await saveBaileysAuthToRedis(AUTH_DIR)
        console.log('✅ Session state saved to Redis.')
      } catch (err: any) {
        console.error('❌ Failed to send:', err.message)
      }

      await sleep(2000)
      try {
        sock.end(undefined)
      } catch {}
      await closeDbPool()
      process.exit(0)
    } else if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
      if (statusCode === DisconnectReason.loggedOut) {
        console.error('❌ Logged out')
        await closeDbPool()
        process.exit(1)
      }
    }
  })
}

main().catch(async (err) => {
  console.error('Fatal error:', err)
  await closeDbPool()
  process.exit(1)
})
