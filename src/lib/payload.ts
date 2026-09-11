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

// ── Portfolio Items (by category) ──
export async function getPortfolioItems(categorySlug?: string) {
  const payload = await getPayloadClient()
  const where: Where = categorySlug ? { 'category.slug': { equals: categorySlug } } : {}
  const { docs } = await payload.find({
    collection: 'portfolio-items',
    where: Object.keys(where).length > 0 ? where : undefined,
    sort: 'order',
    depth: 2,
    select: {
      image: true,
      caption: true,
      category: true,
      artist: true,
      serviceCategory: true,
    },
  })
  return docs
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
  const where: Where = {
    or: [
      { approvalStatus: { equals: 'approved' } },
      { verified: { equals: true } },
    ],
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
        {
          or: [
            { approvalStatus: { equals: 'approved' } },
            { verified: { equals: true } },
          ],
        },
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
    },
  })
  return docs
}

export const getArtistBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'artists',
    where: {
      and: [
        { slug: { equals: slug } },
        {
          or: [
            { approvalStatus: { equals: 'approved' } },
            { verified: { equals: true } },
          ],
        },
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
