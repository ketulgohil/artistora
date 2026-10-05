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

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    // Calculate approximate active card index for indicator
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 20 : 300
    const currentIndex = Math.min(artists.length - 1, Math.max(0, Math.round(scrollLeft / cardWidth)))
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
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 20 : 320
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  if (!artists || artists.length === 0) return null

  return (
    <div className="relative">
      {/* ── Section Header with Navigation Controls ── */}
      <div className="mb-6! flex flex-col gap-4! sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
            Top Rated & Verified
          </p>
          <h2 className="mt-1! font-display text-2xl! font-semibold tracking-tight text-ink sm:text-3xl! md:text-4xl!">
            Featured Artists
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3! sm:justify-end">
          <Link
            href="/artists"
            className="group inline-flex items-center gap-1.5! text-xs font-semibold text-brand transition-colors hover:text-brand-dark sm:text-sm"
          >
            <span>Browse All {artists.length}+ Artists</span>
            <svg
              className="h-4! w-4! transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          {/* Prev / Next Arrow Controls */}
          <div className="flex items-center gap-2!">
            <button
              onClick={() => scrollBy('left')}
              disabled={!canScrollLeft}
              aria-label="Previous artists"
              className="inline-flex h-10! w-10! cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-xs transition-all hover:border-brand hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 active:scale-95"
            >
              <svg className="h-4! w-4!" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy('right')}
              disabled={!canScrollRight}
              aria-label="Next artists"
              className="inline-flex h-10! w-10! cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-xs transition-all hover:border-brand hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 active:scale-95"
            >
              <svg className="h-4! w-4!" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Horizontal Snap Carousel ── */}
      <div
        ref={scrollRef}
        className="flex gap-5! overflow-x-auto pb-4! pt-2! scroll-smooth snap-x snap-mandatory scrollbar-none focus:outline-hidden"
        tabIndex={0}
        role="region"
        aria-label="Featured Artists Carousel"
      >
        {artists.map((artist) => {
          const typeLabel = TYPE_LABELS[artist.artistType || ''] || 'Artist'
          const ratingNum = typeof artist.rating === 'number' ? artist.rating : parseFloat(String(artist.rating || '0'))
          const reviewCountNum = typeof artist.reviewCount === 'number' ? artist.reviewCount : parseInt(String(artist.reviewCount || '0'), 10)
          const startingPriceNum = artist.startingPrice ? Number(artist.startingPrice) : null

          const photoFilename =
            typeof artist.profilePhoto === 'object' && artist.profilePhoto !== null
              ? artist.profilePhoto.filename
              : typeof artist.profilePhoto === 'string'
                ? artist.profilePhoto
                : ''

          return (
            <div
              key={artist.id}
              className="w-[275px] shrink-0 snap-start sm:w-[295px] md:w-[310px]"
            >
              <Link
                href={`/artists/${artist.slug || artist.id}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border-line bg-white p-6! shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-lift"
              >
                <div>
                  {/* Top Row: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3!">
                    <div className="relative">
                      {photoFilename ? (
                        <Image
                          src={mediaFileUrl(photoFilename)}
                          alt={artist.displayName}
                          width={72}
                          height={72}
                          className="h-16! w-16! rounded-full object-contain ring-3 ring-brand/15 transition-transform duration-300 group-hover:scale-105"
                          sizes="64px"
                        />
                      ) : (
                        <ArtistPlaceholder
                          name={artist.displayName}
                          size="sm"
                          className="h-16! w-16! ring-3 ring-brand/15 transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      {artist.verified && (
                        <span
                          title="Verified Artist"
                          className="absolute -bottom-1 -right-1 inline-flex h-5! w-5! items-center justify-center rounded-full bg-green text-white shadow-xs"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5!">
                      <span className="inline-flex rounded-full bg-brand/10 px-3! py-1! text-[11px] font-semibold text-brand">
                        {typeLabel}
                      </span>
                      {artist.isFeatured && (
                        <span className="inline-flex items-center gap-1! rounded-full bg-amber-500/10 px-2.5! py-0.5! text-[10px] font-semibold text-amber-700">
                          <span className="h-1.5! w-1.5! rounded-full bg-amber-500" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Artist Info */}
                  <div className="mt-4!">
                    <h3 className="font-display text-lg! font-semibold tracking-tight text-ink transition-colors group-hover:text-brand">
                      {artist.displayName}
                    </h3>
                    <p className="mt-0.5! flex items-center gap-1! text-xs text-ink-muted">
                      <svg className="h-3.5! w-3.5! shrink-0 text-brand/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span className="truncate">{artist.area ? `${artist.area}, Ahmedabad` : artist.city || 'Ahmedabad'}</span>
                    </p>
                  </div>

                  {/* Ratings or Verified Talent */}
                  <div className="mt-3! flex items-center gap-1.5!">
                    {ratingNum > 0 ? (
                      <>
                        <div className="flex items-center gap-0.5! text-amber-500">
                          <svg className="h-4! w-4! fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-semibold text-ink">{ratingNum.toFixed(1)}</span>
                        </div>
                        <span className="text-[11px] text-ink-muted">
                          ({reviewCountNum} {reviewCountNum === 1 ? 'review' : 'reviews'})
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1! rounded-full bg-cream px-2.5! py-0.5! text-[11px] font-medium text-ink-soft">
                        <span>✨</span> Newly Listed Pro
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Footer: Price & CTA */}
                <div className="mt-5! flex items-center justify-between border-t border-line/70 pt-3.5!">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-ink-muted">Starting from</span>
                    <span className="font-display text-sm! font-semibold text-brand">
                      {startingPriceNum ? `₹${startingPriceNum.toLocaleString('en-IN')}` : 'On Request'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1! rounded-full bg-brand/5 px-3! py-1.5! text-xs font-semibold text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                    <span>View</span>
                    <svg className="h-3! w-3!" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
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
    </div>
  )
}
