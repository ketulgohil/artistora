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

    // Reject all other quotes for this lead
    const otherQuotes = await payload.find({
      collection: 'quotes',
      where: {
        and: [
          { lead: { equals: typeof quote.lead === 'object' ? quote.lead.id : quote.lead } },
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
    const leadId = typeof quote.lead === 'object' ? quote.lead.id : quote.lead
    const artistId = typeof quote.artist === 'object' ? quote.artist.id : quote.artist

    await payload.update({
      collection: 'leads',
      id: leadId,
      data: {
        status: 'accepted',
        matchedArtists: [artistId],
        acceptedQuote: quoteId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Quote accept error:', error)
    return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 })
  }
}
