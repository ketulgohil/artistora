import { getPayload, type Where } from 'payload'
import { cache } from 'react'
import config from '../payload.config'
import { mediaFileUrl } from './media-url'

// Reusable Payload instance for server components
let _payload: Awaited<ReturnType<typeof getPayload>> | null = null

export async function getPayloadClient() {
  if (!_payload) {
    const resolvedConfig = await config
    _payload = await getPayload({ config: resolvedConfig })
  }
  return _payload
}

/**
 * Authenticate incoming HTTP request against Payload.
 * Automatically handles cookie extraction and JWT header forwarding across all environments.
 */
export async function authenticateRequest(request: Request | any, payloadClient?: any) {
  const payload = payloadClient || (await getPayloadClient())
  const headers = new Headers(request.headers)

  if (!headers.get('Authorization')) {
    let token: string | undefined
    if (request && 'cookies' in request && typeof request.cookies?.get === 'function') {
      token = request.cookies.get('payload-token')?.value
    } else {
      const cookieHeader = headers.get('cookie') || ''
      const match = cookieHeader.match(/(?:^|;\s*)payload-token=([^;]+)/)
      if (match) token = decodeURIComponent(match[1])
    }
    if (token) {
      headers.set('Authorization', `JWT ${token}`)
    }
  }

  return payload.auth({ headers })
}

// ── Artist Quality Gate ──────────────────────────────────────────
// Indexability policy: a profile is public/indexable only when it has
// approvalStatus = 'approved' AND passes the profile-quality threshold.
// `verified` is a separate trust badge and does NOT grant indexability.
//
// Quality threshold requires: display name, city, service (artistType),
// a meaningful bio, at least one portfolio image, a usable contact path,
// and a slug (which enables the /artists/[slug] page and quote flow).
export function isArtistIndexable(artist: any): boolean {
  if (artist?.approvalStatus !== 'approved') return false

  const hasDisplayName = !!artist.displayName && String(artist.displayName).trim().length > 0
  const hasCity = !!artist.city && String(artist.city).trim().length > 0
  const hasService = !!artist.artistType
  const hasBio = !!artist.bio && String(artist.bio).trim().length >= 10
  const hasPortfolio = Array.isArray(artist.portfolioImages) && artist.portfolioImages.length > 0
  const hasContact = !!(artist.phone || artist.whatsappNumber)
  const hasQuotePath = !!artist.slug

  return (
    hasDisplayName && hasCity && hasService && hasBio && hasPortfolio && hasContact && hasQuotePath
  )
}

// ── Site Settings ──
export async function getSiteSettings() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 1,
  })
  return settings
}

// ── Header/Footer ──
export async function getHeaderFooter() {
  const payload = await getPayloadClient()
  return payload.findGlobal({
    slug: 'header-footer',
    depth: 1,
  })
}

// ── Services ──
export async function getServices() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'services',
    sort: 'order',
    depth: 1,
  })
  return docs
}

export type ServiceCategory = 'mehndi' | 'makeup' | 'nail-art' | 'decor' | 'other'

export function mapArtistTypeToServiceCategory(artistType?: string | null): ServiceCategory {
  if (!artistType) return 'other'
  const norm = artistType.toLowerCase()
  if (norm.includes('nail')) return 'nail-art'
  if (norm.includes('makeup') || norm.includes('make-up') || norm.includes('beauty'))
    return 'makeup'
  if (norm.includes('mehndi') || norm.includes('mehendi') || norm.includes('henna')) return 'mehndi'
  if (norm.includes('decor') || norm.includes('planner') || norm.includes('event')) return 'decor'
  return 'other'
}

export function normalizeCategory(category: string): ServiceCategory {
  const lower = category.toLowerCase().trim()
  if (lower.includes('mehndi') || lower.includes('henna')) {
    return 'mehndi'
  }
  if (lower.includes('nail')) {
    return 'nail-art'
  }
  if (lower.includes('makeup') || lower.includes('bridal') || lower.includes('makeover')) {
    return 'makeup'
  }
  if (lower.includes('decor') || lower.includes('event') || lower.includes('mandap')) {
    return 'decor'
  }
  return 'other'
}

