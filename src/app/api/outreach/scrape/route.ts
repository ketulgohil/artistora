import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  if (!process.env.ENABLE_SCRAPER) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { source, query, city, category, maxResults } = body

    if (!source || !query) {
      return NextResponse.json({ error: 'source and query are required' }, { status: 400 })
    }

    // Create scrape job record
    const job = await payload.create({
      collection: 'scrape-jobs',
      data: {
        source,
        searchQuery: query,
        searchCity: city || 'Ahmedabad',
        searchCategory: category,
        maxResults: maxResults || 50,
        status: 'running',
        startedAt: new Date().toISOString(),
      },
    })

    // Run scraper in background (non-blocking)
    runScraperJob(String(job.id), source, { query, city, category, maxResults: maxResults || 50 })

    return NextResponse.json({
      jobId: job.id,
      status: 'running',
      message: `Scrape job started for ${source}`,
    })
  } catch (error) {
    console.error('[Scrape API] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function runScraperJob(
  jobId: string,
  source: string,
  params: { query: string; city?: string; category?: string; maxResults: number },
) {
  try {
    // Dynamic import to avoid Edge runtime issues
    const { runScrape } = await import('@/outreach/scrapers')
    const { batchScoreArtists } = await import('@/outreach/scoring')

    const result = await runScrape(source as any, {
      query: params.query,
      city: params.city || 'Ahmedabad',
      maxResults: params.maxResults,
    })

    const payload = await getPayload({ config })

    let newArtists = 0
    let duplicatesSkipped = 0
    const createdArtistIds: string[] = []

    // Process and score each discovered artist
    const scoredArtists = batchScoreArtists(result.artists)

    for (const artist of scoredArtists) {
      // Upsert: check for existing by phone, instagram, or name+city
      let existingDoc: any = null

      // 1. Phone match (highest confidence)
      if (artist.phone) {
        const byPhone = await payload.find({
          collection: 'discovered-artists',
          where: { phone: { equals: artist.phone } },
          limit: 1,
        })
        if (byPhone.docs.length > 0) existingDoc = byPhone.docs[0]
      }

      // 2. Instagram handle match
      if (!existingDoc && artist.instagramHandle) {
        const byIg = await payload.find({
          collection: 'discovered-artists',
          where: { instagramHandle: { equals: artist.instagramHandle } },
          limit: 1,
        })
        if (byIg.docs.length > 0) existingDoc = byIg.docs[0]
      }

      // 3. Name + city match (fuzzy — same name in same city = likely same person)
      if (!existingDoc && artist.name) {
        const byName = await payload.find({
          collection: 'discovered-artists',
          where: {
            and: [
              { name: { equals: artist.name } },
              { city: { equals: artist.city || params.city || 'Ahmedabad' } },
            ],
          },
          limit: 1,
        })
        if (byName.docs.length > 0) existingDoc = byName.docs[0]
      }

      if (existingDoc) {
        // UPDATE: merge new data into existing record (only overwrite if new value is non-empty)
        const mergeData: Record<string, any> = {}

        // Only update fields that are currently empty in the existing record
        const fieldMap: [string, any][] = [
          ['phone', artist.phone],
          ['whatsappNumber', artist.whatsappNumber],
          ['email', artist.email],
          ['instagramHandle', artist.instagramHandle],
          ['instagramProfileUrl', artist.instagramProfileUrl],
          ['website', artist.website],
          ['area', artist.area],
          ['specializations', artist.specializations],
          ['rating', artist.rating],
          ['reviewCount', artist.reviewCount],
          ['followerCount', artist.followerCount],
          ['postCount', artist.postCount],
          ['businessName', artist.businessName],
          ['sourceUrl', artist.sourceUrl],
          ['sourceId', artist.sourceId],
        ]

        for (const [field, newVal] of fieldMap) {
          if (newVal && !existingDoc[field]) {
            mergeData[field] = newVal
          }
        }

        // Always update lead score (it's recalculated each time)
        mergeData.leadScore = artist.leadScore
        mergeData.leadScoreBreakdown = artist.leadScoreBreakdown

        // Update services if new ones found
        if (artist.services?.length && (!existingDoc.services || existingDoc.services.length === 0)) {
          mergeData.services = artist.services.map((s: any) => ({ name: s.name }))
        }

        if (Object.keys(mergeData).length > 2) {
          // More than just lead score changed — meaningful update
          await payload.update({
            collection: 'discovered-artists',
            id: existingDoc.id,
            data: mergeData,
          })
          console.log(`[ScrapeJob] Updated: ${artist.name} (${Object.keys(mergeData).length - 2} fields)`)
        }

        // Link to this scrape job
        createdArtistIds.push(String(existingDoc.id))
        duplicatesSkipped++ // reused existing
      } else {
        // CREATE: new artist
        const slug = artist.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

        const created = await payload.create({
          collection: 'discovered-artists',
          data: {
            name: artist.name,
            slug: `${slug}-${Date.now()}`,
            businessName: artist.businessName,
            source: artist.source,
            sourceUrl: artist.sourceUrl,
            sourceId: artist.sourceId,
            phone: artist.phone,
            email: artist.email,
            whatsappNumber: artist.whatsappNumber,
            instagramHandle: artist.instagramHandle,
            instagramProfileUrl: artist.instagramProfileUrl,
            website: artist.website,
            city: artist.city || params.city || 'Ahmedabad',
            area: artist.area,
            state: artist.state || 'Gujarat',
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
          },
        })

        createdArtistIds.push(String(created.id))
        newArtists++
      }
    }

    // Batch link artists to this scrape job
    if (createdArtistIds.length > 0) {
      for (const artistId of createdArtistIds) {
        try {
          await payload.update({
            collection: 'discovered-artists',
            id: artistId,
            data: { scrapeJob: jobId as any },
            context: { skipHooks: true },
          })
        } catch {}
      }
    }

    // Update job with results
    await payload.update({
      collection: 'scrape-jobs',
      id: jobId,
      data: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        resultsFound: result.artists.length,
        newArtists,
        duplicatesSkipped,
        rawResults: result.artists.slice(0, 5), // Store first 5 for debugging
      },
    })

    console.log(`[ScrapeJob] ${jobId}: ${newArtists} new, ${duplicatesSkipped} reused/updated`)
  } catch (error) {
    console.error(`[ScrapeJob] ${jobId} failed:`, error)

    try {
      const payload = await getPayload({ config })
      await payload.update({
        collection: 'scrape-jobs',
        id: jobId,
        data: {
          status: 'failed',
          completedAt: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    } catch {}
  }
}

export async function GET(request: Request) {
  if (!process.env.ENABLE_SCRAPER) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  try {
    const payload = await getPayload({ config })
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')

    const jobs = await payload.find({
      collection: 'scrape-jobs',
      limit: 20,
      page,
      sort: '-createdAt',
    })

    return NextResponse.json(jobs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
