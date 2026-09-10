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

    // Handle both FormData and JSON
    let name: string, email: string, password: string, role: string, phone: string, city: string, bio: string, startingPrice: string, yearsOfExperience: string
    let profilePhotoFile: File | null = null

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      name = formData.get('name') as string
      email = formData.get('email') as string
      password = formData.get('password') as string
      role = formData.get('role') as string
      phone = formData.get('phone') as string || ''
      city = formData.get('city') as string || 'Ahmedabad'
      bio = formData.get('bio') as string || ''
      startingPrice = formData.get('startingPrice') as string || ''
      yearsOfExperience = formData.get('yearsOfExperience') as string || ''
      profilePhotoFile = formData.get('profilePhoto') as File | null
      if (!profilePhotoFile || profilePhotoFile.size === 0) profilePhotoFile = null
    } else {
      const body = await request.json()
      name = body.name
      email = body.email
      password = body.password
      role = body.role
      phone = body.phone || ''
      city = body.city || 'Ahmedabad'
      bio = body.bio || ''
      startingPrice = body.startingPrice || ''
      yearsOfExperience = body.yearsOfExperience || ''
    }

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
    const allowedRoles = ['customer', 'artist'] as const
    const requestedRole: 'customer' | 'artist' = allowedRoles.includes(role as any) ? (role as 'customer' | 'artist') : 'customer'

    // Artist-specific validation
    if (requestedRole === 'artist') {
      if (!bio || typeof bio !== 'string' || bio.trim().length < 20) {
        return NextResponse.json({ error: 'Bio must be at least 20 characters' }, { status: 400 })
      }
      if (!startingPrice || isNaN(Number(startingPrice)) || Number(startingPrice) < 0) {
        return NextResponse.json({ error: 'Please enter a valid starting price' }, { status: 400 })
      }
      if (!yearsOfExperience || isNaN(Number(yearsOfExperience)) || Number(yearsOfExperience) < 0) {
        return NextResponse.json({ error: 'Please enter your years of experience' }, { status: 400 })
      }
    }

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

    // If registering as artist, create artist profile with new fields
    let artistProfile = null
    if (requestedRole === 'artist') {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      // Upload profile photo if provided
      let profilePhotoId: number | undefined
      if (profilePhotoFile && profilePhotoFile.size > 0) {
        try {
          const uploaded = await payload.create({
            collection: 'media',
            data: {
              alt: `${name.trim()} profile photo`,
            },
            filePath: undefined,
            file: {
              data: Buffer.from(await profilePhotoFile.arrayBuffer()),
              name: profilePhotoFile.name,
              mimetype: profilePhotoFile.type,
              size: profilePhotoFile.size,
            },
          } as any)
          profilePhotoId = uploaded.id
        } catch (err) {
          console.error('Failed to upload profile photo:', err)
        }
      }

      artistProfile = await payload.create({
        collection: 'artists',
        data: {
          displayName: name.trim(),
          slug: `${slug}-${user.id}`,
          user: user.id,
          phone: typeof phone === 'string' ? phone.trim().slice(0, 20) : '0000000000',
          bio: bio.trim(),
          city: typeof city === 'string' ? city.trim().slice(0, 100) : 'Ahmedabad',
          startingPrice: Number(startingPrice) || 0,
          yearsOfExperience: Number(yearsOfExperience) || 0,
          ...(profilePhotoId ? { profilePhoto: profilePhotoId } : {}),
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
