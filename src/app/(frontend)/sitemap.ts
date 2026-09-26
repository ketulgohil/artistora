import type { MetadataRoute } from 'next'
import { getPayloadClient, isArtistIndexable } from '@/lib/payload'

const BASE_URL = 'https://www.artistora.com'

const areaSlugs = [
  'satellite', 'vastrapur', 'bopal', 'prahlad-nagar', 'thaltej',
  'gota', 'south-bopal', 'science-city', 'shela', 'nikol',
  'vastral', 'maninagar', 'naroda', 'chandkheda', 'motera',
  'sola', 'ghodasar', 'isanpur', 'memco', 'daskroi',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/artists`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/portfolio`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/how-it-works`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/for-artists`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/artist`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/get-quote`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/areas`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/booking-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/subscription`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Area pages
  const areaPages: MetadataRoute.Sitemap = areaSlugs.map((slug) => ({
    url: `${BASE_URL}/areas/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic artist profile pages — quality-gated before sitemap inclusion.
  // Policy: approvalStatus = 'approved' AND passes isArtistIndexable()
  // (display name, city, service, bio, portfolio image, contact, quote path).
  const { docs: artists } = await payload.find({
    collection: 'artists',
    where: {
      approvalStatus: { equals: 'approved' },
    },
    select: {
      slug: true,
      updatedAt: true,
      displayName: true,
      city: true,
      artistType: true,
      bio: true,
      portfolioImages: true,
      phone: true,
      whatsappNumber: true,
      approvalStatus: true,
    },
    depth: 1,
    limit: 500,
  })

  const artistPages: MetadataRoute.Sitemap = artists
    .filter((a) => a.slug && isArtistIndexable(a))
    .map((artist) => ({
      url: `${BASE_URL}/artists/${artist.slug}`,
      lastModified: new Date(artist.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [...staticPages, ...areaPages, ...artistPages]
}
