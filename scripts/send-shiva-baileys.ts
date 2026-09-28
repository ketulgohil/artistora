/**
 * Baileys-powered WhatsApp sender for Shiva Mehndi Art.
 * Lightweight, fast WebSockets client with zero headless Chrome dependency.
 * Supports:
 * - Direct send from cached Redis auth
 * - Pairing code (Link with phone number) via --phone <number>
 * - Browser QR code via --browser
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/send-shiva-baileys.ts
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import dotenv from 'dotenv'
import { saveBaileysAuthToRedis, loadBaileysAuthFromRedis } from '../src/outreach/whatsapp/baileys-session'
import { validateAndNormalizePhone } from '../src/outreach/whatsapp/queue-send'
import { logOutreachMessage } from '../src/outreach/whatsapp/log-message'

dotenv.config()

const AUTH_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys_auth')

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
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openHtmlQr(qrData: string) {
  const htmlPath = path.join('/tmp', 'whatsapp-qr.html')
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Artistora WhatsApp Link</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f2f5; }
    .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 400px; }
    h2 { color: #04224B; margin-top: 0; }
    p { color: #41506b; font-size: 14px; line-height: 1.5; }
    canvas { margin: 16px 0; border: 8px solid white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="card">
    <h2>Link Artistora WhatsApp</h2>
    <p>1. Open WhatsApp on your phone<br>2. Tap <b>Menu / Settings → Linked Devices</b><br>3. Tap <b>Link a Device</b> and scan this code:</p>
    <canvas id="qr"></canvas>
    <p style="color: #888; font-size: 12px;">This code refreshes automatically.</p>
  </div>
  <script>
    QRCode.toCanvas(document.getElementById('qr'), ${JSON.stringify(qrData)}, { width: 280, margin: 1 }, function(err) {
      if (err) console.error(err);
    });
  </script>
</body>
</html>`
  fs.writeFileSync(htmlPath, htmlContent)
  exec(`open "${htmlPath}"`)
}

let hasClearedFresh = false
const phoneArgIndex = process.argv.findIndex((a) => a === '--phone' || a === '-p')
const pairingPhone = phoneArgIndex !== -1 ? process.argv[phoneArgIndex + 1]?.replace(/\D/g, '') : null

async function startBaileys() {
  console.log('=== Artistora Baileys WhatsApp Sender ===\n')
  console.log(`Target: ${TARGET_ARTIST.name} (${TARGET_ARTIST.phone})`)
  console.log('\n--- Message Preview ---\n')
  console.log(MESSAGE_BODY)
  console.log('\n-----------------------\n')

  const isFresh = !hasClearedFresh && (process.argv.includes('--fresh') || process.argv.includes('--rescan'))
  if (isFresh) {
    hasClearedFresh = true
    console.log('[Auth] Clearing local credentials for fresh authentication...')
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true })
    } catch {}
  } else {
    if (!fs.existsSync(AUTH_DIR) || fs.readdirSync(AUTH_DIR).length === 0) {
      console.log('[Auth] Checking Redis for existing credentials...')
      await loadBaileysAuthFromRedis(AUTH_DIR)
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`[Baileys] WhatsApp Web version: v${version.join('.')}${isLatest ? ' (latest)' : ''}`)

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
  })

  let isSending = false

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await saveBaileysAuthToRedis(AUTH_DIR)
  })

  // If pairing code requested and not yet registered
  if (pairingPhone && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        console.log(`\nRequesting Pairing Code for +${pairingPhone}...`)
        const code = await sock.requestPairingCode(pairingPhone)
        console.log('\n=========================================')
        console.log(`👉 YOUR WHATSAPP PAIRING CODE:  ${code}`)
        console.log('=========================================')
        console.log('\nInstructions on your phone:')
        console.log('1. Open WhatsApp → Settings → Linked Devices')
        console.log('2. Tap "Link a Device"')
        console.log('3. Tap "Link with phone number instead" at the bottom')
        console.log(`4. Enter code: ${code}\n`)
      } catch (err: any) {
        console.error('Failed to request pairing code:', err.message)
      }
    }, 2000)
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !pairingPhone) {
      console.log('\n=========================================')
      console.log('📱 SCAN THIS QR CODE WITH WHATSAPP:')
      console.log('=========================================\n')
      qrcode.generate(qr, { small: true })
      openHtmlQr(qr)
      console.log('\n(Also opened a high-res QR code in your web browser)')
      console.log('Waiting for scan...')
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      console.log(`\n[Baileys] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`)

      if (shouldReconnect && !isSending) {
        setTimeout(startBaileys, 3000)
      } else if (statusCode === DisconnectReason.loggedOut) {
        console.log('[Baileys] Device logged out. Please re-run with --fresh to re-authenticate.')
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true })
        } catch {}
        process.exit(1)
      }
    } else if (connection === 'open') {
      console.log('\n=========================================')
      console.log('🚀 WhatsApp Connected successfully via Baileys!')
      console.log('=========================================\n')

      if (isSending) return
      isSending = true

      try {
        await saveCreds()
        await saveBaileysAuthToRedis(AUTH_DIR)

        const cleanPhone = validateAndNormalizePhone(TARGET_ARTIST.phone)
        if (!cleanPhone) {
          console.error(`❌ Invalid target phone: ${TARGET_ARTIST.phone}`)
          process.exit(1)
        }

        const jid = `${cleanPhone}@s.whatsapp.net`
        console.log(`Sending message to ${TARGET_ARTIST.name} (${jid})...`)

        await sleep(1500)
        const result = await sock.sendMessage(jid, { text: MESSAGE_BODY })

        const messageSid = result?.key?.id || 'baileys_sent'
        console.log(`\n✅ Message sent successfully! (ID: ${messageSid})`)

        await logOutreachMessage(TARGET_ARTIST.phone, MESSAGE_BODY, {
          channel: 'whatsapp',
          status: 'sent',
          campaignName: 'single_generic_onboarding_shiva',
          templateUsed: 'custom',
          messageSid,
        })
        console.log('✅ Outreach logged to Payload CMS successfully.')

        await sleep(2000)
        console.log('\n✓ Task complete.')
        process.exit(0)
      } catch (err: any) {
        console.error(`\n❌ Send error: ${err.message}`)
        await logOutreachMessage(TARGET_ARTIST.phone, MESSAGE_BODY, {
          channel: 'whatsapp',
          status: 'failed',
          campaignName: 'single_generic_onboarding_shiva',
          templateUsed: 'custom',
          error: err.message,
        })
        process.exit(1)
      }
    }
  })
}

startBaileys().catch((err) => {
  console.error('Fatal error starting Baileys:', err)
  process.exit(1)
})
