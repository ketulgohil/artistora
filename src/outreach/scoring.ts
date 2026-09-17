import type { ScrapedArtist, LeadScoreBreakdown } from './types'

// Source quality weights (how much we trust the source)
const SOURCE_WEIGHTS: Record<string, number> = {
  google_maps: 22,    // High quality - verified business listings
  justdial: 20,       // Good quality - business directory
  sulekha: 18,        // Decent quality - service marketplace
  wedmegood: 20,      // Good quality - wedding-specific
  weddingwire: 20,    // Good quality - wedding-specific
  instagram: 15,      // Medium quality - social media (less verified)
  manual: 10,         // Low quality - unverified
  referral: 25,       // Highest quality - word of mouth
}

// Calculate lead score for a scraped artist
export function calculateLeadScore(artist: ScrapedArtist): LeadScoreBreakdown {
  const factors: string[] = []

  // 1. Source Quality (0-25)
  const sourceScore = Math.min(25, SOURCE_WEIGHTS[artist.source] || 10)
  factors.push(`Source: ${artist.source} (+${sourceScore})`)

  // 2. Rating Score (0-25)
  let ratingScore = 0
  if (artist.rating && artist.rating > 0) {
    // Map 0-5 rating to 0-25
    ratingScore = Math.round((artist.rating / 5) * 20)
    // Bonus for high review count
    if (artist.reviewCount && artist.reviewCount > 10) {
      ratingScore += 3
    }
    if (artist.reviewCount && artist.reviewCount > 50) {
      ratingScore += 2
    }
    factors.push(`Rating: ${artist.rating}/5 (${artist.reviewCount || 0} reviews) (+${ratingScore})`)
  } else {
    factors.push('No rating available (+0)')
  }
  ratingScore = Math.min(25, ratingScore)

  // 3. Contact Availability (0-25)
  let contactScore = 0
  if (artist.phone) { contactScore += 8; factors.push('Has phone (+8)') }
  if (artist.email) { contactScore += 5; factors.push('Has email (+5)') }
  if (artist.whatsappNumber || artist.phone) { contactScore += 7; factors.push('WhatsApp available (+7)') }
  if (artist.instagramHandle) { contactScore += 5; factors.push('Has Instagram (+5)') }
  contactScore = Math.min(25, contactScore)

  // 4. Social Proof (0-25)
  let socialScore = 0
  if (artist.followerCount) {
    if (artist.followerCount > 10000) { socialScore += 10; factors.push(`${artist.followerCount} followers (+10)`) }
    else if (artist.followerCount > 1000) { socialScore += 7; factors.push(`${artist.followerCount} followers (+7)`) }
    else { socialScore += 3; factors.push(`${artist.followerCount} followers (+3)`) }
  }
  if (artist.portfolioImages && artist.portfolioImages.length > 0) {
    const imgBonus = Math.min(10, artist.portfolioImages.length * 2)
    socialScore += imgBonus
    factors.push(`${artist.portfolioImages.length} portfolio images (+${imgBonus})`)
  }
  if (artist.postCount && artist.postCount > 100) {
    socialScore += 3
    factors.push(`Active poster: ${artist.postCount} posts (+3)`)
  }
  if (artist.website) {
    socialScore += 3
    factors.push('Has website (+3)')
  }
  socialScore = Math.min(25, socialScore)

  const total = sourceScore + ratingScore + contactScore + socialScore

  return {
    total,
    sourceQuality: sourceScore,
    ratingScore,
    contactAvailability: contactScore,
    socialProof: socialScore,
    factors,
  }
}

// Get outreach priority based on score
export function getOutreachPriority(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// Batch score multiple artists
export function batchScoreArtists(artists: ScrapedArtist[]): Array<ScrapedArtist & { leadScore: number; leadScoreBreakdown: LeadScoreBreakdown }> {
  return artists.map(artist => {
    const breakdown = calculateLeadScore(artist)
    return {
      ...artist,
      leadScore: breakdown.total,
      leadScoreBreakdown: breakdown,
    }
  })
}
