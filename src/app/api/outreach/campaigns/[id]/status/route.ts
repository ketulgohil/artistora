import { NextResponse } from 'next/server'
import { getCampaignStatus, getActiveCampaigns } from '@/outreach/campaign-runner'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const state = getCampaignStatus(id)

  if (!state) {
    return NextResponse.json({
      status: 'inactive',
      message: 'Campaign is not currently running (may be completed or not yet started)',
    })
  }

  return NextResponse.json({
    status: state.status,
    totalRecipients: state.config.artistIds.length,
    sentCount: state.sentCount,
    failedCount: state.failedCount,
    totalProcessed: state.totalProcessed,
    currentIndex: state.currentIndex,
    startTime: state.startTime,
    errors: state.errors.slice(-10),
    progress: state.config.artistIds.length > 0
      ? Math.round((state.totalProcessed / state.config.artistIds.length) * 100)
      : 0,
  })
}

// GET all active campaigns
export async function listActiveCampaigns() {
  return getActiveCampaigns()
}
