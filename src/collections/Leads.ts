import type { CollectionConfig } from 'payload'
import { sendArtistBookingEmail } from '../lib/email'

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
    afterChange: [
      async ({ doc, operation, req, previousDoc }) => {
        // Only trigger when status changes TO 'booked'
        if (operation !== 'update') return
        if (doc.status !== 'booked') return
        if (previousDoc?.status === 'booked') return // already converted

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
              })

              // Get the user's email from the artist's linked user
              if (artist.user) {
                const user = await req.payload.findByID({
                  collection: 'users',
                  id: typeof artist.user === 'object' ? artist.user.id : artist.user,
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
      // Admins can read all
      if (req.user?.role === 'admin') return true

      // Artists can read leads where they are matched
      if (req.user?.role === 'artist') {
        return {
          'matchedArtists.user': { equals: req.user.id },
        }
      }

      // Customers and unauthenticated: no direct read via REST
      // (use /api/my-bookings endpoint with phone lookup instead)
      return false
    },
    create: () => true, // Anyone can create a lead (guest or logged in)
    update: ({ req }) => {
      // Admins can update all
      if (req.user?.role === 'admin') return true

      // Artists cannot update leads directly
      return false
    },
    delete: ({ req }) => {
      // Only admins can delete
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
        // Retained for existing leads created before the marketplace became multi-service.
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
      name: 'matchedArtists',
      type: 'relationship',
      relationTo: 'artists',
      hasMany: true,
    },
    {
      name: 'acceptedQuote',
      type: 'relationship',
      relationTo: 'quotes',
      label: 'Accepted Quote',
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
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lostReason',
      type: 'textarea',
      label: 'Lost Reason',
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
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
