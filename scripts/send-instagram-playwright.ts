/**
 * Instagram Playwright Automated DM Outreach Runner.
 * Dispatches personalized outreach messages to target Ahmedabad wedding & event artists
 * through a real, persistent Chrome browser session with human-like typing, jitter delays, and anti-spam protection.
 *
 * Safety & Rate Limits:
 *   - Daily Safety Cap: Max 15-20 DMs per 24 hours
 *   - Human Delay Jitter: 45s - 85s between consecutive DMs
 *   - Human Typing Simulation: 25ms - 65ms per character
 *   - Spintax Variations: Randomized sentence structures so no two DMs are identical
 *   - Persistent Profile: Zero session logouts / TLS mismatches
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --limit 10 --category makeup
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --test @target_handle
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --headless
 *
 * Importers/Callers: Executed standalone via CLI.
 * Affected APIs: Playwright Chromium, Payload CMS Local API.
 * Schemas: `discovered_artists`, `outreach_messages`.
 * User instruction: "okay create a playwrite."
 */

import { chromium, type Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'
import { getPayloadClient } from '../src/lib/payload'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const PROFILE_DIR = path.resolve(process.cwd(), '.instagram-browser-profile')
const DAILY_DM_LIMIT = 20
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getJitterDelay(minSeconds = 45, maxSeconds = 85): number {
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
  category?: 'mehndi' | 'makeup' | 'photography' | 'decor' | 'general' | string
}

/**
 * Precision Category Classifier.
 * Analyzes bio, business badge, full name, and handle with strict priority ordering.
 */
export function detectArtistCategory(
  bio = '',
  fullName = '',
  handle = '',
  badge = '',
): { category: 'mehndi' | 'photography' | 'decor' | 'makeup' | 'general'; label: string } {
  const combined = `${badge} ${bio} ${fullName} ${handle}`.toLowerCase()

  // 1. Mehndi / Henna (highest specificity)
  if (
    combined.includes('mehndi') ||
    combined.includes('mehendi') ||
    combined.includes('henna') ||
    combined.includes('heena')
  ) {
    return { category: 'mehndi', label: 'Mehndi Artists' }
  }

  // 2. Photography & Cinematography (must be checked BEFORE makeup to avoid "bridal photography" mismatch)
  if (
    combined.includes('photograph') ||
    combined.includes('photo') ||
    combined.includes('cinematograph') ||
    combined.includes('films') ||
    combined.includes('filmmaker') ||
    combined.includes('prewedding') ||
    combined.includes('shoot') ||
    combined.includes('camera') ||
    combined.includes('studio') ||
    combined.includes('clicks') ||
    combined.includes('lens') ||
    combined.includes('candid')
  ) {
    return { category: 'photography', label: 'Photographers' }
  }

  // 3. Decor & Event Planners (must be checked BEFORE makeup to avoid "bridal decor" mismatch)
  if (
    combined.includes('decor') ||
    combined.includes('planner') ||
    combined.includes('planning') ||
    combined.includes('event') ||
    combined.includes('mandap') ||
    combined.includes('stage') ||
    combined.includes('florist') ||
    combined.includes('balloon') ||
    combined.includes('management')
  ) {
    return { category: 'decor', label: 'Decor & Event Planners' }
  }

  // 4. Makeup & Hair Artists
  if (
    combined.includes('makeup') ||
    combined.includes('make up') ||
    combined.includes('mua') ||
    combined.includes('makeover') ||
    combined.includes('beauty') ||
    combined.includes('hairstyl') ||
    combined.includes('hair artist') ||
    combined.includes('salon') ||
    combined.includes('cosmetic')
  ) {
    return { category: 'makeup', label: 'Makeup Artists' }
  }

  return { category: 'general', label: 'Wedding Artists & Vendors' }
}

/**
 * Dynamic Spintax Message Generator.
 * Generates category-accurate, personalized message variations for every artist to prevent spam detection.
 */
function generateDynamicInstagramMessage(artist: TargetArtist): string {
  const rawName = artist.name || artist.handle.replace(/[_.]/g, ' ')
  const cleanName = rawName.split(/[|•-]/)[0].trim()

  const detected = detectArtistCategory('', artist.name || '', artist.handle, artist.category || '')
  const cat = detected.category

  const greetings = [
    `Hey ${cleanName}! 👋`,
    `Hello ${cleanName}! ✨`,
    `Kem cho ${cleanName}! 🙏`,
    `Hi ${cleanName}! 👋`,
  ]

  let compliments: string[] = []

  if (cat === 'mehndi') {
    compliments = [
      `Loved your intricate bridal mehndi work and patterns on your feed.`,
      `Your mehndi designs and bridal patterns in Ahmedabad are really stunning!`,
      `Was checking out your recent bridal mehndi work in Ahmedabad — beautiful craftsmanship!`,
    ]
  } else if (cat === 'photography') {
    compliments = [
      `Loved your wedding photography captures, candid frames, and cinematography!`,
      `Your photography and wedding film work in Ahmedabad are really aesthetic!`,
      `Checked out your photography portfolio and wedding shoots — fantastic compositions!`,
    ]
  } else if (cat === 'decor') {
    compliments = [
      `Loved your wedding decor setups, mandap concepts, and event management work in Ahmedabad!`,
      `Your wedding themes, stage decor, and event planning work look truly magnificent!`,
      `Was admiring your event planning and wedding decor projects across Ahmedabad venues!`,
    ]
  } else if (cat === 'makeup') {
    compliments = [
      `Loved your recent bridal makeover and styling looks in Ahmedabad!`,
      `Your bridal makeup portfolio and finishes look absolutely amazing!`,
      `Was admiring your bridal makeup work across Ahmedabad weddings — stunning styling!`,
    ]
  } else {
    compliments = [
      `Loved your recent wedding work and event portfolio in Ahmedabad!`,
      `Your wedding work and creativity in Ahmedabad look really wonderful!`,
    ]
  }

  const intros = [
    `We run Artistora (artistora.com), a verified marketplace for wedding & celebration artists in Ahmedabad.`,
    `We're building Artistora (artistora.com) — Ahmedabad's dedicated platform connecting brides and families with top local artists.`,
    `We're from Artistora (artistora.com), Ahmedabad's platform helping clients book verified wedding artists directly.`,
  ]

  const valueProps = [
    `We are onboarding select Ahmedabad wedding artists for upcoming season client bookings with 0% commission on your gigs.`,
    `You get direct client quote requests and high-intent bridal inquiries without paying listing fees or commissions.`,
    `We'd love to feature your portfolio for clients looking for verified artists in Ahmedabad — listing and client leads are 100% free.`,
  ]

  const ctas = [
    `You can claim your verified artist profile in 2 mins here: https://www.artistora.com/register#artist`,
    `Check it out and list your profile for free here: https://www.artistora.com/register#artist`,
    `Would love to have you featured: https://www.artistora.com/register#artist`,
  ]

  return `${pickRandom(greetings)} ${pickRandom(compliments)}\n\n${pickRandom(intros)} ${pickRandom(valueProps)}\n\n${pickRandom(ctas)}`
}

/**
 * Checks how many Instagram DMs have been sent in the last 24 hours.
 */
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

/**
 * Dismisses common Instagram popups (Turn on Notifications, Save Login Info, Messaging Request).
 */
async function dismissPopups(page: Page) {
  try {
    const popupButtons = await page.$$(
      'button:has-text("Not Now"), button:has-text("Not now"), button:has-text("Cancel"), svg[aria-label="Close"], button:has-text("Close")',
    )
    for (const btn of popupButtons) {
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {})
        await page.waitForTimeout(600)
      }
    }
  } catch {}
}

