import { NextRequest, NextResponse } from 'next/server'
import { getPortfolioItems } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * GET /api/portfolio
 * Returns unified portfolio items from approved artists and curated portfolio-items collection.
 * Query parameters:
 *  - serviceCategory: 'mehndi' | 'makeup' | 'nail-art' | 'decor' | 'other' (media tagging supports 'photography')
 *  - categorySlug: string
 *  - limit: number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceCategory =
      searchParams.get('serviceCategory') || searchParams.get('category') || undefined
    const categorySlug = searchParams.get('categorySlug') || undefined
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 200

    const items = await getPortfolioItems({
      serviceCategory,
      categorySlug,
      limit,
    })

    return NextResponse.json({
      docs: items,
      totalDocs: items.length,
      limit,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch portfolio items'
    console.error('Portfolio API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
