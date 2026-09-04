import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArtistBySlug, mediaUrl, getPayloadClient } from '@/lib/payload'
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

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1! rounded-full bg-green/10 px-3! py-1! text-xs font-semibold text-green">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Verified Artist
    </span>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function GoldCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-gold">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) notFound()

  // Increment profile views (fire-and-forget, don't block rendering)
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'artists',
      id: artist.id,
      data: { profileViews: (artist.profileViews || 0) + 1 },
    })
  } catch {
    // Non-critical — ignore errors
  }

  const phone = artist.whatsappNumber || artist.phone
  const whatsappUrl = phone ? `https://wa.me/91${phone.replace(/\D/g, '').replace(/^91/, '')}` : ''
  const phoneUrl = phone ? `tel:+91${phone.replace(/\D/g, '').replace(/^91/, '')}` : ''

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl" />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <div className="grid items-center gap-10! lg:grid-cols-[1fr_1.2fr] lg:gap-16!">
            {/* Profile Photo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div aria-hidden="true" className="absolute -inset-3 -rotate-1 rounded-[2.4rem] border border-dashed border-gold/40" />
                <div className="relative overflow-hidden rounded-[2rem] border border-line/60 bg-white p-2! shadow-lift ring-1 ring-line/60">
                  {artist.profilePhoto ? (
                    <img
                      src={mediaUrl(artist.profilePhoto)}
                      alt={artist.displayName}
                      width={400}
                      height={400}
                      className="aspect-square w-full max-w-[340px] rounded-[1.7rem] object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full max-w-[340px] items-center justify-center rounded-[1.7rem] bg-cream-deep">
                      <span className="font-display text-7xl! text-brand/30">
                        {artist.displayName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="flex flex-wrap items-center gap-3!">
                <Eyebrow>Artist</Eyebrow>
                {artist.verified && <VerifiedBadge />}
              </div>

              <h1 className="font-display mt-3! text-[2.2rem]! leading-[1.15] font-semibold text-ink md:text-[2.8rem]!">
                {artist.displayName}
              </h1>

              {/* Rating */}
              {typeof artist.rating === 'number' && artist.rating > 0 && (
                <div className="mt-3! flex items-center gap-2!">
                  <div className="flex gap-0.5!">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} filled={i <= Math.round(artist.rating!)} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-ink">{artist.rating.toFixed(1)}</span>
                  {typeof artist.reviewCount === 'number' && artist.reviewCount > 0 && (
                    <span className="text-sm text-ink-muted">({artist.reviewCount} reviews)</span>
                  )}
                  <span className="sr-only">{artist.rating.toFixed(1)} out of 5 stars, {artist.reviewCount || 0} reviews</span>
                </div>
              )}

              {/* Location + Experience */}
              <div className="mt-4! flex flex-wrap gap-4! text-sm text-ink-soft">
                {artist.area && (
                  <span className="flex items-center gap-1.5!">
                    <PinIcon />
                    {artist.area}{artist.city ? `, ${artist.city}` : ''}
                  </span>
                )}
                {typeof artist.yearsOfExperience === 'number' && artist.yearsOfExperience > 0 && (
                  <span className="flex items-center gap-1.5!">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {artist.yearsOfExperience}+ years experience
                  </span>
                )}
              </div>

              {/* Bio */}
              <p className="mt-5! text-[0.95rem] leading-relaxed text-ink-soft">
                {artist.bio}
              </p>

              {/* Price */}
              {typeof artist.startingPrice === 'number' && artist.startingPrice > 0 && (
                <div className="mt-5! inline-flex items-baseline gap-1.5! rounded-full border border-brand/20 bg-brand/5 px-5! py-2.5!">
                  <span className="text-sm text-ink-muted">Starting from</span>
                  <span className="font-display text-xl! font-bold text-brand-deep">
                    ₹{artist.startingPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Contact Buttons */}
              <div className="mt-6! flex flex-wrap gap-3!">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <WhatsAppIcon />
                    WhatsApp
                  </a>
                )}
                {phoneUrl && (
                  <a
                    href={phoneUrl}
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full border border-brand/40 bg-transparent px-7! py-3! text-sm font-semibold text-brand-deep transition-colors duration-200 hover:border-brand hover:bg-brand/10"
                  >
                    <PhoneIcon />
                    Call Now
                  </a>
                )}
                <Link
                  href="/get-quote"
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-line bg-white px-7! py-3! text-sm font-semibold text-ink-soft shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Styles & Services ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="grid gap-6! lg:grid-cols-2">
            {/* Styles */}
            {Boolean(artist.styles && artist.styles.length > 0) && (
              <div className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
                <Eyebrow>Styles</Eyebrow>
                <h3 className="font-display text-xl! font-semibold text-ink">Design specializations</h3>
                <div className="mt-5! flex flex-wrap gap-2!">
                  {artist.styles!.map((s: any, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2! rounded-full border border-line bg-cream px-4! py-2! text-sm text-ink-soft"
                    >
                      <GoldCheck />
                      {s.style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {Boolean(artist.services && artist.services.length > 0) && (
              <div className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
                <Eyebrow>Services Offered</Eyebrow>
                <h3 className="font-display text-xl! font-semibold text-ink">What you can book</h3>
                <ul className="mt-5! flex flex-col gap-3!">
                  {(artist.services as any[]).map((svc: any) => (
                    <li key={svc.id || svc} className="flex items-start gap-3! text-sm leading-relaxed text-ink-soft">
                      <GoldCheck />
                      <span>{svc.title || svc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Portfolio ── */}
      {Boolean(artist.portfolioImages && artist.portfolioImages.length > 0) && (
        <section className={`${SECTION} bg-white/60`}>
          <div className={CONTAINER}>
            <SectionHeading title="Portfolio" subtitle="Recent Work" />
            <div className="grid gap-4! sm:grid-cols-2 lg:grid-cols-3">
              {artist.portfolioImages!.map((item: any, i: number) => (
                <figure
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <img
                    src={mediaUrl(item.image)}
                    alt={item.caption || `${artist.displayName} portfolio ${i + 1}`}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  {item.caption && (
                    <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-coal/80 to-transparent px-4! py-3!">
                      <p className="text-sm font-medium text-white">{item.caption}</p>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-[2rem] bg-coal px-6! py-14! shadow-lift md:px-12! md:py-16!">
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative mx-auto max-w-2xl! text-center">
              <h2 className="font-display text-3xl! leading-snug font-semibold text-white md:text-[2.4rem]!">
                Ready to Book {artist.displayName}?
              </h2>
              <p className="mt-4! text-sm leading-relaxed text-cream/60 md:text-[0.95rem]">
                Share your event details and get a personalized quote.
              </p>
              <div className="mt-8! flex flex-wrap justify-center gap-3!">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2! rounded-full bg-gradient-to-r from-brand to-brand-dark px-7! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <WhatsAppIcon />
                    WhatsApp Now
                  </a>
                )}
                <Link
                  href="/artists"
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 px-7! py-3! text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/20"
                >
                  Browse More Artists
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
