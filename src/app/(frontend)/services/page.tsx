import Link from 'next/link'
import { getServices, getSiteSettings, getFAQs, mediaUrl, mediaDimensions } from '@/lib/payload'
import { mediaFileUrl } from '@/lib/media-url'
import SectionHeading from '@/components/SectionHeading'

function extractLexicalText(richText: any): string {
  if (!richText || !richText.root) return ''
  const paragraphs: string[] = []
  for (const child of richText.root.children || []) {
    if (child.children) {
      const text = child.children.map((c: any) => c.text || '').join('')
      paragraphs.push(text)
    }
  }
  return paragraphs.join('\n')
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const BTN_PRIMARY =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
const BTN_OUTLINE =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-brand/40 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10'
const BTN_LIGHT =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-white px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'

function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'light' }) {
  return (
    <p
      className={`mb-4! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] uppercase ${
        tone === 'light' ? 'text-gold' : 'text-brand'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-px w-8 ${tone === 'light' ? 'bg-gold/60' : 'bg-brand/50'}`}
      />
      {children}
    </p>
  )
}

function GoldCheck({ className = '' }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 text-gold ${className}`}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function Star({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      className={filled ? 'h-3.5 w-3.5 text-gold' : 'h-3.5 w-3.5 text-line'}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

const serviceTags = [
  'Mehndi, photography, makeup, and decor artists',
  'Wedding, event, and occasion bookings',
  'Home service across Ahmedabad',
  'Portfolio showcases',
]

const serviceImages: Record<string, string> = {
  'Photographers': '/services/photographers.jpg',
  'Makeup Artists': '/services/makeup.jpg',
  'Decor & Event Planners': '/services/decor.jpg',
  'Mehndi Artists': '/api/media/file/Bridal.webp',
  'Bridal Mehndi': '/api/media/file/Bridal.webp',
  'Engagement Mehndi': '/api/media/file/Bridal.webp',
  'Baby Shower Mehndi': '/api/media/file/Bridal.webp',
}

// Filter to show only main service categories
const MAIN_SERVICES = ['Photographers', 'Makeup Artists', 'Decor & Event Planners', 'Mehndi Artists']

const promisePoints = [
  {
    title: 'Verified Professionals',
    text: 'Every artist on Artistora is vetted for quality, reliability, and professionalism — so you book with confidence.',
  },
  {
    title: 'Transparent Pricing',
    text: 'Compare quotes from multiple artists, see exactly what you are paying for, and choose what fits your budget.',
  },
  {
    title: 'Occasion Fit',
    text: 'Whether it is a wedding, corporate event, birthday, or festival — find the right artist matched to your event style and scale.',
  },
]

const addOns = [
  {
    title: 'Multi-Service Packages',
    text: 'Bundle mehndi, makeup, photography, and decor services for a seamless event experience with coordinated scheduling.',
  },
  {
    title: 'Multi-Artist Bookings',
    text: 'Book for large groups, bridal parties, or corporate events with multiple artists and consistent quality across the board.',
  },
  {
    title: 'Custom Requirements',
    text: 'From themed events to specific cultural traditions — discuss your vision and get tailored artist recommendations.',
  },
]

const serviceReviews = [
  {
    name: 'Urvika Parekh',
    source: 'Google Review',
    quote:
      'Artistora made it easy to find and book the right artist for our wedding. Professional, reliable, and a pleasure to work with.',
  },
  {
    name: 'Rutva Krunal Prajapati',
    source: 'Google Review',
    quote:
      'We found amazing artists for our event through Artistora. The quoting process was transparent and the service was excellent.',
  },
]

const serviceAreaNotes = [
  'Wedding and event bookings across Ahmedabad and nearby areas',
  'Corporate events, parties, and family functions with flexible scheduling',
  'Home service, venue service, and studio-based bookings available',
]

const planningPoints = [
  'Choose the event type and preferred artist category before the call.',
  'Decide whether you need one artist, a team, or multiple services.',
  'Share the venue and schedule so arrival time and setup can be planned.',
  'Keep inspiration references ready if you want a specific style or theme.',
]

const bookingSteps = [
  'Share your date, occasion, and location.',
  'Discuss the artist category and style you need.',
  'Compare quotes and confirm your booking.',
  'Enjoy the service on your special day.',
]

const fallbackFaqs = [
  {
    question: 'What artist services can be booked from this page?',
    answer:
      'You can inquire about mehndi artists, photographers, makeup artists, decorators, musicians, and other event professionals through this page.',
  },
  {
    question: 'Do you provide service outside one specific area?',
    answer:
      'Yes. Artistora artists accept bookings across Ahmedabad, including neighborhoods like Ghatlodiya, Gota, and Sola, with timing planned around the event and number of people.',
  },
  {
    question: 'What details help before confirming a booking?',
    answer:
      'It is best to share the date, occasion, area in Ahmedabad, approximate number of people, and the style or coverage level you want so the service can be planned properly.',
  },
]

export default async function ServicesPage() {
  const [services, settings, faqs] = await Promise.all([
    getServices(),
    getSiteSettings(),
    getFAQs(),
  ])

  const bookingUrl = '/book'

  return (
    <>
      {/* ── Page Intro: Services + editorial hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl"
        />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <SectionHeading title="Services" subtitle="Crafted For Every Celebration" />

          <div className="grid items-center gap-12! lg:grid-cols-[1.25fr_0.9fr] lg:gap-16!">
            <div>
              <Eyebrow>Artist Services In Ahmedabad</Eyebrow>
              <h1 className="font-display text-[2.05rem]! leading-[1.18] font-semibold text-ink md:text-[2.7rem]!">
                Mehndi, photography, makeup, decor, and more — for every celebration.
              </h1>
              <p className="mt-5! text-[0.95rem] leading-relaxed text-ink-soft">
                Artistora connects you with verified artists across
                Ahmedabad — mehndi specialists, photographers, makeup artists,
                decorators, musicians, and event planners. Compare free quotes,
                browse portfolios, and book the right artist for your event.
              </p>
              <div className="mt-5! flex flex-wrap items-center gap-x-2.5! gap-y-2! text-sm">
                <Link
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                  href="/artists"
                >
                  Browse all artists
                </Link>
                <span aria-hidden="true" className="text-line">/</span>
                <Link
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                  href="/get-quote"
                >
                  Get a free quote
                </Link>
              </div>
              <div className="mt-7! flex flex-wrap gap-2.5!">
                {serviceTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2! rounded-full border border-line bg-white px-4! py-2! text-sm text-ink-soft shadow-soft"
                  >
                    <GoldCheck />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5!">
              <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-70"
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                  <PinIcon />
                </span>
                <strong className="font-display mt-5! block text-[1.25rem]! font-semibold text-ink">
                  Home Service
                </strong>
                <span className="mt-2! block text-sm leading-relaxed text-ink-soft">
                  Home and venue service across Ahmedabad for all event types
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Service Cards (alternating) ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="flex flex-col gap-14! md:gap-20!">
            {(services as any[])
              .filter((service: any) => MAIN_SERVICES.includes(service.title))
              .map((service: any, index: number) => (
              <article
                className="grid items-center gap-10! lg:grid-cols-2 lg:gap-16!"
                key={service.id}
              >
                <div className={`group relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div
                    aria-hidden="true"
                    className="absolute -inset-3 -rotate-1 rounded-[2.4rem] border border-dashed border-gold/40"
                  />
                  <div className="relative overflow-hidden rounded-[2rem] border border-line/60 bg-white p-2! shadow-lift ring-1 ring-line/60">
                    <img
                      src={serviceImages[service.title] || (service.image ? mediaUrl(service.image) : mediaFileUrl('engagement.webp'))}
                      alt={service.title}
                      width={800}
                      height={600}
                      className="aspect-[4/3] w-full rounded-[1.7rem] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <Eyebrow>Signature Service</Eyebrow>
                  <h3 className="font-display text-[1.7rem]! leading-snug font-semibold text-ink md:text-[2rem]!">
                    {service.title}
                  </h3>
                  <p className="mt-3! text-[0.95rem] leading-relaxed text-ink-soft">
                    {service.description}
                  </p>
                  {service.points?.length > 0 && (
                    <ul className="mt-6! flex flex-col gap-3!">
                      {(service.points).map((p: any, i: number) => (
                        <li key={i} className="flex items-start gap-3! text-sm leading-relaxed text-ink-soft">
                          <GoldCheck />
                          <span>{p.point || p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* ── Promise Grid ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="grid gap-6! sm:grid-cols-2 lg:grid-cols-3">
            {promisePoints.map((item) => (
              <article
                className="group relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!"
                key={item.title}
              >
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <Eyebrow>Why It Stands Out</Eyebrow>
                <h3 className="font-display text-[1.3rem]! font-semibold text-ink">{item.title}</h3>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Review Snippet ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="rounded-[2.5rem] border border-line bg-cream-deep/70 p-6! shadow-soft md:p-12!">
            <div className="mb-10! flex flex-wrap items-end justify-between gap-6!">
              <div className="max-w-xl!">
                <Eyebrow>Client Reviews</Eyebrow>
                <h3 className="font-display text-xl! leading-snug font-semibold text-ink md:text-2xl!">
                  What clients say after booking.
                </h3>
                <p className="mt-2! text-sm text-ink-muted">
                  Small details and calm service are what clients notice most.
                </p>
              </div>
              <div className="w-full min-w-[190px] max-w-[240px] rounded-2xl border border-line bg-white px-6! py-5! text-center shadow-soft">
                <div className="flex items-center justify-center gap-1!">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} />
                  ))}
                </div>
                <strong className="font-display mt-2! block text-3xl! font-bold text-brand">5.0</strong>
                <span className="mt-1! block text-xs text-ink-muted">Google rating with 114+ reviews</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5! md:grid-cols-2">
              {serviceReviews.map((review) => (
                <article
                  key={review.name}
                  className="rounded-2xl border border-line bg-white p-6! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="mb-3! flex items-center gap-1! text-gold">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} />
                    ))}
                  </div>
                  <p className="text-[0.92rem] leading-relaxed text-ink-soft italic">
                    {review.quote}
                  </p>
                  <div className="mt-5! border-t border-line pt-4!">
                    <strong className="block text-sm font-bold text-ink">{review.name}</strong>
                    <span className="text-xs text-ink-muted">{review.source}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Split Info: Area + Before You Book ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="grid gap-6! lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <Eyebrow>Ahmedabad Coverage</Eyebrow>
              <h3 className="font-display text-xl! leading-snug font-semibold text-ink">
                Planning support for different event sizes and local areas.
              </h3>
              <ul className="mt-6! flex flex-col gap-3!">
                {serviceAreaNotes.map((item) => (
                  <li key={item} className="flex items-start gap-3! text-sm leading-relaxed text-ink-soft">
                    <GoldCheck />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <Eyebrow>Before You Book</Eyebrow>
              <h3 className="font-display text-xl! leading-snug font-semibold text-ink">
                A little preparation makes the inquiry much faster.
              </h3>
              <ol className="mt-6! flex flex-col gap-3.5!">
                {planningPoints.map((item, i) => (
                  <li key={item} className="flex items-start gap-3! text-sm leading-relaxed text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark text-xs font-bold text-white"
                    >
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── Split Info: Booking Flow + Add-Ons ── */}
          <div className="mt-6! grid gap-6! lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <Eyebrow>How Booking Works</Eyebrow>
              <h3 className="font-display text-xl! leading-snug font-semibold text-ink">
                Simple, direct, and easy to plan.
              </h3>
              <ol className="mt-6! flex flex-col gap-3.5!">
                {bookingSteps.map((step, i) => (
                  <li key={step} className="flex items-start gap-3! text-sm leading-relaxed text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark text-xs font-bold text-white"
                    >
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <Eyebrow>What You Can Also Ask For</Eyebrow>
              <h3 className="font-display text-xl! leading-snug font-semibold text-ink">
                Flexible options for different celebrations.
              </h3>
              <ul className="mt-6! flex flex-col gap-3!">
                {addOns.map((item) => (
                  <li key={item.title} className="flex items-start gap-3! text-sm leading-relaxed text-ink-soft">
                    <GoldCheck />
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Note + FAQ ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl! text-center">
            <p className="mb-3! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-transparent to-brand/60" />
              Booking Details
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-l from-transparent to-brand/60" />
            </p>
            <h3 className="font-display text-xl! leading-snug font-semibold text-ink md:text-2xl!">
              Plan your mehndi booking with the details that matter most.
            </h3>
            <p className="mt-3! text-sm leading-relaxed text-ink-soft">
              Clients often like to confirm service area coverage, booking lead
              time, bridal package preferences, and event requirements before
              finalizing their appointment.
            </p>
          </div>

          <div className="mt-16! md:mt-20!">
            <SectionHeading title="Service FAQs" subtitle="Common Booking Questions" />
            <div className="grid gap-5! md:grid-cols-2 lg:grid-cols-3">
              {(faqs as any[]).length > 0 ? (
                (faqs as any[]).slice(0, 3).map((faq: any) => (
                  <article
                    className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                    key={faq.id}
                  >
                    <span
                      aria-hidden="true"
                      className="mb-4! block h-1 w-9 rounded-full bg-gradient-to-r from-gold to-brand"
                    />
                    <h3 className="text-[1.02rem]! leading-snug font-bold text-ink">{faq.question}</h3>
                    <p className="mt-2.5! text-sm leading-relaxed text-ink-soft">
                      {extractLexicalText(faq.answer)}
                    </p>
                  </article>
                ))
              ) : (
                fallbackFaqs.map((faq) => (
                  <article
                    className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                    key={faq.question}
                  >
                    <span
                      aria-hidden="true"
                      className="mb-4! block h-1 w-9 rounded-full bg-gradient-to-r from-gold to-brand"
                    />
                    <h3 className="text-[1.02rem]! leading-snug font-bold text-ink">{faq.question}</h3>
                    <p className="mt-2.5! text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-coal px-6! py-14! shadow-lift md:px-12! md:py-16!">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl! text-center">
              <h2 className="font-display text-3xl! leading-snug font-semibold text-white md:text-[2.4rem]!">
                Ready to Book Your Session?
              </h2>
              <p className="mt-4! text-sm leading-relaxed text-cream/60 md:text-[0.95rem]">
                Reach out with your date and design preferences.
              </p>
              <div className="mt-8! flex flex-wrap justify-center gap-3!">
                <a className={BTN_LIGHT} href={bookingUrl} target="_blank" rel="noreferrer">
                  Book Your Session
                </a>
                <Link
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-7! py-3! text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/20"
                  href="/portfolio"
                >
                  View Portfolio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
