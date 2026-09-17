import { NextResponse } from 'next/server'
import { getActiveCampaigns } from '@/outreach/campaign-runner'

export async function GET() {
  try {
    const data = await getActiveCampaigns()
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get active campaigns'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
