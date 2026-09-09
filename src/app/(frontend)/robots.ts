import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/my-bookings',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/quotes/',
          '/api/',
          '/admin/',
        ],
      },
    ],
    sitemap: 'https://www.artistora.com/sitemap.xml',
  }
}
