'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Quote {
  id: string
  amount: number
  priceType?: string
  unitRate?: number
  units?: number
  message?: string
  estimatedHours?: number
  travelFee: number
  numberOfArtists: number
  validUntil?: string
  status: string
  artistName: string
  artistRating: number
  artistPortfolio: any[]
}

export default function QuotesPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.leadId as string

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!leadId) return
    fetch(`/api/quotes?leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => { setQuotes(d.quotes || []); setLoading(false) })
      .catch(() => { setError('Failed to load quotes'); setLoading(false) })
  }, [leadId])

  const handleAccept = async (quoteId: string) => {
    setAccepting(quoteId)
    setError('')
    try {
      const res = await fetch(`/api/quotes/${quoteId}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept')
      setSuccess(true)
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? { ...q, status: 'accepted' }
            : { ...q, status: 'rejected' }
        )
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAccepting(null)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <section className="py-16! md:py-24!">
        <div className="mx-auto max-w-2xl! px-4! text-center">
          <div className="animate-spin mx-auto h-8! w-8! rounded-full border-2 border-brand border-t-transparent" />
          <p className="mt-4! text-sm text-ink-muted">Loading quotes...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16! md:py-24!">
      <div className="mx-auto max-w-2xl! px-4! md:px-6!">
        <div className="mb-8! text-center">
          <p className="mb-3! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
            <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
            Your Quotes
            <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
          </p>
          <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
            Compare Artist Quotes
          </h1>
          <p className="mt-2! text-sm text-ink-soft">
            Review and select the best quote for your mehndi event.
          </p>
        </div>

        {error && (
          <div className="mb-6! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6! rounded-xl border border-green-200 bg-green-50 px-4! py-3! text-sm text-green-700">
            Quote accepted! A booking request has been sent to the artist for confirmation. You can also view it in <Link href="/my-bookings" className="font-semibold underline">My Bookings</Link>.
          </div>
        )}

        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8! text-center shadow-soft">
            <p className="text-ink-muted">No quotes received yet. Artists will respond within 24 hours.</p>
            <Link href="/" className="mt-4! inline-block text-sm font-semibold text-brand hover:underline">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="space-y-4!">
            {quotes.map((q) => (
              <div
                key={q.id}
                className={`rounded-2xl border bg-white p-5! shadow-soft transition-all ${
                  q.status === 'accepted'
                    ? 'border-green bg-green/5'
                    : q.status === 'rejected'
                      ? 'border-line opacity-60'
                      : 'border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-3!">
                  <div>
                    <div className="flex items-center gap-2!">
                      <p className="font-semibold text-ink">{q.artistName}</p>
                      {q.priceType && (
                        <span className="rounded-full bg-cream-deep px-2.5! py-0.5! text-[11px] font-medium text-ink-soft capitalize">
                          {q.priceType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {q.artistRating > 0 && (
                      <div className="mt-1! flex items-center gap-1! text-sm text-gold">
                        {'★'.repeat(Math.round(q.artistRating))}
                        <span className="text-ink-muted">({q.artistRating.toFixed(1)})</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl! font-bold text-brand">₹{q.amount.toLocaleString('en-IN')}</p>
                    {q.travelFee > 0 && (
                      <p className="text-xs text-ink-muted">+ ₹{q.travelFee} travel</p>
                    )}
                  </div>
                </div>

                {q.message && (
                  <p className="mt-3! text-sm leading-relaxed text-ink-soft">{q.message}</p>
                )}

                <div className="mt-4! flex flex-wrap gap-3! text-xs text-ink-muted">
                  {q.estimatedHours && <span>{q.estimatedHours} hours</span>}
                  {q.numberOfArtists > 1 && <span>{q.numberOfArtists} artists</span>}
                  {q.validUntil && <span>Valid till {formatDate(q.validUntil)}</span>}
                </div>

                {q.status === 'sent' || q.status === 'viewed' ? (
                  <button
                    onClick={() => handleAccept(q.id)}
                    disabled={accepting !== null || success}
                    className="mt-4! inline-flex min-h-10! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-6! py-2.5! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accepting === q.id ? 'Accepting...' : 'Accept Quote'}
                  </button>
                ) : q.status === 'accepted' ? (
                  <span className="mt-4! inline-flex items-center gap-2! rounded-full bg-green/10 px-4! py-2! text-sm font-semibold text-green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Accepted
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
