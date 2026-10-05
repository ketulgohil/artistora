/**
 * Fast, Lightweight Direct PostgreSQL Utility for Artistora Outreach Automation.
 * Bypasses full Payload CMS schema bootstrap for instant (< 300ms) startup and execution.
 *
 * Schemas & Tables:
 *   - `discovered_artists`
 *   - `outreach_messages`
 */

import { getDbPool, closeDbPool, queryDb } from '../lib/db'
export { getDbPool, closeDbPool, queryDb }

export interface InstagramArtistRecord {
  id: number
  name: string
  businessName?: string | null
  instagramHandle: string
  phone?: string | null
  city?: string | null
  specializations?: string | null
  serviceDisplay?: string | null
  outreachStatus: string
  lastContactedAt?: string | null
  createdAt?: string | null
}

export interface OutreachStats {
  totalDiscovered: number
  totalWithInstagram: number
  uncontactedCount: number
  contactedCount: number
  sentLast24Hours: number
}

/**
 * Counts Instagram DMs successfully sent in the last 24 hours.
 */
export async function getSentDMsCountLast24Hours(): Promise<number> {
  const pool = getDbPool()
  try {
    const res = await pool.query(
      `SELECT count(*)::int as count
       FROM outreach_messages
       WHERE channel = 'instagram_dm'
         AND status = 'sent'
         AND (created_at >= NOW() - INTERVAL '24 hours' OR sent_at >= NOW() - INTERVAL '24 hours')`,
    )
    return res.rows[0]?.count || 0
  } catch (err: any) {
    console.warn('Could not query 24-hour sent DM count:', err.message)
    return 0
  }
}

/**
 * Retrieves all uncontacted Instagram artists from the database.
 * Deduplicates against `outreach_messages` (`status = 'sent' AND channel = 'instagram_dm'`).
 */
export async function getUncontactedInstagramArtists(options?: {
  limit?: number
}): Promise<InstagramArtistRecord[]> {
  const pool = getDbPool()
  const limit = options?.limit || 1000

  const query = `
    SELECT
      da.id,
      da.name,
      da.business_name AS "businessName",
      da.instagram_handle AS "instagramHandle",
      da.phone,
      da.city,
      da.specializations,
      da.service_display AS "serviceDisplay",
      da.outreach_status AS "outreachStatus",
      da.last_contacted_at AS "lastContactedAt",
      da.created_at AS "createdAt"
    FROM discovered_artists da
    WHERE da.instagram_handle IS NOT NULL
      AND TRIM(da.instagram_handle) != ''
      AND da.outreach_status != 'contacted'
      AND NOT EXISTS (
        SELECT 1
        FROM outreach_messages om
        WHERE om.artist_id = da.id
          AND om.channel = 'instagram_dm'
          AND om.status = 'sent'
      )
    ORDER BY da.id ASC
    LIMIT $1
  `

  const res = await pool.query(query, [limit * 3])

  // Deduplicate by clean handle to avoid multiple entries of the same account in the batch
  const uniqueRecords: InstagramArtistRecord[] = []
  const seenHandles = new Set<string>()

  for (const row of res.rows) {
    const clean = (row.instagramHandle || '').replace(/^@/, '').trim().toLowerCase()
    if (!clean || seenHandles.has(clean)) continue
    seenHandles.add(clean)
    uniqueRecords.push(row)
    if (uniqueRecords.length >= limit) break
  }

  return uniqueRecords
}

/**
 * Finds a single artist record by Instagram handle (with or without @).
 */
export async function getArtistByHandle(handle: string): Promise<InstagramArtistRecord | null> {
  const cleanHandle = handle.replace(/^@/, '').trim().toLowerCase()
  const pool = getDbPool()

  const query = `
    SELECT
      da.id,
      da.name,
      da.business_name AS "businessName",
      da.instagram_handle AS "instagramHandle",
      da.phone,
      da.city,
      da.specializations,
      da.service_display AS "serviceDisplay",
      da.outreach_status AS "outreachStatus",
      da.last_contacted_at AS "lastContactedAt"
    FROM discovered_artists da
    WHERE LOWER(TRIM(REPLACE(da.instagram_handle, '@', ''))) = $1
       OR LOWER(TRIM(da.slug)) = $2
    LIMIT 1
  `

  const res = await pool.query(query, [cleanHandle, `ig-${cleanHandle}`])
  return res.rows[0] || null
}

/**
 * Logs an outreach message record directly into PostgreSQL `outreach_messages`.
 */
