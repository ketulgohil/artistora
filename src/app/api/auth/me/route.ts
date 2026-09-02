import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('payload-token')?.value
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const result = await payload.auth({
      headers: request.headers,
    })

    if (!result || !result.user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = result.user as any

    // If artist, find their profile
    let artistProfile = null
    if (user?.role === 'artist') {
      const { docs } = await payload.find({
        collection: 'artists',
        where: { user: { equals: user.id } },
        limit: 1,
        depth: 1,
      })
      artistProfile = docs[0] || null
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      artistProfile: artistProfile ? { id: artistProfile.id, slug: (artistProfile as any).slug, displayName: (artistProfile as any).displayName } : null,
    })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
