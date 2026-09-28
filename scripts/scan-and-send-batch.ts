/**
 * Interactive WhatsApp login & batch sender.
 * Displays terminal QR code, waits for you to scan with WhatsApp on your phone,
 * saves the fresh session to Local Redis, and sends to the 10 mehndi artists.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/scan-and-send-batch.ts
 */

import { saveSessionToRedis } from '../src/outreach/whatsapp/redis-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'
import { logOutreachMessage } from '../src/outreach/whatsapp/log-message'
import { createRequire } from 'module'
import * as path from 'path'
import * as fs from 'fs'

const require = createRequire(import.meta.url)
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const BASE_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/whatsapp-session'
const SESSION_DIR_SESSION = path.join(BASE_DIR, 'session')

const artists = [
  { id: 331, name: 'Dipuh mehndi artist',                    phone: '+918980306183' },
  { id: 266, name: 'Mehndi By Monali',                       phone: '+918849402240' },
  { id: 329, name: "Nidhi's Creative Mehndi & Nails",        phone: '+918849528228' },
  { id: 350, name: 'Honey Mehndi Art',                       phone: '+919898218996' },
  { id: 297, name: 'Mehndikka by Ushma',                     phone: '+919724207812' },
  { id: 309, name: 'Ahmedabad Mehndi Designer',              phone: '+917801818943' },
  { id: 307, name: 'Dhvani Mehndi art',                      phone: '+919510556227' },
  { id: 289, name: 'Prachi Mehndi and Nail Art in Ahmedabad',phone: '+919033965485' },
  { id: 306, name: 'VIRHANT MEHNDI ART & CLASSES',           phone: '+919054461672' },
  { id: 282, name: 'JALPA SHAH MEHANDI Art',                 phone: '+919574506318' },
]

function buildMessage(name: string): string {
  const shortName = name
    .replace(/\b(artist|art|classes|class|designer|mehandi|mehndi|henna|in\s+ahmedabad|ahmedabad)\b/gi, '')
    .replace(/[&]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')
    .trim() || name

  return `🙏 Namaste ${shortName} Team,

Aapka Ahmedabad me Mehndi work aur Google par 5★ rating sach me impressive hai! ✨

Hum *Artistora* (artistora.com) — Ahmedabad ka exclusive Artist Marketplace launch kar rahe hain, jaha clients directly verified artists se connect karte hain.

🚀 *Aapke liye Benefits:*
• Free Dedicated Profile & Portfolio Page
• Direct Customer Calls & WhatsApp Bookings
• 0% Commission / No Hidden Charges
• Bridal & Event Booking Alerts

👉 *Join Free Today:* https://www.artistora.com/register

Profile listing ya setup karne me agar aapko koi bhi guidance ya assistance chahiye, to aap hume yaha message kar sakte hain — we are happy to guide you! 👍

Warm regards,
Team Artistora | Ahmedabad`
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

async function main() {
  console.log(`[Outreach] Preparing WhatsApp outreach for ${artists.length} Mehndi artists...`)

  fs.mkdirSync(SESSION_DIR_SESSION, { recursive: true })
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.unlinkSync(path.join(SESSION_DIR_SESSION, f)) } catch {}
  }

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
    console.log('\n=========================================')
    console.log('📱 SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE:')
    console.log('=========================================\n')
    qrcode.generate(qr, { small: true })
    console.log('\nWaiting for scan...')
  })

  client.on('authenticated', () => {
    console.log('\n[WhatsApp] ✅ Authenticated successfully!')
  })

  client.on('auth_failure', (msg: string) => {
    console.error('[WhatsApp] ❌ Auth failure:', msg)
    process.exit(1)
  })

  client.on('disconnected', (reason: string) => {
    console.log('[WhatsApp] ⚠️ Disconnected:', reason)
  })

  client.on('ready', async () => {
    console.log('\n=========================================')
    console.log('🚀 Connected to WhatsApp Web! Starting batch outreach...')
    console.log('=========================================\n')

    // 1. Immediately save fresh session to Redis
    try {
      console.log('[WhatsApp] Persisting fresh session to Local Redis...')
      await saveSessionToRedis(SESSION_DIR_SESSION)
      console.log('[WhatsApp] ✅ Session saved to Redis')
    } catch (err: any) {
      console.error('[WhatsApp] Redis save error:', err.message)
    }

    const results: { name: string; phone: string; status: string; error?: string }[] = []

    for (let i = 0; i < artists.length; i++) {
      const { name, phone } = artists[i]
      const cleanPhone = validateAndNormalizePhone(phone)
      const message = buildMessage(name)

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[${i + 1}/${artists.length}] Sending to: ${name} (${phone})`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

      if (!cleanPhone) {
        console.error(`[${i + 1}/${artists.length}] ❌ Invalid phone: ${phone}`)
        results.push({ name, phone, status: '❌ invalid_phone' })
        continue
      }

      const chatId = `${cleanPhone}@c.us`
      let sendSuccess = false
      let sendError: string | undefined
      let messageSid: string | undefined

      try {
        const response = await client.sendMessage(chatId, message)
        messageSid = response?.id?.id || undefined
        sendSuccess = true
        console.log(`[${i + 1}/${artists.length}] ✅ Message sent to ${cleanPhone}`)
        results.push({ name, phone: cleanPhone, status: '✅ sent' })
      } catch (err: any) {
        sendError = err.message
        console.error(`[${i + 1}/${artists.length}] ❌ Send failed: ${err.message}`)
        results.push({ name, phone: cleanPhone, status: '❌ failed', error: err.message })
      }

      // Log to Payload CMS
      try {
        await logOutreachMessage(cleanPhone, message, {
          channel: 'whatsapp',
          status: sendSuccess ? 'sent' : 'failed',
          campaignName: 'batch_mehndi_01',
          templateUsed: 'custom',
          messageSid,
          error: sendError,
        })
      } catch (err: any) {
        console.error('[Batch] Payload logging warning:', err.message)
      }

      // Safe jitter delay between messages (skip after last one)
      if (i < artists.length - 1) {
        const delaySec = 45 + Math.floor(Math.random() * 20) // 45–65s
        console.log(`⏳ Waiting ${delaySec}s before next message...`)
        await sleep(delaySec * 1000)
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 BATCH COMPLETE — Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    for (const r of results) {
      console.log(`${r.status}  ${r.name} (${r.phone})${r.error ? ` — ${r.error}` : ''}`)
    }
    const sentCount = results.filter(r => r.status.includes('sent')).length
    console.log(`\n${sentCount}/${artists.length} messages sent successfully.`)

    // Save session back to Redis
    try {
      await saveSessionToRedis(SESSION_DIR_SESSION)
      console.log('[WhatsApp] ✅ Final session saved to Redis')
    } catch {}

    await client.destroy().catch(() => {})
    process.exit(sentCount > 0 ? 0 : 1)
  })

  console.log('[WhatsApp] Initializing client...')
  client.initialize().catch((err: Error) => {
    console.error('[WhatsApp] Init failed:', err.message)
    process.exit(1)
  })
}

main()
