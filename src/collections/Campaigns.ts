import type { CollectionConfig } from 'payload'

const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'channel', 'status', 'totalRecipients', 'sentCount', 'createdAt'],
    group: 'Outreach',
    description: 'Outreach campaigns to contact discovered artists',
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin' ? true : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  indexes: [
    { fields: ['status'] },
    { fields: ['channel'] },
    { fields: ['template'] },
  ],
  fields: [
    // --- Identity ---
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Internal campaign name (e.g., "Mehndi Artists Q1 2026")' },
    },
    {
      name: 'description',
      type: 'textarea',
    },

    // --- Channel ---
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Instagram DM', value: 'instagram_dm' },
        { label: 'Email', value: 'email' },
        { label: 'SMS', value: 'sms' },
      ],
    },

    // --- Template ---
    {
      name: 'template',
      type: 'select',
      required: true,
      options: [
        { label: 'Warm Intro (English)', value: 'warm_intro_en' },
        { label: 'Warm Intro (Hindi)', value: 'warm_intro_hi' },
        { label: 'Social Proof', value: 'social_proof' },
        { label: 'Event-Based', value: 'event_based' },
        { label: 'Portfolio Showcase (IG DM)', value: 'portfolio_showcase' },
        { label: 'Gujarati Welcome', value: 'gujarati_welcome' },
        { label: 'Re-Engagement', value: 're_engagement' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'customTemplateBody',
      type: 'textarea',
      admin: {
        condition: (data) => data.template === 'custom',
        description: 'Custom message body. Use {{artistName}}, {{businessName}}, {{services}}, {{city}} as placeholders.',
      },
    },

    // --- Target Filters ---
    {
      name: 'targetFilters',
      type: 'group',
      fields: [
        {
          name: 'sources',
          type: 'array',
          fields: [
            {
              name: 'source',
              type: 'select',
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
            },
          ],
          admin: { description: 'Filter by discovery source (leave empty for all)' },
        },
        {
          name: 'minLeadScore',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 100,
        },
        {
          name: 'maxLeadScore',
          type: 'number',
          defaultValue: 100,
          min: 0,
          max: 100,
        },
        {
          name: 'serviceCategories',
          type: 'array',
          fields: [
            { name: 'category', type: 'relationship', relationTo: 'services' },
          ],
        },
        {
          name: 'cities',
          type: 'array',
          fields: [
            { name: 'city', type: 'text' },
          ],
        },
      ],
    },

    // --- Limits ---
    {
      name: 'maxRecipients',
      type: 'number',
      defaultValue: 50,
      min: 1,
      max: 500,
      admin: { description: 'Max artists to contact in this campaign (safety limit)' },
    },
    {
      name: 'delayBetweenMessages',
      type: 'number',
      defaultValue: 120,
      min: 30,
      admin: { description: 'Seconds between each message (rate limit protection)' },
    },

    // --- Status ---
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Running', value: 'running' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'scheduledAt',
      type: 'date',
      admin: { description: 'When to start the campaign' },
    },
    {
      name: 'startedAt',
      type: 'date',
    },
    {
      name: 'completedAt',
      type: 'date',
    },

    // --- Stats (computed) ---
    {
      name: 'totalRecipients',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'sentCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'deliveredCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'readCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'replyCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'conversionCount',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Artists who registered after this campaign' },
    },
    {
      name: 'errorCount',
      type: 'number',
      defaultValue: 0,
    },

    // --- Created by ---
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
  timestamps: true,
}

export default Campaigns
