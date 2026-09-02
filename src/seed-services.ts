import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { getPayload } from 'payload'
import * as fs from 'fs'
import * as path from 'path'

const MAP = [
  { serviceId: 1, file: 'Bridal.webp', alt: 'Bridal Mehndi Service' },
  { serviceId: 2, file: 'engagement.webp', alt: 'Engagement Mehndi Service' },
  { serviceId: 3, file: 'Baby_shower.webp', alt: 'Baby Shower Mehndi Service' },
]

async function main() {
  const { default: config } = await import('./payload.config')
  const payload = await getPayload({ config: await config })

  for (const { serviceId, file, alt } of MAP) {
    const filePath = path.join('/Users/admin/Developer/shivamehndiart/public/img', file)
    if (!fs.existsSync(filePath)) { console.error('Missing:', filePath); continue }
    const data = fs.readFileSync(filePath)
    const ext = path.extname(file).toLowerCase()
    const mime: Record<string,string> = {'.jpg':'image/jpeg','.webp':'image/webp'}
    const mediaDoc = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data: Buffer.from(data), mimetype: mime[ext]||'image/webp', name: file, size: fs.statSync(filePath).size },
    })
    await payload.update({
      collection: 'services',
      id: serviceId,
      data: { image: mediaDoc.id },
    })
    console.log('✅', file, '-> service', serviceId)
  }
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
