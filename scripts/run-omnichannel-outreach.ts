/**
 * Master Omnichannel Outreach Orchestrator for Artistora.
 * Dispatches targeted outreach across WhatsApp (Baileys) and Instagram (Playwright)
 * to 10 artists from every category (Mehndi, Decor, Nail, Makeup) with strict anti-ban safeguards.
 *
 * Anti-Ban & Account Safety Protections:
 *   - WhatsApp Daily Safe Cap: Max 50 outbound cold messages per 24 hours
 *   - Instagram Daily Safe Cap: Max 20 outbound DMs per 24 hours
 *   - Human Jitter Delays: 45s - 85s between consecutive dispatches
 *   - Micro-Cooldown Breaks: 3-minute rest every 3-4 messages
 *   - Inter-Category Rest: 2-minute pause between categories
 *   - Real Typing Simulation & Dynamic Spintax Variations
 *   - Real-time Deduplication against `outreach_messages` in PostgreSQL
 *
 * Usage:
 *   # 1. Preview mode (instant dry-run across all 4 categories and both channels)
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/run-omnichannel-outreach.ts --preview
 *
 *   # 2. Run both WhatsApp and Instagram for 10 artists per category
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/run-omnichannel-outreach.ts --limit 10
 *
 *   # 3. Run WhatsApp only for all 4 categories
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/run-omnichannel-outreach.ts --channel whatsapp --limit 10
 *
 *   # 4. Run Instagram only for all 4 categories
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/run-omnichannel-outreach.ts --channel instagram --limit 10
 *
 *   # 5. Run specific category
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/run-omnichannel-outreach.ts --category mehndi --limit 10
 */

import {
  closeDbPool,
  getOmnichannelOutreachStats,
  getUncontactedInstagramArtists,
  getUncontactedWhatsAppArtists,
  logInstagramOutreachMessage,
  logWhatsAppOutreachMessage,
  markArtistContacted,
  type InstagramArtistRecord,
  type WhatsAppArtistRecord,
} from '../src/outreach/db'
import {
  detectCategory,
  cleanArtistNameForGreeting,
  generateDynamicInstagramMessage,
} from '../src/outreach/instagram/messaging'
import { chromium } from '@playwright/test'
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'
import {
  saveBaileysAuthToRedis,
  loadBaileysAuthFromRedis,
} from '../src/outreach/whatsapp/baileys-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const CATEGORIES = ['mehndi', 'decor', 'nail', 'makeup'] as const
type OutreachCat = (typeof CATEGORIES)[number]

