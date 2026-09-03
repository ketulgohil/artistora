import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

// GET /api/dashboard/availability — Get blocked dates & booked dates for logged-in artist
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await payload.auth({ headers: request.headers })

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = authResult.user

    const artistRes = await payload.find({
      collection: 'artists',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    const artist = artistRes.docs[0]
    if (!artist) {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    // Fetch confirmed/in-progress bookings for this artist
    const bookings = await payload.find({
      collection: 'bookings',
      where: {
        and: [
          {
            or: [
              { artist: { equals: artist.id } },
              { 'assignedArtists.artist': { equals: artist.id } },
            ],
          },
          { status: { in: ['confirmed', 'in_progress'] } },
        ],
      },
      limit: 100,
    })

    const bookedDates = bookings.docs.map((b: any) => ({
      bookingId: b.id,
      eventDate: b.eventDate,
      eventType: b.eventType,
      customerName: b.name,
    }))

    return NextResponse.json({
      unavailableDates: artist.unavailableDates || [],
      bookedDates,
    })
  } catch (error) {
    console.error('Availability fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}

// POST /api/dashboard/availability — Block a date
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await payload.auth({ headers: request.headers })

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = authResult.user
    const { date, reason } = await request.json()

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const artistRes = await payload.find({
      collection: 'artists',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    const artist = artistRes.docs[0]
    if (!artist) {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    const existingUnavailable = Array.isArray(artist.unavailableDates)
      ? artist.unavailableDates
      : []

    // Format target date
    const targetDateStr = new Date(date).toISOString().split('T')[0]

    // Check if already blocked
    const alreadyBlocked = existingUnavailable.some(
      (u: any) => new Date(u.date).toISOString().split('T')[0] === targetDateStr,
    )

    if (alreadyBlocked) {
      return NextResponse.json({ error: 'Date is already blocked' }, { status: 400 })
    }

    const updatedDates = [
      ...existingUnavailable,
      {
        date: new Date(date).toISOString(),
        reason: reason || 'Unavailable',
      },
    ]

    await payload.update({
      collection: 'artists',
      id: artist.id,
      data: {
        unavailableDates: updatedDates,
      },
    })

    return NextResponse.json({ success: true, unavailableDates: updatedDates })
  } catch (error) {
    console.error('Availability block error:', error)
    return NextResponse.json({ error: 'Failed to block date' }, { status: 500 })
  }
}

// DELETE /api/dashboard/availability — Unblock a date
export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await payload.auth({ headers: request.headers })

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = authResult.user
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const artistRes = await payload.find({
      collection: 'artists',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    const artist = artistRes.docs[0]
    if (!artist) {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    const targetDateStr = new Date(date).toISOString().split('T')[0]
    const existingUnavailable = Array.isArray(artist.unavailableDates)
      ? artist.unavailableDates
      : []

    const updatedDates = existingUnavailable.filter(
      (u: any) => new Date(u.date).toISOString().split('T')[0] !== targetDateStr,
    )

    await payload.update({
      collection: 'artists',
      id: artist.id,
      data: {
        unavailableDates: updatedDates,
      },
    })

    return NextResponse.json({ success: true, unavailableDates: updatedDates })
  } catch (error) {
    console.error('Availability unblock error:', error)
    return NextResponse.json({ error: 'Failed to unblock date' }, { status: 500 })
  }
}
