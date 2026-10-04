import type { Browser } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'
import { launchBrowser, BROWSER_CONTEXT_OPTIONS, jitteredSleep, retryWithBackoff, normalizePhone, parsePriceRange } from './utils'

export class WeddingWireScraper implements Scraper {
  source = 'weddingwire' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[WeddingWire] Starting scrape: "${query}" in ${city}`)

    try {
      this.browser = await launchBrowser()
      const context = await this.browser.newContext(BROWSER_CONTEXT_OPTIONS)
      const page = await context.newPage()

      const citySlug = city.toLowerCase().replace(/\s+/g, '-')
      const categoryMap: Record<string, string> = {
        mehndi: 'mehndi-artists',
        makeup: 'makeup-artists',
        decor: 'wedding-decorators',
      }

      const categoryLower = query.toLowerCase()
      let categorySlug = 'vendors'
      for (const [key, slug] of Object.entries(categoryMap)) {
        if (categoryLower.includes(key)) {
          categorySlug = slug
          break
        }
      }

      const url = `https://www.weddingwire.in/${categorySlug}/${citySlug}`
      console.log(`[WeddingWire] Navigating to: ${url}`)

      await retryWithBackoff(() =>
        page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      )
      await jitteredSleep(3000)

      let previousHeight = 0
      let scrollAttempts = 0
      while (results.length < maxResults && scrollAttempts < 8) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await jitteredSleep(1500)
        const currentHeight = (await page.evaluate('document.body.scrollHeight')) as number
        if (currentHeight === previousHeight) break
        previousHeight = currentHeight
        scrollAttempts++
      }

      const listingSelectors = [
        '.vendor-card',
        '.storeCard',
        '[class*="vendor"]',
        '[class*="listing"]',
        '.result-item',
        'article',
      ]

      let listings: any[] = []
      for (const selector of listingSelectors) {
        listings = await page.locator(selector).all()
        if (listings.length > 0) break
      }

      console.log(`[WeddingWire] Found ${listings.length} listing elements`)

      for (const listing of listings.slice(0, maxResults)) {
        try {
          const nameEl = listing
            .locator('h2 a, h3 a, .vendor-name, [class*="name"] a, [class*="title"] a')
            .first()
          const name = await nameEl.textContent()
          if (!name?.trim()) continue

          let detailUrl: string | undefined
          try {
            detailUrl = await nameEl.getAttribute('href')
            if (detailUrl && !detailUrl.startsWith('http')) {
              detailUrl = `https://www.weddingwire.in${detailUrl}`
            }
          } catch {}

          let priceRange: ScrapedArtist['priceRange'] = 'unknown'
          try {
            const priceText = await listing
              .locator('[class*="price"], [class*="budget"], [class*="cost"]')
              .first()
              .textContent()
            priceRange = parsePriceRange(priceText)
          } catch {}

          let rating: number | undefined
          let reviewCount: number | undefined
          try {
            const ratingText = await listing
              .locator('[class*="rating"], [class*="star"], [class*="review-count"]')
              .first()
              .textContent()
            if (ratingText) {
              const match = ratingText.match(/([\d.]+)/)
              if (match) rating = Math.min(5, parseFloat(match[1]))
            }
            const reviewText = await listing.locator('[class*="review"]').first().textContent()
            if (reviewText) {
              const match = reviewText.match(/(\d+)/)
              if (match) reviewCount = parseInt(match[1])
            }
          } catch {}

          let area: string | undefined
          try {
            area = await listing
              .locator('[class*="location"], [class*="address"], [class*="city"]')
              .first()
              .textContent()
          } catch {}

          let phone: string | undefined
          try {
            const telHref = await listing
              .locator('a[href^="tel:"]')
              .first()
              .getAttribute('href')
            if (telHref) phone = normalizePhone(telHref.replace('tel:', ''))
          } catch {}

          results.push({
            name: name.trim(),
            source: 'weddingwire',
            sourceUrl: detailUrl,
            phone,
            whatsappNumber: phone,
            city: params.city || 'Ahmedabad',
            area: area?.trim()?.split(',')[0],
            state: 'Gujarat',
            priceRange,
            rating,
            reviewCount,
            services: params.query ? [{ name: params.query }] : undefined,
          })
        } catch (err) {
          console.log(`[WeddingWire] Error on listing: ${err}`)
        }
      }
    } catch (error) {
      console.error('[WeddingWire] Scrape error:', error)
      throw error
    } finally {
      await this.browser?.close()
      this.browser = null
    }

    console.log(`[WeddingWire] Found ${results.length} results`)
    return results
  }
}
