import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, authenticateRequest } from '@/lib/payload'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const result = await authenticateRequest(request, payload)

    if (!result || !result.user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = result.user as any

    // Decouple admin session: treat admin as a guest on frontend so admin panel login does not alter the public marketplace experience
    if (user?.role === 'admin') {
      return NextResponse.json({ user: null, artistProfile: null }, { status: 200 })
    }

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
      artistProfile: artistProfile
        ? {
            id: artistProfile.id,
            slug: (artistProfile as any).slug,
            displayName: (artistProfile as any).displayName,
          }
        : null,
    })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
