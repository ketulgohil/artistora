import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
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
      collections: { media: {} },
    })
  : null

const dbUrl = process.env.DATABASE_URL || ''
const isRemoteDb =
  dbUrl.includes('sslmode=') ||
  dbUrl.includes('supabase.com') ||
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('pooler') ||
  dbUrl.includes('amazonaws.com')

// node-postgres lets connection-string options override the explicit `ssl`
// object. Remove sslmode so the remote-db TLS settings below are authoritative
// (Supabase's pooler certificate is not trusted by the local Node CA bundle).
const connectionString = (() => {
  if (!isRemoteDb || !dbUrl) return dbUrl

  try {
    const url = new URL(dbUrl)
    url.searchParams.delete('sslmode')
    return url.toString()
  } catch {
    return dbUrl
  }
})()

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
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
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
    },
  }),
  sharp,
  plugins: s3Plugin ? [s3Plugin] : [],
})
