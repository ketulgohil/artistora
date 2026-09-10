import Link from 'next/link'

export const metadata = {
  title: 'Frequently Asked Questions — Artistora',
  description:
    'Got questions about booking artists in Ahmedabad? Find answers about pricing, booking, cancellation, artist verification, and more on Artistora.',
  alternates: {
    canonical: 'https://www.artistora.com/faq',
  },
}

const CONTAINER = 'mx-auto max-w-3xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const customerFaq = [
  {
    q: 'How does Artistora work?',
    a: 'Share your event details (date, venue, budget, artist type), compare quotes from verified local artists, and choose the one that fits. It\'s that simple — and completely free for customers.',
  },
  {
    q: 'Is it really free to use?',
    a: 'Yes. Customers pay nothing to post event details, receive quotes, or book artists. There are no hidden charges or booking fees.',
  },
  {
    q: 'How quickly will I receive quotes?',
    a: 'Most customers receive 3-5 quotes within a few hours. Popular services like photographers and makeup artists may respond even faster.',
  },
  {
    q: 'Are the artists verified?',
    a: 'Yes. Every artist on Artistora goes through a verification process — we review their portfolio, experience, and reliability before they go live. Verified artists display a trust badge on their profile.',
  },
  {
    q: 'Can I compare quotes from multiple artists?',
    a: 'Absolutely. After submitting your event details, you\'ll receive quotes from multiple artists. Compare pricing, packages, portfolios, and reviews side by side before making a decision.',
  },
  {
    q: 'How do I book an artist?',
    a: 'Submit your event details → receive quotes → select the artist you like → confirm the booking. You\'ll receive a confirmation with all event details and the artist\'s contact information.',
  },
  {
    q: 'What if I need to cancel?',
    a: 'You can cancel a booking from your My Bookings page. Cancellation policies vary by artist and are communicated during the booking confirmation. Check our Booking Policy for details.',
  },
  {
    q: 'Can I leave a review after the event?',
    a: 'Yes. After a booking is completed, you\'ll receive a prompt to leave a review. Your honest feedback helps other customers and helps artists improve.',
  },
  {
    q: 'What areas in Ahmedabad do you cover?',
    a: 'We cover all of Ahmedabad — Satellite, Vastrapur, Bopal, Prahlad Nagar, Thaltej, Gota, South Bopal, Science City, Shela, Nikol, and 10+ more areas. Check our Areas page for the full list.',
  },
  {
    q: 'What types of events can I book artists for?',
    a: 'Weddings, engagements, birthdays, corporate events, baby showers, festivals, family functions, and more. If you\'re celebrating, we have an artist for it.',
  },
]

const artistFaq = [
  {
    q: 'How do I register as an artist?',
    a: 'Click "Register as Artist" and fill in your details — name, phone, bio, services, and portfolio. Your profile will be reviewed by our team within 24-48 hours.',
  },
  {
    q: 'Is there any registration fee?',
    a: 'No. Registering, creating your profile, and receiving booking leads is completely free. We charge zero commission on bookings.',
  },
  {
    q: 'How do I get more booking requests?',
    a: 'Complete your profile (100%), upload 10+ portfolio images, respond to leads quickly, maintain a good rating, and get verified. Verified artists with complete profiles get 3x more requests.',
  },
  {
    q: 'How does the verification process work?',
    a: 'After registering, our team reviews your portfolio, experience, and profile completeness. Verification takes 24-48 hours and gives you a trust badge that increases customer confidence.',
  },
  {
    q: 'Can I set my own prices?',
    a: 'Yes. You control your pricing completely. Choose from package pricing, hourly rates, per-person rates, or custom quotes. Adjust anytime from your dashboard.',
  },
  {
    q: 'How do I receive booking requests?',
    a: 'When a customer submits event details matching your services, you\'ll receive a notification with all the information — date, venue, budget, and requirements. Respond with your best quote.',
  },
  {
    q: 'What happens after a customer selects my quote?',
    a: 'You\'ll receive a confirmation with event details. Coordinate directly with the customer. After the event, the customer leaves a review on your profile.',
  },
  {
    q: 'How do I update my profile or availability?',
    a: 'Log in to your dashboard to update your profile, portfolio, pricing, and blocked dates anytime. Keep your calendar updated to prevent double-bookings.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [...customerFaq, ...artistFaq].map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-line bg-white p-6! shadow-soft">
      <summary className="flex cursor-pointer items-center justify-between gap-4! font-display text-base! font-semibold text-ink">
        {question}
        <svg className="h-5! w-5! shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <p className="mt-3! text-sm leading-relaxed text-ink-soft">{answer}</p>
    </details>
  )
}

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />
        <div className={`relative ${CONTAINER} py-16! md:py-24!`}>
          <div className="mx-auto max-w-3xl! text-center">
            <p className="mb-4! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
              Help Centre
              <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
            </p>
            <h1 className="font-display text-[2.3rem]! leading-[1.12] font-semibold text-ink md:text-[3.2rem]!">
              Frequently Asked Questions
            </h1>
            <p className="mt-5! text-[1.05rem] leading-relaxed text-ink-soft">
              Everything you need to know about booking artists, pricing, verification, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Customer FAQ */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="mb-10! text-center">
            <p className="mb-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">For Customers</p>
            <h2 className="font-display text-2xl! font-semibold text-ink">Booking &amp; Event Questions</h2>
          </div>
          <div className="space-y-4!">
            {customerFaq.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Artist FAQ */}
      <section className={`${SECTION} bg-cream/50`}>
        <div className={CONTAINER}>
          <div className="mb-10! text-center">
            <p className="mb-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">For Artists</p>
            <h2 className="font-display text-2xl! font-semibold text-ink">Registration &amp; Profile Questions</h2>
          </div>
          <div className="space-y-4!">
            {artistFaq.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className={SECTION}>
        <div className={`${CONTAINER} text-center`}>
          <h2 className="font-display text-2xl! font-semibold text-ink">Still have questions?</h2>
          <p className="mx-auto mt-3! max-w-lg! text-sm leading-relaxed text-ink-soft">
            Can&apos;t find the answer you&apos;re looking for? Reach out to our team — we&apos;re happy to help.
          </p>
          <div className="mt-8! flex flex-wrap justify-center gap-4!">
            <Link
              href="/contact"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Contact Us
            </Link>
            <a
              href="https://wa.me/917405387720"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12! cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/30 bg-transparent px-7! py-3! text-sm font-semibold text-brand transition-colors duration-200 hover:border-brand hover:bg-brand/5"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
