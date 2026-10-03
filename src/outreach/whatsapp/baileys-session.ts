/**
 * Baileys Auth State Persistence via Local Redis / Upstash
 *
 * Saves the multi-file auth credentials directory (creds.json, keys, etc.)
 * to Redis as a lightweight gzip archive (< 50KB total) so sessions survive
 * restarts and don't need repeated QR scanning.
 */

import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import { config } from 'dotenv'
import { getUnifiedRedis } from '../redis-client'

config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '.env.local') })

const REDIS_KEY_BAILEYS_AUTH = 'whatsapp:baileys:auth:tarball'

/**
 * Saves the Baileys auth directory to Redis.
 */
export async function saveBaileysAuthToRedis(authDir: string): Promise<boolean> {
  let secureTmpDir: string | null = null
  try {
    if (!fs.existsSync(authDir) || fs.readdirSync(authDir).length === 0) {
      return false
    }

    const redis = getUnifiedRedis()
    secureTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-auth-'))
    const tmpTar = path.join(secureTmpDir, `auth-${crypto.randomBytes(8).toString('hex')}.tar.gz`)

    execFileSync('tar', ['-czf', tmpTar, '-C', authDir, '.'], { stdio: 'pipe', timeout: 20000 })

    const buf = fs.readFileSync(tmpTar)
    const b64 = buf.toString('base64')
    await redis.set(REDIS_KEY_BAILEYS_AUTH, b64)

    const kbSize = (buf.length / 1024).toFixed(1)
    console.log(`[BaileysRedis] ✅ Saved auth credentials (${kbSize} KB) to Redis`)
    return true
  } catch (err: any) {
    console.warn(`[BaileysRedis] Save warning: ${err.message}`)
    return false
  } finally {
    if (secureTmpDir && fs.existsSync(secureTmpDir)) {
      try {
        fs.rmSync(secureTmpDir, { recursive: true, force: true })
      } catch {}
    }
  }
}

/**
 * Restores the Baileys auth directory from Redis.
 */
export async function loadBaileysAuthFromRedis(authDir: string): Promise<boolean> {
  let secureTmpDir: string | null = null
  try {
    const redis = getUnifiedRedis()
    const b64 = await redis.get<string>(REDIS_KEY_BAILEYS_AUTH)

    if (!b64 || typeof b64 !== 'string') {
      console.log('[BaileysRedis] No Baileys auth credentials found in Redis')
      return false
    }

    fs.mkdirSync(authDir, { recursive: true })

    const buf = Buffer.from(b64, 'base64')
    secureTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-restore-'))
    const tmpTar = path.join(
      secureTmpDir,
      `restore-${crypto.randomBytes(8).toString('hex')}.tar.gz`,
    )
    fs.writeFileSync(tmpTar, buf)

    execFileSync('tar', ['-xzf', tmpTar, '-C', authDir], { stdio: 'pipe', timeout: 20000 })

    const kbSize = (buf.length / 1024).toFixed(1)
    console.log(`[BaileysRedis] ✅ Restored auth credentials (${kbSize} KB) from Redis`)
    return true
  } catch (err: any) {
    console.warn(`[BaileysRedis] Restore warning: ${err.message}`)
    return false
  } finally {
    if (secureTmpDir && fs.existsSync(secureTmpDir)) {
      try {
        fs.rmSync(secureTmpDir, { recursive: true, force: true })
      } catch {}
    }
  }
}
