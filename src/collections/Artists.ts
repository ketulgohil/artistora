import type { CollectionConfig } from 'payload'

export const Artists: CollectionConfig = {
  slug: 'artists',
  access: {
    read: () => true, // Public artist directory
    create: ({ req }) => {
      // Admins and registered artists can create artist profile
      if (req.user?.role === 'admin' || req.user?.role === 'artist') return true
      return false
    },
    update: ({ req }) => {
      // Admins can update all
      if (req.user?.role === 'admin') return true

      // Artists can update their own profile
      if (req.user?.role === 'artist') {
        return {
          user: { equals: req.user.id },
        }
      }

      return false
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'city', 'verified', 'startingPrice', 'updatedAt'],
    group: 'Marketplace',
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'profilePhoto',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'whatsappNumber',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      defaultValue: 'Ahmedabad',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'area',
      type: 'text',
      label: 'Primary service area (e.g. Ahmedabad, Vastrapur)',
    },
    {
      name: 'yearsOfExperience',
      type: 'number',
      min: 0,
    },
    {
      name: 'priceType',
      type: 'select',
      defaultValue: 'package',
      options: [
        { label: 'Package / Fixed Rate', value: 'package' },
        { label: 'Hourly Rate', value: 'hourly' },
        { label: 'Per Person / Guest', value: 'per_person' },
        { label: 'Custom Quote Only', value: 'custom_quote' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Default pricing model',
      },
    },
    {
      name: 'startingPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Starting price in INR for public display (e.g. 2000)',
      },
    },
    {
      name: 'unavailableDates',
      type: 'array',
      label: 'Blocked / Unavailable Dates',
      admin: {
        description: 'Dates when this artist is unavailable for bookings',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'reason',
          type: 'text',
          label: 'Reason (optional)',
        },
      ],
    },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
    },
    {
      name: 'styles',
      type: 'array',
      label: 'Mehndi styles offered',
      fields: [
        {
          name: 'style',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'portfolioImages',
      type: 'array',
      label: 'Portfolio samples',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'approvalStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Suspended', value: 'suspended' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'verificationStatus',
      type: 'select',
      defaultValue: 'unverified',
      options: [
        { label: 'Unverified', value: 'unverified' },
        { label: 'Verified', value: 'verified' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'rating',
      type: 'number',
      min: 0,
      max: 5,
      defaultValue: 0,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'reviewCount',
      type: 'number',
      min: 0,
      defaultValue: 0,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
      },
    },
    // ── Featured & Subscription ──
    {
      type: 'collapsible',
      label: 'Featured & Subscription',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'isFeatured',
          type: 'checkbox',
          defaultValue: false,
          label: 'Featured Artist',
          access: {
            update: ({ req }) => req.user?.role === 'admin',
          },
        },
        {
          name: 'featuredUntil',
          type: 'date',
          label: 'Featured Until',
          admin: {
            condition: (_, siblingData) => siblingData?.isFeatured === true,
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'subscriptionPlan',
          type: 'select',
          defaultValue: 'free',
          label: 'Subscription Plan',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Basic', value: 'basic' },
            { label: 'Premium', value: 'premium' },
          ],
          access: {
            update: ({ req }) => req.user?.role === 'admin',
          },
        },
        {
          name: 'subscriptionExpiresAt',
          type: 'date',
          label: 'Subscription Expires',
          admin: {
            condition: (_, siblingData) => siblingData?.subscriptionPlan !== 'free',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'maxPortfolioItems',
          type: 'number',
          label: 'Max Portfolio Items',
          defaultValue: 10,
          admin: {
            description: 'Free: 10, Basic: 25, Premium: 50',
          },
        },
      ],
    },
    // ── Analytics Fields ──
    {
      type: 'collapsible',
      label: 'Analytics',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'profileViews',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'leadsReceived',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'quotesSent',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'bookingsWon',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'totalEarnings',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total earnings in INR from completed bookings',
          },
        },
      ],
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