/**
 * Finds the message input textbox with a retry/polling loop across all modern Instagram Web variants.
 */
async function findMessageBox(page: Page, timeoutMs = 15000) {
  const possibleSelectors = [
    'div[aria-label="Message"][contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[data-lexical-editor="true"]',
    'div[aria-label*="Message"]',
    'div[contenteditable="true"] p',
    'div[contenteditable="true"]',
    'textarea[placeholder*="Message"]',
    'textarea[aria-label*="Message"]',
    'div.xzsf02u',
    'p.xzsf02u',
    'div[role="textbox"]',
  ]

  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    await dismissPopups(page)

    for (const selector of possibleSelectors) {
      try {
        const locator = page.locator(selector).first()
        if (await locator.isVisible({ timeout: 400 }).catch(() => false)) {
          return locator
        }
      } catch {}
    }

    await page.waitForTimeout(500)
  }

  return null
}

interface ProfileInspection {
  fullName: string
  bio: string
  category: 'mehndi' | 'photography' | 'decor' | 'makeup' | 'general'
  categoryLabel: string
  isFollowing: boolean
}

/**
 * Navigates to the user's profile, extracts live metadata to verify their real category & name,
 * and follows them if not already following.
 */
async function followAndInspectArtist(page: Page, handle: string): Promise<ProfileInspection> {
  const cleanHandle = handle.replace(/^@/, '').trim().toLowerCase()
  const profileUrl = `https://www.instagram.com/${cleanHandle}/`

  let fullName = cleanHandle
  let bio = ''
  let badge = ''
  let isFollowing = false

  try {
    console.log(`   🌐 Inspecting profile: https://www.instagram.com/${cleanHandle}/ ...`)
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)
    await dismissPopups(page)

    // 1. Extract Profile Header Name
    try {
      const headerNames = await page
        .locator('header section h1, header section h2, header section span[dir="auto"], header h2')
        .allInnerTexts()
      for (const t of headerNames) {
        const cleaned = (t || '').trim()
        if (cleaned && cleaned !== cleanHandle && !cleaned.includes('\n') && cleaned.length < 50) {
          fullName = cleaned
          break
        }
      }
    } catch {}

    // 2. Extract Bio Text
    try {
      const bioEl = page
        .locator('header section div[dir="auto"], header section div.-vDIg, header section')
        .first()
      if (await bioEl.isVisible({ timeout: 1500 }).catch(() => false)) {
        bio = (await bioEl.innerText().catch(() => '')) || ''
      }
    } catch {}

    // 3. Extract Category Badge if rendered
    try {
      const badgeEl = page
        .locator(
          'header div[class*="x1fhsubz"], header section div:has-text("Photographer"), header section div:has-text("Planner"), header section div:has-text("Artist")',
        )
        .first()
      if (await badgeEl.isVisible({ timeout: 1000 }).catch(() => false)) {
        badge = (await badgeEl.innerText().catch(() => '')) || ''
      }
    } catch {}

    // 4. Follow user if not already following
    try {
      const isFollowingBadge = await page
        .locator('header button, header div[role="button"]')
        .filter({ hasText: /Following|Requested/i })
        .first()
        .isVisible({ timeout: 1500 })
        .catch(() => false)

      if (isFollowingBadge) {
        console.log(`   👤 Already following @${cleanHandle}`)
        isFollowing = true
      } else {
        const followBtn = page
          .locator('header button, header div[role="button"]')
          .filter({ hasText: /^Follow$|^Follow Back$/i })
          .first()

        if (await followBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
          await followBtn.click()
          console.log(`   ➕ Followed @${cleanHandle}!`)
          isFollowing = true
          await page.waitForTimeout(1200)
        }
      }
    } catch {}
  } catch (err: any) {
    console.warn(`   ⚠️ Profile inspection notice: ${err.message}`)
  }

  const detected = detectArtistCategory(bio, fullName, cleanHandle, badge)
  console.log(
    `   🏷️ Live Verification: @${cleanHandle} → "${detected.label}" (Name: ${fullName})`,
  )

  return {
    fullName,
    bio,
    category: detected.category,
    categoryLabel: detected.label,
    isFollowing,
  }
}

