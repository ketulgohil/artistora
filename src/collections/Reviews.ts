import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'artist', 'rating', 'verifiedBooking', 'createdAt'],
    group: 'Marketplace',
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create' && operation !== 'update') return

        // Update artist rating and reviewCount when review is created/updated
        if (doc.artist) {
          try {
            const artistId = typeof doc.artist === 'object' ? doc.artist.id : doc.artist

            // Calculate average rating from all verified reviews
            const { docs: reviews } = await req.payload.find({
              collection: 'reviews',
              where: {
                and: [
                  { artist: { equals: artistId } },
                  { verifiedBooking: { equals: true } },
                ],
              },
              limit: 0,
            })

            if (reviews.length > 0) {
              const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
              const avgRating = Math.round((totalRating / reviews.length) * 10) / 10

              await req.payload.update({
                collection: 'artists',
                id: artistId,
                data: {
                  rating: avgRating,
                  reviewCount: reviews.length,
                },
              })
            }
          } catch (err) {
            req.payload.logger.error(`Failed to update artist rating: ${err}`)
          }
        }
      },
    ],
  },
  access: {
    read: () => true, // Reviews are public
    create: ({ req }) => {
      // Logged-in users can create reviews
      return !!req.user
    },
    update: ({ req }) => {
      // Admins can update all; users can update their own reviews
      if (req.user?.role === 'admin') return true
      return {
        user: { equals: req.user?.id },
      }
    },
    delete: ({ req }) => {
      // Admins can delete all; users can delete their own reviews
      if (req.user?.role === 'admin') return true
      return {
        user: { equals: req.user?.id },
      }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customerName',
      type: 'text',
      required: true,
      label: 'Your Name',
    },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
      label: 'Related Booking',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      required: true,
      label: 'Artist Reviewed',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: 'Rating (1-5)',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Review Title',
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Your Review',
    },
    {
      name: 'verifiedBooking',
      type: 'checkbox',
      defaultValue: false,
      label: 'Verified Booking',
      admin: {
        position: 'sidebar',
        description: 'Set to true if the review is from a completed booking',
      },
    },
    {
      name: 'helpfulCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
