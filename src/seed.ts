/**
 * Seed script to import portfolio categories, images, and business assets
 * from the old Vite site into Payload CMS.
 *
 * Usage: npx tsx src/seed.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { getPayload } from 'payload'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OLD_SITE_PUBLIC = '/Users/admin/Developer/shivamehndiart/public'

// ── Portfolio category mapping (matches old site's portfolioImages.js) ──
const CATEGORIES = [
  { title: 'Arabic', slug: 'arabic', order: 1 },
  { title: 'Baby Shower', slug: 'babyshower', order: 2 },
  { title: 'Bridal', slug: 'bridal', order: 3 },
  { title: 'Designer Bengle Length', slug: 'designer-bengle-length', order: 4 },
  { title: 'Engagement', slug: 'engagement', order: 5 },
  { title: 'Heavy Sider', slug: 'heavy-sider', order: 6 },
  { title: 'Indo Arabic', slug: 'indo-arabic', order: 7 },
  { title: 'Legs', slug: 'legs', order: 8 },
  { title: 'Minimal', slug: 'minimal', order: 9 },
]

// Image filenames from old site's portfolioImages.js per category
const CATEGORY_IMAGES: Record<string, string[]> = {
  arabic: ['IMG_8297.webp', 'IMG_8305.webp', 'IMG_E0025.webp'],
  babyshower: ['IMG_6462.webp', 'IMG_6464.webp', 'IMG_7225.webp'],
  bridal: [
    'FE26DFFD-33C9-4124-B73E-EAE71ECB1E84(1).webp',
    'IMG_9995.webp', 'IMG_E0009.webp', 'IMG_E0012.webp',
    'IMG_E0064.webp', 'IMG_E0074.webp', 'IMG_E0077.webp',
    'IMG_E8057.webp', 'IMG_E9516.webp', 'IMG_E9603.webp',
    'IMG_E9644.webp', 'IMG_E9764.webp', 'IMG_E9767.webp',
    'IMG_E9937.webp', 'IMG_E9946.webp', 'IMG_E9951.webp',
    'IMG_E9964.webp', 'IMG_E9965.webp', 'IMG_E9972.webp', 'IMG_E9995.webp',
  ],
  'designer-bengle-length': [
    'c96fc915-162b-44c3-875c-cf04d98fdcdd.webp',
    'IMG_6142.webp', 'IMG_6146.webp', 'IMG_7206.webp',
    'IMG_7790.webp', 'IMG_9980.webp', 'IMG_E0054.webp',
    'IMG_E7909.webp', 'IMG_E9695.webp', 'IMG_E9980.webp',
  ],
  engagement: [
    '6A5567EE-A357-4D91-935D-8BC4CE5B664B.webp',
    'IMG_5615.webp', 'IMG_9524.webp', 'IMG_9987.webp', 'IMG_E9989.webp',
  ],
  'heavy-sider': [
    'IMG_5766.webp', 'IMG_5815.webp', 'IMG_6238.webp', 'IMG_6263.webp',
    'IMG_7727.webp', 'IMG_E0086.webp', 'IMG_E8019.webp', 'IMG_E8657.webp',
    'IMG_E8660.webp', 'IMG_E9563.webp', 'IMG_E9608.webp', 'IMG_E9623.webp',
    'IMG_E9673.webp', 'IMG_E9691.webp', 'IMG_E9722.webp', 'IMG_E9730.webp',
  ],
  'indo-arabic': ['IMG_E9744.webp'],
  legs: ['IMG_E0011.webp', 'IMG_E0070.webp', 'IMG_E9627.webp', 'IMG_E9714.webp', 'IMG_E9969.webp'],
  minimal: ['IMG_E0032.webp', 'IMG_E0034.webp', 'IMG_E0035.webp', 'IMG_E0037.webp', 'IMG_E8270.webp'],
}

const FEATURED_IMAGES = [
  'geetaben_rabari.webp',
  'kinjal_dave_and_rajal_barot.webp',
  'kinjal_rajpriya.webp',
]

// Business images to import
const BUSINESS_IMAGES: { file: string; alt: string }[] = [
  { file: 'Bhumi.webp', alt: 'Bhumi Chanpura - Founder Shiva Mehndi Art' },
  { file: 'Bridal.webp', alt: 'Bridal Mehndi Service' },
  { file: 'Baby_shower.webp', alt: 'Baby Shower Mehndi' },
  { file: 'engagement.webp', alt: 'Engagement Mehndi Service' },
  { file: 'Shiva_Mehndi_Banner.webp', alt: 'Shiva Mehndi Art Banner' },
  { file: 'favicon.ico', alt: 'Shiva Mehndi Art Favicon' },
  { file: 'og-share.jpg', alt: 'OG Share Image' },
  { file: 'shivu-large.webp', alt: 'Shiva Mehndi Art Large Image' },
  { file: 'devider.png', alt: 'Section Divider' },
  { file: 'peacock.png', alt: 'Peacock Motif' },
  { file: 'deveshaa.webp', alt: 'Deveshaa - Client photo' },
  { file: 'rutva.webp', alt: 'Rutva - Client photo' },
  { file: 'urvi.webp', alt: 'Urvi - Client photo' },
  { file: 'deveshaa-avatar.webp', alt: 'Deveshaa avatar' },
  { file: 'rutva-avatar.webp', alt: 'Rutva avatar' },
  { file: 'urvi-avatar.webp', alt: 'Urvi avatar' },
]

// ── Helper: read file for Payload upload ──
function readFileForUpload(filePath: string) {
  const data = fs.readFileSync(filePath)
  const stat = fs.statSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
  }
  return {
    data: Buffer.from(data),
    mimetype: mimeMap[ext] || 'image/webp',
    name: path.basename(filePath),
    size: stat.size,
  }
}

// ── Main ──
async function main() {
  console.log('🚀 Starting seed...')

  // Import the Payload config dynamically
  const { default: config } = await import('./payload.config')
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  console.log('📦 Payload instance ready')

  // ── 1. Create Categories ──
  console.log('\n📁 Creating portfolio categories...')
  const categoryIdMap: Record<string, number> = {}
  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: 'portfolio-categories',
      where: { slug: { equals: cat.slug } },
    })

    if (existing.docs.length > 0) {
      console.log(`  ⏭  "${cat.title}" already exists (id: ${existing.docs[0].id})`)
      categoryIdMap[cat.slug] = Number(existing.docs[0].id)
    } else {
      const created = await payload.create({
        collection: 'portfolio-categories',
        data: cat,
      })
      console.log(`  ✅ Created "${cat.title}" (id: ${created.id})`)
      categoryIdMap[cat.slug] = Number(created.id)
    }
  }

  // ── 2. Upload Portfolio Images + Create PortfolioItems ──
  console.log('\n🖼️  Uploading portfolio images...')
  let uploaded = 0
  let failed = 0

  for (const [catSlug, filenames] of Object.entries(CATEGORY_IMAGES)) {
    const catDef = CATEGORIES.find((c) => c.slug === catSlug)
    if (!catDef || !categoryIdMap[catSlug]) {
      console.error(`  ❌ No category found for "${catSlug}"`)
      continue
    }

    // Old site folder name
    const folderName = catDef.title.replace(/ /g, '_').replace('Baby_Shower', 'Babyshower')
    const sourceDir = path.join(OLD_SITE_PUBLIC, folderName)
    const categoryId = categoryIdMap[catSlug]

    for (const filename of filenames) {
      const filePath = path.join(sourceDir, filename)
      if (!fs.existsSync(filePath)) {
        console.error(`  ❌ File not found: ${filePath}`)
        failed++
        continue
      }

      try {
        const fileData = readFileForUpload(filePath)
        const altText = `${catDef.title} mehndi design by Shiva Mehndi Art`

        const mediaDoc = await payload.create({
          collection: 'media',
          data: { alt: altText },
          file: fileData,
        })

        await payload.create({
          collection: 'portfolio-items',
          data: {
            image: mediaDoc.id,
            category: categoryId,
            altText,
          },
        })
        uploaded++
        process.stdout.write('.')
      } catch (err) {
        console.error(`\n  ❌ Failed ${filename}:`, (err as Error).message)
        failed++
      }
    }
  }
  console.log(`\n  ✅ Portfolio: ${uploaded} uploaded, ${failed} failed`)

  // ── 3. Upload Featured Images ──
  console.log('\n🌟 Uploading featured images...')
  const featuredDir = path.join(OLD_SITE_PUBLIC, 'featured')
  if (fs.existsSync(featuredDir)) {
    for (const filename of FEATURED_IMAGES) {
      const filePath = path.join(featuredDir, filename)
      if (!fs.existsSync(filePath)) continue

      try {
        const fileData = readFileForUpload(filePath)
        const nameNoExt = path.basename(filename, path.extname(filename))
        const altText = `${nameNoExt.replace(/[_-]+/g, ' ')} with Shiva Mehndi Art`

        await payload.create({
          collection: 'media',
          data: { alt: altText },
          file: fileData,
        })
        console.log(`  ✅ Featured: ${filename}`)
      } catch (err) {
        console.error(`  ❌ Featured ${filename}:`, (err as Error).message)
      }
    }
  }

  // ── 4. Upload Business Images ──
  console.log('\n🏪 Uploading business images...')
  const imgDir = path.join(OLD_SITE_PUBLIC, 'img')
  if (fs.existsSync(imgDir)) {
    for (const { file: filename, alt: altText } of BUSINESS_IMAGES) {
      const filePath = path.join(imgDir, filename)
      if (!fs.existsSync(filePath)) {
        console.warn(`  ⚠  Not found: ${filename}`)
        continue
      }

      try {
        const fileData = readFileForUpload(filePath)
        await payload.create({
          collection: 'media',
          data: { alt: altText },
          file: fileData,
        })
        console.log(`  ✅ Business: ${filename}`)
      } catch (err) {
        console.error(`  ❌ ${filename}:`, (err as Error).message)
      }
    }
  }

  console.log('\n🎉 Seed complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('💥 Seed failed:', err)
  process.exit(1)
})
