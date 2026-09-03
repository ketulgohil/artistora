import type { CollectionConfig } from 'payload'

export const Artists: CollectionConfig = {
  slug: 'artists',
  access: {
    read: () => true,
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
      name: 'startingPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Starting price in INR (e.g. 2000)',
      },
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
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'reviewCount',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
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
