/**
 * Campaign runner — orchestrates outreach message sending with rate limiting.
 * Uses Upstash Redis (or in-memory fallback) for rate limits.
 * Sends messages via WhatsApp (whatsapp-web.js) or Instagram DM (Playwright).
 */

import type { CampaignConfig, OutreachChannel, TemplateVariables } from './types'
import { templates, renderTemplate, defaultVariables } from './templates'
import { canSend, recordSent, getUsageStats } from './rate-limit'

// In-memory campaign state
const activeCampaigns = new Map<string, {
  config: CampaignConfig
  currentIndex: number
  totalProcessed: number
  status: 'running' | 'paused' | 'completed' | 'error'
  startTime: Date
  errors: string[]
  sentCount: number
  failedCount: number
}>()

// Lazy-load senders to avoid Edge runtime issues
async function getWhatsAppSender() {
  const mod = await import('./senders/whatsapp')
  return mod
}

async function getInstagramSender() {
  const mod = await import('./senders/instagram-dm')
  return mod
}

// Send a message via the appropriate channel
async function sendViaChannel(
  channel: OutreachChannel,
  to: string,
  body: string,
  username?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  switch (channel) {
    case 'whatsapp': {
      const { sendMessage } = await getWhatsAppSender()
      return sendMessage({ to, body })
    }
    case 'instagram_dm': {
      if (!username) return { success: false, error: 'Instagram username required' }
      const { sendInstagramDM } = await getInstagramSender()
      return sendInstagramDM({ username, message: body })
    }
    default:
      return { success: false, error: `Channel "${channel}" not implemented` }
  }
}

// Start a campaign
export async function startCampaign(
  config: CampaignConfig
): Promise<{ campaignId: string; status: string; message: string }> {
  if (activeCampaigns.has(config.campaignId)) {
    return { campaignId: config.campaignId, status: 'error', message: 'Campaign already active' }
  }

  const state = {
    config,
    currentIndex: 0,
    totalProcessed: 0,
    status: 'running' as const,
    startTime: new Date(),
    errors: [] as string[],
    sentCount: 0,
    failedCount: 0,
  }

  activeCampaigns.set(config.campaignId, state)

  // Process in background
  processCampaign(config.campaignId).catch(err => {
    const s = activeCampaigns.get(config.campaignId)
    if (s) {
      s.status = 'error'
      s.errors.push(`Fatal: ${err.message}`)
    }
  })

  return {
    campaignId: config.campaignId,
    status: 'running',
    message: `Campaign started with ${config.artistIds.length} recipients`,
  }
}

