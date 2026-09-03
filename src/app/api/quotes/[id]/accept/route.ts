import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// POST /api/quotes/[id]/accept — Customer accepts a quote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })
    const { id: quoteId } = await params

    // Find the quote
    const quote = await payload.findByID({
      collection: 'quotes',
      id: quoteId,
      depth: 2,
    }).catch(() => null)

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      return NextResponse.json({ error: 'Quote is no longer available' }, { status: 400 })
    }

    const leadId = Number(typeof quote.lead === 'object' ? quote.lead.id : quote.lead)
    const artistId = Number(typeof quote.artist === 'object' ? quote.artist.id : quote.artist)

    // Fetch originating lead
    const lead = await payload.findByID({
      collection: 'leads',
      id: leadId,
    }).catch(() => null)

    if (!lead) {
      return NextResponse.json({ error: 'Originating lead not found' }, { status: 404 })
    }

    // Reject all other quotes for this lead
    const otherQuotes = await payload.find({
      collection: 'quotes',
      where: {
        and: [
          { lead: { equals: leadId } },
          { id: { not_equals: quoteId } },
        ],
      },
    })

    for (const other of otherQuotes.docs) {
      await payload.update({
        collection: 'quotes',
        id: other.id,
        data: { status: 'rejected' },
      })
    }

    // Mark this quote as accepted
    await payload.update({
      collection: 'quotes',
      id: quoteId,
      data: { status: 'accepted' },
    })

    // Update the lead with accepted quote and artist
    await payload.update({
      collection: 'leads',
      id: leadId,
      data: {
        status: 'artist_selected',
        matchedArtists: [artistId],
        acceptedQuote: Number(quoteId),
      },
    })

    // Create booking in 'artist_pending' status so artist can accept/decline
    const booking = await payload.create({
      collection: 'bookings',
      data: {
        name: lead.customerName,
        phone: lead.customerPhone,
        email: lead.customerEmail || undefined,
        eventType: lead.eventType,
        eventDate: lead.eventDate,
        location: lead.eventLocation,
        guestCount: lead.guestCount || undefined,
        designStyle: lead.designStyle || undefined,
        message: `Booking created from accepted Quote #${quoteId}`,
        lead: leadId,
        quote: Number(quoteId),
        artist: artistId,
        assignedArtists: [
          {
            artist: artistId,
            role: 'lead',
            status: 'pending',
            fee: quote.amount,
          },
        ],
        status: 'artist_pending',
      },
    })

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    })
  } catch (error) {
    console.error('Quote accept error:', error)
    return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 })
  }
}
