import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'artist', 'rating', 'verifiedBooking', 'createdAt'],
    group: 'Marketplace',
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data

        const isSystemOp = !!data.user // If user already provided, it's a system/admin operation

        // Authenticated API calls: derive user from session
        if (!isSystemOp) {
          if (req.user) {
            data.user = req.user.id
          } else {
            throw new Error('Authentication required to create a review')
          }
        }

        // Validate booking exists and belongs to this user (skip for system operations)
        if (data.booking && !isSystemOp) {
          const booking = await req.payload.findByID({
            collection: 'bookings',
            id: data.booking,
          }).catch(() => null)

          if (!booking) {
            throw new Error('Booking not found')
          }

          // Verify booking is completed
          if (booking.status !== 'completed') {
            throw new Error('Can only review completed bookings')
          }

          // Verify booking belongs to this user (by email)
          const userEmail = (req.user as any)?.email
          if (!booking.email || booking.email !== userEmail) {
            throw new Error('You can only review your own bookings')
          }

          // Derive artist from booking — don't trust client
          if (booking.artist) {
            data.artist = typeof booking.artist === 'object' ? booking.artist.id : booking.artist
          } else if (Array.isArray(booking.assignedArtists) && booking.assignedArtists.length > 0) {
            const firstArtist = booking.assignedArtists[0]
            data.artist = typeof firstArtist.artist === 'object' ? firstArtist.artist.id : firstArtist.artist
          }

          // Check for duplicate reviews on same booking
          const existingReview = await req.payload.find({
            collection: 'reviews',
            where: {
              and: [
                { booking: { equals: data.booking } },
                { user: { equals: data.user } },
              ],
            },
            limit: 1,
          })

          if (existingReview.docs.length > 0) {
            throw new Error('You have already reviewed this booking')
          }
        }

        // Prevent client from setting moderation fields (allow system ops to set them)
        if (!isSystemOp) {
          data.verifiedBooking = false
          data.helpfulCount = 0
        }

        return data
      },
    ],
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
              overrideAccess: true,
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
                overrideAccess: true,
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
      // Only authenticated users can create reviews
      return !!req.user
    },
    update: ({ req }) => {
      // Only admins can update (for moderation)
      return req.user?.role === 'admin'
    },
    delete: ({ req }) => {
      // Only admins can delete
      return req.user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: {
        create: () => false, // Set by hook from session
        update: () => false,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customerName',
      type: 'text',
      required: true,
      label: 'Your Name',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
      label: 'Related Booking',
      access: {
        create: () => false, // Set by hook
        update: ({ req }) => req.user?.role === 'admin',
      },
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
      access: {
        create: () => false, // Derived from booking by hook
        update: ({ req }) => req.user?.role === 'admin',
      },
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
      access: {
        create: () => false, // Set by hook
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description: 'Set to true if the review is from a completed booking',
      },
    },
    {
      name: 'helpfulCount',
      type: 'number',
      defaultValue: 0,
      access: {
        create: () => false, // Set by hook
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
