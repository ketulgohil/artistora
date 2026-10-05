'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { mediaFileUrl } from '@/lib/media-url'
import ArtistPlaceholder from '@/components/ArtistPlaceholder'

export interface ArtistSliderItem {
  id: number | string
  displayName: string
  slug?: string | null
  artistType?: string | null
  city?: string | null
  area?: string | null
  startingPrice?: number | null
  priceType?: string | null
  profilePhoto?: any
  verified?: boolean | null
  isFeatured?: boolean | null
  rating?: number | null
  reviewCount?: number | null
  yearsOfExperience?: number | null
}

const TYPE_LABELS: Record<string, string> = {
  'mehndi-artists': 'Mehndi Artist',
  'makeup-artists': 'Makeup Artist',
  'nail-artists': 'Nail Artist',
  'decor-event-planners': 'Decor & Events',
}

export default function FeaturedArtistsSlider({ artists }: { artists: ArtistSliderItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 24
      : 280
    const currentIndex = Math.min(
      artists.length - 1,
      Math.max(0, Math.round(scrollLeft / cardWidth)),
    )
    setActiveIndex(currentIndex)
  }, [artists.length])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 24
      : 280
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  // ── Autoscroll Timer (Every 3.5 seconds with loop back to start) ──
  useEffect(() => {
    if (isPaused || artists.length <= 1) return

    const interval = setInterval(() => {
      const el = scrollRef.current
      if (!el) return

      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 24
        : 280
      const { scrollLeft, scrollWidth, clientWidth } = el

      // If at end, loop smoothly back to start
      if (scrollLeft >= scrollWidth - clientWidth - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' })
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [isPaused, artists.length])

  if (!artists || artists.length === 0) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* ── Horizontal Snap Slider with Original Card Box Design ── */}
      <div
        ref={scrollRef}
        className="flex gap-6! overflow-x-auto pb-4! pt-2! scroll-smooth snap-x snap-mandatory scrollbar-none focus:outline-hidden"
        tabIndex={0}
        role="region"
        aria-label="Featured Artists Carousel"
      >
        {artists.map((artist) => {
          const artistTypeLabel = TYPE_LABELS[artist.artistType || ''] || ''
          const ratingNum =
            typeof artist.rating === 'number'
              ? artist.rating
              : parseFloat(String(artist.rating || '0'))
          const reviewCountNum =
            typeof artist.reviewCount === 'number'
              ? artist.reviewCount
              : parseInt(String(artist.reviewCount || '0'), 10)
          const startingPriceNum = artist.startingPrice ? Number(artist.startingPrice) : 0

          const photoFilename =
            typeof artist.profilePhoto === 'object' && artist.profilePhoto !== null
              ? artist.profilePhoto.filename
              : typeof artist.profilePhoto === 'string'
                ? artist.profilePhoto
                : ''

          return (
            <div
              key={artist.id}
              className="w-[260px] shrink-0 snap-start sm:w-[280px] lg:w-[290px]"
            >
              <Link
                href={`/artists/${artist.slug || artist.id}`}
                className="group relative flex h-full flex-col items-center overflow-hidden rounded-3xl border border-line bg-white p-6! shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="relative mb-4!">
                  {photoFilename ? (
                    <Image
                      src={mediaFileUrl(photoFilename)}
                      alt={artist.displayName}
                      width={80}
                      height={80}
                      className="h-16! w-16! rounded-full object-contain ring-2 ring-brand/15"
                      sizes="64px"
                    />
                  ) : (
                    <ArtistPlaceholder
                      name={artist.displayName}
                      size="sm"
                      className="ring-2 ring-brand/15"
                    />
                  )}
                  {artist.verified && (
                    <span className="absolute -bottom-1 -right-1 inline-flex h-5! w-5! items-center justify-center rounded-full bg-green text-white shadow-xs">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  )}
                </div>

                {artistTypeLabel && (
                  <span className="mb-1! rounded-full bg-brand/10 px-3! py-0.5! text-[0.65rem] font-semibold tracking-wide text-brand">
                    {artistTypeLabel}
                  </span>
                )}

                <h3 className="font-display text-center text-[1.05rem]! font-semibold text-ink transition-colors group-hover:text-brand">
                  {artist.displayName}
                </h3>

                <p className="mt-1! text-sm text-ink-muted">{artist.area || artist.city}</p>

                {ratingNum > 0 && (
                  <div className="mt-2.5! flex items-center gap-1.5!">
                    <div className="flex items-center gap-0.5!">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg
                          key={i}
                          className={`h-3.5 w-3.5 ${i <= Math.round(ratingNum) ? 'text-gold' : 'text-line'}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-ink-muted">
                      {ratingNum.toFixed(1)} ({reviewCountNum})
                    </span>
                  </div>
                )}

                {startingPriceNum > 0 && (
                  <p className="mt-2.5! text-sm font-semibold text-brand-deep">
                    Starting from ₹{startingPriceNum.toLocaleString('en-IN')}
                  </p>
                )}
              </Link>
            </div>
          )
        })}
      </div>

      {/* ── Mobile Scroll Dots Indicator ── */}
      {artists.length > 3 && (
        <div className="mt-4! flex justify-center gap-1.5! sm:hidden">
          {artists.slice(0, Math.min(8, artists.length)).map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5! rounded-full transition-all duration-300 ${
                idx === Math.min(activeIndex, 7) ? 'w-5! bg-brand' : 'w-1.5! bg-line'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Bottom Controls & Action Cluster: [ ← ] [ View All Artists ] [ → ] ── */}
      <div className="mt-8! flex items-center justify-center gap-3! sm:gap-4!">
        <button
          onClick={() => scrollBy('left')}
          disabled={!canScrollLeft}
          aria-label="Previous artists"
          className="inline-flex h-12! w-12! cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:bg-brand/5 hover:text-brand hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-ink active:scale-95"
        >
          <svg
            className="h-5! w-5!"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <Link
          className="inline-flex min-h-12! cursor-pointer items-center justify-center rounded-full bg-brand-deep px-8! py-3! text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink hover:shadow-lift"
          href="/artists"
        >
          View All Artists
        </Link>

        <button
          onClick={() => scrollBy('right')}
          disabled={!canScrollRight}
          aria-label="Next artists"
          className="inline-flex h-12! w-12! cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:bg-brand/5 hover:text-brand hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-ink active:scale-95"
        >
          <svg
            className="h-5! w-5!"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
