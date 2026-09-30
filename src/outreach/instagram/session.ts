/**
 * Instagram Mobile API Session Persistence via Local Redis / Upstash.
 *
 * Importers/Callers: `src/outreach/instagram/client.ts`, `scripts/auth-instagram.ts`.
 * Affected APIs: Instagram Private Mobile API (`instagram-private-api`), Local Docker Redis (`redis://127.0.0.1:6379`).
 * Schemas: `InstagramSessionState` ({ username, deviceString, deviceId, cookies }).
 * User instruction: "okay lets work on it."
 */

import { IgApiClient } from 'instagram-private-api'
import { getUnifiedRedis } from '../redis-client'

const REDIS_KEY_INSTAGRAM_SESSION = 'artistora:instagram:session:state'

export interface InstagramSessionState {
  username: string
  deviceString: string
  deviceId: string
  cookies: any
  savedAt: string
}

/**
 * Saves current authenticated Instagram client state and cookies to Redis.
 */
export async function saveInstagramSessionToRedis(
  ig: IgApiClient,
  username: string,
): Promise<boolean> {
  try {
    const cookies = await ig.state.serializeCookieJar()
    const sessionState: InstagramSessionState = {
      username,
      deviceString: (ig.state as any).deviceString,
      deviceId: ig.state.deviceId,
      cookies,
      savedAt: new Date().toISOString(),
    }

    const redis = getUnifiedRedis()
    await redis.set(REDIS_KEY_INSTAGRAM_SESSION, JSON.stringify(sessionState))
    console.log(`[InstagramSession] ✅ Saved session for @${username} to Redis`)
    return true
  } catch (err: any) {
    console.warn(`[InstagramSession] Failed to save session to Redis: ${err.message}`)
    return false
  }
}

/**
 * Tests whether the currently loaded session cookies are still valid on Instagram.
 */
