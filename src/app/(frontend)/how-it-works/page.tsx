import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'

export const metadata = {
  title: 'How It Works — Book Verified Artists in 3 Simple Steps',
  description:
    'Learn how Artistora works — share your event details, compare quotes from verified artists, and book the perfect professional for your wedding or celebration in Ahmedabad.',
  alternates: {
    canonical: 'https://www.artistora.com/how-it-works',
  },
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const customerSteps = [
  {
    num: '01',
    title: 'Share Your Event Details',
    description:
      'Tell us about your event — date, venue, guest count, budget, and what kind of artist you need. It takes less than 2 minutes.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Compare Quotes from Verified Artists',
    description:
      'Within hours, multiple verified artists respond with detailed quotes — pricing, packages, and availability. Compare them side by side.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <path d="M6 8h.01M6 11h.01M6 14h.01" />
        <path d="M10 8h8M10 11h8M10 14h5" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Book & Celebrate',
    description:
      'Choose the artist that fits your style and budget. Confirm the booking, and you\'re set. Leave a review after the event to help others.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
]

const artistSteps = [
  {
    num: '01',
    title: 'Register & Create Your Profile',
    description:
      'Sign up as an artist, fill in your details — services, experience, pricing, portfolio photos. A complete profile gets 3x more booking requests.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Receive Booking Requests',
    description:
      'Customers in Ahmedabad submit event details that match your services. You receive requests with all the information you need to respond.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Quote, Confirm & Get Paid',
    description:
      'Send your best quote with pricing details. When the customer selects you, the booking is confirmed. Deliver great work and build your reputation.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
]

const benefits = [
  { title: 'No Registration Fees', text: 'Signing up and receiving leads is completely free for artists.' },
  { title: 'Transparent Pricing', text: 'Customers see your prices upfront — no hidden costs, no surprises.' },
  { title: 'Verified Badge', text: 'Verified artists get a trust badge that increases bookings by 40%.' },
  { title: 'Real Reviews', text: 'Build your reputation with genuine reviews from completed bookings.' },
]

export default function HowItWorksPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />
        <div className={`relative ${CONTAINER} py-16! md:py-24!`}>
          <div className="mx-auto max-w-3xl! text-center">
            <p className="mb-4! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
              Simple &amp; Transparent
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
            </p>
            <h1 className="font-display text-[2.3rem]! leading-[1.12] font-semibold text-ink md:text-[3.2rem]!">
              How Artistora Works
            </h1>
            <p className="mt-5! text-[1.05rem] leading-relaxed text-ink-soft">
              Whether you&apos;re looking to book an artist or grow your client base — Artistora makes it simple, transparent, and fast.
            </p>
          </div>
        </div>
      </section>

      {/* ── For Customers ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="mb-12! text-center">
            <p className="mb-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">For Customers</p>
            <h2 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">Book your perfect artist in 3 steps</h2>
            <p className="mx-auto mt-3! max-w-xl! text-sm leading-relaxed text-ink-soft">
              No middlemen, no hidden fees. Just verified artists, transparent quotes, and easy booking.
            </p>
          </div>

          <div className="grid gap-8! md:grid-cols-3">
            {customerSteps.map((step) => (
              <div key={step.num} className="relative rounded-3xl border border-line bg-white p-7! shadow-soft md:p-8!">
                <div className="mb-5! flex h-14! w-14! items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 text-brand">
                  {step.icon}
                </div>
                <span className="mb-2! block font-display text-[0.65rem] font-bold tracking-[0.2em] text-brand/50 uppercase">
                  Step {step.num}
                </span>
                <h3 className="font-display text-lg! font-semibold text-ink">{step.title}</h3>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10! text-center">
            <Link
              href="/get-quote"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Get Free Quotes Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── For Artists ── */}
      <section className={`${SECTION} bg-cream/50`}>
        <div className={CONTAINER}>
          <div className="mb-12! text-center">
            <p className="mb-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">For Artists</p>
            <h2 className="font-display text-2xl! font-semibold text-ink md:text-3xl!">Grow your client base with Artistora</h2>
            <p className="mx-auto mt-3! max-w-xl! text-sm leading-relaxed text-ink-soft">
              Join Ahmedabad&apos;s trusted artist network. Get discovered by customers actively looking for your services.
            </p>
          </div>

          <div className="grid gap-8! md:grid-cols-3">
            {artistSteps.map((step) => (
              <div key={step.num} className="relative rounded-3xl border border-line bg-white p-7! shadow-soft md:p-8!">
                <div className="mb-5! flex h-14! w-14! items-center justify-center rounded-2xl bg-gradient-to-br from-brand-deep/10 to-brand-deep/5 text-brand-deep">
                  {step.icon}
                </div>
                <span className="mb-2! block font-display text-[0.65rem] font-bold tracking-[0.2em] text-brand-deep/50 uppercase">
                  Step {step.num}
                </span>
                <h3 className="font-display text-lg! font-semibold text-ink">{step.title}</h3>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10! flex flex-wrap justify-center gap-4!">
            <Link
              href="/register"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand-deep to-brand-deep/90 px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Register as Artist
            </Link>
            <Link
              href="/for-artists"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full border border-brand-deep/30 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand-deep hover:bg-brand-deep/5"
            >
              Complete Profile Guide
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Artistora ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Why Artists & Customers Choose Artistora" subtitle="Built for Trust" />
          <div className="mt-10! grid gap-6! sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Verified Artists', text: 'Every artist is reviewed for skill, reliability, and professionalism before going live.' },
              { title: 'Transparent Pricing', text: 'Compare quotes side by side — no hidden charges, no surprise costs.' },
              { title: 'Free to Use', text: 'Customers pay nothing to compare quotes. Artists pay nothing to receive leads.' },
              { title: 'Local & Trusted', text: 'Built for Ahmedabad. We know the venues, the vendors, and the culture.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-white p-6! shadow-soft">
                <h3 className="font-display text-base! font-semibold text-ink">{item.title}</h3>
                <p className="mt-2! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${SECTION} bg-coal`}>
        <div className={`${CONTAINER} text-center`}>
          <h2 className="font-display text-2xl! font-semibold text-white md:text-3xl!">Ready to get started?</h2>
          <p className="mx-auto mt-3! max-w-lg! text-sm leading-relaxed text-cream/60">
            Join hundreds of customers and artists in Ahmedabad who trust Artistora for their events.
          </p>
          <div className="mt-8! flex flex-wrap justify-center gap-4!">
            <Link
              href="/get-quote"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Get Free Quotes
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full border border-cream/30 bg-transparent px-7! py-3! text-sm font-semibold text-cream transition-colors duration-200 hover:border-cream/60 hover:bg-white/10"
            >
              Join as Artist
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
