/**
 * Run all pre-built scrapers for Artistora service categories.
 *
 * Usage:
 *   npx tsx src/run-scrapers.ts                    # Run all scrapers
 *   npx tsx src/run-scrapers.ts --service mehndi   # Run only mehndi scrapers
 *   npx tsx src/run-scrapers.ts --source google_maps  # Run only Google Maps
 *   npx tsx src/run-scrapers.ts --dry-run          # Show what would be scraped
 */

import {
  allQueries,
  mehndiQueries,
  photographyQueries,
  makeupQueries,
  decorQueries,
  musicQueries,
  type ScrapeQuery,
} from './outreach/scrape-config'
import { runScrape } from './outreach/scrapers'
import { batchScoreArtists } from './outreach/scoring'
import { getPayload } from 'payload'
import config from './payload.config'

const SERVICE_MAP: Record<string, ScrapeQuery[]> = {
  mehndi: mehndiQueries,
  photography: photographyQueries,
  makeup: makeupQueries,
  decor: decorQueries,
  music: musicQueries,
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const serviceFlag = args.find((_, i, a) => a[i - 1] === '--service')
  const sourceFlag = args.find((_, i, a) => a[i - 1] === '--source')

  let queries = allQueries

  if (serviceFlag) {
    queries = SERVICE_MAP[serviceFlag] || []
    if (queries.length === 0) {
      console.error(`Unknown service: ${serviceFlag}. Available: ${Object.keys(SERVICE_MAP).join(', ')}`)
      process.exit(1)
    }
  }

  if (sourceFlag) {
    queries = queries.filter(q => q.source === sourceFlag)
  }

  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Artistora Scraper Runner               ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`\n📋 ${queries.length} scrape queries to run`)
  console.log(`🏙️  City: Ahmedabad`)
  console.log(`🔍 Services: ${serviceFlag || 'All (mehndi, photography, makeup, decor, music)'}`)
  console.log(`📡 Sources: ${sourceFlag || 'All (google_maps, instagram, justdial, sulekha, wedmegood, weddingwire)'}`)
  console.log('')

  if (dryRun) {
    console.log('🔍 DRY RUN — Queries that would be executed:\n')
    for (const q of queries) {
      console.log(`  [${q.source}] "${q.query}" → max ${q.maxResults} results`)
    }
    console.log(`\nTotal: ${queries.length} queries, ~${queries.reduce((s, q) => s + q.maxResults, 0)} estimated results`)
    return
  }

  const payload = await getPayload({ config })

  let totalFound = 0
  let totalNew = 0
  let totalDupes = 0
  let totalErrors = 0

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i]
    console.log(`\n── [${i + 1}/${queries.length}] ${q.source}: "${q.query}" ──`)

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
        maxResults: q.maxResults,
        jobId: String(job.id),
      })

      if (result.error) {
        console.log(`  ⚠️  Scraper error: ${result.error}`)
        await payload.update({
          collection: 'scrape-jobs',
          id: job.id,
          data: { status: 'failed', errorMessage: result.error, completedAt: new Date().toISOString() },
        })
        totalErrors++
        continue
      }

      // Score and dedup
      const scored = batchScoreArtists(result.artists)
      let newCount = 0
      let dupeCount = 0

      for (const artist of scored) {
        const where: any = { or: [] }
        if (artist.phone) where.or.push({ phone: { equals: artist.phone } })
        if (artist.instagramHandle) where.or.push({ instagramHandle: { equals: artist.instagramHandle } })

        let isDupe = false
        if (where.or.length > 0) {
          const existing = await payload.find({ collection: 'discovered-artists', where, limit: 1 })
          isDupe = existing.docs.length > 0
        }

        if (isDupe) {
          dupeCount++
          continue
        }

        const slug = artist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        await payload.create({
          collection: 'discovered-artists',
          data: {
            name: artist.name,
            slug: `${slug}-${Date.now()}`,
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

      console.log(`  ✅ Found: ${result.artists.length} | New: ${newCount} | Dupes: ${dupeCount}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.log(`  ❌ Failed: ${msg}`)
      await payload.update({
        collection: 'scrape-jobs',
        id: job.id,
        data: { status: 'failed', errorMessage: msg, completedAt: new Date().toISOString() },
      }).catch(() => {})
      totalErrors++
    }
  }

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
