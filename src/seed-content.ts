/**
 * Seed script for Phase 4: Services, Testimonials, FAQ, YouTube Videos
 *
 * Usage: npx tsx src/seed-content.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { getPayload } from 'payload'
import * as path from 'path'

// Helper: create simple Lexical rich text from plain text
function lexicalText(text: string) {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal' as const,
              style: '',
              text,
              type: 'text' as const,
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          type: 'paragraph' as const,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root' as const,
      version: 1,
    },
  }
}

// ── Services ──
// `image` is resolved at runtime by the media `alt` text (set in seed.ts) so
// lookups stay correct even when filenames get dedupe suffixes like -1/-2.
const SERVICES = [
  {
    title: 'Photographers',
    slug: 'photographers',
    imageAlt: 'Photography Service',
    description:
      'Professional photographers for weddings, events, portraits, and commercial shoots — browse portfolios and compare packages before you book.',
    points: ['Wedding & event coverage', 'Portfolio available', 'Flexible packages'],
    order: 1,
  },
  {
    title: 'Makeup Artists',
    slug: 'makeup-artists',
    imageAlt: 'Makeup Service',
    description:
      'Bridal, reception, and occasion makeup artists with trial options, hygiene-first practices, and camera-friendly finishes.',
    points: ['Bridal & occasion makeup', 'Trial available', 'Premium products'],
    order: 2,
  },
  {
    title: 'Decor & Event Planners',
    slug: 'decor-event-planners',
    imageAlt: 'Decor Service',
    description:
      'Stage, mandap, floral, and themed decor — matched to your event style and budget with professional event planning services.',
    points: ['Wedding & event decor', 'Custom themes', 'Full event setup'],
    order: 3,
  },
  {
    title: 'Mehndi Artists',
    slug: 'mehndi-artists',
    imageAlt: 'Mehndi Service',
    description:
      'Bridal, engagement, and festive mehndi specialists with premium portfolios and home service availability across Ahmedabad.',
    points: ['Bridal & event specialists', 'Custom patterns', 'Home service available'],
    order: 4,
  },
]

async function resolveMediaId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  alt: string,
): Promise<number | undefined> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { alt: { equals: alt } },
    limit: 1,
  })
  return docs.length > 0 ? docs[0].id : undefined
}

// ── Testimonials ──
const TESTIMONIALS = [
  {
    name: 'Urvika Parekh',
    text: 'Artistora made it easy to find and book the right artist for our wedding. Professional, reliable, and a pleasure to work with.',
    rating: 5,
    order: 1,
  },
  {
    name: 'Rutva Krunal Prajapati',
    text: 'We found amazing artists for our event through Artistora. The quoting process was transparent and the service was excellent.',
    rating: 5,
    order: 2,
  },
  {
    name: 'Devsha Rathod',
    text: 'The quality of artists on Artistora is outstanding. From mehndi to photography, everything was handled professionally.',
    rating: 5,
    order: 3,
  },
]

// ── FAQ ──
const FAQS = [
  {
    question: 'What artist services can I book on Artistora?',
    answer:
      'You can book artists, photographers, makeup artists, decorators, musicians, and other event professionals across Ahmedabad.',
    order: 1,
  },
  {
    question: 'How do classes and workshops work?',
    answer:
      'Artistora offers classes and workshops in various art forms — photography, makeup, and more. Browse available sessions and register online.',
    order: 2,
  },
  {
    question: 'How early should I book an artist?',
    answer:
      'For weddings and large events, booking your artist in advance is best so date availability, planning, and event timing can be handled smoothly.',
    order: 3,
  },
  {
    question: 'What services can be booked on Artistora?',
    answer:
      'You can book artists, photographers, makeup artists, decorators, musicians, and other event professionals through the platform.',
    order: 4,
  },
  {
    question: 'Do you provide service outside Ahmedabad?',
    answer:
      'Yes. Artistora is based in Ahmedabad and serves bookings across the city and nearby areas, with timing planned around the event and number of people.',
    order: 5,
  },
]

// ── YouTube Videos ──
const YOUTUBE_VIDEOS = [
  {
    title: 'Mehndi Lines & Humps Tutorial for Beginners',
    videoId: '7-IF5FKIAjE',
    order: 1,
  },
  {
    title: 'Easy Belt Mehndi Designs for Beginners',
    videoId: 'LzTW77e-xJM',
    order: 2,
  },
  {
    title: 'Belt Mehndi Designs Part 3',
    videoId: 'IU64ToVw0lY',
    order: 3,
  },
]

async function main() {
  console.log('🚀 Seeding Phase 4 content...')

  const { default: config } = await import('./payload.config')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  console.log('📦 Payload instance ready')

  // ── 1. Services ──
  console.log('\n📋 Creating services...')
  for (const svc of SERVICES) {
    const existing = await payload.find({
      collection: 'services',
      where: { slug: { equals: svc.slug } },
    })
    if (existing.docs.length > 0) {
      console.log(`  ⏭  "${svc.title}" already exists`)
      continue
    }
    const image = await resolveMediaId(payload, svc.imageAlt)
    await payload.create({
      collection: 'services',
      data: {
        title: svc.title,
        slug: svc.slug,
        ...(image ? { image } : {}),
        description: svc.description,
        points: svc.points.map((p) => ({ point: p })),
        order: svc.order,
      },
    })
    console.log(`  ✅ Service: ${svc.title}`)
  }

  // ── 2. Testimonials ──
  console.log('\n⭐ Creating testimonials...')
  for (const t of TESTIMONIALS) {
    const existing = await payload.find({
      collection: 'testimonials',
      where: { name: { equals: t.name } },
    })
    if (existing.docs.length > 0) {
      console.log(`  ⏭  "${t.name}" already exists`)
      continue
    }
    await payload.create({
      collection: 'testimonials',
      data: t,
    })
    console.log(`  ✅ Testimonial: ${t.name}`)
  }

  // ── 3. FAQ ──
  console.log('\n❓ Creating FAQs...')
  for (const faq of FAQS) {
    const existing = await payload.find({
      collection: 'faq',
      where: { question: { equals: faq.question } },
    })
    if (existing.docs.length > 0) {
      console.log(`  ⏭  "${faq.question.substring(0, 40)}..." already exists`)
      continue
    }
    await payload.create({
      collection: 'faq',
      data: {
        question: faq.question,
        answer: lexicalText(faq.answer),
        order: faq.order,
      },
    })
    console.log(`  ✅ FAQ: ${faq.question.substring(0, 40)}...`)
  }

  // ── 4. YouTube Videos ──
  console.log('\n🎬 Creating YouTube videos...')
  for (const v of YOUTUBE_VIDEOS) {
    const existing = await payload.find({
      collection: 'youtube-videos',
      where: { videoId: { equals: v.videoId } },
    })
    if (existing.docs.length > 0) {
      console.log(`  ⏭  "${v.title}" already exists`)
      continue
    }
    await payload.create({
      collection: 'youtube-videos',
      data: v,
    })
    console.log(`  ✅ YouTube: ${v.title}`)
  }

  console.log('\n🎉 Phase 4 seeding complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('💥 Seeding failed:', err)
  process.exit(1)
})
