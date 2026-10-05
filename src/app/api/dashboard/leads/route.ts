import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, authenticateRequest } from '@/lib/payload'

// GET /api/dashboard/leads — Fetch matched leads for the logged-in artist with pagination
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()

    const authResult = await authenticateRequest(request, payload)

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

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50),
    )

    // Fetch leads where artist is in matchedArtists
    const leads = await payload.find({
      collection: 'leads',
      where: artistId
        ? {
            matchedArtists: { contains: artistId },
          }
        : {},
      sort: '-createdAt',
      page,
      limit,
      depth: 1,
    })

    // Fetch quotes submitted by this artist for these paginated leads
    const leadIds = leads.docs.map((l: any) => l.id)
    const quotes =
      artistId && leadIds.length > 0
        ? await payload.find({
            collection: 'quotes',
            where: {
              and: [{ artist: { equals: artistId } }, { lead: { in: leadIds } }],
            },
            limit: leadIds.length,
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
          customerName: ['artist_selected', 'booking_pending', 'booked'].includes(l.status)
            ? l.customerName
            : 'Customer',
          customerPhone: ['artist_selected', 'booking_pending', 'booked'].includes(l.status)
            ? l.customerPhone
            : undefined,
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
      total: leads.totalDocs,
      page: leads.page,
      totalPages: leads.totalPages,
    })
  } catch (error) {
    console.error('Dashboard leads fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
