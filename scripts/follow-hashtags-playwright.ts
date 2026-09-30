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

      // 1. Scroll page 2-3 times to load fresh post elements in the grid
      for (let s = 0; s < 3; s++) {
        await page.mouse.wheel(0, 1000)
        await page.waitForTimeout(1000)
      }

      // 2. Extract all post URLs from the explore grid
      const postPaths = await page.$$eval('a[href*="/p/"], a[href*="/reel/"]', (anchors) =>
        anchors
          .map((a) => a.getAttribute('href'))
          .filter((href): href is string =>
            Boolean(href && (href.startsWith('/p/') || href.startsWith('/reel/'))),
          ),
      )

      const uniquePostUrls = Array.from(
        new Set(postPaths.map((p) => `https://www.instagram.com${p.split('?')[0]}`)),
      )

      console.log(`   📸 Collected ${uniquePostUrls.length} post links from #${tag}`)

      if (uniquePostUrls.length === 0) {
        console.warn(`   ⚠️ No post links found on #${tag}, trying next tag.`)
        continue
      }

      for (let i = 0; i < uniquePostUrls.length; i++) {
        if (totalFollowedThisRun >= runLimit) break

        const postUrl = uniquePostUrls[i]

        try {
          console.log(`\n[Post ${i + 1}/${uniquePostUrls.length}] 🖼️ Inspecting: ${postUrl}`)
          await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 25000 })
          await page.waitForTimeout(2000)
          await dismissPopups(page)

          // 3. Extract post author username using in-page DOM evaluation
          let authorHandle = ''
          try {
            await page
              .waitForSelector('article, header, main, div[role="main"], h2, a[role="link"]', {
                timeout: 6000,
              })
              .catch(() => {})

            authorHandle = await page.evaluate(() => {
              const RESERVED = new Set([
                'explore',
                'direct',
                'reels',
                'stories',
                'accounts',
                'legal',
                'about',
                'help',
                'api',
                'graphql',
                'p',
                'reel',
                'tv',
                'terms',
                'privacy',
                'locations',
                'threads',
              ])

              // Strategy 1: Header links inside article / post header
              const headerAnchors = document.querySelectorAll(
                'header a, article header a, div[role="dialog"] header a',
              )
              for (const a of headerAnchors) {
                const href = a.getAttribute('href') || ''
                const clean = href
                  .replace(/^\/|\/$/g, '')
                  .split('/')[0]
                  .split('?')[0]
                  .toLowerCase()
                if (clean && !RESERVED.has(clean) && /^[a-z0-9._]{2,35}$/.test(clean)) {
                  return clean
                }
              }

              // Strategy 2: Title tag parsing (e.g., "Name (@handle) on Instagram")
              const title = document.title || ''
              const titleMatch =
                title.match(/\(@([a-zA-Z0-9._]+)\)/) || title.match(/@([a-zA-Z0-9._]+)/)
              if (titleMatch && titleMatch[1]) {
                const t = titleMatch[1].toLowerCase().trim()
                if (!RESERVED.has(t)) return t
              }

              // Strategy 3: OpenGraph title/meta tags
              const og =
                document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
              const ogMatch = og.match(/\(@([a-zA-Z0-9._]+)\)/) || og.match(/@([a-zA-Z0-9._]+)/)
              if (ogMatch && ogMatch[1]) {
                const o = ogMatch[1].toLowerCase().trim()
                if (!RESERVED.has(o)) return o
              }

              // Strategy 4: All links on page
              const allAnchors = document.querySelectorAll('a[role="link"], a[href^="/"]')
              for (const a of allAnchors) {
                const href = a.getAttribute('href') || ''
                const clean = href
                  .replace(/^\/|\/$/g, '')
                  .split('/')[0]
                  .split('?')[0]
                  .toLowerCase()
                if (clean && !RESERVED.has(clean) && /^[a-z0-9._]{2,35}$/.test(clean)) {
                  return clean
                }
              }

              return ''
            })
          } catch (evalErr: any) {
            console.warn(`   ⚠️ Extraction notice: ${evalErr.message}`)
          }

          if (!authorHandle || authorHandle === 'artistoraofficial' || authorHandle.length > 35) {
            console.log('   ℹ️ Could not extract author handle, skipping to next post.')
            continue
          }

          console.log(`   👤 Author: @${authorHandle}`)

          if (followHistory.has(authorHandle)) {
            console.log(`   ⏩ Skipping @${authorHandle} — already in follow history.`)
            continue
          }

          // 4. Try clicking Follow button directly on post header
          const postFollowBtn = page
            .locator('header button, article header button, button:has-text("Follow")')
            .filter({ hasText: /^Follow$|^Follow Back$/i })
            .first()

          let followed = false
          if (await postFollowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   👉 Clicking "Follow" button for @${authorHandle}...`)
            await postFollowBtn.click({ force: true })
            await page.waitForTimeout(1500)
            followed = true
          } else {
            // If follow button wasn't in post header, navigate directly to profile
            console.log(
              `   🌐 Navigating to profile: https://www.instagram.com/${authorHandle}/ ...`,
            )
            await page.goto(`https://www.instagram.com/${authorHandle}/`, {
              waitUntil: 'domcontentloaded',
              timeout: 25000,
            })
            await page.waitForTimeout(2000)
            await dismissPopups(page)

            const isAlreadyFollowing = await page
              .locator('header button, header div[role="button"]')
              .filter({ hasText: /Following|Requested/i })
              .first()
              .isVisible({ timeout: 1500 })
              .catch(() => false)

            if (isAlreadyFollowing) {
              console.log(`   👤 Already following @${authorHandle}`)
              followHistory.add(authorHandle)
              saveFollowHistory(authorHandle)
              continue
            }

            const profileFollowBtn = page
              .locator('header button, header div[role="button"]')
              .filter({ hasText: /^Follow$|^Follow Back$/i })
              .first()

            if (await profileFollowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              console.log(`   👉 Clicking "Follow" button on profile for @${authorHandle}...`)
              await profileFollowBtn.click({ force: true })
              await page.waitForTimeout(1500)
              followed = true
            }
          }

          if (followed) {
            totalFollowedThisRun++
            saveFollowHistory(authorHandle)
            followHistory.add(authorHandle)

            console.log(
              `   ➕ [${totalFollowedThisRun}/${runLimit}] Successfully followed @${authorHandle}! (from #${tag})`,
            )

            // Human jitter delay between follows (12s-22s)
            const delayMs = getJitterDelay(12, 22)
            console.log(`   ⏳ Human jitter delay: waiting ${Math.round(delayMs / 1000)}s...`)
            await sleep(delayMs)

            // Cooldown break every 5 follows
            if (totalFollowedThisRun % 5 === 0 && totalFollowedThisRun < runLimit) {
              console.log('\n☕ Taking a 45-second cooldown break to protect account standing...')
              await sleep(45000)
            }
          } else {
            console.log(`   ℹ️ Follow button not available for @${authorHandle}.`)
          }
        } catch (itemErr: any) {
          console.warn(`   ⚠️ Notice processing post: ${itemErr.message}`)
        }
      }
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
