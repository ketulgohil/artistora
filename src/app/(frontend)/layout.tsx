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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="site-shell min-h-screen flex flex-col">
          <Header />
          <main id="main-content" className="page-shell flex-1">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </body>
    </html>
  )
}
