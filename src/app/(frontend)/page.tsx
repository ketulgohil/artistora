'use server'

import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'
import { mediaFileUrl } from '@/lib/media-url'
import {
  getSiteSettings,
  getServices,
  getTestimonials,
  getFAQs,
  getYouTubeVideos,
} from '@/lib/payload'
import type { SiteSetting, Service, Testimonial, Faq, YoutubeVideo } from '@/payload-types'

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
      className={filled ? 'h-4 w-4 text-gold' : 'h-4 w-4 text-line'}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
    </svg>
  )
}

export default async function HomePage() {
  const [settings, _services, testimonials, faqs, youtubeVideos] = await Promise.all([
    getSiteSettings() as Promise<SiteSetting>,
    getServices() as Promise<Service[]>,
    getTestimonials() as Promise<Testimonial[]>,
    getFAQs() as Promise<Faq[]>,
    getYouTubeVideos() as Promise<YoutubeVideo[]>,
  ])

  const bookingUrl = settings.bookingFormUrl || ''
  const mapUrl = settings.googleMapUrl || ''
  const businessName = settings.businessName || 'Shiva Mehndi Art'
  const phone = settings.phone || '+91 8469662012'

  const signatureServices = [
    { title: 'Bridal Luxury', text: 'Intricate bridal storytelling from a bridal mehndi artist focused on refined detailing, symmetry, and a premium finish for your wedding day.' },
    { title: 'Arabic & Khafif', text: 'Light, stylish, camera-friendly patterns for festive events, engagement ceremonies, and modern celebrations.' },
    { title: 'Baby Shower & Events', text: 'Warm, graceful mehndi for milestones, private functions, and family occasions across Ahmedabad.' },
    { title: 'Mehndi Classes', text: 'Mehndi classes in Ahmedabad for learners who want to build confidence in linework, motifs, composition, and finishing.' },
  ]

  const trustStats = [
    { value: '200+', label: 'Portfolio Photos' },
    { value: 'Offline', label: 'Classes Available' },
    { value: 'Across', label: 'Ahmedabad Home Service' },
    { value: 'Studio', label: 'Based In Chandlodiya' },
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
              <Eyebrow>Professional Mehndi Artist &middot; Ahmedabad</Eyebrow>
              <h1 className="font-display text-[2.35rem]! leading-[1.12] font-semibold text-ink md:text-[3.4rem]!">
                Bridal mehndi artist in Ahmedabad for elegant events and modern celebrations.
              </h1>
              <p className="mt-6! max-w-xl! text-[1.02rem] leading-relaxed text-ink-soft">
                {businessName} is a professional mehndi artist Ahmedabad
                clients book for bridal mehndi, engagement mehndi, baby shower
                mehndi, festive designs, and mehndi classes in Ahmedabad that
                feel polished, graceful, and beautifully personal.
              </p>
              <div className="mt-8! flex flex-wrap items-center gap-4!">
                <a className={BTN_PRIMARY} href={bookingUrl} target="_blank" rel="noreferrer">
                  Book Bridal Mehndi
                </a>
                <Link className={BTN_OUTLINE} href="/portfolio">
                  View Portfolio
                </Link>
              </div>
              <div className="mt-9! flex flex-wrap items-center gap-x-6! gap-y-3! text-sm text-ink-soft">
                <span className="inline-flex items-center gap-2!">
                  <GoldCheck />
                  Bridal specialist
                </span>
                <span className="inline-flex items-center gap-2!">
                  <GoldCheck />
                  Home service available
                </span>
                <span className="inline-flex items-center gap-2!">
                  <GoldCheck />
                  Offline classes
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
                  alt="Bridal mehndi artist work in Ahmedabad by Shiva Mehndi Art"
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
                  114+ happy reviews
                  <span className="font-normal text-ink-muted"> from Google</span>
                </p>
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
          <SectionHeading title="Signature Experiences" subtitle="What Clients Book" />
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3c1.5 2.5 2.5 5 2.5 8a2.5 2.5 0 1 1-5 0c0-3 1-5.5 2.5-8Z" />
                    <path d="M12 13c2 2.5 2.2 5 .5 7" />
                    <path d="M12 13c-2 2.5-2.2 5-.5 7" />
                    <path d="M8.5 6.5c-2 .8-3.4 2.2-3.4 4.4 0 2.8 3 4.1 3.4 4.1.6 0 2-.3 3-1.5" />
                    <path d="M15.5 6.5c2 .8 3.4 2.2 3.4 4.4 0 2.8-3 4.1-3.4 4.1-.6 0-2-.3-3-1.5" />
                  </svg>
                </span>
                <h3 className="font-display mt-5! text-xl! font-semibold text-ink">{service.title}</h3>
                <p className="mt-2.5! text-sm leading-relaxed text-ink-soft">{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Classes CTA ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-dark to-brand-deep px-6! py-12! shadow-lift md:px-12! md:py-14!">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold/20 blur-2xl"
            />
            <div className="relative flex flex-col gap-10! lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl!">
                <Eyebrow tone="light">Mehndi Classes In Ahmedabad</Eyebrow>
                <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-[2.1rem]!">
                  Learn basic to advanced mehndi techniques with guided offline practice.
                </h2>
                <p className="mt-4! text-sm leading-relaxed text-white/75 md:text-[0.95rem]">
                  Explore the dedicated classes page for batch timings, topics
                  covered, certificate details, and how to reserve your seat for
                  mehndi classes in Ahmedabad.
                </p>
                <div className="mt-6! flex flex-wrap items-center gap-x-3! gap-y-2! text-sm text-cream/85">
                  <Link className="underline decoration-gold/60 underline-offset-4 hover:text-white" href="/bridal-mehndi">
                    Bridal Mehndi in Ahmedabad
                  </Link>
                  <span aria-hidden="true" className="text-white/25">/</span>
                  <Link className="underline decoration-gold/60 underline-offset-4 hover:text-white" href="/classes">
                    Mehndi Classes in Ahmedabad
                  </Link>
                  <span aria-hidden="true" className="text-white/25">/</span>
                  <Link className="underline decoration-gold/60 underline-offset-4 hover:text-white" href="/home-service-mehndi-in-ahmedabad">
                    Home Service Mehndi in Ahmedabad
                  </Link>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3! sm:flex-row lg:flex-col xl:flex-row">
                <Link className={BTN_LIGHT} href="/classes">
                  Explore Mehndi Classes
                </Link>
                <a
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/40 px-7! py-3! text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Book A Class Seat
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery Preview ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <SectionHeading title="Gallery Preview" subtitle="Designs In Focus" />
          <div className="grid grid-cols-2 gap-4! md:grid-cols-4 md:gap-5!">
            {galleryImages.map((img) => (
              <figure className="group relative overflow-hidden rounded-2xl shadow-soft" key={img}>
                <img
                  src={mediaFileUrl(img)}
                  alt="Mehndi design by Shiva Mehndi Art"
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
          <SectionHeading title="Google Reviews" subtitle="Client Love" />
          <div className="grid gap-5! md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((t: Testimonial) => (
              <article
                key={t.id}
                className="relative flex flex-col rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div aria-hidden="true" className="font-display absolute -top-2 right-6 text-6xl! leading-none text-gold/25">
                  &ldquo;
                </div>
                <div className="mb-4! flex items-center gap-1!">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} filled={i < (t.rating || 5)} />
                  ))}
                </div>
                <p className="flex-1 text-[0.92rem] leading-relaxed text-ink-soft italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <p className="font-display mt-5! text-[1.05rem]! font-semibold text-ink">{t.name}</p>
              </article>
            ))}
          </div>
          <div className="mt-10! text-center">
            <a className={BTN_OUTLINE} href={mapUrl} target="_blank" rel="noreferrer">
              Open Google Business Profile
            </a>
          </div>
        </div>
      </section>

      {/* ── YouTube Showcase ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="grid items-center gap-10! lg:grid-cols-[1fr_1.25fr]">
            <div>
              <Eyebrow>YouTube Tutorials</Eyebrow>
              <h2 className="font-display text-2xl! leading-snug font-semibold text-ink md:text-[2.1rem]!">
                Watch latest mehndi videos and subscribe for new uploads.
              </h2>
              <p className="mt-4! text-sm leading-relaxed text-ink-soft md:text-[0.95rem]">
                See class practice clips, bridal detailing, and short design tutorials from Shiva Mehndi Art.
              </p>
              <a
                className="mt-8! inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-[#c4302b] px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                href="https://www.youtube.com/@ShivaMehndiArtAndClasses"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
                </svg>
                Subscribe On YouTube
              </a>
            </div>
            <div className="grid gap-4! sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {youtubeVideos.slice(0, 3).map((v: YoutubeVideo) => (
                <a
                  className="group overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  key={v.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="relative block aspect-video overflow-hidden">
                    <img
                      src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}
                      alt={v.title || 'Shiva Mehndi Art YouTube video'}
                      width={480}
                      height={360}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center gap-2! bg-coal/35 text-sm font-semibold text-white transition-colors duration-300 group-hover:bg-coal/50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff4242" aria-hidden="true" className="drop-shadow">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch
                    </span>
                  </span>
                  <span className="block px-4! py-3! text-[0.88rem] leading-snug font-semibold text-ink">
                    {v.title}
                  </span>
                </a>
              ))}
            </div>
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
                <Eyebrow tone="light">Local Trust Signals</Eyebrow>
                <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-[2rem]!">
                  Based in Chandlodiya and serving bookings across Ahmedabad.
                </h2>
                <p className="mt-4! text-sm leading-relaxed text-cream/60">
                  {businessName} keeps the business name, phone number, address, and map reference consistent across the site so local searchers can connect the website with the Google Business Profile and local map listing.
                </p>
                <div className="mt-6! flex flex-wrap items-center gap-x-3! gap-y-2! text-sm text-cream/75">
                  <span className="inline-flex items-center gap-2!">
                    <GoldCheck />
                    {businessName}
                  </span>
                  <span aria-hidden="true" className="text-cream/20">/</span>
                  <span>{phone}</span>
                  <span aria-hidden="true" className="text-cream/20">/</span>
                  <span>Chandlodiya, Ahmedabad</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3! sm:flex-row lg:flex-col xl:flex-row">
                <a className={BTN_LIGHT} href={mapUrl} target="_blank" rel="noreferrer">
                  View Map Location
                </a>
                <Link
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-7! py-3! text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/20"
                  href="/contact"
                >
                  See Contact Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
