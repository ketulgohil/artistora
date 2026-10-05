/**
 * Integration Test Suite for Database Aggregations & Analytics Metrics.
 *
 * Importers/Callers: Executed by Vitest runner (`npx vitest run tests/int/analytics.int.spec.ts`).
 * Affected APIs: `src/lib/db.ts` (`queryDb`), `src/app/api/dashboard/analytics/route.ts`.
 * Schemas: `users`, `artists`, `leads`, `quotes`, `bookings`, `reviews`.
 * Policy: Strict teardown in afterAll — zero test data left in database.
 */

import { getPayload, Payload } from 'payload'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { queryDb } from '../../src/lib/db'

vi.mock('../../src/lib/email', () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue({}),
  sendBookingNotification: vi.fn().mockResolvedValue({}),
  sendArtistBookingEmail: vi.fn().mockResolvedValue({}),
  sendLeadConfirmation: vi.fn().mockResolvedValue({}),
  sendQuoteToCustomer: vi.fn().mockResolvedValue({}),
  sendQuoteNotification: vi.fn().mockResolvedValue({}),
}))

import config from '../../src/payload.config'

let payload: Payload
const testRunId = Date.now()
const testArtistEmail = `test-analytics-artist-${testRunId}@testrunner.com`
const testCustomerEmail = `test-analytics-cust-${testRunId}@testrunner.com`

let artistUserId: number
let artistProfileId: number
let customerUserId: number
let testLeadId: number
let testQuoteId: number
let testBooking1Id: number
let testBooking2Id: number
let testReviewId: number

