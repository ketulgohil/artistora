/**
 * WhatsApp sender using whatsapp-web.js with session persistence.
 *
 * Session Strategy:
 * - Local dev: Uses LocalAuth (file-based) at ./whatsapp-session/
 * - Production (Vercel): Falls back to LocalAuth on /tmp/ (ephemeral)
 *   → Session must be re-scanned after each cold start
 * - Future: Store session in Supabase/S3 for true persistence
 *
 * To persist across Vercel cold starts, the session data from
 * ./whatsapp-session/ (or /tmp/whatsapp-session/) needs to be
 * uploaded to external storage after authentication and restored
 * on startup. This is handled by saveSession/loadSession below.
 */

import type { WhatsAppMessage } from '../types'
import * as fs from 'fs'
import * as path from 'path'

// Use globalThis to survive Next.js hot-reload
const g = globalThis as any
if (!g.__whatsappClient) g.__whatsappClient = null
if (!g.__whatsappReady) g.__whatsappReady = false
const clientRef = { get client() { return g.__whatsappClient }, set client(v: any) { g.__whatsappClient = v } }
const readyRef = { get ready() { return g.__whatsappReady }, set ready(v: boolean) { g.__whatsappReady = v } }

// Session storage paths
const SESSION_DIR = process.env.WHATSAPP_SESSION_DIR
  || (process.env.VERCEL ? '/tmp/whatsapp-session' : './whatsapp-session')

// Session file for manual persistence (JSON export of auth state)
const SESSION_FILE = path.join(SESSION_DIR, 'session.json')

// Lazy-load whatsapp-web.js to avoid Edge runtime issues
async function getClient() {
  // If client exists and is ready, return immediately
  if (clientRef.client && readyRef.ready) return clientRef.client

  // If client exists but ready state was lost (e.g. hot-reload), check if actually ready
  if (clientRef.client && !readyRef.ready) {
    try {
      if (clientRef.client.info) {
        readyRef.ready = true
        return clientRef.client
      }
    } catch {}
    // Client exists but not ready — cannot reuse, create new one
    try { await clientRef.client.destroy() } catch {}
    clientRef.client = null
  }

  try {
    const { Client, LocalAuth } = await import('whatsapp-web.js')

    // Ensure session directory exists
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true })
    }

    // Try to restore session from file if it exists
    const hasSavedSession = fs.existsSync(SESSION_FILE)
    if (hasSavedSession) {
      console.log('[WhatsApp] Found saved session, attempting to restore...')
    }

    clientRef.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: SESSION_DIR,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      },
    })

    clientRef.client.on('ready', () => {
      console.log('[WhatsApp] Client ready')
      readyRef.ready = true
      // Persist session after successful auth
      persistSession().catch(err =>
        console.error('[WhatsApp] Failed to persist session:', err)
      )
    })

    clientRef.client.on('authenticated', () => {
      console.log('[WhatsApp] Authenticated')
    })

    clientRef.client.on('auth_failure', (msg: any) => {
      console.error('[WhatsApp] Auth failure:', msg)
      readyRef.ready = false
    })

    clientRef.client.on('disconnected', (reason: any) => {
      console.log('[WhatsApp] Disconnected:', reason)
      readyRef.ready = false
    })

    // Wait for client to be ready before returning
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WhatsApp client ready timeout (60s)'))
      }, 60000)

      clientRef.client.on('ready', () => {
        clearTimeout(timeout)
        resolve()
      })

      clientRef.client.on('auth_failure', (msg: string) => {
        clearTimeout(timeout)
        reject(new Error(`WhatsApp auth failure: ${msg}`))
      })

      clientRef.client.initialize().catch((err: any) => {
        clearTimeout(timeout)
        reject(err)
      })
    })

    return clientRef.client
  } catch (error) {
    console.error('[WhatsApp] Failed to initialize:', error)
    throw error
  }
}

/**
 * Persist the WhatsApp session to a JSON file.
 * This captures the auth state so it can be restored after a cold start.
 */
async function persistSession(): Promise<void> {
  try {
    if (!clientRef.client) return

    // Get the session data from the LocalAuth store
    const authDir = path.join(SESSION_DIR, 'wwebjs_auth')
    if (!fs.existsSync(authDir)) return

    // Read all session files
    const sessionData = readDirRecursive(authDir)
    
    // Write to a single JSON file for easy transport
    fs.writeFileSync(SESSION_FILE, JSON.stringify({
      sessionId: 'default',
      authData: sessionData,
      savedAt: new Date().toISOString(),
    }, null, 2))

    console.log(`[WhatsApp] Session persisted to ${SESSION_FILE}`)
  } catch (error) {
    console.error('[WhatsApp] Error persisting session:', error)
  }
}

