/**
 * Pre-built scrape configurations for all Artistora service categories.
 * Each config defines search queries optimized for each scraping source.
 *
 * Services: Mehndi, Makeup, Decor
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
  // Google Maps (Core + Locality-specific)
  {
    source: 'google_maps',
    query: 'mehndi artist',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'henna artist',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'bridal mehndi',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Satellite',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Bopal',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Vastrapur',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Maninagar',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Prahlad Nagar',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Chandkheda',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Naroda',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  {
    source: 'google_maps',
    query: 'mehndi artist Naranpura',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  // Instagram
  {
    source: 'instagram',
    query: 'mehndi artist ahmedabad',
    city: 'Ahmedabad',
    maxResults: 40,
    category: 'mehndi',
  },
  {
    source: 'instagram',
    query: 'henna artist ahmedabad',
    city: 'Ahmedabad',
    maxResults: 20,
    category: 'mehndi',
  },
  // Justdial
  {
    source: 'justdial',
    query: 'mehndi artist',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'mehndi',
  },
  {
    source: 'justdial',
    query: 'bridal mehndi designer',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'mehndi',
  },
  // Sulekha
  {
    source: 'sulekha',
    query: 'mehndi artist',
    city: 'Ahmedabad',
    maxResults: 40,
    category: 'mehndi',
  },
  // WedMeGood
  { source: 'wedmegood', query: 'mehndi', city: 'Ahmedabad', maxResults: 50, category: 'mehndi' },
  // WeddingWire
  { source: 'weddingwire', query: 'mehndi', city: 'Ahmedabad', maxResults: 50, category: 'mehndi' },
]

// ─── Makeup Artists ─────────────────────────────────────────────
export const makeupQueries: ScrapeQuery[] = [
  // Google Maps (Core + Locality-specific)
  {
    source: 'google_maps',
    query: 'bridal makeup artist',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'makeup studio',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'beauty parlour bridal',
    city: 'Ahmedabad',
    maxResults: 20,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'bridal makeup artist Satellite',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'bridal makeup artist Bopal',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'bridal makeup artist Vastrapur',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'bridal makeup artist Prahlad Nagar',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'bridal makeup artist Bodakdev',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'bridal makeup artist Maninagar',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  {
    source: 'google_maps',
    query: 'bridal makeup artist Sindhu Bhavan',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  // Instagram
  {
    source: 'instagram',
    query: 'bridal makeup ahmedabad',
    city: 'Ahmedabad',
    maxResults: 40,
    category: 'makeup',
  },
  {
    source: 'instagram',
    query: 'makeup artist ahmedabad',
    city: 'Ahmedabad',
    maxResults: 20,
    category: 'makeup',
  },
  // Justdial
  {
    source: 'justdial',
    query: 'bridal makeup artist',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'makeup',
  },
  {
    source: 'justdial',
    query: 'makeup studio',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'makeup',
  },
  // Sulekha
  {
    source: 'sulekha',
    query: 'bridal makeup artist',
    city: 'Ahmedabad',
    maxResults: 40,
    category: 'makeup',
  },
  // WedMeGood
  {
    source: 'wedmegood',
    query: 'makeup-artists',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'makeup',
  },
  // WeddingWire
  {
    source: 'weddingwire',
    query: 'makeup-artists',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'makeup',
  },
]

// ─── Decorators ─────────────────────────────────────────────────
export const decorQueries: ScrapeQuery[] = [
  // Google Maps (Core + Locality-specific)
  {
    source: 'google_maps',
    query: 'wedding decorator',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'wedding decoration',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'event decorator',
    city: 'Ahmedabad',
    maxResults: 20,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'wedding decorator Satellite',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'wedding decorator Bopal',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'wedding decorator SG Highway',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'wedding decorator Sindhu Bhavan',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'wedding decorator Prahlad Nagar',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'wedding decorator Maninagar',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  {
    source: 'google_maps',
    query: 'mandap decorator',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  // Instagram
  {
    source: 'instagram',
    query: 'wedding decorator ahmedabad',
    city: 'Ahmedabad',
    maxResults: 40,
    category: 'decor',
  },
  {
    source: 'instagram',
    query: 'wedding decor ahmedabad',
    city: 'Ahmedabad',
    maxResults: 20,
    category: 'decor',
  },
  // Justdial
  {
    source: 'justdial',
    query: 'wedding decorator',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'decor',
  },
  {
    source: 'justdial',
    query: 'event decorator',
    city: 'Ahmedabad',
    maxResults: 30,
    category: 'decor',
  },
  // Sulekha
  {
    source: 'sulekha',
    query: 'wedding decorator',
    city: 'Ahmedabad',
    maxResults: 40,
    category: 'decor',
  },
  // WedMeGood
  {
    source: 'wedmegood',
    query: 'wedding-decorators',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'decor',
  },
  // WeddingWire
  {
    source: 'weddingwire',
    query: 'wedding-decorators',
    city: 'Ahmedabad',
    maxResults: 50,
    category: 'decor',
  },
]

// ─── All Queries Combined ───────────────────────────────────────
export const allQueries: ScrapeQuery[] = [...mehndiQueries, ...makeupQueries, ...decorQueries]

// ─── Summary ────────────────────────────────────────────────────
export const scrapeSummary = {
  services: ['Mehndi', 'Makeup', 'Decor'],
  sources: ['google_maps', 'instagram', 'justdial', 'sulekha', 'wedmegood', 'weddingwire'],
  city: 'Ahmedabad',
  totalQueries: allQueries.length,
  estimatedResults: allQueries.reduce((sum, q) => sum + q.maxResults, 0),
}
