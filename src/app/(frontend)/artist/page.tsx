import 'server-only'

import Link from 'next/link'
import SectionHeading from '@/components/SectionHeading'
import { getSiteSettings } from '@/lib/payload'
import { mediaFileUrl } from '@/lib/media-url'

function Eyebrow({
  children,
  tone = 'brand',
  className = '',
}: {
  children: React.ReactNode
  tone?: 'brand' | 'light'
  className?: string
}) {
  const dash = tone === 'light' ? 'bg-gold/60' : 'bg-brand/50'
  return (
    <p
      className={`mb-4! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] uppercase ${
        tone === 'light' ? 'text-gold' : 'text-brand'
      } ${className}`}
    >
      <span aria-hidden="true" className={`h-px w-8 shrink-0 ${dash}`} />
      {children}
    </p>
  )
}

function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`text-gold/70 ${className}`}
    >
      <path d="M12 0c1.1 4.5 3.4 7.2 12 8.1-8.6.9-10.9 3.6-12 8.1-1.1-4.5-3.4-7.2-12-8.1C8.6 7.2 10.9 4.5 12 0Z" />
    </svg>
  )
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const BTN_LIGHT =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-cream px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
const BTN_GHOST_LINE =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-cream/40 px-7! py-3! text-sm font-semibold text-cream transition-colors duration-200 hover:border-cream/70 hover:bg-white/10'
const BTN_GHOST_FILL =
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-white/25 bg-white/10 px-7! py-3! text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/20'

const CARD =
  'relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!'

export default async function ArtistPage() {
  const settings = (await getSiteSettings()) as any
  const businessName = settings.businessName || 'Shiva Mehndi Art'
  const founderName = settings.founderName || 'Bhumi Chanpura'
  const bookingUrl = settings.bookingFormUrl || ''

  const highlights = [
    {
      label: 'Experience',
      value: 'Professional Artist',
      text: 'Serving bridal and event clients across Ahmedabad with a 5.0 Google rating and 114+ reviews.',
    },
    {
      label: 'Teaching',
      value: 'Class Instructor',
      text: 'Conducts offline mehndi classes for beginners, covering basics to bridal-ready practice.',
    },
    {
      label: 'Specialization',
      value: 'Bridal & Events',
      text: 'Specializes in bridal, engagement, Arabic, Khafif, and festive mehndi with home service availability.',
    },
  ]

  const qualityTags = [
    'Clean Detailing',
    'Balanced Composition',
    'Elegant Finishing',
    'Photo-Ready Designs',
    'Calm & Comfortable Setup',
    'Consistent Quality',
  ]

  return (
    <>
      {/* ── Editorial bio ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="About the Artist" subtitle={`Meet ${founderName}`} />

          <div className="grid items-center gap-12! lg:grid-cols-[0.9fr_1.1fr] lg:gap-16!">
            {/* Framed portrait */}
            <div className="relative mx-auto w-full max-w-md!">
              <div
                aria-hidden="true"
                className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-brand-light/25 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute -inset-3 rotate-2 rounded-[2.4rem] border border-dashed border-gold/50"
              />
              <div className="relative rounded-[2.2rem] bg-white p-2.5! shadow-lift ring-1 ring-line/70">
                <img
                  src={mediaFileUrl('Bhumi.webp')}
                  alt={`${founderName} — Founder of ${businessName}`}
                  width={1200}
                  height={1600}
                  className="aspect-[3/4] w-full rounded-[1.9rem] object-cover"
                  loading="eager"
                />
              </div>
              <Sparkle className="absolute -top-5 right-6 h-6 w-6" />
              <Sparkle className="absolute -bottom-4 left-10 h-4 w-4 text-gold/40" />
            </div>

            {/* Bio copy */}
            <div>
              <h3 className="font-display text-[1.75rem]! leading-snug font-semibold text-ink md:text-3xl!">
                {founderName} &mdash; Founder of {businessName}
              </h3>
              <p className="mt-4! text-[0.97rem] leading-relaxed text-ink-soft md:text-base">
                {founderName} is the mehndi artist behind {businessName},
                based in Chandlodiya, Ahmedabad. With a focus on clean
                detailing, balanced composition, and elegant finishing, she
                has built a reputation for bridal mehndi that reads beautifully
                both in person and in photographs.
              </p>
              <p className="mt-4! text-[0.97rem] leading-relaxed text-ink-soft md:text-base">
                Her work spans bridal mehndi, engagement mehndi, baby showers,
                festive events, and offline mehndi classes for learners who
                want structured, in-person guidance. Every design is approached
                with patience and precision, making each booking feel personal
                and thoughtfully handled.
              </p>
              <div className="mt-7! flex flex-wrap gap-2.5!">
                {qualityTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-white px-4! py-2! text-sm font-medium text-ink-soft shadow-soft transition-colors duration-200 hover:border-brand/40 hover:text-brand-deep"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="grid gap-6! md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.label} className={CARD}>
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-40"
                />
                <p className="text-[0.7rem] font-semibold tracking-[0.3em] text-brand uppercase">
                  {item.label}
                </p>
                <h3 className="font-display mt-3! text-xl! font-semibold text-ink">
                  {item.value}
                </h3>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Book CTA ── */}
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
                <Eyebrow tone="light">Book Your Session</Eyebrow>
                <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-[2.1rem]!">
                  Ready to work with {founderName} for your next celebration?
                </h2>
                <p className="mt-4! text-sm leading-relaxed text-cream/65 md:text-[0.95rem]">
                  Whether you are planning a bridal booking, an engagement event,
                  a baby shower, or want to learn mehndi through structured
                  classes, reach out to check availability and discuss your vision.
                </p>
                <p className="mt-6! flex flex-wrap items-center gap-x-3! gap-y-2! text-sm text-cream/75">
                  <Link
                    className="underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-white"
                    href="/bridal-mehndi"
                  >
                    Explore bridal mehndi
                  </Link>
                  <span aria-hidden="true" className="text-cream/20">
                    /
                  </span>
                  <Link
                    className="underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-white"
                    href="/classes"
                  >
                    Mehndi classes in Ahmedabad
                  </Link>
                  <span aria-hidden="true" className="text-cream/20">
                    /
                  </span>
                  <Link
                    className="underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-white"
                    href="/contact"
                  >
                    Contact &amp; availability
                  </Link>
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3! sm:flex-row lg:flex-col xl:flex-row">
                <a className={BTN_LIGHT} href={bookingUrl} target="_blank" rel="noreferrer">
                  Book {businessName}
                </a>
                <Link className={BTN_GHOST_LINE} href="/portfolio">
                  View Portfolio
                </Link>
                <Link className={BTN_GHOST_FILL} href="/contact">
                  Ask a Question
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