export function categoryToSlug(category: ServiceCategory): string {
  switch (category) {
    case 'mehndi':
      return 'mehndi-artists'
    case 'nail-art':
      return 'nail-artists'
    case 'makeup':
      return 'makeup-artists'
    case 'decor':
      return 'decor-planners'
    default:
      return 'all'
  }
}

export function getArtistCategorySlugs(): string[] {
  return ['mehndi-artists', 'makeup-artists', 'nail-artists', 'decor-event-planners']
}

export function formatServiceCategoryLabel(category?: string | null): string {
  switch (category) {
    case 'mehndi':
      return 'Mehndi'
    case 'makeup':
      return 'Makeup'
    case 'nail-art':
      return 'Nail Art'
    case 'decor':
      return 'Decor & Planning'
    default:
      return 'Other'
  }
}

export interface UnifiedPortfolioItem {
  id: string
  altText: string
  description?: string
  image: {
    id: string | number
    filename: string
    url?: string
    width?: number
    height?: number
  }
  category?: {
    id?: string | number
    title: string
    slug: string
  }
  serviceCategory: ServiceCategory
  artist?: {
    id: string | number
    displayName: string
    slug: string
    verified?: boolean
    rating?: number
    isFeatured?: boolean
  }
  isFeatured?: boolean
  order?: number
}

// ── Portfolio Categories ──
export async function getPortfolioCategories() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'portfolio-categories',
    sort: 'order',
    depth: 0,
  })
  return docs
}

