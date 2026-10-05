import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
import { getPayload } from 'payload'
import config from '../src/payload.config'

const NAIL_ARTISTS = [
  {
    handle: 'thenailroom_ahmedabad',
    name: 'The Nail Room',
    area: 'Prahlad Nagar',
    category: 'nail-artists',
  },
  {
    handle: 'enamel_nailstudio',
    name: 'Enamel Nail Studio',
    area: 'Sindhu Bhavan Road',
    category: 'nail-artists',
  },
  {
    handle: 'thenailbox.ahmedabad',
    name: 'The Nail Box',
    area: 'Vastrapur',
    category: 'nail-artists',
  },
  {
    handle: 'nailcouture_ahmedabad',
    name: 'Nail Couture',
    area: 'Satellite',
    category: 'nail-artists',
  },
  {
    handle: 'glitzglam_nailstudio',
    name: 'Glitz Glam Nail Studio',
    area: 'Thaltej',
    category: 'nail-artists',
  },
  {
    handle: 'nailoholic_ahmedabad',
    name: 'Nailoholic Studio',
    area: 'Prahlad Nagar',
    category: 'nail-artists',
  },
  {
    handle: 'nailartby_ahmedabad',
    name: 'Nail Art By',
    area: 'Ahmedabad',
    category: 'nail-artists',
  },
  {
    handle: 'thenaillounge_ahmedabad',
    name: 'The Nail Lounge',
    area: 'Ahmedabad',
    category: 'nail-artists',
  },
  {
    handle: 'nailbox_ahmedabad',
    name: 'Nail Box Ahmedabad',
    area: 'Ahmedabad',
    category: 'nail-artists',
  },
  { handle: 'nailashes_ahmedabad', name: 'Nailashes', area: 'Bodakdev', category: 'nail-artists' },
]

async function run() {
  const payload = await getPayload({ config })

  const allNailArtists = await payload.find({
    collection: 'discovered-artists',
    where: {
      or: [
        { serviceDisplay: { contains: 'Nail' } },
        { specializations: { contains: 'nail' } },
        { name: { contains: 'Nail' } },
        { instagramHandle: { contains: 'nail' } },
      ],
    },
    limit: 200,
    sort: '-createdAt',
  })

  console.log('================================================================')
  console.log(`💅 Total Nail Artists in Database: ${allNailArtists.totalDocs}`)

  const withWhatsApp = allNailArtists.docs.filter((d) => Boolean(d.whatsappNumber || d.phone))
  const newArtists = allNailArtists.docs.filter(
    (d) => d.outreachStatus === 'new' || !d.outreachStatus,
  )
  const contactedArtists = allNailArtists.docs.filter((d) => d.outreachStatus === 'contacted')

  console.log(
    `📱 Nail Artists with WhatsApp Number (Ready for WA Outreach): ${withWhatsApp.length}`,
  )
  console.log(
    `💬 Nail Artists for Instagram DM: ${allNailArtists.docs.length - withWhatsApp.length}`,
  )
  console.log(`🆕 New / Uncontacted Nail Artists: ${newArtists.length}`)
  console.log(`📤 Already Contacted: ${contactedArtists.length}`)
  console.log('================================================================\n')

  console.log('📋 First 10 Discovered Nail Artists (Most Recent):')
  console.log(
    '-------------------------------------------------------------------------------------------------------',
  )
  console.log(
    '| #  | Name                                       | Handle                   | WhatsApp / Phone     | Status',
  )
  console.log(
    '-------------------------------------------------------------------------------------------------------',
  )
  allNailArtists.docs.slice(0, 10).forEach((doc, idx) => {
    const name = (doc.name || 'N/A').padEnd(42).slice(0, 42)
    const handle = `@${doc.instagramHandle || 'N/A'}`.padEnd(24).slice(0, 24)
    const wa = (doc.whatsappNumber || doc.phone || 'No WhatsApp').padEnd(20).slice(0, 20)
    const status = doc.outreachStatus || 'new'
    console.log(`| ${(idx + 1).toString().padEnd(2)} | ${name} | ${handle} | ${wa} | ${status}`)
  })
  console.log(
    '-------------------------------------------------------------------------------------------------------\n',
  )

  console.log('📱 First 10 Nail Artists with WhatsApp Numbers (Ready for Outreach):')
  console.log(
    '-------------------------------------------------------------------------------------------------------',
  )
  console.log(
    '| #  | Name                                       | Handle                   | WhatsApp / Phone     | Status',
  )
  console.log(
    '-------------------------------------------------------------------------------------------------------',
  )
  withWhatsApp.slice(0, 10).forEach((doc, idx) => {
    const name = (doc.name || 'N/A').padEnd(42).slice(0, 42)
    const handle = `@${doc.instagramHandle || 'N/A'}`.padEnd(24).slice(0, 24)
    const wa = (doc.whatsappNumber || doc.phone || 'No WhatsApp').padEnd(20).slice(0, 20)
    const status = doc.outreachStatus || 'new'
    console.log(`| ${(idx + 1).toString().padEnd(2)} | ${name} | ${handle} | ${wa} | ${status}`)
  })
  console.log(
    '-------------------------------------------------------------------------------------------------------',
  )

  process.exit(0)
}

run()
