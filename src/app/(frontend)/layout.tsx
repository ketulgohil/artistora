import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import './styles.css'

export const metadata = {
  title: 'Shiva Mehndi Art — Premium Mehndi Artist in Ahmedabad',
  description:
    'Shiva Mehndi Art by Bhumi Chanpura offers premium bridal, engagement, and festive mehndi in Ahmedabad. Home service available.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap"
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
