import Link from 'next/link'
import { getArtists, getSiteSettings, mediaUrl } from '@/lib/payload'
import SectionHeading from '@/components/SectionHeading'

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

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1! rounded-full bg-green/10 px-2.5! py-0.5! text-[0.7rem] font-semibold text-green">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Verified
    </span>
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
          <SectionHeading title="Mehndi Artists" subtitle="Find Your Perfect Artist" />
          <div className="mx-auto max-w-2xl! text-center">
            <h1 className="font-display text-[2.05rem]! leading-[1.18] font-semibold text-ink md:text-[2.7rem]!">
              Browse verified mehndi artists in Ahmedabad
            </h1>
            <p className="mt-5! text-[0.95rem] leading-relaxed text-ink-soft">
              Discover talented mehndi artists for bridal, engagement, and festive occasions.
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
              Three simple steps to book your mehndi artist
            </h2>
          </div>
          <div className="mt-12! grid gap-6! sm:grid-cols-3">
            {[
              { step: '01', title: 'Browse Artists', text: 'Explore verified mehndi artists with portfolios, styles, and transparent pricing.' },
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

          {(artists as any[]).length > 0 ? (
            <div className="grid gap-6! sm:grid-cols-2 lg:grid-cols-3">
              {(artists as any[]).map((artist: any) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.slug}`}
                  className="group relative overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  {/* Profile Photo */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
                    {artist.profilePhoto ? (
                      <img
                        src={mediaUrl(artist.profilePhoto)}
                        alt={artist.displayName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-display text-5xl! text-brand/30">
                          {artist.displayName?.charAt(0)}
                        </span>
                      </div>
                    )}
                    {artist.verified && (
                      <span className="absolute top-3! right-3!">
                        <VerifiedBadge />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5!">
                    <div className="flex items-start justify-between gap-2!">
                      <h3 className="font-display text-[1.15rem]! font-semibold text-ink group-hover:text-brand transition-colors duration-200">
                        {artist.displayName}
                      </h3>
                      {artist.rating > 0 && (
                        <div className="flex items-center gap-1! shrink-0">
                          <Star />
                          <span className="text-sm font-semibold text-ink">{artist.rating}</span>
                          {artist.reviewCount > 0 && (
                            <span className="text-xs text-ink-muted">({artist.reviewCount})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {artist.area && (
                      <p className="mt-1! flex items-center gap-1.5! text-sm text-ink-soft">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-brand/60">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {artist.area}
                      </p>
                    )}

                    {/* Styles */}
                    {artist.styles?.length > 0 && (
                      <div className="mt-3! flex flex-wrap gap-1.5!">
                        {artist.styles.slice(0, 3).map((s: any, i: number) => (
                          <span
                            key={i}
                            className="rounded-full border border-line bg-cream px-3! py-1! text-[0.7rem] font-medium text-ink-soft"
                          >
                            {s.style}
                          </span>
                        ))}
                        {artist.styles.length > 3 && (
                          <span className="rounded-full border border-line bg-cream px-3! py-1! text-[0.7rem] font-medium text-ink-muted">
                            +{artist.styles.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price + Experience */}
                    <div className="mt-4! flex items-center justify-between border-t border-line pt-4!">
                      {artist.startingPrice > 0 && (
                        <span className="text-sm font-semibold text-brand-deep">
                          From ₹{artist.startingPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      {artist.yearsOfExperience > 0 && (
                        <span className="text-xs text-ink-muted">
                          {artist.yearsOfExperience}+ yrs experience
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-line bg-white p-12! text-center shadow-soft">
              <p className="font-display text-xl! font-semibold text-ink">Artists coming soon</p>
              <p className="mt-2! text-sm text-ink-soft">
                We are onboarding the best mehndi artists in Ahmedabad. Check back soon.
              </p>
            </div>
          )}
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
                Are You a Mehndi Artist?
              </h2>
              <p className="mt-4! text-sm leading-relaxed text-cream/60 md:text-[0.95rem]">
                Join our platform and connect with customers looking for premium mehndi services in Ahmedabad.
              </p>
              <div className="mt-8! flex flex-wrap justify-center gap-3!">
                <a
                  href="https://wa.me/918469662012"
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
