import { NextRequest, NextResponse } from 'next/server'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendCustomerWelcome, sendArtistWelcome, sendAdminNewArtistNotification } from '@/lib/email'

const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 128

export async function POST(request: NextRequest) {
  try {
    const limiter = await rateLimitAsync(getClientIp(request), RATE_LIMITS.register, 'register')
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    const payload = await getPayload({ config })
    const body = await request.json()

    const { name, email, password, role, phone, city } = body

    // Input validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (typeof name !== 'string' || name.trim().length < 2 || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: 'Name must be 2-100 characters' }, { status: 400 })
    }

    if (typeof email !== 'string' || !email.includes('@') || email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ error: 'Password must be 6-128 characters' }, { status: 400 })
    }

    // Only allow customer or artist registration — never admin
    const allowedRoles = ['customer', 'artist']
    const requestedRole = allowedRoles.includes(role) ? role : 'customer'

    // Check if user already exists
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email.trim().toLowerCase() } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Create user (role forced to customer/artist, never admin)
    const user = await payload.create({
      collection: 'users',
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: requestedRole,
      },
    })

    // If registering as artist, create an empty artist profile
    let artistProfile = null
    if (requestedRole === 'artist') {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      artistProfile = await payload.create({
        collection: 'artists',
        data: {
          displayName: name.trim(),
          slug: `${slug}-${user.id}`,
          user: user.id,
          phone: typeof phone === 'string' ? phone.trim().slice(0, 20) : '0000000000',
          bio: 'Profile coming soon',
          city: typeof city === 'string' ? city.trim().slice(0, 100) : 'Ahmedabad',
          verified: false,
          approvalStatus: 'pending',
        } as any,
      })
    }

    // Send welcome email (non-blocking)
    const emailFn = requestedRole === 'artist' ? sendArtistWelcome : sendCustomerWelcome
    emailFn(email.trim().toLowerCase(), name.trim()).catch(() => {})

    // Notify admin of new artist registration (non-blocking)
    if (requestedRole === 'artist') {
      sendAdminNewArtistNotification({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: typeof phone === 'string' ? phone.trim() : undefined,
        city: typeof city === 'string' ? city.trim() : undefined,
      }).catch(() => {})
    }

    // Log the user in by creating a session cookie
    const loginResult = await payload.login({
      collection: 'users',
      data: { email: email.trim().toLowerCase(), password },
    })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      artistProfile: artistProfile ? { id: artistProfile.id, slug: (artistProfile as any).slug } : null,
    })

    // Set token cookie
    if (loginResult.token) {
      response.cookies.set('payload-token', loginResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
    }

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
