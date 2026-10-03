import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, authenticateRequest } from '@/lib/payload'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB per file
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/avif',
]

function hasValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  const norm = mimeType.toLowerCase()
  if (norm === 'image/jpeg' || norm === 'image/jpg' || norm === 'image/pjpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  if (norm === 'image/png' || norm === 'image/x-png') {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
  }
  if (norm === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    )
  }
  if (norm === 'image/gif') {
    return (
      buffer.length >= 6 &&
      (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
    )
  }
  if (norm === 'image/avif') {
    return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp'
  }
  return false
}

const MIME_TYPE_MAP: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
}

/**
 * POST /api/admin/bulk-upload
 * Bulk media upload endpoint for admin panel.
 * Accepts multiple image files and optionally attaches them as portfolio items to an artist.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await authenticateRequest(request, payload)

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin role required for bulk upload' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const artistIdRaw = formData.get('artistId') as string | null
    const baseAlt = (formData.get('alt') as string | null) || 'Bulk media upload'
    const categorySlug = formData.get('category') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 })
    }

    const artistId = artistIdRaw && !isNaN(Number(artistIdRaw)) ? Number(artistIdRaw) : null
    let targetArtist: any = null
    let targetCategory: any = null

    if (artistId) {
      try {
        targetArtist = await payload.findByID({
          collection: 'artists',
          id: artistId,
          depth: 1,
        })
      } catch (err: any) {
        console.warn(`[BulkUpload] Artist ${artistId} not found:`, err.message)
      }

      // Resolve portfolio category
      try {
        const categories = await payload.find({
          collection: 'portfolio-categories',
          limit: 20,
        })
        if (categorySlug) {
          targetCategory = categories.docs.find((c: any) => c.slug === categorySlug)
        }
        if (!targetCategory && targetArtist) {
          const type = targetArtist.artistType || ''
          const mapping: Record<string, string> = {
            'mehndi-artists': 'bridal-mehndi',
            photographers: 'wedding-photography',
            'makeup-artists': 'bridal-makeup',
            'nail-artists': 'nail-art',
            'decor-event-planners': 'event-decor',
          }
          const defaultSlug = mapping[type] || 'event-decor'
          targetCategory =
            categories.docs.find((c: any) => c.slug === defaultSlug) || categories.docs[0]
        }
      } catch (err: any) {
        console.warn('[BulkUpload] Failed to resolve portfolio category:', err.message)
      }
    }

    const uploadedDocs: any[] = []
    const errors: Array<{ filename: string; error: string }> = []
    const newMediaIds: number[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const rawMime = (file.type || '').toLowerCase().split(';')[0].trim()

      if (!ALLOWED_MIME_TYPES.includes(rawMime)) {
        errors.push({ filename: file.name, error: `Unsupported MIME type: ${file.type}` })
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          filename: file.name,
          error: `File exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        })
        continue
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      if (!hasValidImageSignature(buffer, rawMime)) {
        errors.push({ filename: file.name, error: 'Corrupt or invalid image signature' })
        continue
      }

      const finalMime = MIME_TYPE_MAP[rawMime] || rawMime

      try {
        const docAlt = targetArtist
          ? `${targetArtist.displayName} portfolio sample ${i + 1}`
          : `${baseAlt} - ${file.name}`

        const mediaDoc = await payload.create({
          collection: 'media',
          data: {
            alt: docAlt,
            uploadedBy: authResult.user.id,
          },
          file: {
            data: buffer,
            mimetype: finalMime,
            name: file.name,
            size: file.size,
          },
          overrideAccess: true,
        })

        uploadedDocs.push(mediaDoc)
        newMediaIds.push(mediaDoc.id)

        // Create portfolio-items entry if artist is known
        if (targetArtist) {
          const type = targetArtist.artistType || ''
          let serviceCat: 'mehndi' | 'photography' | 'makeup' | 'decor' | 'other' = 'other'
          if (type.includes('mehndi') || type.includes('henna')) serviceCat = 'mehndi'
          else if (type.includes('photo') || type.includes('shoot')) serviceCat = 'photography'
          else if (type.includes('makeup') || type.includes('beauty')) serviceCat = 'makeup'
          else if (type.includes('decor') || type.includes('planner')) serviceCat = 'decor'

          try {
            await payload.create({
              collection: 'portfolio-items',
              data: {
                image: mediaDoc.id,
                ...(targetCategory ? { category: targetCategory.id } : {}),
                serviceCategory: serviceCat,
                artist: targetArtist.id,
                altText: docAlt,
                featured: false,
              } as any,
              overrideAccess: true,
            })
          } catch (err: any) {
            console.warn(
              `[BulkUpload] Failed to create portfolio item for ${mediaDoc.id}:`,
              err.message,
            )
          }
        }
      } catch (err: any) {
        errors.push({ filename: file.name, error: err.message || 'Media creation failed' })
      }
    }

    // If attached to an artist, append all new media IDs to portfolioImages
    let artistUpdated = false
    if (targetArtist && newMediaIds.length > 0) {
      try {
        const rawPortfolio = targetArtist.portfolioImages || []
        const existingPortfolio = rawPortfolio
          .map((item: any) => ({
            image:
              typeof item?.image === 'object' && item?.image !== null ? item.image.id : item?.image,
            caption: typeof item?.caption === 'string' ? item.caption : '',
          }))
          .filter((item: any) => Boolean(item.image))

        const newPortfolioEntries = newMediaIds.map((id) => ({
          image: id,
          caption: '',
        }))

        await payload.update({
          collection: 'artists',
          id: targetArtist.id,
          data: {
            portfolioImages: [...existingPortfolio, ...newPortfolioEntries],
          },
          overrideAccess: true,
        })
        artistUpdated = true
      } catch (err: any) {
        console.error(`[BulkUpload] Failed to update artist portfolio array:`, err.message)
      }
    }

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedDocs.length,
      failedCount: errors.length,
      uploaded: uploadedDocs,
      errors: errors.length > 0 ? errors : undefined,
      artistUpdated,
      artist: targetArtist ? { id: targetArtist.id, name: targetArtist.displayName } : null,
    })
  } catch (error: any) {
    console.error('[BulkUpload] Fatal endpoint error:', error)
    return NextResponse.json({ error: error.message || 'Bulk upload failed' }, { status: 500 })
  }
}
