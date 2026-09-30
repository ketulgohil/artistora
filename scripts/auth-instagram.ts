/**
 * Instagram Authentication & Redis Session Linker Script.
 * Authenticates your Instagram account using Instagram Private Mobile API and saves state to Redis.
 *
 * Usage:
 *   NODE_OPTIONS="--no-deprecation" npx tsx scripts/auth-instagram.ts
 *   NODE_OPTIONS="--no-deprecation" npx tsx scripts/auth-instagram.ts --cookie "your_sessionid_cookie_value"
 *
 * Importers/Callers: Standalone CLI setup script.
 * Affected APIs: Instagram Mobile API (`instagram-private-api`), Local Redis.
 * Schemas: `InstagramSessionState`.
 * User instruction: "Login failed: POST /api/v1/accounts/login/ - 400 Bad Request; Your version of Instagram is out of date. Please upgrade your app to log in to Instagram."
 */

import { IgApiClient } from 'instagram-private-api'
import dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'
import {
  saveInstagramSessionToRedis,
  loadInstagramSessionFromRedis,
  clearInstagramSessionFromRedis,
  loginWithSessionId,
} from '../src/outreach/instagram/session'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans.trim())
    }),
  )
}

async function main() {
  console.log('====================================================')
  console.log('📸 Artistora — Instagram Private API Session Linker')
  console.log('====================================================\n')

  const ig = new IgApiClient()

  // 1. Check if an active session already exists in Redis
  console.log('🔍 Checking for existing session in Redis...')
  const existingSession = await loadInstagramSessionFromRedis(ig)

  if (existingSession.success && existingSession.username) {
    console.log(`\n🎉 Active session found and verified in Redis!`)
    console.log(`   Logged in as: @${existingSession.username}`)
    console.log(
      '\n✅ Your Instagram Baileys-style engine is connected and ready to send outreach DMs.\n',
    )
    process.exit(0)
  }

  // 2. Check for CLI --cookie or --sessionid argument or env
  const args = process.argv.slice(2)
  const cookieArgIdx =
    args.indexOf('--cookie') !== -1 ? args.indexOf('--cookie') : args.indexOf('--sessionid')
  const cookieVal =
    cookieArgIdx !== -1
      ? args[cookieArgIdx + 1]
      : process.env.INSTAGRAM_SESSION_ID || process.env.IG_SESSION_ID

  if (cookieVal) {
    console.log('🍪 Authenticating via sessionid cookie...')
    const result = await loginWithSessionId(ig, cookieVal)
    if (result.success && result.user) {
      console.log(`\n🎉 Authentication successful via sessionid!`)
      console.log(`   User: @${result.user.username} (${result.user.full_name})`)
      console.log(`   User PK: ${result.user.pk}`)
      console.log('\n✅ Instagram session is permanently linked to Redis!\n')
      process.exit(0)
    } else {
      console.error(`❌ SessionID authentication failed: ${result.error}`)
      process.exit(1)
    }
  }

  console.log('Choose authentication method:')
  console.log(
    '  [1] Paste sessionid cookie from browser (Recommended — 100% bypass of app version & 2FA checks)',
  )
  console.log('  [2] Username & Password login\n')

  const choice = await askQuestion('Select option [1/2] (Default: 1): ')

  if (choice !== '2') {
    console.log('\n📌 How to get your sessionid cookie in 15 seconds:')
    console.log('  1. Open instagram.com in Chrome/Safari/Brave where you are logged in.')
    console.log('  2. Press F12 (Inspect) → click "Application" tab (or "Storage" in Firefox).')
    console.log('  3. In left sidebar, click "Cookies" → https://www.instagram.com.')
    console.log('  4. Double-click and copy the Value of "sessionid".\n')

    const inputSessionId = await askQuestion('Paste your sessionid (or full cookie string): ')
    if (!inputSessionId) {
      console.error('❌ sessionid is required.')
      process.exit(1)
    }

    console.log('\n⏳ Linking session with Instagram...')
    const result = await loginWithSessionId(ig, inputSessionId)
    if (result.success && result.user) {
      console.log(`\n🎉 Authentication successful!`)
      console.log(`   User: @${result.user.username} (${result.user.full_name})`)
      console.log(`   User PK: ${result.user.pk}`)
      console.log('\n✅ Instagram session is permanently linked to Redis!')
      console.log(
        '   You can now run automated outreach and scraping scripts with zero browser popups.\n',
      )
      process.exit(0)
    } else {
      console.error(`\n❌ Failed to authenticate with sessionid: ${result.error}`)
      process.exit(1)
    }
  }

  // 3. Password-based login fallback
  let username = args[0] || process.env.INSTAGRAM_USERNAME || process.env.IG_USERNAME
  let password = args[1] || process.env.INSTAGRAM_PASSWORD || process.env.IG_PASSWORD

  if (!username) {
    username = await askQuestion('Enter Instagram Username or Email: ')
  }
  if (!password) {
    password = await askQuestion('Enter Instagram Password: ')
  }

  if (!username || !password) {
    console.error('❌ Username and password are required.')
    process.exit(1)
  }

  console.log(`\n⏳ Generating mobile device signature for @${username}...`)
  ig.state.generateDevice(username)

  console.log('⏳ Running pre-login simulation...')
  await ig.simulate.preLoginFlow()

  console.log('🔑 Authenticating with Instagram Mobile API...')
  try {
    const loggedInUser = await ig.account.login(username, password)
    process.nextTick(async () => await ig.simulate.postLoginFlow())

    console.log(`\n✅ Authentication successful!`)
    console.log(`   User: @${loggedInUser.username} (${loggedInUser.full_name})`)
    console.log(`   User PK: ${loggedInUser.pk}`)

    // Save to Redis
    console.log('💾 Saving session and cookie jar to Redis...')
    await saveInstagramSessionToRedis(ig, loggedInUser.username)

    console.log('\n🎉 Instagram session is permanently linked to Redis!')
    console.log('   You can now run automated outreach scripts without browser or login popups.\n')
    process.exit(0)
  } catch (err: any) {
    if (err.name === 'IgCheckpointError') {
      console.error('\n⚠️ Instagram Checkpoint / 2FA Challenge Triggered!')
      console.error(
        '   Please open Instagram on your phone/browser to approve the login, or use Option 1 (sessionid cookie).',
      )
    } else {
      console.error(`\n❌ Login failed: ${err.message}`)
      console.error(
        '👉 TIP: Run `npx tsx scripts/auth-instagram.ts` and choose Option 1 (sessionid cookie) to bypass all version/credential blocks.',
      )
    }
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error in auth script:', err)
  process.exit(1)
})
