import { createHash, randomBytes, timingSafeEqual } from 'crypto'

const HASH_ALGO = 'sha256'

/**
 * Hash a token for safe storage (never store raw tokens in DB).
 * Uses SHA-256 for consistent hashing across creation, lookup, and verification.
 */
export function hashToken(token: string): string {
  return createHash(HASH_ALGO).update(token).digest('hex')
}

/**
 * Generate a cryptographically random token (32 bytes = 64 hex chars).
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a new hashed token with its expiry.
 * Returns the raw token (shown once to user) and the hash (stored in DB).
 */
export function createTokenPair(expiresInMs: number = 7 * 24 * 60 * 60 * 1000) {
  const rawToken = generateToken()
  const hash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString()
  return { rawToken, hash, expiresAt }
}

/**
 * Verify a raw token against a stored hash, checking expiry and revocation.
 * Returns an error response if invalid, or null if valid.
 */
export function verifyToken(params: {
  rawToken: string
  storedHash: string | null | undefined
  expiresAt: string | null | undefined
  revokedAt: string | null | undefined
}): { valid: false; error: string; status: number } | { valid: true } {
  const { rawToken, storedHash, expiresAt, revokedAt } = params

  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, error: 'Access token required', status: 401 }
  }

  const hashedToken = hashToken(rawToken)
  const expected = storedHash ? Buffer.from(storedHash, 'hex') : Buffer.alloc(0)
  const actual = Buffer.from(hashedToken, 'hex')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { valid: false, error: 'Invalid access token', status: 403 }
  }

  if (!expiresAt || Number.isNaN(new Date(expiresAt).getTime()) || new Date(expiresAt) < new Date()) {
    return { valid: false, error: 'Access link has expired', status: 403 }
  }

  if (revokedAt) {
    return { valid: false, error: 'Access link has been revoked', status: 403 }
  }

  return { valid: true }
}
