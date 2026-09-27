import type { Scraper, ScrapingSource, ScrapeParams, ScrapedArtist } from '../types'
import { GoogleMapsScraper } from './google-maps'
import { InstagramScraper } from './instagram'
import { JustdialScraper } from './justdial'
import { SulekhaScraper } from './sulekha'
import { WedMeGoodScraper } from './wedmegood'
import { WeddingWireScraper } from './weddingwire'

const scraperClasses: Record<ScrapingSource, new () => Scraper> = {
  google_maps: GoogleMapsScraper,
  instagram: InstagramScraper,
  justdial: JustdialScraper,
  sulekha: SulekhaScraper,
  wedmegood: WedMeGoodScraper,
  weddingwire: WeddingWireScraper,
}

export async function runScrape(
  source: ScrapingSource,
  params: ScrapeParams
): Promise<{ artists: ScrapedArtist[]; error?: string }> {
  const ScraperClass = scraperClasses[source]

  if (!ScraperClass) {
    return { artists: [], error: `Scraper for ${source} is not implemented yet` }
  }

  try {
    const scraper = new ScraperClass()
    console.log(`[Scraper] Running ${source} scraper for "${params.query}"...`)
    const artists = await scraper.scrape(params)
    return { artists }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Scraper] ${source} failed for "${params.query}":`, message)
    return { artists: [], error: message }
  }
}

export { GoogleMapsScraper } from './google-maps'
export { InstagramScraper } from './instagram'
export { JustdialScraper } from './justdial'
export { SulekhaScraper } from './sulekha'
export { WedMeGoodScraper } from './wedmegood'
export { WeddingWireScraper } from './weddingwire'
