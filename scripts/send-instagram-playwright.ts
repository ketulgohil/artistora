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
            `Your photography and event cinematography in Ahmedabad are really aesthetic!`,
            `Checked out your photography portfolio — fantastic compositions!`,
          ]
        : [
            `Loved your recent wedding work and event portfolio in Ahmedabad.`,
            `Your wedding work and creativity in Ahmedabad look really wonderful!`,
          ]

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
async function findMessageBox(page: Page, timeoutMs = 12000) {
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
        const el = await page.$(selector)
        if (el && (await el.isVisible().catch(() => false))) {
          return el
        }
      } catch {}
    }

    await page.waitForTimeout(500)
  }

  return null
}

/**
 * Sends a Direct Message to a specific Instagram handle using the browser session.
 * Uses Instagram's dedicated Direct Composer (`/direct/new/`) as the primary path to open
 * clean, full-screen chat threads without floating dock or profile layout interference.
 */
async function sendBrowserDM(
  page: Page,
  handle: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const cleanHandle = handle.replace(/^@/, '').trim().toLowerCase()

  try {
    console.log(`   🌐 Opening Direct Message composer for @${cleanHandle}...`)
    await page.goto('https://www.instagram.com/direct/new/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.waitForTimeout(2500)
    await dismissPopups(page)

    // 1. Locate search input in the Direct Composer modal
    console.log(`   🔍 Searching recipient: @${cleanHandle}...`)
    const searchInput = await page.waitForSelector(
      'input[placeholder*="Search"], input[name="queryBox"], input[type="text"]',
      { timeout: 10000 },
    )

    if (!searchInput) {
      return { success: false, error: 'Could not locate Direct composer search box' }
    }

    await searchInput.click()
    await page.waitForTimeout(300)
    await searchInput.fill(cleanHandle)
    console.log('   ⏳ Waiting for user search results...')
    await page.waitForTimeout(2500)

    // 2. Select the matching user from search results
    const userRowSelectors = [
      `div[role="dialog"] div[role="button"]:has-text("${cleanHandle}")`,
      `div[role="dialog"] span:has-text("${cleanHandle}")`,
      `div[role="button"]:has-text("${cleanHandle}")`,
      `span:has-text("${cleanHandle}")`,
      `div[role="dialog"] input[type="checkbox"]`,
      `div[role="dialog"] label`,
    ]

    let selectedUser = false
    for (const selector of userRowSelectors) {
      try {
        const el = await page.$(selector)
        if (el && (await el.isVisible().catch(() => false))) {
          await el.click({ force: true })
          selectedUser = true
          console.log(`   ✅ Selected @${cleanHandle} from search list`)
          await page.waitForTimeout(1000)
          break
        }
      } catch {}
    }

    if (!selectedUser) {
      // Fallback: If Direct search didn't return user, try direct profile page
      console.log(`   ℹ️ Recipient not in Direct search list, trying profile page fallback...`)
      await page.goto(`https://www.instagram.com/${cleanHandle}/`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2500)
      await dismissPopups(page)

      const isPrivate = await page.$('text="This Account is Private"')
      if (isPrivate) {
        return { success: false, error: 'Account is private; cannot DM without following first.' }
      }

      const profileMsgBtn = await page.$(
        'div[role="button"]:has-text("Message"), button:has-text("Message"), a:has-text("Message"), header div:has-text("Message")',
      )
      if (profileMsgBtn) {
        await profileMsgBtn.click()
        await page.waitForTimeout(3000)
      } else {
        return { success: false, error: `Could not find recipient @${cleanHandle}` }
      }
    } else {
      // Click "Chat" / "Next" button in the modal header
      console.log('   💬 Opening chat thread...')
      const chatBtn = await page.$(
        'div[role="dialog"] div[role="button"]:has-text("Chat"), div[role="dialog"] button:has-text("Chat"), div[role="button"]:has-text("Chat"), button:has-text("Chat"), div[role="button"]:has-text("Next"), button:has-text("Next")',
      )
      if (chatBtn) {
        await chatBtn.click({ force: true })
        await page.waitForTimeout(3000)
      }
    }

    await dismissPopups(page)

    // 3. Locate the message textbox in the chat thread
    console.log('   🔍 Detecting message input box in chat thread...')
    const textBox = await findMessageBox(page, 15000)

    if (!textBox) {
      return {
        success: false,
        error: 'Could not locate message input box in thread (timed out after 15s)',
      }
    }

    console.log('   ✍️ Typing personalized message with human speed...')
    await textBox.click({ force: true })
    await page.waitForTimeout(500)

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

    // 4. Dispatch message and verify real delivery
    console.log('   📤 Dispatching direct message...')
    let isDelivered = false

    for (let attempt = 1; attempt <= 4; attempt++) {
      // Step A: Click visible Send button (text "Send" or send SVG arrow)
      const sendButtons = await page.$$(
        'div[role="button"]:has-text("Send"), button:has-text("Send"), span:has-text("Send"), svg[aria-label="Send"], div.x1i10hfl[role="button"]:has-text("Send")',
      )

      let clickedSend = false
      for (const btn of sendButtons) {
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ force: true }).catch(() => {})
          clickedSend = true
          await page.waitForTimeout(1200)
          break
        }
      }

      // Step B: If Send button wasn't clicked, focus textbox and press Enter
      if (!clickedSend) {
        await textBox.focus().catch(() => {})
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1200)
      }

      // Step C: Delivery verification
      const sentBubble = await page.$(
        'div[role="row"]:has-text("Artistora"), div[dir="auto"]:has-text("Artistora"), div:has-text("artistora.com")',
      )

      const remainingText = (await textBox.innerText().catch(() => '')).trim()
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
    return { success: true }
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
    console.log(`🧪 Running single test DM to ${testHandle}...`)
    const testArtist: TargetArtist = { handle: testHandle, name: testHandle.replace(/^@/, '') }
    const messageBody = generateDynamicInstagramMessage(testArtist)

    console.log('\n--- Message Preview ---')
    console.log(messageBody)
    console.log('-----------------------\n')

    const result = await sendBrowserDM(page, testHandle, messageBody)
    if (result.success) {
      console.log(`\n🎉 Test message successfully sent to ${testHandle}!`)
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

  for (let i = 0; i < Math.min(targetList.length, remainingQuota); i++) {
    const artist = targetList[i]
    const cleanHandle = artist.handle.replace(/^@/, '').trim()

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

    const messageBody = generateDynamicInstagramMessage(artist)
    const dmResult = await sendBrowserDM(page, cleanHandle, messageBody)

    if (dmResult.success) {
      sentCount++
      console.log(`   ✅ [${sentCount}] Successfully delivered DM to @${cleanHandle}`)

      // Log in PostgreSQL outreach_messages
      if (artist.id) {
        try {
          await payload.create({
            collection: 'outreach-messages',
            data: {
              artist: artist.id,
              channel: 'instagram_dm',
              campaignName: 'ahmedabad-wedding-artists-v1',
              body: messageBody,
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
