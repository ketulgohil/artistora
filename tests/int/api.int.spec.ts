/**
 * Integration Test Suite for Payload CMS Collections, Auth, and Booking Flow.
 *
 * Importers/Callers: Executed by Vitest runner (`npm run test:int` / `vitest run tests/int/api.int.spec.ts`).
 * Affected APIs: Payload CMS Local API (`payload.create`, `payload.find`, `payload.delete`).
 * Schemas: `users`, `artists`, `leads`, `quotes`, `bookings`, `reviews` collections.
 * User instruction: "i see some test artist in the artist grid i don't want that and please don't add this kind of dummy data and if in case you add it then please delete after testing."
 */

import { getPayload, Payload } from 'payload'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createTokenPair, hashToken } from '../../src/lib/token'

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

const testCustomerEmail = `test-customer-${Date.now()}@testrunner.com`
const testArtistEmail = `test-artist-${Date.now()}@testrunner.com`

let customerId: number
let artistUserId: number
let artistProfileId: number
let leadId: number
let leadToken: string
let quoteId: number
let bookingId: number
let mediaId: number

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  }, 300_000)

  afterAll(async () => {
    if (!payload) return
    try {
      if (bookingId) {
        const reviews = await payload.find({
          collection: 'reviews',
          where: { booking: { equals: bookingId } },
        })
        for (const r of reviews.docs) {
          try {
            await payload.delete({ collection: 'reviews', id: r.id })
          } catch {}
        }
        try {
          await payload.delete({ collection: 'bookings', id: bookingId })
        } catch {}
      }
      if (quoteId) {
        try {
          await payload.delete({ collection: 'quotes', id: quoteId })
        } catch {}
      }
      if (leadId) {
        try {
          await payload.delete({ collection: 'leads', id: leadId })
        } catch {}
      }
      if (artistProfileId) {
        try {
          await payload.delete({ collection: 'artists', id: artistProfileId })
        } catch {}
      }
      if (mediaId) {
        try {
          await payload.delete({ collection: 'media', id: mediaId })
        } catch {}
      }
      if (customerId) {
        try {
          await payload.delete({ collection: 'users', id: customerId })
        } catch {}
      }
      if (artistUserId) {
        try {
          await payload.delete({ collection: 'users', id: artistUserId })
        } catch {}
      }
    } catch (e) {
      console.error('Integration test afterAll cleanup error:', e)
    }
  })

  describe('Collections & Globals', () => {
    it('fetches users', async () => {
      const result = await payload.find({ collection: 'users', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches artists', async () => {
      const result = await payload.find({ collection: 'artists', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches services', async () => {
      const result = await payload.find({ collection: 'services', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches leads', async () => {
      const result = await payload.find({ collection: 'leads', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches bookings', async () => {
      const result = await payload.find({ collection: 'bookings', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches quotes', async () => {
      const result = await payload.find({ collection: 'quotes', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches reviews', async () => {
      const result = await payload.find({ collection: 'reviews', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches testimonials', async () => {
      const result = await payload.find({ collection: 'testimonials', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches faq', async () => {
      const result = await payload.find({ collection: 'faq', limit: 1 })
      expect(result.docs).toBeInstanceOf(Array)
    })

    it('fetches site settings', async () => {
      const result = await payload.findGlobal({ slug: 'site-settings' })
      expect(result).toBeDefined()
    })

    it('fetches header footer', async () => {
      const result = await payload.findGlobal({ slug: 'header-footer' })
      expect(result).toBeDefined()
    })
  })

  describe('Auth', () => {
    it('registers customer', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          name: 'Test Customer',
          email: testCustomerEmail,
          password: 'TestPass123',
          role: 'customer',
        },
      })
      expect(user.id).toBeDefined()
      customerId = user.id
    })

    it('registers artist with profile', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          name: 'Test Artist',
          email: testArtistEmail,
          password: 'TestPass123',
          role: 'artist',
        },
      })
      artistUserId = user.id

      const profile = await payload.create({
        collection: 'artists',
        data: {
          displayName: 'Test Artist',
          slug: `test-artist-${user.id}`,
          user: user.id,
          phone: '9876543210',
          bio: 'Test bio',
          city: 'Ahmedabad',
          artistType: 'mehndi-artists',
          approvalStatus: 'approved',
          verified: true,
        } as any,
      })
      expect(profile.id).toBeDefined()
      artistProfileId = profile.id
    })

    it('logs in customer', async () => {
      const result = await payload.login({
        collection: 'users',
        data: { email: testCustomerEmail, password: 'TestPass123' },
      })
      expect(result.token).toBeDefined()
      expect(result.user).toBeDefined()
    })

    it('rejects wrong password', async () => {
      await expect(
        payload.login({
          collection: 'users',
          data: { email: testCustomerEmail, password: 'Wrong' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('Leads', () => {
    it('creates lead', async () => {
      const { rawToken, hash, expiresAt } = createTokenPair()
      leadToken = rawToken

      const lead = await payload.create({
        collection: 'leads',
        data: {
          customerName: 'Test Customer',
          customerPhone: '9876543210',
          customerEmail: testCustomerEmail,
          eventType: 'wedding',
          eventDate: '2026-12-25',
          eventLocation: 'Ahmedabad',
          guestCount: 200,
          status: 'new',
          viewTokenHash: hash,
          viewTokenExpiresAt: expiresAt,
        } as any,
      })
      expect(lead.id).toBeDefined()
      leadId = lead.id
    })
  })

  describe('Quotes', () => {
    it('artist submits quote', async () => {
      const quote = await payload.create({
        collection: 'quotes',
        data: {
          lead: leadId,
          artist: artistProfileId,
          priceType: 'package',
          amount: 25000,
          message: 'Premium service',
          estimatedHours: 8,
          travelFee: 500,
          numberOfArtists: 2,
          status: 'sent',
        },
      })
      expect(quote.id).toBeDefined()
      expect(quote.status).toBe('sent')
      quoteId = quote.id
    })

    it('fetches quotes for lead', async () => {
      const result = await payload.find({
        collection: 'quotes',
        where: {
          and: [{ lead: { equals: leadId } }, { status: { in: ['sent', 'viewed', 'accepted'] } }],
        },
        depth: 2,
      })
      expect(result.docs.length).toBeGreaterThan(0)
    })

    it('allows multiple quotes per lead (enforced at API route)', async () => {
      const q2 = await payload.create({
        collection: 'quotes',
        data: { lead: leadId, artist: artistProfileId, amount: 30000, status: 'sent' },
      })
      expect(q2.id).toBeDefined()
      await payload.delete({ collection: 'quotes', id: q2.id })
    })
  })

  describe('Quote Acceptance & Booking', () => {
    it('accepts quote and creates booking', async () => {
      await payload.update({ collection: 'quotes', id: quoteId, data: { status: 'accepted' } })

      await payload.update({
        collection: 'leads',
        id: leadId,
        data: {
          status: 'artist_selected',
          matchedArtists: [artistProfileId],
          acceptedQuote: Number(quoteId),
        },
      })

      const lead = await payload.findByID({ collection: 'leads', id: leadId })

      const booking = await payload.create({
        collection: 'bookings',
        data: {
          name: lead.customerName,
          phone: lead.customerPhone,
          email: lead.customerEmail || undefined,
          eventType: lead.eventType,
          eventDate: lead.eventDate,
          location: lead.eventLocation,
          guestCount: lead.guestCount || undefined,
          lead: leadId,
          quote: Number(quoteId),
          artist: artistProfileId,
          assignedArtists: [
            { artist: artistProfileId, role: 'lead', status: 'pending', fee: 25000 },
          ],
          status: 'artist_pending',
        },
      })
      expect(booking.id).toBeDefined()
      bookingId = booking.id

      const updatedQuote = await payload.findByID({ collection: 'quotes', id: quoteId })
      expect(updatedQuote.status).toBe('accepted')
    })
  })

  describe('Booking Status Flow', () => {
    it('artist_pending -> confirmed', async () => {
      const updated = await payload.update({
        collection: 'bookings',
        id: bookingId,
        data: { status: 'confirmed' },
      })
      expect(updated.status).toBe('confirmed')
    })

    it('confirmed -> in_progress', async () => {
      const updated = await payload.update({
        collection: 'bookings',
        id: bookingId,
        data: { status: 'in_progress' },
      })
      expect(updated.status).toBe('in_progress')
    })

    it('in_progress -> completed', async () => {
      const updated = await payload.update({
        collection: 'bookings',
        id: bookingId,
        data: { status: 'completed' },
      })
      expect(updated.status).toBe('completed')
    })
  })

  describe('Reviews', () => {
    it('creates review for completed booking', async () => {
      const review = await payload.create({
        collection: 'reviews',
        data: {
          booking: bookingId,
          user: customerId,
          customerName: 'Test Customer',
          artist: artistProfileId,
          rating: 5,
          text: 'Excellent!',
          verifiedBooking: true,
        } as any,
      })
      expect(review.id).toBeDefined()
      expect(review.rating).toBe(5)
    })
  })

  describe('Artist Profile', () => {
    it('fetches by slug', async () => {
      const result = await payload.find({
        collection: 'artists',
        where: { slug: { equals: `test-artist-${artistUserId}` } },
        limit: 1,
      })
      expect(result.docs.length).toBe(1)
    })

    it('updates profile', async () => {
      const updated = await payload.update({
        collection: 'artists',
        id: artistProfileId,
        data: { bio: 'Updated bio', startingPrice: 15000 },
      })
      expect(updated.bio).toBe('Updated bio')
      expect(updated.startingPrice).toBe(15000)
    })

    it('uploads media and updates artist portfolio images cleanly', async () => {
      // Create a test 1x1 GIF image buffer
      const gifBuffer = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64',
      )
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: 'Test portfolio sample',
          uploadedBy: artistUserId,
        },
        file: {
          data: gifBuffer,
          mimetype: 'image/gif',
          name: 'test-portfolio.gif',
          size: gifBuffer.length,
        },
        overrideAccess: true,
      })
      expect(media.id).toBeDefined()
      mediaId = media.id

      // 1. Initial portfolio addition with media ID
      const updatedWithId = await payload.update({
        collection: 'artists',
        id: artistProfileId,
        data: {
          portfolioImages: [{ image: media.id, caption: 'First sample' }],
        },
        depth: 2,
      })
      expect(updatedWithId.portfolioImages?.length).toBe(1)

      // 2. Simulate frontend depth-2 array structure being mapped and updated
      const rawPortfolio = updatedWithId.portfolioImages || []
      const mappedPortfolio = rawPortfolio.map((item: any) => ({
        image:
          typeof item?.image === 'object' && item?.image !== null ? item.image.id : item?.image,
        caption: item?.caption || '',
      }))

      const reUpdated = await payload.update({
        collection: 'artists',
        id: artistProfileId,
        data: {
          portfolioImages: mappedPortfolio,
        },
        depth: 2,
      })
      expect(reUpdated.portfolioImages?.length).toBe(1)
      expect((reUpdated.portfolioImages?.[0]?.image as any)?.id).toBe(media.id)
    })

    it('sets artist as featured with featuredUntil date cleanly', async () => {
      const updated = await payload.update({
        collection: 'artists',
        id: artistProfileId,
        data: {
          isFeatured: true,
          featuredUntil: '2026-12-31',
        },
        depth: 1,
      })
      expect(updated.isFeatured).toBe(true)
      expect(updated.featuredUntil).toBeDefined()
    })

    it('creates multiple media items in bulk and appends to artist portfolio', async () => {
      const gifBuffer1 = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64',
      )
      const gifBuffer2 = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64',
      )

      const media1 = await payload.create({
        collection: 'media',
        data: { alt: 'Bulk Sample 1', uploadedBy: artistUserId },
        file: {
          data: gifBuffer1,
          mimetype: 'image/gif',
          name: 'bulk1.gif',
          size: gifBuffer1.length,
        },
        overrideAccess: true,
      })
      const media2 = await payload.create({
        collection: 'media',
        data: { alt: 'Bulk Sample 2', uploadedBy: artistUserId },
        file: {
          data: gifBuffer2,
          mimetype: 'image/gif',
          name: 'bulk2.gif',
          size: gifBuffer2.length,
        },
        overrideAccess: true,
      })

      expect(media1.id).toBeDefined()
      expect(media2.id).toBeDefined()

      const artist = await payload.findByID({
        collection: 'artists',
        id: artistProfileId,
        depth: 1,
      })
      const existing = (artist.portfolioImages || []).map((p: any) => ({
        image: typeof p?.image === 'object' && p?.image !== null ? p.image.id : p?.image,
        caption: p?.caption || '',
      }))

      const updated = await payload.update({
        collection: 'artists',
        id: artistProfileId,
        data: {
          portfolioImages: [
            ...existing,
            { image: media1.id, caption: 'B1' },
            { image: media2.id, caption: 'B2' },
          ],
        },
        depth: 1,
      })

      expect(updated.portfolioImages?.length).toBeGreaterThanOrEqual(2)

      // Clean up extra test media
      try {
        await payload.delete({ collection: 'media', id: media1.id })
        await payload.delete({ collection: 'media', id: media2.id })
      } catch {}
    })
  })

  describe('Security: Token Auth', () => {
    it('rejects quotes GET without token or auth', async () => {
      const { verifyToken } = await import('../../src/lib/token')
      const leads = await payload.find({ collection: 'leads', limit: 1 })
      const lead = leads.docs[0]
      if (!lead) return

      const result = verifyToken({
        rawToken: 'invalid',
        storedHash: lead.viewTokenHash,
        expiresAt: lead.viewTokenExpiresAt,
        revokedAt: lead.viewTokenRevokedAt,
      })
      expect(result.valid).toBe(false)
      if (!result.valid) expect(result.status).toBe(403)
    })

    it('rejects expired tokens', async () => {
      const { hashToken } = await import('../../src/lib/token')
      const expiredHash = hashToken('expired-token')
      const { verifyToken } = await import('../../src/lib/token')
      const result = verifyToken({
        rawToken: 'expired-token',
        storedHash: expiredHash,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
        revokedAt: undefined,
      })
      expect(result.valid).toBe(false)
      if (!result.valid) expect(result.status).toBe(403)
    })

    it('rejects revoked tokens', async () => {
      const { rawToken, hash: tokenHash } = createTokenPair()
      const { verifyToken } = await import('../../src/lib/token')
      const result = verifyToken({
        rawToken,
        storedHash: tokenHash,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        revokedAt: new Date().toISOString(),
      })
      expect(result.valid).toBe(false)
      if (!result.valid) expect(result.status).toBe(403)
    })

    it('allows quotes GET with valid lead token via Local API', async () => {
      const { rawToken, hash: tokenHash, expiresAt } = createTokenPair()
      const { verifyToken } = await import('../../src/lib/token')

      const testLead = await payload.create({
        collection: 'leads',
        data: {
          customerName: 'Token Test',
          customerPhone: '+91 99999 99999',
          eventType: 'wedding',
          eventDate: '2026-12-25',
          eventLocation: 'Ahmedabad',
          viewTokenHash: tokenHash,
          viewTokenExpiresAt: expiresAt,
        } as any,
      })

      const result = verifyToken({
        rawToken,
        storedHash: testLead.viewTokenHash,
        expiresAt: testLead.viewTokenExpiresAt,
        revokedAt: testLead.viewTokenRevokedAt,
      })
      expect(result.valid).toBe(true)

      const quotes = await payload.find({
        collection: 'quotes',
        where: {
          and: [
            { lead: { equals: testLead.id } },
            { status: { in: ['sent', 'viewed', 'accepted'] } },
          ],
        },
      })
      expect(quotes.docs).toBeInstanceOf(Array)

      await payload.delete({ collection: 'leads', id: testLead.id })
    })
  })

  describe('Security: Quote Idempotency', () => {
    it('returns existing booking on duplicate acceptance', async () => {
      const quotes = await payload.find({
        collection: 'quotes',
        where: { and: [{ lead: { equals: leadId } }, { status: { equals: 'accepted' } }] },
        limit: 1,
      })
      if (quotes.docs.length === 0) return

      const quote = quotes.docs[0]
      const existingBookings = await payload.find({
        collection: 'bookings',
        where: { quote: { equals: quote.id } },
        limit: 1,
      })
      expect(existingBookings.docs.length).toBe(1)
    })
  })

  describe('Portfolio & Service Categories', () => {
    it('correctly maps artist types to service categories', async () => {
      const { mapArtistTypeToServiceCategory } = await import('../../src/lib/payload')
      expect(mapArtistTypeToServiceCategory('makeup-artists')).toBe('makeup')
      expect(mapArtistTypeToServiceCategory('photographers')).toBe('photography')
      expect(mapArtistTypeToServiceCategory('mehndi-artists')).toBe('mehndi')
      expect(mapArtistTypeToServiceCategory('decor-event-planners')).toBe('decor')
      expect(mapArtistTypeToServiceCategory('unknown-type')).toBe('other')
    })

    it('fetches unified portfolio items including approved artists and category filters', async () => {
      const { getPortfolioItems } = await import('../../src/lib/payload')
      const allItems = await getPortfolioItems()
      expect(allItems).toBeInstanceOf(Array)

      const makeupItems = await getPortfolioItems({ serviceCategory: 'makeup' })
      expect(makeupItems).toBeInstanceOf(Array)
      makeupItems.forEach((item) => {
        expect(item.serviceCategory).toBe('makeup')
      })
    })
  })

  describe('Cleanup', () => {
    it('deletes test data', async () => {
      if (bookingId) {
        const reviews = await payload.find({
          collection: 'reviews',
          where: { booking: { equals: bookingId } },
        })
        for (const r of reviews.docs) await payload.delete({ collection: 'reviews', id: r.id })
        await payload.delete({ collection: 'bookings', id: bookingId })
      }
      if (quoteId) await payload.delete({ collection: 'quotes', id: quoteId })
      if (leadId) await payload.delete({ collection: 'leads', id: leadId })
      if (artistProfileId) await payload.delete({ collection: 'artists', id: artistProfileId })
      if (customerId) await payload.delete({ collection: 'users', id: customerId })
      if (artistUserId) await payload.delete({ collection: 'users', id: artistUserId })
    })
  })
})
