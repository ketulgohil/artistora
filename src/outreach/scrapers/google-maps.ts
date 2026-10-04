import type { Browser, Page } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'
import { launchBrowser, BROWSER_CONTEXT_OPTIONS, jitteredSleep, retryWithBackoff, normalizePhone } from './utils'

export class GoogleMapsScraper implements Scraper {
  source = 'google_maps' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[GoogleMaps] Starting scrape: "${query}" in ${city}`)

    try {
      this.browser = await launchBrowser()
      const context = await this.browser.newContext(BROWSER_CONTEXT_OPTIONS)
      const page = await context.newPage()

      // === PHASE 1: Collect all place URLs from search results ===
      const searchQuery = encodeURIComponent(`${query} in ${city}`)
      await retryWithBackoff(() =>
        page.goto(`https://www.google.com/maps/search/${searchQuery}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })
      )
      await jitteredSleep(3000)

      // Dismiss cookie/consent banner if shown
      try {
        const consentBtn = page.locator('button:has-text("Accept all"), button:has-text("Reject all"), button:has-text("I agree"), form[action*="consent"] button').first()
        if (await consentBtn.isVisible({ timeout: 2000 })) {
          await consentBtn.click()
          await jitteredSleep(1000)
        }
      } catch {}

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

        try {
          const feed = page.locator(feedSelector).first()
          await feed.evaluate((el) => { el.scrollTop = el.scrollHeight })
          await jitteredSleep(2500)
          scrollAttempts++
        } catch {
          break
        }
      }

      // Fallback: If Google Maps directly redirected to a single place page
      if (placeUrls.length === 0 && page.url().includes('/maps/place/')) {
        const singleName = (await page.locator('h1.DUwDvf, h1').first().textContent()) || query
        placeUrls.push({ name: singleName.trim(), href: page.url() })
      }

      console.log(`[GoogleMaps] Collected ${placeUrls.length} place URLs, visiting in parallel batches...`)

      // === PHASE 2: Visit place URLs in parallel batches of 4 ===
      const BATCH_SIZE = 4
      for (let i = 0; i < placeUrls.length; i += BATCH_SIZE) {
        const batch = placeUrls.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async ({ name, href }) => {
            const tabPage = await context.newPage()
            try {
              await retryWithBackoff(() =>
                tabPage.goto(href, { waitUntil: 'domcontentloaded', timeout: 15000 })
              )
              await jitteredSleep(2000)

              const artist = await this.extractPlaceDetails(tabPage, name, params)
              if (artist) {
                const cidMatch = href.match(/!1s(0x[0-9a-f]+)/i)
                artist.sourceId = cidMatch ? cidMatch[1] : undefined
                console.log(`[GoogleMaps] ${name} — phone: ${artist.phone || 'none'}`)
              }
              return artist
            } catch (err) {
              console.log(`[GoogleMaps] Error visiting ${name}: ${err}`)
              return null
            } finally {
              await tabPage.close()
            }
          })
        )
        results.push(...batchResults.filter((a): a is ScrapedArtist => a !== null))
        console.log(`[GoogleMaps] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.length} total so far`)
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
      try {
        await page.waitForSelector('h1.DUwDvf, div.Io6YTe, div.rogA2c, [data-item-id]', { timeout: 4000 })
      } catch {}
      await jitteredSleep(500)

      let businessName: string | undefined
      try {
        const bizNameSelectors = ['h1.DUwDvf', 'h1[class*="header"]', '[data-attrid="title"]', 'h1']
        for (const sel of bizNameSelectors) {
          const el = page.locator(sel).first()
          if (await el.count() > 0) {
            const text = (await el.textContent())?.trim()
            if (text && text !== name) { businessName = text; break }
          }
        }
      } catch {}

      // Phone: extract from div.Io6YTe (primary Google Maps text node), tel link, data-item-id, aria-label
      let phone: string | undefined
      try {
        // 1. Primary: inspect all div.Io6YTe and div.rogA2c text elements
        const ioElements = await page.locator('div.Io6YTe, div.rogA2c').allTextContents()
        for (const rawText of ioElements) {
          const text = rawText.trim()
          if (!text) continue
          const normalized = normalizePhone(text)
          if (normalized) {
            phone = normalized
            break
          }
          const match = text.match(/(?:\+?91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5}|(?:\+?91[\s-]?)?0?[6-9]\d{9}/)
          if (match) {
            const num = normalizePhone(match[0])
            if (num) {
              phone = num
              break
            }
          }
        }

        // 2. Tel link
        if (!phone) {
          const telLinks = await page.locator('a[href^="tel:"]').all()
          for (const link of telLinks) {
            const href = await link.getAttribute('href')
            if (href?.startsWith('tel:')) {
              const num = normalizePhone(href.replace('tel:', ''))
              if (num) { phone = num; break }
            }
          }
        }

        // 3. data-item-id with phone:
        if (!phone) {
          const phoneBtns = await page.locator('[data-item-id*="phone"], [data-item-id^="phone:"]').all()
          for (const btn of phoneBtns) {
            const itemId = await btn.getAttribute('data-item-id')
            const ariaLabel = await btn.getAttribute('aria-label')
            const text = await btn.textContent()
            const num =
              normalizePhone(itemId?.replace(/^phone:tel:/, '')?.replace(/^phone:/, '')) ||
              normalizePhone(ariaLabel || undefined) ||
              normalizePhone(text || undefined)
            if (num) { phone = num; break }
          }
        }

        // 4. aria-label or tooltip containing phone
        if (!phone) {
          const phoneElements = await page
            .locator('[aria-label*="Phone" i], [aria-label*="phone" i], button[data-tooltip*="phone" i]')
            .all()
          for (const el of phoneElements) {
            const label = await el.getAttribute('aria-label')
            const text = await el.textContent()
            const num = normalizePhone(label || undefined) || normalizePhone(text || undefined)
            if (num) { phone = num; break }
          }
        }
      } catch {}

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
            if (match) { rating = Math.min(5, parseFloat(match[1])); break }
          }
        }

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
              if (match) { reviewCount = parseInt(match[1].replace(/,/g, '')); break }
            }
          }
        }
      } catch {}

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
            area = (await el.textContent())?.trim() || undefined
            if (area) break
          }
        }
      } catch {}

      let specializations: string | undefined
      try {
        const catSelectors = ['button[jsaction*="category"]', 'span.DkEaL', '[data-item-id="category"]']
        for (const sel of catSelectors) {
          const el = page.locator(sel).first()
          if (await el.count() > 0) {
            specializations = (await el.textContent())?.trim() || undefined
            if (specializations) break
          }
        }
      } catch {}

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

      const catLower = (specializations || params.query || '').toLowerCase()
      let serviceCategory: 'mehndi' | 'makeup' | 'decor' | 'other' = 'other'
      if (catLower.includes('mehndi') || catLower.includes('henna')) serviceCategory = 'mehndi'
      else if (catLower.includes('makeup') || catLower.includes('beauty') || catLower.includes('parlour')) serviceCategory = 'makeup'
      else if (catLower.includes('decor') || catLower.includes('decoration')) serviceCategory = 'decor'
      else if (params.category && ['mehndi', 'makeup', 'decor'].includes(params.category)) {
        serviceCategory = params.category as any
      }

      // Only set whatsappNumber if it's a valid mobile (normalizePhone already validates this)
      const whatsappNumber = phone

      return {
        name,
        businessName,
        source: 'google_maps',
        sourceUrl: page.url(),
        phone,
        whatsappNumber,
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