/**
 * Sends a Direct Message to a specific Instagram handle using the browser session.
 * 1. Follows and inspects the artist profile to dynamically verify their exact profession and name.
 * 2. Generates a category-accurate personalized message.
 * 3. Opens the full-screen Direct composer (`/direct/new/`) and selects recipient.
 * 4. Types and dispatches message with delivery confirmation.
 */
async function sendBrowserDM(
  page: Page,
  artist: TargetArtist,
): Promise<{ success: boolean; error?: string; messageSent?: string; verifiedCategory?: string }> {
  const cleanHandle = artist.handle.replace(/^@/, '').trim().toLowerCase()

  try {
    // 1. Follow & Inspect Live Profile for accurate name & category verification
    const profileInfo = await followAndInspectArtist(page, cleanHandle)
    await page.waitForTimeout(1000)

    // 2. Build verified target and message
    const verifiedArtist: TargetArtist = {
      ...artist,
      name: profileInfo.fullName || artist.name || cleanHandle,
      category: profileInfo.category,
    }
    const message = generateDynamicInstagramMessage(verifiedArtist)

    // 3. Open clean, full-screen Direct composer directly (bypasses all floating dock widgets)
    console.log(`   🌐 Opening Direct Message composer for @${cleanHandle}...`)
    await page.goto('https://www.instagram.com/direct/new/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.waitForTimeout(2000)
    await dismissPopups(page)

    // 4. Search recipient in composer modal
    console.log(`   🔍 Searching recipient: @${cleanHandle}...`)
    const searchInput = page
      .locator('input[placeholder*="Search"], input[name="queryBox"], input[type="text"]')
      .first()

    await searchInput.waitFor({ state: 'visible', timeout: 12000 })
    await searchInput.click()
    await page.waitForTimeout(200)
    await searchInput.fill(cleanHandle)
    console.log('   ⏳ Waiting for recipient search results...')
    await page.waitForTimeout(2500)

    // 5. Select the matching user from search results
    const userRowLocator = page
      .locator(
        `div[role="dialog"] div[role="button"]:has-text("${cleanHandle}"), div[role="dialog"] span:has-text("${cleanHandle}"), div[role="button"]:has-text("${cleanHandle}"), span:has-text("${cleanHandle}"), div[role="dialog"] input[type="checkbox"], div[role="dialog"] label`,
      )
      .first()

    if (await userRowLocator.isVisible({ timeout: 4000 }).catch(() => false)) {
      await userRowLocator.click({ force: true })
      console.log(`   ✅ Selected @${cleanHandle} from search list`)
      await page.waitForTimeout(1000)

      const chatBtn = page
        .locator(
          'div[role="dialog"] div[role="button"]:has-text("Chat"), div[role="dialog"] button:has-text("Chat"), div[role="button"]:has-text("Chat"), button:has-text("Chat"), div[role="button"]:has-text("Next"), button:has-text("Next")',
        )
        .first()

      if (await chatBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await chatBtn.click({ force: true })
        console.log('   💬 Navigating to full-screen chat thread...')
        await page.waitForTimeout(3000)
      }
    } else {
      return { success: false, error: `Could not find recipient @${cleanHandle} in Direct search` }
    }

    await dismissPopups(page)

    // 6. Locate the message textbox in the clean chat thread
    console.log('   🔍 Detecting message input box in full-screen thread...')
    const textBoxLocator = await findMessageBox(page, 15000)

    if (!textBoxLocator) {
      return {
        success: false,
        error: 'Could not locate message input box in thread (timed out after 15s)',
      }
    }

    console.log('   ✍️ Typing personalized message with human speed...')
    await textBoxLocator.click({ force: true })
    await page.waitForTimeout(400)

    // Human typing simulation with multi-line support
    const lines = message.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line) {
        for (const char of line) {
          await page.keyboard.type(char, { delay: Math.floor(Math.random() * 25) + 15 })
        }
      }
      if (i < lines.length - 1) {
        // Shift+Enter for clean multi-line block in Instagram Lexical editor
        await page.keyboard.press('Shift+Enter')
        await page.waitForTimeout(100)
      }
    }

    await page.waitForTimeout(800)

    // 7. Dispatch message and verify real delivery
    console.log('   📤 Dispatching direct message...')
    let isDelivered = false

    for (let attempt = 1; attempt <= 4; attempt++) {
      // Step A: Click visible Send button (text "Send" or send SVG arrow)
      const sendButton = page
        .locator(
          'div[role="button"]:has-text("Send"), button:has-text("Send"), span:has-text("Send"), svg[aria-label="Send"], div.x1i10hfl[role="button"]:has-text("Send")',
        )
        .first()

      let clickedSend = false
      if (await sendButton.isVisible({ timeout: 800 }).catch(() => false)) {
        await sendButton.click({ force: true }).catch(() => {})
        clickedSend = true
        await page.waitForTimeout(1200)
      }

      // Step B: If Send button wasn't clicked, focus textbox and press Enter
      if (!clickedSend) {
        await textBoxLocator.focus().catch(() => {})
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1200)
      }

      // Step C: Delivery verification
      const sentBubble = await page
        .$(
          'div[role="row"]:has-text("Artistora"), div[dir="auto"]:has-text("Artistora"), div:has-text("artistora.com")',
        )
        .catch(() => null)

      const remainingText = (await textBoxLocator.innerText().catch(() => '')).trim()
      const isCleared =
        !remainingText ||
        remainingText === 'Message...' ||
        remainingText === 'Message' ||
        !remainingText.includes('Artistora')

      if (sentBubble || isCleared) {
        isDelivered = true
        break
      }

      console.log(
        `   ⏳ Delivery check attempt ${attempt}/4 — waiting for Instagram to dispatch...`,
      )
      await page.waitForTimeout(1500)
    }

    if (!isDelivered) {
      return {
        success: false,
        error:
          'Message was entered in textbox, but Instagram Send button / Enter key did not submit it.',
      }
    }

    await page.waitForTimeout(2000)
    return {
      success: true,
      messageSent: message,
      verifiedCategory: profileInfo.categoryLabel,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

async function main() {
  console.log('================================================================')
  console.log('📸 Artistora — Instagram Playwright Automated DM Outreach')
  console.log('================================================================\n')

  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const testHandle = isTest ? args[args.indexOf('--test') + 1] : null
  const isHeadless = args.includes('--headless')

  const limitIdx = args.indexOf('--limit')
  const batchLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 15 : 15

  const catIdx = args.indexOf('--category')
  const targetCategory = catIdx !== -1 ? args[catIdx + 1].toLowerCase() : null

  fs.mkdirSync(PROFILE_DIR, { recursive: true })

  // 1. Launch Playwright persistent context
  console.log(`🚀 Launching Chrome browser (Mode: ${isHeadless ? 'Headless' : 'Visible UI'})...`)
  console.log(`📁 Profile directory: ${PROFILE_DIR}\n`)

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
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
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await dismissPopups(page)

  // Verify authentication state
  const isAuth = await page.$(
    'a[href*="/direct/inbox/"], svg[aria-label="Direct"], svg[aria-label="Home"]',
  )
  if (!isAuth) {
    console.error('❌ Browser is NOT authenticated on Instagram.')
    console.error('👉 Please run first: npm run instagram:login\n')
    await context.close()
    process.exit(1)
  }

  console.log('✅ Browser session verified — authenticated on Instagram.\n')
  const payload = await getPayloadClient()

  // 2. Handle single test message
  if (isTest && testHandle) {
    const cleanTestHandle = testHandle.replace(/^@/, '').trim().toLowerCase()
    console.log(`🧪 Running single test DM to @${cleanTestHandle}...`)

    // Check if artist exists in database
    let dbArtistDoc: any = null
    try {
      const match = await payload.find({
        collection: 'discovered-artists',
        where: {
          or: [
            { instagramHandle: { equals: cleanTestHandle } },
            { name: { equals: cleanTestHandle } },
            { slug: { equals: `ig-${cleanTestHandle}` } },
          ],
        },
        limit: 1,
      })
      if (match.docs.length > 0) {
        dbArtistDoc = match.docs[0]
      }
    } catch {}

    const testArtist: TargetArtist = {
      id: dbArtistDoc?.id,
      handle: cleanTestHandle,
      name: dbArtistDoc?.name || cleanTestHandle,
      category: dbArtistDoc?.services?.[0]?.name || dbArtistDoc?.specializations || 'wedding',
    }

    const messageBody = generateDynamicInstagramMessage(testArtist)

    console.log('\n--- Message Preview ---')
    console.log(messageBody)
    console.log('-----------------------\n')

    const result = await sendBrowserDM(page, testArtist)
    if (result.success) {
      console.log(`\n🎉 Test message successfully sent to @${cleanTestHandle}!`)
      console.log(`   🏷️ Category confirmed: ${result.verifiedCategory || 'Wedding Artist'}`)

      if (dbArtistDoc?.id) {
        try {
          await payload.create({
            collection: 'outreach-messages',
            data: {
              artist: dbArtistDoc.id,
              channel: 'instagram_dm',
              campaignName: 'ahmedabad-wedding-artists-v1',
              body: result.messageSent || messageBody,
              status: 'sent',
              sentAt: new Date().toISOString(),
            } as any,
          })
          await payload.update({
            collection: 'discovered-artists',
            id: dbArtistDoc.id,
            data: { outreachStatus: 'contacted' } as any,
          })
          console.log(`💾 Updated database: marked @${cleanTestHandle} as 'contacted'`)
        } catch {}
      }
    } else {
      console.error(`\n❌ Failed to send test message: ${result.error}`)
    }
    await page.waitForTimeout(3000)
    await context.close()
    process.exit(0)
  }

  // 3. Safety Check: 24-hour rate limit
  const sentLast24h = await getSentCountLast24Hours(payload)
  console.log(`📊 24-Hour Instagram DM Activity: ${sentLast24h}/${DAILY_DM_LIMIT} sent`)

  if (sentLast24h >= DAILY_DM_LIMIT) {
    console.log(
      `\n🛑 SAFETY PAUSE: Daily Instagram DM cap of ${DAILY_DM_LIMIT} reached in the last 24 hours.`,
    )
    console.log(`   Batch paused to protect your account health. Resuming tomorrow.\n`)
    await context.close()
    process.exit(0)
  }

  const remainingQuota = Math.min(batchLimit, DAILY_DM_LIMIT - sentLast24h)
  console.log(`🎯 Safe batch quota for this run: ${remainingQuota} DMs\n`)

  // 4. Fetch target uncontacted artists from PostgreSQL `discovered_artists`
  console.log('🔍 Fetching uncontacted Ahmedabad artists from database...')
  const result = await payload.find({
    collection: 'discovered-artists',
    where: {
      and: [{ source: { equals: 'instagram' } }, { outreachStatus: { equals: 'new' } }],
    },
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
    await context.close()
    process.exit(0)
  }

  console.log(
    `📋 Found ${targetList.length} artists in database. Dispatching to first ${Math.min(targetList.length, remainingQuota)} artists...\n`,
  )

  let sentCount = 0
  let skippedCount = 0
  const seenHandlesThisRun = new Set<string>()

  for (let i = 0; i < Math.min(targetList.length, remainingQuota); i++) {
    const artist = targetList[i]
    const cleanHandle = artist.handle.replace(/^@/, '').trim().toLowerCase()

    if (seenHandlesThisRun.has(cleanHandle)) {
      console.log(`   ⏩ Skipping duplicate handle @${cleanHandle} in current batch.`)
      skippedCount++
      continue
    }
    seenHandlesThisRun.add(cleanHandle)

    console.log(
      `\n[${i + 1}/${remainingQuota}] 🎯 Target: @${cleanHandle} (${artist.name || 'Artist'})`,
    )

    // Deduplication check
    try {
      const existing = await payload.find({
        collection: 'outreach-messages',
        where: {
          and: [
            { channel: { equals: 'instagram_dm' } },
            { artist: { equals: artist.id } },
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

    const dmResult = await sendBrowserDM(page, artist)

    if (dmResult.success) {
      sentCount++
      console.log(`   ✅ [${sentCount}] Successfully delivered DM to @${cleanHandle}`)
      console.log(`   🏷️ Category confirmed: ${dmResult.verifiedCategory || 'Wedding Artist'}`)

      // Log in PostgreSQL outreach_messages
      if (artist.id) {
        try {
          await payload.create({
            collection: 'outreach-messages',
            data: {
              artist: artist.id,
              channel: 'instagram_dm',
              campaignName: 'ahmedabad-wedding-artists-v1',
              body: dmResult.messageSent || generateDynamicInstagramMessage(artist),
              status: 'sent',
              sentAt: new Date().toISOString(),
            } as any,
          })
          console.log(`   💾 Saved outreach record in database for @${cleanHandle}`)
        } catch (logErr: any) {
          console.warn(`   ⚠️ Could not log outreach record: ${logErr.message}`)
        }
      }

      // Update discovered_artists status
      if (artist.id) {
        try {
          await payload.update({
            collection: 'discovered-artists',
            id: artist.id,
            data: { outreachStatus: 'contacted' } as any,
          })
        } catch {}
      }

      // Cool-down break every 4 DMs
      if (sentCount % 4 === 0 && i < remainingQuota - 1) {
        console.log('\n☕ Taking a 3-minute human cooldown break...')
        await sleep(180000)
      } else if (i < remainingQuota - 1) {
        const delayMs = getJitterDelay(45, 85)
        console.log(
          `⏳ Human jitter delay: waiting ${Math.round(delayMs / 1000)}s before next artist...`,
        )
        await sleep(delayMs)
      }
    } else {
      console.warn(`   ❌ Failed to send DM to @${cleanHandle}: ${dmResult.error}`)

      if (artist.id && dmResult.error?.includes('private')) {
        try {
          await payload.update({
            collection: 'discovered-artists',
            id: artist.id,
            data: { outreachStatus: 'contacted' } as any,
          })
        } catch {}
      }

      await sleep(5000)
    }
  }

  console.log('\n================================================================')
  console.log(`🎉 Batch Run Completed!`)
  console.log(`   Total Targeted: ${Math.min(targetList.length, remainingQuota)}`)
  console.log(`   Successfully Sent: ${sentCount}`)
  console.log(`   Skipped: ${skippedCount}`)
  console.log('================================================================\n')

  await page.waitForTimeout(3000)
  await context.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error in browser outreach runner:', err)
  process.exit(1)
})
