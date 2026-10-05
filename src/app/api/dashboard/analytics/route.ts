import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, authenticateRequest } from '@/lib/payload'
import { queryDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()

    const authResult = await authenticateRequest(request, payload)
    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.user.role !== 'artist' && authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let artistId: number | null = null
    let artistProfileViews = 0
    let artistRating = 0
    let artistReviewCount = 0

    if (authResult.user.role === 'artist') {
      const artistRes = await queryDb(
        `SELECT id, rating, review_count AS "reviewCount", profile_views AS "profileViews"
         FROM artists
         WHERE user_id = $1
         LIMIT 1`,
        [authResult.user.id],
      )

      if (artistRes.rows.length === 0) {
        return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
      }

      const artist = artistRes.rows[0]
      artistId = artist.id
      artistProfileViews = Number(artist.profileViews) || 0
      artistRating = Number(artist.rating) || 0
      artistReviewCount = Number(artist.reviewCount) || 0
    } else if (authResult.user.role === 'admin') {
      const url = new URL(request.url)
      const requestedArtistId = url.searchParams.get('artistId')
      if (requestedArtistId) {
        artistId = parseInt(requestedArtistId, 10) || null
        if (artistId) {
          const artistRes = await queryDb(
            `SELECT rating, review_count AS "reviewCount", profile_views AS "profileViews"
             FROM artists
             WHERE id = $1
             LIMIT 1`,
            [artistId],
          )
          if (artistRes.rows.length > 0) {
            const artist = artistRes.rows[0]
            artistProfileViews = Number(artist.profileViews) || 0
            artistRating = Number(artist.rating) || 0
            artistReviewCount = Number(artist.reviewCount) || 0
          }
        }
      }
    }

    // ── Date range for 6-month revenue trend ──
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const startDate = sixMonthsAgo.toISOString()
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // ── Execute all aggregation queries concurrently in the database engine ──
    const [bookingsStatusRes, revenueRes, eventTypesRes, funnelRes, reviewsRes, avgResponseRes] =
      await Promise.all([
        // 1. Bookings by status & total revenue from completed bookings
        queryDb(
          `SELECT
           b.status,
           COUNT(*)::int AS count,
           COALESCE(SUM(COALESCE(b.total_amount, b.artist_amount, 0)), 0)::numeric AS revenue
         FROM bookings b
         WHERE ($1::int IS NULL OR b.artist_id = $1 OR b.id IN (
           SELECT ba._parent_id FROM bookings_assigned_artists ba WHERE ba.artist_id = $1
         ))
         GROUP BY b.status`,
          [artistId],
        ),

        // 2. Revenue & completed booking counts by month for the last 6 months (single query)
        queryDb(
          `SELECT
           TO_CHAR(DATE_TRUNC('month', b.event_date), 'YYYY-MM') AS month_key,
           COUNT(*)::int AS bookings_count,
           COALESCE(SUM(COALESCE(b.total_amount, b.artist_amount, 0)), 0)::numeric AS revenue
         FROM bookings b
         WHERE b.event_date >= $1 AND b.event_date <= $2
           AND b.status IN ('confirmed', 'in_progress', 'completed')
           AND ($3::int IS NULL OR b.artist_id = $3 OR b.id IN (
             SELECT ba._parent_id FROM bookings_assigned_artists ba WHERE ba.artist_id = $3
           ))
         GROUP BY DATE_TRUNC('month', b.event_date)
         ORDER BY DATE_TRUNC('month', b.event_date) ASC`,
          [startDate, endDate, artistId],
        ),

        // 3. Event type breakdown
        queryDb(
          `SELECT
           COALESCE(b.event_type::text, 'other') AS name,
           COUNT(*)::int AS value
         FROM bookings b
         WHERE ($1::int IS NULL OR b.artist_id = $1 OR b.id IN (
           SELECT ba._parent_id FROM bookings_assigned_artists ba WHERE ba.artist_id = $1
         ))
         GROUP BY b.event_type
         ORDER BY value DESC`,
          [artistId],
        ),

        // 4. Conversion funnel (leads, quotes, accepted quotes)
        queryDb(
          `SELECT
           (
             SELECT COUNT(*)::int
             FROM leads_rels lr
             WHERE lr.path = 'matchedArtists' AND ($1::int IS NULL OR lr.artists_id = $1)
           ) AS total_leads,
           (
             SELECT COUNT(*)::int
             FROM quotes q
             WHERE ($1::int IS NULL OR q.artist_id = $1)
           ) AS total_quotes,
           (
             SELECT COUNT(*)::int
             FROM quotes q
             WHERE q.status = 'accepted' AND ($1::int IS NULL OR q.artist_id = $1)
           ) AS accepted_quotes`,
          [artistId],
        ),

        // 5. Rating distribution (1 to 5 stars)
        queryDb(
          `SELECT
           ROUND(r.rating)::int AS rating_val,
           COUNT(*)::int AS count
         FROM reviews r
         WHERE ($1::int IS NULL OR r.artist_id = $1)
         GROUP BY ROUND(r.rating)`,
          [artistId],
        ),

        // 6. Average response time in hours (quotes submitted after lead creation)
        queryDb(
          `SELECT
           COALESCE(
             AVG(EXTRACT(EPOCH FROM (q.created_at - l.created_at)) / 3600.0),
             0
           )::float AS avg_response_hours
         FROM quotes q
         JOIN leads l ON q.lead_id = l.id
         WHERE ($1::int IS NULL OR q.artist_id = $1)
           AND q.created_at > l.created_at`,
          [artistId],
        ),
      ])

    // ── Process Bookings by Status & Earnings ──
    const bookingsByStatus = {
      requested: 0,
      artist_pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      declined: 0,
      cancelled: 0,
    }
    let totalEarnings = 0
    let totalBookings = 0

    for (const row of bookingsStatusRes.rows) {
      const s = row.status as keyof typeof bookingsByStatus
      const count = Number(row.count) || 0
      const revenue = Number(row.revenue) || 0

      if (s in bookingsByStatus) {
        bookingsByStatus[s] = count
      }
      totalBookings += count
      if (s === 'completed') {
        totalEarnings = revenue
      }
    }

    const bookingsWon = bookingsByStatus.completed

    // ── Process Revenue by Month ──
    const revenueMap = new Map<string, { revenue: number; bookings: number }>()
    for (const row of revenueRes.rows) {
      revenueMap.set(row.month_key, {
        revenue: Number(row.revenue) || 0,
        bookings: Number(row.bookings_count) || 0,
      })
    }

    const revenueByMonth: { month: string; revenue: number; bookings: number }[] = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      const stats = revenueMap.get(monthKey) || { revenue: 0, bookings: 0 }
      revenueByMonth.push({
        month: label,
        revenue: stats.revenue,
        bookings: stats.bookings,
      })
    }

    // ── Process Event Types ──
    const eventTypes = eventTypesRes.rows.map((r) => ({
      name: r.name,
      value: Number(r.value) || 0,
    }))

    // ── Process Funnel Metrics ──
    const totalLeads = Number(funnelRes.rows[0]?.total_leads) || 0
    const totalQuotes = Number(funnelRes.rows[0]?.total_quotes) || 0
    const acceptedQuotes = Number(funnelRes.rows[0]?.accepted_quotes) || 0

    // ── Process Rating Distribution ──
    const ratingDistribution = [0, 0, 0, 0, 0]
    for (const row of reviewsRes.rows) {
      const val = Number(row.rating_val)
      if (val >= 1 && val <= 5) {
        ratingDistribution[val - 1] = Number(row.count) || 0
      }
    }

    // ── Process Average Response Hours ──
    const rawAvgHours = Number(avgResponseRes.rows[0]?.avg_response_hours) || 0
    const avgResponseHours = Math.round(rawAvgHours * 10) / 10

    return NextResponse.json({
      stats: {
        totalLeads,
        totalQuotes,
        acceptedQuotes,
        totalBookings,
        completedBookings: bookingsByStatus.completed,
        totalEarnings,
        bookingsWon,
        leadsReceived: totalLeads,
        quotesSent: totalQuotes,
        profileViews: artistProfileViews,
        avgResponseHours,
        rating: artistRating,
        reviewCount: artistReviewCount,
        conversionRate: totalLeads > 0 ? Math.round((acceptedQuotes / totalLeads) * 100) : 0,
      },
      bookingsByStatus,
      revenueByMonth,
      eventTypes,
      funnel: {
        leads: totalLeads,
        quotes: totalQuotes,
        accepted: acceptedQuotes,
        bookings: bookingsByStatus.completed,
      },
      ratingDistribution,
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
