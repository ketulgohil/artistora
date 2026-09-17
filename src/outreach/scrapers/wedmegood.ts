import { chromium, type Browser, type Page } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class WedMeGoodScraper implements Scraper {
  source = 'wedmegood' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[WedMeGood] Starting scrape: "${query}" in ${city}`)

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        locale: 'en-IN',
        timezoneId: 'Asia/Kolkata',
      })

      const page = await context.newPage()

      // WedMeGood URL pattern: https://www.wedmegood.com/{category}-{city}
      const citySlug = city.toLowerCase().replace(/\s+/g, '-')
      const categoryMap: Record<string, string> = {
        mehndi: 'mehndi-artists',
        photography: 'photographers',
        makeup: 'makeup-artists',
        decor: 'wedding-decorators',
        music: 'wedding-bands',
        dj: 'djs',
        videography: 'videographers',
        anchoring: 'anchors',
      }

      const categoryLower = query.toLowerCase()
      let categorySlug = 'vendors'
      for (const [key, slug] of Object.entries(categoryMap)) {
        if (categoryLower.includes(key)) {
          categorySlug = slug
          break
        }
      }

      const url = `https://www.wedmegood.com/${categorySlug}/${citySlug}`
      console.log(`[WedMeGood] Navigating to: ${url}`)
      
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await sleep(3000)

      // Scroll to load more
      let previousHeight = 0
      let scrollAttempts = 0
      while (results.length < maxResults && scrollAttempts < 8) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await sleep(1500)
        const currentHeight = await page.evaluate('document.body.scrollHeight') as number
        if (currentHeight === previousHeight) break
        previousHeight = currentHeight
        scrollAttempts++
      }

      // Extract vendor cards
      const listingSelectors = [
        '.vendor-card',
        '.listing-card',
        '[class*="vendorItem"]',
        '[class*="listing-item"]',
        '.result-card',
        'article',
      ]

      let listings: any[] = []
      for (const selector of listingSelectors) {
        listings = await page.locator(selector).all()
        if (listings.length > 0) break
      }

      console.log(`[WedMeGood] Found ${listings.length} listing elements`)

      for (const listing of listings.slice(0, maxResults)) {
        try {
          const artist = await this.extractListing(listing, params)
          if (artist) results.push(artist)
        } catch (err) {
          console.log(`[WedMeGood] Error on listing: ${err}`)
        }
      }

    } catch (error) {
      console.error('[WedMeGood] Scrape error:', error)
      throw error
    } finally {
      await this.browser?.close()
      this.browser = null
    }

    console.log(`[WedMeGood] Found ${results.length} results`)
    return results
  }

  private async extractListing(listing: any, params: ScrapeParams): Promise<ScrapedArtist | null> {
    try {
      // Vendor name
      const nameEl = listing.locator('h2 a, h3 a, .vendor-name, .listing-title, [class*="name"] a').first()
      const name = await nameEl.textContent()
      if (!name?.trim()) return null

      // Detail URL
      let detailUrl: string | undefined
      try {
        detailUrl = await nameEl.getAttribute('href')
        if (detailUrl && !detailUrl.startsWith('http')) {
          detailUrl = `https://www.wedmegood.com${detailUrl}`
        }
      } catch {}

      // Price range
      let priceRange: ScrapedArtist['priceRange'] = 'unknown'
      try {
        const priceEl = listing.locator('[class*="price"], [class*="budget"]').first()
        const priceText = await priceEl.textContent()
        if (priceText) {
          if (priceText.includes('₹')) {
            const numMatch = priceText.match(/(\d+)/)
            if (numMatch) {
              const num = parseInt(numMatch[1])
              if (num < 10000) priceRange = 'budget'
              else if (num < 50000) priceRange = 'mid'
              else if (num < 100000) priceRange = 'premium'
              else priceRange = 'luxury'
            }
          }
        }
      } catch {}

      // Rating
      let rating: number | undefined
      let reviewCount: number | undefined
      try {
        const ratingEl = listing.locator('[class*="rating"], [class*="star"], .score').first()
        const ratingText = await ratingEl.textContent()
        if (ratingText) {
          const match = ratingText.match(/([\d.]+)/)
          if (match) rating = parseFloat(match[1])
        }
        const reviewEl = listing.locator('[class*="review"]').first()
        const reviewText = await reviewEl.textContent()
        if (reviewText) {
          const match = reviewText.match(/(\d+)/)
          if (match) reviewCount = parseInt(match[1])
        }
      } catch {}

      // Location
      let area: string | undefined
      try {
        area = await listing.locator('[class*="location"], [class*="address"], [class*="city"]').first().textContent()
      } catch {}

      // Profile image / portfolio
      const portfolioImages: Array<{ url: string }> = []
      try {
        const imgs = await listing.locator('img[src]').all()
        for (const img of imgs.slice(0, 3)) {
          const src = await img.getAttribute('src')
          if (src && !src.includes('logo') && !src.includes('icon') && src.includes('http')) {
            portfolioImages.push({ url: src })
          }
        }
      } catch {}

      return {
        name: name.trim(),
        source: 'wedmegood',
        sourceUrl: detailUrl,
        city: params.city || 'Ahmedabad',
        area: area?.trim()?.split(',')[0],
        state: 'Gujarat',
        priceRange,
        rating,
        reviewCount,
        portfolioImages: portfolioImages.length > 0 ? portfolioImages : undefined,
        services: params.query ? [{ name: params.query }] : undefined,
      }
    } catch {
      return null
    }
  }
}