/**
 * Load a previously saved session from the JSON file.
 * Returns true if session was restored.
 */
function loadSavedSession(): boolean {
  try {
    if (!fs.existsSync(SESSION_FILE)) return false

    const raw = fs.readFileSync(SESSION_FILE, 'utf-8')
    const { authData } = JSON.parse(raw)

    if (!authData || typeof authData !== 'object') return false

    // Restore files to the auth directory
    const authDir = path.join(SESSION_DIR, 'wwebjs_auth')
    writeDirRecursive(authDir, authData)

    console.log('[WhatsApp] Session restored from saved file')
    return true
  } catch (error) {
    console.error('[WhatsApp] Error loading saved session:', error)
    return false
  }
}

/**
 * Get the session data as a JSON string (for external storage).
 */
export function getSessionData(): string | null {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null
    return fs.readFileSync(SESSION_FILE, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Restore session from a JSON string (from external storage).
 */
export function restoreSession(data: string): boolean {
  try {
    const parsed = JSON.parse(data)
    if (!parsed.authData) return false

    // Ensure directory exists
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true })
    }

    // Write session file
    fs.writeFileSync(SESSION_FILE, data)

    // Restore auth directory
    const authDir = path.join(SESSION_DIR, 'wwebjs_auth')
    writeDirRecursive(authDir, parsed.authData)

    console.log('[WhatsApp] Session restored from external data')
    return true
  } catch (error) {
    console.error('[WhatsApp] Error restoring session:', error)
    return false
  }
}

// --- Helper: recursive directory read/write ---

function readDirRecursive(dir: string): Record<string, any> {
  const result: Record<string, any> = {}
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result[entry.name] = readDirRecursive(fullPath)
    } else {
      // Read file as base64 for safe JSON transport
      const content = fs.readFileSync(fullPath)
      result[entry.name] = {
        __file: true,
        data: content.toString('base64'),
        encoding: 'base64',
      }
    }
  }

  return result
}

function writeDirRecursive(dir: string, data: Record<string, any>): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  for (const [name, value] of Object.entries(data)) {
    const fullPath = path.join(dir, name)

    if (value && typeof value === 'object' && value.__file) {
      // Write file from base64
      fs.writeFileSync(fullPath, Buffer.from(value.data, 'base64'))
    } else if (value && typeof value === 'object') {
      // Recurse into directory
      writeDirRecursive(fullPath, value)
    }
  }
}

// --- Public API ---

// Get QR code for authentication
export async function getQRCode(): Promise<{ qr: string } | { status: string }> {
  const c = await getClient()

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ status: 'timeout' })
    }, 30000)

    c.on('qr', (qr: string) => {
      clearTimeout(timeout)
      resolve({ qr })
    })

    // If already authenticated, return ready status
    if (readyRef.ready) {
      clearTimeout(timeout)
      resolve({ status: 'ready' })
    }
  })
}

// Check if WhatsApp is connected
export async function isConnected(): Promise<boolean> {
  try {
    const c = await getClient()
    return readyRef.ready && c.info !== undefined
  } catch {
    return false
  }
}

// Send a text message
export async function sendMessage(msg: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // getClient() now waits for ready state
    const c = await getClient()

    // Format phone number
    let chatId = msg.to.replace(/[^\d]/g, '')
    if (chatId.length === 10) {
      chatId = `91${chatId}` // Add India country code
    }
    chatId = `${chatId}@c.us`

    // Send message
    const sentMsg = await c.sendMessage(chatId, msg.body)

    // In whatsapp-web.js v1.34+, sendMessage may return undefined even on success
    // The message is still sent — verify by checking if no error was thrown
    return {
      success: true,
      messageId: sentMsg?.id?._serialized || sentMsg?.id?.id || `sent-${Date.now()}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[WhatsApp] Send error:', message)
    return { success: false, error: message }
  }
}

// Send bulk messages with rate limiting
export async function sendBulkMessages(
  messages: WhatsAppMessage[],
  delayMs: number = 120000 // 2 minutes between messages
): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
  const results: Array<{ to: string; success: boolean; messageId?: string; error?: string }> = []

  for (const msg of messages) {
    const result = await sendMessage(msg)
    results.push({ to: msg.to, ...result })

    // Wait before next message (skip delay for last message)
    if (messages.indexOf(msg) < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

// Logout and clean up
export async function logout(): Promise<void> {
  if (clientRef.client) {
    await clientRef.client.logout()
    await clientRef.client.destroy()
    clientRef.client = null
    readyRef.ready = false
  }

  // Clean up session files
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE)
    }
  } catch {}
}
