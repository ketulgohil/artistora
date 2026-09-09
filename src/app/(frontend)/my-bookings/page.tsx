'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
  artist_pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Artist Pending' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  declined: { bg: 'bg-red-100', text: 'text-red-700', label: 'Declined' },
}

const EVENT_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement',
  'baby-shower': 'Baby Shower',
  birthday: 'Birthday',
  corporate: 'Corporate Event',
  'family-function': 'Family Function',
  festival: 'Festival',
  other: 'Other',
}

interface Booking {
  id: string
  name: string
  eventType: string
  eventDate: string
  location: string
  status: string
  createdAt: string
}

interface Lead {
  id: string
  customerName: string
  eventType: string
  eventDate: string
  eventLocation: string
  status: string
  createdAt: string
}

function MyBookingsContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [noResults, setNoResults] = useState(false)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    const token = searchParams.get('token')
    const leadId = searchParams.get('leadId')

    async function load() {
      try {
        if (token && leadId) {
          const res = await fetch(`/api/my-bookings?token=${token}&leadId=${leadId}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Invalid or expired link')
          setBookings(data.bookings || [])
          setLeads(data.leads || [])
          setIsAuthenticated(false)
          setNoResults((data.bookings || []).length === 0 && (data.leads || []).length === 0)
        } else {
          const res = await fetch('/api/my-bookings')
          const data = await res.json()
          if (!res.ok) {
            if (res.status === 401) {
              setError('')
              setNoResults(true)
              return
            }
            throw new Error(data.error || 'Failed to load bookings')
          }
          setBookings(data.bookings || [])
          setLeads(data.leads || [])
          setIsAuthenticated(true)
          setNoResults((data.bookings || []).length === 0 && (data.leads || []).length === 0)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [searchParams])

  const getStatus = (status: string) =>
    STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }

  const handleCancelBooking = async (bookingId: string) => {
    if (!cancelReason.trim()) return
    setCancelling(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          cancellationReason: cancelReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking')
      setCancelBookingId(null)
      setCancelReason('')
      // Refresh bookings list
      const refreshRes = await fetch('/api/my-bookings')
      const refreshData = await refreshRes.json()
      if (refreshRes.ok) {
        setBookings(refreshData.bookings || [])
        setLeads(refreshData.leads || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16! md:py-24!">
        <div className="mx-auto max-w-2xl! px-4! md:px-6! text-center">
          <div className="flex items-center justify-center gap-3! text-sm text-ink-muted">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Loading your bookings...
          </div>
        </div>
      </section>
    )
  }

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
            {isAuthenticated
              ? 'Here are all your bookings and quote requests.'
              : 'View your bookings using the secure link from your email.'}
          </p>
        </div>

        {error && (
          <div className="mb-6! rounded-2xl border border-red-200 bg-red-50 p-5! text-sm text-red-700">
            <p className="font-medium">Error</p>
            <p className="mt-1!">{error}</p>
          </div>
        )}

        {/* Unauthenticated - no token */}
        {!isAuthenticated && noResults && !error && (
          <div className="rounded-3xl border border-line bg-white p-7! shadow-soft md:p-8! text-center">
            <div className="mx-auto mb-4! flex h-12! w-12! items-center justify-center rounded-full bg-brand/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="font-display text-lg! font-semibold text-ink">Sign In Required</h2>
            <p className="mt-2! text-sm text-ink-soft">
              Please sign in to view your bookings, or use the secure access link sent to your email.
            </p>
            <div className="mt-5! flex flex-col gap-3! sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="inline-flex min-h-10! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-2.5! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-10! cursor-pointer items-center justify-center gap-2! rounded-full border border-brand px-6! py-2.5! text-sm font-semibold text-brand transition-all duration-200 hover:bg-brand/5"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* Results */}
        {(bookings.length > 0 || leads.length > 0) && (
          <div className="space-y-8!">
            {/* Bookings */}
            <div>
              <h2 className="mb-4! font-display text-lg! font-semibold text-ink">
                Bookings ({bookings.length})
              </h2>
              {bookings.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-6! text-center text-sm text-ink-muted">
                  No bookings found yet.
                </div>
              ) : (
                <div className="space-y-4!">
                  {bookings.map((b) => {
                    const s = getStatus(b.status)
                    const canCancel = ['confirmed', 'in_progress', 'artist_pending', 'requested'].includes(b.status)
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
                          </div>
                          <span className={`shrink-0 rounded-full px-3! py-1! text-xs font-semibold ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="mt-3! text-xs text-ink-muted">
                          Created on {formatDate(b.createdAt)}
                        </p>

                        {canCancel && (
                          <div className="mt-3! border-t border-line/60 pt-3!">
                            {cancelBookingId === b.id ? (
                              <div className="flex flex-col gap-2!">
                                <input
                                  type="text"
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  placeholder="Reason for cancellation"
                                  className="w-full rounded-xl border border-line bg-cream/50 px-3! py-2! text-sm outline-none focus:border-brand"
                                />
                                <div className="flex gap-2!">
                                  <button
                                    onClick={() => handleCancelBooking(b.id)}
                                    disabled={cancelling || !cancelReason.trim()}
                                    className="cursor-pointer rounded-full bg-red-600 px-4! py-1.5! text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                                  </button>
                                  <button
                                    onClick={() => { setCancelBookingId(null); setCancelReason('') }}
                                    className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                                  >
                                    Back
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setCancelBookingId(b.id); setCancelReason('') }}
                                className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700"
                              >
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        )}
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
                  No quote requests found yet.
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

export default function MyBookingsPage() {
  return (
    <Suspense fallback={
      <section className="py-16! md:py-24!">
        <div className="mx-auto max-w-2xl! px-4! md:px-6! text-center">
          <div className="flex items-center justify-center gap-3! text-sm text-ink-muted">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Loading...
          </div>
        </div>
      </section>
    }>
      <MyBookingsContent />
    </Suspense>
  )
}
