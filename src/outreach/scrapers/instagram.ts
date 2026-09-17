import { chromium, type Browser, type Page } from 'playwright'
import type { Scraper, ScrapeParams, ScrapedArtist } from '../types'
import path from 'path'
import fs from 'fs'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class InstagramScraper implements Scraper {
  source = 'instagram' as const
  private browser: Browser | null = null

  async scrape(params: ScrapeParams): Promise<ScrapedArtist[]> {
    const { query, city = 'Ahmedabad', maxResults = 50 } = params
    const results: ScrapedArtist[] = []

    console.log(`[Instagram] Starting scrape: "${query}" in ${city}`)

    // Build hashtag search terms
    const hashtags = this.buildHashtags(query, city)

    // Check for saved session
    const sessionPath = path.join(process.cwd(), 'instagram-session', 'state.json')
    const hasSession = fs.existsSync(sessionPath)
    if (!hasSession) {
      console.log('[Instagram] No saved session found! Run: npx tsx src/save-instagram-session.ts')
      return results
    }
    
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })

      const context = await this.browser.newContext({
        storageState: sessionPath,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'en-IN',
        timezoneId: 'Asia/Kolkata',
      })

      const page = await context.newPage()

      for (const hashtag of hashtags) {
        if (results.length >= maxResults) break

        try {
          console.log(`[Instagram] Searching #${hashtag}`)
          await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, { 
            waitUntil: 'domcontentloaded' 
          })
          await sleep(3000)

          // Collect post links from the grid
          const postLinks = await this.collectPostLinks(page, Math.min(maxResults - results.length, 20))

          // Visit each post to find the author
          for (const postUrl of postLinks) {
            if (results.length >= maxResults) break

            try {
              await page.goto(postUrl, { waitUntil: 'domcontentloaded' })
              await sleep(1500)

              const profile = await this.extractProfileFromPost(page)
              if (profile && !results.find(r => r.instagramHandle === profile.instagramHandle)) {
                results.push({
                  ...profile,
                  city,
                  state: 'Gujarat',
                  source: 'instagram',
                  sourceUrl: postUrl,
                })
              }
            } catch (err) {
              console.log(`[Instagram] Error on post: ${err}`)
            }
          }

          await sleep(2000) // Rate limit between hashtags
        } catch (err) {
          console.log(`[Instagram] Error on hashtag #${hashtag}: ${err}`)
        }
      }
    } catch (error) {
      console.error('[Instagram] Scrape error:', error)
      throw error
    } finally {
      await this.browser?.close()
      this.browser = null
    }

    console.log(`[Instagram] Found ${results.length} results`)
    return results
  }

  private buildHashtags(query: string, city: string): string[] {
    const cityLower = city.toLowerCase()
    const categoryMap: Record<string, string[]> = {
      mehndi: ['mehndiartist', 'mehndidesigner', 'bridalmehndi', 'mehndiart', 'hennaartist'],
      photography: ['weddingphotographer', 'weddingphotography', 'eventphotographer'],
      makeup: ['bridalmakeup', 'makeupartist', 'weddingmakeup'],
      decor: ['weddingdecor', 'weddingdecoration', 'eventdecor'],
      music: ['weddingmusic', 'weddingband', 'livesinger'],
    }

    const category = query.toLowerCase()
    const hashtags: string[] = []

    for (const [key, tags] of Object.entries(categoryMap)) {
      if (category.includes(key)) {
        hashtags.push(...tags.map(t => `${cityLower}${t}`))
        hashtags.push(...tags)
        break
      }
    }

    // Fallback generic hashtags
    if (hashtags.length === 0) {
      hashtags.push(
        `${cityLower}artist`,
        `${cityLower}wedding`,
        `wedding${cityLower}`,
        'ahmedabadartist',
        'ahmedabadwedding'
      )
    }

    return hashtags.slice(0, 8) // Limit to avoid rate limits
  }

  private async collectPostLinks(page: Page, maxPosts: number): Promise<string[]> {
    const links: string[] = []
    
    try {
      // Wait for post grid to load (desktop layout)
      await page.waitForSelector('a[href*="/p/"], a[href*="/reel/"]', { timeout: 10000 })
      
      const postElements = await page.locator('a[href*="/p/"], a[href*="/reel/"]').all()
      
      for (const el of postElements.slice(0, maxPosts)) {
        const href = await el.getAttribute('href')
        if (href && !links.includes(href)) {
          links.push(href.startsWith('http') ? href : `https://www.instagram.com${href}`)
        }
      }
    } catch {
      console.log('[Instagram] No posts found on hashtag page')
    }

    return links
  }

  private async extractProfileFromPost(page: Page): Promise<Omit<ScrapedArtist, 'city' | 'state' | 'source' | 'sourceUrl'> | null> {
    try {
      // Get username from the post
      const username = await page.locator('header a[href*="/"], header span a').first().textContent()
      if (!username) return null

      const handle = username.replace('@', '').trim()

      // Get full name
      const fullName = await page.locator('header section h1, header div h1').first().textContent().catch(() => handle)

      // Get bio text
      const bio = (await page.locator('header section div[class] span').first().textContent().catch(() => '')) || ''

      // Get follower count
      let followerCount: number | undefined
      try {
        const statsText = await page.locator('header section ul li span span').first().textContent()
        if (statsText) {
          const num = statsText.replace(/,/g, '').replace(/\./g, '')
          if (num.includes('M')) followerCount = Math.round(parseFloat(num) * 1000000)
          else if (num.includes('K')) followerCount = Math.round(parseFloat(num) * 1000)
          else followerCount = parseInt(num) || undefined
        }
      } catch {}

      // Extract phone/WhatsApp from bio
      let phone: string | undefined
      let whatsappNumber: string | undefined
      const phoneMatch = bio?.match(/(\+91[\s-]?\d{10}|\d{10})/)
      if (phoneMatch) {
        const raw = phoneMatch[1].replace(/[^\d]/g, '')
        phone = raw.length === 10 ? `+91${raw}` : raw
        whatsappNumber = phone
      }

      // Extract email from bio
      const emailMatch = bio?.match(/[\w.+-]+@[\w-]+\.[\w.]+/)
      const email = emailMatch ? emailMatch[0] : undefined

      // Extract services from bio
      const serviceKeywords = ['mehndi', 'henna', 'photography', 'photo', 'makeup', 'decor', 'decoration', 'dj', 'music', 'videography', 'video']
      const bioLower = bio?.toLowerCase() || ''
      const detectedServices = serviceKeywords.filter(kw => bioLower.includes(kw))

      return {
        name: fullName || handle,
        instagramHandle: handle,
        instagramProfileUrl: `https://instagram.com/${handle}`,
        phone,
        whatsappNumber,
        email,
        followerCount,
        services: detectedServices.map(s => ({ name: s })),
        specializations: bio,
      }
    } catch (error) {
      console.log(`[Instagram] Error extracting profile: ${error}`)
      return null
    }
  }
}
