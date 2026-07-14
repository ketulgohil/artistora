'use client'

import { useState, useEffect } from 'react'
import SectionHeading from '@/components/SectionHeading'

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

  const filteredItems =
    activeCategory === 'all'
      ? items
      : items.filter((item) => item.category?.slug === activeCategory)

  function imgUrl(item: PortfolioItem): string {
    return `/api/media/file/${item.image?.filename || (item.image as any)}`
  }

  function imgWidth(item: PortfolioItem): number {
    return typeof item.image === 'number' ? 1 : item.image?.width || 1
  }

  function imgHeight(item: PortfolioItem): number {
    return typeof item.image === 'number' ? 1 : item.image?.height || 1
  }

  if (loading) {
    return (
      <section className="section-space" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-4!">
          <SectionHeading title="Portfolio Gallery" subtitle="Designs In Focus" />
          <div className="flex justify-center py-20!">
            <div
              className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
              style={{
                borderTopColor: 'var(--color-brand)',
                borderRightColor: 'var(--color-brand)',
              }}
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-space" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="max-w-7xl mx-auto px-4!">
        <SectionHeading title="Portfolio Gallery" subtitle="Designs In Focus" />

        <div className="max-w-2xl mx-auto text-center mb-10!" style={{ color: 'var(--color-text-secondary)' }}>
          <p>
            Explore bridal, festive, and event mehndi designs crafted with detail,
            balance, and a refined finishing touch.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3! mb-10!">
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              backgroundColor: activeCategory === 'all' ? 'var(--color-brand)' : 'transparent',
              color: activeCategory === 'all' ? '#fff' : 'var(--color-text-secondary)',
              borderColor: activeCategory === 'all' ? 'var(--color-brand)' : 'var(--color-border)',
            }}
            className="px-5! py-2.5! rounded-full border text-sm font-semibold transition-all duration-200 cursor-pointer"
          >
            All Designs
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              style={{
                backgroundColor: activeCategory === cat.slug ? 'var(--color-brand)' : 'transparent',
                color: activeCategory === cat.slug ? '#fff' : 'var(--color-text-secondary)',
                borderColor: activeCategory === cat.slug ? 'var(--color-brand)' : 'var(--color-border)',
              }}
              className="px-5! py-2.5! rounded-full border text-sm font-semibold transition-all duration-200 cursor-pointer"
            >
              {cat.title}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-center py-16!" style={{ color: 'var(--color-text-muted)' }}>
            No designs found in this category.
          </p>
        ) : (
          <div className="portfolio-grid">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className="portfolio-item group border-none p-0"
                onClick={() =>
                  setFullImage({
                    src: imgUrl(item),
                    width: imgWidth(item),
                    height: imgHeight(item),
                    alt: item.altText || 'Mehndi design by Shiva Mehndi Art',
                  })
                }
                type="button"
                aria-label={`Open ${item.altText || 'mehndi design'} in full view`}
              >
                <img
                  src={imgUrl(item)}
                  alt={item.altText || 'Mehndi design by Shiva Mehndi Art'}
                  width={imgWidth(item)}
                  height={imgHeight(item)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4!"
          onClick={() => setFullImage(null)}
          style={{
            backgroundColor: 'rgba(18, 12, 8, 0.92)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <button
            onClick={() => setFullImage(null)}
            className="absolute top-5! right-5! z-10 flex items-center justify-center w-10 h-10 rounded-full text-white text-2xl leading-none transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(199, 123, 68, 0.8)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            }}
            aria-label="Close fullscreen"
          >
            &times;
          </button>
          <img
            src={fullImage.src}
            alt={fullImage.alt}
            width={fullImage.width}
            height={fullImage.height}
            className="max-w-full max-h-[88vh] object-contain rounded-lg"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
