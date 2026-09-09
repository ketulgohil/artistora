import type { CollectionConfig } from 'payload'
import { sendArtistBookingEmail } from '../lib/email'
import { randomBytes, createHash } from 'crypto'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: {
    singular: 'Quote Request',
    plural: 'Quote Requests',
  },
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'customerPhone', 'eventType', 'eventDate', 'status', 'createdAt'],
    group: 'Marketplace',
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Auto-generate viewToken on create
        if (operation === 'create' && !data?.viewTokenHash) {
          const rawToken = randomBytes(32).toString('hex')
          data.viewTokenHash = hashToken(rawToken)
          data.viewTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          // Store raw token temporarily for the response (not persisted)
          ;(data as any)._rawViewToken = rawToken
        }
        // Prevent token updates after creation
        if (operation === 'update') {
          if (data?.viewTokenHash) delete data.viewTokenHash
          if (data?.viewTokenExpiresAt) delete data.viewTokenExpiresAt
          if (data?.viewToken) delete data.viewToken
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req, previousDoc }) => {
        // Only trigger when status changes TO 'booked'
        if (operation !== 'update') return
        if (doc.status !== 'booked') return
        if (previousDoc?.status === 'booked') return

        const {
          customerName, customerPhone, customerEmail,
          eventType, eventDate, eventLocation,
          guestCount, designStyle, matchedArtists,
        } = doc

        // 1. Create a booking from the lead data
        try {
          await req.payload.create({
            collection: 'bookings',
            data: {
              name: customerName,
              phone: customerPhone,
              email: customerEmail || undefined,
              eventType,
              eventDate,
              location: eventLocation,
              guestCount: guestCount || undefined,
              designStyle: designStyle || undefined,
              message: `Converted from lead #${doc.id}`,
              status: 'confirmed',
            },
            overrideAccess: true,
          })
          req.payload.logger.info(`Lead #${doc.id} converted to booking`)
        } catch (err) {
          req.payload.logger.error(`Failed to create booking from lead #${doc.id}: ${err}`)
        }

        // 2. Email matched artists with booking details
        if (matchedArtists && matchedArtists.length > 0) {
          const artistIds = Array.isArray(matchedArtists)
            ? matchedArtists.map((a: any) => (typeof a === 'object' ? a.id : a))
            : [typeof matchedArtists === 'object' ? (matchedArtists as any).id : matchedArtists]

          for (const artistId of artistIds) {
            try {
              const artist = await req.payload.findByID({
                collection: 'artists',
                id: artistId,
                overrideAccess: true,
              })

              if (artist.user) {
                const user = await req.payload.findByID({
                  collection: 'users',
                  id: typeof artist.user === 'object' ? artist.user.id : artist.user,
                  overrideAccess: true,
                })

                if (user.email) {
                  await sendArtistBookingEmail(user.email, {
                    artistName: artist.displayName || customerName,
                    customerName,
                    customerPhone,
                    eventType,
                    eventDate,
                    eventLocation,
                    guestCount: guestCount || undefined,
                    designStyle: designStyle || undefined,
                  })
                }
              }
            } catch (err) {
              req.payload.logger.error(`Failed to email artist ${artistId}: ${err}`)
            }
          }
        }
      },
    ],
  },
  access: {
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      if (req.user?.role === 'artist') {
        return {
          'matchedArtists.user': { equals: req.user.id },
        }
      }
      return false
    },
    create: () => true,
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return false
    },
    delete: ({ req }) => {
      return req.user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'customerName',
      type: 'text',
      required: true,
    },
    {
      name: 'customerPhone',
      type: 'text',
      required: true,
    },
    {
      name: 'customerEmail',
      type: 'email',
    },
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      label: 'Registered Customer',
      access: {
        update: () => false,
        create: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Links lead to logged-in customer account',
      },
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Wedding', value: 'wedding' },
        { label: 'Engagement Celebration', value: 'engagement' },
        { label: 'Birthday', value: 'birthday' },
        { label: 'Baby Shower', value: 'baby-shower' },
        { label: 'Corporate Event', value: 'corporate' },
        { label: 'Festival or Celebration', value: 'festival' },
        { label: 'Legacy: Bridal Mehndi', value: 'bridal' },
        { label: 'Legacy: Family Function', value: 'family-function' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'eventDate',
      type: 'date',
      required: true,
    },
    {
      name: 'eventLocation',
      type: 'text',
      required: true,
      label: 'Event venue / area in Ahmedabad',
    },
    {
      name: 'guestCount',
      type: 'number',
      min: 1,
      label: 'Approximate number of people needing mehndi',
    },
    {
      name: 'budgetRange',
      type: 'select',
      options: [
        { label: 'Under ₹2,000', value: 'under-2000' },
        { label: '₹2,000 – ₹5,000', value: '2000-5000' },
        { label: '₹5,000 – ₹10,000', value: '5000-10000' },
        { label: '₹10,000 – ₹20,000', value: '10000-20000' },
        { label: '₹20,000 – ₹50,000', value: '20000-50000' },
        { label: 'Above ₹50,000', value: 'above-50000' },
        { label: 'Not sure yet', value: 'unsure' },
      ],
    },
    {
      name: 'serviceType',
      type: 'relationship',
      relationTo: 'services',
    },
    {
      name: 'designStyle',
      type: 'text',
      label: 'Preferred design style (e.g. Arabic, Bridal, Minimal)',
    },
    {
      name: 'additionalNotes',
      type: 'textarea',
    },
    {
      name: 'referenceImages',
      type: 'array',
      label: 'Reference Design Images',
      maxRows: 5,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'matchedArtists',
      type: 'relationship',
      relationTo: 'artists',
      hasMany: true,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'acceptedQuote',
      type: 'relationship',
      relationTo: 'quotes',
      label: 'Accepted Quote',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Artists Matched', value: 'artists_matched' },
        { label: 'Quotes Received', value: 'quotes_received' },
        { label: 'Customer Contacted', value: 'customer_contacted' },
        { label: 'Artist Selected', value: 'artist_selected' },
        { label: 'Booking Pending', value: 'booking_pending' },
        { label: 'Booked', value: 'booked' },
        { label: 'Lost', value: 'lost' },
        { label: 'Closed', value: 'closed' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lostReason',
      type: 'textarea',
      label: 'Lost Reason',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'lost',
      },
    },
    {
      name: 'assignedAdmin',
      type: 'relationship',
      relationTo: 'users',
      label: 'Assigned Admin',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'viewTokenHash',
      type: 'text',
      unique: true,
      access: {
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'SHA-256 hash of the access token (raw token is never stored)',
      },
    },
    {
      name: 'viewTokenExpiresAt',
      type: 'date',
      label: 'Token Expires At',
      access: {
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Token expiry date (7 days from creation)',
      },
    },
    {
      name: 'viewTokenRevokedAt',
      type: 'date',
      label: 'Token Revoked At',
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description: 'Set when token is revoked (e.g. after quote acceptance)',
      },
    },
    {
      name: 'bookingAccessTokenHash',
      type: 'text',
      access: {
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'SHA-256 hash of booking access token (issued after quote acceptance)',
      },
    },
    {
      name: 'bookingAccessTokenExpiresAt',
      type: 'date',
      label: 'Booking Token Expires At',
      access: {
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Booking access token expiry (30 days)',
      },
    },
  ],
  timestamps: true,
}
