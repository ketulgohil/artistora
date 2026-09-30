/**
 * Outreach History Viewer Script.
 * Queries PostgreSQL `outreach_messages` and `discovered_artists` to display all contacted artists,
 * channel used (WhatsApp vs Instagram), sent timestamp, and outreach status.
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/show-outreach-history.ts
 *
 * Importers/Callers: Executed standalone via CLI by admin.
 * Affected APIs: Payload CMS Local API.
 * Schemas: `outreach_messages`, `discovered_artists`.
 * User instruction: "we have contact some artist yesterday do we hve history on them?"
 */

import { getPayloadClient } from '../src/lib/payload'
import dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function main() {
  console.log('================================================================')
  console.log('📜 Artistora — Outreach History & Contacted Artists Log')
  console.log('================================================================\n')

  const payload = await getPayloadClient()

  // 1. Fetch all sent outreach messages
  const messagesResult = await payload.find({
    collection: 'outreach-messages',
    where: {
      status: { equals: 'sent' },
    },
    limit: 500,
    depth: 1,
    sort: '-sentAt',
  })

  console.log(`📊 Total Outreach Messages Sent on Record: ${messagesResult.docs.length}\n`)

  if (messagesResult.docs.length === 0) {
    console.log('ℹ️ No outreach messages found in database.\n')
  } else {
    console.log('------------------------------------------------------------------------------------------------------------------------')
    console.log('| #   | Channel     | Sent Date (IST)     | Artist Name                         | Contact (Phone / Handle)     | Campaign')
    console.log('------------------------------------------------------------------------------------------------------------------------')

    messagesResult.docs.forEach((doc: any, index: number) => {
      const artist = typeof doc.artist === 'object' ? doc.artist : null
      const artistName = (artist?.name || artist?.businessName || doc.recipientInstagram || 'Unknown').slice(0, 35).padEnd(35, ' ')
      const channel = (doc.channel === 'whatsapp' ? '📱 WhatsApp' : '📸 IG DM   ').padEnd(11, ' ')
      const contact = (artist?.phone || artist?.whatsappNumber || doc.recipientInstagram || 'N/A').padEnd(28, ' ')
      const dateStr = doc.sentAt ? new Date(doc.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }).padEnd(19, ' ') : 'N/A                '
      const campaign = (doc.campaignName || 'general').slice(0, 20)

      console.log(`| ${(index + 1).toString().padEnd(3, ' ')} | ${channel} | ${dateStr} | ${artistName} | ${contact} | ${campaign}`)
    })
    console.log('------------------------------------------------------------------------------------------------------------------------\n')
  }

  // 2. Fetch all discovered artists marked as 'contacted'
  const contactedArtists = await payload.find({
    collection: 'discovered-artists',
    where: {
      outreachStatus: { equals: 'contacted' },
    },
    limit: 500,
    sort: '-lastContactedAt',
  })

  console.log(`👥 Total Discovered Artists Marked as 'Contacted': ${contactedArtists.docs.length}\n`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error loading history:', err)
  process.exit(1)
})
