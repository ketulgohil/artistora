import type { GlobalConfig } from 'payload'

export const HeaderFooter: GlobalConfig = {
  slug: 'header-footer',
  admin: {
    group: 'Business',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Header',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'navLinks',
              type: 'array',
              label: 'Navigation Links',
              labels: {
                singular: 'Nav Link',
                plural: 'Nav Links',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'path',
                  type: 'text',
                  required: true,
                },
              ],
              defaultValue: [
                { label: 'Home', path: '/' },
                { label: 'Services', path: '/services' },
                { label: 'Portfolio', path: '/portfolio' },
                { label: 'Classes', path: '/classes' },
                { label: 'Contact', path: '/contact' },
              ],
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footerTagline',
              type: 'textarea',
              defaultValue:
                'Premium mehndi artistry by Bhumi Chanpura, based in Chandlodiya, Ahmedabad. Bridal, engagement, festive, and home-service mehndi across the city.',
            },
            {
              name: 'copyrightText',
              type: 'text',
              defaultValue: '© Shiva Mehndi Art. All rights reserved.',
            },
            {
              name: 'footerLinks',
              type: 'array',
              label: 'Footer Links',
              labels: {
                singular: 'Footer Link',
                plural: 'Footer Links',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'path',
                  type: 'text',
                  required: true,
                },
              ],
              defaultValue: [
                { label: 'Privacy Policy', path: '/privacy-policy' },
                { label: 'Booking Policy', path: '/booking-policy' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
