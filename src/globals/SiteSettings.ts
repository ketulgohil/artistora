import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Business',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Business Info',
          fields: [
            {
              name: 'businessName',
              type: 'text',
              required: true,
              defaultValue: 'Artistora',
            },
            {
              name: 'founderName',
              type: 'text',
              required: true,
              defaultValue: 'Ketul Gohil',
            },
            {
              name: 'phone',
              type: 'text',
              required: true,
              defaultValue: '+91 7405387720',
            },
            {
              name: 'email',
              type: 'email',
              required: true,
              defaultValue: 'hello@artistora.com',
            },
            {
              name: 'address',
              type: 'text',
              required: true,
              defaultValue: 'Ahmedabad, Gujarat, India',
            },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: 'Verified Artist Marketplace – Ahmedabad',
            },
          ],
        },
        {
          label: 'Social & Contact',
          fields: [
            {
              name: 'facebookUrl',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'instagramUrl',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'youtubeUrl',
              type: 'text',
              defaultValue: '',
            },
            {
              name: 'googleMapUrl',
              type: 'text',
              defaultValue:
                'https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C%20Gujarat%2C%20India',
            },
            {
              name: 'bookingFormUrl',
              type: 'text',
              required: true,
              defaultValue: '/book',
            },
            {
              name: 'whatsappNumber',
              type: 'text',
              defaultValue: '+917405387720',
            },
          ],
        },
        {
          label: 'SEO Defaults',
          fields: [
            {
              name: 'defaultMetaTitle',
              type: 'text',
              defaultValue: 'Artistora — Book Verified Artists in Ahmedabad',
            },
            {
              name: 'defaultMetaDescription',
              type: 'textarea',
              defaultValue:
                'Artistora connects you with verified mehndi artists in Ahmedabad. Compare quotes from top bridal, engagement, and festive mehndi artists — book in minutes.',
            },
            {
              name: 'defaultOgImage',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
      ],
    },
  ],
}
