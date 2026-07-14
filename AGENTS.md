# Shiva Mehndi Art — Project Reference for AI Agents

## Overview

Migrating `shivamehndiart.com` from a static Vite + React 18 SPA (Bootstrap 5, hardcoded data, SSR prerendering on Vercel) to a **Payload 3 CMS + Next.js 16 + Tailwind v4** architecture.

**Domain:** https://www.shivamehndiart.com
**Business:** Shiva Mehndi Art by Bhumi Chanpura — Premium mehndi artist in Ahmedabad, Gujarat.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| CMS | Payload 3.85.1 |
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| React | 19.2.6 |
| Database | PostgreSQL 16 (via `@payloadcms/db-postgres`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + custom CSS in `styles.css` |
| Hosting | Local dev on port 3000; prod target: Vercel |
| Image handling | Payload built-in upload (local `media` directory) |

---

## Project Structure

```
/var/www/html/shivamehndiart-v2/
├── src/
│   ├── app/
│   │   ├── (frontend)/          # Public site pages
│   │   │   ├── layout.tsx        # Root layout (Header + Footer + WhatsApp)
│   │   │   ├── styles.css        # Tailwind v4 + all custom CSS (21KB)
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── services/page.tsx
│   │   │   ├── portfolio/page.tsx
│   │   │   ├── classes/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── bridal-mehndi/page.tsx
│   │   │   ├── artist/page.tsx
│   │   │   ├── privacy-policy/page.tsx
│   │   │   ├── booking-policy/page.tsx
│   │   │   ├── thank-you/page.tsx
│   │   │   └── home-service-mehndi-in-ahmedabad/page.tsx
│   │   └── (payload)/            # Payload admin panel (auto-generated)
│   ├── collections/              # Payload collection configs
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   ├── Services.ts
│   │   ├── PortfolioCategories.ts
│   │   ├── PortfolioItems.ts
│   │   ├── Testimonials.ts
│   │   ├── FAQ.ts
│   │   ├── YouTubeVideos.ts
│   │   └── StaticPages.ts
│   ├── globals/                  # Payload global configs
│   │   ├── SiteSettings.ts
│   │   └── HeaderFooter.ts
│   ├── components/               # Shared React components
│   │   ├── Header.tsx            # Client component — nav, mobile menu
│   │   ├── Footer.tsx            # Server component
│   │   ├── WhatsAppButton.tsx    # Client component — floating WhatsApp
│   │   └── SectionHeading.tsx    # Server component — title + divider
│   ├── lib/
│   │   └── payload.ts            # Data fetching helpers
│   ├── payload.config.ts         # Payload config (collections, globals, db)
│   ├── seed.ts                   # Media + portfolio items seeder
│   └── seed-content.ts           # Services, testimonials, FAQ, YouTube seeder
├── postcss.config.mjs            # @tailwindcss/postcss plugin
├── next.config.ts                # Next.js config
├── MIGRATION-PLAN.md             # Original migration plan (9 phases)
└── AGENTS.md                     # THIS FILE
```

---

## ✅ Completed — Phases 1–5

### Phase 1: Environment Setup
- Payload 3 + Next.js 16 project initialized
- PostgreSQL database running with `DATABASE_URL`
- Dev server on `http://localhost:3000`

### Phase 2: Content Model (7 collections + 2 globals)
| Slug | Type | Key Fields |
|------|------|-----------|
| `site-settings` | Global | businessName, founderName, phone, email, address, bookingFormUrl, whatsappNumber, social URLs, SEO defaults |
| `header-footer` | Global | logo, navLinks[], footerTagline, copyrightText, footerLinks[] |
| `services` | Collection | title, slug, image→media, description, points[{point}], order |
| `portfolio-categories` | Collection | title, slug, description, order |
| `portfolio-items` | Collection | image→media, category→portfolio-categories, altText, featured, description, order |
| `testimonials` | Collection | name, text, rating (1-5), image→media, order |
| `faq` | Collection | question, answer (richText Lexical), order |
| `youtube-videos` | Collection | title, videoId, thumbnail→media, order |
| `static-pages` | Collection | title, slug, content (richText), metaTitle, metaDescription, ogImage→media |

### Phase 3: Media Upload (87 files)
- **68 portfolio images** across 9 categories (Bridal: 20, Heavy Sider: 16, Designer Bengle: 10, Engagement: 5, Legs: 5, Minimal: 5, Arabic: 3, Baby Shower: 3, Indo Arabic: 1)
- **3 featured client photos** (geetaben_rabari, kinjal_dave_and_rajal_barot, kinjal_rajpriya)
- **16 business assets** (Bhumi photo, service images, banner, OG share, favicon, avatars, divider, peacock)

### Phase 4: Admin Content
| Content | Count | Source |
|---------|-------|--------|
| Services | 3 | Bridal Mehndi, Engagement Mehndi, Baby Shower Mehndi |
| Testimonials | 3 | Urvika Parekh, Rutva Krunal Prajapati, Devsha Rathod |
| FAQ | 5 | Home service, classes, booking timing, services overview, service area |
| YouTube Videos | 3 | Lines & Humps, Easy Belt Designs, Belt Designs Part 3 |

### Phase 5: Frontend Pages (11 routes — all 200 OK)
All pages are server components that fetch data from Payload at request time. No ISR/stale-while-revalidate configured yet.

| Route | File | Notes |
|-------|------|-------|
| `/` | `page.tsx` | Hero, stats, services, gallery, testimonials, YouTube, FAQ, trust signals |
| `/services` | `services/page.tsx` | Service cards from CMS, promise grid, booking flow, FAQ |
| `/portfolio` | `portfolio/page.tsx` | Category filter tabs, image grid, fullscreen modal |
| `/classes` | `classes/page.tsx` | Topics, highlights, YouTube embeds, FAQ, timings |
| `/contact` | `contact/page.tsx` | Details, map embed, WhatsApp, booking form |
| `/bridal-mehndi` | `bridal-mehndi/page.tsx` | Static content page |
| `/artist` | `artist/page.tsx` | Bio page with Bhumi's photo |
| `/privacy-policy` | `privacy-policy/page.tsx` | Static policy page |
| `/booking-policy` | `booking-policy/page.tsx` | Static policy page |
| `/home-service-mehndi-in-ahmedabad` | `home-service-mehndi-in-ahmedabad/page.tsx` | Coverage areas, how it works |
| `/thank-you` | `thank-you/page.tsx` | Post-form submission page |

---

## 📋 Pending — Phases 6–8

### Phase 6: SEO & Schema (HIGH priority)
The old site had 9 manual schema.org builders in `src/lib/seo.js`. These need to be ported.

**Approach:**
1. Install `@payloadcms/plugin-seo` — handles basic meta fields per collection
2. Add custom schema components for:
   - `LocalBusiness` (homepage) — business name, address, phone, opening hours, geo
   - `Service` (services page) — service types, area served
   - `Course` (classes page) — course name, description, provider, offers
   - `FAQPage` (FAQ sections) — Question/Answer pairs
   - `ImageGallery` (portfolio page) — portfolio images
   - `VideoObject` (YouTube videos) — video title, description, thumbnail, upload date
   - `Person` (artist page) — founder name, description
3. Generate proper `<meta>` tags per page using Next.js `metadata` export
4. Add BreadcrumbList schema to each page
5. Create a `robots.txt` and `sitemap.xml` (Next.js built-in)
6. Ensure OG images are set per page

**Implementation:**
- Create `src/lib/schema.ts` with helper functions that return JSON-LD `<script>` strings
- Add `<script type="application/ld+json">` blocks to each page
- OR create a `Schema` component that wraps pages

**Critical:**
- FAQPage schema is restricted by Google for commercial sites — use `QAPage` or omit
- LocalBusiness + Service schema MUST be on every page for local SEO
- The old site's `src/lib/seo.js` has the exact schema builders — use as reference

### Phase 7: Booking Integration
**Current state:** Google Forms embed linked from SiteSettings (`bookingFormUrl`). This works but isn't ideal.

**Options (ask user):**
1. Keep Google Forms as-is (simplest)
2. Replace with Payload's form builder plugin (`@payloadcms/plugin-form-builder`)
3. Build a custom form with Next.js server actions

**Approach if building custom:**
- Create a `ContactForm` client component
- Use Next.js server actions to submit to a "bookings" collection in Payload
- Redirect to `/thank-you` on success
- Include fields: name, phone, email, event type, date, location, message

### Phase 8: Deployment (LOW priority unless user asks)

**Target:** Vercel (matching current hosting)

**Steps:**
1. Push to GitHub (`git@github.com:Kpgohil/shivamehndiart-v2.git`)
2. Connect Vercel project to repo
3. Configure environment variables in Vercel:
   - `PAYLOAD_SECRET`
   - `DATABASE_URL` (point to Neon/SUPABASE or Vercel Postgres)
4. Set `PAYLOAD_DISABLE_LOCAL_MODEL=true` (if needed)
5. Update `next.config.ts` for production (images domain, etc.)
6. Set up custom domain
7. Configure redirects from old site paths:
   - `/bridal-mehndi-in-ahmedabad` → `/bridal-mehndi`
   - `/mehndi-classes-in-ahmedabad` → `/classes`
   - `/cdn-cgi/:path*` → `/contact`

**Database:** Migrate from local PostgreSQL to a managed provider:
- Neon (serverless PostgreSQL, free tier)
- Supabase (PostgreSQL + auth, generous free tier)
- Vercel Postgres (native integration)

---

## 💡 Key Patterns & Conventions

### Data Fetching
All pages are `'use server'` components that import helpers from `@/lib/payload.ts`:
```ts
import { getServices, getSiteSettings, getFAQs, mediaUrl } from '@/lib/payload'
```
Helpers cache the Payload client in a module-level variable (singleton pattern).

### Image URLs
```tsx
<img src={'/api/media/file/' + media.filename} alt={media.alt} />
```

### Tailwind v4 🚨 KNOWN BUG
All **padding/margin** utility classes MUST end with `!` (e.g., `px-4!`, `py-12!`, `mb-6!`, `gap-4!`). Without the `!`, spacing classes get zeroed out by a CSS `@layer` cascade bug in Chromium. Do NOT fix with custom CSS — use Tailwind's `!` modifier.

### Buttons
Use CSS classes from `styles.css`:
- `.btn-brand` — solid brand color (#c77b44)
- `.btn-outline-brand` — outline brand color
- `.btn-outline-soft` — outline muted
- `.btn-dark-brand` — dark solid
Or use inline styles: `style={{ background: 'var(--color-brand)' }}`

### Lexical Rich Text
FAQ answers are stored as Lexical JSON. Extract plain text with:
```ts
function extractLexicalText(richText: any): string {
  if (!richText?.root) return ''
  return (richText.root.children || [])
    .map((child: any) => (child.children || []).map((c: any) => c.text || '').join(''))
    .join('\n')
}
```

### Old Site Reference
The old static site is at `/var/www/html/shivamehndiart/`. Key files:
- `src/pages/*.jsx` — page components with hardcoded content
- `src/components/*.jsx` — shared components
- `src/styles.css` — 3,129 lines of Bootstrap + custom CSS
- `src/lib/seo.js` — 9 schema builders (critical for Phase 6)
- `src/data/portfolioImages.js` — image-to-category mapping
- `src/lib/booking.js` — booking form URL
- `public/{Category}/` — portfolio image directories

---

## 🔧 Useful Commands

```bash
# Dev server
npm run dev

# Type generation (run after changing collections)
npm run generate:types

# Import map (run after adding admin components)
npm run generate:importmap

# Build for production
npm run build

# Seed content (run after fresh DB)
npx tsx src/seed.ts          # Media + portfolio items
npx tsx src/seed-content.ts  # Services, testimonials, FAQ, YouTube
```

---

## 🎨 Data Model Detail (for schema builders)

**SiteSettings (Global):**
```
businessName: "Shiva Mehndi Art"
founderName: "Bhumi Chanpura"
phone: "+91 8469662012"
email: "bhumichanpura1234@gmail.com"
address: "C-206 Neelkanth Homes, Chandlodiya, Ahmedabad 382481"
whatsappNumber: "+918469662012"
bookingFormUrl: "https://docs.google.com/forms/d/e/..."
googleMapUrl: "https://maps.google.com/..."
instagramUrl: "https://www.instagram.com/shiva_mehndiart"
facebookUrl: "https://www.facebook.com/profile.php?id=100078945406019"
youtubeUrl: "https://www.youtube.com/@ShivaMehndiArtAndClasses"
```

**Portfolio Categories:**
Arabic (id:1), Baby Shower (2), Bridal (3), Designer Bengle Length (4), Engagement (5), Heavy Sider (6), Indo Arabic (7), Legs (8), Minimal (9)
