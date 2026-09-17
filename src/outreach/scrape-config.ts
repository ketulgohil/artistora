/**
 * Pre-built scrape configurations for all Artistora service categories.
 * Each config defines search queries optimized for each scraping source.
 *
 * Services: Mehndi, Photography, Makeup, Decor, Music
 * City: Ahmedabad, Gujarat
 */

import type { ScrapingSource } from './types'

export interface ScrapeQuery {
  source: ScrapingSource
  query: string
  city: string
  maxResults: number
  category?: string
}

// ─── Mehndi Artists ─────────────────────────────────────────────
export const mehndiQueries: ScrapeQuery[] = [
  // Google Maps
  { source: 'google_maps', query: 'mehndi artist', city: 'Ahmedabad', maxResults: 50, category: 'mehndi' },
  { source: 'google_maps', query: 'henna artist', city: 'Ahmedabad', maxResults: 30, category: 'mehndi' },
  { source: 'google_maps', query: 'bridal mehndi', city: 'Ahmedabad', maxResults: 30, category: 'mehndi' },
  // Instagram
  { source: 'instagram', query: 'mehndi artist ahmedabad', city: 'Ahmedabad', maxResults: 40, category: 'mehndi' },
  { source: 'instagram', query: 'henna artist ahmedabad', city: 'Ahmedabad', maxResults: 20, category: 'mehndi' },
  // Justdial
  { source: 'justdial', query: 'mehndi artist', city: 'Ahmedabad', maxResults: 50, category: 'mehndi' },
  { source: 'justdial', query: 'bridal mehndi designer', city: 'Ahmedabad', maxResults: 30, category: 'mehndi' },
  // Sulekha
  { source: 'sulekha', query: 'mehndi artist', city: 'Ahmedabad', maxResults: 40, category: 'mehndi' },
  // WedMeGood
  { source: 'wedmegood', query: 'mehndi', city: 'Ahmedabad', maxResults: 50, category: 'mehndi' },
  // WeddingWire
  { source: 'weddingwire', query: 'mehndi', city: 'Ahmedabad', maxResults: 50, category: 'mehndi' },
]

// ─── Photography ────────────────────────────────────────────────
export const photographyQueries: ScrapeQuery[] = [
  // Google Maps
  { source: 'google_maps', query: 'wedding photographer', city: 'Ahmedabad', maxResults: 50, category: 'photography' },
  { source: 'google_maps', query: 'photography studio', city: 'Ahmedabad', maxResults: 30, category: 'photography' },
  { source: 'google_maps', query: 'pre wedding photographer', city: 'Ahmedabad', maxResults: 20, category: 'photography' },
  // Instagram
  { source: 'instagram', query: 'wedding photographer ahmedabad', city: 'Ahmedabad', maxResults: 40, category: 'photography' },
  { source: 'instagram', query: 'candid photographer ahmedabad', city: 'Ahmedabad', maxResults: 20, category: 'photography' },
  // Justdial
  { source: 'justdial', query: 'wedding photographer', city: 'Ahmedabad', maxResults: 50, category: 'photography' },
  { source: 'justdial', query: 'photography studio', city: 'Ahmedabad', maxResults: 30, category: 'photography' },
  // Sulekha
  { source: 'sulekha', query: 'wedding photographer', city: 'Ahmedabad', maxResults: 40, category: 'photography' },
  // WedMeGood
  { source: 'wedmegood', query: 'photographers', city: 'Ahmedabad', maxResults: 50, category: 'photography' },
  // WeddingWire
  { source: 'weddingwire', query: 'photographers', city: 'Ahmedabad', maxResults: 50, category: 'photography' },
]

// ─── Makeup Artists ─────────────────────────────────────────────
export const makeupQueries: ScrapeQuery[] = [
  // Google Maps
  { source: 'google_maps', query: 'bridal makeup artist', city: 'Ahmedabad', maxResults: 50, category: 'makeup' },
  { source: 'google_maps', query: 'makeup studio', city: 'Ahmedabad', maxResults: 30, category: 'makeup' },
  { source: 'google_maps', query: 'beauty parlour bridal', city: 'Ahmedabad', maxResults: 20, category: 'makeup' },
  // Instagram
  { source: 'instagram', query: 'bridal makeup ahmedabad', city: 'Ahmedabad', maxResults: 40, category: 'makeup' },
  { source: 'instagram', query: 'makeup artist ahmedabad', city: 'Ahmedabad', maxResults: 20, category: 'makeup' },
  // Justdial
  { source: 'justdial', query: 'bridal makeup artist', city: 'Ahmedabad', maxResults: 50, category: 'makeup' },
  { source: 'justdial', query: 'makeup studio', city: 'Ahmedabad', maxResults: 30, category: 'makeup' },
  // Sulekha
  { source: 'sulekha', query: 'bridal makeup artist', city: 'Ahmedabad', maxResults: 40, category: 'makeup' },
  // WedMeGood
  { source: 'wedmegood', query: 'makeup-artists', city: 'Ahmedabad', maxResults: 50, category: 'makeup' },
  // WeddingWire
  { source: 'weddingwire', query: 'makeup-artists', city: 'Ahmedabad', maxResults: 50, category: 'makeup' },
]

