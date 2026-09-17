import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET — Retrieve saved WhatsApp session from database
 * POST — Save WhatsApp session to database
 * DELETE — Remove saved session from database
 */

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Look for saved session in the media collection or a dedicated global
    // For simplicity, store as a media file in a private bucket
    // Alternative: use a custom collection or global
    
    // Check if there's a saved session file
    const { getSessionData } = await import('@/outreach/senders/whatsapp')
    const sessionData = getSessionData()

    if (!sessionData) {
      return NextResponse.json({
        hasSession: false,
        message: 'No saved WhatsApp session found',
      })
    }

    return NextResponse.json({
      hasSession: true,
      savedAt: JSON.parse(sessionData).savedAt,
      size: sessionData.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { sessionData } = body

    if (!sessionData) {
      // Get session from the local sender
      const { getSessionData } = await import('@/outreach/senders/whatsapp')
      const data = getSessionData()

      if (!data) {
        return NextResponse.json({ error: 'No active WhatsApp session to save' }, { status: 400 })
      }

      // Store in the media collection as a JSON file
      // Or store in a global — for now, store as media
      const Buffer = await import('buffer').then(m => m.Buffer)
      const sessionBuffer = Buffer.from(data, 'utf-8')

      // Create a media file for the session
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'WhatsApp Session',
        },
        file: {
          data: sessionBuffer,
          name: `whatsapp-session-${Date.now()}.json`,
          mimeType: 'application/json',
          size: sessionBuffer.length,
        } as any,
      })

      return NextResponse.json({
        success: true,
        message: 'WhatsApp session saved',
        mediaId: media.id,
        savedAt: new Date().toISOString(),
      })
    } else {
      // Restore from provided session data
      const { restoreSession } = await import('@/outreach/senders/whatsapp')
      const success = restoreSession(sessionData)

      return NextResponse.json({
        success,
        message: success ? 'Session restored successfully' : 'Failed to restore session',
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { logout } = await import('@/outreach/senders/whatsapp')
    await logout()

    return NextResponse.json({
      success: true,
      message: 'WhatsApp session destroyed',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
