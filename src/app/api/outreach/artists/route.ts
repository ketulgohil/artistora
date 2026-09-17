import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const url = new URL(request.url)

    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const source = url.searchParams.get('source')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const minScore = url.searchParams.get('minScore')

    const where: any = {}

    if (source) where.source = { equals: source }
    if (status) where.outreachStatus = { equals: status }
    if (minScore) where.leadScore = { greater_than_equal: parseInt(minScore) }
    if (search) {
      where.or = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { phone: { contains: search } },
        { instagramHandle: { contains: search } },
      ]
    }

    const result = await payload.find({
      collection: 'discovered-artists',
      where: Object.keys(where).length > 0 ? where : undefined,
      limit,
      page,
      sort: '-leadScore',
    })

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
