import { NextResponse } from 'next/server'
import { getUsageStats } from '@/outreach/rate-limit'

export async function GET() {
  try {
    const whatsapp = await getUsageStats('whatsapp')
    const instagram = await getUsageStats('instagram_dm')
    const email = await getUsageStats('email')

    return NextResponse.json({
      whatsapp,
      instagram,
      email,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get rate limit stats'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
