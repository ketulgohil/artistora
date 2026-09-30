/**
 * Instagram Playwright Persistent Browser Login & Authenticator.
 * Launches a real Chromium browser window with a persistent profile so you can log in once.
 * Meta/Instagram treats this as a genuine desktop Chrome session — zero session logouts.
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/login-instagram-browser.ts
 *
 * Importers/Callers: Executed standalone via CLI.
 * Affected APIs: Playwright Chromium, local profile `.instagram-browser-profile/`.
 * Schemas: Browser cookies, IndexedDB, localStorage.
 * User instruction: "okay create a playwrite."
 */

import { chromium } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const PROFILE_DIR = path.resolve(process.cwd(), '.instagram-browser-profile')

async function main() {
  console.log('================================================================')
  console.log('📸 Artistora — Instagram Playwright Browser Authenticator')
  console.log('================================================================\n')

  fs.mkdirSync(PROFILE_DIR, { recursive: true })

  console.log('🚀 Launching real Chrome browser window...')
  console.log(`📁 Profile directory: ${PROFILE_DIR}\n`)

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
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

  console.log('🔍 Checking current authentication state...')

  // Check if already logged in
  const isLoggedIn = async () => {
    try {
      const inboxLink = await page.$('a[href*="/direct/inbox/"]')
      const directSvg = await page.$('svg[aria-label="Direct"]')
      const homeSvg = await page.$('svg[aria-label="Home"]')
      const searchSvg = await page.$('svg[aria-label="Search"]')
      const profileAvatar = await page.$('img[alt*="profile picture"]')
      return Boolean(inboxLink || directSvg || homeSvg || searchSvg || profileAvatar)
    } catch {
      return false
    }
  }

  if (await isLoggedIn()) {
    console.log('\n🎉 You are ALREADY logged in to Instagram in this persistent profile!')
    console.log('✅ Cookies & session are fully active and saved.\n')
    await page.waitForTimeout(2000)
    await context.close()
    process.exit(0)
  }

  console.log('👉 Please log in to your Instagram account in the opened Chrome window.')
  console.log('   (Enter username/password, approve 2FA/notifications if prompted)\n')
  console.log('⏳ Waiting for login detection...')

  let attempts = 0
  const maxAttempts = 120 // 4 minutes

  while (attempts < maxAttempts) {
    await page.waitForTimeout(2000)
    attempts++

    // Handle "Save Your Login Info?" or "Turn on Notifications" modal popups
    try {
      const notNowBtn = await page.$('button:has-text("Not Now"), button:has-text("Not now")')
      if (notNowBtn) {
        await notNowBtn.click().catch(() => {})
      }
    } catch {}

    if (await isLoggedIn()) {
      console.log('\n🎉 Login detected successfully!')
      console.log('💾 Saving persistent browser cookies & local storage...')
      await page.waitForTimeout(3000) // Allow cookies to settle
      await context.close()
      console.log('\n✅ Instagram persistent browser session is permanently ready!')
      console.log('👉 You can now run: npm run outreach:instagram:browser\n')
      process.exit(0)
    }
  }

  console.warn('\n⏱️ Timeout waiting for login. Please run the script again when ready.')
  await context.close()
  process.exit(1)
}

main().catch((err) => {
  console.error('Fatal error in browser login:', err)
  process.exit(1)
})
