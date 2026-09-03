import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import './styles.css'

export const metadata = {
  metadataBase: new URL('https://www.artistora.com'),
  title: {
    default: 'Artistora — Book Verified Artists in Ahmedabad',
    template: '%s | Artistora',
  },
  description:
    'Artistora connects you with verified artists in Ahmedabad — mehndi, photography, makeup, decor, music, and more. Compare quotes and book in minutes.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Artistora — Book Verified Artists in Ahmedabad',
    description:
      'Compare quotes from verified mehndi, photography, makeup, and decor artists in Ahmedabad.',
    url: 'https://www.artistora.com',
    siteName: 'Artistora',
    images: [{ url: '/artistora/social-profile-1000x1000.png', width: 1000, height: 1000 }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artistora — Book Verified Artists in Ahmedabad',
    description: 'Compare quotes from verified artists in Ahmedabad — mehndi, photography, makeup, decor, and more.',
    images: ['/artistora/social-profile-1000x1000.png'],
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="skip-link absolute left-4 top-3 z-[1000] -translate-y-48 rounded-full bg-white px-5 py-2.5 text-sm text-ink shadow-soft ring-1 ring-line transition-transform duration-200 focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1 pt-[84px]">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </body>
    </html>
  )
}
