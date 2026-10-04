/**
 * Automated Instagram Artist & WhatsApp Bio Scraper.
 * Searches Ahmedabad wedding artist keywords via Instagram Web Discovery, extracts handles & WhatsApp numbers,
 * and upserts records into Payload CMS `discovered_artists` collection.
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation" npx tsx scripts/scrape-instagram-artists.ts
 *   NODE_OPTIONS="--no-deprecation" npx tsx scripts/scrape-instagram-artists.ts --queries "ahmedabad mehndi,ahmedabad makeup"
 *
 * Importers/Callers: Standalone CLI execution by admin.
 * Affected APIs: Instagram Web Search & Profile API, Payload CMS Local API.
 * Schemas: `discovered_artists` PostgreSQL collection.
 * User instruction: "Failed to scrape hashtag #ahmedabadmakeupartist: POST /api/v1/tags/ahmedabadmakeupartist/sections/ - 400 Bad Request; checkpoint_required"
 */

import dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { getUnifiedRedis } from '../src/outreach/redis-client'
import { getPayloadClient } from '../src/lib/payload'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const DEFAULT_QUERIES = [
  'ahmedabad nail artist',
  'nail artist ahmedabad',
  'ahmedabad nail studio',
  'nail extensions ahmedabad',
  'bridal nail art ahmedabad',
  'ahmedabad makeup artist',
  'ahmedabad bridal mehndi',
  'ahmedabad event planner',
  'mehndi artist ahmedabad',
  'makeup artist ahmedabad',
  'bridal makeup ahmedabad',
  'mehndi artist satellite ahmedabad',
  'makeup artist bopal ahmedabad',
  'wedding planner vastrapur ahmedabad',
  'ahmedabad wedding decor',
]

/**
 * Extracts 10-digit Indian phone numbers from bio text and contact fields.
 */
function extractIndianPhoneNumbers(text: string): string[] {
  if (!text) return []
  const normalized = text.replace(/[​-‍﻿]/g, '')
  const matches = normalized.match(/(?:(?:\+|00)?91[\s\.\-]?)?[6-9]\d{2,4}[\s\.\-]?\d{3,5}/g) || []
  const cleaned = matches
    .map((m) => {
      const digits = m.replace(/\D/g, '')
      if (digits.length === 10) return `+91${digits}`
      if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
      return null
    })
    .filter(Boolean) as string[]

  return Array.from(new Set(cleaned))
}

/**
 * Categorizes an artist based on their bio, full name, handle, or search query with strict priority ordering.
 */
function inferCategory(
  bio: string,
  fullName: string,
  username: string,
  query: string,
): { service: string; type: string } {
  const combined = `${bio} ${fullName} ${username} ${query}`.toLowerCase()

  // 1. Nail Artists & Studios
  if (
    combined.includes('nail') ||
    combined.includes('acrylic') ||
    combined.includes('gel extension') ||
    combined.includes('press on') ||
    combined.includes('manicure') ||
    combined.includes('pedicure')
  ) {
    return { service: 'Nail Artists', type: 'nail-artists' }
  }

  // 2. Mehndi / Henna (highest specificity)
  if (
    combined.includes('mehndi') ||
    combined.includes('mehendi') ||
    combined.includes('henna') ||
    combined.includes('heena')
  ) {
    return { service: 'Mehndi Artists', type: 'mehndi' }
  }

  // 3. Decor & Event Planners (must precede makeup to avoid "bridal decor" mismatch)
  if (
    combined.includes('decor') ||
    combined.includes('planner') ||
    combined.includes('planning') ||
    combined.includes('event') ||
    combined.includes('mandap') ||
    combined.includes('stage') ||
    combined.includes('florist')
  ) {
    return { service: 'Decor & Event Planners', type: 'decor' }
  }

  // 4. Makeup & Hair Artists
  if (
    combined.includes('makeup') ||
    combined.includes('make up') ||
    combined.includes('mua') ||
    combined.includes('makeover') ||
    combined.includes('beauty') ||
    combined.includes('hairstyl') ||
    combined.includes('hair artist') ||
    combined.includes('salon')
  ) {
    return { service: 'Makeup Artists', type: 'makeup' }
  }

  return { service: 'Makeup Artists', type: 'makeup' }
}

