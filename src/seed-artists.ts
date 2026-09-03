/**
 * Seed script for marketplace: sample artists
 *
 * Usage: npx tsx src/seed-artists.ts
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { getPayload } from 'payload'

const ARTISTS = [
  {
    displayName: 'Bhumi Chanpura',
    slug: 'bhumi-chanpura',
    phone: '+917405387720',
    whatsappNumber: '7405387720',
    email: 'gohilketul5@gmail.com',
    bio: 'Featured Artistora artist with 8+ years of experience in bridal and festive mehndi. Known for intricate detailing, clean lines, and a calm, professional service experience across Ahmedabad.',
    city: 'Ahmedabad',
    area: 'Ahmedabad',
    yearsOfExperience: 8,
    startingPrice: 3000,
    verified: true,
    rating: 5.0,
    reviewCount: 114,
    order: 1,
    styles: [
      { style: 'Bridal' },
      { style: 'Arabic' },
      { style: 'Indo-Western' },
      { style: 'Heavy Sider' },
    ],
  },
  {
    displayName: 'Priya Patel',
    slug: 'priya-patel',
    phone: '+919876543210',
    whatsappNumber: '9876543210',
    bio: 'Specializing in modern Arabic and minimalist mehndi designs. 5 years of experience with engagement and reception mehndi. Known for clean, camera-friendly designs.',
    city: 'Ahmedabad',
    area: 'Vastrapur',
    yearsOfExperience: 5,
    startingPrice: 2000,
    verified: true,
    rating: 4.8,
    reviewCount: 42,
    order: 2,
    styles: [
      { style: 'Arabic' },
      { style: 'Minimal' },
      { style: 'Indo-Western' },
    ],
  },
  {
    displayName: 'Neha Sharma',
    slug: 'neha-sharma',
    phone: '+919988776655',
    whatsappNumber: '9988776655',
    bio: 'Expert in traditional Rajasthani and bridal mehndi with 6 years of experience. Offers multi-person bookings for weddings and family functions across Ahmedabad.',
    city: 'Ahmedabad',
    area: 'Satellite',
    yearsOfExperience: 6,
    startingPrice: 2500,
    verified: true,
    rating: 4.9,
    reviewCount: 67,
    order: 3,
    styles: [
      { style: 'Bridal' },
      { style: 'Rajasthani' },
      { style: 'Traditional' },
    ],
  },
]

async function main() {
  console.log('🚀 Seeding artists...')

  const { default: resolvedConfig } = await import('./payload.config')
  const payloadConfig = await resolvedConfig
  const payload = await getPayload({ config: payloadConfig })

  for (const artist of ARTISTS) {
    const existing = await payload.find({
      collection: 'artists',
      where: { slug: { equals: artist.slug } },
    })

    if (existing.docs.length > 0) {
      console.log(`  ⏭  "${artist.displayName}" already exists`)
      continue
    }

    await payload.create({
      collection: 'artists',
      data: artist as any,
    })
    console.log(`  ✅ Artist: ${artist.displayName}`)
  }

  console.log('\n🎉 Artist seeding complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('💥 Seeding failed:', err)
  process.exit(1)
})
