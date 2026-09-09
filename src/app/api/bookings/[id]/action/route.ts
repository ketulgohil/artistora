import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { checkArtistAvailability } from '@/lib/availability'
import { sendBookingCancelledEmail } from '@/lib/email'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ['artist_pending', 'confirmed', 'cancelled'],
  artist_pending: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  declined: [], // Terminal state
  cancelled: [], // Terminal state
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Rate limit
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.bookingAction, 'bookingAction')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const { id } = await params
    const payload = await getPayloadClient()
    const body = await request.json()
    const { action, declineReason } = body

    // Validate action
    const validActions = ['accept', 'decline', 'in_progress', 'complete', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // 1. Authenticate the user
    const authResult = await payload.auth({
      headers: request.headers,
    })

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const currentUser = authResult.user as any

    // 2. Fetch the booking
    const booking = await payload.findByID({
      collection: 'bookings',
      id: Number(id),
      depth: 2,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // 3. Find artist profile for current user if artist
    let currentArtist: any = null
    if (currentUser.role === 'artist') {
      const artistRes = await payload.find({
        collection: 'artists',
        where: { user: { equals: currentUser.id } },
        limit: 1,
      })
      currentArtist = artistRes.docs[0] || null

      if (!currentArtist) {
        return NextResponse.json({ error: 'Artist profile not found' }, { status: 403 })
      }

      // Check if user is assigned to this booking
      const primaryArtistId =
        typeof booking.artist === 'object' && booking.artist !== null
          ? (booking.artist as any).id
          : booking.artist

      const isPrimary = primaryArtistId === currentArtist.id
      const isAssigned =
        Array.isArray(booking.assignedArtists) &&
        booking.assignedArtists.some(
          (item: any) =>
            (typeof item.artist === 'object' ? item.artist?.id : item.artist) === currentArtist.id,
        )

      if (!isPrimary && !isAssigned) {
        return NextResponse.json(
          { error: 'You are not authorized to update this booking' },
          { status: 403 },
        )
      }
    } else if (currentUser.role !== 'admin') {
      // Customer — verify they own this booking by email
      if (!booking.email || booking.email !== currentUser.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // 4. Map action to target status
    const actionToStatus: Record<string, string> = {
      accept: 'confirmed',
      decline: 'declined',
      in_progress: 'in_progress',
      complete: 'completed',
      cancel: 'cancelled',
    }
    const targetStatus = actionToStatus[action]

    // 5. Enforce state machine
    const currentStatus = booking.status as string
    const allowedNext = VALID_TRANSITIONS[currentStatus] || []
    if (!allowedNext.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${currentStatus}" to "${targetStatus}"` },
        { status: 400 },
      )
    }

    // 6. Handle specific actions
    if (action === 'accept') {
      // Run availability & conflict check
      const targetArtistId = currentArtist?.id ||
        (typeof booking.artist === 'object' && booking.artist !== null
          ? (booking.artist as any).id
          : booking.artist)

      if (targetArtistId && booking.eventDate) {
        const conflict = await checkArtistAvailability(
          payload,
          Number(targetArtistId),
          booking.eventDate,
          Number(id),
        )

        if (!conflict.available) {
          return NextResponse.json(
            { error: conflict.reason || 'Scheduling conflict on this date' },
            { status: 409 },
          )
        }
      }

      // Update assignedArtists status if present
      let updatedAssignedArtists = booking.assignedArtists
      if (Array.isArray(updatedAssignedArtists) && currentArtist?.id) {
        updatedAssignedArtists = updatedAssignedArtists.map((item: any) => {
          const aId = typeof item.artist === 'object' ? item.artist.id : item.artist
          if (aId === currentArtist.id) {
            return { ...item, status: 'accepted' }
          }
          return item
        })
      }

      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: {
          status: 'confirmed',
          ...(updatedAssignedArtists ? { assignedArtists: updatedAssignedArtists } : {}),
        },
      })

      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'decline') {
      if (!declineReason || typeof declineReason !== 'string' || !declineReason.trim()) {
        return NextResponse.json(
          { error: 'Decline reason is required' },
          { status: 400 },
        )
      }

      let updatedAssignedArtists = booking.assignedArtists
      if (Array.isArray(updatedAssignedArtists) && currentArtist?.id) {
        updatedAssignedArtists = updatedAssignedArtists.map((item: any) => {
          const aId = typeof item.artist === 'object' ? item.artist.id : item.artist
          if (aId === currentArtist.id) {
            return { ...item, status: 'declined', declineReason: declineReason.trim().slice(0, 500) }
          }
          return item
        })
      }

      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: {
          status: 'declined',
          declineReason: declineReason.trim().slice(0, 500),
          ...(updatedAssignedArtists ? { assignedArtists: updatedAssignedArtists } : {}),
        },
      })

      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'in_progress') {
      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: { status: 'in_progress' },
      })
      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'complete') {
      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: { status: 'completed' },
      })
      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'cancel') {
      const { cancellationReason } = body

      // Derive cancelledBy from authenticated user — never trust client
      let cancelledBy: string
      if (currentUser.role === 'admin') {
        cancelledBy = 'admin'
      } else if (currentUser.role === 'artist') {
        cancelledBy = 'artist'
      } else {
        cancelledBy = 'customer'
      }

      // Artists can only cancel if they are assigned (already verified above)
      // Customers can only cancel their own bookings (verified by email above)

      // Prevent cancellation too close to event
      if (booking.eventDate) {
        const eventTime = new Date(booking.eventDate).getTime()
        const now = Date.now()
        const hoursUntilEvent = (eventTime - now) / (1000 * 60 * 60)

        if (currentUser.role === 'artist' && hoursUntilEvent < 24) {
          return NextResponse.json(
            { error: 'Cannot cancel within 24 hours of the event' },
            { status: 400 },
          )
        }
        if (currentUser.role !== 'admin' && hoursUntilEvent < 48) {
          return NextResponse.json(
            { error: 'Cannot cancel within 48 hours of the event. Please contact support.' },
            { status: 400 },
          )
        }
      }

      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: {
          status: 'cancelled',
          cancelledBy: cancelledBy as 'customer' | 'artist' | 'admin' | 'system',
          cancellationReason: typeof cancellationReason === 'string' ? cancellationReason.trim().slice(0, 500) : '',
          cancelledAt: new Date().toISOString(),
        },
      })

      // Send cancellation emails (fire-and-forget)
      const emailData = {
        name: booking.name,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        cancelledBy: cancelledBy === 'customer' ? 'Customer' : cancelledBy === 'artist' ? 'Artist' : 'Admin',
        reason: typeof cancellationReason === 'string' ? cancellationReason.trim() : '',
      }

      if (booking.email) {
        sendBookingCancelledEmail(booking.email, emailData).catch(() => {})
      }

      // Notify assigned artists
      if (cancelledBy !== 'artist' && Array.isArray(booking.assignedArtists)) {
        for (const item of booking.assignedArtists) {
          try {
            const aId = typeof item.artist === 'object' ? item.artist.id : Number(item.artist)
            if (!aId) continue
            const artistDoc = await payload.findByID({ collection: 'artists', id: aId, depth: 1 })
            if (artistDoc?.user) {
              const userDoc = await payload.findByID({
                collection: 'users',
                id: typeof artistDoc.user === 'object' ? artistDoc.user.id : artistDoc.user,
              })
              if (userDoc?.email) {
                sendBookingCancelledEmail(userDoc.email, emailData).catch(() => {})
              }
            }
          } catch { /* ignore */ }
        }
      }

      return NextResponse.json({ success: true, booking: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process booking action' },
      { status: 500 },
    )
  }
}
