import type { CollectionConfig } from 'payload'

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['lead', 'artist', 'amount', 'status', 'createdAt'],
    group: 'Marketplace',
  },
  access: {
    read: ({ req }) => {
      // Admins can read all
      if (req.user?.role === 'admin') return true

      // Artists can read their own quotes
      if (req.user?.role === 'artist') {
        return { artist: { equals: req.user.id } }
      }

      // Customers: no direct read (use API endpoint)
      return false
    },
    create: ({ req }) => {
      // Admins and artists can create quotes
      if (req.user?.role === 'admin') return true
      if (req.user?.role === 'artist') return true
      return false
    },
    update: ({ req }) => {
      // Admins can update all
      if (req.user?.role === 'admin') return true

      // Artists can update their own quotes (limited fields)
      if (req.user?.role === 'artist') {
        return { artist: { equals: req.user.id } }
      }

      return false
    },
    delete: ({ req }) => {
      return req.user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
      required: true,
      label: 'Lead',
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      required: true,
      label: 'Artist',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      label: 'Quote Amount (₹)',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message to customer',
    },
    {
      name: 'estimatedHours',
      type: 'number',
      min: 1,
      label: 'Estimated hours',
    },
    {
      name: 'travelFee',
      type: 'number',
      min: 0,
      label: 'Travel fee (₹)',
      defaultValue: 0,
    },
    {
      name: 'numberOfArtists',
      type: 'number',
      min: 1,
      label: 'Number of artists required',
      defaultValue: 1,
    },
    {
      name: 'validUntil',
      type: 'date',
      label: 'Quote valid until',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Viewed', value: 'viewed' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Expired', value: 'expired' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
