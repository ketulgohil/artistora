import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { getPayload } from 'payload'
import * as path from 'path'
import * as fs from 'fs'

const OLD_SITE = '/Users/admin/Developer/shivamehndiart/public'

const MISSING = [
  { catSlug: 'legs', catTitle: 'Legs', folder: 'Legs', images: ['IMG_E0011.webp', 'IMG_E0070.webp', 'IMG_E9627.webp', 'IMG_E9714.webp', 'IMG_E9969.webp'] },
  { catSlug: 'minimal', catTitle: 'Minimal', folder: 'Minimal', images: ['IMG_E0032.webp', 'IMG_E0034.webp', 'IMG_E0035.webp', 'IMG_E0037.webp', 'IMG_E8270.webp'] },
  { catSlug: 'indo-arabic', catTitle: 'Indo Arabic', folder: 'Indo_Arabic', images: ['IMG_E9744.webp'] },
]

async function main() {
  const { default: config } = await import('./payload.config')
  const payload = await getPayload({ config: await config })

  for (const { catSlug, catTitle, folder, images } of MISSING) {
    const catRes = await payload.find({ collection: 'portfolio-categories', where: { slug: { equals: catSlug } }, limit: 1 })
    const categoryId = Number(catRes.docs[0]?.id)
    if (!categoryId) { console.error(`Category "${catSlug}" not found`); continue }

    for (const filename of images) {
      const filePath = path.join(OLD_SITE, folder, filename)
      if (!fs.existsSync(filePath)) { console.error(`Missing: ${filePath}`); continue }

      const data = fs.readFileSync(filePath)
      const ext = path.extname(filename).toLowerCase()
      const mimeMap: Record<string, string> = { '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png' }

      const mediaDoc = await payload.create({
        collection: 'media',
        data: { alt: `${catTitle} mehndi design by Artistora` },
        file: { data: Buffer.from(data), mimetype: mimeMap[ext] || 'image/webp', name: filename, size: fs.statSync(filePath).size },
      })

      await payload.create({
        collection: 'portfolio-items',
        data: { image: mediaDoc.id, category: categoryId, altText: `${catTitle} mehndi design by Artistora` },
      })
      console.log(`✅ ${catTitle}: ${filename}`)
    }
  }

  console.log('Done!')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
