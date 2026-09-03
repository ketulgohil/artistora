import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendQuoteConfirmation, sendQuoteNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { customerName, customerPhone, customerEmail, eventType, eventDate, eventLocation, guestCount, budgetRange, serviceType, designStyle, additionalNotes } = body

    if (!customerName || !customerPhone || !eventType || !eventDate || !eventLocation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const lead = await payload.create({
      collection: 'leads',
      data: {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        eventType,
        eventDate,
        eventLocation,
        guestCount: guestCount ? Number(guestCount) : undefined,
        budgetRange: budgetRange || undefined,
        serviceType: serviceType || undefined,
        designStyle: designStyle || undefined,
        additionalNotes: additionalNotes || undefined,
        status: 'new',
      },
    })

    // Send confirmation email to customer (non-blocking)
    if (customerEmail) {
      sendQuoteConfirmation(customerEmail, {
        customerName,
        eventType,
        eventDate,
        eventLocation,
      }).catch((err) => {
        console.error(`Failed to send quote confirmation to ${customerEmail}:`, err)
      })
    }

    // Send notification to Artistora admin (non-blocking)
    sendQuoteNotification({
      customerName,
      customerPhone,
      customerEmail,
      eventType,
      eventDate,
      eventLocation,
      guestCount: guestCount ? Number(guestCount) : undefined,
      budgetRange,
      designStyle,
      additionalNotes,
    }).catch((err) => {
      console.error('Failed to send quote notification:', err)
    })

    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 })
  }
}