// ─── Decorators ─────────────────────────────────────────────────
export const decorQueries: ScrapeQuery[] = [
  // Google Maps
  { source: 'google_maps', query: 'wedding decorator', city: 'Ahmedabad', maxResults: 50, category: 'decor' },
  { source: 'google_maps', query: 'wedding decoration', city: 'Ahmedabad', maxResults: 30, category: 'decor' },
  { source: 'google_maps', query: 'event decorator', city: 'Ahmedabad', maxResults: 20, category: 'decor' },
  // Instagram
  { source: 'instagram', query: 'wedding decorator ahmedabad', city: 'Ahmedabad', maxResults: 40, category: 'decor' },
  { source: 'instagram', query: 'wedding decor ahmedabad', city: 'Ahmedabad', maxResults: 20, category: 'decor' },
  // Justdial
  { source: 'justdial', query: 'wedding decorator', city: 'Ahmedabad', maxResults: 50, category: 'decor' },
  { source: 'justdial', query: 'event decorator', city: 'Ahmedabad', maxResults: 30, category: 'decor' },
  // Sulekha
  { source: 'sulekha', query: 'wedding decorator', city: 'Ahmedabad', maxResults: 40, category: 'decor' },
  // WedMeGood
  { source: 'wedmegood', query: 'wedding-decorators', city: 'Ahmedabad', maxResults: 50, category: 'decor' },
  // WeddingWire
  { source: 'weddingwire', query: 'wedding-decorators', city: 'Ahmedabad', maxResults: 50, category: 'decor' },
]

// ─── Music / DJ ─────────────────────────────────────────────────
export const musicQueries: ScrapeQuery[] = [
  // Google Maps
  { source: 'google_maps', query: 'wedding band', city: 'Ahmedabad', maxResults: 30, category: 'music' },
  { source: 'google_maps', query: 'wedding DJ', city: 'Ahmedabad', maxResults: 40, category: 'music' },
  { source: 'google_maps', query: 'live band wedding', city: 'Ahmedabad', maxResults: 20, category: 'music' },
  // Instagram
  { source: 'instagram', query: 'wedding DJ ahmedabad', city: 'Ahmedabad', maxResults: 30, category: 'music' },
  { source: 'instagram', query: 'wedding band ahmedabad', city: 'Ahmedabad', maxResults: 20, category: 'music' },
  // Justdial
  { source: 'justdial', query: 'wedding DJ', city: 'Ahmedabad', maxResults: 40, category: 'music' },
  { source: 'justdial', query: 'wedding band', city: 'Ahmedabad', maxResults: 30, category: 'music' },
  // Sulekha
  { source: 'sulekha', query: 'wedding DJ', city: 'Ahmedabad', maxResults: 30, category: 'music' },
  // WedMeGood
  { source: 'wedmegood', query: 'djs', city: 'Ahmedabad', maxResults: 40, category: 'music' },
  { source: 'wedmegood', query: 'wedding-bands', city: 'Ahmedabad', maxResults: 30, category: 'music' },
  // WeddingWire
  { source: 'weddingwire', query: 'djs', city: 'Ahmedabad', maxResults: 40, category: 'music' },
]

// ─── All Queries Combined ───────────────────────────────────────
export const allQueries: ScrapeQuery[] = [
  ...mehndiQueries,
  ...photographyQueries,
  ...makeupQueries,
  ...decorQueries,
  ...musicQueries,
]

// ─── Summary ────────────────────────────────────────────────────
export const scrapeSummary = {
  services: ['Mehndi', 'Photography', 'Makeup', 'Decor', 'Music'],
  sources: ['google_maps', 'instagram', 'justdial', 'sulekha', 'wedmegood', 'weddingwire'],
  city: 'Ahmedabad',
  totalQueries: allQueries.length,
  estimatedResults: allQueries.reduce((sum, q) => sum + q.maxResults, 0),
}
