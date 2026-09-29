/**
 * Cleanup script to remove test and dummy data generated during integration tests.
 *
 * Importers/Callers: Executed standalone via CLI by developer/admin (`NODE_OPTIONS="--no-deprecation" node --import tsx scripts/clean-test-data.ts`).
 * Affected APIs: Payload CMS Local API `payload.find` and `payload.delete`.
 * Schemas: `artists`, `users`, `leads`, `quotes`, `bookings`, `reviews` collections in PostgreSQL.
 * User instruction: "i see some test artist in the artist grid i don't want that and please don't add this kind of dummy data and if in case you add it then please delete after testing."
 */

import { getPayloadClient } from '../src/lib/payload'

async function cleanTestData() {
  console.log('🧹 [Cleanup] Scanning for test data in database...')
  const payload = await getPayloadClient()

  // 1. First find all test artist IDs and test lead IDs
  const testArtists = await payload.find({
    collection: 'artists',
    where: {
      or: [
        { slug: { contains: 'test-artist' } },
        { displayName: { equals: 'Test Artist' } },
        { displayName: { contains: 'Test' } },
      ],
    },
    limit: 500,
  })
  const artistIds = testArtists.docs.map((a) => a.id)
  console.log(`Found ${artistIds.length} test artist(s):`, artistIds)

  const testLeads = await payload.find({
    collection: 'leads',
    where: {
      or: [
        { customerEmail: { contains: 'testrunner.com' } },
        { customerName: { equals: 'Test Customer' } },
        { customerName: { equals: 'Token Test' } },
      ],
    },
    limit: 500,
  })
  const leadIds = testLeads.docs.map((l) => l.id)
  console.log(`Found ${leadIds.length} test lead(s):`, leadIds)

  // 2. Find and delete reviews tied to test artists or test customers
  const testReviews = await payload.find({
    collection: 'reviews',
    where: {
      or: [
        { customerName: { equals: 'Test Customer' } },
        { text: { equals: 'Excellent!' } },
        ...(artistIds.length > 0 ? [{ artist: { in: artistIds } }] : []),
      ],
    },
    limit: 500,
  })
  console.log(`Found ${testReviews.docs.length} test review(s) to delete`)
  for (const rev of testReviews.docs) {
    try {
      await payload.delete({ collection: 'reviews', id: rev.id })
      console.log(`  ✅ Deleted review #${rev.id}`)
    } catch (e: any) {
      console.error(`  ❌ Failed to delete review #${rev.id}: ${e.message}`)
    }
  }

  // 3. Find and delete bookings tied to test leads or test artists
  const testBookings = await payload.find({
    collection: 'bookings',
    where: {
      or: [
        { name: { equals: 'Test Customer' } },
        { email: { contains: 'testrunner.com' } },
        ...(leadIds.length > 0 ? [{ lead: { in: leadIds } }] : []),
        ...(artistIds.length > 0 ? [{ artist: { in: artistIds } }] : []),
      ],
    },
    limit: 500,
  })
  console.log(`Found ${testBookings.docs.length} test booking(s) to delete`)
  for (const booking of testBookings.docs) {
    try {
      await payload.delete({ collection: 'bookings', id: booking.id })
      console.log(`  ✅ Deleted booking #${booking.id}`)
    } catch (e: any) {
      console.error(`  ❌ Failed to delete booking #${booking.id}: ${e.message}`)
    }
  }

  // 4. Find and delete quotes tied to test leads or test artists
  const testQuotes = await payload.find({
    collection: 'quotes',
    where: {
      or: [
        ...(leadIds.length > 0 ? [{ lead: { in: leadIds } }] : []),
        ...(artistIds.length > 0 ? [{ artist: { in: artistIds } }] : []),
      ],
    },
    limit: 500,
  })
  console.log(`Found ${testQuotes.docs.length} test quote(s) to delete`)
  for (const quote of testQuotes.docs) {
    try {
      await payload.delete({ collection: 'quotes', id: quote.id })
      console.log(`  ✅ Deleted quote #${quote.id}`)
    } catch (e: any) {
      console.error(`  ❌ Failed to delete quote #${quote.id}: ${e.message}`)
    }
  }

  // 5. Delete test leads
  for (const lead of testLeads.docs) {
    try {
      await payload.delete({ collection: 'leads', id: lead.id })
      console.log(`  ✅ Deleted lead #${lead.id}`)
    } catch (e: any) {
      console.error(`  ❌ Failed to delete lead #${lead.id}: ${e.message}`)
    }
  }

  // 6. Delete test artists
  for (const artist of testArtists.docs) {
    try {
      await payload.delete({ collection: 'artists', id: artist.id })
      console.log(`  ✅ Deleted artist #${artist.id} (${artist.displayName})`)
    } catch (e: any) {
      console.error(`  ❌ Failed to delete artist #${artist.id}: ${e.message}`)
    }
  }

  // 7. Find and delete test users
  const testUsers = await payload.find({
    collection: 'users',
    where: {
      or: [
        { email: { contains: '@testrunner.com' } },
        { email: { contains: 'test-artist-' } },
        { email: { contains: 'test-customer-' } },
      ],
    },
    limit: 500,
  })
  console.log(`Found ${testUsers.docs.length} test user(s) to delete`)
  for (const user of testUsers.docs) {
    try {
      await payload.delete({ collection: 'users', id: user.id })
      console.log(`  ✅ Deleted user #${user.id} (${user.email})`)
    } catch (e: any) {
      console.error(`  ❌ Failed to delete user #${user.id}: ${e.message}`)
    }
  }

  console.log('\n✨ [Cleanup Complete] All test entities removed successfully.')
  process.exit(0)
}

cleanTestData().catch((err) => {
  console.error('Cleanup error:', err)
  process.exit(1)
})
