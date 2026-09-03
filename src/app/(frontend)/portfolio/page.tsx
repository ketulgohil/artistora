'use client'

import { useState, useEffect, useCallback } from 'react'
import SectionHeading from '@/components/SectionHeading'
import { mediaFileUrl } from '@/lib/media-url'

interface PortfolioItem {
  id: string
  altText: string
  description?: string
  image: {
    id: string
    filename: string
    url?: string
    width?: number
    height?: number
  }
  category: {
    id: string
    title: string
    slug: string
  }
}

interface Category {
  id: string
  title: string
  slug: string
}

const CONTAINER = 'mx-auto max-w-6xl px-4! md:px-6!'

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [fullImage, setFullImage] = useState<{
    src: string
    width: number
    height: number
    alt: string
  } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, itemsRes] = await Promise.all([
          fetch('/api/portfolio-categories?limit=20&sort=order'),
          fetch('/api/portfolio-items?limit=100&depth=2&sort=order'),
        ])
        const catData = await catRes.json()
        const itemsData = await itemsRes.json()
        setCategories(catData.docs || [])
        setItems(itemsData.docs || [])
      } catch (err) {
        console.error('Failed to load portfolio:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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

  const filteredItems =
    activeCategory === 'all'
      ? items
      : items.filter((item) => item.category?.slug === activeCategory)

  function imgUrl(item: PortfolioItem): string {
    return item.image?.url || mediaFileUrl(item.image?.filename || (item.image as any))
  }

  function imgWidth(item: PortfolioItem): number {
    return typeof item.image === 'number' ? 1 : item.image?.width || 1
  }

  function imgHeight(item: PortfolioItem): number {
    return typeof item.image === 'number' ? 1 : item.image?.height || 1
  }

  return (
    <section className="py-16! md:py-24!">
      <div className={CONTAINER}>
        <SectionHeading title="Portfolio Gallery" subtitle="Designs In Focus" />

        {loading ? (
          <div className="flex justify-center py-24!">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-transparent"
              style={{
                borderTopColor: 'var(--color-brand)',
                borderRightColor: 'var(--color-brand)',
              }}
            />
          </div>
        ) : (
          <>
            <p className="mx-auto mb-10! max-w-2xl! text-center text-sm leading-relaxed text-ink-soft">
              Explore bridal, festive, and event mehndi designs crafted with detail,
              balance, and a refined finishing touch.
            </p>

            {/* Category filter */}
            <div className="mb-10! flex flex-wrap justify-center gap-2.5!">
              <button
                onClick={() => setActiveCategory('all')}
                className={`cursor-pointer rounded-full border px-5! py-2.5! text-sm font-semibold transition-all duration-200 ${
                  activeCategory === 'all'
                    ? 'border-brand bg-gradient-to-r from-brand to-brand-dark text-white shadow-soft'
                    : 'border-line bg-white text-ink-soft hover:border-brand/50 hover:text-brand-deep'
                }`}
              >
                All Designs
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`cursor-pointer rounded-full border px-5! py-2.5! text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? 'border-brand bg-gradient-to-r from-brand to-brand-dark text-white shadow-soft'
                      : 'border-line bg-white text-ink-soft hover:border-brand/50 hover:text-brand-deep'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <p className="py-16! text-center text-ink-muted">No designs found in this category.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3! md:grid-cols-3 md:gap-4! lg:grid-cols-4">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      setFullImage({
                        src: imgUrl(item),
                        width: imgWidth(item),
                        height: imgHeight(item),
                        alt: item.altText || 'Mehndi design by artists on Artistora',
                      })
                    }
                    type="button"
                    aria-label={`Open ${item.altText || 'mehndi design'} in full view`}
                    className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-line/70 bg-white p-0 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <img
                      src={imgUrl(item)}
                      alt={item.altText || 'Mehndi design by artists on Artistora'}
                      width={imgWidth(item)}
                      height={imgHeight(item)}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-coal/70 to-transparent px-3! pt-8! pb-2! text-left text-[0.72rem] font-medium text-white/0 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-white/90 group-hover:opacity-100">
                      {item.category?.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
          <img
            src={fullImage.src}
            alt={fullImage.alt}
            width={fullImage.width}
            height={fullImage.height}
            className="max-h-[88vh] w-auto max-w-full rounded-xl object-contain shadow-lift"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
