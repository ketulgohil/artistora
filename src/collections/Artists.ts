/**
 * Artists Payload CMS Collection Configuration.
 *
 * Importers/Callers: `src/payload.config.ts`, Payload Local API & REST endpoints.
 * Affected APIs: `/api/artists`, `/artists/[slug]`.
 * Schemas: `artists` collection schema (PostgreSQL table `artists`).
 * User instruction: "the changes we made is for that artist specific?"
 */

import type { CollectionConfig } from 'payload'
import { sendArtistApprovedNotification } from '../lib/email'
import { revalidatePath } from 'next/cache'

const adminOnlyFieldAccess = {
  create: ({ req }: { req: any }) => req.user?.role === 'admin',
  update: ({ req }: { req: any }) => req.user?.role === 'admin',
}

export const Artists: CollectionConfig = {
  slug: 'artists',
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        const isNonAdmin = Boolean(req.user && req.user.role !== 'admin')

        if (operation === 'create') {
          if (isNonAdmin) {
            // Enforce safe initial defaults for non-admin creates
            data.approvalStatus = 'pending'
            data.verified = false
            data.rating = 0
            data.reviewCount = 0
            data.searchRank = 0
            data.isFeatured = false
            delete data.featuredUntil
            data.subscriptionPlan = 'free'
            delete data.subscriptionExpiresAt
            data.subscriptionStatus = 'active'
            delete data.subscriptionStartedAt
            delete data.subscriptionRenewsAt
            delete data.subscriptionCancelledAt
            data.maxPortfolioItems = 10
            data.profileViews = 0
            data.leadsReceived = 0
            data.quotesSent = 0
            data.bookingsWon = 0
            data.totalEarnings = 0
            delete data.order

            // Bind user to authenticated user session
            if (req.user) {
              data.user = req.user.id
            }
          }
        }

        if (operation === 'update') {
          if (isNonAdmin) {
            // Strip privileged and protected fields from non-admin updates
            delete data.user
            delete data.verified
            delete data.approvalStatus
            delete data.rating
            delete data.reviewCount
            delete data.searchRank
            delete data.isFeatured
            delete data.featuredUntil
            delete data.subscriptionPlan
            delete data.subscriptionExpiresAt
            delete data.subscriptionStatus
            delete data.subscriptionStartedAt
            delete data.subscriptionRenewsAt
            delete data.subscriptionCancelledAt
            delete data.maxPortfolioItems
            delete data.profileViews
            delete data.leadsReceived
            delete data.quotesSent
            delete data.bookingsWon
            delete data.totalEarnings
            delete data.order
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc, req, context }: any) => {
        // Revalidate cache asynchronously so it does not block or deadlock the database transaction
        if (operation === 'update' && !context?.skipRevalidate && !req.context?.skipRevalidate) {
          queueMicrotask(async () => {
            try {
              revalidatePath('/artists')
              if (doc.slug) revalidatePath(`/artists/${doc.slug}`)
              revalidatePath('/portfolio')
              revalidatePath('/')
            } catch {
              // Silently ignore static generation store errors when called from admin/test contexts
            }
          })
        }

        // Send approval email when approvalStatus changes to 'approved'
        if (
          operation === 'update' &&
          doc.approvalStatus === 'approved' &&
          previousDoc?.approvalStatus !== 'approved'
        ) {
          // user field is a relationship — may be ID or object
          const userId =
            typeof doc.user === 'object' && doc.user !== null ? (doc.user as any).id : doc.user

          if (userId) {
            queueMicrotask(async () => {
              try {
                const user = await req.payload.findByID({
                  collection: 'users',
                  id: userId,
                  req,
                } as any)

                const email = (user as any)?.email
                if (email) {
                  await sendArtistApprovedNotification({
                    name: doc.displayName || 'Artist',
                    email,
                  })
                }
              } catch (err) {
                console.error('Failed to send artist approval email:', err)
              }
            })
          }
        }
        return doc
      },
    ],
  },
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
      access: adminOnlyFieldAccess,
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
      name: 'artistType',
      type: 'select',
      required: true,
      label: 'Primary Service Type',
      options: [
        { label: 'Mehndi Artists', value: 'mehndi-artists' },
        { label: 'Makeup Artists', value: 'makeup-artists' },
        { label: 'Nail Artists', value: 'nail-artists' },
        { label: 'Decor & Event Planners', value: 'decor-event-planners' },
      ],
      admin: {
        description: 'Primary service category selected during registration',
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
      access: adminOnlyFieldAccess,
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
      access: adminOnlyFieldAccess,
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
      access: adminOnlyFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'reviewCount',
      type: 'number',
      min: 0,
      defaultValue: 0,
      access: adminOnlyFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    // ── Search Ranking ──
    {
      name: 'searchRank',
      type: 'number',
      defaultValue: 0,
      label: 'Search Rank Score',
      access: adminOnlyFieldAccess,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Auto-calculated score based on rating, reviews, completed bookings, and profile completeness',
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
          access: adminOnlyFieldAccess,
        },
        {
          name: 'featuredUntil',
          type: 'date',
          label: 'Featured Until',
          access: adminOnlyFieldAccess,
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
            { label: 'Pro', value: 'basic' },
            { label: 'Premium', value: 'premium' },
          ],
          access: adminOnlyFieldAccess,
        },
        {
          name: 'subscriptionExpiresAt',
          type: 'date',
          label: 'Subscription Expires',
          access: adminOnlyFieldAccess,
          admin: {
            condition: (_, siblingData) => siblingData?.subscriptionPlan !== 'free',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'subscriptionStatus',
          type: 'select',
          defaultValue: 'active',
          label: 'Subscription Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Trialing', value: 'trialing' },
            { label: 'Past Due', value: 'past_due' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Expired', value: 'expired' },
          ],
          access: adminOnlyFieldAccess,
        },
        {
          name: 'subscriptionStartedAt',
          type: 'date',
          label: 'Subscription Started',
          access: adminOnlyFieldAccess,
        },
        {
          name: 'subscriptionRenewsAt',
          type: 'date',
          label: 'Renews At',
          access: adminOnlyFieldAccess,
        },
        {
          name: 'subscriptionCancelledAt',
          type: 'date',
          label: 'Cancelled At',
          access: adminOnlyFieldAccess,
        },
        {
          name: 'maxPortfolioItems',
          type: 'number',
          label: 'Max Portfolio Items',
          defaultValue: 10,
          access: adminOnlyFieldAccess,
          admin: {
            description: 'Free: 10, Pro: 25, Premium: 50',
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
          access: adminOnlyFieldAccess,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'leadsReceived',
          type: 'number',
          defaultValue: 0,
          access: adminOnlyFieldAccess,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'quotesSent',
          type: 'number',
          defaultValue: 0,
          access: adminOnlyFieldAccess,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'bookingsWon',
          type: 'number',
          defaultValue: 0,
          access: adminOnlyFieldAccess,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'totalEarnings',
          type: 'number',
          defaultValue: 0,
          access: adminOnlyFieldAccess,
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
      access: adminOnlyFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    // ── SEO Fields ──
    {
      type: 'collapsible',
      label: 'SEO',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta Title',
          admin: {
            description:
              'Override the page title for this artist profile. Falls back to "{Name} — Verified Artist in {City} | Artistora".',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
          admin: {
            description:
              'Override the meta description. Falls back to a snippet from the artist bio.',
          },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          label: 'OG Image',
          admin: {
            description:
              'Override the Open Graph image for social sharing. Falls back to profile photo.',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
