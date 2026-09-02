import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendCustomerWelcome, sendArtistWelcome } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { name, email, password, role, phone, city } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user already exists
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Create user
    const user = await payload.create({
      collection: 'users',
      data: {
        name,
        email,
        password,
        role: role === 'artist' ? 'artist' : 'customer',
      },
    })

    // If registering as artist, create an empty artist profile
    let artistProfile = null
    if (role === 'artist') {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      artistProfile = await payload.create({
        collection: 'artists',
        data: {
          displayName: name,
          slug: `${slug}-${user.id}`,
          user: user.id,
          phone: phone || '0000000000',
          bio: 'Profile coming soon',
          city: city || 'Ahmedabad',
          verified: false,
        } as any,
      })
    }

    // Send welcome email (non-blocking)
    const emailFn = role === 'artist' ? sendArtistWelcome : sendCustomerWelcome
    emailFn(email, name).catch((err) => {
      console.error(`Failed to send welcome email to ${email}:`, err)
    })

    // Log the user in by creating a session cookie
    const loginResult = await payload.login({
      collection: 'users',
      data: { email, password },
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
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}
