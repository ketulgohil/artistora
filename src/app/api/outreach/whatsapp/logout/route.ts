import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { logout } = await import('@/outreach/senders/whatsapp')
    await logout()

    return NextResponse.json({
      success: true,
      message: 'WhatsApp session logged out. Scan QR code to reconnect.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to logout'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
