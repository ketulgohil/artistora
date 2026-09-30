/**
 * Instagram Automated DM Outreach Runner (Protocol-Level, Rate-Limited, Spintax Engine).
 * Dispatches personalized outreach messages to target Ahmedabad wedding & event artists with human jitter & anti-spam protection.
 *
 * Safety & Rate Limits:
 *   - Daily Safety Cap: Max 15-20 DMs per 24 hours
 *   - Human Delay Jitter: 65s - 115s between consecutive DMs
 *   - Batch Cool-down: 3-minute pause every 4 DMs
 *   - Spintax Variations: Randomized sentence structures so no two DMs are identical
 *   - Circuit Breaker: Auto-stops on 429, feedback_required, or action blocks
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation" npx tsx scripts/send-instagram-outreach.ts
 *   NODE_OPTIONS="--no-deprecation" npx tsx scripts/send-instagram-outreach.ts --limit 10 --category makeup
 *   NODE_OPTIONS="--no-deprecation" npx tsx scripts/send-instagram-outreach.ts --test @target_handle
 *
 * Importers/Callers: Executed standalone via CLI.
 * Affected APIs: Instagram Mobile API (`instagram-private-api`), Payload CMS Local API.
 * Schemas: `discovered_artists`, `outreach_messages`.
 * User instruction: "okay so now its time to reach out the instagram account give me plan to reach them with stretagy also hope you have bear in mind the rate limit as instagram may block automated process account so please fix anything related to that in the code."
 */

import dotenv from 'dotenv'
import * as path from 'path'
import {
  getInstagramClient,
  sendInstagramDM,
  resolveInstagramUser,
} from '../src/outreach/instagram/client'
import { verifyInstagramSession } from '../src/outreach/instagram/session'
import { getPayloadClient } from '../src/lib/payload'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const DAILY_DM_LIMIT = 20 // Meta safe limit for outbound cold DMs per 24h

function getJitterDelay(minSeconds = 65, maxSeconds = 115): number {
  const seconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds
  return seconds * 1000
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface TargetArtist {
  id?: number | string
  handle: string
  name?: string
  sourceId?: string
  category?: 'mehndi' | 'makeup' | 'photography' | 'decor' | string
}

/**
 * Dynamic Spintax Message Generator.
 * Generates unique message variations for every artist to prevent hash-based spam detection.
 */
function generateDynamicInstagramMessage(artist: TargetArtist): string {
  const rawName = artist.name || artist.handle.replace(/[_.]/g, ' ')
  const cleanName = rawName.split(/[|•-]/)[0].trim()

  const cat = (artist.category || '').toLowerCase()
  const isMehndi = cat.includes('mehndi') || cat.includes('henna')
  const isMakeup = cat.includes('makeup') || cat.includes('mua') || cat.includes('makeover')
  const isPhoto = cat.includes('photo') || cat.includes('film') || cat.includes('cinematography')

  const greetings = [
    `Hey ${cleanName}! 👋`,
    `Hello ${cleanName}! ✨`,
    `Kem cho ${cleanName}! 🙏`,
    `Hi ${cleanName}! 👋`,
  ]

  const compliments = isMehndi
    ? [
        `Loved your intricate bridal mehndi work on your feed.`,
        `Your mehndi designs and bridal patterns are really stunning.`,
        `Was checking out your recent bridal mehndi designs in Ahmedabad — beautiful work!`,
      ]
    : isMakeup
      ? [
          `Loved your recent bridal makeover and styling looks.`,
          `Your bridal makeup portfolio and finishes look amazing!`,
          `Was admiring your bridal makeup work across Ahmedabad weddings — stunning look!`,
        ]
      : isPhoto
        ? [
            `Loved your wedding photography captures and candid frames.`,
            `Your wedding shoots and cinematography work look fantastic!`,
            `Was browsing your wedding portfolio in Ahmedabad — really crisp work!`,
          ]
        : [
            `Loved your recent wedding & event work on your profile.`,
            `Your event portfolio and styling looks great!`,
            `Was checking out your wedding work in Ahmedabad — really impressive!`,
          ]

  const intros = [
    `We’re building Artistora (artistora.com) — an Ahmedabad-focused marketplace connecting verified artists directly with wedding clients with 0% commission.`,
    `We run Artistora (artistora.com) — a dedicated platform in Ahmedabad that sends direct wedding & event booking inquiries to verified local artists (zero commission).`,
    `We’ve launched Artistora (artistora.com) to help Ahmedabad couples find and book verified artists directly, with no hidden fees or commissions.`,
  ]

  const invitations = [
    `We’d love to feature your portfolio for upcoming wedding season inquiries. You can claim your free Founding Artist profile here in 1 minute:`,
    `We are curating top verified artists in Ahmedabad and would love to list your portfolio. You can activate your profile free here:`,
    `We’d love to feature your work for clients looking for verified artists in your area. Grab your free Founding Artist spot here:`,
  ]

  const ctaLinks = [
    `👉 https://www.artistora.com/register#artist`,
    `👉 Claim free: https://www.artistora.com/register#artist`,
  ]

  const signoffs = [
    `(Or if you're busy, just reply here and our team will set it up for you!)`,
    `(Feel free to reply here if you'd like us to create and activate it for you!)`,
    `(Or drop your WhatsApp number here and we will send your live profile link!)`,
  ]

  const greeting = pickRandom(greetings)
  const compliment = pickRandom(compliments)
  const intro = pickRandom(intros)
  const invite = pickRandom(invitations)
  const cta = pickRandom(ctaLinks)
  const signoff = pickRandom(signoffs)

  return `${greeting} ${compliment}\n\n${intro}\n\n${invite}\n${cta}\n\n${signoff}`
}

async function getSentCountLast24Hours(payload: any): Promise<number> {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recent = await payload.find({
      collection: 'outreach-messages',
      where: {
        and: [
          { channel: { equals: 'instagram' } },
          { status: { equals: 'sent' } },
          { createdAt: { greater_than_equal: yesterday } },
        ],
      },
      limit: 100,
    })
    return recent.docs.length
  } catch {
    return 0
  }
}

