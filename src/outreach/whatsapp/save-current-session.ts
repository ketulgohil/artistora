/**
 * Save the current WhatsApp session to Redis.
 * Run this while the session is still alive to persist it.
 *
 * Usage: npx tsx src/outreach/whatsapp/save-current-session.ts
 */

import * as path from 'path'
import { saveSessionToRedis } from './redis-session'

const BASE_DIR = process.env.WHATSAPP_SESSION_DIR || '/tmp/whatsapp-session'
const SESSION_DIR = path.join(BASE_DIR, 'session')

async function main() {
  console.log(`[WhatsApp] Saving current session from ${SESSION_DIR} to Redis...`)
  const success = await saveSessionToRedis(SESSION_DIR)
  if (success) {
    console.log('[WhatsApp] ✅ Session saved! It will survive process restarts now.')
    process.exit(0)
  } else {
    console.error('[WhatsApp] ❌ Failed to save session')
    process.exit(1)
  }
}

main()
