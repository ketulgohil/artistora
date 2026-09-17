import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dynamic import to avoid Edge runtime issues
    const { isConnected } = await import('@/outreach/senders/whatsapp')
    const connected = await isConnected()

    return NextResponse.json({
      connected,
      status: connected ? 'ready' : 'not_connected',
      message: connected
        ? 'WhatsApp is connected and ready to send messages'
        : 'WhatsApp is not connected. Scan QR code to authenticate.',
    })
  } catch (error) {
    return NextResponse.json({
      connected: false,
      status: 'error',
      message: 'WhatsApp module not available',
    })
  }
}
