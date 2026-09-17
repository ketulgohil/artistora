import { chromium, type Browser, type Page } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class JustdialScraper implements Scraper {
  source = 'justdial' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[Justdial] Starting scrape: "${query}" in ${city}`)

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

      // Justdial URL pattern
      const citySlug = city.toLowerCase().replace(/\s+/g, '-')
      const querySlug = query.toLowerCase().replace(/\s+/g, '-')
      const url = `https://www.justdial.com/${citySlug}/${querySlug}`

      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await sleep(3000)

      // Scroll to load results
      let previousHeight = 0
      let scrollAttempts = 0

      while (results.length < maxResults && scrollAttempts < 10) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await sleep(1500)
        
        const currentHeight = await page.evaluate('document.body.scrollHeight') as number
        if (currentHeight === previousHeight) break
        previousHeight = currentHeight
        scrollAttempts++
      }

      // Extract listing cards
      const listings = await page.locator('.resultbox_info, .store-details, [class*="resultBox"]').all()

      for (const listing of listings.slice(0, maxResults)) {
        try {
          const artist = await this.extractListing(page, listing, params)
          if (artist) results.push(artist)
        } catch (err) {
          console.log(`[Justdial] Error on listing: ${err}`)
        }
      }

    } catch (error) {
      console.error('[Justdial] Scrape error:', error)
      throw error
    } finally {
      await this.browser?.close()
      this.browser = null
    }

    console.log(`[Justdial] Found ${results.length} results`)
    return results
  }

  private async extractListing(page: Page, listing: any, params: ScrapeParams): Promise<ScrapedArtist | null> {
    try {
      // Business name
      const name = await listing.locator('.resultbox_name span, .store-name, h2 a, h3 a').first().textContent()
      if (!name?.trim()) return null

      // Phone (often hidden behind a click-to-reveal)
      let phone: string | undefined
      try {
        // Try clicking to reveal phone
        const phoneBtn = listing.locator('.phone-btn, [class*="phone"], a[href^="tel:"]').first()
        await phoneBtn.click()
        await sleep(500)
        
        const phoneEl = listing.locator('.phone_number span, [class*="phoneNum"], .tel-info').first()
        const phoneText = await phoneEl.textContent()
        if (phoneText) {
          phone = phoneText.replace(/[^\d+]/g, '')
        }
      } catch {}

      // If phone not found via click, try href
      if (!phone) {
        const telLink = await listing.locator('a[href^="tel:"]').first().getAttribute('href')
        if (telLink) phone = telLink.replace('tel:', '').trim()
      }

      // Rating
      let rating: number | undefined
      let reviewCount: number | undefined
      try {
        const ratingText = await listing.locator('.resultbox_rating, .rating-stars, [class*="rating"]').first().textContent()
        if (ratingText) {
          const match = ratingText.match(/([\d.]+)/)
          if (match) rating = parseFloat(match[1])
        }
        const reviewText = await listing.locator('.resultbox_reviews, [class*="review"]').first().textContent()
        if (reviewText) {
          const match = reviewText.match(/(\d+)/)
          if (match) reviewCount = parseInt(match[1])
        }
      } catch {}

      // Address
      let area: string | undefined
      try {
        area = await listing.locator('.resultbox_address, .address, [class*="address"]').first().textContent()
      } catch {}

      // Get detail page URL
      let detailUrl: string | undefined
      try {
        detailUrl = await listing.locator('a[href]').first().getAttribute('href')
        if (detailUrl && !detailUrl.startsWith('http')) {
          detailUrl = `https://www.justdial.com${detailUrl}`
        }
      } catch {}

      return {
        name: name.trim(),
        source: 'justdial',
        sourceUrl: detailUrl,
        phone,
        whatsappNumber: phone, // In India, business phone = WhatsApp
        city: params.city || 'Ahmedabad',
        area: area?.trim(),
        state: 'Gujarat',
        rating,
        reviewCount,
        services: params.query ? [{ name: params.query }] : undefined,
      }
    } catch (error) {
      return null
    }
  }
}
