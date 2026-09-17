import { chromium, type Browser, type Page } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class SulekhaScraper implements Scraper {
  source = 'sulekha' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[Sulekha] Starting scrape: "${query}" in ${city}`)

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

      // Sulekha URL pattern: https://www.sulekha.com/{category}/{city}
      const citySlug = city.toLowerCase().replace(/\s+/g, '-')
      const querySlug = query.toLowerCase().replace(/\s+/g, '-')
      
      // Try the search page first
      const searchUrl = `https://www.sulekha.com/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' })
      await sleep(3000)

      // If search doesn't work, try category page
      if (page.url().includes('sulekha.com') && !page.url().includes('search')) {
        const categoryUrl = `https://www.sulekha.com/${querySlug}/${citySlug}`
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded' })
        await sleep(3000)
      }

      // Scroll to load more results
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

      // Extract listing cards - Sulekha uses various class patterns
      const listingSelectors = [
        '.listing-item',
        '.result-item', 
        '.business-card',
        '[class*="listing"]',
        '[class*="vendor"]',
        '.serp-card',
      ]

      let listings: any[] = []
      for (const selector of listingSelectors) {
        listings = await page.locator(selector).all()
        if (listings.length > 0) break
      }

      for (const listing of listings.slice(0, maxResults)) {
        try {
          const artist = await this.extractListing(listing, params)
          if (artist) results.push(artist)
        } catch (err) {
          console.log(`[Sulekha] Error on listing: ${err}`)
        }
      }

      // If no listings found via selectors, try extracting from page content
      if (results.length === 0) {
        console.log('[Sulekha] No listings found via selectors, trying page content extraction')
        const pageResults = await this.extractFromPageContent(page, params)
        results.push(...pageResults)
      }

    } catch (error) {
      console.error('[Sulekha] Scrape error:', error)
      throw error
    } finally {
      await this.browser?.close()
      this.browser = null
    }

    console.log(`[Sulekha] Found ${results.length} results`)
    return results
  }

  private async extractListing(listing: any, params: ScrapeParams): Promise<ScrapedArtist | null> {
    try {
      // Business name
      const nameEl = listing.locator('h2 a, h3 a, .listing-title a, .business-name, [class*="title"] a').first()
      const name = await nameEl.textContent()
      if (!name?.trim()) return null

      // Detail URL
      let detailUrl: string | undefined
      try {
        detailUrl = await nameEl.getAttribute('href')
        if (detailUrl && !detailUrl.startsWith('http')) {
          detailUrl = `https://www.sulekha.com${detailUrl}`
        }
      } catch {}

      // Phone - look for phone patterns
      let phone: string | undefined
      try {
        const phoneEl = listing.locator('[class*="phone"], [class*="contact"], a[href^="tel:"]').first()
        const phoneText = await phoneEl.textContent()
        if (phoneText) {
          const match = phoneText.match(/(\+91[\s-]?\d{10}|\d{10})/)
          if (match) phone = match[1].replace(/[^\d]/g, '')
          if (phone?.length === 10) phone = `+91${phone}`
        }
      } catch {}

      // Try tel: link
      if (!phone) {
        try {
          const telLink = await listing.locator('a[href^="tel:"]').first().getAttribute('href')
          if (telLink) {
            phone = telLink.replace('tel:', '').replace(/[^\d+]/g, '')
          }
        } catch {}
      }

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
        const reviewEl = listing.locator('[class*="review"], [class*="rating-count"]').first()
        const reviewText = await reviewEl.textContent()
        if (reviewText) {
          const match = reviewText.match(/(\d+)/)
          if (match) reviewCount = parseInt(match[1])
        }
      } catch {}

      // Address
      let area: string | undefined
      try {
        area = await listing.locator('[class*="address"], [class*="location"]').first().textContent()
      } catch {}

      // Category / services
      let specializations: string | undefined
      try {
        specializations = await listing.locator('[class*="category"], [class*="service"], [class*="type"]').first().textContent()
      } catch {}

      return {
        name: name.trim(),
        source: 'sulekha',
        sourceUrl: detailUrl,
        phone,
        whatsappNumber: phone, // In India, business phone = WhatsApp
        city: params.city || 'Ahmedabad',
        area: area?.trim(),
        state: 'Gujarat',
        rating,
        reviewCount,
        specializations,
        services: params.query ? [{ name: params.query }] : undefined,
      }
    } catch {
      return null
    }
  }

  private async extractFromPageContent(page: Page, params: ScrapeParams): Promise<ScrapedArtist[]> {
    const results: ScrapedArtist[] = []
    
    try {
      // Try to find any links that look like business profiles
      const links = await page.locator('a[href*="/profile/"], a[href*="/business/"], a[href*="/vendor/"]').all()
      
      for (const link of links.slice(0, params.maxResults || 20)) {
        try {
          const name = await link.textContent()
          const href = await link.getAttribute('href')
          if (name?.trim() && href) {
            results.push({
              name: name.trim(),
              source: 'sulekha',
              sourceUrl: href.startsWith('http') ? href : `https://www.sulekha.com${href}`,
              city: params.city || 'Ahmedabad',
              state: 'Gujarat',
              services: params.query ? [{ name: params.query }] : undefined,
            })
          }
        } catch {}
      }
    } catch {}

    return results
  }
}
