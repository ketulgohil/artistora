import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()

    const authResult = await payload.auth({ headers: request.headers })
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.user.role !== 'artist' && authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const artistRes = await payload.find({
      collection: 'artists',
      where: { user: { equals: authResult.user.id } },
      limit: 1,
    })
    const artist = artistRes.docs[0]
    if (!artist && authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    const artistId = artist?.id

    // ── Bookings by status ──
    const allBookings = await payload.find({
      collection: 'bookings',
      where: artistId
        ? { or: [{ artist: { equals: artistId } }, { 'assignedArtists.artist': { equals: artistId } }] }
        : {},
      limit: 0,
    })

    const bookingsByStatus = {
      requested: 0,
      artist_pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      declined: 0,
      cancelled: 0,
    }
    for (const b of allBookings.docs) {
      const s = (b as any).status as keyof typeof bookingsByStatus
      if (s in bookingsByStatus) bookingsByStatus[s]++
    }

    // ── Revenue by month (last 6 months) ──
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const revenueByMonth: { month: string; revenue: number; bookings: number }[] = []

    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1)
      const monthStart = d.toISOString()
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

      const monthBookings = await payload.find({
        collection: 'bookings',
        where: {
          and: [
            ...(artistId ? [{ or: [{ artist: { equals: artistId } }, { 'assignedArtists.artist': { equals: artistId } }] }] : []),
            { eventDate: { greater_than_equal: monthStart } },
            { eventDate: { less_than_equal: monthEnd } },
            { status: { in: ['confirmed', 'in_progress', 'completed'] } },
          ],
        },
        limit: 0,
      })

      let monthRevenue = 0
      for (const b of monthBookings.docs) {
        monthRevenue += (b as any).totalAmount || (b as any).artistAmount || (b as any).quote?.amount || 0
      }

      revenueByMonth.push({ month: label, revenue: monthRevenue, bookings: (monthBookings as any).total })
    }

    // ── Event type breakdown ──
    const eventTypeCount: Record<string, number> = {}
    for (const b of allBookings.docs) {
      const t = (b as any).eventType || 'other'
      eventTypeCount[t] = (eventTypeCount[t] || 0) + 1
    }
    const eventTypes = Object.entries(eventTypeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // ── Conversion funnel ──
    const totalLeads = artistId
      ? ((await payload.find({
          collection: 'leads',
          where: { matchedArtists: { equals: artistId } },
          limit: 0,
        })) as any).total
      : 0

    const totalQuotes = artistId
      ? ((await payload.find({
          collection: 'quotes',
          where: { artist: { equals: artistId } },
          limit: 0,
        })) as any).total
      : 0

    const acceptedQuotes = artistId
      ? ((await payload.find({
          collection: 'quotes',
          where: { and: [{ artist: { equals: artistId } }, { status: { equals: 'accepted' } }] },
          limit: 0,
        })) as any).total
      : 0

    // ── Reviews ──
    const reviews = artistId
      ? (await payload.find({
          collection: 'reviews',
          where: { artist: { equals: artistId } },
          limit: 0,
        })).docs
      : []

    const ratingDistribution = [0, 0, 0, 0, 0]
    for (const r of reviews) {
      const rating = (r as any).rating
      if (rating >= 1 && rating <= 5) ratingDistribution[rating - 1]++
    }

    // ── Response time (average hours between lead creation and first quote) ──
    const myQuotes = artistId
      ? (await payload.find({
          collection: 'quotes',
          where: { artist: { equals: artistId } },
          sort: 'createdAt',
          limit: 100,
          depth: 1,
        })).docs
      : []

    let totalResponseMs = 0
    let responseCount = 0
    for (const q of myQuotes) {
      const quote = q as any
      const lead = quote.lead
      if (lead && typeof lead === 'object' && lead.createdAt && quote.createdAt) {
        const leadTime = new Date(lead.createdAt).getTime()
        const quoteTime = new Date(quote.createdAt).getTime()
        if (quoteTime > leadTime) {
          totalResponseMs += quoteTime - leadTime
          responseCount++
        }
      }
    }
    const avgResponseHours = responseCount > 0 ? Math.round((totalResponseMs / responseCount / 3600000) * 10) / 10 : 0

    // Compute totalEarnings and bookingsWon from actual completed bookings
    let totalEarnings = 0
    let bookingsWon = 0
    for (const b of allBookings.docs) {
      if ((b as any).status === 'completed') {
        bookingsWon++
        totalEarnings += (b as any).totalAmount || (b as any).artistAmount || 0
      }
    }

    // Compute profileViews from artist
    const profileViews = artist?.profileViews || 0

    return NextResponse.json({
      stats: {
        totalLeads,
        totalQuotes,
        acceptedQuotes,
        totalBookings: (allBookings as any).total,
        completedBookings: bookingsByStatus.completed,
        totalEarnings,
        bookingsWon,
        leadsReceived: totalLeads,
        quotesSent: totalQuotes,
        profileViews,
        avgResponseHours,
        rating: artist?.rating || 0,
        reviewCount: artist?.reviewCount || 0,
        conversionRate: totalLeads > 0 ? Math.round((acceptedQuotes / totalLeads) * 100) : 0,
      },
      bookingsByStatus,
      revenueByMonth,
      eventTypes,
      funnel: { leads: totalLeads, quotes: totalQuotes, accepted: acceptedQuotes, bookings: bookingsByStatus.completed },
      ratingDistribution,
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