export async function logInstagramOutreachMessage(data: {
  artistId?: number | string | null
  body: string
  status?: 'sent' | 'failed' | 'queued' | 'pending'
  campaignName?: string
  templateUsed?: string
  messageSid?: string
  errorCode?: string
  errorMessage?: string
}): Promise<number | null> {
  if (!data.artistId) return null
  const pool = getDbPool()

  const query = `
    INSERT INTO outreach_messages (
      artist_id,
      channel,
      campaign_name,
      template_used,
      body,
      status,
      sent_at,
      message_sid,
      error_code,
      error_message,
      created_at,
      updated_at
    ) VALUES (
      $1,
      'instagram_dm',
      $2,
      $3,
      $4,
      $5,
      NOW(),
      $6,
      $7,
      $8,
      NOW(),
      NOW()
    )
    RETURNING id
  `

  const res = await pool.query(query, [
    data.artistId,
    data.campaignName || 'ahmedabad-wedding-artists-v1',
    data.templateUsed || 'portfolio_showcase',
    data.body,
    data.status || 'sent',
    data.messageSid || null,
    data.errorCode || null,
    data.errorMessage || null,
  ])

  return res.rows[0]?.id || null
}

/**
 * Updates `discovered_artists` record to 'contacted' status.
 */
export async function markArtistContacted(
  artistId: number | string,
  campaignName = 'ahmedabad-wedding-artists-v1',
): Promise<void> {
  const pool = getDbPool()

  const query = `
    UPDATE discovered_artists
    SET
      outreach_status = 'contacted',
      last_contacted_at = NOW(),
      last_campaign = $2,
      outreach_attempts = COALESCE(outreach_attempts, 0) + 1,
      updated_at = NOW()
    WHERE id = $1
  `

  await pool.query(query, [artistId, campaignName])
}

/**
 * Fetches high-level Instagram outreach metrics for dashboards and CLI summaries.
 */
