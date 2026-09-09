import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.login, 'login')

    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((limiter.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    const payload = await getPayload({ config })
    const body = await request.json()

    const { email, password } = body

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const result = await payload.login({
      collection: 'users',
      data: { email: email.trim().toLowerCase(), password },
    })

    if (!result.token || !result.user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      user: { id: result.user.id, name: (result.user as any).name, email: result.user.email, role: (result.user as any).role },
    })

    response.cookies.set('payload-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }
}
