import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  access: {
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      if (req.user) {
        return { id: { equals: req.user.id } }
      }
      return false
    },
    create: () => true, // Allow registration
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      if (req.user) {
        return { id: { equals: req.user.id } }
      }
      return false
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Artist', value: 'artist' },
        { label: 'Admin', value: 'admin' },
      ],
      required: true,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}
