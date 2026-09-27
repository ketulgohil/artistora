import { getPayloadClient } from '../../lib/payload'

interface LogMessageOptions {
  campaignName?: string
  templateUsed?: string
  channel?: 'whatsapp' | 'instagram_dm' | 'email' | 'sms'
  status?: 'sent' | 'failed' | 'delivered' | 'read'
  messageSid?: string
  error?: string
}

/**
 * Logs a sent/attempted outreach message into Payload CMS:
 * 1. Finds the matched discovered artist by phone
 * 2. Creates a record in `outreach-messages`
 * 3. Updates `discovered-artists` record (outreachStatus, lastContactedAt, etc.)
 */
export async function logOutreachMessage(
  rawPhone: string,
  messageBody: string,
  options: LogMessageOptions = {}
): Promise<{ success: boolean; messageId?: string | number; artistId?: string | number }> {
  try {
    const payload = await getPayloadClient()
    const digits = rawPhone.replace(/[^\d]/g, '')
    const local10 = digits.slice(-10)
    const e164 = `+91${local10}`
    const raw91 = `91${local10}`

    // Find artist by phone or whatsappNumber variations
    const artistResult = await payload.find({
      collection: 'discovered-artists',
      where: {
        or: [
          { phone: { equals: e164 } },
          { phone: { equals: raw91 } },
          { phone: { equals: local10 } },
          { phone: { contains: local10 } },
          { whatsappNumber: { equals: e164 } },
          { whatsappNumber: { equals: raw91 } },
          { whatsappNumber: { equals: local10 } },
          { whatsappNumber: { contains: local10 } },
        ],
      },
      limit: 1,
    })

    const artist = artistResult.docs[0]
    if (!artist) {
      console.log(`[LogMessage] No discovered artist found for phone ${rawPhone}`)
      return { success: false }
    }

    const now = new Date().toISOString()
    const channel = options.channel || 'whatsapp'
    const status = options.status || 'sent'
    const campaignName = options.campaignName || 'manual_whatsapp'
    const templateUsed = (options.templateUsed || 'custom') as any

    // 1. Create outreach-messages record
    const msgDoc = await payload.create({
      collection: 'outreach-messages',
      data: {
        artist: artist.id as any,
        channel,
        templateUsed,
        campaignName,
        body: messageBody,
        status,
        sentAt: status === 'sent' ? now : undefined,
        queuedAt: now,
        messageSid: options.messageSid,
        errorMessage: options.error,
      },
    })

    // 2. Update discovered-artists record
    const history = Array.isArray(artist.campaignHistory) ? [...artist.campaignHistory] : []
    history.push({
      campaign: campaignName,
      template: templateUsed,
      sentAt: now,
      status,
    })

    await payload.update({
      collection: 'discovered-artists',
      id: artist.id,
      data: {
        outreachStatus: status === 'sent' ? 'contacted' : artist.outreachStatus,
        outreachAttempts: ((artist.outreachAttempts as number) || 0) + 1,
        lastContactedAt: status === 'sent' ? now : artist.lastContactedAt,
        lastCampaign: campaignName,
        lastTemplateUsed: templateUsed,
        messageStatus: status === 'sent' ? 'sent' : artist.messageStatus,
        campaignHistory: history as any,
      },
    })

    console.log(`[LogMessage] ✅ Logged outreach message #${msgDoc.id} for ${artist.name}`)
    return { success: true, messageId: msgDoc.id, artistId: artist.id }
  } catch (err: any) {
    console.error(`[LogMessage] ❌ Failed to log message for ${rawPhone}:`, err.message)
    return { success: false }
  }
}
