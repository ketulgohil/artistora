import { chromium, type Browser } from 'playwright'
import type { InstagramDM } from '../types'

let browser: Browser | null = null
let page: any = null

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Initialize Playwright browser (must be logged into Instagram manually first)
export async function initInstagram(): Promise<{ status: string; message?: string }> {
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-IN',
      // Note: For production, you'd load saved cookies here
    })

    page = await context.newPage()

    // Check if logged in
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' })
    await sleep(3000)

    // Look for login form or logged-in indicators
    const loginForm = await page.locator('input[name="username"]').count()
    if (loginForm > 0) {
      return {
        status: 'not_logged_in',
        message: 'Instagram login required. Please provide session cookies or login manually.',
      }
    }

    return { status: 'ready' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { status: 'error', message }
  }
}

// Send an Instagram DM
export async function sendInstagramDM(dm: InstagramDM): Promise<{ success: boolean; error?: string }> {
  if (!page) {
    return { success: false, error: 'Instagram not initialized. Call initInstagram() first.' }
  }

  try {
    // Navigate to user's profile
    await page.goto(`https://www.instagram.com/${dm.username}/`, { waitUntil: 'domcontentloaded' })
    await sleep(2000)

    // Check if profile exists
    const notFound = await page.locator('text="Sorry, this page isn\'t available."').count()
    if (notFound > 0) {
      return { success: false, error: `Profile @${dm.username} not found` }
    }

    // Click "Message" button
    const messageButton = page.locator('button:has-text("Message"), a:has-text("Message")').first()
    const buttonExists = await messageButton.count()

    if (buttonExists === 0) {
      return { success: false, error: 'Message button not found (profile may be private or account may not be logged in)' }
    }

    await messageButton.click()
    await sleep(2000)

    // Type message in the DM input
    const dmInput = page.locator('[placeholder="Message..."], [aria-label="Message input"]').first()
    const inputExists = await dmInput.count()

    if (inputExists === 0) {
      return { success: false, error: 'DM input not found' }
    }

    await dmInput.fill(dm.message)
    await sleep(500)

    // Send the message
    const sendButton = page.locator('button:has-text("Send")').first()
    await sendButton.click()
    await sleep(2000)

    console.log(`[InstagramDM] Message sent to @${dm.username}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[InstagramDM] Error sending to @${dm.username}:`, message)
    return { success: false, error: message }
  }
}

// Send bulk Instagram DMs
export async function sendBulkInstagramDMs(
  dms: InstagramDM[],
  delayMs: number = 60000 // 1 minute between DMs (Instagram is stricter)
): Promise<Array<{ username: string; success: boolean; error?: string }>> {
  const results: Array<{ username: string; success: boolean; error?: string }> = []

  for (const dm of dms) {
    const result = await sendInstagramDM(dm)
    results.push({ username: dm.username, ...result })

    if (dms.indexOf(dm) < dms.length - 1) {
      await sleep(delayMs)
    }
  }

  return results
}

// Clean up
export async function closeInstagram(): Promise<void> {
  if (browser) {
    await browser.close()
    browser = null
    page = null
  }
}