// Process campaign messages sequentially
async function processCampaign(campaignId: string): Promise<void> {
  const state = activeCampaigns.get(campaignId)
  if (!state) return

  const { config } = state
  const template = templates[config.template] || templates.warm_intro_en

  console.log(`[CampaignRunner] Starting campaign ${campaignId}: ${config.artistIds.length} recipients`)

  for (let i = 0; i < config.artistIds.length; i++) {
    // Check if campaign is still running
    const currentState = activeCampaigns.get(campaignId)
    if (!currentState || currentState.status !== 'running') {
      console.log(`[CampaignRunner] Campaign ${campaignId} ${currentState?.status || 'stopped'}`)
      break
    }

    const artistId = config.artistIds[i]
    const artistIdStr = String(artistId)

    // Check rate limit before sending
    const rateCheck = await canSend(config.channel, config.campaignId)
    if (!rateCheck.allowed) {
      console.log(`[CampaignRunner] Rate limited: ${rateCheck.reason}. Waiting ${rateCheck.retryAfterMs}ms`)
      
      // If rate limited, pause the campaign
      currentState.status = 'paused'
      currentState.errors.push(`Rate limited: ${rateCheck.reason}. Campaign paused.`)
      
      // Auto-resume after the wait period (if under 1 hour)
      if (rateCheck.retryAfterMs && rateCheck.retryAfterMs < 3600000) {
        setTimeout(() => {
          const s = activeCampaigns.get(campaignId)
          if (s && s.status === 'paused') {
            s.status = 'running'
            console.log(`[CampaignRunner] Auto-resuming campaign ${campaignId} after rate limit`)
            processCampaign(campaignId).catch(err => {
              s.status = 'error'
              s.errors.push(`Resume error: ${err.message}`)
            })
          }
        }, rateCheck.retryAfterMs)
      }
      break
    }

    // Build message body with template variables
    // In production, artist data would come from DB lookup
    const vars: TemplateVariables = {
      ...defaultVariables,
      artistName: `Artist #${i + 1}`, // Placeholder — real impl fetches from DB
    }

    const body = config.customTemplateBody || template.body
    const renderedBody = renderTemplate(body, vars)

    // Send the message
    console.log(`[CampaignRunner] Sending to ${artistIdStr} via ${config.channel}`)
    
    const result = await sendViaChannel(
      config.channel,
      artistIdStr,
      renderedBody,
      undefined // username would come from artist data
    )

    if (result.success) {
      currentState.sentCount++
      await recordSent(config.channel, config.campaignId)
      console.log(`[CampaignRunner] Sent to ${artistIdStr} ✓`)
    } else {
      currentState.failedCount++
      currentState.errors.push(`Failed ${artistIdStr}: ${result.error}`)
      console.log(`[CampaignRunner] Failed ${artistIdStr}: ${result.error}`)
    }

    currentState.totalProcessed = i + 1
    currentState.currentIndex = i

    // Wait before next message (skip for last)
    if (i < config.artistIds.length - 1 && currentState.status === 'running') {
      const delayMs = config.delayBetweenMessages * 1000
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  // Mark as completed
  const finalState = activeCampaigns.get(campaignId)
  if (finalState && finalState.status === 'running') {
    finalState.status = 'completed'
    console.log(
      `[CampaignRunner] Campaign ${campaignId} completed: ${finalState.sentCount} sent, ${finalState.failedCount} failed`
    )
  }
}

// Pause a campaign
export function pauseCampaign(campaignId: string): { success: boolean; message: string } {
  const state = activeCampaigns.get(campaignId)
  if (!state) return { success: false, message: 'Campaign not found' }
  if (state.status !== 'running') return { success: false, message: `Cannot pause campaign in "${state.status}" state` }

  state.status = 'paused'
  return { success: true, message: 'Campaign paused' }
}

// Resume a campaign
export function resumeCampaign(campaignId: string): { success: boolean; message: string } {
  const state = activeCampaigns.get(campaignId)
  if (!state) return { success: false, message: 'Campaign not found' }
  if (state.status !== 'paused') return { success: false, message: `Cannot resume campaign in "${state.status}" state` }

  state.status = 'running'

  // Restart processing in background
  processCampaign(campaignId).catch(err => {
    state.status = 'error'
    state.errors.push(`Resume error: ${err.message}`)
  })

  return { success: true, message: 'Campaign resumed' }
}

// Stop a campaign permanently
export function stopCampaign(campaignId: string): { success: boolean; message: string } {
  const state = activeCampaigns.get(campaignId)
  if (!state) return { success: false, message: 'Campaign not found' }

  state.status = 'completed'
  return { success: true, message: 'Campaign stopped' }
}

// Get campaign status
export function getCampaignStatus(campaignId: string) {
  return activeCampaigns.get(campaignId) || null
}

// Get all active campaigns with stats
export async function getActiveCampaigns() {
  const campaigns = Array.from(activeCampaigns.entries()).map(([id, state]) => ({
    id,
    status: state.status,
    totalRecipients: state.config.artistIds.length,
    sentCount: state.sentCount,
    failedCount: state.failedCount,
    totalProcessed: state.totalProcessed,
    startTime: state.startTime,
    errors: state.errors.slice(-5), // Last 5 errors
  }))

  // Add rate limit usage for each active campaign
  const whatsappStats = await getUsageStats('whatsapp')
  const instagramStats = await getUsageStats('instagram_dm')

  return {
    campaigns,
    rateLimits: {
      whatsapp: whatsappStats,
      instagram: instagramStats,
    },
  }
}