const IG_PROFILE_DIR = path.resolve(process.cwd(), '.instagram-browser-profile')
const WA_AUTH_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys-auth-session')
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getJitter(minSec = 45, maxSec = 85): number {
  return (Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec) * 1000
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---------------------------------------------------------------------------
// WhatsApp Message Builder
// ---------------------------------------------------------------------------
function buildWhatsAppMessage(artist: WhatsAppArtistRecord, cat: OutreachCat): string {
  const shortName = cleanArtistNameForGreeting(artist.name || artist.businessName || '')

  const greetings = [
    `🙏 Namaste ${shortName},`,
    `🙏 Namaste ${shortName} Team,`,
    `Hello ${shortName} ji,`,
    `Kem cho ${shortName} Team! 🙏`,
  ]

  let typeSlug = 'mehndi-artists'
  let bullets = ''

  if (cat === 'mehndi') {
    typeSlug = 'mehndi-artists'
    bullets = `• Mehndi Artists (Bridal, Arabic, Traditional, Figurative)\n• Makeup & Hair Artists (Bridal & Party Glam)\n• Nail Artists & Studios (Bridal Extensions, Gel Art)\n• Decorators & Event Planners`
  } else if (cat === 'nail') {
    typeSlug = 'nail-artists'
    bullets = `• Nail Artists & Studios (Bridal Extensions, Gel & Acrylic Art)\n• Mehndi Artists (Bridal, Arabic, Traditional)\n• Makeup & Hair Artists (Bridal & Party Glam)\n• Decorators & Event Planners`
  } else if (cat === 'makeup') {
    typeSlug = 'makeup-artists'
    bullets = `• Makeup & Hair Artists (Bridal, HD, Airbrush & Party Glam)\n• Mehndi Artists (Bridal, Arabic, Traditional)\n• Nail Artists & Studios (Bridal Extensions)\n• Decorators & Event Planners`
  } else if (cat === 'decor') {
    typeSlug = 'decor-event-planners'
    bullets = `• Decorators & Event Planners (Mandap, Stage, Theme Sets)\n• Mehndi Artists (Bridal, Arabic, Traditional)\n• Makeup & Hair Artists (Bridal & Party Glam)\n• Nail Artists & Studios`
  }

  return `${pickRandom(greetings)}

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist & Event Marketplace launch kar rahe hain, jaha clients directly verified artists se connect karte hain.

🎨 *Who Can Join & List Free:*
${bullets}

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Middlemen Charges
• High-Intent Wedding & Festive Inquiries in Ahmedabad

👉 *List Your Profile Free:* https://www.artistora.com/register?role=artist&type=${typeSlug}

Profile listing ya setup karne me agar aapko koi bhi guidance chahiye, to aap hume yaha message kar sakte hain — we are happy to guide you! 👍

Warm regards,
*Artistora | Ahmedabad*`
}

// ---------------------------------------------------------------------------
// WhatsApp Client Connection (Baileys + Desktop Header + Signal Key Caching)
// ---------------------------------------------------------------------------
async function connectWhatsApp(): Promise<{ sock: any; close: () => Promise<void> }> {
  fs.mkdirSync(WA_AUTH_DIR, { recursive: true })
  await loadBaileysAuthFromRedis(WA_AUTH_DIR).catch(() => {})

  const { state, saveCreds } = await useMultiFileAuthState(WA_AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()
  const logger = pino({ level: 'silent' })

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await saveBaileysAuthToRedis(WA_AUTH_DIR).catch(() => {})
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('WhatsApp connection timed out after 45 seconds.'))
    }, 45000)

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'open') {
        clearTimeout(timeout)
        resolve({
          sock,
          close: async () => {
            try {
              await saveBaileysAuthToRedis(WA_AUTH_DIR).catch(() => {})
              sock.end(undefined)
            } catch {}
          },
        })
      } else if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        if (!shouldReconnect) {
          clearTimeout(timeout)
          reject(
            new Error(
              'WhatsApp session logged out. Please re-link via `npm run outreach:whatsapp`',
            ),
          )
        }
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Main Orchestrator CLI
// ---------------------------------------------------------------------------
async function main() {
  const startTime = Date.now()
  const args = process.argv.slice(2)
  const isPreview = args.includes('--preview') || args.includes('--dry-run')
  const isHeadless = args.includes('--headless')

  const channelIdx = args.indexOf('--channel')
  const requestedChannel = channelIdx !== -1 ? args[channelIdx + 1].toLowerCase() : 'both'

  const limitIdx = args.indexOf('--limit')
  const limitPerCategory = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 10 : 10

  const catIdx = args.indexOf('--category')
  const filteredCategory = catIdx !== -1 ? (args[catIdx + 1].toLowerCase() as OutreachCat) : null

  console.log('================================================================')
  console.log('🌟 Artistora — Master Omnichannel Outreach Orchestrator')
  console.log('================================================================\n')

  const stats = await getOmnichannelOutreachStats()

  console.log('📊 Global Pipeline & 24h Safety Snapshot:')
  console.log(`   • Total Discovered Artists:  ${stats.totalDiscovered}`)
  console.log(
    `   • WhatsApp Pipeline:        ${stats.whatsapp.uncontacted} Uncontacted | 24h Sent: ${stats.whatsapp.sentLast24Hours}/${stats.whatsapp.dailyCap} (Daily Safe Cap)`,
  )
  console.log(
    `   • Instagram Pipeline:       ${stats.instagram.uncontacted} Uncontacted | 24h Sent: ${stats.instagram.sentLast24Hours}/${stats.instagram.dailyCap} (Daily Safe Cap)\n`,
  )

  // Fetch candidate pools
  const rawIgArtists = await getUncontactedInstagramArtists({ limit: 1000 })
  const rawWaArtists = await getUncontactedWhatsAppArtists({ limit: 1000 })

  const activeCategories: OutreachCat[] = filteredCategory
    ? [filteredCategory]
    : ['mehndi', 'decor', 'nail', 'makeup']

  // Organize targets by category
  const categorizedIg: Record<OutreachCat, InstagramArtistRecord[]> = {
    mehndi: [],
    decor: [],
    nail: [],
    makeup: [],
  }
  const categorizedWa: Record<OutreachCat, WhatsAppArtistRecord[]> = {
    mehndi: [],
    decor: [],
    nail: [],
    makeup: [],
  }

  for (const artist of rawIgArtists) {
    const detected = detectCategory(
      '',
      artist.name || '',
      artist.instagramHandle,
      `${artist.specializations || ''} ${artist.serviceDisplay || ''}`,
    )
    if (detected.category !== 'general' && categorizedIg[detected.category as OutreachCat]) {
      categorizedIg[detected.category as OutreachCat].push(artist)
    }
  }

  for (const artist of rawWaArtists) {
    const text =
      `${artist.name || ''} ${artist.businessName || ''} ${artist.specializations || ''} ${artist.serviceDisplay || ''}`.toLowerCase()
    const detected = detectCategory('', artist.name || '', '', text)
    if (detected.category !== 'general' && categorizedWa[detected.category as OutreachCat]) {
      categorizedWa[detected.category as OutreachCat].push(artist)
    }
  }

  // -------------------------------------------------------------------------
  // PREVIEW / DRY-RUN MODE
  // -------------------------------------------------------------------------
  if (isPreview) {
    console.log('🔎 PREVIEW MODE ENABLED (Dry-run — no messages sent, 0 browser/socket overhead)\n')

    for (const cat of activeCategories) {
      console.log(`================================================================`)
      console.log(
        `📂 CATEGORY: ${cat.toUpperCase()} (Target: up to ${limitPerCategory} artists/channel)`,
      )
      console.log(`================================================================`)

      const waList = categorizedWa[cat].slice(0, limitPerCategory)
      const igList = categorizedIg[cat].slice(0, limitPerCategory)

      console.log(`\n💬 WhatsApp Targets (${waList.length} ready):`)
      waList.forEach((a, i) => {
        console.log(
          `   ${i + 1}. [ID: ${a.id}] ${cleanArtistNameForGreeting(a.name)} | Phone: ${a.phone}`,
        )
      })

      console.log(`\n📸 Instagram Targets (${igList.length} ready):`)
      igList.forEach((a, i) => {
        console.log(
          `   ${i + 1}. [ID: ${a.id}] ${cleanArtistNameForGreeting(a.name)} | Handle: @${a.instagramHandle.replace(/^@/, '')}`,
        )
      })

      if (waList[0]) {
        console.log(`\n📝 WhatsApp Sample Message Preview (${cat}):`)
        console.log('----------------------------------------------------------------')
        console.log(buildWhatsAppMessage(waList[0], cat))
        console.log('----------------------------------------------------------------')
      }

      if (igList[0]) {
        console.log(`\n📝 Instagram Sample DM Preview (${cat}):`)
        console.log('----------------------------------------------------------------')
        console.log(
          generateDynamicInstagramMessage({
            handle: igList[0].instagramHandle,
            name: igList[0].name,
            category: cat,
          }),
        )
        console.log('----------------------------------------------------------------\n')
      }
    }

    console.log(`⚡ Preview completed in ${Date.now() - startTime}ms.`)
    console.log(`👉 To start live outreach, run without --preview:`)
    console.log(
      `   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/run-omnichannel-outreach.ts --limit 10\n`,
    )
    await closeDbPool()
    process.exit(0)
  }

  // -------------------------------------------------------------------------
  // LIVE EXECUTION
  // -------------------------------------------------------------------------
  const runWhatsApp = requestedChannel === 'both' || requestedChannel === 'whatsapp'
  const runInstagram = requestedChannel === 'both' || requestedChannel === 'instagram'

  let totalWaSent = 0
  let totalIgSent = 0

  // 1. WhatsApp Outreach Execution
  if (runWhatsApp) {
    console.log('----------------------------------------------------------------')
    console.log('📱 INITIALIZING WHATSAPP OUTREACH BATCH')
    console.log('----------------------------------------------------------------\n')

    const waRemainingQuota = Math.max(0, stats.whatsapp.dailyCap - stats.whatsapp.sentLast24Hours)
    if (waRemainingQuota <= 0) {
      console.log(
        `🛑 WhatsApp daily safety limit (${stats.whatsapp.dailyCap}/day) already reached. Skipping WhatsApp batch to prevent ban.\n`,
      )
    } else {
      console.log(`🔌 Connecting to WhatsApp Baileys session...`)
      let waSession: { sock: any; close: () => Promise<void> } | null = null
      try {
        waSession = await connectWhatsApp()
        console.log('✅ WhatsApp session authenticated and connected.\n')

        for (const cat of activeCategories) {
          if (totalWaSent >= waRemainingQuota) {
            console.log(`🛑 Daily WhatsApp cap (${stats.whatsapp.dailyCap}) reached for this run.`)
            break
          }

          const targetQueue = categorizedWa[cat].slice(
            0,
            Math.min(limitPerCategory, waRemainingQuota - totalWaSent),
          )
          if (targetQueue.length === 0) continue

          console.log(
            `\n🚀 Starting WhatsApp Category: ${cat.toUpperCase()} (${targetQueue.length} targets)`,
          )

          for (let i = 0; i < targetQueue.length; i++) {
            const artist = targetQueue[i]
            const cleanPhone = validateAndNormalizePhone(artist.phone)
            if (!cleanPhone) continue

            const jid = `${cleanPhone.replace('+', '')}@s.whatsapp.net`
            const msg = buildWhatsAppMessage(artist, cat)

            console.log(
              `\n[WA ${totalWaSent + 1}/${waRemainingQuota}] 🎯 Sending to: ${cleanArtistNameForGreeting(artist.name)} (${artist.phone})`,
            )

            try {
              // Typing presence emulation
              await waSession.sock.sendPresenceUpdate('available')
              await sleep(1200)
              await waSession.sock.sendPresenceUpdate('composing', jid)
              await sleep(3500)

              await waSession.sock.sendMessage(jid, { text: msg })
              await logWhatsAppOutreachMessage({ artistId: artist.id, body: msg, status: 'sent' })
              await markArtistContacted(artist.id, `omnichannel-${cat}-whatsapp`)
              totalWaSent++
              console.log(`   ✅ Message delivered on WhatsApp!`)

              // Anti-ban micro-breaks & jitter
              if (totalWaSent % 3 === 0 && i < targetQueue.length - 1) {
                console.log(
                  '   ☕ Micro-cooldown break: 3 minutes pause to protect WhatsApp sender reputation...',
                )
                await sleep(180000)
              } else if (i < targetQueue.length - 1) {
                const delay = getJitter(50, 80)
                console.log(`   ⏳ Jitter delay: waiting ${Math.round(delay / 1000)}s...`)
                await sleep(delay)
              }
            } catch (err: any) {
              console.warn(`   ❌ Failed to send WhatsApp to ${artist.phone}: ${err.message}`)
            }
          }

          if (activeCategories.indexOf(cat) < activeCategories.length - 1) {
            console.log('\n⏸️ Category complete. 2-minute inter-category cooldown...')
            await sleep(120000)
          }
        }
      } catch (err: any) {
        console.error(`❌ WhatsApp outreach error: ${err.message}`)
      } finally {
        if (waSession) await waSession.close()
      }
    }
  }

  // 2. Instagram Outreach Execution
  if (runInstagram) {
    console.log('\n----------------------------------------------------------------')
    console.log('📸 INITIALIZING INSTAGRAM PLAYWRIGHT DM BATCH')
    console.log('----------------------------------------------------------------\n')

    const igRemainingQuota = Math.max(0, stats.instagram.dailyCap - stats.instagram.sentLast24Hours)
    if (igRemainingQuota <= 0) {
      console.log(
        `🛑 Instagram daily safety limit (${stats.instagram.dailyCap}/day) already reached. Skipping Instagram batch.\n`,
      )
    } else {
      console.log(`🚀 Launching Playwright browser session...`)
      fs.mkdirSync(IG_PROFILE_DIR, { recursive: true })

      const context = await chromium.launchPersistentContext(IG_PROFILE_DIR, {
        channel: 'chrome',
        headless: isHeadless,
        viewport: { width: 1280, height: 800 },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'Asia/Kolkata',
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      })

      const page = context.pages()[0] || (await context.newPage())
      if (!isHeadless) await page.bringToFront().catch(() => {})
      await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' })
      await sleep(3000)

      const isAuth = await page.$(
        'a[href*="/direct/inbox/"], svg[aria-label="Direct"], svg[aria-label="Home"]',
      )
      if (!isAuth) {
        console.error(
          '❌ Instagram browser is not logged in. Please run `npm run instagram:login` first.',
        )
        await context.close()
      } else {
        console.log('✅ Instagram session authenticated.\n')

        for (const cat of activeCategories) {
          if (totalIgSent >= igRemainingQuota) {
            console.log(
              `🛑 Daily Instagram DM cap (${stats.instagram.dailyCap}) reached for this run.`,
            )
            break
          }

          const targetQueue = categorizedIg[cat].slice(
            0,
            Math.min(limitPerCategory, igRemainingQuota - totalIgSent),
          )
          if (targetQueue.length === 0) continue

          console.log(
            `\n🚀 Starting Instagram Category: ${cat.toUpperCase()} (${targetQueue.length} targets)`,
          )

          for (let i = 0; i < targetQueue.length; i++) {
            const artist = targetQueue[i]
            const cleanHandle = artist.instagramHandle.replace(/^@/, '').trim().toLowerCase()
            const msg = generateDynamicInstagramMessage({
              handle: cleanHandle,
              name: artist.name,
              category: cat,
            })

            console.log(
              `\n[IG ${totalIgSent + 1}/${igRemainingQuota}] 🎯 Sending DM to: @${cleanHandle} (${cleanArtistNameForGreeting(artist.name)})`,
            )

            try {
              // Direct navigation to clean composer
              await page.goto('https://www.instagram.com/direct/new/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
              })
              await sleep(2000)

              const searchInput = page
                .locator('input[placeholder*="Search"], input[name="queryBox"], input[type="text"]')
                .first()
              await searchInput.waitFor({ state: 'visible', timeout: 10000 })
              await searchInput.click()
              await searchInput.fill(cleanHandle)
              await sleep(2500)

              const userRow = page
                .locator(
                  `div[role="dialog"] div[role="button"]:has-text("${cleanHandle}"), div[role="dialog"] span:has-text("${cleanHandle}")`,
                )
                .first()
              if (await userRow.isVisible({ timeout: 4000 }).catch(() => false)) {
                await userRow.click({ force: true })
                await sleep(1000)

                const chatBtn = page
                  .locator(
                    'div[role="dialog"] div[role="button"]:has-text("Chat"), div[role="dialog"] button:has-text("Chat"), button:has-text("Chat")',
                  )
                  .first()
                if (await chatBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
                  await chatBtn.click({ force: true })
                  await sleep(2500)
                }
              } else {
                console.warn(
                  `   ⏩ Could not locate @${cleanHandle} in Direct user search. Skipping.`,
                )
                continue
              }

              // Locate message box and simulate human keystrokes
              const textBox = page
                .locator(
                  'div[aria-label="Message"][contenteditable="true"], div[role="textbox"][contenteditable="true"]',
                )
                .first()
              await textBox.waitFor({ state: 'visible', timeout: 12000 })
              await textBox.click({ force: true })
              await sleep(400)

              const lines = msg.split('\n')
              for (let l = 0; l < lines.length; l++) {
                const line = lines[l]
                if (line) {
                  for (const ch of line) {
                    await page.keyboard.type(ch, { delay: Math.floor(Math.random() * 25) + 15 })
                  }
                }
                if (l < lines.length - 1) {
                  await page.keyboard.press('Shift+Enter')
                  await sleep(80)
                }
              }

              await sleep(800)

              // Dispatch
              const sendBtn = page
                .locator('div[role="button"]:has-text("Send"), button:has-text("Send")')
                .first()
              if (await sendBtn.isVisible({ timeout: 800 }).catch(() => false)) {
                await sendBtn.click({ force: true })
              } else {
                await page.keyboard.press('Enter')
              }

              await sleep(2000)
              await logInstagramOutreachMessage({ artistId: artist.id, body: msg, status: 'sent' })
              await markArtistContacted(artist.id, `omnichannel-${cat}-instagram`)
              totalIgSent++
              console.log(`   ✅ Direct message dispatched on Instagram!`)

              // Anti-ban cooldown breaks & jitter
              if (totalIgSent % 4 === 0 && i < targetQueue.length - 1) {
                console.log(
                  '   ☕ Micro-cooldown break: 3 minutes pause to protect Instagram account trust score...',
                )
                await sleep(180000)
              } else if (i < targetQueue.length - 1) {
                const delay = getJitter(50, 85)
                console.log(`   ⏳ Jitter delay: waiting ${Math.round(delay / 1000)}s...`)
                await sleep(delay)
              }
            } catch (dmErr: any) {
              console.warn(
                `   ❌ Instagram DM dispatch error for @${cleanHandle}: ${dmErr.message}`,
              )
            }
          }

          if (activeCategories.indexOf(cat) < activeCategories.length - 1) {
            console.log('\n⏸️ Category complete. 2-minute inter-category cooldown...')
            await sleep(120000)
          }
        }

        await context.close()
      }
    }
  }

  console.log('\n================================================================')
  console.log('🎉 Omnichannel Outreach Run Completed!')
  console.log(`   • Total WhatsApp Messages Sent: ${totalWaSent}`)
  console.log(`   • Total Instagram DMs Sent:      ${totalIgSent}`)
  console.log(`   • Total Duration:                ${Math.round((Date.now() - startTime) / 1000)}s`)
  console.log('================================================================\n')

  await closeDbPool()
  process.exit(0)
}

main().catch(async (err) => {
  console.error('Fatal orchestrator error:', err)
  await closeDbPool()
  process.exit(1)
})
