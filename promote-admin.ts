// Run with: npx tsx promote-admin.ts
import { getPayload } from 'payload'
import config from './src/payload.config'

async function promote() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'users',
    limit: 10,
    overrideAccess: true,
  })

  if (docs.length === 0) {
    console.log('No users found. Register at /register first.')
    process.exit(1)
  }

  for (const user of docs) {
    console.log(`User: ${user.email} | current role: ${user.role || 'none'}`)
  }

  // Promote first user to admin
  const firstUser = docs[0]
  await payload.update({
    collection: 'users',
    id: firstUser.id,
    data: { role: 'admin' },
    overrideAccess: true,
  })

  console.log(`\n✅ Promoted ${firstUser.email} to admin`)
  console.log('Log out and log back in for the role change to take effect.')

  process.exit(0)
}

promote()
