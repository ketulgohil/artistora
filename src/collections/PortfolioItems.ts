import type { CollectionConfig } from 'payload'

export const PortfolioItems: CollectionConfig = {
  slug: 'portfolio-items',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'altText',
    defaultColumns: ['image', 'artist', 'serviceCategory', 'category', 'featured', 'createdAt'],
    group: 'Portfolio',
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'portfolio-categories',
      required: true,
      label: 'Style / Subcategory',
    },
    {
      name: 'serviceCategory',
      type: 'select',
      required: true,
      defaultValue: 'mehndi',
      label: 'Service Category',
      options: [
        { label: 'Mehndi', value: 'mehndi' },
        { label: 'Photography', value: 'photography' },
        { label: 'Makeup', value: 'makeup' },
        { label: 'Decor & Planning', value: 'decor' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Broad service category used for the public portfolio filter',
      },
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      label: 'Artist',
      admin: {
        position: 'sidebar',
        description: 'The artist whose work is shown in this portfolio item',
      },
    },
    {
      name: 'altText',
      type: 'text',
      required: true,
      defaultValue: 'Mehndi design image',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
