import type { Payload } from 'payload'

export interface AvailabilityResult {
  available: boolean
  reason?: string
}

/**
 * Checks whether an artist is available on a given eventDate.
 * 1. Checks if the date falls in the artist's unavailableDates.
 * 2. Checks if the artist is already assigned to a confirmed or in-progress booking on that date.
 */
export async function checkArtistAvailability(
  payload: Payload,
  artistId: number,
  eventDate: string | Date,
  excludeBookingId?: number,
): Promise<AvailabilityResult> {
  const targetDateStr = new Date(eventDate).toISOString().split('T')[0]

  // 1. Fetch the artist record to check blocked/unavailable dates
  const artist = await payload.findByID({
    collection: 'artists',
    id: artistId,
  }).catch(() => null)

  if (!artist) {
    return { available: false, reason: 'Artist not found' }
  }

  if (Array.isArray(artist.unavailableDates)) {
    const isBlocked = artist.unavailableDates.some((entry: any) => {
      if (!entry.date) return false
      const blockedDateStr = new Date(entry.date).toISOString().split('T')[0]
      return blockedDateStr === targetDateStr
    })

    if (isBlocked) {
      return {
        available: false,
        reason: 'Artist has marked this date as unavailable',
      }
    }
  }

  // 2. Query bookings to check for conflicts (confirmed or in_progress)
  const dayStart = `${targetDateStr}T00:00:00.000Z`
  const dayEnd = `${targetDateStr}T23:59:59.999Z`

  const existingBookings = await payload.find({
    collection: 'bookings',
    where: {
      and: [
        {
          or: [
            { artist: { equals: artistId } },
            { 'assignedArtists.artist': { equals: artistId } },
          ],
        },
        {
          status: {
            in: ['confirmed', 'in_progress'],
          },
        },
        {
          eventDate: {
            greater_than_equal: dayStart,
          },
        },
        {
          eventDate: {
            less_than_equal: dayEnd,
          },
        },
        ...(excludeBookingId
          ? [
              {
                id: {
                  not_equals: excludeBookingId,
                },
              },
            ]
          : []),
      ],
    },
    limit: 1,
  })

  if (existingBookings.docs.length > 0) {
    return {
      available: false,
      reason: 'Artist already has a confirmed booking on this date',
    }
  }

  return { available: true }
}
