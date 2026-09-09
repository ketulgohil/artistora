import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { hashToken } from '@/lib/token'

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

    // Hash the raw token to look up the user
    const tokenHash = hashToken(token)

    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        and: [
          { resetPasswordToken: { equals: tokenHash } },
        ],
      },
      limit: 1,
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 },
      )
    }

    const user = users[0]

    // Check expiry
    const expiration = (user as any).resetPasswordExpiration
    if (!expiration || new Date(expiration) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 },
      )
    }

    // Update password and clear reset token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
        resetPasswordToken: null,
        resetPasswordExpiration: null,
      } as any,
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset. You can now log in.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    )
  }
}
