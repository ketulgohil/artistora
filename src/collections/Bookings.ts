import type { CollectionConfig, Where } from 'payload'
import { sendBookingConfirmation, sendBookingNotification, sendArtistBookingEmail } from '../lib/email'
import { checkArtistAvailability } from '../lib/availability'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'eventType', 'eventDate', 'status', 'createdAt'],
    group: 'Artistora',
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Availability conflict check before confirming booking
        if (data?.status === 'confirmed' && originalDoc?.status !== 'confirmed') {
          const artistId = data.artist || originalDoc?.artist
          const numericArtistId =
            typeof artistId === 'object' && artistId !== null ? artistId.id : Number(artistId)

          const eventDate = data.eventDate || originalDoc?.eventDate

          if (numericArtistId && eventDate) {
            const conflict = await checkArtistAvailability(
              req.payload,
              numericArtistId,
              eventDate,
              originalDoc?.id,
            )

            if (!conflict.available) {
              throw new Error(
                conflict.reason || 'Cannot confirm booking: artist has a scheduling conflict.',
              )
            }
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req, previousDoc }) => {
        const {
          name,
          phone,
          email,
          eventType,
          eventDate,
          location,
          guestCount,
          designStyle,
          message,
          artist,
          assignedArtists,
          status,
        } = doc

        // 1. Initial creation notifications
        if (operation === 'create') {
          // Send confirmation email to customer
          if (email) {
            try {
              await sendBookingConfirmation(email, {
                name,
                eventType,
                eventDate,
                location,
              })
            } catch (err) {
              req.payload.logger.error(`Failed to send booking confirmation to ${email}: ${err}`)
            }
          }

          // Send notification to Artistora admin
          try {
            await sendBookingNotification({
              name,
              phone,
              email,
              eventType,
              eventDate,
              location,
              guestCount,
              message,
            })
          } catch (err) {
            req.payload.logger.error(`Failed to send booking notification: ${err}`)
          }
        }

        // 2. Notify assigned artists when booking is assigned or moved to artist_pending / confirmed
        const isNewOrNewlyAssigned =
          operation === 'create' ||
          (previousDoc?.status !== 'artist_pending' && status === 'artist_pending') ||
          (previousDoc?.status !== 'confirmed' && status === 'confirmed')

        if (isNewOrNewlyAssigned) {
          // Collect all artist IDs to notify
          const artistIdsToNotify = new Set<number>()

          if (artist) {
            const aId = typeof artist === 'object' ? artist.id : Number(artist)
            if (aId) artistIdsToNotify.add(aId)
          }

          if (Array.isArray(assignedArtists)) {
            for (const item of assignedArtists) {
              const aId =
                typeof item.artist === 'object' ? item.artist.id : Number(item.artist)
              if (aId) artistIdsToNotify.add(aId)
            }
          }

          for (const artistId of artistIdsToNotify) {
            try {
              const artistDoc = await req.payload.findByID({
                collection: 'artists',
                id: artistId,
                depth: 1,
                overrideAccess: true,
              })

              if (artistDoc?.user) {
                const userDoc = await req.payload.findByID({
                  collection: 'users',
                  id: typeof artistDoc.user === 'object' ? artistDoc.user.id : artistDoc.user,
                  overrideAccess: true,
                })

                if (userDoc?.email) {
                  await sendArtistBookingEmail(userDoc.email, {
                    artistName: artistDoc.displayName || name,
                    customerName: name,
                    customerPhone: phone,
                    eventType,
                    eventDate,
                    eventLocation: location,
                    guestCount: guestCount || undefined,
                    designStyle: designStyle || undefined,
                  })
                }
              }
            } catch (err) {
              req.payload.logger.error(`Failed to notify artist #${artistId}: ${err}`)
            }
          }
        }
      },
    ],
  },
  access: {
    read: ({ req }) => {
      // Admins can read all
      if (req.user?.role === 'admin') return true

      // Artists can read bookings assigned to them (primary artist or inside assignedArtists)
      if (req.user?.role === 'artist') {
        const whereCondition: Where = {
          or: [
            { 'artist.user': { equals: req.user.id } },
            { 'assignedArtists.artist.user': { equals: req.user.id } },
          ],
        }
        return whereCondition
      }

      // Customers and unauthenticated use secure endpoints
      return false
    },
    create: ({ req }) => {
      // Only admins and artists can create bookings directly via API
      // (public booking requests go through quote acceptance which creates via server)
      if (req.user?.role === 'admin' || req.user?.role === 'artist') return true
      return false
    },
    update: ({ req }) => {
      // Admins can update all
      if (req.user?.role === 'admin') return true

      // Artists can update their assigned bookings (e.g. acceptance, status)
      if (req.user?.role === 'artist') {
        const whereCondition: Where = {
          or: [
            { 'artist.user': { equals: req.user.id } },
            { 'assignedArtists.artist.user': { equals: req.user.id } },
          ],
        }
        return whereCondition
      }

      return false
    },
    delete: ({ req }) => {
      // Only admins can delete
      return req.user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Full Name',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Phone Number',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: 'Event Type',
      options: [
        { label: 'Wedding', value: 'wedding' },
        { label: 'Engagement Celebration', value: 'engagement' },
        { label: 'Birthday', value: 'birthday' },
        { label: 'Baby Shower', value: 'baby-shower' },
        { label: 'Corporate Event', value: 'corporate' },
        { label: 'Festival or Celebration', value: 'festival' },
        // Retained for existing records created before the marketplace became multi-service.
        { label: 'Legacy: Bridal Mehndi', value: 'bridal' },
        { label: 'Legacy: Family Function', value: 'family-function' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'eventDate',
      type: 'date',
      required: true,
      label: 'Event Date',
    },
    {
      name: 'location',
      type: 'text',
      required: true,
      label: 'Venue / Area',
    },
    {
      name: 'guestCount',
      type: 'number',
      min: 1,
      label: 'Approximate number of guests / people',
    },
    {
      name: 'designStyle',
      type: 'text',
      label: 'Service preferences (style, coverage, deliverables, timing)',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Any additional details or requests',
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
      label: 'Originating Lead',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'quote',
      type: 'relationship',
      relationTo: 'quotes',
      label: 'Accepted Quote',
      access: {
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
      label: 'Primary / Lead Artist',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'assignedArtists',
      type: 'array',
      label: 'Assigned Artists (Multi-Artist Team)',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        description: 'Manage multiple artists for large events or group functions',
      },
      fields: [
        {
          name: 'artist',
          type: 'relationship',
          relationTo: 'artists',
          required: true,
        },
        {
          name: 'role',
          type: 'select',
          defaultValue: 'lead',
          options: [
            { label: 'Lead Artist', value: 'lead' },
            { label: 'Assistant / Supporting Artist', value: 'assistant' },
            { label: 'Team Member', value: 'member' },
          ],
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending Acceptance', value: 'pending' },
            { label: 'Accepted', value: 'accepted' },
            { label: 'Declined', value: 'declined' },
          ],
        },
        {
          name: 'declineReason',
          type: 'textarea',
          label: 'Decline Reason',
          admin: {
            condition: (_, siblingData) => siblingData?.status === 'declined',
          },
        },
        {
          name: 'fee',
          type: 'number',
          min: 0,
          label: 'Artist Payout / Fee (₹)',
          access: {
            update: ({ req }) => req.user?.role === 'admin',
          },
        },
      ],
    },
    // ── Payment Fields (admin-only) ──
    {
      name: 'totalAmount',
      type: 'number',
      label: 'Total Amount (INR)',
      min: 0,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'advanceAmount',
      type: 'number',
      label: 'Advance Amount (INR)',
      min: 0,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'remainingAmount',
      type: 'number',
      label: 'Remaining Amount (INR)',
      min: 0,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'platformFee',
      type: 'number',
      label: 'Platform Fee (INR)',
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'artistAmount',
      type: 'number',
      label: 'Artist Payout (INR)',
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'unpaid',
      options: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Pending', value: 'pending' },
        { label: 'Partially Paid', value: 'partially_paid' },
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      label: 'Payment Method',
      options: [
        { label: 'Cash', value: 'cash' },
        { label: 'UPI', value: 'upi' },
        { label: 'Bank Transfer', value: 'bank_transfer' },
        { label: 'Online', value: 'online' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentReference',
      type: 'text',
      label: 'Payment Reference / Transaction ID',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      label: 'Registered Customer',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Links booking to logged-in customer account',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'requested',
      options: [
        { label: 'Requested', value: 'requested' },
        { label: 'Artist Pending', value: 'artist_pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Declined', value: 'declined' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      access: {
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'declineReason',
      type: 'textarea',
      label: 'Decline Reason',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'declined',
      },
    },
    {
      name: 'cancelledBy',
      type: 'select',
      label: 'Cancelled By',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Artist', value: 'artist' },
        { label: 'Admin', value: 'admin' },
        { label: 'System', value: 'system' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'cancelled',
      },
    },
    {
      name: 'cancellationReason',
      type: 'textarea',
      label: 'Cancellation Reason',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'cancelled',
      },
    },
    {
      name: 'cancelledAt',
      type: 'date',
      label: 'Cancelled At',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'cancelled',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'refundAmount',
      type: 'number',
      label: 'Refund Amount (INR)',
      min: 0,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'cancelled',
      },
    },
    {
      name: 'refundStatus',
      type: 'select',
      label: 'Refund Status',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Denied', value: 'denied' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'cancelled',
      },
    },
  ],
  timestamps: true,
}
