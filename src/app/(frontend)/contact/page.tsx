'use server'

import SectionHeading from '@/components/SectionHeading'
import { getSiteSettings } from '@/lib/payload'

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4l-10 8L2 4" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ArrowUpRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

function Eyebrow({
  children,
  center = false,
  tone = 'brand',
  className = '',
}: {
  children: React.ReactNode
  center?: boolean
  tone?: 'brand' | 'light'
  className?: string
}) {
  const dash = tone === 'light' ? 'bg-gold/60' : 'bg-brand/50'
  return (
    <p
      className={`flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] uppercase ${
        center ? 'justify-center' : ''
      } ${tone === 'light' ? 'text-gold' : 'text-brand'} ${className}`}
    >
      <span aria-hidden="true" className={`h-px w-8 shrink-0 ${dash}`} />
      {children}
      {center && <span aria-hidden="true" className={`h-px w-8 shrink-0 ${dash}`} />}
    </p>
  )
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const BTN_PRIMARY =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
const BTN_OUTLINE =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/40 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10'
const BTN_LIGHT =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-cream px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
const BTN_GHOST =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-cream/40 px-7! py-3! text-sm font-semibold text-cream transition-colors duration-200 hover:border-cream/70 hover:bg-white/10'

const CARD =
  'rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!'

export default async function ContactPage() {
  const settings = (await getSiteSettings()) as any

  const businessName = settings.businessName || 'Shiva Mehndi Art'
  const phone = settings.phone || '+91 8469662012'
  const email = settings.email || ''
  const address = settings.address || ''
  const bookingUrl = settings.bookingFormUrl || ''
  const whatsappNumber = settings.whatsappNumber || '918469662012'
  const googleMapUrl = settings.googleMapUrl || ''

  const mapSrc = googleMapUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29388.253119139237!2d72.538!3d23.036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84f6b1f7c1b7%3A0x1e8f8f8f8f8f8f8f!2sChandlodiya%2C%20Ahmedabad!5e0!3m2!1sen!2sin!4v1'

  const bookingInfo = [
    'Your event date',
    'Location in Ahmedabad',
    'Occasion type',
    'Approximate number of people',
    'Preferred mehndi style',
  ]

  return (
    <>
      {/* ── Intro + contact details ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Contact" subtitle="Book Your Mehndi Session" />

          <div className="grid gap-8! lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Eyebrow>Book Mehndi Artist In Ahmedabad</Eyebrow>
              <p className="mt-1! text-xl! font-semibold text-ink md:text-[1.35rem]!">
                Reach out for bridal mehndi, festive bookings, events, and classes.
              </p>
              <p className="mt-4! max-w-xl! text-sm leading-relaxed text-ink-soft md:text-[0.95rem]">
                Whether you are planning a wedding, engagement, baby shower, family event, or want to know more about mehndi classes, Shiva Mehndi Art makes it easy to book a professional mehndi artist in Ahmedabad through direct call, WhatsApp, or the booking form. The studio is based in Chandlodiya and regularly serves nearby areas like Gota, Ghatlodiya, Sola, and Science City along with home service across Ahmedabad.
              </p>

              {bookingUrl && (
                <div className="mt-6! rounded-2xl border border-brand/15 bg-brand/5 px-5! py-4!">
                  <strong className="text-sm font-bold text-ink">For a faster reply, share:</strong>
                  <span className="mt-1! block text-sm text-ink-muted">{bookingInfo.join(', ')}.</span>
                </div>
              )}

              <div className="mt-7! space-y-3!">
                <div className="flex items-center gap-4! rounded-2xl border border-line bg-white p-4! shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                    <PhoneIcon />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.68rem] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                      Phone
                    </span>
                    <a
                      href={`tel:${phone}`}
                      className="block truncate text-[0.95rem] font-semibold text-brand-deep transition-colors duration-200 hover:text-brand"
                    >
                      {phone}
                    </a>
                  </span>
                </div>

                {email && (
                  <div className="flex items-center gap-4! rounded-2xl border border-line bg-white p-4! shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                      <MailIcon />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.68rem] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        Email
                      </span>
                      <a
                        href={`mailto:${email}`}
                        className="block truncate text-[0.95rem] font-semibold text-brand-deep transition-colors duration-200 hover:text-brand"
                      >
                        {email}
                      </a>
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4! rounded-2xl border border-line bg-white p-4! shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                    <MapPinIcon />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.68rem] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                      Address
                    </span>
                    <span className="block text-[0.95rem] leading-snug font-medium text-ink-soft">
                      {address}
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-8! flex flex-wrap gap-3!">
                {bookingUrl && (
                  <a className={BTN_PRIMARY} href={bookingUrl} target="_blank" rel="noreferrer">
                    Open Booking Form
                    <ArrowUpRightIcon />
                  </a>
                )}
                <a className={BTN_OUTLINE} href={`tel:${phone}`}>
                  Call Directly
                </a>
              </div>
            </div>

            <div className="space-y-5!">
              <article className={CARD}>
                <Eyebrow>Service Reach</Eyebrow>
                <h3 className="mt-2! font-display text-xl! font-semibold text-ink">
                  Home service available across Ahmedabad.
                </h3>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">
                  Bookings can be discussed for bridal sessions, engagement functions, baby showers, festive appointments, and other special events in Chandlodiya, Gota, Ghatlodiya, Sola, Science City, and other areas with home service across Ahmedabad.
                </p>
              </article>
              <article className={CARD}>
                <Eyebrow>Also Available</Eyebrow>
                <h3 className="mt-2! font-display text-xl! font-semibold text-ink">
                  Offline mehndi classes for learners.
                </h3>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">
                  If you are interested in learning mehndi, you can also use this page to ask about class details and guidance for offline classes in Chandlodiya, Ahmedabad, especially if you are looking for a nearby class from Gota, Ghatlodiya, Sola, or Science City.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking form ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="text-center">
            <Eyebrow center>Booking Form</Eyebrow>
            <h2 className="font-display mt-2! text-2xl! font-semibold text-ink md:text-[2rem]!">
              Send your inquiry directly from the website.
            </h2>
            <p className="mx-auto mt-3! max-w-2xl! text-sm leading-relaxed text-ink-soft">
              Fill out the booking form below. Your responses will be saved securely and can be reviewed for availability and follow-up.
            </p>
          </div>
          <div className="mt-10! rounded-[2rem] border border-line bg-white p-2.5! shadow-lift">
            <iframe
              title="Shiva Mehndi Art booking form"
              src={bookingUrl}
              loading="lazy"
              className="h-full min-h-[48rem] w-full rounded-[1.6rem] border-0"
            />
          </div>
          <div className="mx-auto mt-8! max-w-2xl! text-center">
            <p className="text-sm leading-relaxed text-ink-soft">
              After submitting the form, you will see a confirmation message. We will then contact you on call or WhatsApp to discuss availability and booking details.
            </p>
            <p className="mt-1! text-sm text-ink-soft">
              After your form is submitted, you can also continue here for confirmation details:
            </p>
            <a
              href="/thank-you"
              className="mt-2! inline-flex cursor-pointer items-center gap-1.5! font-semibold text-brand underline decoration-brand/40 underline-offset-4 transition-colors duration-200 hover:text-brand-deep hover:decoration-brand-deep"
            >
              https://www.shivamehndiart.com/thank-you
              <ArrowUpRightIcon />
            </a>
          </div>
        </div>
      </section>

      {/* ── Map ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="overflow-hidden rounded-[2rem] border border-line bg-white p-2.5! shadow-soft">
            <iframe
              title={`${businessName} location`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[24rem] w-full rounded-[1.6rem] border-0 md:h-[30rem]"
            />
          </div>
        </div>
      </section>

      {/* ── WhatsApp CTA ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-dark to-brand-deep px-6! py-14! text-center shadow-lift md:px-12!">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold/20 blur-2xl"
            />
            <div className="relative">
              <Eyebrow center tone="light">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-gold">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </Eyebrow>
              <h2 className="font-display mt-1! text-3xl! font-semibold text-white md:text-4xl!">
                Chat on WhatsApp
              </h2>
              <p className="mx-auto mt-4! max-w-2xl! text-sm leading-relaxed text-cream/80">
                Prefer to message directly? Reach out on WhatsApp for quick queries, availability checks, or to discuss your mehndi design preferences.
              </p>
              <div className="mt-8! flex flex-wrap justify-center gap-3!">
                <a
                  className={BTN_LIGHT}
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Message on WhatsApp
                </a>
                <a className={BTN_GHOST} href={`tel:${phone}`}>
                  Call {phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