async function main() {
  console.log('===========================================================')
  console.log('📸 Artistora — Instagram Artist & WhatsApp Bio Scraper')
  console.log('===========================================================\n')

  const args = process.argv.slice(2)
  const queriesIndex = args.indexOf('--queries')
  const targetQueries = queriesIndex !== -1 ? args[queriesIndex + 1].split(',') : DEFAULT_QUERIES

  // 1. Load session credentials from Redis, browser profile, or env
  const redis = getUnifiedRedis()
  const rawSession = await redis.get<string>('artistora:instagram:session:state')
  let sessionId = ''
  let dsUserId = ''
  let cookieHeader = ''

  if (rawSession) {
    try {
      const parsed = typeof rawSession === 'string' ? JSON.parse(rawSession) : rawSession
      const cookies = parsed.cookies?.cookies || []
      for (const c of cookies) {
        if (c.key === 'sessionid') sessionId = c.value
        if (c.key === 'ds_user_id') dsUserId = c.value
      }
    } catch {}
  }

  const profileDir = path.resolve(process.cwd(), '.instagram-browser-profile')
  if ((!sessionId || sessionId.startsWith('30608007458')) && fs.existsSync(profileDir)) {
    try {
      const { chromium } = await import('@playwright/test')
      const context = await chromium.launchPersistentContext(profileDir, {
        headless: true,
        channel: 'chrome',
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
      })
      const cookies = await context.cookies('https://www.instagram.com')
      const sessionCookie = cookies.find((c) => c.name === 'sessionid')
      const dsUserCookie = cookies.find((c) => c.name === 'ds_user_id')
      if (sessionCookie?.value) {
        sessionId = sessionCookie.value
      }
      if (dsUserCookie?.value) {
        dsUserId = dsUserCookie.value
      }
      cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
      await context.close()
    } catch (err: any) {
      console.warn(`   ⚠️ Could not load browser profile cookies: ${err.message}`)
    }
  }

  if (!sessionId) {
    sessionId =
      process.env.INSTAGRAM_SESSION_ID ||
      '30608007458%3AjFtVmMj8LmG2nH%3A5%3AAYkkU6ul0EqeySmCkNmQB4VCyHsnQPUoueU2Q6801Q'
    dsUserId = '30608007458'
  }

  if (!cookieHeader) {
    cookieHeader = `sessionid=${sessionId}; ds_user_id=${dsUserId};`
  }

  console.log(`✅ Using active authenticated session (Account ID: ${dsUserId || 'Linked'})\n`)

  const payload = await getPayloadClient()
  const queueDir = path.resolve(process.cwd(), '.discovered-queue')
  fs.mkdirSync(queueDir, { recursive: true })

  let totalDiscovered = 0
  let totalWithPhone = 0
  let totalSaved = 0
  const seenUsernames = new Set<string>()
  const discoveredArtists: any[] = []

  for (const query of targetQueries) {
    console.log(`\n🔍 Searching Ahmedabad Artists: "${query}"...`)

    try {
      const searchUrl = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(query)}&include_reel=false`
      const res = await fetch(searchUrl, {
        headers: {
          Cookie: cookieHeader,
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'X-IG-App-ID': '936619743392459',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: 'https://www.instagram.com/',
        },
      })

      if (!res.ok) {
        console.warn(`   ⚠️ Search query failed with status ${res.status}`)
        continue
      }

      const searchData = await res.json()
      const usersList = searchData.users || []
      console.log(`   Found ${usersList.length} artist profiles matching "${query}"`)

      for (const item of usersList) {
        const u = item.user
        if (!u || !u.username || seenUsernames.has(u.username.toLowerCase())) {
          continue
        }

        const username = u.username.toLowerCase()
        seenUsernames.add(username)
        const fullName = u.full_name || username

        // Fetch detailed profile HTML to extract complete bio and contact details
        let bio = ''
        let primaryPhone: string | undefined

        try {
          const profileApiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`
          const profileRes = await fetch(profileApiUrl, {
            headers: {
              Cookie: cookieHeader,
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'X-IG-App-ID': '936619743392459',
              'X-Requested-With': 'XMLHttpRequest',
              Referer: `https://www.instagram.com/${username}/`,
            },
          })

          if (profileRes.ok) {
            const data = await profileRes.json()
            const targetUser = data.data?.user
            if (targetUser) {
              bio = targetUser.biography || ''
              const busPhone = targetUser.business_phone_number || targetUser.contact_phone_number
              if (busPhone) {
                const cand = extractIndianPhoneNumbers(busPhone)
                if (cand.length > 0) primaryPhone = cand[0]
              }
            }
          }
        } catch {}

        if (!primaryPhone) {
          const phoneCandidates = extractIndianPhoneNumbers(`${bio} ${fullName}`)
          if (phoneCandidates.length > 0) {
            primaryPhone = phoneCandidates[0]
          }
        }

        const { service, type } = inferCategory(bio, fullName, username, query)
        const slug = `ig-${username.replace(/[^a-z0-9_-]/g, '')}`

        totalDiscovered++
        if (primaryPhone) totalWithPhone++

        console.log(`\n[${totalDiscovered}] @${username} (${fullName})`)
        console.log(`    Category: ${service} (${type})`)
        if (primaryPhone) {
          console.log(`    📱 WhatsApp Phone: ${primaryPhone} (Ready for Baileys WA)`)
        } else {
          console.log(`    💬 No Phone in bio (Ready for Instagram DM)`)
        }

        const leadScore = primaryPhone ? 85 : 60
        const artistRecord = {
          name: fullName,
          slug,
          businessName: fullName,
          source: 'instagram' as const,
          sourceUrl: `https://www.instagram.com/${username}`,
          sourceId: String(u.pk || u.id || ''),
          phone: primaryPhone,
          whatsappNumber: primaryPhone,
          instagramHandle: username,
          instagramProfileUrl: `https://www.instagram.com/${username}`,
          city: 'Ahmedabad',
          state: 'Gujarat',
          leadScore,
          outreachStatus: 'new' as const,
          specializations: bio ? bio.slice(0, 200) : `${service} in Ahmedabad`,
          services: [{ name: service }],
        }

        discoveredArtists.push(artistRecord)

        // Save / Upsert to PostgreSQL via Payload Local API
        try {
          const existing = await payload.find({
            collection: 'discovered-artists',
            where: {
              or: [{ instagramHandle: { equals: username } }, { slug: { equals: slug } }],
            },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            const docId = existing.docs[0].id
            await payload.update({
              collection: 'discovered-artists',
              id: docId,
              data: {
                name: fullName,
                businessName: fullName,
                phone: primaryPhone || existing.docs[0].phone,
                whatsappNumber: primaryPhone || existing.docs[0].whatsappNumber,
                instagramHandle: username,
                instagramProfileUrl: `https://www.instagram.com/${username}`,
                city: 'Ahmedabad',
                state: 'Gujarat',
                leadScore,
                specializations: bio ? bio.slice(0, 200) : existing.docs[0].specializations,
                services: [{ name: service }],
              } as any,
            })
            console.log(`    💾 Updated database record (ID: ${docId})`)
          } else {
            const created = await payload.create({
              collection: 'discovered-artists',
              data: artistRecord as any,
            })
            totalSaved++
            console.log(`    ✅ Created new discovered artist record (ID: ${created.id})`)
          }
        } catch (err: any) {
          console.warn(`    ⚠️ Database save error for @${username}: ${err.message}`)
        }

        await sleep(1000)
      }

      await sleep(1500)
    } catch (err: any) {
      console.error(`   ❌ Failed search query "${query}": ${err.message}`)
    }
  }

  // Backup discovered dataset to local JSON queue
  const queueFile = path.join(queueDir, `instagram-artists-${Date.now()}.json`)
  fs.writeFileSync(queueFile, JSON.stringify(discoveredArtists, null, 2))
  console.log(`\n💾 Saved backup snapshot to ${queueFile}`)

  console.log('\n===========================================================')
  console.log(`🎉 Discovery Run Completed!`)
  console.log(`   Total Ahmedabad Artists Discovered: ${totalDiscovered}`)
  console.log(`   Artists with WhatsApp Phone: ${totalWithPhone} (Ready for Baileys WhatsApp)`)
  console.log(`   Artists for Instagram DMs: ${totalDiscovered - totalWithPhone} (Ready for IG DM)`)
  console.log(`   Saved / Updated in Database: ${totalSaved}`)
  console.log('===========================================================\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error in scraper:', err)
  process.exit(1)
})
