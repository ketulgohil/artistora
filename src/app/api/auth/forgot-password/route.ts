import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { generateToken, hashToken } from '@/lib/token'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

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

    // Generate reset token manually (avoids Payload's email adapter requirement)
    const rawToken = generateToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString()

    // Store hashed token on user record
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiration: expiresAt,
      } as any,
    })

    // Build reset URL with raw token (user clicks this link)
    const resetUrl = `${SITE_URL}/reset-password?token=${rawToken}`

    // Send email via Resend (non-blocking)
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
