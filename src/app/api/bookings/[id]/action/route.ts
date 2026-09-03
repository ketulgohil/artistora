import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { checkArtistAvailability } from '@/lib/availability'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayloadClient()
    const body = await request.json()
    const { action, declineReason } = body

    // 1. Authenticate the user
    const authResult = await payload.auth({
      headers: request.headers,
    })

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const currentUser = authResult.user

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Determine target artist ID
    const targetArtistId =
      currentArtist?.id ||
      (typeof booking.artist === 'object' && booking.artist !== null
        ? (booking.artist as any).id
        : booking.artist)

    // 4. Handle Actions
    if (action === 'accept') {
      // Run availability & conflict check
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
      if (Array.isArray(updatedAssignedArtists) && targetArtistId) {
        updatedAssignedArtists = updatedAssignedArtists.map((item: any) => {
          const aId = typeof item.artist === 'object' ? item.artist.id : item.artist
          if (aId === targetArtistId) {
            return { ...item, status: 'accepted' }
          }
          return item
        })
      }

      // Update status to confirmed
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
      if (!declineReason || !declineReason.trim()) {
        return NextResponse.json(
          { error: 'Decline reason is required' },
          { status: 400 },
        )
      }

      // Update assignedArtists status if present
      let updatedAssignedArtists = booking.assignedArtists
      if (Array.isArray(updatedAssignedArtists) && targetArtistId) {
        updatedAssignedArtists = updatedAssignedArtists.map((item: any) => {
          const aId = typeof item.artist === 'object' ? item.artist.id : item.artist
          if (aId === targetArtistId) {
            return { ...item, status: 'declined', declineReason }
          }
          return item
        })
      }

      // Update status to declined with reason
      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: {
          status: 'declined',
          declineReason,
          ...(updatedAssignedArtists ? { assignedArtists: updatedAssignedArtists } : {}),
        },
      })

      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'in_progress') {
      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: {
          status: 'in_progress',
        },
      })

      return NextResponse.json({ success: true, booking: updated })
    }

    if (action === 'complete') {
      const updated = await payload.update({
        collection: 'bookings',
        id: Number(id),
        data: {
          status: 'completed',
        },
      })

      return NextResponse.json({ success: true, booking: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Booking action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process booking action' },
      { status: 500 },
    )
  }
}
