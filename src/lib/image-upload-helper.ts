/**
 * Client-side image pre-processing and downscaling helper.
 *
 * Importers/Callers: `src/app/(frontend)/dashboard/page.tsx`, `src/components/admin/BulkUploadView.tsx`.
 * Solves:
 * 1. Mobile Camera High-Res Photos (e.g. Samsung Galaxy S24 Ultra 50MP/200MP, iPhone Pro RAW/HEIC)
 *    producing 12MB-30MB files that breach Vercel's 4.5MB Serverless function payload limit.
 * 2. Mobile upload latency by compressing 15MB photos to ~600KB-1.2MB 2K crystal-clear JPEGs.
 * 3. EXIF orientation and format normalization.
 */

const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024
const BROWSER_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export async function prepareImageForUpload(file: File): Promise<File> {
  const isHeic =
    /hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)

  if (
    file.size <= MAX_UPLOAD_BYTES &&
    !isHeic &&
    BROWSER_IMAGE_TYPES.has(file.type.toLowerCase())
  ) {
    return file
  }

  // Non-browser fallback
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (isHeic) {
      throw new Error('This HEIC/HEIF photo could not be opened. Please export it as JPG or PNG and try again.')
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('This image is too large to upload. Please resize it and try again.')
    }
    return file
  }

  try {
    return await new Promise<File>((resolve, reject) => {
      const img = document.createElement('img')
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        if (!img.naturalWidth || !img.naturalHeight) {
          reject(new Error('This image could not be decoded. Please choose another image.'))
          return
        }

        const maxDimension = 1920
        let { width, height } = img

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Your browser could not prepare this image. Please try another browser.'))
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const encode = (quality: number) =>
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Your browser could not compress this image. Please try another image.'))
                return
              }
              if (blob.size > MAX_UPLOAD_BYTES && quality > 0.5) {
                encode(Math.max(0.5, quality - 0.1))
                return
              }
              if (blob.size > MAX_UPLOAD_BYTES) {
                reject(new Error('This image is still too large after compression. Please choose a smaller image.'))
                return
              }

            const cleanName = file.name
              .replace(/\.(heic|heif|png|webp|gif|jpg|jpeg)$/i, '')
              .concat('.jpg')

            const optimizedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(optimizedFile)
            },
            'image/jpeg',
            quality,
          )

        encode(0.82)
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(
          new Error(
            isHeic
              ? 'This HEIC/HEIF photo is not supported by your browser. Please export it as JPG or PNG and try again.'
              : 'This image could not be opened. Please choose a JPG, PNG, or WebP image.',
          ),
        )
      }

      img.src = objectUrl
    })
  } catch (error) {
    throw error instanceof Error ? error : new Error('Could not prepare this image for upload.')
  }
}
