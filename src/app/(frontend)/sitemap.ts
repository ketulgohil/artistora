import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'

const BASE_URL = 'https://www.artistora.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/artists`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/portfolio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/artist`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/get-quote`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/booking-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/subscription`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Dynamic artist profile pages
  const { docs: artists } = await payload.find({
    collection: 'artists',
    where: {
      or: [
        { approvalStatus: { equals: 'approved' } },
        { verified: { equals: true } },
      ],
    },
    select: { slug: true, updatedAt: true },
    limit: 500,
  })

  const artistPages: MetadataRoute.Sitemap = artists
    .filter((a) => a.slug)
    .map((artist) => ({
      url: `${BASE_URL}/artists/${artist.slug}`,
      lastModified: new Date(artist.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [...staticPages, ...artistPages]
}
