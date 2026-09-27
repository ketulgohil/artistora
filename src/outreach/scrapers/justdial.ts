import type { Browser, Page } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'
import { launchBrowser, BROWSER_CONTEXT_OPTIONS, jitteredSleep, retryWithBackoff, normalizePhone } from './utils'

export class JustdialScraper implements Scraper {
  source = 'justdial' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[Justdial] Starting scrape: "${query}" in ${city}`)

    try {
      this.browser = await launchBrowser()
      const context = await this.browser.newContext(BROWSER_CONTEXT_OPTIONS)
      const page = await context.newPage()

      const citySlug = city.toLowerCase().replace(/\s+/g, '-')
      const querySlug = query.toLowerCase().replace(/\s+/g, '-')
      const url = `https://www.justdial.com/${citySlug}/${querySlug}`

      await retryWithBackoff(() =>
        page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      )
      await jitteredSleep(3000)

      let previousHeight = 0
      let scrollAttempts = 0
      while (results.length < maxResults && scrollAttempts < 10) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await jitteredSleep(1500)
        const currentHeight = (await page.evaluate('document.body.scrollHeight')) as number
        if (currentHeight === previousHeight) break
        previousHeight = currentHeight
        scrollAttempts++
      }

      const listings = await page
        .locator('.resultbox_info, .store-details, [class*="resultBox"]')
        .all()

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

  private async extractListing(
    page: Page,
    listing: any,
    params: ScrapeParams,
  ): Promise<ScrapedArtist | null> {
    try {
      const name = await listing
        .locator('.resultbox_name span, .store-name, h2 a, h3 a')
        .first()
        .textContent()
      if (!name?.trim()) return null

      let phone: string | undefined
      try {
        const phoneBtn = listing
          .locator('.phone-btn, [class*="phone"], a[href^="tel:"]')
          .first()
        await phoneBtn.click()
        // Wait for the phone number element to become visible after click
        const phoneEl = listing.locator('.phone_number span, [class*="phoneNum"], .tel-info').first()
        await phoneEl.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
        const phoneText = await phoneEl.textContent().catch(() => null)
        if (phoneText) phone = normalizePhone(phoneText)
      } catch {}

      if (!phone) {
        try {
          const telHref = await listing.locator('a[href^="tel:"]').first().getAttribute('href')
          if (telHref) phone = normalizePhone(telHref.replace('tel:', ''))
        } catch {}
      }

      let rating: number | undefined
      let reviewCount: number | undefined
      try {
        const ratingText = await listing
          .locator('.resultbox_rating, .rating-stars, [class*="rating"]')
          .first()
          .textContent()
        if (ratingText) {
          const match = ratingText.match(/([\d.]+)/)
          if (match) rating = Math.min(5, parseFloat(match[1]))
        }
        const reviewText = await listing
          .locator('.resultbox_reviews, [class*="review"]')
          .first()
          .textContent()
        if (reviewText) {
          const match = reviewText.match(/(\d+)/)
          if (match) reviewCount = parseInt(match[1])
        }
      } catch {}

      let area: string | undefined
      try {
        area = await listing
          .locator('.resultbox_address, .address, [class*="address"]')
          .first()
          .textContent()
      } catch {}

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
        whatsappNumber: phone,
        city: params.city || 'Ahmedabad',
        area: area?.trim(),
        state: 'Gujarat',
        rating,
        reviewCount,
        services: params.query ? [{ name: params.query }] : undefined,
      }
    } catch {
      return null
    }
  }
}
