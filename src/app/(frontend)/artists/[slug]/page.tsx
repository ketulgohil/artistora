/**
 * Public Artist Profile dynamic route page.
 *
 * Importers/Callers: Next.js App Router dynamic route for `/artists/[slug]`.
 * Affected APIs: Frontend artist profile SSR and dynamic params.
 * Schemas: `artists` collection (`bio`, `displayName`, `services`, `styles`, `portfolioImages`).
 * User instruction: "see this artist bio https://www.artistora.com/artists/rr-s-makeovers-114 the bio does look like paragrpah it should be well structure what we can do aboout it?"
 */

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getArtistBySlug, mediaUrl, getPayloadClient } from '@/lib/payload'
import { withDefaultSeo } from '@/lib/seo'
import SectionHeading from '@/components/SectionHeading'
import ArtistPlaceholder from '@/components/ArtistPlaceholder'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredArtistBio, { parseStructuredBio } from '@/components/StructuredArtistBio'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)
  if (!artist) return { title: 'Artist Not Found' }
  const name = artist.displayName || 'Artist'
  const service = (artist.services?.[0] as any)?.title || ''
  const location = artist.city || 'Ahmedabad'
  const title =
    (artist as any).metaTitle ||
    (service ? `${name} — ${service} in ${location}` : `${name} — Verified Artist in ${location}`)
  const description =
    (artist as any).metaDescription ||
    artist.bio?.slice(0, 160) ||
    `Book ${name} for ${service || 'events'} in ${location}. ${artist.yearsOfExperience || 0}+ years experience. Verified on Artistora.`
  const ogImage = (artist as any).ogImage
    ? mediaUrl((artist as any).ogImage)
    : artist.profilePhoto
      ? mediaUrl(artist.profilePhoto)
      : undefined
  return withDefaultSeo({
    title,
    description,
    alternates: {
      canonical: `https://www.artistora.com/artists/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.artistora.com/artists/${slug}`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
    },
  })
}

function toAbsoluteUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  return `https://www.artistora.com${cleanPath}`
}

const ARTIST_TYPE_LABELS: Record<string, string> = {
  'mehndi-artists': 'Mehndi Artist',
  'makeup-artists': 'Bridal & Event Makeup Artist',
  'nail-artists': 'Bridal & Event Nail Artist',
  'decor-event-planners': 'Decor & Event Planner',
}

interface BuildArtistJsonLdParams {
  artist: any
  slug: string
  pageTitle: string
  pageDescription: string
}

