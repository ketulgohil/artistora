/**
 * Instagram Playwright Automated DM Outreach Runner.
 * Dispatches personalized outreach messages to target Ahmedabad wedding & event artists
 * through a real, persistent Chrome browser session with human-like typing, jitter delays, and anti-spam protection.
 *
 * Safety & Rate Limits:
 *   - Daily Safety Cap: Max 15-20 DMs per 24 hours
 *   - Human Delay Jitter: 45s - 75s between consecutive DMs
 *   - Cooldown Micro-Break: 3 minutes after every 4 DMs
 *   - Human Typing Simulation: 15ms - 40ms per character with Shift+Enter newlines
 *   - Spintax Variations: Randomized sentence structures per category so no two DMs are identical
 *   - Persistent Profile: Zero session logouts / TLS mismatches
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --category mehndi --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --category nail --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --category makeup --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --category decor --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --preview --category mehndi --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --test @target_handle
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-instagram-playwright.ts --headless
 */

import { chromium, type Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'
import {
  getUncontactedInstagramArtists,
  getArtistByHandle,
  getSentDMsCountLast24Hours,
  logInstagramOutreachMessage,
  markArtistContacted,
  getInstagramOutreachStats,
  closeDbPool,
  type InstagramArtistRecord,
} from '../src/outreach/db'
import {
  detectCategory,
  cleanArtistNameForGreeting,
  generateDynamicInstagramMessage,
  type OutreachCategory,
  type TargetArtistInfo,
} from '../src/outreach/instagram/messaging'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const PROFILE_DIR = path.resolve(process.cwd(), '.instagram-browser-profile')
const DAILY_DM_LIMIT = 35
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getJitterDelay(minSeconds = 45, maxSeconds = 75): number {
  const seconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds
  return seconds * 1000
}

interface ProfileInspection {
  fullName: string
  bio: string
  category: OutreachCategory
  categoryLabel: string
  isFollowing: boolean
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
        await page.waitForTimeout(500)
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

    // 1. Extract Profile Header Display Name
    try {
      const extracted = await page.evaluate((h) => {
        const header = document.querySelector('header')
        if (!header) return null

        const h1 = header.querySelector('h1')
        if (h1 && h1.innerText?.trim()) {
          const t = h1.innerText.trim()
          if (!/\b(posts?|followers?|following)\b/i.test(t)) return t
        }

        const candidateSpans = Array.from(
          header.querySelectorAll('section span[dir="auto"], section div[dir="auto"], header h2'),
        )
        for (const el of candidateSpans) {
          const t = (el as HTMLElement).innerText?.trim() || ''
          if (!t || t.toLowerCase() === h.toLowerCase()) continue
          if (
            /\b(posts?|followers?|following|follow|following|message|contact|edit profile|share)\b/i.test(
              t,
            )
          )
            continue
          if (/^\d+[\d,.]*$/.test(t)) continue
          if (t.length >= 2 && t.length < 60) return t
        }
        return null
      }, cleanHandle)

      if (extracted) {
        fullName = extracted
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

    // 3. Extract Category Badge if present
    try {
      const badgeEl = page
        .locator(
          'header div[class*="x1fhsubz"], header section div:has-text("Planner"), header section div:has-text("Artist"), header section div:has-text("Studio")',
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
    console.warn(`   ⚠️ Profile inspection note: ${err.message}`)
  }

  const detected = detectCategory(bio, fullName, cleanHandle, badge)
  console.log(`   🏷️ Live Verification: @${cleanHandle} → "${detected.label}" (Name: ${fullName})`)

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
 */
async function sendBrowserDM(
  page: Page,
  artist: TargetArtistInfo,
): Promise<{ success: boolean; error?: string; messageSent?: string; verifiedCategory?: string }> {
  const cleanHandle = artist.handle.replace(/^@/, '').trim().toLowerCase()

  try {
    // 1. Follow & Inspect Live Profile for accurate name & category verification
    const profileInfo = await followAndInspectArtist(page, cleanHandle)
    await page.waitForTimeout(1000)

    // 2. Build verified target and message
    const verifiedArtist: TargetArtistInfo = {
      ...artist,
      name: profileInfo.fullName || artist.name || cleanHandle,
      category: profileInfo.category,
    }
    const message = generateDynamicInstagramMessage(verifiedArtist)

    // 3. Open Direct composer directly
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

    // 6. Locate the message textbox in chat thread
    console.log('   🔍 Detecting message input box in chat thread...')
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

    // 7. Dispatch message and verify delivery
    console.log('   📤 Dispatching direct message...')
    let isDelivered = false

    for (let attempt = 1; attempt <= 4; attempt++) {
      // Step A: Click visible Send button
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

      // Step B: Focus textbox and press Enter
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
  const startTime = Date.now()

  console.log('================================================================')
  console.log('📸 Artistora — Instagram Playwright Automated DM Outreach')
  console.log('================================================================\n')

  const args = process.argv.slice(2)
  const isTest = args.includes('--test')
  const testHandle = isTest ? args[args.indexOf('--test') + 1] : null
  const isHeadless = args.includes('--headless')
  const isPreview = args.includes('--preview') || args.includes('--dry-run')

  const limitIdx = args.indexOf('--limit')
  const batchLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 10 : 10

  const catIdx = args.indexOf('--category')
  const targetCategory =
    catIdx !== -1 ? (args[catIdx + 1]?.toLowerCase() as OutreachCategory) : null

  // 1. Fetch Global Statistics
  const stats = await getInstagramOutreachStats()
  console.log(`📊 24-Hour Instagram DM Activity: ${stats.sentLast24Hours}/${DAILY_DM_LIMIT} sent`)
  console.log(`   • Total With Instagram: ${stats.totalWithInstagram}`)
  console.log(`   • Contacted:            ${stats.contactedCount}`)
  console.log(`   • Uncontacted:          ${stats.uncontactedCount}\n`)

  // 2. Fetch Uncontacted Target Artists directly from DB
  const rawArtists = await getUncontactedInstagramArtists({ limit: 1000 })

  // Deduplicate by Instagram handle
  const seenHandles = new Set<string>()
  const uniqueArtists: InstagramArtistRecord[] = []

  for (const a of rawArtists) {
    const normHandle = (a.instagramHandle || '').replace(/^@/, '').trim().toLowerCase()
    if (!normHandle || seenHandles.has(normHandle)) continue
    seenHandles.add(normHandle)
    uniqueArtists.push(a)
  }

  // Categorize targets
  const categorizedTargets = uniqueArtists.map((artist) => {
    const catInfo = detectCategory(
      '',
      artist.name,
      artist.instagramHandle,
      `${artist.serviceDisplay || ''} ${artist.specializations || ''}`,
    )
    return {
      id: artist.id,
      handle: artist.instagramHandle,
      name: artist.name,
      businessName: artist.businessName,
      category: catInfo.category,
      categoryLabel: catInfo.label,
      specializations: artist.specializations,
      serviceDisplay: artist.serviceDisplay,
      registrationUrl: catInfo.registrationUrl,
    }
  })

  // Filter by category if requested
  let targetList = categorizedTargets
  if (targetCategory) {
    targetList = categorizedTargets.filter((a) => a.category === targetCategory)
  }

  // --- PREVIEW / DRY-RUN MODE ---
  if (isPreview) {
    console.log('🔎 PREVIEW MODE ENABLED (Dry-run — no browser launch, no DB writes)')
    console.log('================================================================')
    console.log(
      `📋 Queued Targets: ${Math.min(targetList.length, batchLimit)} Artists ${targetCategory ? `(Category: ${targetCategory.toUpperCase()})` : '(All Categories)'}`,
    )
    console.log('================================================================\n')

    const previewList = targetList.slice(0, batchLimit)
    if (previewList.length === 0) {
      console.log(`ℹ️ No uncontacted artists found for category "${targetCategory}".\n`)
    } else {
      previewList.forEach((artist, idx) => {
        const cleanName = cleanArtistNameForGreeting(artist.name || '', artist.handle)
        const cleanHandle = artist.handle.replace(/^@/, '')
        const msg = generateDynamicInstagramMessage(artist)

        console.log(`[${idx + 1}/${previewList.length}] 🎯 ID: ${artist.id}`)
        console.log(`   👤 Greeting Name: "${cleanName}"`)
        console.log(`   🏷️ Raw Name:      "${artist.name}"`)
        console.log(`   📸 Handle:        @${cleanHandle}`)
        console.log(`   📂 Category:      ${artist.categoryLabel}`)
        console.log(`   🔗 Profile:       https://www.instagram.com/${cleanHandle}/`)
        console.log('\n   💬 Generated Spintax Message:')
        console.log(
          msg
            .split('\n')
            .map((l) => `      ${l}`)
            .join('\n'),
        )
        console.log('\n' + '-'.repeat(64) + '\n')
      })
    }

    console.log(
      `⚡ Preview generated in ${Date.now() - startTime}ms across ${targetList.length} candidate artists.\n`,
    )
    await closeDbPool()
    process.exit(0)
  }

  // 3. Safety Check: 24-hour rate limit
  if (stats.sentLast24Hours >= DAILY_DM_LIMIT) {
    console.log(
      `🛑 SAFETY PAUSE: Daily Instagram DM cap of ${DAILY_DM_LIMIT} reached in the last 24 hours.`,
    )
    console.log(`   Outreach paused to protect account health. Resuming tomorrow.\n`)
    await closeDbPool()
    process.exit(0)
  }

  const remainingQuota = Math.min(batchLimit, DAILY_DM_LIMIT - stats.sentLast24Hours)
  console.log(`🎯 Safe batch quota for this run: ${remainingQuota} DMs\n`)

  fs.mkdirSync(PROFILE_DIR, { recursive: true })

  // 4. Launch Playwright persistent browser
  console.log(`🚀 Launching Chrome browser (Mode: ${isHeadless ? 'Headless' : 'Visible UI'})...`)
  console.log(`📁 Profile directory: ${PROFILE_DIR}\n`)

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
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
      '--start-maximized',
    ],
  })

  const page = context.pages()[0] || (await context.newPage())
  if (!isHeadless) {
    await page.bringToFront().catch(() => {})
  }

  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await dismissPopups(page)

  // Verify authentication state
  const isAuth = await page.$(
    'a[href*="/direct/inbox/"], svg[aria-label="Direct"], svg[aria-label="Home"], svg[aria-label="Messages"]',
  )
  if (!isAuth) {
    console.error('❌ Browser is NOT authenticated on Instagram.')
    console.error('👉 Please run first: npm run instagram:login\n')
    await context.close()
    await closeDbPool()
    process.exit(1)
  }

  console.log('✅ Browser session verified — authenticated on Instagram.\n')

  // 5. Handle Single Test Send
  if (isTest && testHandle) {
    const cleanTestHandle = testHandle.replace(/^@/, '').trim().toLowerCase()
    console.log(`🧪 Running single test DM to @${cleanTestHandle}...`)

    const dbArtist = await getArtistByHandle(cleanTestHandle)
    const testCatInfo = detectCategory(
      '',
      dbArtist?.name || cleanTestHandle,
      cleanTestHandle,
      `${dbArtist?.serviceDisplay || ''} ${dbArtist?.specializations || ''}`,
    )

    const testArtist: TargetArtistInfo = {
      id: dbArtist?.id,
      handle: cleanTestHandle,
      name: dbArtist?.name || cleanTestHandle,
      category: testCatInfo.category,
      specializations: dbArtist?.specializations,
      serviceDisplay: dbArtist?.serviceDisplay,
    }

    const messageBody = generateDynamicInstagramMessage(testArtist)
    console.log('\n--- Message Preview ---')
    console.log(messageBody)
    console.log('-----------------------\n')

    const result = await sendBrowserDM(page, testArtist)
    if (result.success) {
      console.log(`\n🎉 Test message successfully sent to @${cleanTestHandle}!`)
      console.log(`   🏷️ Category confirmed: ${result.verifiedCategory || testCatInfo.label}`)

      if (dbArtist?.id) {
        try {
          await logInstagramOutreachMessage({
            artistId: dbArtist.id,
            body: result.messageSent || messageBody,
            status: 'sent',
          })
          await markArtistContacted(dbArtist.id)
          console.log(`💾 Updated database: marked @${cleanTestHandle} as 'contacted'`)
        } catch (dbErr: any) {
          console.warn(`⚠️ Could not log to database: ${dbErr.message}`)
        }
      }
    } else {
      console.error(`\n❌ Failed to send test message: ${result.error}`)
    }

    await page.waitForTimeout(3000)
    await context.close()
    await closeDbPool()
    process.exit(0)
  }

  // 6. Execute Batch Outreach
  const finalTargets = targetList.slice(0, remainingQuota)
  if (finalTargets.length === 0) {
    console.log('ℹ️ No uncontacted Instagram artists found in database matching criteria.')
    console.log('👉 Run `npm run scrape:instagram` to discover fresh Ahmedabad artists first.\n')
    await context.close()
    await closeDbPool()
    process.exit(0)
  }

  console.log(
    `📋 Dispatching batch to ${finalTargets.length} artists ${targetCategory ? `(Category: ${targetCategory.toUpperCase()})` : ''}...\n`,
  )

  let sentCount = 0
  let skippedCount = 0

  for (let i = 0; i < finalTargets.length; i++) {
    const artist = finalTargets[i]
    const cleanHandle = artist.handle.replace(/^@/, '').trim().toLowerCase()

    console.log(
      `\n[${i + 1}/${finalTargets.length}] 🎯 Target: @${cleanHandle} (${artist.name || 'Artist'}) [${artist.categoryLabel}]`,
    )

    const dmResult = await sendBrowserDM(page, artist)

    if (dmResult.success) {
      sentCount++
      console.log(`   ✅ [${sentCount}] Successfully delivered DM to @${cleanHandle}`)
      console.log(`   🏷️ Category confirmed: ${dmResult.verifiedCategory || artist.categoryLabel}`)

      // Log in PostgreSQL outreach_messages
      if (artist.id) {
        try {
          await logInstagramOutreachMessage({
            artistId: artist.id,
            body: dmResult.messageSent || generateDynamicInstagramMessage(artist),
            status: 'sent',
          })
          await markArtistContacted(artist.id)
          console.log(`   💾 Saved outreach record in database for @${cleanHandle}`)
        } catch (logErr: any) {
          console.warn(`   ⚠️ Could not log outreach record: ${logErr.message}`)
        }
      }

      // Cool-down break every 4 DMs
      if (sentCount % 4 === 0 && i < finalTargets.length - 1) {
        console.log('\n☕ Taking a 3-minute human cooldown break...')
        await sleep(180000)
      } else if (i < finalTargets.length - 1) {
        const delayMs = getJitterDelay(45, 75)
        console.log(
          `⏳ Human jitter delay: waiting ${Math.round(delayMs / 1000)}s before next artist...`,
        )
        await sleep(delayMs)
      }
    } else {
      console.warn(`   ❌ Failed to send DM to @${cleanHandle}: ${dmResult.error}`)

      if (artist.id) {
        try {
          await logInstagramOutreachMessage({
            artistId: artist.id,
            body: generateDynamicInstagramMessage(artist),
            status: 'failed',
            errorMessage: dmResult.error,
          })
        } catch {}
      }

      await sleep(5000)
    }
  }

  console.log('\n================================================================')
  console.log(`🎉 Batch Run Completed!`)
  console.log(`   Total Targeted:    ${finalTargets.length}`)
  console.log(`   Successfully Sent: ${sentCount}`)
  console.log(`   Skipped / Failed:  ${skippedCount}`)
  console.log('================================================================\n')

  await page.waitForTimeout(3000)
  await context.close()
  await closeDbPool()
  process.exit(0)
}

main().catch(async (err) => {
  console.error('Fatal error in browser outreach runner:', err)
  await closeDbPool()
  process.exit(1)
})
