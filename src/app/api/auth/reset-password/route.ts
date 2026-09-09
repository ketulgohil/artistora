import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

const MIN_PASSWORD_LENGTH = 6
const MAX_PASSWORD_LENGTH = 128

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.resetPassword, 'resetPassword')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const payload = await getPayload({ config })
    const body = await request.json()
    const { token, password } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 })
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters` },
        { status: 400 },
      )
    }

    // Reset password via Payload's built-in method
    // This validates the token and updates the password
    await payload.resetPassword({
      collection: 'users',
      overrideAccess: true,
      data: {
        token,
        password,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset. You can now log in.',
    })
  } catch (error: any) {
    // Payload throws if token is invalid or expired
    const message = error?.message || 'Failed to reset password'
    if (message.includes('expired') || message.includes('invalid') || message.includes('token')) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    )
  }
}
