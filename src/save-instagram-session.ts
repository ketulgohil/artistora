import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function saveSession() {
  const sessionDir = path.join(process.cwd(), 'instagram-session')
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()
  await page.goto('https://www.instagram.com/')

  console.log('\n========================================')
  console.log('Browser is open at instagram.com')
  console.log('Please log in to your account.')
  console.log('When done, come back here and press ENTER.')
  console.log('========================================\n')

  // Wait for user to press Enter
  await new Promise(resolve => process.stdin.once('data', resolve))
  await sleep(2000)

  // Save session
  const state = await context.storageState()
  fs.writeFileSync(path.join(sessionDir, 'state.json'), JSON.stringify(state, null, 2))
  console.log(`[Instagram] Session saved to ${sessionDir}/state.json`)

  await browser.close()
}

saveSession().catch(err => {
  console.error('[Instagram] Error:', err.message)
  process.exit(1)
})
