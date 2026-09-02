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
    title: 'Bridal Mehndi',
    slug: 'bridal-mehndi',
    imageAlt: 'Bridal Mehndi Service',
    description:
      'Intricate bridal storytelling with detailed motifs, balanced composition, and a premium finish designed for your wedding photographs and close-up moments.',
    points: ['Full bridal styling', 'Detailed custom patterns', 'Premium occasion focus'],
    order: 1,
  },
  {
    title: 'Engagement Mehndi',
    slug: 'engagement-mehndi',
    imageAlt: 'Engagement Mehndi Service',
    description:
      'Modern, elegant engagement mehndi that feels romantic, stylish, and polished without losing the warmth of traditional design language.',
    points: ['Contemporary styling', 'Camera-friendly finish', 'Ideal for ring ceremonies'],
    order: 2,
  },
  {
    title: 'Baby Shower Mehndi',
    slug: 'baby-shower-mehndi',
    imageAlt: 'Baby Shower Mehndi',
    description:
      'Soft, graceful mehndi for baby showers and intimate family occasions, with patterns that feel celebratory, neat, and beautifully balanced.',
    points: ['Gentle festive patterns', 'Family event ready', 'Comfort-first experience'],
    order: 3,
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
    text: 'Very beautiful designs and excellent speed. I would highly recommend Bhumi for mehndi.',
    rating: 5,
    order: 1,
  },
  {
    name: 'Rutva Krunal Prajapati',
    text: 'They are among the best mehndi artists in Ahmedabad and made my day with beautiful, intricate work.',
    rating: 5,
    order: 2,
  },
  {
    name: 'Devsha Rathod',
    text: 'The exquisite design and stunning details were truly remarkable. I had an exceptional experience.',
    rating: 5,
    order: 3,
  },
]

// ── FAQ ──
const FAQS = [
  {
    question: 'Do you provide home service in Ahmedabad?',
    answer:
      'Yes. Home service is available across Ahmedabad for bridal bookings, engagements, baby showers, and event mehndi appointments.',
    order: 1,
  },
  {
    question: 'Do you also teach mehndi classes?',
    answer:
      'Yes. Shiva Mehndi Art also offers mehndi classes in Ahmedabad for beginners and learners who want structured offline practice.',
    order: 2,
  },
  {
    question: 'How early should bridal mehndi be booked?',
    answer:
      'For weddings and large family events, booking your bridal mehndi artist in advance is best so date availability, design planning, and event timing can be handled smoothly.',
    order: 3,
  },
  {
    question: 'Which mehndi services can be booked?',
    answer:
      'You can inquire about bridal mehndi, engagement mehndi, baby shower bookings, family functions, Arabic style mehndi, home service appointments, and offline mehndi classes.',
    order: 4,
  },
  {
    question: 'Do you provide service outside Chandlodiya?',
    answer:
      'Yes. Shiva Mehndi Art is based in Chandlodiya and serves bookings across Ahmedabad including nearby neighborhoods like Ghatlodiya, with timing planned around the event and number of people.',
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
