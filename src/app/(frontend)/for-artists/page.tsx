import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'

export const metadata = {
  title: 'For Artists — Join Ahmedabad\'s Trusted Artist Network',
  description:
    'Register on Artistora, set up your profile, and start receiving booking leads from customers in Ahmedabad. Free to join, no hidden fees.',
  alternates: {
    canonical: 'https://www.artistora.com/for-artists',
  },
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const profileSteps = [
  {
    num: '01',
    title: 'Add Your Profile Photo',
    tip: 'A professional photo builds trust. Use a clear headshot or a photo of your work — not a logo or group picture.',
    fields: ['Upload a square photo (400x400px ideal)', 'Face or work sample should be clearly visible', 'Avoid blurry or dark images'],
  },
  {
    num: '02',
    title: 'Write Your Bio',
    tip: 'Tell customers what makes you unique. Mention your specialty, experience, and what clients can expect.',
    fields: ['Start with what you do (e.g. "Bridal mehndi artist with 8+ years")', 'Mention your style or specialty', 'Add what makes you different from others', 'Keep it 2-4 sentences — concise and confident'],
  },
  {
    num: '03',
    title: 'Set Your Contact Details',
    tip: 'Customers need to reach you. Add your phone and WhatsApp number separately — WhatsApp gets 5x more responses.',
    fields: ['Phone number with country code (+91)', 'WhatsApp number (if different from phone)', 'Email address for notifications'],
  },
  {
    num: '04',
    title: 'Choose Your Services',
    tip: 'Select all services you offer. This determines which booking requests you receive.',
    fields: ['Photographers — weddings, events, portraits', 'Makeup Artists — bridal, party, editorial', 'Decor & Event Planners — stage, floral, themed', 'Mehndi Artists — bridal, Arabic, Indo-Western'],
  },
  {
    num: '05',
    title: 'Set Your Pricing',
    tip: 'Transparent pricing helps customers decide faster. Set your starting price and pricing model.',
    fields: ['Package / Fixed Rate — one price for the full service', 'Hourly Rate — charge per hour of work', 'Per Person / Guest — charge per guest count', 'Custom Quote Only — price on request'],
  },
  {
    num: '06',
    title: 'Upload Portfolio Images',
    tip: 'Your portfolio is your showcase. Upload 5-10 of your best work samples.',
    fields: ['Upload high-quality images (at least 800px wide)', 'Show variety — different styles, occasions, colors', 'Add captions describing each work sample', 'Only upload work you have permission to showcase'],
  },
]

const faqItems = [
  {
    q: 'Is it really free to join?',
    a: 'Yes. Registering, creating your profile, and receiving booking leads is completely free. We charge zero commission on bookings.',
  },
  {
    q: 'How do I get more booking requests?',
    a: 'Complete your profile (100%), upload portfolio images, respond to leads quickly, and maintain a good rating. Verified artists get 3x more visibility.',
  },
  {
    q: 'What happens after a customer selects me?',
    a: 'You\'ll receive a confirmation with all event details. Coordinate directly with the customer. After the event, the customer leaves a review.',
  },
  {
    q: 'Can I set my own prices?',
    a: 'Absolutely. You control your pricing completely. Set a starting price, choose your pricing model, and adjust as needed.',
  },
  {
    q: 'How do I become a verified artist?',
    a: 'After registering, our team reviews your profile — portfolio, documents, and experience. Verification takes 24-48 hours and gives you a trust badge.',
  },
]

export default function ForArtistsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-deep/10 blur-3xl" />
        <div className={`relative ${CONTAINER} py-16! md:py-24!`}>
          <div className="mx-auto max-w-3xl! text-center">
            <p className="mb-4! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand-deep">
              <span aria-hidden="true" className="h-px w-8 bg-brand-deep/50" />
              Artist Resources
              <span aria-hidden="true" className="h-px w-8 bg-brand-deep/50" />
            </p>
            <h1 className="font-display text-[2.3rem]! leading-[1.12] font-semibold text-ink md:text-[3.2rem]!">
              Build Your Artist Profile on Artistora
            </h1>
            <p className="mt-5! text-[1.05rem] leading-relaxed text-ink-soft">
              Your profile is your storefront. A complete, professional profile gets 3x more booking requests from customers in Ahmedabad.
            </p>
            <div className="mt-8! flex flex-wrap justify-center gap-4!">
              <Link
                href="/register"
                className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand-deep to-brand-deep/90 px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                Register as Artist
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full border border-brand-deep/30 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand-deep hover:bg-brand-deep/5"
              >
                Go to Dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Profile Setup Guide ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Complete Profile Setup Guide" subtitle="Step by Step" />
          <p className="mx-auto mb-12! max-w-2xl! text-center text-sm leading-relaxed text-ink-soft">
            Follow these steps to set up a profile that attracts customers. Each section directly impacts how often you appear in search results and how many booking requests you receive.
          </p>

          <div className="space-y-6!">
            {profileSteps.map((step) => (
              <div key={step.num} className="rounded-3xl border border-line bg-white p-6! shadow-soft md:p-8!">
                <div className="flex flex-col gap-6! md:flex-row md:items-start md:gap-8!">
                  <div className="flex h-12! w-12! shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-deep to-brand-deep/80 font-display text-lg! font-bold text-white">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg! font-semibold text-ink">{step.title}</h3>
                    <p className="mt-2! text-sm leading-relaxed text-brand font-medium">{step.tip}</p>
                    <ul className="mt-4! space-y-2!">
                      {step.fields.map((field, i) => (
                        <li key={i} className="flex items-start gap-2.5! text-sm text-ink-soft">
                          <svg className="mt-0.5! shrink-0 text-green" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10! text-center">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Set Up Your Profile Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tips for Success ── */}
      <section className={`${SECTION} bg-cream/50`}>
        <div className={CONTAINER}>
          <SectionHeading title="Tips to Get More Bookings" subtitle="Pro Tips" />
          <div className="mt-10! grid gap-6! sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Respond Within 1 Hour',
                text: 'Customers book the first artist who responds. Fast response time = more bookings. Turn on notifications.',
              },
              {
                title: 'Upload 10+ Portfolio Images',
                text: 'Profiles with 10+ images get 5x more views. Show variety — different styles, colors, and occasions.',
              },
              {
                title: 'Keep Your Calendar Updated',
                text: 'Block dates when you\'re unavailable. This prevents double-bookings and builds trust with customers.',
              },
              {
                title: 'Ask for Reviews',
                text: 'After every completed booking, ask the customer to leave a review. Higher ratings = higher search ranking.',
              },
              {
                title: 'Set Competitive Pricing',
                text: 'Check what other artists in your category charge. Price competitively when starting out, then adjust as demand grows.',
              },
              {
                title: 'Get Verified',
                text: 'Verified artists get a trust badge and appear higher in search results. Complete your profile to qualify.',
              },
            ].map((tip) => (
              <div key={tip.title} className="rounded-2xl border border-line bg-white p-6! shadow-soft">
                <h3 className="font-display text-base! font-semibold text-ink">{tip.title}</h3>
                <p className="mt-2! text-sm leading-relaxed text-ink-soft">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Frequently Asked Questions" subtitle="Artist FAQ" />
          <div className="mx-auto mt-10! max-w-3xl! space-y-4!">
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-2xl border border-line bg-white p-6! shadow-soft">
                <summary className="flex cursor-pointer items-center justify-between gap-4! font-display text-base! font-semibold text-ink">
                  {item.q}
                  <svg className="h-5! w-5! shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${SECTION} bg-coal`}>
        <div className={`${CONTAINER} text-center`}>
          <h2 className="font-display text-2xl! font-semibold text-white md:text-3xl!">Start receiving booking requests today</h2>
          <p className="mx-auto mt-3! max-w-lg! text-sm leading-relaxed text-cream/60">
            Join Ahmedabad&apos;s growing network of verified artists. It&apos;s free to register and start receiving leads.
          </p>
          <div className="mt-8!">
            <Link
              href="/register"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Register as Artist — Free
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
