'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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

const BATCH_SIZE = 12

export default function PortfolioGrid({
  initialItems,
  initialCategory = 'all',
}: PortfolioGridProps) {
  const [items] = useState<UnifiedPortfolioItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory)
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

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

  // Fullscreen modal Escape key handler
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

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items
    return items.filter((item) => item.serviceCategory === activeCategory)
  }, [items, activeCategory])

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category)
    setVisibleCount(BATCH_SIZE)
    setIsLoadingMore(false)
  }, [])

  // Slice visible items for lazy rendering
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount)
  }, [filteredItems, visibleCount])

  const hasMore = visibleCount < filteredItems.length

  // Load next chunk
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredItems.length))
      setIsLoadingMore(false)
    }, 250)
  }, [isLoadingMore, hasMore, filteredItems.length])

  // IntersectionObserver for seamless infinite scrolling
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: '350px',
        threshold: 0.1,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

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
          onClick={() => handleCategoryChange('all')}
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
              onClick={() => handleCategoryChange(service.value)}
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
            onClick={() => handleCategoryChange('all')}
            className="mt-6! inline-flex cursor-pointer items-center rounded-full border border-brand bg-white px-5! py-2! text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
          >
            View All Work
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3! md:grid-cols-3 md:gap-4! lg:grid-cols-4">
            {visibleItems.map((item, idx) => {
              const url = getImgUrl(item)
              if (!url) return null
              const label = getCategoryLabel(item.serviceCategory)
              const isPriority = idx < 4

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
                  className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-line/70 bg-cream/40 p-0 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <Image
                    src={url}
                    alt={item.altText || 'Portfolio work by an Artistora professional'}
                    width={getImgWidth(item)}
                    height={getImgHeight(item)}
                    priority={isPriority}
                    loading={isPriority ? undefined : 'lazy'}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

          {/* Infinite Scroll Sentinel & Load More Trigger */}
          <div
            ref={sentinelRef}
            className="mt-12! flex flex-col items-center justify-center text-center"
          >
            {hasMore ? (
              <div className="flex flex-col items-center gap-3!">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2! text-sm font-medium text-brand">
                    <div className="h-4! w-4! animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    <span>Loading more samples...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className="inline-flex cursor-pointer items-center gap-2! rounded-full border border-brand/40 bg-white px-6! py-2.5! text-xs font-semibold text-brand transition-all duration-200 hover:border-brand hover:bg-brand/5 hover:shadow-xs"
                  >
                    <span>Load More ({filteredItems.length - visibleCount} remaining)</span>
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
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                )}
                <p className="text-xs text-ink-muted">
                  Showing {visibleCount} of {filteredItems.length} portfolio items
                </p>
              </div>
            ) : filteredItems.length > BATCH_SIZE ? (
              <div className="rounded-full border border-line/70 bg-cream/30 px-5! py-2! text-xs text-ink-muted">
                ✨ You&apos;ve viewed all {filteredItems.length} portfolio samples in this category
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* Fullscreen Image Preview Modal */}
      {fullImage && (
        <div
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4! backdrop-blur-md transition-opacity duration-200"
        >
          <button
            onClick={closeModal}
            aria-label="Close preview"
            className="absolute top-4! right-4! flex h-11! w-11! cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl bg-coal shadow-2xl"
          >
            <Image
              src={fullImage.src}
              alt={fullImage.alt}
              width={fullImage.width}
              height={fullImage.height}
              className="max-h-[80vh] w-auto object-contain"
              priority
              sizes="90vw"
            />
            {(fullImage.alt || fullImage.artist) && (
              <div className="flex items-center justify-between gap-4! bg-coal/90 px-4! py-3! text-xs text-white/90">
                <span className="truncate">{fullImage.alt}</span>
                {fullImage.artist?.slug && (
                  <Link
                    href={`/artists/${fullImage.artist.slug}`}
                    className="shrink-0 font-semibold text-brand hover:underline"
                  >
                    View {fullImage.artist.displayName}&apos;s Profile →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
