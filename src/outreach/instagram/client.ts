/**
 * Instagram Mobile API Client Service with Redis Session Persistence.
 * Pure protocol connection to Instagram Mobile API — no Chromium/browser overhead.
 *
 * Importers/Callers: `scripts/send-instagram-outreach.ts`, `scripts/auth-instagram.ts`.
 * Affected APIs: Instagram Mobile API (`instagram-private-api`), Redis session caching.
 * Schemas: Instagram direct message payloads & user profile metadata.
 * User instruction: "okay lets work on it."
 */

import { IgApiClient } from 'instagram-private-api'
import { saveInstagramSessionToRedis, loadInstagramSessionFromRedis } from './session'

let cachedClient: IgApiClient | null = null
let authenticatedUser: string | null = null

export interface InstagramProfileDetails {
  pk: number
  username: string
  fullName: string
  biography: string
  followerCount: number
  isPrivate: boolean
  isVerified: boolean
  category?: string
  contactPhoneNumber?: string
  publicEmail?: string
}

/**
 * Initializes and returns an authenticated IgApiClient instance.
 * Restores session from Redis or authenticates with provided/env credentials.
 */
export async function getInstagramClient(credentials?: {
  username?: string
  password?: string
}): Promise<{ ig: IgApiClient; username: string }> {
  if (cachedClient && authenticatedUser) {
    return { ig: cachedClient, username: authenticatedUser }
  }

  const ig = new IgApiClient()
  const username =
    credentials?.username || process.env.INSTAGRAM_USERNAME || process.env.IG_USERNAME
  const password =
    credentials?.password || process.env.INSTAGRAM_PASSWORD || process.env.IG_PASSWORD

  // 1. Attempt to restore session from Redis
  const restored = await loadInstagramSessionFromRedis(ig)
  if (restored.success && restored.username) {
    cachedClient = ig
    authenticatedUser = restored.username
    console.log(`[InstagramClient] ✅ Authenticated as @${restored.username} via Redis session`)
    return { ig, username: restored.username }
  }

  // 2. Perform fresh login if credentials available
  if (!username || !password) {
    throw new Error(
      'Instagram credentials not found. Please provide credentials or run scripts/auth-instagram.ts',
    )
  }

  ig.state.generateDevice(username)
  await ig.simulate.preLoginFlow()

  console.log(`[InstagramClient] 🔑 Authenticating with Instagram as @${username}...`)
  const loggedInUser = await ig.account.login(username, password)
  process.nextTick(async () => await ig.simulate.postLoginFlow())

  // Save fresh session state to Redis
  await saveInstagramSessionToRedis(ig, loggedInUser.username)

  cachedClient = ig
  authenticatedUser = loggedInUser.username
  return { ig, username: loggedInUser.username }
}

/**
 * Resolves an Instagram username to user details and PK via Web Search API (no mobile checkpoint).
 */
