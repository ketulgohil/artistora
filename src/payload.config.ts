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
import { SiteSettings } from './globals/SiteSettings'
import { HeaderFooter } from './globals/HeaderFooter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  ],
  globals: [SiteSettings, HeaderFooter],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
