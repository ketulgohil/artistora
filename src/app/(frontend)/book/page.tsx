'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EVENT_TYPES = [
  { value: 'bridal', label: 'Bridal Mehndi' },
  { value: 'engagement', label: 'Engagement Mehndi' },
  { value: 'baby-shower', label: 'Baby Shower' },
  { value: 'family-function', label: 'Family Function' },
  { value: 'festival', label: 'Festival' },
  { value: 'other', label: 'Other' },
]

export default function BookPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: '',
    eventDate: '',
    location: '',
    guestCount: '',
    designStyle: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || data.message || 'Booking failed')
      }
      router.push('/thank-you')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20'
  const labelClass = 'mb-1.5! block text-sm font-medium text-ink-soft'

  return (
    <section className="py-16! md:py-24!">
      <div className="mx-auto max-w-xl! px-4! md:px-6!">
        <div className="rounded-3xl border border-line bg-white p-8! shadow-soft md:p-10!">
          {/* Header */}
          <div className="mb-8! text-center">
            <p className="mb-3! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
              Book Now
              <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
            </p>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Book Your Mehndi Session
            </h1>
            <p className="mt-2! text-sm text-ink-soft">
              Fill in the details and we&apos;ll get back to you shortly.
            </p>
          </div>

          {error && (
            <div className="mb-6! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5!">
            {/* Name */}
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Priya Patel"
                required
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="e.g. 9876543210"
                required
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="e.g. priya@email.com"
                className={inputClass}
              />
            </div>

            {/* Event Type */}
            <div>
              <label className={labelClass}>Event Type *</label>
              <select
                value={form.eventType}
                onChange={(e) => update('eventType', e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select event type</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className={labelClass}>Event Date *</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => update('eventDate', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* Location */}
            <div>
              <label className={labelClass}>Venue / Area in Ahmedabad *</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="e.g. SG Highway, Ahmedabad"
                required
                className={inputClass}
              />
            </div>

            {/* Guest Count */}
            <div>
              <label className={labelClass}>Number of people needing mehndi</label>
              <input
                type="number"
                value={form.guestCount}
                onChange={(e) => update('guestCount', e.target.value)}
                placeholder="e.g. 5"
                min={1}
                className={inputClass}
              />
            </div>

            {/* Design Style */}
            <div>
              <label className={labelClass}>Preferred design style</label>
              <input
                type="text"
                value={form.designStyle}
                onChange={(e) => update('designStyle', e.target.value)}
                placeholder="e.g. Arabic, Bridal, Minimal"
                className={inputClass}
              />
            </div>

            {/* Message */}
            <div>
              <label className={labelClass}>Additional details or requests</label>
              <textarea
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Any special requests or information..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2! inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Booking Request'
              )}
            </button>
          </form>

          <p className="mt-6! text-center text-xs text-ink-muted">
            We&apos;ll confirm availability via phone or WhatsApp within 24 hours.
          </p>
        </div>
      </div>
    </section>
  )
}
