import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

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

    // Payload's forgotPassword sends email via configured adapter + stores token
    try {
      await payload.forgotPassword({
        collection: 'users',
        data: { email: email.trim().toLowerCase() },
      })
    } catch {
      // Silently ignore — always return success to prevent enumeration
    }

    return successResponse
  } catch {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    )
  }
}
