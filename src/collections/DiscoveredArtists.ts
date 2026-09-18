import type { CollectionConfig } from 'payload'

const DiscoveredArtists: CollectionConfig = {
  slug: 'discovered-artists',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'serviceDisplay', 'phone', 'city', 'leadScore', 'outreachStatus', 'createdAt'],
    group: 'Outreach',
    description: 'Artists discovered from Google Maps, Instagram, Justdial, etc.',
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin' ? true : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  indexes: [
    { fields: ['source'] },
    { fields: ['leadScore'] },
    { fields: ['outreachStatus'] },
    { fields: ['phone'] },
    { fields: ['instagramHandle'] },
    { fields: ['city'] },
    { fields: ['createdAt'] },
  ],
  fields: [
    // --- Identity ---
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
    },
    {
      name: 'businessName',
      type: 'text',
      admin: { description: 'Business / studio name if different from personal name' },
    },

    // --- Source Tracking ---
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Google Maps', value: 'google_maps' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Justdial', value: 'justdial' },
        { label: 'Sulekha', value: 'sulekha' },
        { label: 'WedMeGood', value: 'wedmegood' },
        { label: 'WeddingWire', value: 'weddingwire' },
        { label: 'Manual', value: 'manual' },
        { label: 'Referral', value: 'referral' },
      ],
      index: true,
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: { description: 'URL of the original listing / profile' },
    },
    {
      name: 'sourceId',
      type: 'text',
      admin: { description: 'ID from the source platform (Google place_id, IG user id, etc.)' },
    },
    {
      name: 'scrapeJob',
      type: 'relationship',
      relationTo: 'scrape-jobs',
      required: false,
    },

    // --- Contact ---
    {
      name: 'phone',
      type: 'text',
      index: true,
      admin: { description: 'Primary phone (E.164 preferred, raw OK)' },
      access: {
        read: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'phoneVerified',
      type: 'checkbox',
      defaultValue: false,
      access: {
        read: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'email',
      type: 'email',
      access: {
        read: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      admin: { description: 'WhatsApp number if different from phone' },
      access: {
        read: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'instagramHandle',
      type: 'text',
      index: true,
      admin: { description: 'Instagram @handle (with or without @)' },
    },
    {
      name: 'instagramProfileUrl',
      type: 'text',
      admin: { description: 'Full Instagram profile URL' },
    },
    {
      name: 'website',
      type: 'text',
    },

    // --- Location ---
    {
      name: 'city',
      type: 'text',
      defaultValue: 'Ahmedabad',
      index: true,
    },
    {
      name: 'area',
      type: 'text',
      admin: { description: 'Specific locality (e.g., SG Highway, Vastrapur)' },
    },
    {
      name: 'state',
      type: 'text',
      defaultValue: 'Gujarat',
    },

    // --- Service Details ---
    {
      name: 'serviceDisplay',
      type: 'text',
      admin: {
        description: 'Services summary (auto-generated)',
        hidden: true, // hide from edit form, show in list view
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            const services = data?.services
            if (Array.isArray(services) && services.length > 0) {
              return services.map((s: any) => s.name).filter(Boolean).join(', ')
            }
            return data?.specializations || ''
          },
        ],
      },
    },
    {
      name: 'services',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'services',
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
      admin: { description: 'Services offered by this artist' },
    },
    {
      name: 'specializations',
      type: 'text',
      admin: { description: 'Key specializations extracted from bio / description' },
    },
    {
      name: 'priceRange',
      type: 'select',
      options: [
        { label: 'Budget (Under ₹10K)', value: 'budget' },
        { label: 'Mid-Range (₹10K–₹50K)', value: 'mid' },
        { label: 'Premium (₹50K–₹1L)', value: 'premium' },
        { label: 'Luxury (₹1L+)', value: 'luxury' },
        { label: 'Unknown', value: 'unknown' },
      ],
      defaultValue: 'unknown',
    },

    // --- Social Proof ---
    {
      name: 'rating',
      type: 'number',
      min: 0,
      max: 5,
      admin: { description: 'Rating from the source (0–5)' },
    },
    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'followerCount',
      type: 'number',
      admin: { description: 'Instagram followers' },
    },
    {
      name: 'postCount',
      type: 'number',
    },
    {
      name: 'portfolioImages',
      type: 'array',
      fields: [
        { name: 'url', type: 'text', required: true },
        { name: 'caption', type: 'text' },
      ],
      admin: { description: 'Sample images from their public portfolio' },
    },

    // --- Lead Score ---
    {
      name: 'leadScore',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
      index: true,
      admin: { description: 'Auto-calculated lead quality score (0–100)' },
    },
    {
      name: 'leadScoreBreakdown',
      type: 'json',
      admin: { description: 'Detailed breakdown of lead score calculation' },
    },

    // --- Artistora Profile Link ---
    {
      name: 'linkedArtist',
      type: 'relationship',
      relationTo: 'artists',
      admin: { description: 'If this artist registered on Artistora, link to their profile' },
    },

    // --- Outreach ---
    {
      name: 'outreachStatus',
      type: 'select',
      defaultValue: 'new',
      index: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Replied', value: 'replied' },
        { label: 'Interested', value: 'interested' },
        { label: 'Registered', value: 'registered' },
        { label: 'Declined', value: 'declined' },
        { label: 'Blacklisted', value: 'blacklisted' },
      ],
    },
    {
      name: 'outreachAttempts',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'lastContactedAt',
      type: 'date',
    },
    {
      name: 'lastCampaign',
      type: 'text',
      admin: { description: 'Name/ID of last campaign sent to this artist' },
    },
    {
      name: 'lastTemplateUsed',
      type: 'text',
      admin: { description: 'Last message template used' },
    },
    {
      name: 'messageStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Read', value: 'read' },
        { label: 'Failed', value: 'failed' },
        { label: 'Replied', value: 'replied' },
      ],
      admin: { description: 'WhatsApp message delivery status' },
    },
    {
      name: 'campaignHistory',
      type: 'array',
      admin: { description: 'History of all campaigns sent to this artist' },
      fields: [
        { name: 'campaign', type: 'text', required: true },
        { name: 'template', type: 'text' },
        { name: 'sentAt', type: 'date', required: true },
        { name: 'status', type: 'text', defaultValue: 'sent' },
      ],
    },
    {
      name: 'repliedAt',
      type: 'date',
    },
    {
      name: 'registeredAt',
      type: 'date',
    },

    // --- Notes ---
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Admin notes about this artist' },
    },

    // --- Consent & Compliance ---
    {
      name: 'consentGiven',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Whether opt-in consent has been recorded' },
    },
    {
      name: 'doNotContact',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Set to true if artist asked to be removed' },
    },
  ],
  timestamps: true,
}

export default DiscoveredArtists
