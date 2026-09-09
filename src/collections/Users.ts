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
    create: () => true, // Allow registration; role restriction enforced in field-level access + hook
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      if (req.user) {
        return { id: { equals: req.user.id } }
      }
      return false
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Prevent privilege escalation: strip role=admin from non-admin creates
        if (operation === 'create') {
          if (data?.role === 'admin' && req.user?.role !== 'admin') {
            data.role = 'customer'
          }
          // Allow only customer or artist for public registration
          if (!data?.role || !['customer', 'artist'].includes(data.role)) {
            data.role = 'customer'
          }
        }
        // Prevent role change to admin unless done by existing admin
        if (operation === 'update' && data?.role === 'admin' && req.user?.role !== 'admin') {
          delete data.role
        }
        return data
      },
    ],
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
        create: ({ req }) => {
          // Only admins can set role during creation (all others forced to customer/artist via hook)
          return req.user?.role === 'admin'
        },
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}
