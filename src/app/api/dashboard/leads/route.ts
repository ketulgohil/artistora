import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

// GET /api/dashboard/leads — Fetch matched leads for the logged-in artist
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

    // Fetch leads where artist is in matchedArtists
    const leads = await payload.find({
      collection: 'leads',
      where: artistId
        ? {
            matchedArtists: { contains: artistId },
          }
        : {},
      sort: '-createdAt',
      limit: 50,
      depth: 1,
    })

    // Fetch quotes submitted by this artist for these leads
    const quotes = artistId
      ? await payload.find({
          collection: 'quotes',
          where: {
            artist: { equals: artistId },
          },
          limit: 100,
        })
      : { docs: [] }

    const quoteByLeadId = new Map<number, any>()
    for (const q of quotes.docs) {
      const lId = typeof q.lead === 'object' && q.lead !== null ? (q.lead as any).id : q.lead
      if (lId) quoteByLeadId.set(Number(lId), q)
    }

    return NextResponse.json({
      artistId,
      leads: leads.docs.map((l: any) => {
        const myQuote = quoteByLeadId.get(Number(l.id))
        return {
          id: l.id,
          eventType: l.eventType,
          eventDate: l.eventDate,
          eventLocation: l.eventLocation,
          guestCount: l.guestCount,
          budgetRange: l.budgetRange,
          designStyle: l.designStyle,
          additionalNotes: l.additionalNotes,
          status: l.status,
          createdAt: l.createdAt,
          // Privacy protection: only reveal customer contact details after artist selection
          customerName: ['artist_selected', 'booking_pending', 'booked'].includes(l.status) ? l.customerName : 'Customer',
          customerPhone: ['artist_selected', 'booking_pending', 'booked'].includes(l.status) ? l.customerPhone : undefined,
          myQuote: myQuote
            ? {
                id: myQuote.id,
                amount: myQuote.amount,
                priceType: myQuote.priceType,
                status: myQuote.status,
                createdAt: myQuote.createdAt,
              }
            : null,
        }
      }),
    })
  } catch (error) {
    console.error('Dashboard leads fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
