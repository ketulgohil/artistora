/**
 * Dedicated Visual WhatsApp Linker with live SSE QR Stream and Pairing Code support.
 * Uses official WhatsApp Desktop browser headers for maximum stability and long QR validity.
 *
 * Run: NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/link-whatsapp.ts
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import http from 'http'
import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import dotenv from 'dotenv'
import { saveBaileysAuthToRedis, loadBaileysAuthFromRedis } from '../src/outreach/whatsapp/baileys-session'
import { getUnifiedRedis } from '../src/outreach/redis-client'

dotenv.config()

const AUTH_DIR = path.resolve(process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys_auth')
const PORT = 3333

let latestQr: string | null = null
let currentPairingCode: string | null = null
let connectionState: 'connecting' | 'qr_ready' | 'open' | 'closed' = 'connecting'
let sseClients: http.ServerResponse[] = []
let socketInstance: any = null
let isConnecting = false

function broadcastSse(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  sseClients.forEach((res) => {
    try {
      res.write(payload)
    } catch {}
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })
    res.write(`data: ${JSON.stringify({ state: connectionState, qr: latestQr, code: currentPairingCode })}\n\n`)
    sseClients.push(res)
    req.on('close', () => {
      sseClients = sseClients.filter((c) => c !== res)
    })
    return
  }

  if (url.pathname === '/api/pair' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', async () => {
      try {
        const { phone } = JSON.parse(body)
        const clean = phone.replace(/\D/g, '')
        if (!clean || clean.length < 10) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ error: 'Please enter a valid phone number with country code (e.g. 917405387720)' }))
        }

        if (socketInstance && !socketInstance.authState?.creds?.registered) {
          console.log(`[Baileys] Requesting fresh Pairing Code for +${clean}...`)
          currentPairingCode = await socketInstance.requestPairingCode(clean)
          console.log(`[Baileys] 👉 Pairing Code: ${currentPairingCode}`)
          broadcastSse({ state: connectionState, qr: latestQr, code: currentPairingCode })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, code: currentPairingCode }))
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'WhatsApp socket not ready yet or already registered. Please wait a moment.' }))
        }
      } catch (err: any) {
        console.error('[Baileys] Pairing Code Error:', err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }

  // Serve Single-Page App
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Artistora WhatsApp Linker</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <style>
    :root { --brand: #ec6783; --navy: #04224B; --bg: #f8fafc; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 100vh; color: var(--navy); }
    .card { background: white; border-radius: 20px; box-shadow: 0 12px 40px rgba(4,34,75,0.08); width: 100%; max-width: 520px; padding: 36px; text-align: center; border: 1px solid #eef2f6; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: var(--navy); }
    p.sub { font-size: 14px; color: #64748b; margin: 0 0 24px; }
    .tabs { display: flex; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 24px; }
    .tab-btn { flex: 1; padding: 11px 8px; border: none; background: transparent; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; color: #64748b; transition: all 0.2s; }
    .tab-btn.active { background: white; color: var(--navy); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    canvas#qr-canvas { margin: 16px auto; display: block; border-radius: 14px; border: 1px solid #e2e8f0; background: white; padding: 8px; }
    .steps { text-align: left; background: #f8fafc; border-radius: 12px; padding: 16px 20px; font-size: 13px; color: #475569; line-height: 1.6; margin-top: 20px; border: 1px solid #edf2f7; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 6px; }
    .input-group { display: flex; gap: 8px; margin: 20px 0; }
    input[type="text"] { flex: 1; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 15px; outline: none; transition: border 0.2s; }
    input[type="text"]:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(236,103,131,0.15); }
    button.btn-action { background: var(--navy); color: white; border: none; padding: 12px 22px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    button.btn-action:hover { background: #08336d; }
    .code-box { display: none; background: #fff5f7; border: 2px dashed var(--brand); border-radius: 14px; padding: 20px; margin: 20px 0; }
    .code-value { font-size: 34px; font-weight: 800; letter-spacing: 5px; color: var(--brand); font-family: monospace; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; background: #f1f5f9; color: #64748b; }
    .status-badge.connected { background: #dcfce7; color: #15803d; }
    .status-badge.reconnecting { background: #fef3c7; color: #b45309; }
    .success-screen { display: none; padding: 20px 0; }
    .success-icon { font-size: 56px; margin-bottom: 12px; }
    .loading-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #cbd5e1; border-top-color: var(--brand); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div id="status" class="status-badge"><span class="loading-spinner"></span> Connecting to WhatsApp...</div>

    <div id="main-content">
      <h1>Link WhatsApp Account</h1>
      <p class="sub">Connect your WhatsApp to enable direct artist messaging</p>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('qr')">📷 Live QR Code</button>
        <button class="tab-btn" onclick="switchTab('code')">🔢 Pairing Code</button>
      </div>

      <!-- TAB 1: QR Code -->
      <div id="tab-qr" class="tab-content active">
        <canvas id="qr-canvas" width="250" height="250"></canvas>
        <div id="qr-status-msg" style="font-size: 13px; color: #64748b; margin-top: 8px;">Waiting for QR code stream...</div>
        <div class="steps">
          <ol>
            <li>Open <b>WhatsApp</b> on your phone.</li>
            <li>Tap <b>Settings (or ⋮) → Linked Devices → Link a Device</b>.</li>
            <li>Point your phone camera at the QR code above.</li>
          </ol>
        </div>
      </div>

      <!-- TAB 2: Pairing Code -->
      <div id="tab-code" class="tab-content">
        <p style="font-size: 13px; color: #475569; text-align: left; margin: 0;">Make sure to enter the exact phone number of the WhatsApp account currently on your phone:</p>
        <div class="input-group">
          <input type="text" id="phone-input" placeholder="e.g. 917405387720" value="917405387720" />
          <button class="btn-action" id="btn-get-code" onclick="requestPairingCode()">Get Code</button>
        </div>

        <div id="code-box" class="code-box">
          <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px;">ENTER THIS CODE ON YOUR PHONE:</div>
          <div id="code-display" class="code-value">----</div>
          <div style="font-size: 12px; color: #888; margin-top: 6px;">Valid for ~60 seconds</div>
        </div>

        <div class="steps">
          <ol>
            <li>Open <b>WhatsApp</b> on your phone.</li>
            <li>Tap <b>Settings (or ⋮) → Linked Devices → Link a Device</b>.</li>
            <li>Tap <b>"Link with phone number instead"</b> at the bottom.</li>
            <li>Type the code shown above.</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- SUCCESS SCREEN -->
    <div id="success-screen" class="success-screen">
      <div class="success-icon">🎉</div>
      <h2 style="color: #15803d; margin: 0 0 8px;">WhatsApp Connected!</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Session securely saved to Local Redis. You can now close this tab and send messages seamlessly.</p>
    </div>
  </div>

  <script>
    function switchTab(t) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      if (t === 'qr') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-qr').classList.add('active');
      } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-code').classList.add('active');
      }
    }

    async function requestPairingCode() {
      const phoneInput = document.getElementById('phone-input');
      const btn = document.getElementById('btn-get-code');
      const phone = phoneInput.value.trim();
      if (!phone) return alert('Please enter phone number');

      btn.innerText = 'Generating...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (data.code) {
          document.getElementById('code-display').innerText = data.code;
          document.getElementById('code-box').style.display = 'block';
        } else if (data.error) {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Failed to request pairing code: ' + err.message);
      } finally {
        btn.innerText = 'Get Code';
        btn.disabled = false;
      }
    }

    const evt = new EventSource('/events');
    evt.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const statusBadge = document.getElementById('status');

      if (data.state === 'open') {
        statusBadge.className = 'status-badge connected';
        statusBadge.innerHTML = '✅ Connected Successfully';
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('success-screen').style.display = 'block';
      } else if (data.state === 'connecting') {
        statusBadge.className = 'status-badge reconnecting';
        statusBadge.innerHTML = '<span class="loading-spinner"></span> Finalizing WhatsApp Link...';
      } else if (data.qr) {
        statusBadge.className = 'status-badge';
        statusBadge.innerHTML = '⚡ Ready to Scan';
        document.getElementById('qr-status-msg').innerText = 'Live QR stream active. Scan with WhatsApp.';
        QRCode.toCanvas(document.getElementById('qr-canvas'), data.qr, { width: 250, margin: 1 });
      }

      if (data.code) {
        document.getElementById('code-display').innerText = data.code;
        document.getElementById('code-box').style.display = 'block';
      }
    };
  </script>
</body>
</html>`)
})

async function startBaileysSocket() {
  if (isConnecting) return
  isConnecting = true

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`[Baileys] Initializing socket (v${version.join('.')}${isLatest ? ' latest' : ''})...`)

  socketInstance = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  })

  socketInstance.ev.on('creds.update', async () => {
    await saveCreds()
    await saveBaileysAuthToRedis(AUTH_DIR)
  })

  socketInstance.ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      latestQr = qr
      connectionState = 'qr_ready'
      console.log('[Baileys] Fresh QR code ready.')
      broadcastSse({ state: connectionState, qr: latestQr, code: currentPairingCode })
    }

    if (connection === 'close') {
      isConnecting = false
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const isLoggedOut = statusCode === DisconnectReason.loggedOut

      console.log(`[Baileys] Connection closed (code: ${statusCode}). Logged out: ${isLoggedOut}`)

      if (isLoggedOut) {
        console.log('[Baileys] Logged out - clearing auth state.')
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true })
        } catch {}
      }

      connectionState = 'connecting'
      broadcastSse({ state: connectionState })

      // Reconnect immediately to finish handshake (code 515 restart required or network blip)
      setTimeout(startBaileysSocket, 1500)
    } else if (connection === 'open') {
      isConnecting = false
      console.log('\n=========================================')
      console.log('🎉 WHATSAPP CONNECTED SUCCESSFULLY!')
      console.log('=========================================\n')

      connectionState = 'open'
      broadcastSse({ state: 'open' })

      await saveCreds()
      await saveBaileysAuthToRedis(AUTH_DIR)
      console.log('✅ Auth saved to Local Redis.')
    }
  })
}

// Initial fresh setup on manual server start
try {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true })
  const redis = getUnifiedRedis()
  redis.del('whatsapp:baileys:auth:tarball').catch(() => {})
} catch {}

server.listen(PORT, () => {
  console.log(`\n=========================================`)
  console.log(`🌐 Linker Web UI is live at: http://localhost:${PORT}`)
  console.log(`=========================================\n`)
  exec(`open "http://localhost:${PORT}"`)
  startBaileysSocket()
})
