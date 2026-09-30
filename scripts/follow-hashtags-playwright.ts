/**
 * Instagram Automated Hashtag Follower Script (Playwright Persistent Profile).
 * Searches target hashtags (e.g. #followforfollow, #f4f) and follows recent active posters
 * with human jitter delays, cooldown breaks, and safety limits to protect account standing.
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/follow-hashtags-playwright.ts
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/follow-hashtags-playwright.ts --limit 20
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/follow-hashtags-playwright.ts --tags "followforfollowback,f4f,followme"
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/follow-hashtags-playwright.ts --headless
 *
 * Importers/Callers: Executed standalone via CLI by admin.
 * Affected APIs: Playwright Chromium, Instagram Web.
 * Schemas: Local tracking history (`followed-accounts.json`).
 * User instruction: "this will take time the follow for follow would be instant i need that."
 */

import { chromium, type Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const PROFILE_DIR = path.resolve(process.cwd(), '.instagram-browser-profile')
const TRACKING_FILE = path.resolve(process.cwd(), 'followed-accounts.json')
const DAILY_FOLLOW_LIMIT = 50 // Meta safe limit for follows per 24h
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const DEFAULT_TAGS = [
  'followforfollowback',
  'f4f',
  'follow4follow',
  'followforfollow',
  'followme',
  'instalike',
  'likeforlikes',
]

function getJitterDelay(minSeconds = 15, maxSeconds = 30): number {
  const seconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds
  return seconds * 1000
}

/**
 * Loads the local tracking file of previously followed handles.
 */
function loadFollowHistory(): Set<string> {
  try {
    if (fs.existsSync(TRACKING_FILE)) {
      const data = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'))
      return new Set(Array.isArray(data) ? data : [])
    }
  } catch {}
  return new Set<string>()
}

/**
 * Appends a followed handle to the local tracking history.
 */
function saveFollowHistory(handle: string) {
  try {
    const history = loadFollowHistory()
    history.add(handle.toLowerCase().replace(/^@/, ''))
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(Array.from(history), null, 2))
  } catch {}
}

/**
 * Dismisses common Instagram popups (Turn on Notifications, Save Login Info).
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

async function main() {
  console.log('================================================================')
  console.log('📸 Artistora — Instagram Automated Hashtag Follower')
  console.log('================================================================\n')

  const args = process.argv.slice(2)
  const isHeadless = args.includes('--headless')

  const limitIdx = args.indexOf('--limit')
  const runLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 20 : 20

  const tagsIdx = args.indexOf('--tags')
  const tagList =
    tagsIdx !== -1
      ? args[tagsIdx + 1].split(',').map((t) => t.trim().replace(/^#/, ''))
      : DEFAULT_TAGS

  fs.mkdirSync(PROFILE_DIR, { recursive: true })
  const followHistory = loadFollowHistory()
  console.log(`📋 Total previously followed accounts on record: ${followHistory.size}`)

  // 1. Launch Playwright persistent browser context
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

  console.log('✅ Browser session verified — authenticated on Instagram.')
  console.log(`🎯 Target follow quota for this run: ${runLimit} accounts\n`)

  let totalFollowedThisRun = 0

  for (const tag of tagList) {
    if (totalFollowedThisRun >= runLimit) break

    const tagUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`
    console.log(`\n🔍 Exploring Hashtag: #${tag} (${tagUrl})...`)

    try {
      await page.goto(tagUrl, { waitUntil: 'domcontentloaded', timeout: 35000 })
      await page.waitForTimeout(3000)
      await dismissPopups(page)

      // Collect post links from the hashtag explore grid
      const postLinks: string[] = []
      const postElements = await page.$$('a[href*="/p/"], a[href*="/reel/"]')
      for (const el of postElements) {
        const href = await el.getAttribute('href')
        if (href && (href.startsWith('/p/') || href.startsWith('/reel/'))) {
          const fullUrl = `https://www.instagram.com${href}`
          if (!postLinks.includes(fullUrl)) {
            postLinks.push(fullUrl)
          }
        }
      }

      console.log(`   📸 Found ${postLinks.length} recent posts in #${tag}`)

      for (const postUrl of postLinks) {
        if (totalFollowedThisRun >= runLimit) break

        try {
          console.log(`\n   🖼️ Inspecting post: ${postUrl}`)
          await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 25000 })
          await page.waitForTimeout(2000)
          await dismissPopups(page)

          // 1. Extract post author handle
          const authorHeader = page.locator('header a, div[role="dialog"] header a').first()
          const authorHandle = (await authorHeader.innerText().catch(() => '')).trim().toLowerCase().replace(/^@/, '')

          if (!authorHandle || authorHandle === 'artistoraofficial') {
            continue
          }

          if (followHistory.has(authorHandle)) {
            console.log(`   ⏩ Skipping @${authorHandle} — already in follow history.`)
            continue
          }

          // 2. Locate Follow button in post header
          const followBtn = page
            .locator('header button, div[role="dialog"] header button')
            .filter({ hasText: /^Follow$|^Follow Back$/i })
            .first()

          const isFollowVisible = await followBtn.isVisible({ timeout: 2000 }).catch(() => false)

          if (isFollowVisible) {
            await followBtn.click()
            totalFollowedThisRun++
            saveFollowHistory(authorHandle)
            followHistory.add(authorHandle)

            console.log(`   ➕ [${totalFollowedThisRun}/${runLimit}] Successfully followed @${authorHandle} (from #${tag})`)

            // Human jitter delay between follows
            const delayMs = getJitterDelay(15, 30)
            console.log(`   ⏳ Human jitter delay: waiting ${Math.round(delayMs / 1000)}s...`)
            await sleep(delayMs)

            // Cooldown break every 5 follows
            if (totalFollowedThisRun % 5 === 0 && totalFollowedThisRun < runLimit) {
              console.log('\n☕ Taking a 60-second cooldown break to protect account health...')
              await sleep(60000)
            }
          } else {
            console.log(`   ℹ️ @${authorHandle} is already followed or Follow button not available.`)
          }
        } catch (postErr: any) {
          console.warn(`   ⚠️ Notice inspecting post: ${postErr.message}`)
        }
      }
    } catch (tagErr: any) {
      console.warn(`   ❌ Failed to load hashtag #${tag}: ${tagErr.message}`)
    }
  }

  console.log('\n================================================================')
  console.log(`🎉 Hashtag Follow Run Completed!`)
  console.log(`   Total Followed This Run: ${totalFollowedThisRun}`)
  console.log(`   Total Tracked Follows: ${followHistory.size}`)
  console.log('================================================================\n')

  await page.waitForTimeout(2000)
  await context.close()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error in hashtag follower:', err)
  process.exit(1)
})
