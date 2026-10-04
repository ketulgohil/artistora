/**
 * Interactive WhatsApp Authentication via Baileys.
 * Supports:
 * 1. 8-digit Pairing Code (Link with phone number — NO QR scanning required!)
 * 2. Browser QR Code (Opens a crisp image in your browser — zero external scripts!)
 * 3. Terminal QR Code
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/auth-baileys.ts
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import QRCode from 'qrcode'
import { Boom } from '@hapi/boom'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import readline from 'readline'
import dotenv from 'dotenv'
import { saveBaileysAuthToRedis } from '../src/outreach/whatsapp/baileys-session'
import { getUnifiedRedis } from '../src/outreach/redis-client'

dotenv.config()

const AUTH_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys_auth')

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans.trim())
    }),
  )
}

function openHtmlQr(dataUrl: string) {
  const htmlPath = path.join('/tmp', 'whatsapp-qr.html')
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Artistora WhatsApp Link</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f2f5; }
    .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 400px; }
    h2 { color: #04224B; margin-top: 0; }
    p { color: #41506b; font-size: 14px; line-height: 1.5; }
    img { margin: 16px auto; border: 8px solid white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Link Artistora WhatsApp</h2>
    <p>1. Open WhatsApp on your phone<br>2. Tap <b>Menu / Settings → Linked Devices</b><br>3. Tap <b>Link a Device</b> and scan below:</p>
    <img src="${dataUrl}" width="280" height="280" alt="QR Code" />
    <p style="color: #888; font-size: 12px;">Scan this QR with your WhatsApp camera.</p>
  </div>
</body>
</html>`
  fs.writeFileSync(htmlPath, htmlContent)
  exec(`open "${htmlPath}"`)
}

async function main() {
  console.log('=== WhatsApp Fast Link Setup ===\n')

  console.log('Choose your preferred login method:')
  console.log(
    '1. 🔢 Pairing Code (Enter your phone number & type 8-letter code on phone — Recommended, No QR scan!)',
  )
  console.log('2. 🌐 Web Browser QR Code (Opens a crisp, high-res QR code in your browser)')
  console.log('3. 📟 Terminal QR Code (Prints directly in this terminal window)\n')

  const choice = (await askQuestion('Select method (1, 2, or 3) [default: 1]: ')) || '1'

  let phoneNumber = ''
  if (choice === '1') {
    const rawPhone = await askQuestion(
      '\nEnter your WhatsApp Phone Number (with country code, e.g. 917405387720): ',
    )
    phoneNumber = rawPhone.replace(/\D/g, '')
    if (!phoneNumber || phoneNumber.length < 10) {
      console.error('❌ Invalid phone number entered.')
      process.exit(1)
    }
  }

  // Clear previous session for fresh auth
  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true })
    const redis = getUnifiedRedis()
    await redis.del('whatsapp:baileys:auth:tarball')
    console.log('🧹 Cleared prior session state from disk and Redis.')
  } catch {}

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(
    `[Baileys] Connecting with WhatsApp Web version ${version.join('.')}${isLatest ? ' (latest)' : ''}...`,
  )

  const usePairingCode = choice === '1'

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    await saveBaileysAuthToRedis(AUTH_DIR)
  })

  if (usePairingCode && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        console.log(`\nRequesting 8-digit Pairing Code for +${phoneNumber}...`)
        const code = await sock.requestPairingCode(phoneNumber)
        console.log('\n=========================================')
        console.log(`👉 YOUR WHATSAPP PAIRING CODE:  ${code}`)
        console.log('=========================================')
        console.log('\nInstructions on your phone:')
        console.log('1. Open WhatsApp → Settings (or 3 dots) → Linked Devices')
        console.log('2. Tap "Link a Device"')
        console.log('3. Tap "Link with phone number instead" at the bottom')
        console.log(`4. Enter the code above: ${code}\n`)
      } catch (err: any) {
        console.error('Failed to request pairing code:', err.message)
      }
    }, 2000)
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      if (choice === '2') {
        console.log('\nOpening QR code image in your default browser...')
        try {
          const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 280 })
          openHtmlQr(dataUrl)
        } catch (e: any) {
          console.error('QR Error:', e.message)
        }
      } else if (choice === '3' || !usePairingCode) {
        console.log('\n📲 Scan this QR code with WhatsApp on your phone:\n')
        qrcode.generate(qr, { small: true })
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log('[Baileys] Reconnecting...')
      } else {
        console.log('[Baileys] Disconnected/Logged out.')
        process.exit(1)
      }
    } else if (connection === 'open') {
      console.log('\n=========================================')
      console.log('🎉 SUCCESS! WhatsApp Authenticated & Connected!')
      console.log('=========================================\n')

      await saveCreds()
      await saveBaileysAuthToRedis(AUTH_DIR)
      console.log('✅ Auth credentials saved to Local Redis.')
      console.log('You can now run any outreach message script without scanning again!\n')

      await new Promise((r) => setTimeout(r, 2000))
      process.exit(0)
    }
  })
}

main().catch((err) => {
  console.error('Auth error:', err)
  process.exit(1)
})