function buildArtistJsonLd({ artist, slug, pageTitle, pageDescription }: BuildArtistJsonLdParams) {
  const name = artist.displayName || 'Artist'
  const location = artist.city || 'Ahmedabad'
  const canonicalUrl = `https://www.artistora.com/artists/${slug}`
  const artistId = `${canonicalUrl}#artist`
  const galleryId = `${canonicalUrl}#gallery`
  const breadcrumbId = `${canonicalUrl}#breadcrumb`
  const webpageId = `${canonicalUrl}#webpage`

  const categoryLabel =
    (artist.artistType && ARTIST_TYPE_LABELS[artist.artistType]) || 'Wedding & Event Artist'

  // Phone formatting
  const rawPhone = artist.whatsappNumber || artist.phone
  const formattedPhone = rawPhone
    ? `+91${rawPhone.replace(/\D/g, '').replace(/^91/, '')}`
    : undefined

  // Profile photo absolute URL
  const profilePhotoUrl = artist.profilePhoto
    ? toAbsoluteUrl(mediaUrl(artist.profilePhoto))
    : undefined

  // Portfolio image items
  const portfolioItems = Array.isArray(artist.portfolioImages) ? artist.portfolioImages : []
  const portfolioImageObjects: any[] = []
  const allImageUrls: string[] = []

  if (profilePhotoUrl) {
    allImageUrls.push(profilePhotoUrl)
  }

  portfolioItems.forEach((item: any, idx: number) => {
    if (!item?.image) return
    const rawUrl = mediaUrl(item.image)
    const absUrl = toAbsoluteUrl(rawUrl)
    if (!absUrl) return

    allImageUrls.push(absUrl)

    const caption =
      typeof item.caption === 'string' && item.caption.trim() ? item.caption.trim() : undefined
    portfolioImageObjects.push({
      '@type': 'ImageObject',
      contentUrl: absUrl,
      url: absUrl,
      name: caption || `${name} — Portfolio Work ${idx + 1}`,
      caption: caption || `${name} — ${categoryLabel} sample in ${location}`,
      description:
        caption || `Portfolio sample ${idx + 1} by ${name} (${categoryLabel}) in ${location}.`,
      author: {
        '@id': artistId,
      },
    })
  })

  // Parsed structured bio
  const parsedBio = artist.bio ? parseStructuredBio(artist.bio) : null

  // KnowsAbout & Highlights extraction
  const knowsAboutSet = new Set<string>()
  knowsAboutSet.add(categoryLabel)
  if (artist.area) {
    knowsAboutSet.add(`${categoryLabel} in ${artist.area}`)
  }
  knowsAboutSet.add(`${categoryLabel} in ${location}`)

  const awards: string[] = []

  // Extract from styles
  if (Array.isArray(artist.styles)) {
    artist.styles.forEach((s: any) => {
      if (typeof s?.style === 'string' && s.style.trim()) {
        knowsAboutSet.add(s.style.trim())
      }
    })
  }

  // Extract from services
  if (Array.isArray(artist.services)) {
    artist.services.forEach((svc: any) => {
      const title = typeof svc === 'object' ? svc?.title : svc
      if (typeof title === 'string' && title.trim()) {
        knowsAboutSet.add(title.trim())
      }
    })
  }

  // Extract from structured bio sections
  if (parsedBio?.isStructured) {
    parsedBio.sections.forEach((sec) => {
      sec.items.forEach((item) => {
        if (item && item.length <= 100) {
          knowsAboutSet.add(item)
        }
      })
      if (sec.type === 'highlights') {
        sec.items.forEach((item) => {
          if (
            /award|winner|featured|celebrity|recognized|gold|best/i.test(item) &&
            item.length <= 120
          ) {
            awards.push(item)
          }
        })
      }
    })
  }

  // Build Offer Catalog (hasOfferCatalog)
  const catalogOffers: any[] = []

  // Add services as offers
  if (Array.isArray(artist.services) && artist.services.length > 0) {
    artist.services.forEach((svc: any) => {
      const serviceTitle = (typeof svc === 'object' ? svc?.title : svc) || 'Specialized Service'
      const serviceDesc =
        (typeof svc === 'object' ? svc?.shortDescription || svc?.description : '') ||
        `${serviceTitle} provided by ${name} in ${location}.`

      catalogOffers.push({
        '@type': 'Offer',
        position: catalogOffers.length + 1,
        name: serviceTitle,
        itemOffered: {
          '@type': 'Service',
          name: serviceTitle,
          description: serviceDesc,
          provider: { '@id': artistId },
          areaServed: {
            '@type': 'City',
            name: location,
          },
        },
        ...(typeof artist.startingPrice === 'number' && artist.startingPrice > 0
          ? {
              price: artist.startingPrice,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
            }
          : {}),
      })
    })
  }

  // Add styles as offers
  if (Array.isArray(artist.styles) && artist.styles.length > 0) {
    artist.styles.forEach((s: any) => {
      if (!s?.style) return
      catalogOffers.push({
        '@type': 'Offer',
        position: catalogOffers.length + 1,
        name: `${s.style} Design & Styling`,
        itemOffered: {
          '@type': 'Service',
          name: `${s.style} Design`,
          serviceType: s.style,
          description: `Custom ${s.style} design and application by ${name} in ${location}.`,
          provider: { '@id': artistId },
          areaServed: {
            '@type': 'City',
            name: location,
          },
        },
        ...(typeof artist.startingPrice === 'number' && artist.startingPrice > 0
          ? {
              price: artist.startingPrice,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
            }
          : {}),
      })
    })
  }

  // Clean description for schema
  const schemaDescription =
    parsedBio?.intro && parsedBio.intro.length > 0
      ? parsedBio.intro.join(' ').slice(0, 500)
      : artist.bio
        ? artist.bio.slice(0, 500)
        : `${name} — Verified ${categoryLabel} on Artistora serving ${location}.`

  // Areas served
  const areasServedList: any[] = [
    {
      '@type': 'City',
      name: location,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Gujarat',
      },
    },
  ]
  if (artist.area) {
    areasServedList.unshift({
      '@type': 'AdministrativeArea',
      name: `${artist.area}, ${location}`,
    })
  }

  // Aggregate Rating
  const aggregateRating =
    typeof artist.rating === 'number' &&
    artist.rating > 0 &&
    typeof artist.reviewCount === 'number' &&
    artist.reviewCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: artist.rating.toFixed(1),
          reviewCount: String(artist.reviewCount),
          bestRating: '5',
          worstRating: '1',
        }
      : undefined

  // ProfessionalService schema node
  const professionalServiceNode: any = {
    '@type': ['ProfessionalService', 'LocalBusiness'],
    '@id': artistId,
    name,
    description: schemaDescription,
    url: canonicalUrl,
    ...(allImageUrls.length > 0 ? { image: allImageUrls } : {}),
    ...(profilePhotoUrl ? { logo: profilePhotoUrl } : {}),
    ...(formattedPhone ? { telephone: formattedPhone } : {}),
    ...(artist.email ? { email: artist.email } : {}),
    ...(typeof artist.startingPrice === 'number' && artist.startingPrice > 0
      ? {
          priceRange: `₹${artist.startingPrice.toLocaleString('en-IN')}+`,
          currenciesAccepted: 'INR',
          paymentAccepted: 'Cash, UPI, Credit Card, Bank Transfer',
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: artist.startingPrice,
            priceCurrency: 'INR',
            offerCount: String(Math.max(1, catalogOffers.length)),
            availability: 'https://schema.org/InStock',
            url: canonicalUrl,
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      ...(artist.area ? { streetAddress: artist.area } : {}),
      addressLocality: location,
      addressRegion: 'Gujarat',
      addressCountry: 'IN',
    },
    areaServed: areasServedList,
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(catalogOffers.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `${name} — Services & Specializations`,
            itemListElement: catalogOffers,
          },
        }
      : {}),
    knowsAbout: Array.from(knowsAboutSet).slice(0, 25),
    ...(awards.length > 0 ? { award: awards } : {}),
    ...(parsedBio?.closing?.title || parsedBio?.closing?.subtitle
      ? { slogan: parsedBio.closing.title || parsedBio.closing.subtitle }
      : {}),
    parentOrganization: {
      '@type': 'Organization',
      name: 'Artistora',
      url: 'https://www.artistora.com',
      logo: 'https://www.artistora.com/artistora/social-profile-1000x1000.png',
    },
  }

  // BreadcrumbList schema node
  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.artistora.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Artists',
        item: 'https://www.artistora.com/artists',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: canonicalUrl,
      },
    ],
  }

  // WebPage schema node
  const webpageNode = {
    '@type': 'WebPage',
    '@id': webpageId,
    url: canonicalUrl,
    name: pageTitle,
    description: pageDescription,
    breadcrumb: { '@id': breadcrumbId },
    mainEntity: { '@id': artistId },
  }

  // Assemble graph
  const graph: any[] = [webpageNode, breadcrumbNode, professionalServiceNode]

  // Add ImageGallery if portfolio images are present
  if (portfolioImageObjects.length > 0) {
    const imageGalleryNode = {
      '@type': 'ImageGallery',
      '@id': galleryId,
      name: `${name} — Portfolio Work & Gallery`,
      description: `Portfolio samples, bridal work, and recent event designs by ${name} in ${location}.`,
      url: canonicalUrl,
      about: { '@id': artistId },
      associatedMedia: portfolioImageObjects,
    }
    graph.push(imageGalleryNode)
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

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
    <span
      className="inline-flex"
      role="img"
      aria-label={label || (filled ? 'Filled star' : 'Empty star')}
    >
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

function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5! rounded-full border border-emerald-500/25 bg-emerald-50/95 px-3! py-1! text-xs font-semibold text-emerald-700 shadow-2xs backdrop-blur-xs ${className}`}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-emerald-600"
      >
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function GoldCheck() {
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
      className="shrink-0 text-gold"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) notFound()

  // Increment profile views (fire-and-forget, don't block rendering or trigger SSR revalidation)
  getPayloadClient().then((payload) =>
    payload
      .update({
        collection: 'artists',
        id: artist.id,
        data: { profileViews: (artist.profileViews || 0) + 1 },
        context: { skipRevalidate: true },
      })
      .catch(() => {}),
  )

  const phone = artist.whatsappNumber || artist.phone
  const whatsappUrl = phone ? `https://wa.me/91${phone.replace(/\D/g, '').replace(/^91/, '')}` : ''
  const phoneUrl = phone ? `tel:+91${phone.replace(/\D/g, '').replace(/^91/, '')}` : ''
  const name = artist.displayName || 'Artist'
  const location = artist.city || 'Ahmedabad'
  const parsedBio = artist.bio ? parseStructuredBio(artist.bio) : null

  const service = (artist.services?.[0] as any)?.title || ''
  const pageTitle =
    (artist as any).metaTitle ||
    (service
      ? `${name} — ${service} in ${location} | Artistora`
      : `${name} — Verified Artist in ${location} | Artistora`)
  const pageDescription =
    (artist as any).metaDescription ||
    (parsedBio?.intro && parsedBio.intro.length > 0
      ? parsedBio.intro.join(' ').slice(0, 160)
      : artist.bio?.slice(0, 160)) ||
    `Book ${name} for ${service || 'events'} in ${location}. ${artist.yearsOfExperience || 0}+ years experience. Verified on Artistora.`

  const jsonLd = buildArtistJsonLd({
    artist,
    slug,
    pageTitle,
    pageDescription,
  })

  return (
    <>
      {/* ── JSON-LD Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <Breadcrumbs
        items={[{ label: 'Artists', href: '/artists' }, { label: name }]}
        hideJsonLd={true}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line/70 bg-white/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl"
        />
        <div className={`relative ${CONTAINER} py-14! md:py-20!`}>
          <div className="grid items-center gap-10! lg:grid-cols-[1fr_1.2fr] lg:gap-16!">
            {/* Profile Photo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-3 -rotate-1 rounded-[2.4rem] border border-dashed border-gold/40"
                />
                <div className="relative overflow-hidden rounded-[2rem] border border-line/60 bg-white p-2! shadow-lift ring-1 ring-line/60">
                  {artist.profilePhoto ? (
                    <Image
                      src={mediaUrl(artist.profilePhoto)}
                      alt={artist.displayName}
                      width={400}
                      height={400}
                      className="aspect-square w-full max-w-[340px] rounded-[1.7rem] object-contain"
                      priority
                      sizes="(max-width: 1024px) 340px, 340px"
                    />
                  ) : (
                    <ArtistPlaceholder
                      name={artist.displayName}
                      size="lg"
                      className="aspect-square w-full max-w-[340px]"
                    />
                  )}
                  {artist.verified && (
                    <div className="absolute top-4! right-4! z-10">
                      <VerifiedBadge />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div>
              <Eyebrow>
                {(artist.artistType && ARTIST_TYPE_LABELS[artist.artistType]) || 'Artist Profile'}
              </Eyebrow>

              <div className="mt-2! flex flex-wrap items-center gap-3!">
                <h1 className="font-display text-[2.2rem]! leading-[1.15] font-semibold text-ink md:text-[2.8rem]!">
                  {artist.displayName}
                </h1>
                {artist.verified && <VerifiedBadge className="hidden sm:inline-flex" />}
              </div>

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
                  <span className="sr-only">
                    {artist.rating.toFixed(1)} out of 5 stars, {artist.reviewCount || 0} reviews
                  </span>
                </div>
              )}

              {/* Location + Experience */}
              <div className="mt-4! flex flex-wrap gap-4! text-sm text-ink-soft">
                {artist.area && (
                  <span className="flex items-center gap-1.5!">
                    <PinIcon />
                    {artist.area}
                    {artist.city ? `, ${artist.city}` : ''}
                  </span>
                )}
                {typeof artist.yearsOfExperience === 'number' && artist.yearsOfExperience > 0 && (
                  <span className="flex items-center gap-1.5!">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {artist.yearsOfExperience}+ years experience
                  </span>
                )}
              </div>

              {/* Bio Summary */}
              {artist.bio && (
                <div className="mt-5!">
                  <p className="text-[0.95rem] leading-relaxed text-ink-soft">
                    {parsedBio?.isStructured && parsedBio.intro.length > 0
                      ? parsedBio.intro[0]
                      : artist.bio}
                  </p>
                  {parsedBio?.isStructured && parsedBio.sections.length > 0 && (
                    <a
                      href="#about-artist"
                      className="mt-2.5! inline-flex items-center gap-1.5! text-xs font-semibold text-brand transition-colors hover:text-brand-deep"
                    >
                      <span>Explore highlights & celebrity spotlight</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                      </svg>
                    </a>
                  )}
                </div>
              )}

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

      {/* ── Structured Bio / About Section ── */}
      {artist.bio && parsedBio?.isStructured && (
        <section id="about-artist" className={`${SECTION} scroll-mt-20!`}>
          <div className={CONTAINER}>
            <SectionHeading title="About & Highlights" subtitle="Artist Profile" />
            <div className="mx-auto max-w-4xl!">
              <StructuredArtistBio
                bio={artist.bio}
                artistName={name}
                yearsOfExperience={artist.yearsOfExperience ?? undefined}
                city={location}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Styles & Services ── */}
      <section className={SECTION}>
        <div className={CONTAINER}>
          <div className="grid gap-6! lg:grid-cols-2">
            {/* Styles */}
            {Boolean(artist.styles && artist.styles.length > 0) && (
              <div className="rounded-3xl border border-line bg-white p-7! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8!">
                <Eyebrow>Styles</Eyebrow>
                <h3 className="font-display text-xl! font-semibold text-ink">
                  Design specializations
                </h3>
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
                    <li
                      key={svc.id || svc}
                      className="flex items-start gap-3! text-sm leading-relaxed text-ink-soft"
                    >
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
                  <Image
                    src={mediaUrl(item.image)}
                    alt={
                      item.caption
                        ? `${item.caption} — ${artist.displayName} in ${artist.city || 'Ahmedabad'}`
                        : `${artist.displayName} — Portfolio sample ${i + 1} in ${artist.city || 'Ahmedabad'}`
                    }
                    width={400}
                    height={533}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
            />
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
