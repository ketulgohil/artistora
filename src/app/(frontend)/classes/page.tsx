'use server'

import SectionHeading from '@/components/SectionHeading'
import { mediaFileUrl } from '@/lib/media-url'
import {
  getSiteSettings,
  getYouTubeVideos,
  getFAQs,
} from '@/lib/payload'
import type { SiteSetting, YoutubeVideo, Faq } from '@/payload-types'

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
  'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift'
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

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="shrink-0 text-gold">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  )
}

const classTopics = [
  'Paste and cone making',
  'Traditional belts',
  'Chex',
  'Peacock',
  'Startup bunch',
  'Bridal figures',
  'Doli and elephant',
  'Bridal startup',
  'Engagement figures',
]

const classHighlights = [
  {
    title: 'Basic To Advanced',
    text: 'The class is designed for learners who want to start with the fundamentals and move toward bridal-ready mehndi practice.',
  },
  {
    title: 'Certificate Provided',
    text: 'Students receive a certificate after completing the class, making it easier to build confidence and showcase learning progress.',
  },
  {
    title: 'Offline Learning',
    text: 'The classes are held in Chandlodiya, Ahmedabad, making them practical for students coming from nearby areas who want direct in-person guidance.',
  },
]

const schedule = ['10:00 AM to 12:00 PM', '2:00 PM to 4:00 PM']

