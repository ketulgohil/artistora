import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, authenticateRequest } from '@/lib/payload'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
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

/**
 * POST /api/dashboard/upload
 * Authenticated upload endpoint for artist profile photos and portfolio media.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await authenticateRequest(request, payload)

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = formData.get('alt') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const rawMimeType = (file.type || '').toLowerCase().split(';')[0].trim()
    if (!ALLOWED_MIME_TYPES.includes(rawMimeType)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!hasValidImageSignature(buffer, rawMimeType)) {
      return NextResponse.json(
        { error: 'File contents do not match the declared image type' },
        { status: 400 },
      )
    }

    const mimeTypeMap: Record<string, string> = {
      'image/jpg': 'image/jpeg',
      'image/pjpeg': 'image/jpeg',
      'image/x-png': 'image/png',
    }
    const finalMimeType = mimeTypeMap[rawMimeType] || rawMimeType

    const uploaded = await payload.create({
      collection: 'media',
      data: {
        alt: alt || `Upload by ${authResult.user.name || authResult.user.email || 'artist'}`,
        uploadedBy: authResult.user.id,
      },
      file: {
        data: buffer,
        mimetype: finalMimeType,
        name: file.name,
        size: file.size,
      },
      overrideAccess: true,
      req: {
        user: authResult.user,
      } as any,
    })

    return NextResponse.json({
      success: true,
      doc: uploaded,
    })
  } catch (error: any) {
    console.error('Dashboard media upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
