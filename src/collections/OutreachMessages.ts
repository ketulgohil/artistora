import type { CollectionConfig } from 'payload'

const OutreachMessages: CollectionConfig = {
  slug: 'outreach-messages',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['artist', 'campaign', 'channel', 'status', 'sentAt', 'createdAt'],
    group: 'Outreach',
    description: 'Individual outreach messages sent to discovered artists',
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin' ? true : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  indexes: [
    { fields: ['artist'] },
    { fields: ['campaign'] },
    { fields: ['channel'] },
    { fields: ['status'] },
    { fields: ['sentAt'] },
    { fields: ['messageSid'] },
  ],
  fields: [
    // --- Links ---
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'discovered-artists',
      required: true,
      index: true,
    },
    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns',
      required: false,
      index: true,
    },
    {
      name: 'campaignName',
      type: 'text',
      admin: { description: 'Campaign name for manual sends (when not linked to a campaign record)' },
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

    // --- Message Content ---
    {
      name: 'templateUsed',
      type: 'select',
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
      name: 'body',
      type: 'textarea',
      required: true,
      admin: { description: 'Final rendered message body sent to the artist' },
    },
    {
      name: 'mediaUrl',
      type: 'text',
      admin: { description: 'Image / video URL sent with the message (if any)' },
    },

    // --- Status ---
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Queued', value: 'queued' },
        { label: 'Sending', value: 'sending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
        { label: 'Failed', value: 'failed' },
        { label: 'Bounced', value: 'bounced' },
      ],
    },

    // --- Timing ---
    {
      name: 'queuedAt',
      type: 'date',
    },
    {
      name: 'sentAt',
      type: 'date',
      index: true,
    },
    {
      name: 'deliveredAt',
      type: 'date',
    },
    {
      name: 'readAt',
      type: 'date',
    },
    {
      name: 'repliedAt',
      type: 'date',
    },

    // --- External IDs ---
    {
      name: 'messageSid',
      type: 'text',
      admin: { description: 'External message ID (WhatsApp message ID, IG DM id, etc.)' },
    },

    // --- Error ---
    {
      name: 'errorCode',
      type: 'text',
    },
    {
      name: 'errorMessage',
      type: 'textarea',
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
    },

    // --- Cost Tracking ---
    {
      name: 'cost',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Cost in INR (0 for free channels)' },
    },
  ],
  timestamps: true,
}

export default OutreachMessages
