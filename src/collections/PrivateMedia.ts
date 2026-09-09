import type { CollectionConfig } from 'payload'

/**
 * Private media collection for customer reference images and other non-public files.
 * Stored in a separate path from public portfolio media.
 */
export const PrivateMedia: CollectionConfig = {
  slug: 'private-media',
  labels: {
    singular: 'Private File',
    plural: 'Private Files',
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Artistora',
  },
  access: {
    read: ({ req, data }) => {
      // Admins can read all
      if (req.user?.role === 'admin') return true

      // Owner can read their own uploads
      if (req.user && data?.uploadedBy) {
        const uploaderId = typeof data.uploadedBy === 'object'
          ? (data.uploadedBy as any).id
          : data.uploadedBy
        return uploaderId === req.user.id
      }

      // Artists can read files linked to their assigned leads
      if (req.user?.role === 'artist' && data?.leadId) {
        return {
          'leadId.matchedArtists.user': { equals: req.user.id },
        }
      }

      return false
    },
    create: ({ req }) => {
      // Authenticated users only
      return !!req.user
    },
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return false // No one can modify metadata after upload
    },
    delete: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return false
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
      // Guest reference uploads do not have a Payload user; access is granted
      // only through the token-validated guest-upload endpoint.
      required: false,
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'leadId',
      type: 'relationship',
      relationTo: 'leads',
      label: 'Associated Lead',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Tie this file to a specific lead',
      },
    },
  ],
  upload: {
    staticDir: 'private-media',
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
}
