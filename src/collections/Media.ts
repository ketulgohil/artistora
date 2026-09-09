import type { CollectionConfig } from 'payload'

/**
 * Public media collection for portfolio images and profile photos.
 * Customer reference images are stored in the private-media collection instead.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return { uploadedBy: { equals: req.user?.id } }
    },
    delete: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return { uploadedBy: { equals: req.user?.id } }
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      defaultValue: '',
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 600,
        height: 400,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
}
