import { getPayload, type Where } from 'payload'
import config from '../payload.config'

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

// ── Media URL helper ──
export function mediaUrl(media: any): string {
  if (!media) return ''
  if (typeof media === 'string') return media
  if (media.url) return media.url
  return `/api/media/file/${media.filename}`
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
