import type { Metadata } from 'next'
import { withDefaultSeo } from '@/lib/seo'

export const metadata: Metadata = withDefaultSeo({
  title: 'Artist Portfolio — Browse Wedding & Event Work in Ahmedabad',
  description:
    'Explore stunning portfolios from verified artists in Ahmedabad — bridal mehndi, wedding photography, makeup looks, and event decor from real bookings.',
  alternates: {
    canonical: 'https://www.artistora.com/portfolio',
  },
  openGraph: {
    title: 'Artist Portfolio — Artistora',
    description:
      'Browse real work from verified mehndi, photography, makeup, and decor artists in Ahmedabad.',
    url: 'https://www.artistora.com/portfolio',
    type: 'website',
  },
})

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children
}
