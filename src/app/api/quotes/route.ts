import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// POST /api/quotes — Artist submits a quote for a lead
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const {
      leadId,
      artistId,
      amount,
      priceType,
      unitRate,
      units,
      message,
      estimatedHours,
      travelFee,
      numberOfArtists,
      validUntil,
    } = body

    if (!leadId || !artistId || !amount) {
      return NextResponse.json({ error: 'leadId, artistId, and amount are required' }, { status: 400 })
    }

    // Verify the lead exists
    const lead = await payload.findByID({ collection: 'leads', id: leadId }).catch(() => null)
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Verify the artist exists and is approved/verified
    const artist = await payload.findByID({ collection: 'artists', id: artistId }).catch(() => null)
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }

    // Check if artist already quoted this lead
    const existing = await payload.find({
      collection: 'quotes',
      where: {
        and: [
          { lead: { equals: leadId } },
          { artist: { equals: artistId } },
        ],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ error: 'You have already submitted a quote for this lead' }, { status: 409 })
    }

    // Create the quote
    const quote = await payload.create({
      collection: 'quotes',
      data: {
        lead: leadId,
        artist: artistId,
        priceType: priceType || 'package',
        unitRate: unitRate ? Number(unitRate) : undefined,
        units: units ? Number(units) : undefined,
        amount: Number(amount),
        message: message || undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        travelFee: travelFee ? Number(travelFee) : 0,
        numberOfArtists: numberOfArtists ? Number(numberOfArtists) : 1,
        validUntil: validUntil || undefined,
        status: 'sent',
      },
    })

    return NextResponse.json({ success: true, quoteId: quote.id })
  } catch (error) {
    console.error('Quote creation error:', error)
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 })
  }
}

// GET /api/quotes?leadId=X — Get quotes for a lead (customer view)
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const quotes = await payload.find({
      collection: 'quotes',
      where: {
        and: [
          { lead: { equals: leadId } },
          { status: { in: ['sent', 'viewed', 'accepted'] } },
        ],
      },
      sort: '-amount',
      depth: 2,
    })

    // Return limited data for customer view
    const customerView = quotes.docs.map((q: any) => ({
      id: q.id,
      amount: q.amount,
      priceType: q.priceType || 'package',
      unitRate: q.unitRate,
      units: q.units,
      message: q.message,
      estimatedHours: q.estimatedHours,
      travelFee: q.travelFee,
      numberOfArtists: q.numberOfArtists,
      validUntil: q.validUntil,
      status: q.status,
      artistName: q.artist?.displayName || 'Artist',
      artistRating: q.artist?.rating || 0,
      artistPortfolio: q.artist?.portfolioImages?.slice(0, 3) || [],
    }))

    return NextResponse.json({ quotes: customerView })
  } catch (error) {
    console.error('Quote lookup error:', error)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}
