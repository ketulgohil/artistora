/**
 * Instantaneous Instagram Outreach Target Inspector & Message Previewer.
 * Uses direct PostgreSQL access to query and classify uncontacted artists in under 300ms.
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/get-insta-targets.ts --category mehndi --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/get-insta-targets.ts --category nail --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/get-insta-targets.ts --category makeup --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/get-insta-targets.ts --category decor --limit 10
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/get-insta-targets.ts --all
 */

import {
  getUncontactedInstagramArtists,
  getInstagramOutreachStats,
  closeDbPool,
  type InstagramArtistRecord,
} from '../src/outreach/db'
import {
  detectCategory,
  cleanArtistNameForGreeting,
  generateDynamicInstagramMessage,
  type OutreachCategory,
} from '../src/outreach/instagram/messaging'

async function main() {
  const startTime = Date.now()

  const args = process.argv.slice(2)
  const isAll = args.includes('--all')

  const catIdx = args.indexOf('--category')
  const requestedCategory =
    catIdx !== -1 ? (args[catIdx + 1]?.toLowerCase() as OutreachCategory) : null

  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 10 : 10

  const showMessages = !args.includes('--compact')

  console.log('================================================================')
  console.log('📸 Artistora — Instagram Outreach Target Inspector')
  console.log('================================================================\n')

  const stats = await getInstagramOutreachStats()
  console.log('📊 Global Instagram Outreach Statistics:')
  console.log(`   • Total Discovered Artists:    ${stats.totalDiscovered}`)
  console.log(`   • Artists with Instagram:      ${stats.totalWithInstagram}`)
  console.log(`   • Contacted via Instagram DM:  ${stats.contactedCount}`)
  console.log(`   • Uncontacted IG Artists:      ${stats.uncontactedCount}`)
  console.log(`   • DMs Sent (Last 24 Hours):    ${stats.sentLast24Hours}/20 (Daily Cap)\n`)

  const rawArtists = await getUncontactedInstagramArtists({ limit: 1000 })

  // Categorize and filter artists
  const categorized = rawArtists.map((artist) => {
    const catInfo = detectCategory(
      '',
      artist.name,
      artist.instagramHandle,
      `${artist.serviceDisplay || ''} ${artist.specializations || ''}`,
    )
    const cleanName = cleanArtistNameForGreeting(artist.name, artist.instagramHandle)
    return {
      ...artist,
      detectedCategory: catInfo.category,
      categoryLabel: catInfo.label,
      cleanName,
      registrationUrl: catInfo.registrationUrl,
    }
  })

  // Category summary counts
  const categoryCounts: Record<OutreachCategory, number> = {
    mehndi: 0,
    nail: 0,
    makeup: 0,
    decor: 0,
    general: 0,
  }

  categorized.forEach((a) => {
    categoryCounts[a.detectedCategory]++
  })

  console.log('🎯 Available Uncontacted Pipeline by Category:')
  console.log(`   🌿 Mehndi Artists:            ${categoryCounts.mehndi}`)
  console.log(`   💅 Nail Artists:              ${categoryCounts.nail}`)
  console.log(`   💄 Makeup & Hair Artists:     ${categoryCounts.makeup}`)
  console.log(`   🏛️ Decor & Event Planners:    ${categoryCounts.decor}`)
  console.log(`   💍 General Wedding Creators:  ${categoryCounts.general}\n`)

  if (isAll) {
    console.log(`⏱️ Query executed in ${Date.now() - startTime}ms.`)
    await closeDbPool()
    process.exit(0)
  }

  let selectedTargets = categorized
  if (requestedCategory) {
    selectedTargets = categorized.filter((a) => a.detectedCategory === requestedCategory)
  }

  const targetList = selectedTargets.slice(0, limit)

  console.log('================================================================')
  console.log(
    `📋 Target Queue: ${targetList.length} Artists ${requestedCategory ? `(Category: ${requestedCategory.toUpperCase()})` : '(All Categories)'}`,
  )
  console.log('================================================================\n')

  if (targetList.length === 0) {
    console.log(`ℹ️ No uncontacted artists found for category "${requestedCategory}".\n`)
  } else {
    targetList.forEach((artist, index) => {
      const cleanHandle = artist.instagramHandle.replace(/^@/, '')
      const message = generateDynamicInstagramMessage({
        id: artist.id,
        name: artist.name,
        handle: artist.instagramHandle,
        category: artist.detectedCategory,
        specializations: artist.specializations,
        serviceDisplay: artist.serviceDisplay,
      })

      console.log(`[${index + 1}/${targetList.length}] 🎯 ID: ${artist.id}`)
      console.log(`   👤 Clean Greeting Name: "${artist.cleanName}"`)
      console.log(`   🏷️ Raw Name:            "${artist.name}"`)
      console.log(`   📸 Handle:              @${cleanHandle}`)
      console.log(`   📂 Category:            ${artist.categoryLabel}`)
      console.log(`   🔗 Profile URL:         https://www.instagram.com/${cleanHandle}/`)

      if (showMessages) {
        console.log('\n   💬 Generated Dynamic Message:')
        const indentedMsg = message
          .split('\n')
          .map((line) => `      ${line}`)
          .join('\n')
        console.log(indentedMsg)
      }
      console.log('\n' + '-'.repeat(64) + '\n')
    })
  }

  const elapsedMs = Date.now() - startTime
  console.log(`⚡ Execution completed in ${elapsedMs}ms.\n`)

  await closeDbPool()
}

main().catch(async (err) => {
  console.error('Fatal error in target inspector:', err)
  await closeDbPool()
  process.exit(1)
})
