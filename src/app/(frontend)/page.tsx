'use server'

import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'
import { mediaFileUrl } from '@/lib/media-url'
import {
  getSiteSettings,
  getServices,
  getTestimonials,
  getFAQs,
} from '@/lib/payload'
import type { SiteSetting, Service, Testimonial, Faq } from '@/payload-types'

function renderLexicalText(data: unknown): string {
  if (!data) return ''
  if (typeof data === 'string') return data
  const obj = data as { root?: { children?: Array<{ children?: Array<{ text?: string }>; text?: string }> } }
  if (!obj.root?.children) return ''
  return obj.root.children
    .map((child) => {
      if (child.children) {
        return child.children.map((c) => c.text || '').join('')
      }
      return child.text || ''
    })
    .join('\n')
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const BTN_PRIMARY =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
const BTN_OUTLINE =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/40 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10'
const BTN_LIGHT =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-white px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'

function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'light' }) {
  return (
    <p
      className={`mb-4! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] uppercase ${
        tone === 'light' ? 'text-white' : 'text-brand'
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

function Star({ filled = true, label }: { filled?: boolean; label?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={label || (filled ? 'Filled star' : 'Empty star')}>
      <svg
        className={filled ? 'h-4 w-4 text-gold' : 'h-4 w-4 text-line'}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
      </svg>
    </span>
  )
}

function ServiceIcon({ type }: { type: 'camera' | 'makeup' | 'decor' | 'mehndi' }) {
  if (type === 'camera') {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h3l1.4-2h7.2L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
        <circle cx="12" cy="13" r="3.5" />
        <path d="M18 10h.01" />
      </svg>
    )
  }

  if (type === 'makeup') {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m14.5 4.5 5 5" />
        <path d="m13 6 5 5" />
        <path d="m3 21 7.5-7.5" />
        <path d="m10 3 11 11-4 4L6 7l4-4Z" />
        <path d="M5 15 3 13" />
      </svg>
    )
  }

  if (type === 'decor') {
    return (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 20h18" />
        <path d="M5 20v-8h14v8" />
        <path d="M4 12c1.2-4.5 3.9-7 8-7s6.8 2.5 8 7" />
        <path d="M8 12V9M12 12V7M16 12V9" />
      </svg>
    )
  }

  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c1.5 2.5 2.5 5 2.5 8a2.5 2.5 0 1 1-5 0c0-3 1-5.5 2.5-8Z" />
      <path d="M12 13c2 2.5 2.2 5 .5 7M12 13c-2 2.5-2.2 5-.5 7" />
      <path d="M8.5 6.5c-2 .8-3.4 2.2-3.4 4.4 0 2.8 3 4.1 3.4 4.1M15.5 6.5c2 .8 3.4 2.2 3.4 4.4 0 2.8-3 4.1-3.4 4.1" />
    </svg>
  )
}

export default async function HomePage() {
  const [settings, _services, testimonials, faqs] = await Promise.all([
    getSiteSettings() as Promise<SiteSetting>,
    getServices() as Promise<Service[]>,
    getTestimonials() as Promise<Testimonial[]>,
    getFAQs() as Promise<Faq[]>,
  ])

  const bookingUrl = '/get-quote'
  const phone = settings.phone || '+91 7405387720'

  const signatureServices = [
    { title: 'Photographers', type: 'camera' as const, text: 'Compare wedding, event, and portrait photographers with portfolios you can browse before you book.' },
    { title: 'Makeup Artists', type: 'makeup' as const, text: 'Find bridal, reception, and occasion makeup artists — trial-ready, hygiene-first, and camera-friendly.' },
    { title: 'Decor & Event Planners', type: 'decor' as const, text: 'Stage, mandap, floral, and themed decor — matched to your event style and budget.' },
    { title: 'Mehndi Artists', type: 'mehndi' as const, text: 'Book bridal, engagement, and festive mehndi specialists with premium portfolios and home service availability.' },
  ]

  const trustStats = [
    { value: '3+', label: 'Free Quotes' },
    { value: '24h', label: 'Response Time' },
    { value: '100%', label: 'Verified Artists' },
    { value: '50+', label: 'Areas Covered' },
  ]

  const galleryImages = ['Bridal.webp', 'Baby_shower.webp', 'engagement.webp', 'deveshaa.webp']

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-light/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-3xl"
        />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <div className="grid items-center gap-12! lg:grid-cols-2">
            {/* Copy */}
            <div>
              <Eyebrow>Verified Artists &middot; Ahmedabad</Eyebrow>
              <h1 className="font-display text-[2.35rem]! leading-[1.12] font-semibold text-ink md:text-[3.4rem]!">
                Book a verified artist in Ahmedabad in minutes.
              </h1>
              <p className="mt-6! max-w-xl! text-[1.02rem] leading-relaxed text-ink-soft">
                Artistora connects you with vetted artists across
                Ahmedabad — mehndi, photography, makeup, decor, music, and more. Compare free quotes,
                browse portfolios, and book the artist who fits your event and budget.
              </p>
              <div className="mt-8! flex flex-wrap items-center gap-4!">
                <a className={BTN_PRIMARY} href={bookingUrl} rel="noreferrer">
                  Get Free Quotes
                </a>
                <Link className={BTN_OUTLINE} href="/artists">
                  Browse Artists
                </Link>
              </div>
              <div className="mt-9! flex flex-wrap items-center gap-x-6! gap-y-3! text-sm text-ink-soft">
                <span className="inline-flex items-center gap-2!">
                  <GoldCheck />
                  Verified artists
                </span>
                <span className="inline-flex items-center gap-2!">
                  <GoldCheck />
                  Free, no-obligation quotes
                </span>
                <span className="inline-flex items-center gap-2!">
                  <GoldCheck />
                  Home service available
                </span>
              </div>
            </div>

            {/* Visual */}
            <div className="relative mx-auto w-full max-w-md! lg:max-w-none">
              <div
                aria-hidden="true"
                className="absolute -inset-4 rotate-2 rounded-[2.6rem] border border-dashed border-gold/50"
              />
              <div className="relative rounded-[2.4rem] bg-white/85 p-2.5! shadow-lift ring-1 ring-line/70">
                <img
                  src={mediaFileUrl('Bridal.webp')}
                  alt="Event artistry work by a verified artist on Artistora"
                  width={1400}
                  height={933}
                  className="aspect-[4/5] w-full rounded-[2rem] object-cover"
                  loading="eager"
                />
              </div>

              {/* Floating review card */}
              <div className="absolute -bottom-5 left-4 rounded-2xl bg-white/95 px-5! py-4! shadow-lift ring-1 ring-line/60 backdrop-blur md:left-8">
                <div className="flex items-center gap-1!">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} />
                  ))}
                </div>
                <p className="mt-1.5! text-sm font-bold text-ink">
                  Trusted by Ahmedabad clients
                </p>
                <p className="sr-only">5 out of 5 stars</p>
              </div>

              {/* Floating service card */}
              <div className="absolute -top-4 right-4 flex items-center gap-2.5! rounded-2xl bg-white/95 px-5! py-3.5! shadow-lift ring-1 ring-line/60 backdrop-blur md:-right-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>
                  <strong className="block text-sm font-bold text-ink">Home Service</strong>
                  <small className="text-xs text-ink-muted">Across Ahmedabad</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-line/70 bg-white/70">
        <div className={`${CONTAINER} py-8! md:py-10!`}>
          <dl className="grid grid-cols-2 gap-6! text-center md:grid-cols-4">
            {trustStats.map((item) => (
              <div key={item.label}>
                <dt className="sr-only">{item.label}</dt>
                <dd className="font-display text-3xl! font-bold text-brand-deep md:text-4xl!">
                  {item.value}
                </dd>
                <dd className="mt-1.5! text-[0.72rem] font-semibold tracking-[0.18em] text-ink-muted uppercase">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Signature Services ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="What You Can Book" subtitle="Popular Services" />
          <div className="grid gap-6! sm:grid-cols-2">
            {signatureServices.map((service) => (
              <article
                key={service.title}
                className="group relative overflow-hidden rounded-3xl border border-line bg-white p-8! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand-deep transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                  <ServiceIcon type={service.type} />
                </span>
                <h3 className="font-display mt-5! text-xl! font-semibold text-ink">{service.title}</h3>
                <p className="mt-2.5! text-sm leading-relaxed text-ink-soft">{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join as Artist CTA ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-dark to-brand-deep px-6! py-12! shadow-lift md:px-12! md:py-14!">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-brand-light/20 blur-2xl"
            />
            <div className="relative flex flex-col gap-10! lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl!">
                <Eyebrow tone="light">For Artists</Eyebrow>
                <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-[2.1rem]!">
                  Join Artistora and get discovered by clients across Ahmedabad.
                </h2>
                <p className="mt-4! text-sm leading-relaxed text-white/75 md:text-[0.95rem]">
                  Create a free artist profile, showcase your portfolio, and
                  receive quote requests and bookings for events, weddings, and
                  special occasions — all in one place.
                </p>
                <div className="mt-6! flex flex-wrap items-center gap-x-3! gap-y-2! text-sm text-cream/85">
                  <Link className="underline decoration-gold/60 underline-offset-4 hover:text-white" href="/services">
                    Browse Services
                  </Link>
                  <span aria-hidden="true" className="text-white/25">/</span>
                  <Link className="underline decoration-gold/60 underline-offset-4 hover:text-white" href="/artists">
                    Meet Our Artists
                  </Link>
                  <span aria-hidden="true" className="text-white/25">/</span>
                  <Link className="underline decoration-gold/60 underline-offset-4 hover:text-white" href="/get-quote">
                    Get a Quote
                  </Link>
                  <span aria-hidden="true" className="text-white/25">/</span>
                  <Link className="underline decoration-gold/60 underline-offset-4 hover:text-white" href="/subscription">
                    Artist Plans
                  </Link>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3! sm:flex-row lg:flex-col xl:flex-row">
                <Link className={BTN_LIGHT} href="/register">
                  Join As An Artist
                </Link>
                <Link
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/40 px-7! py-3! text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                  href="/get-quote"
                >
                  Request Quotes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery Preview ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <SectionHeading title="Artist Work" subtitle="Designs In Focus" />
          <div className="grid grid-cols-2 gap-4! md:grid-cols-4 md:gap-5!">
            {galleryImages.map((img) => (
              <figure className="group relative overflow-hidden rounded-2xl shadow-soft" key={img}>
                <img
                  src={mediaFileUrl(img)}
                  alt="Artist work showcased on Artistora"
                  width={600}
                  height={800}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-coal/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              </figure>
            ))}
          </div>
          <div className="mt-10! text-center">
            <Link
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-brand-deep px-8! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink hover:shadow-lift"
              href="/portfolio"
            >
              Explore Full Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="What Clients Say" subtitle="Trusted Reviews" />
          <div className="grid gap-5! md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((t: Testimonial) => (
              <article
                key={t.id}
                className="relative flex flex-col rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div aria-hidden="true" className="font-display absolute -top-2 right-6 text-6xl! leading-none text-brand-light/25">
                  &ldquo;
                </div>
                <div className="mb-4! flex items-center gap-1!">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} filled={i < (t.rating || 5)} />
                  ))}
                  <span className="sr-only">{t.rating || 5} out of 5 stars</span>
                </div>
                <p className="flex-1 text-[0.92rem] leading-relaxed text-ink-soft italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <p className="font-display mt-5! text-[1.05rem]! font-semibold text-ink">{t.name}</p>
              </article>
            ))}
          </div>
          <div className="mt-10! text-center">
            <a className={BTN_OUTLINE} href="/get-quote">
              Find Your Artist
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Frequently Asked Questions" subtitle="Quick Answers" />
          <div className="grid gap-5! md:grid-cols-2 lg:grid-cols-3">
            {faqs.slice(0, 6).map((faq: Faq) => (
              <article
                key={faq.id}
                className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span
                  aria-hidden="true"
                  className="mb-4! block h-1 w-9 rounded-full bg-gradient-to-r from-gold to-brand"
                />
                <h3 className="text-[1.02rem]! leading-snug font-bold text-ink">{faq.question}</h3>
                <p className="mt-2.5! text-sm leading-relaxed text-ink-soft">{renderLexicalText(faq.answer)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Local Trust Signals ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-coal px-6! py-12! shadow-lift md:px-12! md:py-14!">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
            />
            <div className="relative flex flex-col gap-10! lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl!">
                <Eyebrow tone="light">Trusted &amp; Local</Eyebrow>
                <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-[2rem]!">
                  Serving home-service bookings across Ahmedabad.
                </h2>
                <p className="mt-4! text-sm leading-relaxed text-cream/60">
                  Artistora verifies every artist profile, keeps quotes free and
                  transparent, and stays one WhatsApp message away whenever you
                  need help choosing or booking your artist.
                </p>
                <div className="mt-6! flex flex-wrap items-center gap-x-3! gap-y-2! text-sm text-cream/75">
                  <span className="inline-flex items-center gap-2!">
                    <GoldCheck />
                    Artistora
                  </span>
                  <span aria-hidden="true" className="text-cream/20">/</span>
                  <span>{phone}</span>
                  <span aria-hidden="true" className="text-cream/20">/</span>
                  <span>Ahmedabad, Gujarat</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3! sm:flex-row">
                <Link
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-7! py-3! text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/20"
                  href="/contact"
                >
                  See Contact Details
                </Link>
                <a
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-white px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                  href="https://wa.me/917405387720"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