describe('Analytics Database Aggregations', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    // 1. Create artist user & profile
    const aUser = await payload.create({
      collection: 'users',
      data: {
        name: `Analytics Artist ${testRunId}`,
        email: testArtistEmail,
        password: 'TestPassword123!',
        role: 'artist',
      },
    })
    artistUserId = aUser.id

    const aProfile = await payload.create({
      collection: 'artists',
      data: {
        user: artistUserId,
        displayName: `Analytics Artist ${testRunId}`,
        slug: `test-analytics-artist-${testRunId}`,
        bio: 'Expert bridal and festive mehndi specialist with modern design aesthetics.',
        city: 'Ahmedabad',
        phone: '9876543210',
        artistType: 'mehndi-artists',
        approvalStatus: 'approved',
        rating: 4.8,
        reviewCount: 1,
        profileViews: 120,
      } as any,
    })
    artistProfileId = aProfile.id

    // 2. Create customer user
    const cUser = await payload.create({
      collection: 'users',
      data: {
        name: `Analytics Customer ${testRunId}`,
        email: testCustomerEmail,
        password: 'TestPassword123!',
        role: 'customer',
      },
    })
    customerUserId = cUser.id

    // 3. Create lead matched to artist
    const lead = await payload.create({
      collection: 'leads',
      data: {
        customerName: 'Test Customer',
        customerPhone: '9876543210',
        eventType: 'wedding',
        eventDate: new Date().toISOString(),
        eventLocation: 'Bodakdev, Ahmedabad',
        matchedArtists: [artistProfileId],
        status: 'quotes_received',
      },
    })
    testLeadId = lead.id

    // 4. Create quote
    const quote = await payload.create({
      collection: 'quotes',
      data: {
        lead: testLeadId,
        artist: artistProfileId,
        amount: 8500,
        priceType: 'package',
        status: 'accepted',
      },
    })
    testQuoteId = quote.id

    // 5. Create 2 bookings (one completed for 8500, one confirmed for 4000)
    const booking1 = await payload.create({
      collection: 'bookings',
      data: {
        name: 'Test Event 1',
        phone: '9876543210',
        eventType: 'wedding',
        eventDate: new Date().toISOString(),
        location: 'Ahmedabad',
        artist: artistProfileId,
        quote: testQuoteId,
        lead: testLeadId,
        totalAmount: 8500,
        status: 'completed',
      },
    })
    testBooking1Id = booking1.id

    const booking2 = await payload.create({
      collection: 'bookings',
      data: {
        name: 'Test Event 2',
        phone: '9876543210',
        eventType: 'engagement',
        eventDate: new Date().toISOString(),
        location: 'Ahmedabad',
        artist: artistProfileId,
        totalAmount: 4000,
        status: 'confirmed',
      },
    })
    testBooking2Id = booking2.id

    // 6. Create review
    const review = await payload.create({
      collection: 'reviews',
      data: {
        user: customerUserId,
        customerName: 'Test Customer',
        booking: testBooking1Id,
        artist: artistProfileId,
        rating: 5,
        text: 'Outstanding work and very punctual!',
      },
    })
    testReviewId = review.id
  }, 120_000)

  afterAll(async () => {
    // Strict cleanup of all test records
    try {
      if (testReviewId) {
        await payload.delete({ collection: 'reviews', id: testReviewId }).catch(() => {})
      }
      if (testBooking1Id) {
        await payload.delete({ collection: 'bookings', id: testBooking1Id }).catch(() => {})
      }
      if (testBooking2Id) {
        await payload.delete({ collection: 'bookings', id: testBooking2Id }).catch(() => {})
      }
      if (testQuoteId) {
        await payload.delete({ collection: 'quotes', id: testQuoteId }).catch(() => {})
      }
      if (testLeadId) {
        await payload.delete({ collection: 'leads', id: testLeadId }).catch(() => {})
      }
      if (artistProfileId) {
        await payload.delete({ collection: 'artists', id: artistProfileId }).catch(() => {})
      }
      if (artistUserId) {
        await payload.delete({ collection: 'users', id: artistUserId }).catch(() => {})
      }
      if (customerUserId) {
        await payload.delete({ collection: 'users', id: customerUserId }).catch(() => {})
      }
    } catch (err) {
      console.error('Analytics test cleanup error:', err)
    }
  })

  it('aggregates booking counts and revenue by status in SQL without full collection load', async () => {
    const res = await queryDb(
      `SELECT
         b.status,
         COUNT(*)::int AS count,
         COALESCE(SUM(COALESCE(b.total_amount, b.artist_amount, 0)), 0)::numeric AS revenue
       FROM bookings b
       WHERE b.artist_id = $1
       GROUP BY b.status`,
      [artistProfileId],
    )

    expect(res.rows.length).toBeGreaterThanOrEqual(2)
    const completed = res.rows.find((r) => r.status === 'completed')
    const confirmed = res.rows.find((r) => r.status === 'confirmed')

    expect(completed).toBeDefined()
    expect(Number(completed?.count)).toBe(1)
    expect(Number(completed?.revenue)).toBe(8500)

    expect(confirmed).toBeDefined()
    expect(Number(confirmed?.count)).toBe(1)
    expect(Number(confirmed?.revenue)).toBe(4000)
  })

  it('aggregates 6-month monthly revenue in a single grouped query', async () => {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const startDate = sixMonthsAgo.toISOString()
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const res = await queryDb(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', b.event_date), 'YYYY-MM') AS month_key,
         COUNT(*)::int AS bookings_count,
         COALESCE(SUM(COALESCE(b.total_amount, b.artist_amount, 0)), 0)::numeric AS revenue
       FROM bookings b
       WHERE b.event_date >= $1 AND b.event_date <= $2
         AND b.status IN ('confirmed', 'in_progress', 'completed')
         AND b.artist_id = $3
       GROUP BY DATE_TRUNC('month', b.event_date)
       ORDER BY DATE_TRUNC('month', b.event_date) ASC`,
      [startDate, endDate, artistProfileId],
    )

    expect(res.rows.length).toBeGreaterThanOrEqual(1)
    const currentMonth = res.rows[0]
    expect(Number(currentMonth.bookings_count)).toBe(2)
    expect(Number(currentMonth.revenue)).toBe(12500)
  })

  it('aggregates event types breakdown in SQL', async () => {
    const res = await queryDb(
      `SELECT
         COALESCE(b.event_type::text, 'other') AS name,
         COUNT(*)::int AS value
       FROM bookings b
       WHERE b.artist_id = $1
       GROUP BY b.event_type
       ORDER BY value DESC`,
      [artistProfileId],
    )

    expect(res.rows.length).toBe(2)
    const wedding = res.rows.find((r) => r.name === 'wedding')
    const engagement = res.rows.find((r) => r.name === 'engagement')

    expect(wedding?.value).toBe(1)
    expect(engagement?.value).toBe(1)
  })

  it('aggregates conversion funnel counts in SQL', async () => {
    const res = await queryDb(
      `SELECT
         (
           SELECT COUNT(*)::int
           FROM leads_rels lr
           WHERE lr.path = 'matchedArtists' AND lr.artists_id = $1
         ) AS total_leads,
         (
           SELECT COUNT(*)::int
           FROM quotes q
           WHERE q.artist_id = $1
         ) AS total_quotes,
         (
           SELECT COUNT(*)::int
           FROM quotes q
           WHERE q.status = 'accepted' AND q.artist_id = $1
         ) AS accepted_quotes`,
      [artistProfileId],
    )

    expect(Number(res.rows[0]?.total_leads)).toBe(1)
    expect(Number(res.rows[0]?.total_quotes)).toBe(1)
    expect(Number(res.rows[0]?.accepted_quotes)).toBe(1)
  })

  it('aggregates star rating distribution in SQL', async () => {
    const res = await queryDb(
      `SELECT
         ROUND(r.rating)::int AS rating_val,
         COUNT(*)::int AS count
       FROM reviews r
       WHERE r.artist_id = $1
       GROUP BY ROUND(r.rating)`,
      [artistProfileId],
    )

    expect(res.rows.length).toBe(1)
    expect(Number(res.rows[0]?.rating_val)).toBe(5)
    expect(Number(res.rows[0]?.count)).toBe(1)
  })

  it('verifies pagination on bookings and leads queries', async () => {
    const bookingsPage = await payload.find({
      collection: 'bookings',
      where: { artist: { equals: artistProfileId } },
      page: 1,
      limit: 1,
    })

    expect(bookingsPage.docs.length).toBe(1)
    expect(bookingsPage.totalDocs).toBe(2)
    expect(bookingsPage.totalPages).toBe(2)
    expect(bookingsPage.page).toBe(1)

    const leadsPage = await payload.find({
      collection: 'leads',
      where: { matchedArtists: { contains: artistProfileId } },
      page: 1,
      limit: 1,
    })

    expect(leadsPage.docs.length).toBe(1)
    expect(leadsPage.totalDocs).toBe(1)
    expect(leadsPage.totalPages).toBe(1)
    expect(leadsPage.page).toBe(1)
  })
})
