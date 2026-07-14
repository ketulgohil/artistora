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
              defaultValue: 'Shiva Mehndi Art',
            },
            {
              name: 'founderName',
              type: 'text',
              required: true,
              defaultValue: 'Bhumi Chanpura',
            },
            {
              name: 'phone',
              type: 'text',
              required: true,
              defaultValue: '+91 8469662012',
            },
            {
              name: 'email',
              type: 'email',
              required: true,
              defaultValue: 'bhumichanpura1234@gmail.com',
            },
            {
              name: 'address',
              type: 'text',
              required: true,
              defaultValue: 'C-206 Neelkanth Homes, Chandlodiya, Ahmedabad 382481',
            },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: 'Premium Mehndi Artist – Ahmedabad',
            },
          ],
        },
        {
          label: 'Social & Contact',
          fields: [
            {
              name: 'facebookUrl',
              type: 'text',
              defaultValue: 'https://facebook.com/',
            },
            {
              name: 'instagramUrl',
              type: 'text',
              defaultValue: 'https://instagram.com/',
            },
            {
              name: 'youtubeUrl',
              type: 'text',
              defaultValue: 'https://youtube.com/',
            },
            {
              name: 'googleMapUrl',
              type: 'text',
              defaultValue: 'https://maps.google.com/',
            },
            {
              name: 'bookingFormUrl',
              type: 'text',
              required: true,
              defaultValue:
                'https://docs.google.com/forms/d/e/1FAIpQLSeE8i0kMqjmb8jjVLc_YgNGR8q413ZdgEXQbzNZdULpf9r8MA/viewform',
            },
            {
              name: 'whatsappNumber',
              type: 'text',
              defaultValue: '+918469662012',
            },
          ],
        },
        {
          label: 'SEO Defaults',
          fields: [
            {
              name: 'defaultMetaTitle',
              type: 'text',
              defaultValue: 'Shiva Mehndi Art — Premium Mehndi Artist in Ahmedabad',
            },
            {
              name: 'defaultMetaDescription',
              type: 'textarea',
              defaultValue:
                'Shiva Mehndi Art by Bhumi Chanpura offers premium bridal, engagement, and festive mehndi in Ahmedabad. Home service available.',
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
