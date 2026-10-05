import React from 'react'
import { Manrope, Fraunces } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import BrandLoader from '@/components/BrandLoader'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './styles.css'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  metadataBase: new URL('https://www.artistora.com'),
  title: {
    default: 'Artistora — Book Verified Artists in Ahmedabad',
    template: '%s | Artistora',
  },
  description:
    'Artistora connects you with verified artists in Ahmedabad — mehndi, makeup, nail art, decor, and more. Compare quotes and book in minutes.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'theme-color': '#ec6783',
    manifest: '/site.webmanifest',
  },
  openGraph: {
    title: 'Artistora — Book Verified Artists in Ahmedabad',
    description:
      'Compare quotes from verified mehndi, makeup, nail art, and decor artists in Ahmedabad.',
    url: 'https://www.artistora.com',
    siteName: 'Artistora',
    images: [{ url: '/artistora/social-profile-1000x1000.png', width: 1000, height: 1000 }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artistora — Book Verified Artists in Ahmedabad',
    description:
      'Compare quotes from verified artists in Ahmedabad — mehndi, makeup, nail art, decor, and more.',
    images: ['/artistora/social-profile-1000x1000.png'],
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.artistora.com/#organization',
      name: 'Artistora',
      url: 'https://www.artistora.com',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://www.artistora.com/#logo',
        url: 'https://www.artistora.com/artistora/logo-full-white.png',
        caption: 'Artistora',
      },
      description:
        'Verified artist marketplace in Ahmedabad — mehndi, makeup, nail art, decor, and event planning.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Ahmedabad',
        addressRegion: 'Gujarat',
        postalCode: '380015',
        addressCountry: 'IN',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+917405387720',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi', 'Gujarati'],
      },
      sameAs: ['https://www.instagram.com/artistoraofficial'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.artistora.com/#website',
      url: 'https://www.artistora.com',
      name: 'Artistora',
      inLanguage: 'en-IN',
      publisher: { '@id': 'https://www.artistora.com/#organization' },
    },
  ],
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <BrandLoader />
        <a
          href="#main-content"
          className="skip-link absolute left-4 top-3 z-[1000] -translate-y-48 rounded-full bg-white px-5 py-2.5 text-sm text-ink shadow-soft ring-1 ring-line transition-transform duration-200 focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1 pt-[60px]">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
          <SpeedInsights />
        </div>
      </body>
    </html>
  )
}
