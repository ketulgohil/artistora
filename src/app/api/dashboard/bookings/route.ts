import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

// GET /api/dashboard/bookings — Fetch bookings for the logged-in artist
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()

    const authResult = await payload.auth({
      headers: request.headers,
    })

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = authResult.user

    if (user.role !== 'artist' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find artist profile
    const artistRes = await payload.find({
      collection: 'artists',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    const artist = artistRes.docs[0]
    if (!artist && user.role !== 'admin') {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    const artistId = artist?.id

    const bookings = await payload.find({
      collection: 'bookings',
      where: artistId
        ? {
            or: [
              { artist: { equals: artistId } },
              { 'assignedArtists.artist': { equals: artistId } },
            ],
          }
        : {},
      sort: '-createdAt',
      limit: 100,
      depth: 2,
    })

    return NextResponse.json({
      bookings: bookings.docs.map((b: any) => ({
        id: b.id,
        name: b.name,
        phone: b.phone,
        email: b.email,
        eventType: b.eventType,
        eventDate: b.eventDate,
        location: b.location,
        guestCount: b.guestCount,
        designStyle: b.designStyle,
        message: b.message,
        status: b.status,
        declineReason: b.declineReason,
        createdAt: b.createdAt,
        quote: b.quote,
        assignedArtists: b.assignedArtists,
      })),
    })
  } catch (error) {
    console.error('Dashboard bookings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
