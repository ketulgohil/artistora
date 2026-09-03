import 'server-only'

import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'
import { getSiteSettings } from '@/lib/payload'

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

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

export default async function HomeServiceMehndiPage() {
  const settings = (await getSiteSettings()) as any

  const businessName = settings.businessName || 'Artistora'
  const bookingUrl = '/book'
  const phone = settings.phone || '+91 7405387720'
  const whatsappNumber = settings.whatsappNumber || '917405387720'

  const coverageAreas = [
    'Ghatlodiya',
    'Gota',
    'Sola',
    'Jagatpur',
    'Ranip',
    'Vandematram',
    'Akhbarnagar',
    'Bodakdev',
    'Thaltej',
    'SG Highway',
    'Bopal',
  ]

  const howItWorks = [
    {
      step: '1',
      title: 'Share Your Details',
      text: 'Tell us your event date, occasion (bridal, engagement, baby shower, or family function), and your location in Ahmedabad.',
    },
    {
      step: '2',
      title: 'Discuss Design & Coverage',
      text: 'We talk through the mehndi style, coverage level, number of people, and any special preferences you have in mind.',
    },
    {
      step: '3',
      title: 'Confirm Your Booking',
      text: 'Once the date, timing, and pricing are finalised, a booking advance secures your slot. We confirm everything in writing.',
    },
    {
      step: '4',
      title: 'We Come To You',
      text: 'The artist arrives at your home or venue on the scheduled day with all materials. Relax and enjoy your mehndi session.',
    },
  ]

  return (
    <>
      {/* ── Page Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-light/25 blur-3xl"
        />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <div className="grid items-center gap-12! lg:grid-cols-2">
            {/* Copy */}
            <div>
              <Eyebrow>Bringing Mehndi To Your Doorstep</Eyebrow>
              <h1 className="font-display text-4xl! leading-[1.15] font-semibold text-ink md:text-5xl!">
                Home Service Mehndi in Ahmedabad
              </h1>
              <h2 className="font-display mt-5! max-w-xl! text-xl! leading-snug font-medium text-brand-deep italic md:text-[1.4rem]!">
                Home service mehndi across Ahmedabad for bridal and event celebrations.
              </h2>
              <p className="mt-5! text-[0.95rem] leading-relaxed text-ink-soft">
                {businessName} connects you with verified artists who provide home service mehndi across Ahmedabad for clients who prefer
                the comfort and convenience of getting mehndi done at their own location. Whether it&apos;s
                a bridal booking, an engagement ceremony, a baby shower, or a family function, an artist
                travels to your venue with all the necessary materials and setup.
              </p>
              <p className="mt-7! flex flex-wrap items-center gap-x-3! gap-y-2! text-sm">
                <Link
                  href="/bridal-mehndi"
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                >
                  Explore Bridal Mehndi
                </Link>
                <span aria-hidden="true" className="text-line">/</span>
                <Link
                  href="/contact"
                  className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
                >
                  Check Availability
                </Link>
              </p>
            </div>

            {/* Quick cards */}
            <div>
              <p className="mb-5! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
                Professional Mehndi At Your Location
              </p>
              <div className="grid grid-cols-1 gap-4! sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white p-5! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <strong className="block text-[0.95rem]! font-bold text-brand-deep">
                    Bridal Home Service
                  </strong>
                  <span className="mt-1.5! block text-[0.85rem] leading-snug text-ink-muted">
                    Full bridal mehndi at your venue with premium detailing
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <strong className="block text-[0.95rem]! font-bold text-brand-deep">
                    Event Bookings
                  </strong>
                  <span className="mt-1.5! block text-[0.85rem] leading-snug text-ink-muted">
                    Engagement, baby shower, and family function mehndi sessions
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <strong className="block text-[0.95rem]! font-bold text-brand-deep">
                    Group Sessions
                  </strong>
                  <span className="mt-1.5! block text-[0.85rem] leading-snug text-ink-muted">
                    Bride, bridesmaids, family, and guests all in one session
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <strong className="block text-[0.95rem]! font-bold text-brand-deep">
                    Quick Setup
                  </strong>
                  <span className="mt-1.5! block text-[0.85rem] leading-snug text-ink-muted">
                    Arrive, set up, and start. Minimal disruption to your event flow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coverage Areas ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Coverage Areas in Ahmedabad" subtitle="Where We Serve" />
          <p className="mx-auto mb-10! max-w-3xl! text-center text-[0.95rem] leading-relaxed text-ink-soft">
            Home service is available across Ahmedabad. Below are the areas we regularly serve.
            For locations outside these areas, please inquire and we&apos;ll confirm availability along with any travel arrangements.
          </p>
          <div className="grid grid-cols-2 gap-3! sm:grid-cols-3 md:grid-cols-4 md:gap-4!">
            {coverageAreas.map((area) => (
              <div
                key={area}
                className="flex cursor-default items-center gap-3! rounded-2xl border border-line bg-white px-4! py-3.5! shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-lift"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span className="text-[0.92rem] leading-tight font-semibold text-ink">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What To Expect / Perfect For ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="grid items-start gap-6! md:grid-cols-2">
            <article className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <Eyebrow>What To Expect</Eyebrow>
              <h3 className="font-display text-lg! leading-snug font-bold text-ink">
                A smooth, comfortable mehndi experience at your venue.
              </h3>
              <ul className="mt-5! flex flex-col gap-3!">
                {[
                  'The artist arrives at your venue at the scheduled time with all materials',
                  'Setup is quick and practical, designed around the available space',
                  'Timing is planned based on the number of people and design complexity',
                  'Design preferences can be discussed in advance for a smooth session',
                  'Clean-up is handled by the artist after the session is complete',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5! text-[0.92rem] leading-relaxed text-ink-soft">
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
                      className="mt-1! shrink-0 text-gold"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <Eyebrow>Perfect For</Eyebrow>
              <h3 className="font-display text-lg! leading-snug font-bold text-ink">
                Any occasion that deserves beautiful mehndi.
              </h3>
              <ul className="mt-5! flex flex-col gap-3!">
                {[
                  'Bridal mehndi at home or wedding venue',
                  'Engagement and sangeet ceremonies',
                  'Baby showers and family gatherings',
                  'Festival mehndi for Karwa Chauth, Diwali, Teej, and more',
                  'Multi-person group bookings for weddings and events',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5! text-[0.92rem] leading-relaxed text-ink-soft">
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
                      className="mt-1! shrink-0 text-gold"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="How It Works" subtitle="Four Simple Steps" />
          <div className="grid grid-cols-1 gap-6! md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <article
                key={item.step}
                className="flex flex-col items-center rounded-3xl border border-line bg-white p-7! text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 font-display text-lg! font-bold text-brand-deep">
                  {item.step}
                </span>
                <h3 className="mt-4! text-lg! leading-snug font-bold text-ink">{item.title}</h3>
                <p className="mt-2! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Book CTA + explore links ── */}
      <section className="pb-16! md:pb-24!">
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-dark to-brand-deep px-6! py-12! text-center shadow-lift md:px-12! md:py-14!">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold/20 blur-2xl"
            />
            <div className="relative mx-auto max-w-2xl!">
              <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-3xl!">
                Ready To Book Your Home Service Mehndi?
              </h2>
              <p className="mt-4! text-[0.95rem] leading-relaxed text-cream/70">
                Share your event date, location in Ahmedabad, and design preferences. We&apos;ll
                confirm availability and provide a custom quote based on your requirements.
              </p>
              <div className="mt-8! flex flex-wrap items-center justify-center gap-3!">
                {bookingUrl && (
                  <a
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-white px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                    href={bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Book A Session
                  </a>
                )}
                <a
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-white/40 px-7! py-3! text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Ask On WhatsApp
                </a>
                <Link
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/40 px-7! py-3! text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                  href="/contact"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-12! max-w-2xl! rounded-3xl border border-line bg-cream-deep px-6! py-9! text-center md:px-10!">
            <p className="mb-1! text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">
              Also Explore Our Other Services
            </p>
            <p className="mt-4! flex flex-wrap items-center justify-center gap-x-3! gap-y-2! text-sm">
              <Link
                href="/bridal-mehndi"
                className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
              >
                Bridal Mehndi in Ahmedabad
              </Link>
              <span aria-hidden="true" className="text-line">/</span>
              <Link
                href="/classes"
                className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
              >
                Mehndi Classes in Ahmedabad
              </Link>
              <span aria-hidden="true" className="text-line">/</span>
              <Link
                href="/portfolio"
                className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand"
              >
                View Portfolio
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
