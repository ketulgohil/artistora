import type { CollectionConfig } from 'payload'
import { sendBookingConfirmation, sendBookingNotification } from '../lib/email'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'eventType', 'eventDate', 'status', 'createdAt'],
    group: 'Artistora',
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return

        const { name, phone, email, eventType, eventDate, location, guestCount, message } = doc

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
      },
    ],
  },
  access: {
    read: ({ req }) => {
      // Admins can read all
      if (req.user?.role === 'admin') return true

      // Artists can read bookings assigned to them
      if (req.user?.role === 'artist') {
        return {
          or: [
            { artist: { equals: req.user.id } },
          ],
        }
      }

      // Customers and unauthenticated: no direct read via REST
      // (use /api/my-bookings endpoint with phone lookup instead)
      return false
    },
    create: () => true, // Anyone can create a booking (guest or logged in)
    update: ({ req }) => {
      // Admins can update all
      if (req.user?.role === 'admin') return true

      // Artists can update their assigned bookings (status changes)
      if (req.user?.role === 'artist') {
        return {
          or: [
            { artist: { equals: req.user.id } },
          ],
        }
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
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Phone Number',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: 'Event Type',
      options: [
        { label: 'Bridal Mehndi', value: 'bridal' },
        { label: 'Engagement Mehndi', value: 'engagement' },
        { label: 'Baby Shower', value: 'baby-shower' },
        { label: 'Family Function', value: 'family-function' },
        { label: 'Festival', value: 'festival' },
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
      label: 'Venue / Area in Ahmedabad',
    },
    {
      name: 'guestCount',
      type: 'number',
      min: 1,
      label: 'Number of people needing mehndi',
    },
    {
      name: 'designStyle',
      type: 'text',
      label: 'Preferred design style (Arabic, Bridal, Minimal, etc.)',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Any additional details or requests',
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      label: 'Assigned Artist',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
