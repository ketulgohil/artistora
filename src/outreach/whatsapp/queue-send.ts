/**
 * Send a WhatsApp message through the running client service queue.
 *
 * Usage (standalone):
 *   npx tsx src/outreach/whatsapp/queue-send.ts <phone> <message>
 *
 * Usage (from code):
 *   import { queueMessage, validateAndNormalizePhone } from './queue-send'
 *   await queueMessage('918469662012', 'Hello!')
 */

import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(process.cwd(), '.env') })

const QUEUE_DIR = path.join(process.cwd(), '.whatsapp-queue')

/**
 * Validates and normalizes Indian mobile number.
 * Returns normalized string in `91XXXXXXXXXX` format or null if invalid.
 */
export function validateAndNormalizePhone(phone: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d]/g, '')
  let local = digits

  if (digits.length === 12 && digits.startsWith('91')) {
    local = digits.slice(2)
  } else if (digits.length === 11 && digits.startsWith('0')) {
    local = digits.slice(1)
  }

  // Must be 10 digits starting with 6-9 for Indian mobile numbers
  if (local.length === 10 && /^[6-9]/.test(local)) {
    return `91${local}`
  }

  return null
}

export async function queueMessage(
  phone: string,
  message: string,
  options?: { campaign?: string; template?: string }
): Promise<boolean> {
  try {
    if (!message || !message.trim()) {
      console.error('[Queue] ❌ Message body cannot be empty')
      return false
    }

    const cleanPhone = validateAndNormalizePhone(phone)
    if (!cleanPhone) {
      console.error(`[Queue] ❌ Invalid phone number "${phone}" (must be a valid 10-digit Indian mobile number)`)
      return false
    }

    fs.mkdirSync(QUEUE_DIR, { recursive: true })

    const filename = `${cleanPhone}_${Date.now()}.json`
    const filePath = path.join(QUEUE_DIR, filename)

    fs.writeFileSync(filePath, JSON.stringify({
      phone: cleanPhone,
      message: message.trim(),
      campaign: options?.campaign,
      template: options?.template,
      attempts: 0,
      queuedAt: new Date().toISOString(),
    }, null, 2))

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
