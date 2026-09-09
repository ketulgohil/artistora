import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.forgotPassword, 'forgotPassword')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const payload = await getPayload({ config })
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })

    // Look up user — silently ignore if not found
    const { docs: users } = await payload.find({
      collection: 'users',
      where: { email: { equals: email.trim().toLowerCase() } },
      limit: 1,
    })

    if (users.length === 0) {
      return successResponse
    }

    const user = users[0]

    // Generate reset token via Payload's built-in method
    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email: user.email },
    })

    // Build reset URL
    const resetUrl = `${SITE_URL}/reset-password?token=${token}`

    // Send email (non-blocking)
    sendPasswordResetEmail(user.email, {
      name: (user as any).name || 'there',
      resetUrl,
    }).catch(() => {})

    return successResponse
  } catch {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    )
  }
}
