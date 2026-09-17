import type { CollectionConfig } from 'payload'

const ScrapeJobs: CollectionConfig = {
  slug: 'scrape-jobs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['source', 'searchQuery', 'status', 'resultsFound', 'newArtists', 'createdAt'],
    group: 'Outreach',
    description: 'Scraping jobs to discover artists from online platforms',
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin' ? true : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  indexes: [
    { fields: ['source'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ],
  fields: [
    // --- Source ---
    {
      name: 'source',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Google Maps', value: 'google_maps' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Justdial', value: 'justdial' },
        { label: 'Sulekha', value: 'sulekha' },
        { label: 'WedMeGood', value: 'wedmegood' },
        { label: 'WeddingWire', value: 'weddingwire' },
      ],
    },

    // --- Search ---
    {
      name: 'searchQuery',
      type: 'text',
      required: true,
      admin: { description: 'The search term used (e.g., "mehndi artist ahmedabad")' },
    },
    {
      name: 'searchCity',
      type: 'text',
      defaultValue: 'Ahmedabad',
    },
    {
      name: 'searchCategory',
      type: 'text',
      admin: { description: 'Service category filter applied' },
    },
    {
      name: 'maxResults',
      type: 'number',
      defaultValue: 50,
      min: 1,
      max: 500,
    },

    // --- Status ---
    {
      name: 'status',
      type: 'select',
      defaultValue: 'queued',
      index: true,
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'startedAt',
      type: 'date',
    },
    {
      name: 'completedAt',
      type: 'date',
    },
    {
      name: 'duration',
      type: 'number',
      admin: { description: 'Duration in seconds' },
    },

    // --- Results ---
    {
      name: 'resultsFound',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'newArtists',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Artists created (not duplicates)' },
    },
    {
      name: 'duplicatesSkipped',
      type: 'number',
      defaultValue: 0,
    },

    // --- Raw Data ---
    {
      name: 'rawResults',
      type: 'json',
      admin: { description: 'Raw scraped data (stored temporarily for debugging)' },
    },

    // --- Error ---
    {
      name: 'errorMessage',
      type: 'textarea',
    },
    {
      name: 'errorLog',
      type: 'json',
      admin: { description: 'Detailed error log array' },
    },

    // --- Triggered by ---
    {
      name: 'triggeredBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
    },
  ],
  timestamps: true,
}

export default ScrapeJobs