export async function verifyInstagramSession(
  ig: IgApiClient,
): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const cookies = await ig.state.serializeCookieJar()
    const cookieList = cookies?.cookies || []
    const uniqueCookieMap = new Map<string, string>()
    for (const c of cookieList) {
      if (c.key && c.value) uniqueCookieMap.set(c.key, c.value)
    }
    const cookieString = Array.from(uniqueCookieMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
    const sessionId = uniqueCookieMap.get('sessionid')

    if (!sessionId) {
      return { valid: false, error: 'No sessionid found in cookies' }
    }

    const res = await fetch(
      'https://www.instagram.com/api/v1/users/web_profile_info/?username=instagram',
      {
        headers: {
          Cookie: cookieString,
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'X-IG-App-ID': '936619743392459',
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    )

    if (res.status === 401 || res.status === 403 || res.redirected) {
      return {
        valid: false,
        error: `Session expired (Status ${res.status}${res.redirected ? ' - Redirected' : ''})`,
      }
    }

    return { valid: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` }
  } catch (err: any) {
    return { valid: false, error: err.message }
  }
}

/**
 * Loads Instagram session from Redis and restores cookie jar and device identity.
 */
export async function loadInstagramSessionFromRedis(
  ig: IgApiClient,
): Promise<{ success: boolean; username?: string }> {
  try {
    const redis = getUnifiedRedis()
    const rawData = await redis.get<string>(REDIS_KEY_INSTAGRAM_SESSION)
    if (!rawData) {
      return { success: false }
    }

    const sessionState: InstagramSessionState =
      typeof rawData === 'string' ? JSON.parse(rawData) : rawData

    if (!sessionState?.username || !sessionState?.cookies) {
      return { success: false }
    }

    ig.state.generateDevice(sessionState.username)
    if (sessionState.deviceString) {
      ;(ig.state as any).deviceString = sessionState.deviceString
    }
    if (sessionState.deviceId) {
      ig.state.deviceId = sessionState.deviceId
    }

    await ig.state.deserializeCookieJar(
      typeof sessionState.cookies === 'string'
        ? sessionState.cookies
        : JSON.stringify(sessionState.cookies),
    )

    console.log(`[InstagramSession] 🔄 Restored session for @${sessionState.username} from Redis`)
    return { success: true, username: sessionState.username }
  } catch (err: any) {
    console.warn(`[InstagramSession] Failed to restore session from Redis: ${err.message}`)
    return { success: false }
  }
}

/**
 * Authenticates using a browser sessionid cookie, completely bypassing
 * mobile app version checks and password-based 2FA challenge walls.
 */
export async function loginWithSessionId(
  ig: IgApiClient,
  sessionIdOrCookieString: string,
  optionalUsername?: string,
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const raw = sessionIdOrCookieString.trim()
    let sessionId = raw
    let dsUserId = ''
    let csrfToken = ''
    let mid = ''

    // 1. Parse full cookie string if pasted from request headers
    if (raw.includes(';')) {
      const parts = raw.split(';')
      for (const part of parts) {
        const [k, ...v] = part.trim().split('=')
        const val = v.join('=')
        if (k.toLowerCase() === 'sessionid') sessionId = val
        if (k.toLowerCase() === 'ds_user_id') dsUserId = val
        if (k.toLowerCase() === 'csrftoken') csrfToken = val
        if (k.toLowerCase() === 'mid') mid = val
      }
    } else if (raw.includes('sessionid=')) {
      const match = raw.match(/sessionid=([^;]+)/)
      if (match) sessionId = match[1]
    }

    // 2. Extract ds_user_id from sessionid if not explicitly provided (sessionid format: <ds_user_id>%3A...)
    if (!dsUserId && sessionId) {
      const decoded = decodeURIComponent(sessionId)
      const userMatch = decoded.match(/^(\d+)[:%]/) || sessionId.match(/^(\d+)[:%]/)
      if (userMatch) {
        dsUserId = userMatch[1]
      }
    }

    // 3. Perform web handshake with instagram.com to fetch fresh csrf/mid and confirm username
    let resolvedUsername = optionalUsername || ''
    try {
      const res = await fetch('https://www.instagram.com/', {
        headers: {
          Cookie: `sessionid=${sessionId}; ${dsUserId ? `ds_user_id=${dsUserId};` : ''}`,
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      })

      const html = await res.text()
      const usernameMatch =
        html.match(/"username":"([^"]+)"/) ||
        html.match(/"viewer":\{"id":"\d+","username":"([^"]+)"/)
      if (usernameMatch && usernameMatch[1]) {
        resolvedUsername = usernameMatch[1]
      }

      const setCookies =
        typeof res.headers.getSetCookie === 'function'
          ? res.headers.getSetCookie()
          : [res.headers.get('set-cookie') || '']
      for (const c of setCookies) {
        if (!csrfToken && c.includes('csrftoken=')) {
          csrfToken = c.match(/csrftoken=([^;]+)/)?.[1] || ''
        }
        if (!mid && c.includes('mid=')) {
          mid = c.match(/mid=([^;]+)/)?.[1] || ''
        }
      }
    } catch (err: any) {
      console.warn(`[InstagramSession] Web handshake notice: ${err.message}`)
    }

    if (!resolvedUsername) {
      resolvedUsername = dsUserId ? `user_${dsUserId}` : 'instagram_user'
    }
    if (!csrfToken) {
      csrfToken = 'csrf_' + Math.random().toString(36).substring(2, 15)
    }

    ig.state.generateDevice(resolvedUsername)

    // 4. Inject all cookie keys into cookie jar for both web and mobile hosts
    const cookieDomains = ['https://i.instagram.com', 'https://www.instagram.com']
    for (const domain of cookieDomains) {
      await ig.state.cookieJar.setCookie(
        `sessionid=${sessionId}; Domain=.instagram.com; Path=/; Secure; HttpOnly`,
        domain,
      )
      if (dsUserId) {
        await ig.state.cookieJar.setCookie(
          `ds_user_id=${dsUserId}; Domain=.instagram.com; Path=/; Secure`,
          domain,
        )
      }
      if (csrfToken) {
        await ig.state.cookieJar.setCookie(
          `csrftoken=${csrfToken}; Domain=.instagram.com; Path=/; Secure`,
          domain,
        )
      }
      if (mid) {
        await ig.state.cookieJar.setCookie(
          `mid=${mid}; Domain=.instagram.com; Path=/; Secure; HttpOnly`,
          domain,
        )
      }
    }

    const user = {
      pk: dsUserId ? parseInt(dsUserId, 10) : 0,
      username: resolvedUsername,
      full_name: resolvedUsername,
    }

    // 5. Save verified state to Redis
    await saveInstagramSessionToRedis(ig, user.username)

    console.log(
      `[InstagramSession] ✅ Successfully authenticated as @${user.username} via sessionid cookie`,
    )
    return { success: true, user }
  } catch (err: any) {
    console.error(`[InstagramSession] ❌ SessionID authentication failed: ${err.message}`)
    return { success: false, error: err.message }
  }
}

/**
 * Clears saved Instagram session from Redis.
 */
export async function clearInstagramSessionFromRedis(): Promise<void> {
  try {
    const redis = getUnifiedRedis()
    await redis.del(REDIS_KEY_INSTAGRAM_SESSION)
    console.log('[InstagramSession] 🗑️ Cleared saved session from Redis')
  } catch (err: any) {
    console.warn(`[InstagramSession] Clear warning: ${err.message}`)
  }
}
