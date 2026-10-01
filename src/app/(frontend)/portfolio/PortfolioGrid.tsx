'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { mediaFileUrl } from '@/lib/media-url'
import type { UnifiedPortfolioItem, ServiceCategory } from '@/lib/payload'

interface PortfolioGridProps {
  initialItems: UnifiedPortfolioItem[]
  initialCategory?: string
}

const SERVICE_CATEGORIES = [
  { value: 'mehndi', label: 'Mehndi' },
  { value: 'photography', label: 'Photography' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'decor', label: 'Decor & Planning' },
  { value: 'other', label: 'Other' },
] as const

export default function PortfolioGrid({
  initialItems,
  initialCategory = 'all',
}: PortfolioGridProps) {
  const [items] = useState<UnifiedPortfolioItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory)
  const [fullImage, setFullImage] = useState<{
    src: string
    width: number
    height: number
    alt: string
    artist?: {
      displayName: string
      slug: string
    }
    categoryLabel?: string
  } | null>(null)

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    SERVICE_CATEGORIES.forEach((cat) => {
      counts[cat.value] = items.filter((item) => item.serviceCategory === cat.value).length
    })
    return counts
  }, [items])

  useEffect(() => {
    if (fullImage === null) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullImage(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [fullImage])

  const closeModal = useCallback(() => setFullImage(null), [])

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items
    return items.filter((item) => item.serviceCategory === activeCategory)
  }, [items, activeCategory])

  function getImgUrl(item: UnifiedPortfolioItem): string {
    if (item.image?.url) return item.image.url
    if (item.image?.filename) return mediaFileUrl(item.image.filename)
    return ''
  }

  function getImgWidth(item: UnifiedPortfolioItem): number {
    return item.image?.width || 800
  }

  function getImgHeight(item: UnifiedPortfolioItem): number {
    return item.image?.height || 1000
  }

  function getCategoryLabel(serviceCategory?: ServiceCategory): string {
    return (
      SERVICE_CATEGORIES.find((service) => service.value === serviceCategory)?.label || 'Portfolio'
    )
  }

  return (
    <>
      {/* Category filter tabs */}
      <div className="mb-10! flex flex-wrap justify-center gap-2.5!">
        <button
          onClick={() => setActiveCategory('all')}
          className={`cursor-pointer rounded-full border px-5! py-2.5! text-sm font-semibold transition-all duration-200 ${
            activeCategory === 'all'
              ? 'border-brand bg-gradient-to-r from-brand to-brand-dark text-white shadow-soft'
              : 'border-line bg-white text-ink-soft hover:border-brand/50 hover:text-brand-deep'
          }`}
        >
          All Work ({categoryCounts.all ?? 0})
        </button>
        {SERVICE_CATEGORIES.map((service) => {
          const count = categoryCounts[service.value] ?? 0
          if (count === 0 && activeCategory !== service.value) return null
          return (
            <button
              key={service.value}
              onClick={() => setActiveCategory(service.value)}
              className={`cursor-pointer rounded-full border px-5! py-2.5! text-sm font-semibold transition-all duration-200 ${
                activeCategory === service.value
                  ? 'border-brand bg-gradient-to-r from-brand to-brand-dark text-white shadow-soft'
                  : 'border-line bg-white text-ink-soft hover:border-brand/50 hover:text-brand-deep'
              }`}
            >
              {service.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/80 bg-white/50 py-16! text-center">
          <p className="font-display text-lg! font-semibold text-ink">
            No work found in this category yet
          </p>
          <p className="mt-2! text-sm text-ink-muted">
            Explore our other categories or check back soon as verified artists upload new portfolio
            work.
          </p>
          <button
            onClick={() => setActiveCategory('all')}
            className="mt-6! inline-flex cursor-pointer items-center rounded-full border border-brand bg-white px-5! py-2! text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
          >
            View All Work
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3! md:grid-cols-3 md:gap-4! lg:grid-cols-4">
          {filteredItems.map((item) => {
            const url = getImgUrl(item)
            if (!url) return null
            const label = getCategoryLabel(item.serviceCategory)

            return (
              <div
                key={item.id}
                onClick={() =>
                  setFullImage({
                    src: url,
                    width: getImgWidth(item),
                    height: getImgHeight(item),
                    alt: item.altText || `${label} portfolio work by Artistora`,
                    artist: item.artist,
                    categoryLabel: label,
                  })
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setFullImage({
                      src: url,
                      width: getImgWidth(item),
                      height: getImgHeight(item),
                      alt: item.altText || `${label} portfolio work by Artistora`,
                      artist: item.artist,
                      categoryLabel: label,
                    })
                  }
                }}
                aria-label={`Open ${item.altText || 'portfolio work'} in full view`}
                className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-line/70 bg-white p-0 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Image
                  src={url}
                  alt={item.altText || 'Portfolio work by an Artistora professional'}
                  width={getImgWidth(item)}
                  height={getImgHeight(item)}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-coal/80 via-coal/40 to-transparent px-3! pt-8! pb-3! text-left text-[0.75rem] font-medium text-white/0 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-white/90 group-hover:opacity-100">
                  <span className="inline-block rounded-full bg-brand/80 px-2! py-0.5! text-[0.65rem] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                    {label}
                  </span>
                  {item.artist?.displayName && (
                    <Link
                      href={`/artists/${item.artist.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="pointer-events-auto mt-1.5! block font-medium text-white underline decoration-white/30 underline-offset-2 hover:decoration-white hover:text-white"
                    >
                      by {item.artist.displayName}
                    </Link>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Fullscreen modal */}
      {fullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-coal/92 p-4!"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={fullImage.alt}
        >
          <button
            onClick={closeModal}
            className="absolute top-5 right-5 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl leading-none text-white backdrop-blur transition-all duration-200 hover:rotate-90 hover:bg-brand"
            aria-label="Close fullscreen view"
          >
            &times;
          </button>
          <div
            className="relative flex max-h-[92vh] max-w-5xl flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={fullImage.src}
              alt={fullImage.alt}
              width={fullImage.width}
              height={fullImage.height}
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain shadow-lift"
            />
            <div className="mt-3! flex flex-wrap items-center justify-center gap-3! text-center text-xs text-white/90">
              {fullImage.categoryLabel && (
                <span className="rounded-full bg-brand/80 px-2.5! py-0.5! font-semibold text-white">
                  {fullImage.categoryLabel}
                </span>
              )}
              <span>{fullImage.alt}</span>
              {fullImage.artist && (
                <Link
                  href={`/artists/${fullImage.artist.slug}`}
                  className="font-semibold text-gold underline decoration-gold/40 underline-offset-2 hover:text-white"
                >
                  View {fullImage.artist.displayName}&apos;s Profile &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
