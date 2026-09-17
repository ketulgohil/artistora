import { chromium, type Browser, type Page } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class GoogleMapsScraper implements Scraper {
  source = 'google_maps' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[GoogleMaps] Starting scrape: "${query}" in ${city}`)

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      })

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'en-IN',
        timezoneId: 'Asia/Kolkata',
      })

      const page = await context.newPage()

      // === PHASE 1: Collect all place URLs from search results ===
      const searchQuery = encodeURIComponent(`${query} in ${city}`)
      await page.goto(`https://www.google.com/maps/search/${searchQuery}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      await sleep(4000)

      const feedSelector = '[role="feed"]'
      try {
        await page.waitForSelector(feedSelector, { timeout: 10000 })
      } catch {
        console.log('[GoogleMaps] No feed found')
      }

      // Collect unique place URLs by scrolling
      const placeUrls: Array<{ name: string; href: string }> = []
      const seenUrls = new Set<string>()
      let scrollAttempts = 0
      const maxScrolls = 10

      while (placeUrls.length < maxResults && scrollAttempts < maxScrolls) {
        const resultLinks = await page.locator(
          'a[href*="/maps/place"], div.Nv2PK a, div.tH5CWc a, div.THOPZb a, a.hfpxzc'
        ).all()

        console.log(`[GoogleMaps] Found ${resultLinks.length} result links on scroll ${scrollAttempts}`)

        for (const link of resultLinks) {
          if (placeUrls.length >= maxResults) break

          try {
            const href = await link.getAttribute('href')
            if (!href || !href.includes('/maps/place/') || seenUrls.has(href)) continue

            let name = await link.getAttribute('aria-label') || ''
            if (!name) {
              name = await link.locator('div[aria-hidden="true"]').first().textContent() || ''
            }
            if (!name.trim()) continue

            seenUrls.add(href)
            placeUrls.push({ name: name.trim(), href })
          } catch {
            continue
          }
        }

        // Scroll for more results
        try {
          const feed = page.locator(feedSelector).first()
          await feed.evaluate((el) => { el.scrollTop = el.scrollHeight })
          await sleep(2500)
          scrollAttempts++
        } catch {
          break
        }
      }

      console.log(`[GoogleMaps] Collected ${placeUrls.length} place URLs, now visiting each...`)

      // === PHASE 2: Visit each place URL and extract details ===
      for (let i = 0; i < placeUrls.length; i++) {
        const { name, href } = placeUrls[i]
        try {
          await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 15000 })
          await sleep(2500)

          const artist = await this.extractPlaceDetails(page, name, params)

          // Extract sourceId from URL
          const cidMatch = href.match(/!1s(0x[0-9a-f]+)/i)
          const sourceId = cidMatch ? cidMatch[1] : undefined

          if (artist) {
            artist.sourceId = sourceId
            results.push(artist)
            console.log(`[GoogleMaps] [${i + 1}/${placeUrls.length}] ${artist.name} — phone: ${artist.phone || 'none'}`)
          }
        } catch (err) {
          console.log(`[GoogleMaps] Error visiting ${name}: ${err}`)
          continue
        }
      }
    } catch (error) {
      console.error('[GoogleMaps] Scrape error:', error)
      throw error
    } finally {
      await this.browser?.close()
      this.browser = null
    }

    console.log(`[GoogleMaps] Found ${results.length} results total`)
    return results
  }

  private async extractPlaceDetails(
    page: Page,
    name: string,
    params: ScrapeParams
  ): Promise<ScrapedArtist | null> {
    try {
      // Use full page — on direct nav, details are in the page body
      const panel = page.locator('body')

      // Wait a bit for content to load
      await sleep(500)

      // Business name — Google Maps sometimes shows a different name in the header
      let businessName: string | undefined
      try {
        const bizNameSelectors = [
          'h1.DUwDvf',           // main heading in details panel
          'h1[class*="header"]',
          '[data-attrid="title"]',
          'h1',
        ]
        for (const sel of bizNameSelectors) {
          const el = panel.locator(sel).first()
          if (await el.count() > 0) {
            const text = (await el.textContent())?.trim()
            if (text && text !== name) {
              businessName = text
              break
            }
          }
        }
      } catch {}

      // Phone number — on direct nav, a[href^="tel:"] has the phone
      let phone: string | undefined
      try {
        // Priority 1: tel: link (most reliable on direct nav)
        const telLink = page.locator('a[href^="tel:"]').first()
        if (await telLink.count() > 0) {
          const href = await telLink.getAttribute('href')
          if (href && href.startsWith('tel:')) {
            phone = href.replace('tel:', '').replace(/[^\d+]/g, '')
          }
        }

        // Priority 2: page-wide text pattern fallback
        if (!phone || phone.length < 10) {
          const bodyText = await page.textContent('body')
          const phoneMatch = bodyText?.match(/(\+?91[\s-]?\d{5}[\s-]?\d{5}|\+?91[\s-]?\d{10}|0\d{10}|\d{10})/)
          if (phoneMatch) {
            phone = phoneMatch[1].replace(/[^\d+]/g, '')
          }
        }
      } catch {}

      // Website
      let website: string | undefined
      try {
        const websiteSelectors = [
          'a[data-item-id="authority"]',
          'a[aria-label*="Website"]',
          'a[aria-label*="website"]',
          '[data-item-id="authority"] a',
        ]
        for (const sel of websiteSelectors) {
          const el = page.locator(sel).first()
          if (await el.count() > 0) {
            website = await el.getAttribute('href') || undefined
            if (website) break
          }
        }
      } catch {}

      // Rating
      let rating: number | undefined
      let reviewCount: number | undefined
      try {
        const ratingSelectors = [
          '[role="img"][aria-label*="star"]',
          '[role="img"][aria-label*="Star"]',
          'span[aria-label*="star"]',
        ]
        for (const sel of ratingSelectors) {
          const el = page.locator(sel).first()
          if (await el.count() > 0) {
            const label = await el.getAttribute('aria-label') || ''
            const match = label.match(/([\d.]+)/)
            if (match) {
              rating = parseFloat(match[1])
              break
            }
          }
        }

        // Reviews count
        const reviewSelectors = [
          'span[aria-label*="review"]',
          'span[aria-label*="Review"]',
          'button[aria-label*="review"]',
        ]
        for (const sel of reviewSelectors) {
          const el = page.locator(sel).first()
          if (await el.count() > 0) {
            const text = await el.textContent()
            if (text) {
              const match = text.match(/(\d[\d,]*)/)
              if (match) {
                reviewCount = parseInt(match[1].replace(/,/g, ''))
                break
              }
            }
          }
        }
      } catch {}

      // Address
      let area: string | undefined
      try {
        const addrSelectors = [
          '[data-item-id="address"]',
          'button[data-item-id="address"]',
          '[aria-label*="Address"]',
          '[aria-label*="address"]',
        ]
        for (const sel of addrSelectors) {
          const el = page.locator(sel).first()
          if (await el.count() > 0) {
            area = (await el.textContent()) || undefined
            if (area) break
          }
        }
      } catch {}

      // Category / specializations
      let specializations: string | undefined
      try {
        // Google Maps shows category as a button or text in the details
        const catSelectors = [
          'button[jsaction*="category"]',
          'span.DkEaL',
          '[data-item-id="category"]',
        ]
        for (const sel of catSelectors) {
          const el = page.locator(sel).first()
          if (await el.count() > 0) {
            specializations = (await el.textContent()) || undefined
            if (specializations) break
          }
        }
      } catch {}

      // Instagram from links
      let instagramHandle: string | undefined
      try {
        const igLinks = await page.locator('a[href*="instagram.com"]').all()
        for (const link of igLinks) {
          const href = await link.getAttribute('href')
          if (href) {
            const igMatch = href.match(/instagram\.com\/([^/?#]+)/)
            if (igMatch && !['p', 'reel', 'stories', 'explore'].includes(igMatch[1])) {
              instagramHandle = igMatch[1]
              break
            }
          }
        }
      } catch {}

      // Map category
      const catLower = (specializations || params.query || '').toLowerCase()
      let serviceCategory: 'mehndi' | 'photography' | 'makeup' | 'decor' | 'music' | 'other' = 'other'
      if (catLower.includes('mehndi') || catLower.includes('henna')) serviceCategory = 'mehndi'
      else if (catLower.includes('photo')) serviceCategory = 'photography'
      else if (catLower.includes('makeup') || catLower.includes('beauty')) serviceCategory = 'makeup'
      else if (catLower.includes('decor') || catLower.includes('decoration')) serviceCategory = 'decor'
      else if (catLower.includes('music') || catLower.includes('dj')) serviceCategory = 'music'

      return {
        name,
        businessName,
        source: 'google_maps',
        sourceUrl: page.url(),
        phone,
        whatsappNumber: phone, // In India, business phone = WhatsApp
        website,
        instagramHandle,
        instagramProfileUrl: instagramHandle ? `https://instagram.com/${instagramHandle}` : undefined,
        city: params.city || 'Ahmedabad',
        area,
        state: 'Gujarat',
        services: specializations ? [{ name: specializations, category: serviceCategory }] : undefined,
        specializations,
        rating,
        reviewCount,
      }
    } catch (error) {
      console.error(`[GoogleMaps] Error extracting details for ${name}:`, error)
      return null
    }
  }
}
