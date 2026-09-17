/**
 * Send a WhatsApp message through the running client service.
 *
 * Usage (standalone):
 *   npx tsx src/outreach/whatsapp/queue-send.ts <phone> <message>
 *
 * Usage (from code):
 *   import { queueMessage } from './queue-send'
 *   await queueMessage('918469662012', 'Hello!')
 */

import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env') })

const QUEUE_DIR = path.join(process.cwd(), '.whatsapp-queue')

export async function queueMessage(phone: string, message: string): Promise<boolean> {
  try {
    fs.mkdirSync(QUEUE_DIR, { recursive: true })

    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const filename = `${cleanPhone}_${Date.now()}.json`
    const filePath = path.join(QUEUE_DIR, filename)

    fs.writeFileSync(filePath, JSON.stringify({
      phone: cleanPhone,
      message,
      queuedAt: new Date().toISOString(),
    }))

    console.log(`[Queue] ✅ Queued message for ${cleanPhone}`)
    return true
  } catch (err: any) {
    console.error(`[Queue] ❌ Failed to queue: ${err.message}`)
    return false
  }
}

// CLI mode
if (process.argv[1] && process.argv[1].includes('queue-send')) {
  const phone = process.argv[2]
  const message = process.argv[3]

  if (!phone || !message) {
    console.error('Usage: npx tsx src/outreach/whatsapp/queue-send.ts <phone> <message>')
    process.exit(1)
  }

  queueMessage(phone, message).then(ok => {
    process.exit(ok ? 0 : 1)
  })
}
