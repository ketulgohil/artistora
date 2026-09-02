import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'customerPhone', 'eventType', 'eventDate', 'status', 'createdAt'],
    group: 'Marketplace',
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
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Quotes Sent', value: 'quotes-sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Booked', value: 'booked' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
