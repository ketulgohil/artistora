/**
 * One-off WhatsApp sender for Shiva Mehndi Art (Generic Platform Outreach).
 * Restores session from Local Redis, sends message, logs to Payload CMS.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-shiva-message.ts
 */

import { saveSessionToRedis, loadSessionFromRedis } from '../src/outreach/whatsapp/redis-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'
import { logOutreachMessage } from '../src/outreach/whatsapp/log-message'
import dotenv from 'dotenv'
import { createRequire } from 'module'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config()

const require = createRequire(import.meta.url)
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const BASE_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/whatsapp-session'
const SESSION_DIR_SESSION = path.join(BASE_DIR, 'session')

const TARGET_ARTIST = {
  id: 278,
  name: 'Shiva Mehndi Art',
  phone: '+918469662012',
}

const MESSAGE_BODY = `🙏 Namaste,

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist & Event Marketplace launch kar rahe hain, jaha clients directly verified artists se connect karte hain.

🎨 *Who Can Join & List Free:*
• Mehndi Artists (Bridal, Arabic, Traditional)
• Photographers & Cinematographers (Wedding, Pre-wedding, Events)
• Makeup & Hair Artists (Bridal & Party Glam)
• Decorators & Event Planners

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Middlemen Charges
• High-Intent Wedding & Event Inquiries in Ahmedabad

👉 *List Your Profile Free:* https://www.artistora.com/register

Profile listing ya setup karne me agar aapko koi bhi guidance ya assistance chahiye, to aap hume yaha message kar sakte hain — we are happy to guide you! 👍

Warm regards,
Artistora | Ahmedabad`

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

async function main() {
  console.log('=== Artistora Generic Outreach — Shiva Mehndi Art ===\n')
  console.log(`Target: ${TARGET_ARTIST.name} (${TARGET_ARTIST.phone})`)
  console.log('\n--- Message Preview ---\n')
  console.log(MESSAGE_BODY)
  console.log('\n-----------------------\n')

  const isFresh = process.argv.includes('--fresh') || process.argv.includes('--rescan')

  if (isFresh) {
    console.log('1. Fresh scan requested: clearing local session folder...')
    try {
      fs.rmSync(BASE_DIR, { recursive: true, force: true })
    } catch {}
    fs.mkdirSync(SESSION_DIR_SESSION, { recursive: true })
  } else {
    console.log('1. Restoring session from Local Redis...')
    fs.mkdirSync(SESSION_DIR_SESSION, { recursive: true })
    for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort']) {
      try { fs.unlinkSync(path.join(SESSION_DIR_SESSION, f)) } catch {}
    }

    const restored = await loadSessionFromRedis(SESSION_DIR_SESSION)
    if (restored) {
      console.log('✓ Session restored from Redis')
    } else {
      console.log('ℹ No session in Redis, using local folder if available')
    }
  }

  function createAndInitClient(attempt = 1) {
    console.log(`\nInitializing WhatsApp Client (attempt ${attempt}/3)...`)

    for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort']) {
      try { fs.unlinkSync(path.join(SESSION_DIR_SESSION, f)) } catch {}
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        dataPath: BASE_DIR,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    })

    client.on('qr', (qr: string) => {
      console.log('\nQR Code required:')
      qrcode.generate(qr, { small: true })
    })

    client.on('authenticated', () => {
      console.log('✓ Authenticated with WhatsApp')
    })

    client.on('auth_failure', (msg: string) => {
      console.warn('⚠️ Auth failure:', msg)
    })

    client.on('loading_screen', (percent: number, message: string) => {
      console.log(`[Loading] ${percent}% - ${message}`)
    })

    client.on('change_state', (state: string) => {
      console.log(`[State] ${state}`)
    })

    client.on('ready', async () => {
      console.log('✓ WhatsApp Client Ready!\n')

      try {
        console.log('Saving refreshed session to Redis...')
        await saveSessionToRedis(SESSION_DIR_SESSION)
        console.log('✓ Session synced to Redis\n')

        const normalizedPhone = validateAndNormalizePhone(TARGET_ARTIST.phone)
        if (!normalizedPhone) {
          console.error(`❌ Invalid phone number: ${TARGET_ARTIST.phone}`)
          process.exit(1)
        }

        const whatsappId = `${normalizedPhone}@c.us`
        console.log('Waiting 3s for chat sync...')
        await sleep(3000)

        console.log(`Sending message to ${whatsappId}...`)
        const sent = await client.sendMessage(whatsappId, MESSAGE_BODY)

        const messageSid = sent?.id?._serialized || sent?.id?.id || 'sent'
        console.log(`✓ Message sent successfully! (ID: ${messageSid})`)

        await logOutreachMessage(TARGET_ARTIST.phone, MESSAGE_BODY, {
          channel: 'whatsapp',
          status: 'sent',
          campaignName: 'single_generic_onboarding_shiva',
          templateUsed: 'custom',
          messageSid,
        })

        console.log('✓ Outreach logged to Payload CMS successfully.')
      } catch (err: any) {
        console.error(`❌ Send failed: ${err.message}`)
        await logOutreachMessage(TARGET_ARTIST.phone, MESSAGE_BODY, {
          channel: 'whatsapp',
          status: 'failed',
          campaignName: 'single_generic_onboarding_shiva',
          templateUsed: 'custom',
          error: err.message,
        })
      } finally {
        console.log('\nClosing WhatsApp client...')
        try { await client.destroy() } catch {}
        console.log('✓ Done.')
        process.exit(0)
      }
    })

    client.initialize().catch(async (err: any) => {
      console.warn(`⚠️ Client initialization error on attempt ${attempt}: ${err.message}`)
      try { await client.destroy() } catch {}
      if (attempt < 3) {
        console.log('Retrying in 2 seconds...')
        setTimeout(() => createAndInitClient(attempt + 1), 2000)
      } else {
        console.error('Fatal initialization error:', err)
        process.exit(1)
      }
    })
  }

  createAndInitClient(1)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
