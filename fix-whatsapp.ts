import { getPayload } from 'payload'
import config from './src/payload.config'

async function fix() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'discovered-artists',
    limit: 500,
  })

  let updated = 0
  for (const doc of docs) {
    if (doc.phone && !doc.whatsappNumber) {
      await payload.update({
        collection: 'discovered-artists',
        id: doc.id,
        data: { whatsappNumber: doc.phone },
        overrideAccess: true,
      })
      updated++
    }
  }

  console.log(`Updated ${updated} artists with WhatsApp numbers`)

  // Count stats
  const withPhone = docs.filter(d => d.phone).length
  const withWhatsApp = docs.filter(d => d.whatsappNumber).length
  console.log(`Stats: ${withPhone}/${docs.length} have phone, ${withWhatsApp}/${docs.length} have WhatsApp`)

  process.exit(0)
}

fix()
