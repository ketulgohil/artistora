import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { pauseCampaign, resumeCampaign, stopCampaign, getCampaignStatus } from '@/outreach/campaign-runner'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = body.action || 'toggle'

    const campaign = await payload.findByID({
      collection: 'campaigns',
      id,
    })

    let result: { success: boolean; message: string }

    if (action === 'stop') {
      result = stopCampaign(id)
    } else if (action === 'resume' || (action === 'toggle' && campaign.status === 'paused')) {
      result = resumeCampaign(id)
    } else if (action === 'pause' || (action === 'toggle' && campaign.status === 'running')) {
      result = pauseCampaign(id)
    } else {
      return NextResponse.json(
        { error: `Cannot perform "${action}" on campaign in "${campaign.status}" status` },
        { status: 400 },
      )
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    // Update DB status to match runner status
    const runnerState = getCampaignStatus(id)
    const newStatus = runnerState?.status || (action === 'stop' ? 'completed' : campaign.status)

    await payload.update({
      collection: 'campaigns',
      id,
      data: { status: newStatus as any },
    })

    return NextResponse.json({
      status: newStatus,
      message: result.message,
      stats: runnerState ? {
        sentCount: runnerState.sentCount,
        failedCount: runnerState.failedCount,
        totalProcessed: runnerState.totalProcessed,
      } : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle campaign'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
