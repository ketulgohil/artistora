import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { startCampaign } from '@/outreach/campaign-runner'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params

    // Get campaign
    const campaign = await payload.findByID({
      collection: 'campaigns',
      id,
    })

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      return NextResponse.json(
        { error: `Cannot start campaign in "${campaign.status}" status` },
        { status: 400 },
      )
    }

    // Get matching artists based on campaign filters
    const where: any = {
      outreachStatus: { in: ['new', 'contacted'] },
    }

    if (campaign.targetFilters?.minLeadScore) {
      where.leadScore = { greater_than_equal: campaign.targetFilters.minLeadScore }
    }

    const matchingArtists = await payload.find({
      collection: 'discovered-artists',
      where,
      limit: campaign.maxRecipients || 50,
      sort: '-leadScore',
    })

    if (matchingArtists.docs.length === 0) {
      return NextResponse.json({ error: 'No matching artists found' }, { status: 400 })
    }

    // Create outreach message records for each artist
    const messageIds: string[] = []
    for (const artist of matchingArtists.docs) {
      const msg = await payload.create({
        collection: 'outreach-messages',
        data: {
          artist: artist.id as any,
          campaign: campaign.id as any,
          channel: campaign.channel,
          templateUsed: campaign.template,
          body: `Queued message for ${artist.name}`,
          status: 'queued',
          queuedAt: new Date().toISOString(),
        },
      })
      messageIds.push(String(msg.id))
    }

    // Update campaign status in DB
    await payload.update({
      collection: 'campaigns',
      id,
      data: {
        status: 'running',
        startedAt: new Date().toISOString(),
        totalRecipients: matchingArtists.docs.length,
      },
    })

    // Start the campaign runner (sends messages in background)
    const artistIds = matchingArtists.docs.map(a => String(a.id))
    const result = await startCampaign({
      campaignId: id,
      channel: campaign.channel as any,
      template: campaign.template || 'warm_intro_en',
      customTemplateBody: campaign.customTemplateBody || undefined,
      artistIds,
      delayBetweenMessages: campaign.delayBetweenMessages || 120,
      maxRecipients: campaign.maxRecipients || 50,
    })

    return NextResponse.json({
      status: result.status,
      recipients: matchingArtists.docs.length,
      messagesQueued: messageIds.length,
      message: result.message,
    })
  } catch (error) {
    console.error('[Campaign Start] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to start campaign'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
