import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimitAsync, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { verifyToken } from '@/lib/token'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function hasValidImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  if (mimeType === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  }
  if (mimeType === 'image/webp') {
    return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  }
  return false
}

/**
 * POST /api/guest-upload — Guest reference image upload
 * Requires a valid lead view token. Stores files in the private-media collection.
 * Files are tied to the lead and cannot be accessed by unrelated users.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimitAsync(ip, RATE_LIMITS.guestUpload, 'guestUpload')
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please try again later.' },
        { status: 429 },
      )
    }

    const payload = await getPayload({ config })

    // Validate token from form data
    const formData = await request.formData()
    const token = formData.get('token') as string | null
    const leadId = formData.get('leadId') as string | null
    const file = formData.get('file') as File | null

    if (!token || !leadId) {
      return NextResponse.json({ error: 'Token and leadId are required' }, { status: 400 })
    }

    // Verify token
    const leads = await payload.find({
      collection: 'leads',
      where: { id: { equals: leadId } },
      limit: 1,
    })

    if (leads.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid lead' }, { status: 404 })
    }

    const lead = leads.docs[0]
    const tokenResult = verifyToken({
      rawToken: token,
      storedHash: lead.viewTokenHash,
      expiresAt: lead.viewTokenExpiresAt,
      revokedAt: lead.viewTokenRevokedAt,
    })

    if (!tokenResult.valid) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status })
    }

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      )
    }

    // Check existing file count for this lead
    const existingFiles = await payload.find({
      collection: 'private-media',
      where: { leadId: { equals: Number(leadId) } },
      limit: MAX_FILES,
    })

    if (existingFiles.docs.length >= MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} reference images allowed per lead` },
        { status: 400 },
      )
    }

    // Upload to private-media collection
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!hasValidImageSignature(buffer, file.type)) {
      return NextResponse.json({ error: 'File contents do not match the declared image type' }, { status: 400 })
    }

    const uploaded = await payload.create({
      collection: 'private-media',
      data: {
        alt: `Reference design for lead #${leadId}`,
        leadId: Number(leadId),
      } as any,
      filePath: undefined,
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      id: uploaded.id,
      filename: uploaded.filename,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