export async function resolveInstagramUser(
  usernameOrHandle: string,
  igClient?: IgApiClient,
): Promise<InstagramProfileDetails> {
  const cleanUsername = usernameOrHandle.replace(/^@/, '').trim().toLowerCase()
  const { ig } = igClient ? { ig: igClient } : await getInstagramClient()

  // 1. Resolve PK via Web TopSearch endpoint (100% bypass of mobile checkpoint blocks)
  let pk: number | null = null
  let fullName = cleanUsername

  try {
    const cookies = await ig.state.serializeCookieJar()
    const cookieString = (cookies?.cookies || []).map((c: any) => `${c.key}=${c.value}`).join('; ')

    const searchUrl = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(cleanUsername)}&include_reel=false`
    const res = await fetch(searchUrl, {
      headers: {
        Cookie: cookieString,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://www.instagram.com/',
      },
    })

    if (res.ok) {
      const data = await res.json()
      const matched = (data.users || []).find(
        (u: any) => u.user?.username?.toLowerCase() === cleanUsername,
      )
      const user = matched ? matched.user : data.users?.[0]?.user
      if (user) {
        pk = parseInt(String(user.pk || user.id), 10)
        fullName = user.full_name || cleanUsername
      }
    }
  } catch (err: any) {
    console.warn(`[InstagramClient] Web search resolution notice: ${err.message}`)
  }

  // 2. Fallback to mobile client if web search didn't resolve PK
  if (!pk) {
    try {
      const user = await ig.user.searchExact(cleanUsername)
      pk = user.pk
      fullName = user.full_name
    } catch {
      throw new Error(`Could not resolve user PK for @${cleanUsername}`)
    }
  }

  return {
    pk,
    username: cleanUsername,
    fullName,
    biography: '',
    followerCount: 0,
    isPrivate: false,
    isVerified: false,
  }
}

/**
 * Sends a direct message to an Instagram user by handle or PK.
 */
export async function sendInstagramDM(
  targetUsernameOrPk: string | number,
  message: string,
  igClient?: IgApiClient,
): Promise<{ success: boolean; threadId?: string; error?: string }> {
  try {
    const { ig } = igClient ? { ig: igClient } : await getInstagramClient()

    let targetPk: number
    if (typeof targetUsernameOrPk === 'number') {
      targetPk = targetUsernameOrPk
    } else if (/^\d+$/.test(String(targetUsernameOrPk))) {
      targetPk = parseInt(String(targetUsernameOrPk), 10)
    } else {
      const user = await resolveInstagramUser(targetUsernameOrPk, ig)
      targetPk = user.pk
    }

    const cookies = await ig.state.serializeCookieJar()
    const cookieList = cookies?.cookies || []
    const uniqueCookieMap = new Map<string, string>()
    for (const c of cookieList) {
      if (c.key && c.value) uniqueCookieMap.set(c.key, c.value)
    }
    const cookieString = Array.from(uniqueCookieMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')

    let csrfToken = uniqueCookieMap.get('csrftoken') || ''
    if (!csrfToken) {
      try {
        const homeRes = await fetch('https://www.instagram.com/', {
          headers: {
            Cookie: cookieString,
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
        })
        const setCookies =
          typeof homeRes.headers.getSetCookie === 'function'
            ? homeRes.headers.getSetCookie()
            : [homeRes.headers.get('set-cookie') || '']
        for (const c of setCookies) {
          if (c.includes('csrftoken=')) csrfToken = c.match(/csrftoken=([^;]+)/)?.[1] || ''
        }
      } catch {}
    }

    // 1. Send via Web Direct Broadcast API
    try {
      const clientContext = Date.now().toString() + Math.floor(Math.random() * 1000000).toString()

      const body = new URLSearchParams({
        recipient_users: `[["${targetPk}"]]`,
        client_context: clientContext,
        action: 'send_item',
        text: message,
      })

      const dmRes = await fetch(
        'https://www.instagram.com/api/v1/direct_v2/threads/broadcast/text/',
        {
          method: 'POST',
          headers: {
            Cookie: cookieString,
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'X-IG-App-ID': '936619743392459',
            'X-CSRFToken': csrfToken,
            'X-Instagram-AJAX': '1',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded',
            Origin: 'https://www.instagram.com',
            Referer: 'https://www.instagram.com/direct/inbox/',
          },
          body: body.toString(),
        },
      )

      if (dmRes.ok) {
        const data = await dmRes.json()
        console.log(`[InstagramDM] ✉️ Direct message sent to ${targetUsernameOrPk}`)
        return {
          success: true,
          threadId: (data as any)?.thread_id || (data as any)?.payload?.thread_id,
        }
      } else {
        const errBody = await dmRes.text().catch(() => '')
        console.warn(`[InstagramDM] Web broadcast HTTP ${dmRes.status}: ${errBody.slice(0, 150)}`)
      }
    } catch (fetchErr: any) {
      console.warn(
        `[InstagramDM] Web broadcast notice: ${fetchErr.message}, attempting thread fallback...`,
      )
    }

    // 2. Fallback to IgApiClient mobile entity thread
    try {
      const thread = ig.entity.directThread([targetPk.toString()])
      const result = await thread.broadcastText(message)

      console.log(`[InstagramDM] ✉️ Direct message sent to ${targetUsernameOrPk}`)
      return { success: true, threadId: (result as any)?.thread_id }
    } catch (entityErr: any) {
      return { success: false, error: entityErr.message }
    }
  } catch (err: any) {
    console.error(`[InstagramDM] ❌ Failed to send DM to ${targetUsernameOrPk}: ${err.message}`)
    return { success: false, error: err.message }
  }
}
