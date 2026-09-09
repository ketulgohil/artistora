import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { Resend } from 'resend'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { PrivateMedia } from './collections/PrivateMedia'
import { Services } from './collections/Services'
import { PortfolioCategories } from './collections/PortfolioCategories'
import { PortfolioItems } from './collections/PortfolioItems'
import { Testimonials } from './collections/Testimonials'
import { FAQ } from './collections/FAQ'
import { YouTubeVideos } from './collections/YouTubeVideos'
import { StaticPages } from './collections/StaticPages'
import { Artists } from './collections/Artists'
import { Leads } from './collections/Leads'
import { Quotes } from './collections/Quotes'
import { Bookings } from './collections/Bookings'
import { Reviews } from './collections/Reviews'
import { SiteSettings } from './globals/SiteSettings'
import { HeaderFooter } from './globals/HeaderFooter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// S3 is opt-in. Payload disables local media when this plugin is enabled, so
// an existing local media directory would otherwise return 500 for files that
// have not been uploaded to the remote bucket yet.
const useS3 = process.env.PAYLOAD_S3_ENABLED === 'true'
const s3Plugin = useS3
  ? (await import('@payloadcms/storage-s3')).s3Storage({
      bucket: process.env.PAYLOAD_S3_BUCKET || '',
      config: {
        endpoint: process.env.PAYLOAD_S3_ENDPOINT || '',
        region: process.env.PAYLOAD_S3_REGION || 'us-east-1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.PAYLOAD_S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.PAYLOAD_S3_SECRET_ACCESS_KEY || '',
        },
      },
      collections: {
        media: {},
        'private-media': {},
      },
    })
  : null

const dbUrl = process.env.DATABASE_URL || ''
const isRemoteDb =
  dbUrl.includes('sslmode=') ||
  dbUrl.includes('supabase.com') ||
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('pooler') ||
  dbUrl.includes('amazonaws.com')

// neon.tech pooler uses session mode with a generous limit; no need to strip sslmode
const connectionString = dbUrl

const isProd = process.env.NODE_ENV === 'production'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Artistora <hello@artistora.com>'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistora.com',
  email: ({ payload }) => ({
    name: 'resend',
    defaultFromAddress: FROM_EMAIL,
    defaultFromName: 'Artistora',
    sendEmail: async (message) => {
      let from: string
      if (typeof message.from === 'string') {
        from = message.from
      } else if (message.from && 'address' in message.from) {
        from = message.from.name
          ? `${message.from.name} <${message.from.address}>`
          : message.from.address
      } else {
        from = FROM_EMAIL
      }
      const to = Array.isArray(message.to)
        ? message.to.map((a: any) => (typeof a === 'string' ? a : a.address)).join(',')
        : typeof message.to === 'string'
          ? message.to
          : (message.to as any)?.address || ''
      return resend.emails.send({
        from,
        to,
        subject: message.subject || '',
        html: typeof message.html === 'string' ? message.html : '',
        text: typeof message.text === 'string' ? message.text : undefined,
      })
    },
  }),
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Disable GraphQL playground in production
    meta: {
      titleSuffix: ' — Artistora CMS',
      description: 'Artistora Artist Marketplace CMS',
    },
  },
  collections: [
    Users,
    Media,
    PrivateMedia,
    Services,
    PortfolioCategories,
    PortfolioItems,
    Testimonials,
    FAQ,
    YouTubeVideos,
    StaticPages,
    Artists,
    Leads,
    Quotes,
    Bookings,
    Reviews,
  ],
  globals: [SiteSettings, HeaderFooter],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Only disable TLS verification for local development
      ssl: isRemoteDb && isProd
        ? { rejectUnauthorized: true }
        : isRemoteDb
          ? { rejectUnauthorized: false }
          : false,
    },
  }),
  sharp,
  plugins: s3Plugin ? [s3Plugin] : [],
  // Security: disable GraphQL in production unless explicitly enabled
  graphQL: isProd ? { disablePlaygroundInProduction: true, disableIntrospectionInProduction: true } : {},
})
