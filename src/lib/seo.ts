import type { Metadata } from 'next'

const SITE_URL = 'https://www.artistora.com'
const OG_IMAGE = '/artistora/social-profile-1000x1000.png'

export const defaultOgImage = [{ url: OG_IMAGE, width: 1000, height: 1000 }]
export const defaultTwitterImage = [OG_IMAGE]

/**
 * Merge page-specific metadata with the default OG image and Twitter card.
 * Next.js replaces (not merges) openGraph/twitter on child pages, so every
 * page must explicitly include images. Also re-adds metadataBase since child
 * pages that define their own metadata lose the root layout's metadataBase.
 */
export function withDefaultSeo(meta: Metadata): Metadata {
  const hasImages = meta.openGraph?.images
    ? Array.isArray(meta.openGraph.images)
      ? meta.openGraph.images.length > 0
      : true
    : false

  return {
    metadataBase: new URL(SITE_URL),
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: hasImages ? meta.openGraph!.images : defaultOgImage,
    },
    twitter: meta.twitter ?? {
      card: 'summary_large_image' as const,
      title: typeof meta.openGraph?.title === 'string'
        ? meta.openGraph.title
        : typeof meta.title === 'string'
          ? meta.title
          : undefined,
      description: meta.openGraph?.description || meta.description,
      images: defaultTwitterImage,
    },
  }
}
