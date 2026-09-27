import { chromium } from 'playwright'
import type { ScrapedArtist } from '../types'

// Shared browser launch config
export const BROWSER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']

export const BROWSER_CONTEXT_OPTIONS = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  viewport: { width: 1366, height: 768 } as { width: number; height: number },
  locale: 'en-IN',
  timezoneId: 'Asia/Kolkata',
}

export function launchBrowser() {
  return chromium.launch({ headless: true, args: BROWSER_ARGS })
}

// Sleep with ±30% jitter to avoid bot detection patterns
export function jitteredSleep(baseMs: number): Promise<void> {
  const jitter = baseMs * 0.3
  const ms = baseMs - jitter + Math.random() * jitter * 2
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        await jitteredSleep(baseDelayMs * Math.pow(2, attempt - 1))
      }
    }
  }
  throw lastError
}

// Normalize phone to +91XXXXXXXXXX — returns undefined if not a 10-digit mobile
export function normalizePhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let digits = raw.replace(/[^\d]/g, '')
  // Strip leading 0091
  if (digits.length === 14 && digits.startsWith('0091')) digits = digits.slice(4)
  // Strip leading 91 (12 digits)
  else if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  // Strip leading 0 (11 digits)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)

  // Must be 10 digits starting with 6-9 (Indian mobile)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`
  }
  return undefined
}

// Shared price range parser used by WedMeGood and WeddingWire
export function parsePriceRange(priceText: string | null | undefined): ScrapedArtist['priceRange'] {
  if (!priceText) return 'unknown'
  if (priceText.includes('₹') || priceText.includes('Rs')) {
    const numMatch = priceText.match(/(\d[\d,]*)/)
    if (numMatch) {
      const num = parseInt(numMatch[1].replace(/,/g, ''))
      if (num < 10000) return 'budget'
      if (num < 50000) return 'mid'
      if (num < 100000) return 'premium'
      return 'luxury'
    }
  }
  return 'unknown'
}
