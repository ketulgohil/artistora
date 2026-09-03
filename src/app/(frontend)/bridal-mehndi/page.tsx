import 'server-only'
import Link from 'next/link'
import { getSiteSettings, getServices } from '@/lib/payload'
import SectionHeading from '@/components/SectionHeading'
import { mediaFileUrl } from '@/lib/media-url'

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

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

const BTN_PRIMARY =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
const BTN_OUTLINE =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-brand/40 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10'
const BTN_LIGHT =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-cream px-7! py-3! text-sm font-bold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
const BTN_GHOST =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-cream/40 px-7! py-3! text-sm font-semibold text-cream transition-colors duration-200 hover:border-cream/70 hover:bg-white/10'

const CARD =
  'rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!'

export default async function BridalMehndiPage() {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    getServices(),
  ])

  const bookingUrl = '/book'
  const whatsappNumber = ((settings as any).whatsappNumber || '917405387720').replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  const bridalService = (services as any[]).find(
    (s: any) => s.slug && s.slug.includes('bridal')
  )

  const highlights = [
    {
      title: 'Intricate Detailing',
      text: 'Every design is composed with dense traditional motifs, delicate filigree, and balanced spacing that creates a rich, elegant look for your wedding day.',
    },
    {
      title: 'Premium Finish',
      text: 'Clean lines, deep color payoff, and precise finishing that photographs beautifully and stays vibrant through your wedding ceremonies.',
    },
    {
      title: 'Custom Patterns',
      text: 'Designs are tailored around your outfit, jewelry, and personal style from traditional Rajasthani to contemporary Arabic fusions.',
    },
  ]

  const bookingSteps = [
    { step: '01', title: 'Share Your Event Details', text: 'Tell us your wedding date, venue location in Ahmedabad, and the coverage you need.' },
    { step: '02', title: 'Discuss The Design', text: 'We work through your outfit, jewelry, and preferred style traditional, contemporary, or a custom blend.' },
    { step: '03', title: 'Confirm Your Booking', text: 'Once the design direction and schedule are set, a booking advance secures your date.' },
    { step: '04', title: 'Enjoy Your Bridal Mehndi', text: 'The artist arrives at your venue with everything needed for a relaxed, well-timed mehndi session.' },
  ]

  const faqs = [
    {
      q: 'How far in advance should I book bridal mehndi?',
      a: 'Booking 2-4 weeks in advance is recommended, especially during wedding season (Oct-Feb). Last-minute bookings may be accommodated if the schedule allows.',
    },
    {
      q: 'Do you provide home service for bridal mehndi in Ahmedabad?',
      a: 'Yes, bridal mehndi home service is available across Ahmedabad including Ghatlodiya, Gota, Sola, Jagatpur, and nearby areas. Travel is included within these zones.',
    },
    {
      q: 'How long does a bridal mehndi session take?',
      a: 'A full bridal design (both hands up to arms and feet) typically takes 3-5 hours depending on the complexity and coverage level chosen.',
    },
    {
      q: 'Can I book mehndi for bridesmaids and family too?',
      a: 'Yes, group bookings for the bride, bridesmaids, and family members are welcome. The session is planned with coordinated scheduling and consistent design quality.',
    },
    {
      q: 'Do you offer trial or preview sessions?',
      a: 'Design references and style discussions are done in advance. A full trial session can be arranged separately if needed. Please inquire when booking.',
    },
  ]

  return (
    <>
      {/* ── Page hero ── */}
      <section className="border-b border-line/70 bg-white/60">
        <div className={`${CONTAINER} py-14! md:py-20!`}>
          <div className="mx-auto max-w-3xl! text-center">
            <Eyebrow center>Bridal Mehndi Artist Ahmedabad</Eyebrow>
            <h1 className="font-display mt-1! text-4xl! leading-tight font-semibold text-ink md:text-5xl!">
              Premium bridal mehndi designed around your wedding story.
            </h1>
            <p className="mx-auto mt-6! max-w-2xl! text-[1.02rem] leading-relaxed text-ink-soft">
              Every bridal mehndi booking on Artistora is built around the bride&apos;s
              personality, outfit, and the scale of the wedding. From dense traditional motifs
              to light contemporary accents, each design is composed with care and finished to
              read beautifully in photographs. Verified artists are based in Ahmedabad, with home
              service across the city.
            </p>
            <div className="mt-8! flex flex-wrap items-center justify-center gap-4!">
              <a className={BTN_PRIMARY} href={bookingUrl} target="_blank" rel="noreferrer">
                Book Bridal Mehndi
              </a>
              <a className={BTN_OUTLINE} href={whatsappUrl} target="_blank" rel="noreferrer">
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature image ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative mx-auto w-full max-w-4xl!">
            <div
              aria-hidden="true"
              className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-brand-light/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-14 -right-14 h-64 w-64 rounded-full bg-gold/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-2 rounded-[2.6rem] border border-dashed border-gold/50"
            />
            <div className="relative rounded-[2.4rem] bg-white/85 p-2.5! shadow-lift ring-1 ring-line/70">
              <img
                src={mediaFileUrl('Bridal.webp')}
                alt="Bridal mehndi by artists on Artistora"
                width={1400}
                height={933}
                className="aspect-[3/2] w-full rounded-[2rem] object-cover"
                loading="eager"
              />
            </div>
            <Sparkle className="absolute -top-5 right-8 h-6 w-6" />
            <Sparkle className="absolute -bottom-4 left-12 h-4 w-4 text-gold/40" />
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <SectionHeading title="What Makes It Special" subtitle="Bridal Mehndi Craft" />
          <div className="grid gap-6! md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className={CARD}>
                <span
                  aria-hidden="true"
                  className="block h-1 w-10 rounded-full bg-gradient-to-r from-gold to-brand"
                />
                <h3 className="font-display mt-5! text-xl! font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2.5! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Booking steps ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="How Booking Works" subtitle="Simple Steps To Your Bridal Mehndi" />
          <div className="grid gap-6! md:grid-cols-2 lg:grid-cols-4">
            {bookingSteps.map((item) => (
              <article key={item.step} className={`${CARD} flex flex-col`}>
                <span
                  aria-hidden="true"
                  className="mb-5! block h-1 w-9 rounded-full bg-gradient-to-r from-gold to-brand"
                />
                <span className="text-[0.7rem] font-bold tracking-[0.28em] text-brand uppercase">
                  Step {item.step}
                </span>
                <h3 className="font-display mt-2! text-lg! leading-snug font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CMS service detail ── */}
      {bridalService && (
        <section className={`${SECTION} bg-white/60`}>
          <div className={CONTAINER}>
            <SectionHeading title={bridalService.title} subtitle="Service Detail" />
            <div className="mx-auto max-w-3xl! text-center">
              <p className="text-[0.97rem] leading-relaxed text-ink-soft md:text-base">
                {bridalService.description}
              </p>
              {bridalService.points?.length > 0 && (
                <ul className="mt-8! flex flex-wrap justify-center gap-3!">
                  {bridalService.points.map((p: any, i: number) => (
                    <li
                      key={i}
                      className="inline-flex items-center gap-2! rounded-full border border-brand/25 bg-white px-5! py-2.5! text-sm font-semibold text-brand-deep shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lift"
                    >
                      <GoldCheck />
                      <strong>{p.point || p}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Bridal Mehndi FAQs" subtitle="Common Questions" />
          <div className="mx-auto grid max-w-4xl! gap-6! md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.q} className={CARD}>
                <span
                  aria-hidden="true"
                  className="mb-4! block h-1 w-9 rounded-full bg-gradient-to-r from-gold to-brand"
                />
                <h3 className="text-[1.05rem]! leading-snug font-bold text-ink">{faq.q}</h3>
                <p className="mt-2.5! text-sm leading-relaxed text-ink-soft">{faq.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-dark to-brand-deep px-6! py-14! text-center shadow-lift md:px-12! md:py-16!">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold/20 blur-2xl"
            />
            <div className="relative">
              <h2 className="font-display text-3xl! font-semibold text-white md:text-4xl!">
                Ready to book your bridal mehndi?
              </h2>
              <p className="mx-auto mt-4! max-w-xl! text-sm leading-relaxed text-cream/80">
                Share your wedding date and design preferences.
              </p>
              <div className="mt-8! flex flex-wrap justify-center gap-3!">
                <a className={BTN_LIGHT} href={bookingUrl} target="_blank" rel="noreferrer">
                  Book Your Bridal Mehndi
                </a>
                <Link className={BTN_GHOST} href="/portfolio">
                  View Bridal Portfolio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
