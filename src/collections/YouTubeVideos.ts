import type { CollectionConfig } from 'payload'

export const YouTubeVideos: CollectionConfig = {
  slug: 'youtube-videos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'createdAt'],
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'videoId',
      type: 'text',
      required: true,
      label: 'YouTube Video ID',
      admin: {
        description: 'The YouTube video ID (e.g., dQw4w9WgXcQ)',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
