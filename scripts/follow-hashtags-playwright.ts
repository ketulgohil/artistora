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

      // 1. Locate first post thumbnail on grid
      const firstPostLocator = page.locator('article a[href*="/p/"], main a[href*="/p/"], a[href*="/p/"]').first()
      const isGridVisible = await firstPostLocator.isVisible({ timeout: 10000 }).catch(() => false)

      if (!isGridVisible) {
        console.warn(`   ⚠️ No post grid found on #${tag}, moving to next hashtag.`)
        continue
      }

      console.log('   📸 Opening first post in modal viewer...')
      await firstPostLocator.click({ force: true })
      await page.waitForTimeout(3000)
      await dismissPopups(page)

      let consecutiveSkips = 0
      const maxPostChecks = 100

      for (let step = 0; step < maxPostChecks; step++) {
        if (totalFollowedThisRun >= runLimit) break

        try {
          await dismissPopups(page)

          // 2. Extract author handle from modal header
          const authorHeader = page
            .locator('div[role="dialog"] header a[role="link"], div[role="dialog"] header a, header a')
            .first()

          let authorHandle = ''
          try {
            const raw = (await authorHeader.innerText({ timeout: 3000 }).catch(() => '')).trim().toLowerCase()
            authorHandle = raw.split('\n')[0].replace(/^@/, '').trim()
          } catch {}

          if (!authorHandle || authorHandle === 'artistoraofficial') {
            // Try extracting from header href
            const href = await authorHeader.getAttribute('href').catch(() => '')
            if (href) {
              authorHandle = href.replace(/^\/|\/$/g, '').split('/')[0].toLowerCase().trim()
            }
          }

          if (authorHandle && authorHandle !== 'artistoraofficial') {
            console.log(`\n[Post ${step + 1}] 👤 Author: @${authorHandle}`)

            if (followHistory.has(authorHandle)) {
              console.log(`   ⏩ Skipping @${authorHandle} — already in follow history.`)
              consecutiveSkips++
            } else {
              // 3. Locate Follow button in post modal
              const followBtn = page
                .locator(
                  'div[role="dialog"] header button:has-text("Follow"), div[role="dialog"] header div[role="button"]:has-text("Follow"), div[role="dialog"] button:has-text("Follow"), button:has-text("Follow"):not(:has-text("Following"))',
                )
                .first()

              const isFollowVisible = await followBtn.isVisible({ timeout: 2500 }).catch(() => false)

              if (isFollowVisible) {
                console.log(`   👉 Clicking "Follow" button for @${authorHandle}...`)
                await followBtn.click({ force: true })
                await page.waitForTimeout(1500)

                totalFollowedThisRun++
                saveFollowHistory(authorHandle)
                followHistory.add(authorHandle)
                consecutiveSkips = 0

                console.log(
                  `   ➕ [${totalFollowedThisRun}/${runLimit}] Successfully followed @${authorHandle}! (from #${tag})`,
                )

                // Human delay jitter between follows (12s-22s)
                const delayMs = getJitterDelay(12, 22)
                console.log(`   ⏳ Human jitter delay: waiting ${Math.round(delayMs / 1000)}s...`)
                await sleep(delayMs)

                // Cooldown break every 5 follows
                if (totalFollowedThisRun % 5 === 0 && totalFollowedThisRun < runLimit) {
                  console.log('\n☕ Taking a 45-second cooldown break to protect account standing...')
                  await sleep(45000)
                }
              } else {
                // Check if already following
                const isFollowing = await page
                  .locator('div[role="dialog"] header button:has-text("Following"), div[role="dialog"] header button:has-text("Requested")')
                  .first()
                  .isVisible({ timeout: 1000 })
                  .catch(() => false)

                if (isFollowing) {
                  console.log(`   👤 Already following @${authorHandle}`)
                  followHistory.add(authorHandle)
                  saveFollowHistory(authorHandle)
                } else {
                  console.log(`   ℹ️ Follow button not visible on post header for @${authorHandle}`)
                }
              }
            }
          }

          // 4. Advance to Next post using keyboard ArrowRight or next arrow button
          const nextBtn = page.locator('svg[aria-label="Next"], div[role="dialog"] button:has-text("Next"), div._aaqg button').first()
          if (await nextBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
            await nextBtn.click({ force: true })
          } else {
            await page.keyboard.press('ArrowRight')
          }
          await page.waitForTimeout(1500)
        } catch (stepErr: any) {
          console.warn(`   ⚠️ Notice moving to next post: ${stepErr.message}`)
          await page.keyboard.press('ArrowRight').catch(() => {})
          await page.waitForTimeout(1500)
        }
      }

      // Close modal before navigating to next tag
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(1500)
    } catch (tagErr: any) {
      console.warn(`   ❌ Failed to explore hashtag #${tag}: ${tagErr.message}`)
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
