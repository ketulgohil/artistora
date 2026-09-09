import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendQuoteConfirmation, sendQuoteNotification, sendQuoteAccessLink } from '@/lib/email'
import { createTokenPair } from '@/lib/token'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

const MAX_NAME_LENGTH = 100
const MAX_PHONE_LENGTH = 20
const MAX_EMAIL_LENGTH = 254
const MAX_LOCATION_LENGTH = 200
const MAX_NOTES_LENGTH = 5000
const MAX_STYLE_LENGTH = 200
const MAX_GUEST_COUNT = 10000

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.leadCreate, 'leadCreate')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const payload = await getPayload({ config })
    const body = await request.json()

    const { customerName, customerPhone, customerEmail, eventType, eventDate, eventLocation, guestCount, budgetRange, serviceType, designStyle, additionalNotes } = body

    if (!customerName || !customerPhone || !eventType || !eventDate || !eventLocation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: 'Invalid customer name' }, { status: 400 })
    }
    if (typeof customerPhone !== 'string' || customerPhone.replace(/\D/g, '').length < 10 || customerPhone.length > MAX_PHONE_LENGTH) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    if (customerEmail && (typeof customerEmail !== 'string' || customerEmail.length > MAX_EMAIL_LENGTH)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    if (typeof eventLocation !== 'string' || eventLocation.trim().length < 2 || eventLocation.length > MAX_LOCATION_LENGTH) {
      return NextResponse.json({ error: 'Invalid event location' }, { status: 400 })
    }
    if (guestCount !== undefined && guestCount !== null) {
      const gc = Number(guestCount)
      if (isNaN(gc) || gc < 1 || gc > MAX_GUEST_COUNT || !Number.isInteger(gc)) {
        return NextResponse.json({ error: 'Invalid guest count' }, { status: 400 })
      }
    }
    if (designStyle && typeof designStyle === 'string' && designStyle.length > MAX_STYLE_LENGTH) {
      return NextResponse.json({ error: 'Design style too long' }, { status: 400 })
    }
    if (additionalNotes && typeof additionalNotes === 'string' && additionalNotes.length > MAX_NOTES_LENGTH) {
      return NextResponse.json({ error: 'Notes too long' }, { status: 400 })
    }

    const eventDateObj = new Date(eventDate)
    if (isNaN(eventDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid event date' }, { status: 400 })
    }

    let userId: number | undefined
    try {
      const authResult = await payload.auth({ headers: request.headers })
      if (authResult?.user) {
        userId = (authResult.user as any).id
      }
    } catch { /* unauthenticated lead */ }

    const { rawToken, hash, expiresAt } = createTokenPair()

    const lead = await payload.create({
      collection: 'leads',
      data: {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim()?.toLowerCase() || undefined,
        userId: userId || undefined,
        eventType,
        eventDate,
        eventLocation: eventLocation.trim(),
        guestCount: guestCount ? Number(guestCount) : undefined,
        budgetRange: budgetRange || undefined,
        serviceType: serviceType || undefined,
        designStyle: designStyle?.trim() || undefined,
        additionalNotes: additionalNotes?.trim() || undefined,
        status: 'new',
        viewTokenHash: hash,
        viewTokenExpiresAt: expiresAt,
      } as any,
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com'
    const accessUrl = `${siteUrl}/quotes/${lead.id}?token=${rawToken}`

    if (customerEmail) {
      sendQuoteConfirmation(customerEmail.trim().toLowerCase(), {
        customerName: customerName.trim(),
        eventType,
        eventDate,
        eventLocation: eventLocation.trim(),
      }).catch(() => {})

      sendQuoteAccessLink(customerEmail.trim().toLowerCase(), {
        customerName: customerName.trim(),
        leadId: String(lead.id),
        accessUrl,
      }).catch(() => {})
    }

    sendQuoteNotification({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim()?.toLowerCase(),
      eventType,
      eventDate,
      eventLocation: eventLocation.trim(),
      guestCount: guestCount ? Number(guestCount) : undefined,
      budgetRange,
      designStyle,
      additionalNotes,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      accessUrl,
      message: customerEmail
        ? 'Quote request submitted. Check your email for the access link.'
        : 'Quote request submitted.',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 })
  }
}
