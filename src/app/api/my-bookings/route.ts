import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyToken } from '@/lib/token'

// GET /api/my-bookings — Fetch bookings for authenticated user or via access token
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const leadId = searchParams.get('leadId')
    const bookingToken = searchParams.get('bookingToken')

    // Path 1: Authenticated user
    const authResult = await payload.auth({ headers: request.headers }).catch(() => null)
    if (authResult?.user) {
      const user = authResult.user as any

      if (user.role === 'artist') {
        const { docs: artistDocs } = await payload.find({
          collection: 'artists',
          where: { user: { equals: user.id } },
          limit: 1,
        })
        const artist = artistDocs[0]
        if (!artist) {
          return NextResponse.json({ bookings: [], leads: [] })
        }

        const bookings = await payload.find({
          collection: 'bookings',
          where: {
            or: [
              { 'artist.user': { equals: user.id } },
              { 'assignedArtists.artist.user': { equals: user.id } },
            ],
          },
          sort: '-createdAt',
          limit: 50,
        })

        return NextResponse.json({
          bookings: bookings.docs.map((b) => ({
            id: b.id,
            name: b.name,
            eventType: b.eventType,
            eventDate: b.eventDate,
            location: b.location,
            status: b.status,
            createdAt: b.createdAt,
          })),
          leads: [],
        })
      }

      // Customer: see own bookings/leads by userId
      const bookings = await payload.find({
        collection: 'bookings',
        where: { userId: { equals: user.id } },
        sort: '-createdAt',
        limit: 50,
      })

      const leads = await payload.find({
        collection: 'leads',
        where: { userId: { equals: user.id } },
        sort: '-createdAt',
        limit: 50,
      })

      return NextResponse.json({
        bookings: bookings.docs.map((b) => ({
          id: b.id,
          name: b.name,
          eventType: b.eventType,
          eventDate: b.eventDate,
          location: b.location,
          status: b.status,
          createdAt: b.createdAt,
        })),
        leads: leads.docs.map((l) => ({
          id: l.id,
          customerName: l.customerName,
          eventType: l.eventType,
          eventDate: l.eventDate,
          eventLocation: l.eventLocation,
          status: l.status,
          createdAt: l.createdAt,
        })),
      })
    }

    // Path 2: Booking access token (after quote acceptance)
    if (bookingToken && leadId) {
      const leads = await payload.find({
        collection: 'leads',
        where: { id: { equals: leadId } },
        limit: 1,
      })

      if (leads.docs.length === 0) {
        return NextResponse.json({ error: 'Invalid access link' }, { status: 403 })
      }

      const lead = leads.docs[0]
      const result = verifyToken({
        rawToken: bookingToken,
        storedHash: (lead as any).bookingAccessTokenHash,
        expiresAt: (lead as any).bookingAccessTokenExpiresAt,
        revokedAt: undefined,
      })

      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      const bookings = await payload.find({
        collection: 'bookings',
        where: { lead: { equals: leadId } },
        sort: '-createdAt',
        limit: 20,
      })

      return NextResponse.json({
        verified: true,
        bookings: bookings.docs.map((b) => ({
          id: b.id,
          name: b.name,
          eventType: b.eventType,
          eventDate: b.eventDate,
          location: b.location,
          status: b.status,
          createdAt: b.createdAt,
        })),
        leads: [{
          id: lead.id,
          customerName: lead.customerName,
          eventType: lead.eventType,
          eventDate: lead.eventDate,
          eventLocation: lead.eventLocation,
          status: lead.status,
          createdAt: lead.createdAt,
        }],
      })
    }

    // Path 3: Guest access via lead view token
    if (token && leadId) {
      const leads = await payload.find({
        collection: 'leads',
        where: { id: { equals: leadId } },
        limit: 1,
      })

      if (leads.docs.length === 0) {
        return NextResponse.json({ error: 'Invalid access link' }, { status: 403 })
      }

      const lead = leads.docs[0]
      const result = verifyToken({
        rawToken: token,
        storedHash: lead.viewTokenHash,
        expiresAt: lead.viewTokenExpiresAt,
        revokedAt: lead.viewTokenRevokedAt,
      })

      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      const bookings = await payload.find({
        collection: 'bookings',
        where: { lead: { equals: leadId } },
        sort: '-createdAt',
        limit: 20,
      })

      return NextResponse.json({
        verified: true,
        bookings: bookings.docs.map((b) => ({
          id: b.id,
          name: b.name,
          eventType: b.eventType,
          eventDate: b.eventDate,
          location: b.location,
          status: b.status,
          createdAt: b.createdAt,
        })),
        leads: [{
          id: lead.id,
          customerName: lead.customerName,
          eventType: lead.eventType,
          eventDate: lead.eventDate,
          eventLocation: lead.eventLocation,
          status: lead.status,
          createdAt: lead.createdAt,
        }],
      })
    }

    return NextResponse.json({ error: 'Authentication or access token required' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
