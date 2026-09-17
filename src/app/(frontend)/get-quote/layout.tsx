import type { Metadata } from 'next'
import { withDefaultSeo } from '@/lib/seo'

export const metadata: Metadata = withDefaultSeo({
  title: 'Get Free Quotes — Compare Verified Artists in Ahmedabad',
  description:
    'Submit your event details and receive free quotes from verified mehndi artists, photographers, makeup artists, and decor professionals in Ahmedabad. No obligations.',
  alternates: {
    canonical: 'https://www.artistora.com/get-quote',
  },
  openGraph: {
    title: 'Get Free Quotes — Artistora',
    description:
      'Compare quotes from verified artists in Ahmedabad. Mehndi, photography, makeup, decor — all in one place.',
    url: 'https://www.artistora.com/get-quote',
    type: 'website',
  },
})

export default function GetQuoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
