/**
 * One-off rebrand script: update SiteSettings + HeaderFooter globals in the DB
 * from the old Shiva Mehndi Art brand to Artistora.
 *
 * Usage: npx tsx src/rebrand-globals.ts
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getPayload } from 'payload'

async function run() {
  const { default: config } = await import('./payload.config')
  const payload = await getPayload({ config })

  // ── SiteSettings ──
  try {
    const existing = await payload.findGlobal({ slug: 'site-settings' })
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        businessName: 'Artistora',
        founderName: 'Ketul Gohil',
        phone: '+91 7405387720',
        email: 'hello@artistora.com',
        address: 'Ahmedabad, Gujarat, India',
        tagline: 'Verified Artist Marketplace – Ahmedabad',
        whatsappNumber: '+917405387720',
        bookingFormUrl: '/book',
        googleMapUrl:
          'https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C%20Gujarat%2C%20India',
        facebookUrl: '',
        instagramUrl: '',
        youtubeUrl: '',
        defaultMetaTitle: 'Artistora — Book Verified Mehndi Artists in Ahmedabad',
        defaultMetaDescription:
          'Artistora connects you with verified mehndi artists in Ahmedabad. Compare quotes from top bridal, engagement, and festive mehndi artists — book in minutes.',
      },
    })
    console.log('✓ site-settings updated (was:', existing?.businessName, ')')
  } catch (err) {
    console.error('site-settings update failed:', err)
  }

  // ── HeaderFooter ──
  try {
    const hf = await payload.findGlobal({ slug: 'header-footer' })
    await payload.updateGlobal({
      slug: 'header-footer',
      data: {
        footerTagline:
          'Artistora connects you with verified artists across Ahmedabad — mehndi, photography, makeup, decor, music, and more.',
        copyrightText: '© Artistora. All rights reserved.',
      },
    })
    console.log('✓ header-footer updated')
  } catch (err) {
    console.error('header-footer update failed:', err)
  }

  process.exit(0)
}

run()