export async function getInstagramOutreachStats(): Promise<OutreachStats> {
  const pool = getDbPool()

  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM discovered_artists) AS "totalDiscovered",
      (SELECT COUNT(*)::int FROM discovered_artists WHERE instagram_handle IS NOT NULL AND TRIM(instagram_handle) != '') AS "totalWithInstagram",
      (SELECT COUNT(*)::int FROM discovered_artists WHERE instagram_handle IS NOT NULL AND TRIM(instagram_handle) != '' AND outreach_status = 'contacted') AS "contactedCount",
      (SELECT COUNT(*)::int FROM outreach_messages WHERE channel = 'instagram_dm' AND status = 'sent' AND (created_at >= NOW() - INTERVAL '24 hours' OR sent_at >= NOW() - INTERVAL '24 hours')) AS "sentLast24Hours"
  `

  const res = await pool.query(query)
  const row = res.rows[0]
  const totalWithInstagram = row.totalWithInstagram || 0
  const contactedCount = row.contactedCount || 0

  return {
    totalDiscovered: row.totalDiscovered || 0,
    totalWithInstagram,
    contactedCount,
    uncontactedCount: Math.max(0, totalWithInstagram - contactedCount),
    sentLast24Hours: row.sentLast24Hours || 0,
  }
}

/**
 * Counts WhatsApp messages successfully sent in the last 24 hours.
 */
export async function getWhatsAppSentCountLast24Hours(): Promise<number> {
  const pool = getDbPool()
  try {
    const res = await pool.query(
      `SELECT count(*)::int as count
       FROM outreach_messages
       WHERE channel = 'whatsapp'
         AND status = 'sent'
         AND (created_at >= NOW() - INTERVAL '24 hours' OR sent_at >= NOW() - INTERVAL '24 hours')`,
    )
    return res.rows[0]?.count || 0
  } catch (err: any) {
    console.warn('Could not query 24-hour WhatsApp sent count:', err.message)
    return 0
  }
}

export interface WhatsAppArtistRecord {
  id: number
  name: string
  businessName?: string | null
  phone: string
  whatsappNumber?: string | null
  city?: string | null
  specializations?: string | null
  serviceDisplay?: string | null
  outreachStatus: string
  lastContactedAt?: string | null
  createdAt?: string | null
}

/**
 * Retrieves all uncontacted WhatsApp artists from PostgreSQL.
 * Deduplicates against `outreach_messages` (`status = 'sent' AND channel = 'whatsapp'`).
 */
export async function getUncontactedWhatsAppArtists(options?: {
  limit?: number
}): Promise<WhatsAppArtistRecord[]> {
  const pool = getDbPool()
  const limit = options?.limit || 1000

  const query = `
    SELECT
      da.id,
      da.name,
      da.business_name AS "businessName",
      COALESCE(da.whatsapp_number, da.phone) AS phone,
      da.whatsapp_number AS "whatsappNumber",
      da.city,
      da.specializations,
      da.service_display AS "serviceDisplay",
      da.outreach_status AS "outreachStatus",
      da.last_contacted_at AS "lastContactedAt",
      da.created_at AS "createdAt"
    FROM discovered_artists da
    WHERE (da.phone IS NOT NULL OR da.whatsapp_number IS NOT NULL)
      AND TRIM(COALESCE(da.whatsapp_number, da.phone)) != ''
      AND da.outreach_status != 'contacted'
      AND NOT EXISTS (
        SELECT 1
        FROM outreach_messages om
        WHERE om.artist_id = da.id
          AND om.channel = 'whatsapp'
          AND om.status = 'sent'
      )
    ORDER BY da.id ASC
    LIMIT $1
  `

  const res = await pool.query(query, [limit * 3])

  const uniqueRecords: WhatsAppArtistRecord[] = []
  const seenPhones = new Set<string>()

  for (const row of res.rows) {
    const raw = (row.phone || '').replace(/[^\d+]/g, '').trim()
    const clean =
      raw.startsWith('91') && raw.length === 12
        ? `+${raw}`
        : raw.startsWith('+91')
          ? raw
          : `+91${raw.replace(/^0+/, '')}`
    if (!clean || seenPhones.has(clean)) continue
    seenPhones.add(clean)
    uniqueRecords.push({ ...row, phone: clean })
    if (uniqueRecords.length >= limit) break
  }

  return uniqueRecords
}

/**
 * Logs a WhatsApp outreach message record directly into PostgreSQL `outreach_messages`.
 */
export async function logWhatsAppOutreachMessage(data: {
  artistId?: number | string | null
  body: string
  status?: 'sent' | 'failed' | 'queued' | 'pending'
  campaignName?: string
  templateUsed?: string
  messageSid?: string
  errorCode?: string
  errorMessage?: string
}): Promise<number | null> {
  if (!data.artistId) return null
  const pool = getDbPool()

  const query = `
    INSERT INTO outreach_messages (
      artist_id,
      channel,
      campaign_name,
      template_used,
      body,
      status,
      sent_at,
      message_sid,
      error_code,
      error_message,
      created_at,
      updated_at
    ) VALUES (
      $1,
      'whatsapp',
      $2,
      $3,
      $4,
      $5,
      NOW(),
      $6,
      $7,
      $8,
      NOW(),
      NOW()
    )
    RETURNING id
  `

  const res = await pool.query(query, [
    data.artistId,
    data.campaignName || 'ahmedabad-wedding-artists-whatsapp-v1',
    data.templateUsed || 'custom',
    data.body,
    data.status || 'sent',
    data.messageSid || null,
    data.errorCode || null,
    data.errorMessage || null,
  ])

  return res.rows[0]?.id || null
}

export interface OmnichannelStats {
  totalDiscovered: number
  whatsapp: {
    totalEligible: number
    contacted: number
    uncontacted: number
    sentLast24Hours: number
    dailyCap: number
  }
  instagram: {
    totalEligible: number
    contacted: number
    uncontacted: number
    sentLast24Hours: number
    dailyCap: number
  }
}

export async function getOmnichannelOutreachStats(): Promise<OmnichannelStats> {
  const pool = getDbPool()

  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM discovered_artists) AS "totalDiscovered",
      (SELECT COUNT(*)::int FROM discovered_artists WHERE (phone IS NOT NULL OR whatsapp_number IS NOT NULL) AND TRIM(COALESCE(whatsapp_number, phone)) != '') AS "waEligible",
      (SELECT COUNT(*)::int FROM discovered_artists WHERE (phone IS NOT NULL OR whatsapp_number IS NOT NULL) AND outreach_status = 'contacted') AS "waContacted",
      (SELECT COUNT(*)::int FROM outreach_messages WHERE channel = 'whatsapp' AND status = 'sent' AND (created_at >= NOW() - INTERVAL '24 hours' OR sent_at >= NOW() - INTERVAL '24 hours')) AS "waSent24h",
      (SELECT COUNT(*)::int FROM discovered_artists WHERE instagram_handle IS NOT NULL AND TRIM(instagram_handle) != '') AS "igEligible",
      (SELECT COUNT(*)::int FROM discovered_artists WHERE instagram_handle IS NOT NULL AND TRIM(instagram_handle) != '' AND outreach_status = 'contacted') AS "igContacted",
      (SELECT COUNT(*)::int FROM outreach_messages WHERE channel = 'instagram_dm' AND status = 'sent' AND (created_at >= NOW() - INTERVAL '24 hours' OR sent_at >= NOW() - INTERVAL '24 hours')) AS "igSent24h"
  `

  const res = await pool.query(query)
  const row = res.rows[0]

  const waEligible = row.waEligible || 0
  const waContacted = row.waContacted || 0
  const igEligible = row.igEligible || 0
  const igContacted = row.igContacted || 0

  return {
    totalDiscovered: row.totalDiscovered || 0,
    whatsapp: {
      totalEligible: waEligible,
      contacted: waContacted,
      uncontacted: Math.max(0, waEligible - waContacted),
      sentLast24Hours: row.waSent24h || 0,
      dailyCap: 50,
    },
    instagram: {
      totalEligible: igEligible,
      contacted: igContacted,
      uncontacted: Math.max(0, igEligible - igContacted),
      sentLast24Hours: row.igSent24h || 0,
      dailyCap: 20,
    },
  }
}
