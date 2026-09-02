import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { phone } = await request.json()

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
    }

    // Normalize phone: remove spaces, dashes, country code
    const normalized = phone.replace(/[\s\-+]/g, '').replace(/^91/, '').trim()

    // Find bookings where phone matches
    const bookings = await payload.find({
      collection: 'bookings',
      where: {
        or: [
          { phone: { contains: normalized } },
          { phone: { contains: `+91${normalized}` } },
        ],
      },
      sort: '-createdAt',
      limit: 20,
    })

    // Find leads where phone matches
    const leads = await payload.find({
      collection: 'leads',
      where: {
        or: [
          { customerPhone: { contains: normalized } },
          { customerPhone: { contains: `+91${normalized}` } },
        ],
      },
      sort: '-createdAt',
      limit: 20,
    })

    return NextResponse.json({
      bookings: bookings.docs.map((b) => ({
        id: b.id,
        name: b.name,
        phone: b.phone,
        email: b.email,
        eventType: b.eventType,
        eventDate: b.eventDate,
        location: b.location,
        guestCount: b.guestCount,
        status: b.status,
        createdAt: b.createdAt,
      })),
      leads: leads.docs.map((l) => ({
        id: l.id,
        customerName: l.customerName,
        customerPhone: l.customerPhone,
        eventType: l.eventType,
        eventDate: l.eventDate,
        eventLocation: l.eventLocation,
        status: l.status,
        createdAt: l.createdAt,
      })),
    })
  } catch (error) {
    console.error('My bookings lookup error:', error)
    return NextResponse.json({ error: 'Failed to look up bookings' }, { status: 500 })
  }
}