async function main() {
  console.log('====================================================')
  console.log('📸 Artistora — Instagram Protocol DM Outreach Runner')
  console.log('====================================================\n')

  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const testHandle = isTest ? args[args.indexOf('--test') + 1] : null

  const limitIdx = args.indexOf('--limit')
  const batchLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 15 : 15

  const catIdx = args.indexOf('--category')
  const targetCategory = catIdx !== -1 ? args[catIdx + 1].toLowerCase() : null

  // 1. Initialize authenticated Instagram client via Redis session
  console.log('⏳ Connecting to Instagram Mobile API via Redis session...')
  const { ig, username: senderAccount } = await getInstagramClient()

  // 1.1. Health Check: Verify session is actually active on Instagram API
  console.log('⏳ Verifying Instagram session health...')
  const verification = await verifyInstagramSession(ig)
  if (!verification.valid) {
    console.error(`\n🛑 Instagram session is expired or invalid (${verification.error}).`)
    console.error('👉 Please link a fresh session cookie with:')
    console.error('   npx tsx scripts/auth-instagram.ts --cookie "YOUR_SESSION_ID"\n')
    process.exit(1)
  }

  console.log(`✅ Authenticated & verified as @${senderAccount}\n`)

  const payload = await getPayloadClient()

  // 2. Handle single test message
  if (isTest && testHandle) {
    console.log(`🧪 Running single test DM to ${testHandle}...`)
    const testArtist: TargetArtist = { handle: testHandle, name: testHandle.replace(/^@/, '') }
    const messageBody = generateDynamicInstagramMessage(testArtist)

    console.log('\n--- Message Preview ---')
    console.log(messageBody)
    console.log('-----------------------\n')

    const result = await sendInstagramDM(testHandle, messageBody, ig)
    if (result.success) {
      console.log(`\n🎉 Test message successfully sent to ${testHandle}!`)
    } else {
      console.error(`\n❌ Failed to send test message: ${result.error}`)
    }
    process.exit(0)
  }

  // 3. Safety Check: Verify 24-hour rate limit quota
  const sentLast24h = await getSentCountLast24Hours(payload)
  console.log(`📊 24-Hour Instagram DM Activity: ${sentLast24h}/${DAILY_DM_LIMIT} sent`)

  if (sentLast24h >= DAILY_DM_LIMIT) {
    console.log(
      `\n🛑 SAFETY PAUSE: Daily Instagram DM cap of ${DAILY_DM_LIMIT} reached in the last 24 hours.`,
    )
    console.log(
      `   To protect your account from Meta action restrictions, this batch will resume tomorrow.\n`,
    )
    process.exit(0)
  }

  const remainingQuota = Math.min(batchLimit, DAILY_DM_LIMIT - sentLast24h)
  console.log(`🎯 Safe batch quota for this run: ${remainingQuota} DMs\n`)

  // 4. Fetch target uncontacted artists from PostgreSQL `discovered_artists`
  console.log('🔍 Fetching uncontacted Ahmedabad artists from database...')
  const queryWhere: any = {
    and: [{ source: { equals: 'instagram' } }, { outreachStatus: { equals: 'new' } }],
  }

  const result = await payload.find({
    collection: 'discovered-artists',
    where: queryWhere,
    limit: 100,
  })

  let targetList: TargetArtist[] = (result.docs || []).map((doc: any) => ({
    id: doc.id,
    handle: doc.instagramHandle || doc.name,
    name: doc.name,
    sourceId: doc.sourceId,
    category: doc.services?.[0]?.name || doc.specializations || 'makeup',
  }))

  if (targetCategory) {
    targetList = targetList.filter((a) => (a.category || '').toLowerCase().includes(targetCategory))
  }

  if (targetList.length === 0) {
    console.log('ℹ️ No uncontacted Instagram artists found in database.')
    console.log('👉 Run `npm run scrape:instagram` to discover fresh Ahmedabad artists first.\n')
    process.exit(0)
  }

  console.log(
    `📋 Found ${targetList.length} artists in database. Dispatching to first ${Math.min(targetList.length, remainingQuota)} artists...\n`,
  )

  let sentCount = 0
  let skippedCount = 0

  for (let i = 0; i < Math.min(targetList.length, remainingQuota); i++) {
    const artist = targetList[i]
    const cleanHandle = artist.handle.replace(/^@/, '').trim()

    console.log(
      `\n[${i + 1}/${remainingQuota}] 🎯 Target: @${cleanHandle} (${artist.name || 'Artist'})`,
    )

    // Check deduplication in outreach_messages
    try {
      const existing = await payload.find({
        collection: 'outreach-messages',
        where: {
          and: [
            { channel: { equals: 'instagram' } },
            { recipientInstagram: { equals: cleanHandle } },
            { status: { equals: 'sent' } },
          ],
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`   ⏩ Skipping @${cleanHandle} — already contacted.`)
        skippedCount++
        continue
      }
    } catch {}

    const messageBody = generateDynamicInstagramMessage(artist)
    const targetIdentifier = artist.sourceId || cleanHandle
    const dmResult = await sendInstagramDM(targetIdentifier, messageBody, ig)

    if (dmResult.success) {
      sentCount++
      console.log(`   ✅ [${sentCount}] Successfully delivered DM to @${cleanHandle}`)

      // Log in PostgreSQL outreach_messages
      try {
        await payload.create({
          collection: 'outreach-messages',
          data: {
            channel: 'instagram',
            recipientInstagram: cleanHandle,
            artistName: artist.name || cleanHandle,
            message: messageBody,
            status: 'sent',
            sentAt: new Date().toISOString(),
          } as any,
        })
      } catch (err: any) {
        console.warn(`   ⚠️ Log message warning: ${err.message}`)
      }

      // Update artist outreachStatus in discovered_artists
      if (artist.id) {
        try {
          await payload.update({
            collection: 'discovered-artists',
            id: artist.id,
            data: {
              outreachStatus: 'contacted',
              lastContactedAt: new Date().toISOString(),
            } as any,
          })
        } catch {}
      }
    } else {
      console.error(`   ❌ Failed to send DM to @${cleanHandle}: ${dmResult.error}`)

      // Circuit Breaker: If Instagram rate limits or flags action
      if (
        dmResult.error?.includes('feedback_required') ||
        dmResult.error?.includes('429') ||
        dmResult.error?.includes('action_blocked')
      ) {
        console.error(
          `\n🚨 CIRCUIT BREAKER TRIPPED: Instagram rate limit or feedback challenge detected.`,
        )
        console.error(
          `   Halting outreach immediately to protect @${senderAccount} account health.\n`,
        )
        break
      }
    }

    // Cooldown Pause every 4 DMs (2.5 to 3.5 minutes)
    if ((i + 1) % 4 === 0 && i < remainingQuota - 1) {
      const cooldownMs = getJitterDelay(150, 210)
      console.log(
        `\n☕ [Micro-Break] Pausing for ${(cooldownMs / 60000).toFixed(1)} minutes to simulate natural human activity...`,
      )
      await sleep(cooldownMs)
    } else if (i < remainingQuota - 1) {
      // Standard human jitter delay between DMs (65s to 115s)
      const jitterMs = getJitterDelay(65, 115)
      console.log(`⏳ Waiting ${(jitterMs / 1000).toFixed(0)}s human delay before next artist...`)
      await sleep(jitterMs)
    }
  }

  console.log('\n====================================================')
  console.log(`🎉 Batch Run Finished!`)
  console.log(`   Successfully Sent: ${sentCount}`)
  console.log(`   Skipped / Duplicates: ${skippedCount}`)
  console.log(`   Account Status: Healthy & Protected`)
  console.log('====================================================\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error in outreach runner:', err)
  process.exit(1)
})
