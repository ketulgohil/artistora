import { getPortfolioItems } from '@/lib/payload'
import SectionHeading from '@/components/SectionHeading'
import Breadcrumbs from '@/components/Breadcrumbs'
import PortfolioGrid from './PortfolioGrid'

export const dynamic = 'force-dynamic'

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'

export default async function PortfolioPage() {
  const items = await getPortfolioItems()

  const gallerySchema =
    items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'Artistora Portfolio Gallery',
          description:
            'Explore bridal mehndi, wedding photography, makeup looks, and event decor from verified artists in Ahmedabad.',
          url: 'https://www.artistora.com/portfolio',
          numberOfItems: items.length,
          itemListElement: items.slice(0, 30).map((item, i) => ({
            '@type': 'ImageObject',
            position: i + 1,
            name: item.altText,
            description: item.description || item.altText,
            contentUrl: item.image?.url,
            author: item.artist?.displayName
              ? {
                  '@type': 'Person',
                  name: item.artist.displayName,
                  url: `https://www.artistora.com/artists/${item.artist.slug}`,
                }
              : undefined,
          })),
        }
      : null

  return (
    <>
      {gallerySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }}
        />
      )}

      <Breadcrumbs items={[{ label: 'Portfolio' }]} />

      <section className="relative overflow-hidden py-14! md:py-20!">
        {/* Subtle background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-light/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl"
        />

        <div className={`relative ${CONTAINER}`}>
          <SectionHeading as="h1" title="Portfolio Gallery" subtitle="Work In Focus" />

          <p className="mx-auto mb-10! max-w-2xl! text-center text-sm leading-relaxed text-ink-soft">
            Explore authentic work from verified Artistora professionals across Ahmedabad — from
            Mehndi and Wedding Photography to Bridal Makeup Looks and Event Decor.
          </p>

          <PortfolioGrid initialItems={items} />
        </div>
      </section>
    </>
  )
}
