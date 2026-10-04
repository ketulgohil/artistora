/**
 * Run all pre-built scrapers for Artistora service categories.
 *
 * Usage:
 *   npx tsx src/run-scrapers.ts                                      # Run all scrapers
 *   npx tsx src/run-scrapers.ts --service mehndi                     # Run only mehndi scrapers
 *   npx tsx src/run-scrapers.ts --service mehndi,makeup              # Run multiple categories
 *   npx tsx src/run-scrapers.ts --source google_maps --concurrency 4 # Run Google Maps in parallel
 *   npx tsx src/run-scrapers.ts --dry-run                            # Show what would be scraped
 */

import { config as loadDotenv } from 'dotenv'
import * as path from 'path'
loadDotenv({ path: path.resolve(process.cwd(), '.env') })
loadDotenv({ path: path.resolve(process.cwd(), '.env.local') })

import {
  allQueries,
  mehndiQueries,
  makeupQueries,
  decorQueries,
  type ScrapeQuery,
} from './outreach/scrape-config'
import { runScrape } from './outreach/scrapers'
import { batchScoreArtists } from './outreach/scoring'
import { getPayload } from 'payload'
import config from './payload.config'

const SERVICE_MAP: Record<string, ScrapeQuery[]> = {
  mehndi: mehndiQueries,
  makeup: makeupQueries,
  decor: decorQueries,
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const serviceFlag = args.find((_, i, a) => a[i - 1] === '--service')
  const sourceFlag = args.find((_, i, a) => a[i - 1] === '--source')
  const concurrencyFlag = args.find((_, i, a) => a[i - 1] === '--concurrency' || a[i - 1] === '-c')
  const concurrency = Math.max(
    1,
    Math.min(10, concurrencyFlag ? parseInt(concurrencyFlag, 10) || 1 : 1),
  )

  let queries = allQueries

  if (serviceFlag) {
    const services = serviceFlag.split(',').map((s) => s.trim().toLowerCase())
    queries = services.flatMap((s) => SERVICE_MAP[s] || [])
    if (queries.length === 0) {
      console.error(
        `Unknown service(s): ${serviceFlag}. Available: ${Object.keys(SERVICE_MAP).join(', ')}`,
      )
      process.exit(1)
    }
  }

  if (sourceFlag) {
    queries = queries.filter((q) => q.source === sourceFlag)
  }

  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Artistora Scraper Runner               ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`\n📋 ${queries.length} scrape queries to run`)
  console.log(`🏙️  City: Ahmedabad`)
  console.log(`🔍 Services: ${serviceFlag || 'All (mehndi, makeup, decor)'}`)
  console.log(
    `📡 Sources: ${sourceFlag || 'All (google_maps, instagram, justdial, sulekha, wedmegood, weddingwire)'}`,
  )
  console.log(`⚡ Concurrency: ${concurrency} parallel worker(s)`)
  console.log('')

  if (dryRun) {
    console.log('🔍 DRY RUN — Queries that would be executed:\n')
    for (const q of queries) {
      console.log(
        `  [${q.source}] [${q.category || 'general'}] "${q.query}" → max ${q.maxResults} results`,
      )
    }
    console.log(
      `\nTotal: ${queries.length} queries, ~${queries.reduce((s, q) => s + q.maxResults, 0)} estimated results`,
    )
    return
  }

  const payload = await getPayload({ config })

  let totalFound = 0
  let totalNew = 0
  let totalDupes = 0
  let totalErrors = 0

  async function executeQuery(q: ScrapeQuery, index: number): Promise<void> {
    const label = `[${q.source}] [${q.category || 'general'}] "${q.query}"`
    console.log(`\n── [${index + 1}/${queries.length}] Starting ${label} ──`)

    // Create scrape job
    const job = await payload.create({
      collection: 'scrape-jobs',
      data: {
        source: q.source,
        searchQuery: q.query,
        searchCity: q.city,
        searchCategory: q.category,
        maxResults: q.maxResults,
        status: 'running',
        startedAt: new Date().toISOString(),
      },
    })

    try {
      const result = await runScrape(q.source, {
        query: q.query,
        city: q.city,
        category: q.category as any,
        maxResults: q.maxResults,
        jobId: String(job.id),
      })

      if (result.error) {
        console.log(`  ⚠️  [${label}] Scraper error: ${result.error}`)
        await payload.update({
          collection: 'scrape-jobs',
          id: job.id,
          data: {
            status: 'failed',
            errorMessage: result.error,
            completedAt: new Date().toISOString(),
          },
        })
        totalErrors++
        return
      }

      // Score and dedup with 3-level matching: phone → Instagram → name+city
      const scored = batchScoreArtists(result.artists)
      let newCount = 0
      let dupeCount = 0

      // Run dedup queries in batches
      const DEDUP_BATCH = 3
      for (let ai = 0; ai < scored.length; ai += DEDUP_BATCH) {
        const batch = scored.slice(ai, ai + DEDUP_BATCH)
        await Promise.all(
          batch.map(async (artist) => {
            // Level 1: phone match
            let existingDoc: any = null
            if (artist.phone) {
              const res = await payload.find({
                collection: 'discovered-artists',
                where: { phone: { equals: artist.phone } },
                limit: 1,
              })
              if (res.docs.length > 0) existingDoc = res.docs[0]
            }

            // Level 2: Instagram handle match
            if (!existingDoc && artist.instagramHandle) {
              const res = await payload.find({
                collection: 'discovered-artists',
                where: { instagramHandle: { equals: artist.instagramHandle } },
                limit: 1,
              })
              if (res.docs.length > 0) existingDoc = res.docs[0]
            }

            // Level 3: name + city match
            if (!existingDoc && artist.name && artist.city) {
              const res = await payload.find({
                collection: 'discovered-artists',
                where: {
                  and: [{ name: { equals: artist.name } }, { city: { equals: artist.city } }],
                },
                limit: 1,
              })
              if (res.docs.length > 0) existingDoc = res.docs[0]
            }

            if (existingDoc) {
              // Merge: enrich existing record with any new data from this scrape
              const updates: Record<string, any> = {}
              if (!existingDoc.phone && artist.phone) updates.phone = artist.phone
              if (!existingDoc.whatsappNumber && artist.whatsappNumber)
                updates.whatsappNumber = artist.whatsappNumber
              if (!existingDoc.email && artist.email) updates.email = artist.email
              if (!existingDoc.instagramHandle && artist.instagramHandle)
                updates.instagramHandle = artist.instagramHandle
              if (!existingDoc.website && artist.website) updates.website = artist.website
              if (!existingDoc.rating && artist.rating) updates.rating = artist.rating
              if (
                (!existingDoc.reviewCount || existingDoc.reviewCount < (artist.reviewCount || 0)) &&
                artist.reviewCount
              ) {
                updates.reviewCount = artist.reviewCount
              }
              // Update lead score if the new one is higher
              if ((artist.leadScore || 0) > (existingDoc.leadScore || 0)) {
                updates.leadScore = artist.leadScore
                updates.leadScoreBreakdown = artist.leadScoreBreakdown
              }
              if (Object.keys(updates).length > 0) {
                await payload
                  .update({
                    collection: 'discovered-artists',
                    id: existingDoc.id,
                    data: updates,
                  })
                  .catch(() => {})
              }
              dupeCount++
              return
            }

            const slug = artist.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')

            await payload.create({
              collection: 'discovered-artists',
              data: {
                name: artist.name,
                slug: `${slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                businessName: artist.businessName,
                source: artist.source as any,
                sourceUrl: artist.sourceUrl,
                phone: artist.phone,
                email: artist.email,
                whatsappNumber: artist.whatsappNumber,
                instagramHandle: artist.instagramHandle,
                instagramProfileUrl: artist.instagramProfileUrl,
                website: artist.website,
                city: artist.city || q.city,
                area: artist.area,
                state: 'Gujarat',
                services: (artist.services || []).map((s: any) => ({ name: s.name })),
                specializations: artist.specializations,
                priceRange: artist.priceRange || 'unknown',
                rating: artist.rating,
                reviewCount: artist.reviewCount || 0,
                followerCount: artist.followerCount,
                postCount: artist.postCount,
                portfolioImages: artist.portfolioImages || [],
                leadScore: artist.leadScore,
                leadScoreBreakdown: artist.leadScoreBreakdown as any,
                outreachStatus: 'new',
                scrapeJob: job.id as any,
              },
            })
            newCount++
          }),
        )
      }

      // Update job
      await payload.update({
        collection: 'scrape-jobs',
        id: job.id,
        data: {
          status: 'completed',
          completedAt: new Date().toISOString(),
          resultsFound: result.artists.length,
          newArtists: newCount,
          duplicatesSkipped: dupeCount,
        },
      })

      totalFound += result.artists.length
      totalNew += newCount
      totalDupes += dupeCount

      console.log(
        `  ✅ [${label}] Found: ${result.artists.length} | New: ${newCount} | Dupes: ${dupeCount}`,
      )
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.log(`  ❌ [${label}] Failed: ${msg}`)
      await payload
        .update({
          collection: 'scrape-jobs',
          id: job.id,
          data: { status: 'failed', errorMessage: msg, completedAt: new Date().toISOString() },
        })
        .catch(() => {})
      totalErrors++
    }
  }

  // Process queries with concurrency limit
  let queueIndex = 0
  const workers = Array.from({ length: concurrency }, async () => {
    while (queueIndex < queries.length) {
      const currentIndex = queueIndex++
      await executeQuery(queries[currentIndex], currentIndex)
    }
  })

  await Promise.all(workers)

  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║   Scrape Complete!                        ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`  📊 Total Found:  ${totalFound}`)
  console.log(`  ✅ New Artists:  ${totalNew}`)
  console.log(`  ⏭️  Dupes:       ${totalDupes}`)
  console.log(`  ❌ Errors:       ${totalErrors}`)
  console.log(`  🔍 Queries Run:  ${queries.length}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Scraper runner failed:', err)
  process.exit(1)
})
