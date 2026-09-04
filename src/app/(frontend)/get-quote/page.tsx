'use client'

import { useState } from 'react'
import Link from 'next/link'

const CONTAINER = 'mx-auto max-w-3xl! px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement Celebration' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'baby-shower', label: 'Baby Shower' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'festival', label: 'Festival or Celebration' },
  { value: 'other', label: 'Other' },
]

const BUDGET_RANGES = [
  { value: 'under-2000', label: 'Under ₹2,000' },
  { value: '2000-5000', label: '₹2,000 – ₹5,000' },
  { value: '5000-10000', label: '₹5,000 – ₹10,000' },
  { value: '10000-20000', label: '₹10,000 – ₹20,000' },
  { value: '20000-50000', label: '₹20,000 – ₹50,000' },
  { value: 'above-50000', label: 'Above ₹50,000' },
  { value: 'unsure', label: 'Not sure yet' },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8! flex items-center justify-center gap-2!" role="group" aria-label={`Step ${current} of ${total}`}>
      <span className="sr-only">Step {current} of {total}</span>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2!">
          <div
            className={`flex h-8! w-8! items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
              i + 1 === current
                ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-soft'
                : i + 1 < current
                  ? 'bg-green text-white'
                  : 'bg-line text-ink-muted'
            }`}
            aria-hidden="true"
          >
            {i + 1 < current ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-8! ${i + 1 < current ? 'bg-green' : 'bg-line'}`} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function GetQuotePage() {
  const [step, setStep] = useState(1)
  const [minimumDate] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    eventType: '',
    eventDate: '',
    eventLocation: '',
    guestCount: '',
    budgetRange: '',
    designStyle: '',
    additionalNotes: '',
  })

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const canNext = () => {
    if (step === 1) return form.customerName.trim() && form.customerPhone.trim().length >= 10
    if (step === 2) return form.eventType && form.eventDate && form.eventLocation.trim()
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          guestCount: form.guestCount ? Number(form.guestCount) : undefined,
          customerEmail: form.customerEmail || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="rounded-3xl border border-line bg-white p-10! text-center shadow-soft md:p-14!">
            <div className="mx-auto mb-6! flex h-16! w-16! items-center justify-center rounded-full bg-green/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">
              Quote Request Received!
            </h1>
            <p className="mt-4! text-[0.95rem] leading-relaxed text-ink-soft">
              Thank you, {form.customerName}! We have received your request for {form.eventType.replace('-', ' ')}. Our team will match you with up to 3 verified artists and send quotes within 24 hours.
            </p>
            <p className="mt-3! text-sm text-ink-muted">
              You will be contacted on {form.customerPhone} via WhatsApp or call.
            </p>
            <div className="mt-8! flex flex-wrap justify-center gap-3!">
              <Link
                href="/artists"
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Browse Artists
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-brand/40 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <SectionHeadingInline title="Get 3 Quotes" subtitle="Free, No Obligation" />
          <p className="mx-auto mt-4! max-w-xl! text-center text-[0.95rem] leading-relaxed text-ink-soft">
            Share your event details and receive competitive quotes from up to 3 verified artists in Ahmedabad.
          </p>
        </div>
      </section>

      {/* ── Form ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="rounded-3xl border border-line bg-white p-7! shadow-soft md:p-10!">
            <StepIndicator current={step} total={3} />

            {error && (
              <div className="mb-6! rounded-xl border border-red-200 bg-red-50 px-4! py-3! text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Step 1: Contact Info */}
            {step === 1 && (
              <div className="flex flex-col gap-5!">
                <h3 className="font-display text-xl! font-semibold text-ink">Your Details</h3>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Full Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => update('customerName', e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => update('customerPhone', e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Email (optional)</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => update('customerEmail', e.target.value)}
                    placeholder="e.g. priya@example.com"
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Event Details */}
            {step === 2 && (
              <div className="flex flex-col gap-5!">
                <h3 className="font-display text-xl! font-semibold text-ink">Event Details</h3>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Event Type *</label>
                  <select
                    value={form.eventType}
                    onChange={(e) => update('eventType', e.target.value)}
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="">Select event type</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Event Date *</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => update('eventDate', e.target.value)}
                    min={minimumDate || undefined}
                    required
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Event Venue / Area *</label>
                  <input
                    type="text"
                    value={form.eventLocation}
                    onChange={(e) => update('eventLocation', e.target.value)}
                    placeholder="e.g. Marriott Ahmedabad, SG Highway"
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="grid gap-5! sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">Guest Count (optional)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.guestCount}
                      onChange={(e) => update('guestCount', e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5! block text-sm font-medium text-ink-soft">Budget Range (optional)</label>
                    <select
                      value={form.budgetRange}
                      onChange={(e) => update('budgetRange', e.target.value)}
                      className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="">Select budget</option>
                      {BUDGET_RANGES.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="flex flex-col gap-5!">
                <h3 className="font-display text-xl! font-semibold text-ink">Service Preferences</h3>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Style or service requirements (optional)</label>
                  <input
                    type="text"
                    value={form.designStyle}
                    onChange={(e) => update('designStyle', e.target.value)}
                    placeholder="e.g. coverage, style, deliverables, or timing"
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5! block text-sm font-medium text-ink-soft">Additional Notes (optional)</label>
                  <textarea
                    value={form.additionalNotes}
                    onChange={(e) => update('additionalNotes', e.target.value)}
                    rows={4}
                    placeholder="Any specific requirements, theme details, or preferences..."
                    className="w-full rounded-xl border border-line bg-cream/50 px-4! py-3! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
                  />
                </div>
                <div className="rounded-xl bg-cream-deep/70 p-4! text-sm leading-relaxed text-ink-soft">
                  <strong className="text-ink">What happens next?</strong>
                  <br />
                  We will match you with up to 3 verified artists who fit your event type, location, and budget. You will receive quotes via WhatsApp within 24 hours.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8! flex items-center justify-between border-t border-line pt-6!">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex min-h-10! cursor-pointer items-center justify-center rounded-full border border-line bg-white px-5! py-2.5! text-sm font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-soft"
                >
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-soft"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quote Request
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionHeadingInline({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-4! max-w-3xl! text-center">
      {subtitle && (
        <p className="mb-4! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
          <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
          {subtitle}
          <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
        </p>
      )}
      <h1 className="font-display text-3xl! leading-tight font-semibold text-ink md:text-[2.6rem]!">
        {title}
      </h1>
      <div aria-hidden="true" className="mx-auto mt-5! flex items-center justify-center gap-2! text-gold">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/70" />
        <svg width="10" height="10" viewBox="0 0 10 10" className="rotate-45 text-gold" fill="currentColor">
          <rect x="0" y="0" width="10" height="10" rx="1" />
        </svg>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/70" />
      </div>
    </div>
  )
}
