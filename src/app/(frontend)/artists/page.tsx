import Link from 'next/link'
import { getArtists, getSiteSettings, mediaUrl } from '@/lib/payload'
import SectionHeading from '@/components/SectionHeading'
import ArtistsGrid from './ArtistsGrid'

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'
const SECTION = 'py-16! md:py-24!'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4! flex items-center gap-3! text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand">
      <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
      {children}
    </p>
  )
}

export default async function ArtistsPage() {
  const [artists, settings] = await Promise.all([
    getArtists(),
    getSiteSettings(),
  ])

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <SectionHeading title="Artists" subtitle="Find Your Perfect Artist" />
          <div className="mx-auto max-w-2xl! text-center">
            <h1 className="font-display text-[2.05rem]! leading-[1.18] font-semibold text-ink md:text-[2.7rem]!">
              Browse verified artists in Ahmedabad
            </h1>
            <p className="mt-5! text-[0.95rem] leading-relaxed text-ink-soft">
              Discover talented artists for weddings, events, and special occasions.
              Compare styles, experience, and pricing — then request quotes from your favorites.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="mx-auto max-w-3xl! text-center">
            <Eyebrow>How It Works</Eyebrow>
            <h2 className="font-display text-2xl! font-semibold text-ink md:text-[2.1rem]!">
              Three simple steps to book your artist
            </h2>
          </div>
          <div className="mt-12! grid gap-6! sm:grid-cols-3">
            {[
              { step: '01', title: 'Browse Artists', text: 'Explore verified artists with portfolios, styles, and transparent pricing.' },
              { step: '02', title: 'Compare & Choose', text: 'Filter by style, experience, and budget to find the perfect match for your event.' },
              { step: '03', title: 'Get 3 Quotes', text: 'Submit your event details and receive competitive quotes from top artists.' },
            ].map((item) => (
              <article
                className="group relative overflow-hidden rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                key={item.step}
              >
                <div aria-hidden="true" className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-gold via-brand to-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="font-display text-4xl! font-bold text-brand/20">{item.step}</span>
                <h3 className="font-display mt-3! text-[1.2rem]! font-semibold text-ink">{item.title}</h3>
                <p className="mt-2! text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Artist Grid ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <SectionHeading title="Featured Artists" subtitle="Ahmedabad's Finest" />
          <ArtistsGrid artists={(artists as any[]) || []} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${SECTION} bg-white/60`}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-coal px-6! py-14! shadow-lift md:px-12! md:py-16!">
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative mx-auto max-w-2xl! text-center">
              <h2 className="font-display text-3xl! leading-snug font-semibold text-white md:text-[2.4rem]!">
                Are You an Artist?
              </h2>
              <p className="mt-4! text-sm leading-relaxed text-cream/60 md:text-[0.95rem]">
                Join our platform and connect with customers looking for professional artists in Ahmedabad.
              </p>
              <div className="mt-8! flex flex-wrap justify-center gap-3!">
                <a
                  href="https://wa.me/917405387720"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Contact to Join
                </a>
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-7! py-3! text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/20"
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