export default async function ClassesPage() {
  const [settings, youtubeVideos, faqs] = await Promise.all([
    getSiteSettings() as Promise<SiteSetting>,
    getYouTubeVideos() as Promise<YoutubeVideo[]>,
    getFAQs() as Promise<Faq[]>,
  ])

  const bookingUrl = settings.bookingFormUrl || ''
  const whatsappNumber = settings.whatsappNumber || '918469662012'
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
  const youtubeUrl = settings.youtubeUrl || 'https://www.youtube.com/@ShivaMehndiArtAndClasses'

  const classesFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes('class') ||
      f.question.toLowerCase().includes('learn')
  )

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-light/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-3xl"
        />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <div className="grid items-center gap-12! lg:grid-cols-[1.15fr_1fr]">
            <div>
              <Eyebrow>Basic To Advanced Mehndi Training</Eyebrow>
              <h1 className="font-display text-[2.1rem]! leading-[1.15] font-semibold text-ink md:text-[2.8rem]!">
                Offline Mehndi Classes in Ahmedabad — Basic to Advanced Training in Chandlodiya
              </h1>
              <p className="mt-6! text-[0.98rem] leading-relaxed text-ink-soft md:leading-[1.75]">
                These mehndi classes in Ahmedabad are designed for learners who
                want structured offline guidance, step-by-step teaching, and
                practical practice with traditional and bridal design elements.
                If you are searching for mehndi classes in Chandlodiya or want
                a nearby mehndi class from Gota, Ghatlodiya, Sola, Jagatpur,
                Ranip, Vandematram, or Akhbarnagar, this is the dedicated
                offline training location.
              </p>
              <div className="mt-6! flex flex-wrap items-center gap-x-2.5! gap-y-2! text-sm">
                <a className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand" href="/portfolio">
                  See design portfolio
                </a>
                <span aria-hidden="true" className="text-line">/</span>
                <a className="font-semibold text-brand-deep underline decoration-gold/60 underline-offset-4 transition-colors duration-200 hover:text-brand" href="/contact">
                  Contact for class details
                </a>
              </div>
              <div className="mt-8! flex flex-wrap items-center gap-3!">
                <a className={BTN_PRIMARY} href={bookingUrl} target="_blank" rel="noreferrer">
                  Book Your Seat
                </a>
                <a className={BTN_OUTLINE} href={youtubeUrl} target="_blank" rel="noreferrer">
                  Subscribe on YouTube
                </a>
                <a
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-line bg-white px-7! py-3! text-sm font-semibold text-ink-soft transition-colors duration-200 hover:border-brand/50 hover:text-brand-deep"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon />
                  Ask On WhatsApp
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md! lg:max-w-none">
              <div
                aria-hidden="true"
                className="absolute -inset-4 rotate-2 rounded-[2.6rem] border border-dashed border-gold/50"
              />
              <div className="relative rounded-[2.4rem] bg-white/85 p-2.5! shadow-lift ring-1 ring-line/70">
                <div className="overflow-hidden rounded-[2rem]">
                  <img
                    src={mediaFileUrl('shivu-large.webp')}
                    alt="Shiva Mehndi Art classes"
                    width={1890}
                    height={1224}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full"
                  />
                </div>
                <div className="px-3! pb-3! pt-3!">
                  <p className="font-display text-[1.05rem]! leading-snug font-semibold text-ink">
                    Learn Basic to Advanced Mehndi Techniques
                  </p>
                  <p className="mt-1.5! inline-flex items-center gap-2! rounded-full bg-cream-deep px-3! py-1! text-[0.72rem] font-bold tracking-wide text-brand-deep uppercase">
                    <GoldCheck className="h-3 w-3" />
                    Certificate will be provided
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Topics ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="What You Will Learn" subtitle="Comprehensive curriculum" />
          <div className="flex flex-wrap justify-center gap-3!">
            {classTopics.map((topic) => (
              <span
                className="inline-flex items-center gap-2! rounded-full border border-line bg-white px-5! py-2.5! text-sm font-medium text-ink shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
                key={topic}
              >
                <svg className="h-3 w-3 shrink-0 text-gold" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <SectionHeading title="Class Benefits" subtitle="What you get" />
          <div className="grid gap-6! sm:grid-cols-2 lg:grid-cols-3">
            {classHighlights.map((item) => (
              <article
                className="group relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!"
                key={item.title}
              >
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <Eyebrow>Class Benefit</Eyebrow>
                <h3 className="font-display text-[1.3rem]! font-semibold text-ink">{item.title}</h3>
                <p className="mt-3! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* ── YouTube Videos ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading
            title="Watch Class Videos"
            subtitle="Practice clips and tutorials"
          />
          <div className="grid gap-6! sm:grid-cols-2 lg:grid-cols-3">
            {youtubeVideos.map((v: YoutubeVideo) => (
              <div
                className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                key={v.id}
              >
                <div className="p-2.5!">
                  <iframe
                    src={`https://www.youtube.com/embed/${v.videoId}`}
                    title={v.title || 'Shiva Mehndi Art video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="block aspect-video w-full rounded-[1.35rem] border-0"
                    loading="lazy"
                  />
                </div>
                <span className="block px-5! pt-1! pb-5! text-[0.95rem] leading-snug font-semibold text-ink">
                  {v.title}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-10! text-center">
            <a className={BTN_OUTLINE} href={youtubeUrl} target="_blank" rel="noreferrer">
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* ── Batch Timings & Location ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <SectionHeading
            title="Batch Timings & Location"
            subtitle="Plan your schedule"
          />
          <div className="grid gap-6! md:grid-cols-3">
            <article className="relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <div
                aria-hidden="true"
                className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-60"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                <CalendarIcon />
              </span>
              <Eyebrow>New Batches</Eyebrow>
              <h3 className="font-display text-xl! font-semibold text-ink">Ongoing enrollment</h3>
              <p className="mt-3! text-sm leading-relaxed text-ink-soft">
                Ask about the next available batch and reserve early if you want
                your preferred timing.
              </p>
            </article>

            <article className="relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <div
                aria-hidden="true"
                className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-60"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                <PinIcon />
              </span>
              <Eyebrow>Location</Eyebrow>
              <h3 className="font-display text-xl! font-semibold text-ink">Chandlodiya, Ahmedabad</h3>
              <p className="mt-3! text-sm leading-relaxed text-ink-soft">
                Offline mehndi classes in Chandlodiya with direct in-person
                support and guidance.
              </p>
            </article>

            <article className="relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
              <div
                aria-hidden="true"
                className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-60"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand-deep">
                <ClockIcon />
              </span>
              <Eyebrow>Timing</Eyebrow>
              <h3 className="font-display text-xl! font-semibold text-ink">Choose your batch</h3>
              <ul className="mt-4! flex flex-col gap-2.5!">
                {schedule.map((slot) => (
                  <li key={slot}>
                    <span className="inline-flex items-center gap-2.5! rounded-full border border-line bg-cream px-4! py-2! text-sm font-semibold text-ink">
                      <ClockIcon />
                      {slot}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {classesFaqs.length > 0 && (
        <section className={SECTION}>
          <div className={CONTAINER}>
            <SectionHeading
              title="Class FAQs"
              subtitle="Common questions about classes"
            />
            <div className="grid gap-5! md:grid-cols-2 lg:grid-cols-3">
              {classesFaqs.map((faq: Faq) => (
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
                    {renderLexicalText(faq.answer)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
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
            <div className="relative flex flex-col items-center gap-10! lg:flex-row lg:justify-between">
              <div className="max-w-2xl! text-center lg:text-left">
                <h2 className="font-display text-2xl! leading-snug font-semibold text-white md:text-[2.1rem]!">
                  Ready to start your mehndi journey?
                </h2>
                <p className="mt-4! text-sm leading-relaxed text-cream/75 md:text-[0.95rem]">
                  Book your seat or reach out on WhatsApp to learn more about batch
                  availability and pricing.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3! sm:flex-row lg:flex-col xl:flex-row">
                <a className={BTN_LIGHT} href={bookingUrl} target="_blank" rel="noreferrer">
                  Reserve Your Seat
                </a>
                <a
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-white/40 px-7! py-3! text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon />
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
