/**
 * Instagram Outreach Messaging & Categorization Engine.
 * Generates personalized, dynamic spintax DMs with category-specific value props and registration links.
 */

export type OutreachCategory = 'mehndi' | 'nail' | 'makeup' | 'decor' | 'general'

export interface CategoryInfo {
  category: OutreachCategory
  label: string
  registrationUrl: string
}

export interface TargetArtistInfo {
  id?: number | string
  handle: string
  name?: string | null
  businessName?: string | null
  category?: string | null
  specializations?: string | null
  serviceDisplay?: string | null
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Precision Category Classifier.
 * Analyzes bio, business badge, full name, handle, and service text with strict priority ordering.
 */
export function detectCategory(
  bio = '',
  fullName = '',
  handle = '',
  serviceOrBadge = '',
): CategoryInfo {
  const combined = `${serviceOrBadge} ${bio} ${fullName} ${handle}`.toLowerCase()

  // 1. Nail Artists & Studios (check if primarily nail)
  const hasNail =
    combined.includes('nail') ||
    combined.includes('acrylic') ||
    combined.includes('gel extension') ||
    combined.includes('press on') ||
    combined.includes('manicure') ||
    combined.includes('pedicure')
  const hasMehndi =
    combined.includes('mehndi') ||
    combined.includes('mehendi') ||
    combined.includes('henna') ||
    combined.includes('heena')

  if (hasNail && !hasMehndi) {
    return {
      category: 'nail',
      label: 'Nail Artists',
      registrationUrl: 'https://www.artistora.com/register?role=artist&type=nail-artists',
    }
  }

  // 2. Mehndi / Henna Artists
  if (hasMehndi) {
    return {
      category: 'mehndi',
      label: 'Mehndi Artists',
      registrationUrl: 'https://www.artistora.com/register?role=artist&type=mehndi-artists',
    }
  }

  // 3. Nail Artists fallback
  if (hasNail) {
    return {
      category: 'nail',
      label: 'Nail Artists',
      registrationUrl: 'https://www.artistora.com/register?role=artist&type=nail-artists',
    }
  }

  // 4. Decor & Event Planners
  if (
    combined.includes('decor') ||
    combined.includes('decoration') ||
    combined.includes('planner') ||
    combined.includes('planning') ||
    combined.includes('mandap') ||
    combined.includes('stage') ||
    combined.includes('florist') ||
    combined.includes('balloon') ||
    combined.includes('tent house') ||
    (combined.includes('event') &&
      !combined.includes('makeup') &&
      !combined.includes('make-up') &&
      !combined.includes('makeover'))
  ) {
    return {
      category: 'decor',
      label: 'Decor & Event Planners',
      registrationUrl: 'https://www.artistora.com/register?role=artist&type=decor-event-planners',
    }
  }

  // 5. Makeup & Hair Artists
  if (
    combined.includes('makeup') ||
    combined.includes('make up') ||
    combined.includes('make-up') ||
    combined.includes('mua') ||
    combined.includes('makeover') ||
    combined.includes('beauty') ||
    combined.includes('bridal') ||
    combined.includes('hairstyl') ||
    combined.includes('hair artist') ||
    combined.includes('salon') ||
    combined.includes('cosmetic') ||
    combined.includes('glam')
  ) {
    return {
      category: 'makeup',
      label: 'Makeup Artists',
      registrationUrl: 'https://www.artistora.com/register?role=artist&type=makeup-artists',
    }
  }

  return {
    category: 'general',
    label: 'Wedding Artists & Vendors',
    registrationUrl: 'https://www.artistora.com/register?role=artist',
  }
}

/**
 * Cleans and formats an artist's name for natural, friendly greetings.
 * Strips stats, business keywords, city names, and emojis, while preserving personal or studio identity.
 */
export function cleanArtistNameForGreeting(rawName: string = '', handle: string = ''): string {
  let name = (rawName || '').trim()

  // Normalize smart quotes
  name = name.replace(/[‘’‛]/g, "'")

  // Strict blacklist: reject stats, numbers, or UI action words
  if (
    !name ||
    /\b\d+[\d,.]*\s*(posts?|followers?|following)\b/i.test(name) ||
    /^(posts?|followers?|following|follow|following|message|contact|edit profile|share)$/i.test(
      name,
    ) ||
    /^\d+[\d,.]*$/.test(name)
  ) {
    name = ''
  }

  // Split on delimiters: |, •, -, –, —, :, (, )
  if (name) {
    name = name.split(/[|•\-–—:,()]/)[0].trim()
  }

  // Handle 'by <name>' e.g. 'Mehndi by Uma' -> 'Uma', 'Makeover by Hetal' -> 'Hetal'
  const byMatch = name.match(/\b(?:by|from)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i)
  if (byMatch && byMatch[1]) {
    name = byMatch[1].trim()
  }

  // Strip compound phrases like 'Mehandi And Nail Art', 'Mehndi & Nails', 'Bridal Art and Class'
  name = name.replace(
    /\b(?:and|&|\+)\s*(?:nail\s*art|mehndi\s*art|mehandi\s*art|classes?|class|academy|studio|salon)\b/gi,
    '',
  )

  // Remove common city, role, and business keywords as whole words
  name = name
    .replace(
      /\b(in\s+ahmedabad|ahmedabad|gujarat|india|professional|bridal|specialist|artist|art|makeovers?|makeup|mehandi|mehndi|events?|planners?|classes?|class|academy|official|creations?)\b/gi,
      '',
    )
    .trim()

  // Strip trailing possessive 's or ' (e.g., "Shweta Shah's" -> "Shweta Shah", "Ruta's" -> "Ruta")
  name = name.replace(/['’]s\b/gi, '').trim()

  // Clean punctuation, extra symbols, dangling &, +, and, by
  name = name
    .replace(/[^\w\s'&]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  name = name.replace(/^[\s&+\-]+|[\s&+\-]+$/g, '').trim()
  name = name.replace(/\b(?:by|and|the|from)$/gi, '').trim()

  // If empty, too short, or only digits, derive from handle
  if (!name || name.length < 2 || /^\d+$/.test(name)) {
    let handleClean = handle.replace(/^@/, '').toLowerCase()
    handleClean = handleClean.replace(
      /(?:mehndi|mehendi|henna|makeup|makeover|nail|nails|nailart|art|artist|studio|salon|official|classes|ahmedabad|amd)\b/gi,
      '',
    )
    handleClean = handleClean.replace(/\b(?:by|from|the)\b/gi, '')
    handleClean = handleClean.replace(/^[_\d.]+|[_\d.]+$/g, '')
    const handleParts = handleClean.split(/[._]+/).filter((p) => p.length >= 2 && !/^\d+$/.test(p))
    const firstWord = handleParts[0] || ''
    if (firstWord) {
      name = firstWord
    }
  }

  if (!name || name.length < 2) {
    name = 'Artist'
  }

  // Capitalize words. If second word is '&' or 'and', or starts with 'The', include third word
  let words = name.split(' ').filter(Boolean)
  if (
    words.length >= 3 &&
    (words[1] === '&' || words[1].toLowerCase() === 'and' || words[0].toLowerCase() === 'the')
  ) {
    words = words.slice(0, 3)
  } else {
    words = words.slice(0, 2)
  }

  const formatted = words
    .map((w) => {
      if (w === '&' || w.toLowerCase() === 'and') return '&'
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
    .replace(/^[\s&+\-]+|[\s&+\-]+$/g, '')
    .trim()

  return formatted || 'Artist'
}

/**
 * Dynamic Spintax Message Generator.
 * Generates personalized, high-converting copy specifically tailored to the artist's category.
 */
export function generateDynamicInstagramMessage(artist: TargetArtistInfo): string {
  const cleanName = cleanArtistNameForGreeting(artist.name || '', artist.handle)

  const categoryInfo = detectCategory(
    '',
    artist.name || '',
    artist.handle,
    `${artist.serviceDisplay || ''} ${artist.specializations || ''} ${artist.category || ''}`,
  )
  const cat = categoryInfo.category
  const regUrl = categoryInfo.registrationUrl

  const greetings = [
    `Hey ${cleanName}! 👋`,
    `Hello ${cleanName}! ✨`,
    `Kem cho ${cleanName}! 🙏`,
    `Hi ${cleanName}! 🌸`,
  ]

  let compliments: string[] = []
  let valueProps: string[] = []
  let ctas: string[] = []

  if (cat === 'mehndi') {
    compliments = [
      `Loved your intricate bridal mehndi work and pattern designs on your feed.`,
      `Your bridal mehndi designs and intricate henna artistry in Ahmedabad look really stunning!`,
      `Was checking out your recent bridal mehndi work in Ahmedabad — beautiful craftsmanship!`,
      `Really impressed by the detailing in your bridal mehndi and bridal henna patterns!`,
    ]

    valueProps = [
      `We are onboarding select Ahmedabad mehndi artists for the upcoming wedding season with 100% direct client bookings and 0% commission.`,
      `You get a dedicated verified profile where you can showcase your bridal mehndi packages, upload your designs, and get direct inquiries from local brides.`,
      `We feature verified Ahmedabad creators so brides and families can discover your original mehndi patterns and connect with you directly.`,
    ]

    ctas = [
      `🎨 Create your free artist profile in 2 mins, upload your mehndi designs, and start receiving direct inquiries:\n👉 ${regUrl}\n🔗 Or visit @artistoraofficial and tap the registration link in our bio!`,
      `✨ Create your free creator profile, showcase your portfolio & bridal packages, and get discovered by local brides with 0% commission:\n👉 ${regUrl}\n🔗 Or check the bio link at @artistoraofficial!`,
      `🌿 We'd love to feature your bridal mehndi portfolio on Artistora — create your free profile and start getting direct client leads:\n👉 ${regUrl}\n🔗 Or tap @artistoraofficial to get started via our bio link!`,
    ]
  } else if (cat === 'nail') {
    compliments = [
      `Loved your creative nail art designs, gel extensions, and styling on your feed!`,
      `Your nail styling, acrylic work, and bridal nail art finishes in Ahmedabad look stunning!`,
      `Was checking out your nail art and extension portfolio in Ahmedabad — gorgeous craftsmanship!`,
      `Really impressed by your creative nail designs and bridal nail styling!`,
    ]

    valueProps = [
      `We are onboarding select Ahmedabad nail artists & studios for upcoming wedding bookings with 100% direct client contact and 0% commission.`,
      `You get a dedicated verified profile page where you can upload your nail art photos, showcase your pricing packages, and receive direct inquiries.`,
      `We feature verified local creators so clients and brides across Ahmedabad can browse your designs and reach out to you directly.`,
    ]

    ctas = [
      `🎨 Create your free artist profile in 2 mins, upload your nail designs, and start receiving direct inquiries:\n👉 ${regUrl}\n🔗 Or visit @artistoraofficial and tap the registration link in our bio!`,
      `✨ Create your free creator profile, showcase your portfolio & packages, and get discovered by local clients with 0% commission:\n👉 ${regUrl}\n🔗 Or check the bio link at @artistoraofficial!`,
      `💅 We'd love to feature your nail art portfolio on Artistora — create your free profile and start getting direct client leads:\n👉 ${regUrl}\n🔗 Or tap @artistoraofficial to get started via our bio link!`,
    ]
  } else if (cat === 'makeup') {
    compliments = [
      `Loved your recent bridal makeover and glam styling looks in Ahmedabad!`,
      `Your bridal makeup portfolio, HD glam finishes, and hair styling look absolutely amazing!`,
      `Was admiring your bridal makeup work across Ahmedabad weddings — stunning styling!`,
      `Really impressed by your bridal makeover artistry and party glam looks!`,
    ]

    valueProps = [
      `We are onboarding select Ahmedabad makeup artists for upcoming wedding season bookings with 100% direct client contact and 0% commission.`,
      `You get a dedicated verified profile page where you can upload your bridal makeover looks, showcase your packages, and receive direct client inquiries.`,
      `We feature verified local creators so brides and event clients across Ahmedabad can browse your portfolio and book you directly.`,
    ]

    ctas = [
      `🎨 Create your free artist profile in 2 mins, upload your makeover looks, and start receiving direct inquiries:\n👉 ${regUrl}\n🔗 Or visit @artistoraofficial and tap the registration link in our bio!`,
      `✨ Create your free creator profile, showcase your bridal & party glam packages, and get discovered with 0% commission:\n👉 ${regUrl}\n🔗 Or check the bio link at @artistoraofficial!`,
      `💄 We'd love to feature your makeup portfolio on Artistora — create your free profile and start getting direct client leads:\n👉 ${regUrl}\n🔗 Or tap @artistoraofficial to get started via our bio link!`,
    ]
  } else if (cat === 'decor') {
    compliments = [
      `Loved your wedding decor setups, mandap concepts, and event planning work in Ahmedabad!`,
      `Your wedding themes, stage decor, and event setups look truly magnificent!`,
      `Was admiring your event planning and wedding decor projects across Ahmedabad venues!`,
      `Really impressed by the creativity and detailing in your event setups and mandap decor!`,
    ]

    valueProps = [
      `We are onboarding select Ahmedabad decor & event planners for upcoming wedding season bookings with 100% direct client contact and 0% commission.`,
      `You get a dedicated verified profile where you can showcase your mandap concepts, theme setups, and receive direct event inquiries.`,
      `We feature verified local planners so couples and event organizers across Ahmedabad can browse your decor setups and contact you directly.`,
    ]

    ctas = [
      `🎨 Create your free planner profile in 2 mins, upload your decor themes, and start receiving direct inquiries:\n👉 ${regUrl}\n🔗 Or visit @artistoraofficial and tap the registration link in our bio!`,
      `✨ Create your free profile, showcase your decor packages, and get discovered by event clients with 0% commission:\n👉 ${regUrl}\n🔗 Or check the bio link at @artistoraofficial!`,
      `🏛️ We'd love to feature your decor & event portfolio on Artistora — create your free profile and start getting direct client leads:\n👉 ${regUrl}\n🔗 Or tap @artistoraofficial to get started via our bio link!`,
    ]
  } else {
    compliments = [
      `Loved your recent wedding work and event portfolio in Ahmedabad!`,
      `Your wedding work and creativity across Ahmedabad events look really wonderful!`,
      `Was admiring your wedding portfolio and event work in Ahmedabad!`,
    ]

    valueProps = [
      `We are onboarding select Ahmedabad wedding & event artists for upcoming bookings with 100% direct client contact and 0% commission.`,
      `You get a dedicated verified profile where you can showcase your work, package pricing, and receive direct client inquiries.`,
      `We feature verified local creators so clients across Ahmedabad can discover your portfolio and connect with you directly.`,
    ]

    ctas = [
      `🎨 Create your free artist profile in 2 mins, upload your portfolio, and start receiving direct inquiries:\n👉 ${regUrl}\n🔗 Or visit @artistoraofficial and tap the registration link in our bio!`,
      `✨ Create your free creator profile, showcase your packages, and get discovered with 0% commission:\n👉 ${regUrl}\n🔗 Or check the bio link at @artistoraofficial!`,
    ]
  }

  const intros = [
    `We run Artistora (artistora.com) — Ahmedabad's dedicated marketplace where brides and clients discover and book verified local artists directly.`,
    `We're building Artistora — a curated platform connecting Ahmedabad brides and event planners directly with top local artists & studios.`,
    `We're from Artistora, Ahmedabad's verified artist community where creators showcase their work and get direct client bookings.`,
  ]

  return `${pickRandom(greetings)} ${pickRandom(compliments)}\n\n${pickRandom(intros)} ${pickRandom(valueProps)}\n\n${pickRandom(ctas)}`
}
