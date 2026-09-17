import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const status = url.searchParams.get('status')

    const where: any = {}
    if (status) where.status = { equals: status }

    const campaigns = await payload.find({
      collection: 'campaigns',
      where: Object.keys(where).length > 0 ? where : undefined,
      limit: 20,
      page,
      sort: '-createdAt',
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const {
      name,
      description,
      channel,
      template,
      customTemplateBody,
      targetFilters,
      maxRecipients,
      delayBetweenMessages,
    } = body

    if (!name || !channel || !template) {
      return NextResponse.json(
        { error: 'name, channel, and template are required' },
        { status: 400 },
      )
    }

    // Find matching artists based on filters
    const where: any = { outreachStatus: { equals: 'new' } }

    if (targetFilters?.minLeadScore) {
      where.leadScore = { greater_than_equal: targetFilters.minLeadScore }
    }

    if (targetFilters?.sources && targetFilters.sources.length > 0) {
      where.source = { in: targetFilters.sources.map((s: any) => s.source || s) }
    }

    // Get artists that match
    const matchingArtists = await payload.find({
      collection: 'discovered-artists',
      where,
      limit: maxRecipients || 50,
      sort: '-leadScore',
    })

    // Create campaign
    const campaign = await payload.create({
      collection: 'campaigns',
      data: {
        name,
        description,
        channel,
        template,
        customTemplateBody,
        targetFilters,
        maxRecipients: maxRecipients || 50,
        delayBetweenMessages: delayBetweenMessages || 120,
        status: 'draft',
        totalRecipients: matchingArtists.docs.length,
        sentCount: 0,
        createdBy: body.userId || 1, // Default to first user for now
      },
    })

    return NextResponse.json({
      campaign,
      matchingArtists: matchingArtists.docs.length,
      message: `Campaign created with ${matchingArtists.docs.length} matching artists`,
    })
  } catch (error) {
    console.error('[Campaigns API] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
