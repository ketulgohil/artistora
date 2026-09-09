import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { verifyToken } from '@/lib/token'

const MAX_MESSAGE_LENGTH = 2000
const MAX_AMOUNT = 10_000_000
const VALID_PRICE_TYPES = ['package', 'hourly', 'per_person', 'custom_quote']

// POST /api/quotes — Artist submits a quote for a lead
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.quoteCreate, 'quoteCreate')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const payload = await getPayload({ config })
    const body = await request.json()

    const {
      leadId,
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

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }
    if (amount === undefined || amount === null || Number(amount) < 0) {
      return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount < 0 || numAmount > MAX_AMOUNT) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (unitRate !== undefined && unitRate !== null) {
      const n = Number(unitRate)
      if (isNaN(n) || n < 0) return NextResponse.json({ error: 'Invalid unitRate' }, { status: 400 })
    }
    if (units !== undefined && units !== null) {
      const n = Number(units)
      if (isNaN(n) || n < 1 || !Number.isInteger(n)) return NextResponse.json({ error: 'Invalid units' }, { status: 400 })
    }
    if (estimatedHours !== undefined && estimatedHours !== null) {
      const n = Number(estimatedHours)
      if (isNaN(n) || n < 0) return NextResponse.json({ error: 'Invalid estimatedHours' }, { status: 400 })
    }
    if (travelFee !== undefined && travelFee !== null) {
      const n = Number(travelFee)
      if (isNaN(n) || n < 0) return NextResponse.json({ error: 'Invalid travelFee' }, { status: 400 })
    }
    if (numberOfArtists !== undefined && numberOfArtists !== null) {
      const n = Number(numberOfArtists)
      if (isNaN(n) || n < 1 || !Number.isInteger(n)) return NextResponse.json({ error: 'Invalid numberOfArtists' }, { status: 400 })
    }

    if (priceType && !VALID_PRICE_TYPES.includes(priceType)) {
      return NextResponse.json({ error: 'Invalid priceType' }, { status: 400 })
    }

    if (message && typeof message === 'string' && message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters` }, { status: 400 })
    }

    if (validUntil) {
      const validDate = new Date(validUntil)
      if (isNaN(validDate.getTime()) || validDate <= new Date()) {
        return NextResponse.json({ error: 'validUntil must be a future date' }, { status: 400 })
      }
    }

    const authResult = await payload.auth({ headers: request.headers })
    const user = authResult?.user as any

    if (!user || user.role !== 'artist') {
      return NextResponse.json({ error: 'Unauthorized — artist account required' }, { status: 401 })
    }

    const { docs: artistDocs } = await payload.find({
      collection: 'artists',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    if (artistDocs.length === 0) {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    const artist = artistDocs[0]

    if (artist.approvalStatus !== 'approved' && !artist.verified) {
      return NextResponse.json(
        { error: 'Your profile must be approved before submitting quotes' },
        { status: 403 },
      )
    }

    const artistId = artist.id

    const lead = await payload.findByID({ collection: 'leads', id: leadId }).catch(() => null)
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Reject if lead is expired or revoked
    if (lead.viewTokenExpiresAt && new Date(lead.viewTokenExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'This quote request has expired' }, { status: 410 })
    }
    if (lead.viewTokenRevokedAt) {
      return NextResponse.json({ error: 'This quote request is no longer active' }, { status: 410 })
    }

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

    const quote = await payload.create({
      collection: 'quotes',
      data: {
        lead: leadId,
        artist: artistId,
        priceType: priceType || 'package',
        unitRate: unitRate ? Number(unitRate) : undefined,
        units: units ? Number(units) : undefined,
        amount: numAmount,
        message: message ? String(message).trim() : undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        travelFee: travelFee ? Number(travelFee) : 0,
        numberOfArtists: numberOfArtists ? Number(numberOfArtists) : 1,
        validUntil: validUntil || undefined,
        status: 'sent',
      },
    })

    return NextResponse.json({ success: true, quoteId: quote.id })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit quote' }, { status: 500 })
  }
}

// GET /api/quotes?leadId=X&token=Y — Requires token or authenticated user
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.quoteLookup, 'quoteLookup')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const token = searchParams.get('token')

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    // Authorization FIRST — before revealing any quote data
    let isAuthorized = false

    if (token) {
      const leads = await payload.find({
        collection: 'leads',
        where: { id: { equals: leadId } },
        limit: 1,
      })

      if (leads.docs.length > 0) {
        const leadDoc = leads.docs[0]
        const result = verifyToken({
          rawToken: token,
          storedHash: leadDoc.viewTokenHash,
          expiresAt: leadDoc.viewTokenExpiresAt,
          revokedAt: leadDoc.viewTokenRevokedAt,
        })
        if (result.valid) {
          isAuthorized = true
        } else {
          return NextResponse.json({ error: result.error }, { status: result.status })
        }
      }
    }

    if (!isAuthorized) {
      try {
        const authResult = await payload.auth({ headers: request.headers })
        if (authResult?.user) {
          const user = authResult.user as any
          if (user.role === 'admin') {
            isAuthorized = true
          } else {
            const lead = await payload.findByID({ collection: 'leads', id: leadId }).catch(() => null)
            if (lead && lead.userId && (typeof lead.userId === 'object' ? lead.userId.id : lead.userId) === user.id) {
              isAuthorized = true
            }
          }
        }
      } catch { /* unauthenticated */ }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized — access token or login required' }, { status: 401 })
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

    const now = new Date()
    const customerView = quotes.docs
      .filter((q: any) => {
        // Filter out expired quotes from actionable list
        if (q.validUntil && new Date(q.validUntil) < now && q.status !== 'accepted') {
          return false
        }
        return true
      })
      .map((q: any) => ({
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
        isExpired: q.validUntil ? new Date(q.validUntil) < now : false,
        artistName: q.artist?.displayName || 'Artist',
        artistRating: q.artist?.rating || 0,
        artistPortfolio: q.artist?.portfolioImages?.slice(0, 3) || [],
      }))

    return NextResponse.json({ quotes: customerView })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}
