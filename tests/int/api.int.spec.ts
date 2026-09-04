import { getPayload, Payload } from 'payload'
import { describe, it, expect, beforeAll, vi } from 'vitest'

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
let quoteId: number
let bookingId: number

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  }, 300_000)

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
        data: { name: 'Test Customer', email: testCustomerEmail, password: 'TestPass123', role: 'customer' },
      })
      expect(user.id).toBeDefined()
      customerId = user.id
    })

    it('registers artist with profile', async () => {
      const user = await payload.create({
        collection: 'users',
        data: { name: 'Test Artist', email: testArtistEmail, password: 'TestPass123', role: 'artist' },
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
          verified: false,
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
        payload.login({ collection: 'users', data: { email: testCustomerEmail, password: 'Wrong' } }),
      ).rejects.toThrow()
    })
  })

  describe('Leads', () => {
    it('creates lead', async () => {
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
        },
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
        where: { and: [{ lead: { equals: leadId } }, { status: { in: ['sent', 'viewed', 'accepted'] } }] },
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
        data: { status: 'artist_selected', matchedArtists: [artistProfileId], acceptedQuote: Number(quoteId) },
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
          assignedArtists: [{ artist: artistProfileId, role: 'lead', status: 'pending', fee: 25000 }],
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
      const updated = await payload.update({ collection: 'bookings', id: bookingId, data: { status: 'confirmed' } })
      expect(updated.status).toBe('confirmed')
    })

    it('confirmed -> in_progress', async () => {
      const updated = await payload.update({ collection: 'bookings', id: bookingId, data: { status: 'in_progress' } })
      expect(updated.status).toBe('in_progress')
    })

    it('in_progress -> completed', async () => {
      const updated = await payload.update({ collection: 'bookings', id: bookingId, data: { status: 'completed' } })
      expect(updated.status).toBe('completed')
    })
  })

  describe('Reviews', () => {
    it('creates review for completed booking', async () => {
      const review = await payload.create({
        collection: 'reviews',
        data: { booking: bookingId, user: customerId, customerName: 'Test Customer', artist: artistProfileId, rating: 5, text: 'Excellent!', verifiedBooking: true } as any,
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
  })

  describe('Cleanup', () => {
    it('deletes test data', async () => {
      const reviews = await payload.find({ collection: 'reviews', where: { booking: { equals: bookingId } } })
      for (const r of reviews.docs) await payload.delete({ collection: 'reviews', id: r.id })

      await payload.delete({ collection: 'bookings', id: bookingId })
      await payload.delete({ collection: 'quotes', id: quoteId })
      await payload.delete({ collection: 'leads', id: leadId })
      await payload.delete({ collection: 'artists', id: artistProfileId })
      await payload.delete({ collection: 'users', id: customerId })
      await payload.delete({ collection: 'users', id: artistUserId })
    })
  })
})
