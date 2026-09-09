import { NextRequest, NextResponse } from 'next/server'
import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction } from 'payload'
import config from '@payload-config'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { verifyToken, createTokenPair } from '@/lib/token'

// POST /api/quotes/[id]/accept — Customer accepts a quote (requires token)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let transactionReq: Awaited<ReturnType<typeof createLocalReq>> | null = null
  let transactionStarted = false
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.quoteAccept, 'quoteAccept')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const payload = await getPayload({ config })
    transactionReq = await createLocalReq({ req: { headers: request.headers } }, payload)
    transactionStarted = await initTransaction(transactionReq)
    const { id: quoteId } = await params
    const body = await request.json().catch(() => ({}))
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 })
    }

    // ── Step 1: Fetch quote ──
    const quote = await payload.findByID({
      collection: 'quotes',
      id: quoteId,
      depth: 2,
      req: transactionReq,
    }).catch(() => null)

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // ── Step 2: Validate quote expiration BEFORE authorization ──
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
      return NextResponse.json({ error: 'This quote has expired and can no longer be accepted' }, { status: 410 })
    }

    // ── Step 3: Authorization FIRST (before revealing quote status) ──
    const leadId = Number(typeof quote.lead === 'object' ? quote.lead.id : quote.lead)
    const artistId = Number(typeof quote.artist === 'object' ? quote.artist.id : quote.artist)

    const lead = await payload.findByID({
      collection: 'leads',
      id: leadId,
      req: transactionReq,
    }).catch(() => null)

    if (!lead) {
      return NextResponse.json({ error: 'Originating lead not found' }, { status: 404 })
    }

    const tokenResult = verifyToken({
      rawToken: token,
      storedHash: lead.viewTokenHash,
      expiresAt: lead.viewTokenExpiresAt,
      revokedAt: lead.viewTokenRevokedAt,
    })

    if (!tokenResult.valid) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status })
    }

    // ── Step 4: Check if already accepted — return existing booking (idempotent) ──
    if (quote.status === 'accepted') {
      const existingBooking = await payload.find({
        collection: 'bookings',
        where: { quote: { equals: quoteId } },
        limit: 1,
        req: transactionReq,
      })
      return NextResponse.json({
        success: true,
        message: 'Quote already accepted',
        bookingId: existingBooking.docs[0]?.id || null,
      })
    }

    // ── Step 5: Validate quote is in acceptant state ──
    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      return NextResponse.json({ error: 'Quote is no longer available' }, { status: 400 })
    }

    // ── Step 6: Check if another quote for this lead was already accepted ──
    const acceptedQuotes = await payload.find({
      collection: 'quotes',
      where: {
        and: [
          { lead: { equals: leadId } },
          { status: { equals: 'accepted' } },
        ],
      },
      limit: 1,
      req: transactionReq,
    })

    if (acceptedQuotes.docs.length > 0) {
      return NextResponse.json({ error: 'Another quote for this lead has already been accepted' }, { status: 409 })
    }

    // ── Step 7: Check if a booking already exists for this quote ──
    const existingBookings = await payload.find({
      collection: 'bookings',
      where: { quote: { equals: quoteId } },
      limit: 1,
      req: transactionReq,
    })

    if (existingBookings.docs.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Booking already exists for this quote',
        bookingId: existingBookings.docs[0].id,
      })
    }

    // ── Step 8: Execute acceptance atomically ──
    // Reject all other quotes for this lead
    const otherQuotes = await payload.find({
      collection: 'quotes',
      where: {
        and: [
          { lead: { equals: leadId } },
          { id: { not_equals: quoteId } },
          { status: { in: ['sent', 'viewed'] } },
        ],
      },
      req: transactionReq,
    })

    for (const other of otherQuotes.docs) {
      await payload.update({
        collection: 'quotes',
        id: other.id,
        data: { status: 'rejected' },
        req: transactionReq,
      })
    }

    // Accept this quote
    await payload.update({
      collection: 'quotes',
      id: quoteId,
      data: { status: 'accepted' },
      req: transactionReq,
    })

    // Create a new booking-access token (separate from the lead view token)
    const bookingToken = createTokenPair(30 * 24 * 60 * 60 * 1000) // 30 days

    // Update lead: revoke view token, store booking access token
    await payload.update({
      collection: 'leads',
      id: leadId,
      data: {
        status: 'artist_selected',
        matchedArtists: [artistId],
        acceptedQuote: Number(quoteId),
        viewTokenRevokedAt: new Date().toISOString(),
        // Store booking access token hash for post-acceptance viewing
        bookingAccessTokenHash: bookingToken.hash,
        bookingAccessTokenExpiresAt: bookingToken.expiresAt,
      } as any,
      req: transactionReq,
    })

    // Create exactly one booking
    const booking = await payload.create({
      collection: 'bookings',
      data: {
        name: lead.customerName,
        phone: lead.customerPhone,
        email: lead.customerEmail || undefined,
        userId: lead.userId || undefined,
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
      req: transactionReq,
    })

    await commitTransaction(transactionReq)
    transactionStarted = false

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingAccessToken: bookingToken.rawToken,
      bookingAccessTokenExpiresAt: bookingToken.expiresAt,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 })
  } finally {
    if (transactionReq && transactionStarted) {
      await killTransaction(transactionReq).catch(() => undefined)
    }
  }
}
