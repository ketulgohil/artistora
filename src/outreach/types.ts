// Service categories for artists in Ahmedabad
export type ServiceCategory = 
  | 'mehndi' 
  | 'photography' 
  | 'makeup' 
  | 'decor' 
  | 'music' 
  | 'dj' 
  | 'videography' 
  | 'anchoring' 
  | 'catering' 
  | 'dance' 
  | 'other'

export type ScrapingSource = 
  | 'google_maps' 
  | 'instagram' 
  | 'justdial' 
  | 'sulekha' 
  | 'wedmegood' 
  | 'weddingwire'

export type OutreachChannel = 'whatsapp' | 'instagram_dm' | 'email' | 'sms'

export type OutreachStatus = 
  | 'new' 
  | 'contacted' 
  | 'replied' 
  | 'interested' 
  | 'registered' 
  | 'declined' 
  | 'blacklisted'

export type CampaignStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'cancelled'

export type MessageStatus = 
  | 'pending' 
  | 'queued' 
  | 'sending' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'replied' 
  | 'failed' 
  | 'bounced'

export type ScrapeJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type PriceRange = 'budget' | 'mid' | 'premium' | 'luxury' | 'unknown'

// Raw scraped artist data before scoring
export interface ScrapedArtist {
  name: string
  businessName?: string
  source: ScrapingSource
  sourceUrl?: string
  sourceId?: string
  phone?: string
  email?: string
  whatsappNumber?: string
  instagramHandle?: string
  instagramProfileUrl?: string
  website?: string
  city?: string
  area?: string
  state?: string
  services?: Array<{ name: string; category?: ServiceCategory }>
  specializations?: string
  priceRange?: PriceRange
  rating?: number
  reviewCount?: number
  followerCount?: number
  postCount?: number
  portfolioImages?: Array<{ url: string; caption?: string }>
}

// Lead score breakdown
export interface LeadScoreBreakdown {
  total: number
  sourceQuality: number      // 0-25: based on source platform reliability
  ratingScore: number        // 0-25: based on Google/Justdial ratings
  contactAvailability: number // 0-25: phone + email + WhatsApp + IG
  socialProof: number        // 0-25: followers, reviews, portfolio
  factors: string[]          // human-readable explanation of score
}

// Scraper interface
export interface Scraper {
  source: ScrapingSource
  scrape(params: ScrapeParams): Promise<ScrapedArtist[]>
}

export interface ScrapeParams {
  query: string
  city?: string
  category?: ServiceCategory
  maxResults?: number
  jobId?: string
}

// WhatsApp message options
export interface WhatsAppMessage {
  to: string           // phone number in E.164 or with +
  body: string
  mediaUrl?: string
}

// Instagram DM options
export interface InstagramDM {
  username: string     // without @
  message: string
  mediaUrl?: string
}

// Campaign configuration for sending
export interface CampaignConfig {
  campaignId: string
  channel: OutreachChannel
  template: string
  customTemplateBody?: string
  artistIds: string[]
  delayBetweenMessages: number  // seconds
  maxRecipients: number
}

// Template variables for message personalization
export interface TemplateVariables {
  artistName: string
  businessName?: string
  services?: string
  city?: string
  area?: string
  artistoraUrl?: string
  portfolioUrl?: string
  rating?: number
  reviewCount?: number
  [key: string]: string | number | undefined
}
