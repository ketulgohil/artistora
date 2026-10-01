import type { CollectionConfig } from 'payload'

/**
 * Public media collection for portfolio images and profile photos.
 * Customer reference images are stored in the private-media collection instead.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return { uploadedBy: { equals: req.user?.id } }
    },
    delete: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return { uploadedBy: { equals: req.user?.id } }
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Auto-create portfolio item when an artist uploads an image
        if (operation === 'create' && req.user && doc.id) {
          try {
            // Skip if this image is already used as a profile photo
            const existingArtist = await req.payload.find({
              collection: 'artists',
              where: { profilePhoto: { equals: doc.id } },
              limit: 1,
              req,
              overrideAccess: true,
            })
            if (existingArtist.docs.length > 0) return doc

            // Skip HEIC files (not supported by browsers)
            if (doc.mimeType === 'image/heic' || doc.filename?.toLowerCase().endsWith('.heic'))
              return doc

            // Find artist linked to this user
            const artists = await req.payload.find({
              collection: 'artists',
              where: { user: { equals: req.user.id } },
              limit: 1,
              req,
              overrideAccess: true,
            })

            if (artists.docs.length > 0) {
              const artist = artists.docs[0]

              // Get the first portfolio category for this artist's service type
              const categories = await req.payload.find({
                collection: 'portfolio-categories',
                limit: 10,
                req,
                overrideAccess: true,
              })

              // Determine service category from artist's service type
              const artistType = (artist as any).artistType || ''
              let serviceCategory: 'mehndi' | 'photography' | 'makeup' | 'decor' | 'other' = 'other'
              if (artistType.includes('mehndi') || artistType.includes('henna'))
                serviceCategory = 'mehndi'
              else if (artistType.includes('photo') || artistType.includes('shoot'))
                serviceCategory = 'photography'
              else if (artistType.includes('makeup') || artistType.includes('beauty'))
                serviceCategory = 'makeup'
              else if (artistType.includes('decor') || artistType.includes('planner'))
                serviceCategory = 'decor'

              // Find matching category (optional)
              const categoryMap: Record<string, string> = {
                mehndi: 'bridal-mehndi',
                photography: 'wedding-photography',
                makeup: 'bridal-makeup',
                decor: 'event-decor',
                other: 'event-decor',
              }
              const targetSlug = categoryMap[serviceCategory] || 'event-decor'
              const category = categories.docs.find((c: any) => c.slug === targetSlug) || null

              await req.payload.create({
                collection: 'portfolio-items',
                data: {
                  image: doc.id,
                  ...(category ? { category: category.id } : {}),
                  serviceCategory,
                  artist: artist.id,
                  altText: doc.alt || `Portfolio image by ${(artist as any).displayName}`,
                  featured: false,
                } as any,
                req,
                overrideAccess: true,
              })
              req.payload.logger.info(
                `[Media] Auto-created portfolio item for artist ${(artist as any).displayName}`,
              )

              // Also add to artist's portfolioImages array (used by artist profile page)
              const rawPortfolio = (artist as any).portfolioImages || []
              const existingPortfolio = rawPortfolio
                .map((item: any) => ({
                  image:
                    typeof item?.image === 'object' && item?.image !== null
                      ? item.image.id
                      : item?.image,
                  caption: item?.caption || '',
                }))
                .filter((item: any) => Boolean(item.image))

              const alreadyHasImage = existingPortfolio.some((item: any) => item.image === doc.id)
              if (!alreadyHasImage) {
                await req.payload.update({
                  collection: 'artists',
                  id: artist.id,
                  data: {
                    portfolioImages: [...existingPortfolio, { image: doc.id, caption: '' }],
                  },
                  req,
                  overrideAccess: true,
                })
                req.payload.logger.info(
                  `[Media] Added to artist portfolioImages for ${(artist as any).displayName}`,
                )
              }
            }
          } catch (err: any) {
            // Don't fail upload if portfolio creation fails
            console.error('[Media] Failed to auto-create portfolio item:', err.message)
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      defaultValue: '',
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: () => true, // Allowed on create; set by beforeChange hook from authenticated session
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/pjpeg',
      'image/png',
      'image/x-png',
      'image/webp',
      'image/gif',
      'image/avif',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 600,
        height: 400,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
}
