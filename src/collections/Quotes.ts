import type { CollectionConfig } from 'payload'

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  admin: {
    defaultColumns: ['lead', 'artist', 'priceQuote', 'status', 'createdAt'],
    group: 'Marketplace',
  },
  fields: [
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
      required: true,
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      required: true,
    },
    {
      name: 'priceQuote',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Quote amount in INR',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Artist notes / message to customer',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Declined', value: 'declined' },
        { label: 'Expired', value: 'expired' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
