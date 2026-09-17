import type { Scraper, ScrapingSource, ScrapeParams, ScrapedArtist } from '../types'
import { GoogleMapsScraper } from './google-maps'
import { InstagramScraper } from './instagram'
import { JustdialScraper } from './justdial'
import { SulekhaScraper } from './sulekha'
import { WedMeGoodScraper } from './wedmegood'
import { WeddingWireScraper } from './weddingwire'

const scrapers: Record<ScrapingSource, Scraper> = {
  google_maps: new GoogleMapsScraper(),
  instagram: new InstagramScraper(),
  justdial: new JustdialScraper(),
  sulekha: new SulekhaScraper(),
  wedmegood: new WedMeGoodScraper(),
  weddingwire: new WeddingWireScraper(),
}

export async function runScrape(
  source: ScrapingSource,
  params: ScrapeParams
): Promise<{ artists: ScrapedArtist[]; error?: string }> {
  const scraper = scrapers[source]
  
  if (!scraper) {
    return { artists: [], error: `Scraper for ${source} is not implemented yet` }
  }

  try {
    console.log(`[Scraper] Running ${source} scraper...`)
    const artists = await scraper.scrape(params)
    return { artists }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Scraper] ${source} failed:`, message)
    return { artists: [], error: message }
  }
}

export { GoogleMapsScraper } from './google-maps'
export { InstagramScraper } from './instagram'
export { JustdialScraper } from './justdial'
export { SulekhaScraper } from './sulekha'
export { WedMeGoodScraper } from './wedmegood'
export { WeddingWireScraper } from './weddingwire'
