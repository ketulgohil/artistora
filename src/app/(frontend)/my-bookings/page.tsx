'use client'

import { useState } from 'react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'New' },
  reviewing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Reviewing' },
  artists_matched: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Artists Matched' },
  quotes_received: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Quotes Received' },
  customer_contacted: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Customer Contacted' },
  artist_selected: { bg: 'bg-green-100', text: 'text-green-700', label: 'Artist Selected' },
  booking_pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Booking Pending' },
  booked: { bg: 'bg-green-100', text: 'text-green-700', label: 'Booked' },
  lost: { bg: 'bg-red-100', text: 'text-red-700', label: 'Lost' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' },
  // Booking statuses
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
  artist_pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Artist Pending' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  declined: { bg: 'bg-red-100', text: 'text-red-700', label: 'Declined' },
}

const EVENT_LABELS: Record<string, string> = {
  bridal: 'Bridal Mehndi',
  engagement: 'Engagement Mehndi',
  'baby-shower': 'Baby Shower',
  'family-function': 'Family Function',
  festival: 'Festival',
  other: 'Other',
}

interface Booking {
  id: string
  name: string
  phone: string
  email?: string
  eventType: string
  eventDate: string
  location: string
  guestCount?: number
  status: string
  createdAt: string
}

interface Lead {
  id: string
  customerName: string
  customerPhone: string
  eventType: string
  eventDate: string
  eventLocation: string
  status: string
  createdAt: string
}

export default function MyBookingsPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [searched, setSearched] = useState(false)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/my-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lookup failed')
      setBookings(data.bookings)
      setLeads(data.leads)
      setSearched(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const getStatus = (status: string) =>
    STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }

  return (
    <section className="py-16! md:py-24!">
      <div className="mx-auto max-w-2xl! px-4! md:px-6!">
        {/* Header */}
        <div className="mb-8! text-center">
          <p className="mb-3! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
            <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
            My Bookings
            <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
          </p>
          <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
            Track Your Bookings
          </h1>
          <p className="mt-2! text-sm text-ink-soft">
            Enter your phone number to view all your bookings and quote requests.
          </p>
        </div>

        {/* Lookup Form */}
        <div className="rounded-3xl border border-line bg-white p-7! shadow-soft md:p-8!">
          <form onSubmit={handleLookup} className="flex flex-col gap-4!">
            <div>
              <label className="mb-1.5! block text-sm font-medium text-ink-soft">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); setSearched(false) }}
                placeholder="Enter your phone number (e.g. 9876543210)"
                required
                className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading || phone.trim().length < 10}
              className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Looking up...
                </>
              ) : (
                'Find My Bookings'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {searched && (
          <div className="mt-8! space-y-8!">
            {/* Bookings */}
            <div>
              <h2 className="mb-4! font-display text-lg! font-semibold text-ink">
                Bookings ({bookings.length})
              </h2>
              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-6! text-center text-sm text-ink-muted">
                  No bookings found for this phone number.
                </div>
              ) : (
                <div className="space-y-4!">
                  {bookings.map((b) => {
                    const s = getStatus(b.status)
                    return (
                      <div key={b.id} className="rounded-2xl border border-line bg-white p-5! shadow-soft">
                        <div className="flex items-start justify-between gap-3!">
                          <div>
                            <p className="font-semibold text-ink">
                              {EVENT_LABELS[b.eventType] || b.eventType}
                            </p>
                            <p className="mt-1! text-sm text-ink-soft">
                              {formatDate(b.eventDate)} &middot; {b.location}
                            </p>
                            {b.guestCount && (
                              <p className="mt-1! text-xs text-ink-muted">
                                {b.guestCount} guest{b.guestCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <span className={`shrink-0 rounded-full px-3! py-1! text-xs font-semibold ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="mt-3! text-xs text-ink-muted">
                          Booked on {formatDate(b.createdAt)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Leads / Quote Requests */}
            <div>
              <h2 className="mb-4! font-display text-lg! font-semibold text-ink">
                Quote Requests ({leads.length})
              </h2>
              {leads.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-6! text-center text-sm text-ink-muted">
                  No quote requests found for this phone number.
                </div>
              ) : (
                <div className="space-y-4!">
                  {leads.map((l) => {
                    const s = getStatus(l.status)
                    return (
                      <div key={l.id} className="rounded-2xl border border-line bg-white p-5! shadow-soft">
                        <div className="flex items-start justify-between gap-3!">
                          <div>
                            <p className="font-semibold text-ink">
                              {EVENT_LABELS[l.eventType] || l.eventType}
                            </p>
                            <p className="mt-1! text-sm text-ink-soft">
                              {formatDate(l.eventDate)} &middot; {l.eventLocation}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-3! py-1! text-xs font-semibold ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="mt-3! text-xs text-ink-muted">
                          Requested on {formatDate(l.createdAt)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/get-quote"
                className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Request New Quote
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
