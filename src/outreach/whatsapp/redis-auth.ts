/**
 * Redis-backed WhatsApp Auth Strategy
 *
 * Extends LocalAuth to persist the WhatsApp session in Upstash Redis.
 * On startup, restores session from Redis. After authentication, saves to Redis.
 * Survives process restarts without QR code re-scanning.
 */

import { saveSessionToRedis, loadSessionFromRedis } from './redis-session'

// We use require() for whatsapp-web.js (CJS module)
const { createRequire } = require('module')
const req = createRequire(require.resolve('../../../package.json'))
const LocalAuth = req('whatsapp-web.js').LocalAuth

export class RedisAuth extends LocalAuth {
  private _sessionRestored = false

  async beforeBrowserInitialized() {
    // First, try to restore session from Redis before LocalAuth sets up the directory
    const sessionDirName = this.clientId ? `session-${this.clientId}` : 'session'
    const sessionDir = require('path').join(
      this.dataPath || './.wwebjs_auth/',
      sessionDirName,
    )

    console.log('[RedisAuth] Attempting to restore session from Redis...')
    const restored = await loadSessionFromRedis(sessionDir)
    this._sessionRestored = restored

    // Now call parent which sets up userDataDir
    await super.beforeBrowserInitialized()
  }

  async afterAuthReady() {
    // Save session to Redis after successful authentication
    const sessionDirName = this.clientId ? `session-${this.clientId}` : 'session'
    const sessionDir = require('path').join(
      this.dataPath || './.wwebjs_auth/',
      sessionDirName,
    )

    console.log('[RedisAuth] Saving session to Redis...')
    await saveSessionToRedis(sessionDir)

    // Call parent
    await super.afterAuthReady()
  }
}
