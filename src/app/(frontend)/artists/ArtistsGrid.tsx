'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

function Star({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      className={filled ? 'h-3.5 w-3.5 text-gold' : 'h-3.5 w-3.5 text-line'}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
    </svg>
  )
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1! rounded-full bg-green/10 px-2.5! py-0.5! text-[0.7rem] font-semibold text-green">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Verified
    </span>
  )
}

function mediaFileUrl(filename: string) {
  return `/api/media/file/${filename}`
}

function getMediaUrl(media: any): string {
  if (!media) return ''
  if (typeof media === 'string') return mediaFileUrl(media)
  if (media.url) return media.url
  if (media.filename) return mediaFileUrl(media.filename)
  return ''
}

interface Artist {
  id: number
  slug: string
  displayName: string
  area: string
  city: string
  verified: boolean
  rating: number
  reviewCount: number
  startingPrice: number
  yearsOfExperience: number
  styles: Array<{ style: string }>
  profilePhoto: any
}

export default function ArtistsGrid({ artists }: { artists: Artist[] }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high' | 'experience'>('rating')
  const [styleFilter, setStyleFilter] = useState<string>('all')

  const allStyles = useMemo(() => {
    const styleSet = new Set<string>()
    artists.forEach((a) => a.styles?.forEach((s) => styleSet.add(s.style)))
    return Array.from(styleSet).sort()
  }, [artists])

  const filtered = useMemo(() => {
    let result = [...artists]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.displayName?.toLowerCase().includes(q) ||
          a.area?.toLowerCase().includes(q) ||
          a.styles?.some((s) => s.style?.toLowerCase().includes(q)),
      )
    }

    if (styleFilter !== 'all') {
      result = result.filter((a) => a.styles?.some((s) => s.style === styleFilter))
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'price-low':
        result.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0))
        break
      case 'price-high':
        result.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0))
        break
      case 'experience':
        result.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0))
        break
    }

    return result
  }, [artists, search, sortBy, styleFilter])

  return (
    <>
      {/* Filters */}
      <div className="mb-8! flex flex-wrap items-center gap-3!">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, area, or style..."
            className="w-full rounded-full border border-line bg-white pl-10! pr-4! py-2.5! text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-full border border-line bg-white px-4! py-2.5! text-sm text-ink outline-none transition-colors focus:border-brand cursor-pointer"
        >
          <option value="rating">Top Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="experience">Most Experienced</option>
        </select>

        {allStyles.length > 0 && (
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            className="rounded-full border border-line bg-white px-4! py-2.5! text-sm text-ink outline-none transition-colors focus:border-brand cursor-pointer"
          >
            <option value="all">All Styles</option>
            {allStyles.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results count */}
      <p className="mb-4! text-sm text-ink-muted">
        {filtered.length} artist{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6! sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
                {artist.profilePhoto ? (
                  <img
                    src={getMediaUrl(artist.profilePhoto)}
                    alt={artist.displayName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-display text-5xl! text-brand/30">
                      {artist.displayName?.charAt(0)}
                    </span>
                  </div>
                )}
                {artist.verified && (
                  <span className="absolute top-3! right-3!">
                    <VerifiedBadge />
                  </span>
                )}
              </div>

              <div className="p-5!">
                <div className="flex items-start justify-between gap-2!">
                  <h3 className="font-display text-[1.15rem]! font-semibold text-ink group-hover:text-brand transition-colors duration-200">
                    {artist.displayName}
                  </h3>
                  {artist.rating > 0 && (
                    <div className="flex items-center gap-1! shrink-0">
                      <Star />
                      <span className="text-sm font-semibold text-ink">{artist.rating}</span>
                      {artist.reviewCount > 0 && (
                        <span className="text-xs text-ink-muted">({artist.reviewCount})</span>
                      )}
                    </div>
                  )}
                </div>

                {artist.area && (
                  <p className="mt-1! flex items-center gap-1.5! text-sm text-ink-soft">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-brand/60">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {artist.area}
                  </p>
                )}

                {artist.styles?.length > 0 && (
                  <div className="mt-3! flex flex-wrap gap-1.5!">
                    {artist.styles.slice(0, 3).map((s: any, i: number) => (
                      <span
                        key={i}
                        className="rounded-full border border-line bg-cream px-3! py-1! text-[0.7rem] font-medium text-ink-soft"
                      >
                        {s.style}
                      </span>
                    ))}
                    {artist.styles.length > 3 && (
                      <span className="rounded-full border border-line bg-cream px-3! py-1! text-[0.7rem] font-medium text-ink-muted">
                        +{artist.styles.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4! flex items-center justify-between border-t border-line pt-4!">
                  {artist.startingPrice > 0 && (
                    <span className="text-sm font-semibold text-brand-deep">
                      From ₹{artist.startingPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {artist.yearsOfExperience > 0 && (
                    <span className="text-xs text-ink-muted">
                      {artist.yearsOfExperience}+ yrs experience
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-line bg-white p-12! text-center shadow-soft">
          <p className="font-display text-xl! font-semibold text-ink">No artists found</p>
          <p className="mt-2! text-sm text-ink-soft">
            Try adjusting your search or filters. New artists are joining regularly.
          </p>
        </div>
      )}
    </>
  )
}
