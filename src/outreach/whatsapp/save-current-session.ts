/**
 * Save the current WhatsApp session to Redis.
 * Run this while the session is still alive to persist it.
 *
 * Usage: npx tsx src/outreach/whatsapp/save-current-session.ts
 */

import { saveSessionToRedis } from './redis-session'

const SESSION_DIR = './whatsapp-session/session'

async function main() {
  console.log('[WhatsApp] Saving current session to Redis...')
  const success = await saveSessionToRedis(SESSION_DIR)
  if (success) {
    console.log('[WhatsApp] ✅ Session saved! It will survive process restarts now.')
  } else {
    console.error('[WhatsApp] ❌ Failed to save session')
    process.exit(1)
  }
}

main()
