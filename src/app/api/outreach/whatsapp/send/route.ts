import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json({ error: 'to and message are required' }, { status: 400 })
    }

    const { sendMessage } = await import('@/outreach/senders/whatsapp')
    const result = await sendMessage({ to, body: message })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
