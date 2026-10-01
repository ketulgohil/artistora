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

export async function prepareImageForUpload(file: File): Promise<File> {
  // If file is already small (under 1.5MB) and is a standard web format, return as is
  const isHeic =
    file.type.includes('heic') || file.type.includes('heif') || /\.(heic|heif)$/i.test(file.name)

  if (file.size <= 1.5 * 1024 * 1024 && !isHeic && file.type.startsWith('image/')) {
    return file
  }

  // Non-browser fallback
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file
  }

  try {
    return await new Promise<File>((resolve) => {
      const img = document.createElement('img')
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        const maxDimension = 2048 // 2K resolution — ultra-sharp for high DPI displays
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
          resolve(file)
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
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
          0.88,
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(file)
      }

      img.src = objectUrl
    })
  } catch {
    return file
  }
}
