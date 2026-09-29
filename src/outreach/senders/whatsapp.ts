/**
 * WhatsApp sender using Baileys (@whiskeysockets/baileys) with Redis session persistence.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import type { WhatsAppMessage } from '../types'
import * as fs from 'fs'
import { loadBaileysAuthFromRedis, saveBaileysAuthToRedis } from '../whatsapp/baileys-session'
import { validateAndNormalizePhone } from '../whatsapp/queue-send'

// Use globalThis to survive Next.js / dev hot-reload
const g = globalThis as any
if (!g.__baileysSocket) g.__baileysSocket = null
if (!g.__baileysReady) g.__baileysReady = false

const AUTH_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/baileys-auth-session'

async function getClient(): Promise<WASocket> {
  if (g.__baileysSocket && g.__baileysReady) {
    return g.__baileysSocket
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true })
  await loadBaileysAuthFromRedis(AUTH_DIR)

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

  return new Promise((resolve, reject) => {
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      defaultQueryTimeoutMs: 30000,
    })

    sock.ev.on('creds.update', saveCreds)

    const timeout = setTimeout(() => {
      reject(new Error('WhatsApp Baileys connection timeout (30s)'))
    }, 30000)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'open') {
        clearTimeout(timeout)
        g.__baileysSocket = sock
        g.__baileysReady = true
        await saveBaileysAuthToRedis(AUTH_DIR).catch(() => {})
        resolve(sock)
      } else if (connection === 'close') {
        g.__baileysReady = false
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
        if (statusCode === DisconnectReason.loggedOut) {
          g.__baileysSocket = null
        }
      }
    })
  })
}

// Public API

export async function isConnected(): Promise<boolean> {
  return Boolean(g.__baileysSocket && g.__baileysReady)
}

export async function sendMessage(
  msg: WhatsAppMessage,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const sock = await getClient()
    const cleanPhone = validateAndNormalizePhone(msg.to)
    if (!cleanPhone) {
      return { success: false, error: `Invalid recipient phone number: ${msg.to}` }
    }

    const jid = `${cleanPhone}@s.whatsapp.net`
    const sentMsg = await sock.sendMessage(jid, { text: msg.body })

    return {
      success: true,
      messageId: sentMsg?.key?.id || `sent-${Date.now()}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[WhatsApp] Send error:', message)
    return { success: false, error: message }
  }
}

export async function sendBulkMessages(
  messages: WhatsAppMessage[],
  delayMs: number = 45000,
): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
  const results: Array<{ to: string; success: boolean; messageId?: string; error?: string }> = []

  for (const msg of messages) {
    const result = await sendMessage(msg)
    results.push({ to: msg.to, ...result })

    if (messages.indexOf(msg) < messages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

export async function logout(): Promise<void> {
  if (g.__baileysSocket) {
    try {
      await g.__baileysSocket.logout()
      g.__baileysSocket.end(undefined)
    } catch {}
    g.__baileysSocket = null
    g.__baileysReady = false
  }
}