// ── Portfolio Items (Unified from approved artists & curated portfolio-items) ──
export async function getPortfolioItems(
  optionsOrSlug?: string | { serviceCategory?: string; categorySlug?: string; limit?: number },
): Promise<UnifiedPortfolioItem[]> {
  const payload = await getPayloadClient()

  let targetServiceCategory: string | undefined
  let targetCategorySlug: string | undefined
  let limit = 200

  if (typeof optionsOrSlug === 'string') {
    const normalized = optionsOrSlug.toLowerCase()
    if (['mehndi', 'makeup', 'nail-art', 'decor', 'other'].includes(normalized)) {
      targetServiceCategory = normalized
    } else if (
      ['mehndi-artists', 'makeup-artists', 'nail-artists', 'decor-event-planners'].includes(
        normalized,
      )
    ) {
      targetServiceCategory = mapArtistTypeToServiceCategory(normalized)
    } else {
      targetCategorySlug = optionsOrSlug
    }
  } else if (optionsOrSlug && typeof optionsOrSlug === 'object') {
    if (optionsOrSlug.serviceCategory)
      targetServiceCategory = optionsOrSlug.serviceCategory.toLowerCase()
    if (optionsOrSlug.categorySlug) targetCategorySlug = optionsOrSlug.categorySlug.toLowerCase()
    if (optionsOrSlug.limit) limit = optionsOrSlug.limit
  }

  const items: UnifiedPortfolioItem[] = []
  const seenImageKeys = new Set<string>()

  // 1. Fetch portfolio images from approved artists
  try {
    const { docs: approvedArtists } = await payload.find({
      collection: 'artists',
      where: {
        approvalStatus: { equals: 'approved' },
      },
      limit: 100,
      depth: 2,
      sort: '-isFeatured,-rating,-reviewCount,order',
    })

    for (const artist of approvedArtists) {
      const artistServiceCategory = mapArtistTypeToServiceCategory((artist as any).artistType)
      const serviceLabel = formatServiceCategoryLabel(artistServiceCategory)

      const portfolioImages = Array.isArray((artist as any).portfolioImages)
        ? (artist as any).portfolioImages
        : []

      portfolioImages.forEach((item: any, idx: number) => {
        const mediaObj = typeof item?.image === 'object' && item?.image !== null ? item.image : null
        const mediaId = mediaObj?.id || item?.image
        if (!mediaId) return

        const imgFilename = mediaObj?.filename || ''
        const imgUrl = mediaObj?.url || (imgFilename ? mediaFileUrl(imgFilename) : '')
        if (!imgFilename && !imgUrl) return

        const imageKey = `${artist.id}-${mediaId}`
        const rawMediaKey = String(mediaId)
        seenImageKeys.add(imageKey)
        seenImageKeys.add(rawMediaKey)

        const altText =
          item.caption ||
          mediaObj?.alt ||
          `${(artist as any).displayName} - ${serviceLabel} portfolio`

        items.push({
          id: `artist-${artist.id}-${mediaId}-${idx}`,
          altText,
          description: item.caption || '',
          image: {
            id: mediaId,
            filename: imgFilename,
            url: imgUrl,
            width: mediaObj?.width || 800,
            height: mediaObj?.height || 1000,
          },
          category: {
            title: serviceLabel,
            slug: artistServiceCategory,
          },
          serviceCategory: artistServiceCategory,
          artist: {
            id: artist.id,
            displayName: (artist as any).displayName,
            slug: (artist as any).slug,
            verified: (artist as any).verified,
            rating: (artist as any).rating,
            isFeatured: (artist as any).isFeatured,
          },
          isFeatured: (artist as any).isFeatured || false,
          order: (artist as any).order ?? 99,
        })
      })
    }
  } catch (err: any) {
    console.error('Failed to load artist portfolio images:', err.message)
  }

  // 2. Fetch from curated portfolio-items collection
  try {
    const { docs: portfolioDocs } = await payload.find({
      collection: 'portfolio-items',
      limit: 100,
      depth: 2,
      sort: 'order',
    })

    for (const doc of portfolioDocs) {
      const mediaObj = typeof doc.image === 'object' && doc.image !== null ? doc.image : null
      const mediaId =
        mediaObj?.id ||
        (typeof doc.image === 'number' || typeof doc.image === 'string' ? doc.image : null)
      if (!mediaId) continue

      const artistObj = typeof doc.artist === 'object' && doc.artist !== null ? doc.artist : null
      const artistId =
        artistObj?.id ||
        (typeof doc.artist === 'number' || typeof doc.artist === 'string' ? doc.artist : null)

      // Skip duplicate items already populated from approved artist portfolio
      const imageKey = artistId ? `${artistId}-${mediaId}` : String(mediaId)
      if (seenImageKeys.has(imageKey) || seenImageKeys.has(String(mediaId))) {
        continue
      }
      seenImageKeys.add(imageKey)
      seenImageKeys.add(String(mediaId))

      const rawCategory =
        typeof doc.category === 'object' && doc.category !== null ? doc.category : null
      const serviceCategory: ServiceCategory =
        (doc.serviceCategory as ServiceCategory) ||
        (artistObj ? mapArtistTypeToServiceCategory((artistObj as any).artistType) : 'mehndi')
      const serviceLabel = formatServiceCategoryLabel(serviceCategory)
      const imgFilename = mediaObj?.filename || ''
      const imgUrl = mediaObj?.url || (imgFilename ? mediaFileUrl(imgFilename) : '')

      items.push({
        id: String(doc.id),
        altText:
          doc.altText || doc.description || mediaObj?.alt || `${serviceLabel} design by Artistora`,
        description: doc.description || '',
        image: {
          id: mediaId,
          filename: imgFilename,
          url: imgUrl,
          width: mediaObj?.width || 800,
          height: mediaObj?.height || 1000,
        },
        category: rawCategory
          ? {
              id: rawCategory.id,
              title: (rawCategory as any).title,
              slug: (rawCategory as any).slug,
            }
          : {
              title: serviceLabel,
              slug: serviceCategory,
            },
        serviceCategory,
        artist: artistObj
          ? {
              id: artistObj.id,
              displayName: (artistObj as any).displayName,
              slug: (artistObj as any).slug,
              verified: (artistObj as any).verified,
              rating: (artistObj as any).rating,
              isFeatured: (artistObj as any).isFeatured,
            }
          : undefined,
        isFeatured: doc.featured || false,
        order: doc.order ?? 99,
      })
    }
  } catch (err: any) {
    console.error('Failed to load portfolio-items collection:', err.message)
  }

  // 3. Filter if requested
  let filtered = items
  if (targetServiceCategory && targetServiceCategory !== 'all') {
    filtered = filtered.filter((item) => item.serviceCategory === targetServiceCategory)
  } else if (targetCategorySlug) {
    filtered = filtered.filter((item) => item.category?.slug === targetCategorySlug)
  }

  // 4. Sort: featured first, then by order, then by rating
  filtered.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    const orderA = a.order ?? 99
    const orderB = b.order ?? 99
    if (orderA !== orderB) return orderA - orderB
    const ratingA = a.artist?.rating ?? 0
    const ratingB = b.artist?.rating ?? 0
    return ratingB - ratingA
  })

  return filtered.slice(0, limit)
}

