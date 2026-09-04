import Link from 'next/link'

const BOOKING_URL = '/get-quote'

const popularBookings = [
  { label: 'Artists', to: '/services' },
  { label: 'Photographers', to: '/artists' },
  { label: 'Makeup Artists', to: '/artists' },
  { label: 'Decor & Planning', to: '/artists' },
]

const trustLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Booking Policy', to: '/booking-policy' },
]

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-gold"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-coal text-cream/80">
      <div className="mx-auto max-w-6xl px-4! pb-8! pt-14! md:px-6!">
        {/* Top CTA card */}
        <div className="relative mb-14! overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-brand-deep px-6! py-10! text-center shadow-lift md:px-12! md:text-left">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative flex flex-col items-center justify-between gap-8! md:flex-row">
            <div className="max-w-xl!">
              <p className="mb-2! text-[0.7rem] font-semibold tracking-[0.3em] text-cream/70 uppercase">
                Book Verified Artists
              </p>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-3xl!">
                Verified artists for weddings, events, and celebrations.
              </h2>
            </div>
            <div className="flex flex-col gap-3! sm:flex-row">
              <a
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-cream px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                href={BOOKING_URL}
              >
                Get Quote
              </a>
              <a
                className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-cream/40 px-7! py-3! text-sm font-semibold text-cream transition-colors duration-200 hover:border-cream/70 hover:bg-white/10"
                href="https://wa.me/917405387720"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat On WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Link grid */}
        <div className="grid grid-cols-1 gap-10! md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <img
              src="/artistora/logo-full-white.png"
              alt="Artistora"
              width={480}
              height={293}
              className="mb-4! h-auto w-44! rounded-lg"
            />
            <p className="mt-2! max-w-xs! text-sm leading-relaxed text-cream/55">
              India&apos;s curated artist marketplace — discover, compare, and book verified photography, makeup, decor, and event artists for every celebration.
            </p>
            <Link
              href="/subscription"
              className="mt-4! inline-flex items-center gap-2! text-sm font-semibold text-cream/75 transition-colors hover:text-white"
            >
              Artist plans &amp; visibility <ArrowIcon />
            </Link>
          </div>

          {/* Popular Bookings */}
          <nav aria-label="Popular bookings">
            <p className="mb-4! text-[0.68rem] font-semibold tracking-[0.24em] text-gold uppercase">
              Popular Bookings
            </p>
            <ul className="flex flex-col gap-2.5!">
              {popularBookings.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <Link
                    href={item.to}
                    className="group inline-flex items-center gap-2! text-sm text-cream/65 transition-colors duration-200 hover:text-cream"
                  >
                    <ArrowIcon />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Policies */}
          <nav aria-label="Trust and policies">
            <p className="mb-4! text-[0.68rem] font-semibold tracking-[0.24em] text-gold uppercase">
              Trust &amp; Policies
            </p>
            <ul className="flex flex-col gap-2.5!">
              {trustLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    href={item.to}
                    className="group inline-flex items-center gap-2! text-sm text-cream/65 transition-colors duration-200 hover:text-cream"
                  >
                    <ArrowIcon />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <nav aria-label="Quick contact">
            <p className="mb-4! text-[0.68rem] font-semibold tracking-[0.24em] text-gold uppercase">
              Quick Contact
            </p>
            <ul className="flex flex-col gap-3.5!">
              <li>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C%20Gujarat%2C%20India"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3! text-sm text-cream/65 transition-colors duration-200 hover:text-cream"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-gold">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Ahmedabad, Gujarat, India</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+917405387720"
                  className="flex items-center gap-3! text-sm text-cream/65 transition-colors duration-200 hover:text-cream"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-gold">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>+91 7405387720</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@artistora.com"
                  className="flex items-center gap-3! text-sm text-cream/65 transition-colors duration-200 hover:text-cream"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-gold">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                  <span className="break-all">hello@artistora.com</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream/10 py-5!">
        <p className="mx-auto max-w-6xl px-4! text-center text-xs text-cream/40 md:px-6!">
          &copy; {year} Artistora. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
