import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, authenticateRequest } from '@/lib/payload'

// GET /api/dashboard/profile — Fetch current artist's full profile
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await authenticateRequest(request, payload)

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = authResult.user

    const artistRes = await payload.find({
      collection: 'artists',
      where: { user: { equals: user.id } },
      limit: 1,
      depth: 2,
    })

    const artist = artistRes.docs[0]
    if (!artist) {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    return NextResponse.json({ artist })
  } catch (error: any) {
    console.error('Dashboard profile GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 })
  }
}

// PATCH /api/dashboard/profile — Update current artist's profile details
export async function PATCH(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await authenticateRequest(request, payload)

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = authResult.user

    const artistRes = await payload.find({
      collection: 'artists',
      where: { user: { equals: user.id } },
      limit: 1,
    })

    const artist = artistRes.docs[0]
    if (!artist) {
      return NextResponse.json({ error: 'Artist profile not found' }, { status: 404 })
    }

    const body = await request.json()

    // Allowed fields for artist self-service update
    const updateData: Record<string, any> = {}

    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.city !== undefined) updateData.city = body.city
    if (body.area !== undefined) updateData.area = body.area
    if (body.yearsOfExperience !== undefined) updateData.yearsOfExperience = body.yearsOfExperience ? Number(body.yearsOfExperience) : null
    if (body.priceType !== undefined) updateData.priceType = body.priceType
    if (body.startingPrice !== undefined) updateData.startingPrice = body.startingPrice ? Number(body.startingPrice) : null
    if (body.styles !== undefined) updateData.styles = body.styles
    if (body.services !== undefined) updateData.services = body.services
    if (body.profilePhoto !== undefined) updateData.profilePhoto = body.profilePhoto
    if (body.portfolioImages !== undefined) updateData.portfolioImages = body.portfolioImages

    const updated = await payload.update({
      collection: 'artists',
      id: artist.id,
      data: updateData,
      depth: 2,
    })

    return NextResponse.json({ success: true, doc: updated })
  } catch (error: any) {
    console.error('Dashboard profile PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  }
}