// ── Testimonials ──
export async function getTestimonials() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'testimonials',
    sort: 'order',
    depth: 0,
  })
  return docs
}

// ── FAQ ──
export async function getFAQs() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faq',
    sort: 'order',
    depth: 0,
  })
  return docs
}

// ── YouTube Videos ──
export async function getYouTubeVideos() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'youtube-videos',
    sort: 'order',
    depth: 0,
  })
  return docs
}

// ── Static Pages ──
export async function getStaticPage(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'static-pages',
    where: { slug: { equals: slug } },
    depth: 0,
  })
  return docs[0] || null
}

// ── Artists ──
export async function getArtists(city?: string, limit = 50) {
  const payload = await getPayloadClient()
  // Indexability policy: approved only. `verified` is a trust badge, not an
  // indexability grant. See isArtistIndexable() for the quality threshold.
  const where: Where = {
    approvalStatus: { equals: 'approved' },
    ...(city ? { city: { equals: city } } : {}),
  }
  const { docs } = await payload.find({
    collection: 'artists',
    where,
    sort: '-isFeatured,-searchRank,order',
    depth: 1,
    limit,
    select: {
      displayName: true,
      slug: true,
      bio: true,
      city: true,
      startingPrice: true,
      priceType: true,
      services: true,
      profilePhoto: true,
      verified: true,
      isFeatured: true,
      rating: true,
      reviewCount: true,
      yearsOfExperience: true,
    },
  })
  return docs
}

export async function getFeaturedArtists(limit = 4) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'artists',
    where: {
      and: [
        // Indexability policy: approved only (verified = trust badge, not gate)
        { approvalStatus: { equals: 'approved' } },
        { isFeatured: { equals: true } },
      ],
    },
    sort: '-rating,-reviewCount',
    depth: 1,
    limit,
    select: {
      displayName: true,
      slug: true,
      bio: true,
      city: true,
      startingPrice: true,
      priceType: true,
      services: true,
      profilePhoto: true,
      verified: true,
      isFeatured: true,
      rating: true,
      reviewCount: true,
      artistType: true,
      yearsOfExperience: true,
    },
  })
  return docs
}

// Artists serving a specific area: exact area match first, then artists
// with no assigned area (they serve all of Ahmedabad via home visits).
// Used by /areas/[slug] pages so each locality page shows real inventory.
export async function getArtistsByArea(areaSlug: string, limit = 12) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'artists',
    where: {
      and: [
        { approvalStatus: { equals: 'approved' } },
        {
          or: [{ area: { equals: areaSlug } }, { area: { exists: false } }],
        },
      ],
    },
    sort: '-isFeatured,-rating,-reviewCount',
    depth: 1,
    limit,
    select: {
      displayName: true,
      slug: true,
      area: true,
      artistType: true,
      rating: true,
      reviewCount: true,
      startingPrice: true,
      yearsOfExperience: true,
      profilePhoto: true,
      verified: true,
    },
  })
  // Exact area matches first, then city-wide artists
  return [...docs].sort((a: any, b: any) => {
    const am = a.area === areaSlug ? 0 : 1
    const bm = b.area === areaSlug ? 0 : 1
    return am - bm
  })
}

export const getArtistBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'artists',
    where: {
      and: [
        { slug: { equals: slug } },
        // Indexability policy: approved only (verified = trust badge, not gate)
        { approvalStatus: { equals: 'approved' } },
      ],
    },
    depth: 2,
    limit: 1,
  })
  return docs[0] || null
})

// ── Media URL helper ──
export function mediaUrl(media: any): string {
  if (!media) return ''
  if (typeof media === 'string') return media
  if (media.filename) return mediaFileUrl(media.filename)
  if (media.url) return media.url
  return ''
}

export function mediaDimensions(media: any): { width: number; height: number } {
  if (!media || typeof media === 'string') {
    return { width: 1, height: 1 }
  }

  return {
    width: media.width || 1,
    height: media.height || 1,
  }
}
