import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { getQRCode } = await import('@/outreach/senders/whatsapp')
    const result = await getQRCode()

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get QR code'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
