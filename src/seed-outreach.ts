/**
 * Seed script for the Outreach platform.
 * Usage: npx tsx src/seed-outreach.ts
 *
 * Populates the discovered-artists collection with sample data
 * for testing the outreach dashboard and campaign system.
 */

import { getPayload } from 'payload'
import config from './payload.config'

const sampleArtists: Array<{
  name: string
  businessName?: string
  source: 'google_maps' | 'justdial' | 'instagram' | 'wedmegood' | 'weddingwire' | 'sulekha' | 'manual' | 'referral'
  sourceUrl?: string
  phone?: string
  email?: string
  instagramHandle?: string
  instagramProfileUrl?: string
  city?: string
  area?: string
  state?: string
  services?: Array<{ name: string }>
  specializations?: string
  priceRange?: 'budget' | 'mid' | 'premium' | 'luxury' | 'unknown'
  rating?: number
  reviewCount?: number
  followerCount?: number
  postCount?: number
  leadScore?: number
  leadScoreBreakdown?: any
  outreachStatus?: 'new' | 'contacted' | 'replied' | 'interested' | 'registered' | 'declined' | 'blacklisted'
  outreachAttempts?: number
  lastContactedAt?: string
  repliedAt?: string
  registeredAt?: string
  website?: string
}> = [
  {
    name: 'Priya Mehndi Arts',
    businessName: 'Priya Mehndi Arts',
    source: 'google_maps',
    sourceUrl: 'https://maps.google.com/place/priya-mehndi-arts',
    phone: '+919876543210',
    email: 'priya.mehndi@gmail.com',
    instagramHandle: 'priya_mehndi_arts',
    city: 'Ahmedabad',
    area: 'SG Highway',
    state: 'Gujarat',
    services: [{ name: 'Mehndi' }],
    specializations: 'Bridal Mehndi, Arabic Mehndi, Tattoo Design',
    priceRange: 'mid',
    rating: 4.5,
    reviewCount: 128,
    followerCount: 8500,
    postCount: 342,
    leadScore: 85,
    leadScoreBreakdown: {
      total: 85,
      sourceQuality: 22,
      ratingScore: 22,
      contactAvailability: 22,
      socialProof: 19,
      factors: [
        'Source: google_maps (+22)',
        'Rating: 4.5/5 (128 reviews) (+22)',
        'Has phone (+8)',
        'Has email (+5)',
        'WhatsApp available (+7)',
        'Has Instagram (+5)',
        '8500 followers (+7)',
        'Has website (+3)',
      ],
    },
    outreachStatus: 'new',
  },
  {
    name: 'Raj Photography Studio',
    businessName: 'Raj Studio',
    source: 'justdial',
    sourceUrl: 'https://justdial.com/ahmedabad/raj-photography',
    phone: '+919876543211',
    city: 'Ahmedabad',
    area: 'Vastrapur',
    state: 'Gujarat',
    services: [{ name: 'Photography' }],
    specializations: 'Wedding Photography, Pre-wedding, Candid',
    priceRange: 'premium',
    rating: 4.2,
    reviewCount: 89,
    leadScore: 72,
    leadScoreBreakdown: {
      total: 72,
      sourceQuality: 20,
      ratingScore: 19,
      contactAvailability: 15,
      socialProof: 18,
      factors: [
        'Source: justdial (+20)',
        'Rating: 4.2/5 (89 reviews) (+19)',
        'Has phone (+8)',
        'WhatsApp available (+7)',
        'Has website (+3)',
      ],
    },
    outreachStatus: 'new',
  },
  {
    name: 'BeautyBlush Makeup Studio',
    businessName: 'BeautyBlush',
    source: 'instagram',
    sourceUrl: 'https://instagram.com/beautyblush_ahmedabad',
    phone: '+919876543212',
    instagramHandle: 'beautyblush_ahmedabad',
    instagramProfileUrl: 'https://instagram.com/beautyblush_ahmedabad',
    city: 'Ahmedabad',
    area: 'Bopal',
    state: 'Gujarat',
    services: [{ name: 'Makeup' }],
    specializations: 'Bridal Makeup, HD Makeup, Airbrush',
    priceRange: 'premium',
    rating: 4.8,
    reviewCount: 56,
    followerCount: 25000,
    postCount: 580,
    leadScore: 92,
    leadScoreBreakdown: {
      total: 92,
      sourceQuality: 15,
      ratingScore: 24,
      contactAvailability: 22,
      socialProof: 31,
      factors: [
        'Source: instagram (+15)',
        'Rating: 4.8/5 (56 reviews) (+24)',
        'Has phone (+8)',
        'Has email (+5)',
        'WhatsApp available (+7)',
        'Has Instagram (+5)',
        '25000 followers (+10)',
        '580 posts (+3)',
      ],
    },
    outreachStatus: 'contacted',
    outreachAttempts: 1,
    lastContactedAt: '2026-03-10T10:00:00Z',
  },
  {
    name: 'Shubh Wedding Decor',
    businessName: 'Shubh Decorators',
    source: 'wedmegood',
    sourceUrl: 'https://wedmegood.com/shubh-decorators',
    phone: '+919876543213',
    email: 'info@shubhdecor.com',
    city: 'Ahmedabad',
    area: 'Navrangpura',
    state: 'Gujarat',
    services: [{ name: 'Decor' }],
    specializations: 'Wedding Stage, Floral Decor, Theme Decor',
    priceRange: 'luxury',
    rating: 4.6,
    reviewCount: 34,
    leadScore: 78,
    leadScoreBreakdown: {
      total: 78,
      sourceQuality: 20,
      ratingScore: 23,
      contactAvailability: 20,
      socialProof: 15,
      factors: [
        'Source: wedmegood (+20)',
        'Rating: 4.6/5 (34 reviews) (+23)',
        'Has phone (+8)',
        'Has email (+5)',
        'WhatsApp available (+7)',
      ],
    },
    outreachStatus: 'new',
  },
  {
    name: 'DJ Raunak Events',
    businessName: 'Raunak Events',
    source: 'weddingwire',
    sourceUrl: 'https://weddingwire.in/dj-raunak',
    phone: '+919876543214',
    instagramHandle: 'djraunak_events',
    city: 'Ahmedabad',
    area: 'Satellite',
    state: 'Gujarat',
    services: [{ name: 'DJ' }, { name: 'Music' }],
    specializations: 'Wedding DJ, Sangeet Night, Sound System',
    priceRange: 'mid',
    rating: 4.0,
    reviewCount: 22,
    followerCount: 3200,
    postCount: 156,
    leadScore: 58,
    leadScoreBreakdown: {
      total: 58,
      sourceQuality: 20,
      ratingScore: 16,
      contactAvailability: 15,
      socialProof: 7,
      factors: [
        'Source: weddingwire (+20)',
        'Rating: 4.0/5 (22 reviews) (+16)',
        'Has phone (+8)',
        'WhatsApp available (+7)',
        '3200 followers (+3)',
      ],
    },
    outreachStatus: 'new',
  },
  {
    name: 'CaptureMoments Photography',
    businessName: 'CaptureMoments',
    source: 'google_maps',
    sourceUrl: 'https://maps.google.com/place/capture-moments',
    phone: '+919876543215',
    email: 'hello@capturemoments.in',
    website: 'https://capturemoments.in',
    instagramHandle: 'capturemoments_ahd',
    city: 'Ahmedabad',
    area: 'CG Road',
    state: 'Gujarat',
    services: [{ name: 'Photography' }, { name: 'Videography' }],
    specializations: 'Wedding Photography, Cinematic Video, Drone Shot',
    priceRange: 'premium',
    rating: 4.7,
    reviewCount: 203,
    followerCount: 45000,
    postCount: 890,
    leadScore: 95,
    leadScoreBreakdown: {
      total: 95,
      sourceQuality: 22,
      ratingScore: 24,
      contactAvailability: 25,
      socialProof: 24,
      factors: [
        'Source: google_maps (+22)',
        'Rating: 4.7/5 (203 reviews) (+24)',
        'Has phone (+8)',
        'Has email (+5)',
        'WhatsApp available (+7)',
        'Has Instagram (+5)',
        '45000 followers (+10)',
        '890 posts (+3)',
        'Has website (+3)',
      ],
    },
    outreachStatus: 'registered',
    registeredAt: '2026-03-15T14:30:00Z',
  },
  {
    name: 'Komal Bridal Mehndi',
    businessName: 'Komal Mehndi',
    source: 'google_maps',
    sourceUrl: 'https://maps.google.com/place/komal-mehndi',
    phone: '+919876543216',
    city: 'Ahmedabad',
    area: 'Maninagar',
    state: 'Gujarat',
    services: [{ name: 'Mehndi' }],
    specializations: 'Bridal Mehndi, Rajasthani Design, Arabic',
    priceRange: 'budget',
    rating: 4.3,
    reviewCount: 67,
    leadScore: 62,
    leadScoreBreakdown: {
      total: 62,
      sourceQuality: 22,
      ratingScore: 18,
      contactAvailability: 15,
      socialProof: 7,
      factors: [
        'Source: google_maps (+22)',
        'Rating: 4.3/5 (67 reviews) (+18)',
        'Has phone (+8)',
        'WhatsApp available (+7)',
      ],
    },
    outreachStatus: 'new',
  },
  {
    name: 'Glitz Makeup Academy',
    businessName: 'Glitz Academy',
    source: 'sulekha',
    sourceUrl: 'https://sulekha.com/glitz-makeup-ahmedabad',
    phone: '+919876543217',
    email: 'glitz.academy@gmail.com',
    instagramHandle: 'glitz_makeup',
    city: 'Ahmedabad',
    area: 'Ashram Road',
    state: 'Gujarat',
    services: [{ name: 'Makeup' }],
    specializations: 'Bridal Makeup, Party Makeup, Makeup Courses',
    priceRange: 'mid',
    rating: 4.4,
    reviewCount: 45,
    followerCount: 12000,
    postCount: 290,
    leadScore: 76,
    leadScoreBreakdown: {
      total: 76,
      sourceQuality: 18,
      ratingScore: 20,
      contactAvailability: 22,
      socialProof: 16,
      factors: [
        'Source: sulekha (+18)',
        'Rating: 4.4/5 (45 reviews) (+20)',
        'Has phone (+8)',
        'Has email (+5)',
        'WhatsApp available (+7)',
        'Has Instagram (+5)',
        '12000 followers (+7)',
        '290 posts (+3)',
      ],
    },
    outreachStatus: 'interested',
    repliedAt: '2026-03-12T09:15:00Z',
  },
  {
    name: 'Sangeet Beats Band',
    businessName: 'Sangeet Beats',
    source: 'wedmegood',
    sourceUrl: 'https://wedmegood.com/sangeet-beats',
    phone: '+919876543218',
    instagramHandle: 'sangeet_beats',
    city: 'Ahmedabad',
    area: 'Thaltej',
    state: 'Gujarat',
    services: [{ name: 'Music' }],
    specializations: 'Live Band, Sangeet Night, Dhol Players',
    priceRange: 'mid',
    rating: 4.1,
    reviewCount: 18,
    followerCount: 5600,
    postCount: 210,
    leadScore: 55,
    leadScoreBreakdown: {
      total: 55,
      sourceQuality: 20,
      ratingScore: 16,
      contactAvailability: 8,
      socialProof: 11,
      factors: [
        'Source: wedmegood (+20)',
        'Rating: 4.1/5 (18 reviews) (+16)',
        'Has phone (+8)',
        '5600 followers (+7)',
        '210 posts (+3)',
      ],
    },
    outreachStatus: 'declined',
  },
  {
    name: 'LensMan Photography',
    businessName: 'LensMan Studios',
    source: 'instagram',
    sourceUrl: 'https://instagram.com/lensman_studios',
    phone: '+919876543219',
    instagramHandle: 'lensman_studios',
    instagramProfileUrl: 'https://instagram.com/lensman_studios',
    city: 'Ahmedabad',
    area: 'Paldi',
    state: 'Gujarat',
    services: [{ name: 'Photography' }, { name: 'Videography' }],
    specializations: 'Wedding, Pre-wedding, Product Photography',
    priceRange: 'mid',
    rating: 4.5,
    reviewCount: 78,
    followerCount: 32000,
    postCount: 650,
    leadScore: 88,
    leadScoreBreakdown: {
      total: 88,
      sourceQuality: 15,
      ratingScore: 22,
      contactAvailability: 22,
      socialProof: 29,
      factors: [
        'Source: instagram (+15)',
        'Rating: 4.5/5 (78 reviews) (+22)',
        'Has phone (+8)',
        'Has email (+5)',
        'WhatsApp available (+7)',
        'Has Instagram (+5)',
        '32000 followers (+10)',
        '650 posts (+3)',
        'Has website (+3)',
      ],
    },
    outreachStatus: 'new',
  },
]

async function seed() {
  console.log('🌱 Seeding outreach data...\n')

  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const artist of sampleArtists) {
    try {
      // Check for duplicate by phone or instagram handle
      const where: any = { or: [] }
      if (artist.phone) where.or.push({ phone: { equals: artist.phone } })
      if (artist.instagramHandle) where.or.push({ instagramHandle: { equals: artist.instagramHandle } })

      if (where.or.length > 0) {
        const existing = await payload.find({
          collection: 'discovered-artists',
          where,
          limit: 1,
        })
        if (existing.docs.length > 0) {
          console.log(`  ⏭️  Skipping "${artist.name}" (already exists)`)
          skipped++
          continue
        }
      }

      const slug = artist.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      await payload.create({
        collection: 'discovered-artists',
        data: {
          ...artist,
          slug: `${slug}-${Date.now()}`,
        },
      })

      console.log(`  ✅ Created "${artist.name}" (score: ${artist.leadScore})`)
      created++
    } catch (error) {
      console.log(`  ❌ Failed "${artist.name}": ${error}`)
      skipped++
    }
  }

  console.log(`\n🌱 Seed complete: ${created} created, ${skipped} skipped`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
