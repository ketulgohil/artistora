import type { TemplateVariables } from '../types'

export interface MessageTemplate {
  id: string
  name: string
  language: 'en' | 'hi' | 'gu'
  channel: 'whatsapp' | 'instagram_dm' | 'email'
  body: string
  variables: string[]
}

// Variable interpolation: replaces {{variableName}} with value
export function renderTemplate(template: string, vars: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key]
    if (value === undefined || value === null || value === '') return match
    return String(value)
  })
}

// All message templates
export const templates: Record<string, MessageTemplate> = {
  warm_intro_en: {
    id: 'warm_intro_en',
    name: 'Warm Intro (English)',
    language: 'en',
    channel: 'whatsapp',
    body: `Hi {{artistName}}! 👋

I'm reaching out from Artistora (artistora.com) — we're building Ahmedabad's #1 platform for verified artists like you.

We noticed your amazing work in {{services}} and think you'd be a great fit for our marketplace.

✅ Free artist profile with portfolio
✅ Direct bookings from customers
✅ Verified badge for trust

Would you like to join? It's completely free to get started!

Best,
Team Artistora`,
    variables: ['artistName', 'services'],
  },

  warm_intro_hi: {
    id: 'warm_intro_hi',
    name: 'Warm Intro (Hindi)',
    language: 'hi',
    channel: 'whatsapp',
    body: `नमस्ते {{artistName}} जी! 🙏

मैं Artistora (artistora.com) से बात कर रहा हूँ — हम अहमदाबाद की सबसे बड़ी Verified Artist Marketplace बना रहे हैं।

आपके {{services}} में काम को देखकर लगा कि आप हमारे प्लेटफॉर्म के लिए एक बेहतरीन Artist हो सकते हैं।

✅ Free Artist Profile + Portfolio
✅ Direct Customer Bookings
✅ Verified Badge

क्या आप जुड़ना चाहेंगे? बिल्कुल Free है!

धन्यवाद,
Team Artistora`,
    variables: ['artistName', 'services'],
  },

  social_proof: {
    id: 'social_proof',
    name: 'Social Proof',
    language: 'en',
    channel: 'whatsapp',
    body: `Hi {{artistName}}! 👋

Quick update: {{totalArtists}} artists from Ahmedabad have already joined Artistora and are getting real bookings!

Artists like you in {{services}} are earning an average of ₹15K-50K extra per month through our platform.

🔗 Join free: artistora.com/register

No setup fees, totally free to use.

— Team Artistora`,
    variables: ['artistName', 'totalArtists', 'services'],
  },

  event_based: {
    id: 'event_based',
    name: 'Event-Based',
    language: 'en',
    channel: 'whatsapp',
    body: `Hi {{artistName}}! 🎉

Wedding season is around the corner! 💍

We're seeing a huge demand for {{services}} artists in {{city}}. Customers are actively searching and booking through Artistora.

This is the perfect time to set up your profile and start getting leads.

🔗 artistora.com/register (Free)

Would love to have you on board!

— Team Artistora`,
    variables: ['artistName', 'services', 'city'],
  },

  portfolio_showcase: {
    id: 'portfolio_showcase',
    name: 'Portfolio Showcase (IG DM)',
    language: 'en',
    channel: 'instagram_dm',
    body: `Hey {{artistName}}! Love your work! 🔥

I'm from Artistora — we're building Ahmedabad's top artist marketplace. Think of us as a better way for clients to find and book artists like you.

We'd love to feature your portfolio on our platform:
📸 Professional profile page
📩 Direct booking requests
✅ Verified badge

It's free to join → artistora.com/register

Let me know if you'd like to know more! 😊`,
    variables: ['artistName'],
  },

  gujarati_welcome: {
    id: 'gujarati_welcome',
    name: 'Gujarati Welcome — Artist Onboarding',
    language: 'gu',
    channel: 'whatsapp',
    body: `🙏 નમસ્તે {{artistName}},

{{businessLine}}

હું Artistora (artistora.com) ટીમ વતી વાત કરી રહ્યો/રહી છું — અમે અમદાવાદની સૌથી ભરોસાપાત્ર Artist Marketplace બનાવી રહ્યા છીએ, જ્યાં ગ્રાહકો સીધા Artist ને Book કરી શકે છે.

આ પ્લેટફોર્મ પર જોડાવાથી તમને શું મળશે:

🎨 *Free Artist Profile* — તમારું Portfolio, ફોટો, ભાવ બધું એક જગ્યાએ
📩 *Direct Bookings* — ગ્રાહકો સીધા તમને Message/Call કરશે
✅ *Verified Badge* — ભરોસાની નિશાની, વધુ ગ્રાહકો મળશે
💰 *Zero Commission* — એકદમ Free!
📱 *Free Marketing* — અમારા પ્લેટફોર્મ પરથી ગ્રાહકો તમને શોધશે
🔔 *Booking Alerts* — નવા Enquiry ની તરત Notification

👉 *ફ્રીમાં જોડાઓ:* artistora.com/register

કોઈ પ્રશ્ન હોય તો અહીં Reply કરો! 😊

— Team Artistora`,
    variables: ['artistName', 'businessLine'],
  },

  gujarati_wedding_season: {
    id: 'gujarati_wedding_season',
    name: 'Gujarati Wedding Season Push',
    language: 'gu',
    channel: 'whatsapp',
    body: `🙏 નમસ્તે {{artistName}},

લગ્ન સીઝન શરૂ થવા આવી છે! 💍

Artistora (artistora.com) પર હાલમાં {{services}} માટે ગ્રાહકોની ભારે Demand છે — અમદાવાદના વિવિધ વિસ્તારોમાંથી Bookings આવી રહી છે.

{{businessLine}}

હવે Profile બનાવવાથી તમે Wedding Season માં વધુ Bookings મેળવી શકશો:

🎨 *Free Artist Profile + Portfolio*
📩 *Direct Customer Bookings*
✅ *Verified Badge*
💰 *Zero Commission — Totally Free!*

👉 *હમણાં જ જોડાઓ:* artistora.com/register

— Team Artistora`,
    variables: ['artistName', 'services', 'businessLine'],
  },

  gujarati_features: {
    id: 'gujarati_features',
    name: 'Gujarati — Platform Features Deep Dive',
    language: 'gu',
    channel: 'whatsapp',
    body: `🙏 નમસ્તે {{artistName}},

{{businessLine}}

Artistora શું છે અને તમારા માટે કેમ જરૂરી છે:

📌 *Artistora = અમદાવાદનું Artist Marketplace*

🔹 ગ્રાહકો Artistora પર આવે છે → તમારા Category માં Search કરે છે → તમારો Profile જુએ છે → Book કરે છે

🔹 તમારે કંઈ કરવાની જરૂર નથી — ગ્રાહકો જાતે તમને શોધે છે!

🔹 *Portfolio Gallery* — તમારા Best Work Upload કરો
🔹 *Pricing* — તમારા Price Set કરો (Fixed / Hourly / Package)
🔹 *Booking System* — Customer Request → તમે Accept/Reject કરો
🔹 *Reviews* — ગ્રાહકો Rating & Review આપે → Trust વધે
🔹 *Dashboard* — બધું એક જગ્યાએ જુઓ

👉 *ફ્રીમાં Register કરો:* artistora.com/register

💰 એકદમ Free!
📞 કોઈ Question હોય તો અહીં Reply કરો

— Team Artistora`,
    variables: ['artistName', 'businessLine'],
  },

  gujarati_referral: {
    id: 'gujarati_referral',
    name: 'Gujarati — Social Proof + Urgency',
    language: 'gu',
    channel: 'whatsapp',
    body: `🙏 નમસ્તે {{artistName}},

{{totalArtists}}+ Artists અમદાવાદથી Artistora સાથે જોડાઈ ચૂક્યા છે!

{{services}} ના Artists ને દર મહિને સરેરાશ ₹15,000-50,000 ના Extra Bookings મળી રહ્યા છે.

{{businessLine}}

🔹 Free Profile + Portfolio
🔹 Direct Customer Bookings
🔹 Verified Badge
🔹 Zero Commission — Always Free
🔹 No Setup Fees — Ever

👉 *હમણાં જ જોડાઓ:* artistora.com/register

⏳ Early Bird Artists ને Homepage પર Featured કરવામાં આવશે!

— Team Artistora`,
    variables: ['artistName', 'totalArtists', 'services', 'businessLine'],
  },

  re_engagement: {
    id: 're_engagement',
    name: 'Re-Engagement',
    language: 'en',
    channel: 'whatsapp',
    body: `Hi {{artistName}}! 👋

Just checking in! We reached out a while ago about Artistora — Ahmedabad's artist marketplace.

Since then, {{newStats}} new artists have joined and are getting real bookings!

Thought you might want to give it a try → artistora.com/register

Free forever, no catches! 😊

— Team Artistora`,
    variables: ['artistName', 'newStats'],
  },
}

// Get template by ID
export function getTemplate(id: string): MessageTemplate | undefined {
  return templates[id]
}

// Get all templates for a channel
export function getTemplatesForChannel(channel: 'whatsapp' | 'instagram_dm' | 'email'): MessageTemplate[] {
  return Object.values(templates).filter(t => t.channel === channel)
}

// Common variable defaults
export const defaultVariables: TemplateVariables = {
  artistName: 'Artist',
  businessName: '',
  services: 'services',
  city: 'Ahmedabad',
  area: '',
  artistoraUrl: 'https://www.artistora.com',
  portfolioUrl: 'https://www.artistora.com/register',
  rating: undefined,
  reviewCount: undefined,
  totalArtists: '180+',
  newStats: '30+',
  businessLine: '',
}
