/**
 * Debug WhatsApp Web page state and take a screenshot
 */
import { loadSessionFromRedis } from '../src/outreach/whatsapp/redis-session'
import { createRequire } from 'module'
import * as path from 'path'
import * as fs from 'fs'

const require = createRequire(import.meta.url)
const { Client, LocalAuth } = require('whatsapp-web.js')

const BASE_DIR = '/tmp/whatsapp-session'
const SESSION_DIR_SESSION = path.join(BASE_DIR, 'session')

async function run() {
  console.log('[Debug] Restoring session from Redis...')
  fs.mkdirSync(SESSION_DIR_SESSION, { recursive: true })
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.unlinkSync(path.join(SESSION_DIR_SESSION, f)) } catch {}
  }
  await loadSessionFromRedis(SESSION_DIR_SESSION)

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: BASE_DIR }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-zygote',
      ],
    },
  })

  client.on('qr', (qr: string) => {
    console.log('[Debug] QR Code received')
  })

  client.on('authenticated', () => {
    console.log('[Debug] Authenticated event fired!')
  })

  client.on('auth_failure', (msg: string) => {
    console.log('[Debug] Auth failure:', msg)
  })

  client.on('loading_screen', (percent: number, message: string) => {
    console.log(`[Debug] Loading screen: ${percent}% - ${message}`)
  })

  client.on('change_state', (state: string) => {
    console.log('[Debug] State changed:', state)
  })

  client.on('ready', () => {
    console.log('[Debug] ✅ READY EVENT FIRED!')
  })

  await client.initialize()

  // Wait 15 seconds and inspect page
  for (let i = 1; i <= 6; i++) {
    await new Promise(r => setTimeout(r, 5000))
    console.log(`[Debug] Ping check ${i * 5}s...`)
    try {
      const page = client.pupPage
      if (page) {
        const title = await page.title()
        const url = page.url()
        const hasWWebJS = await page.evaluate(() => typeof (window as any).WWebJS !== 'undefined')
        console.log(`[Debug] Page title: "${title}", URL: ${url}, WWebJS injected: ${hasWWebJS}`)

        // Take screenshot to inspect
        const ssPath = `/tmp/wa-debug-${i * 5}s.png`
        await page.screenshot({ path: ssPath })
        console.log(`[Debug] Screenshot saved to ${ssPath}`)
      }
    } catch (err: any) {
      console.log(`[Debug] Error checking page: ${err.message}`)
    }
  }

  await client.destroy()
  process.exit(0)
}

run().catch(console.error)
