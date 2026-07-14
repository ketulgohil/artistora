# Shiva Mehndi Art — Migration Plan

**Source:** `/var/www/html/shivamehndiart` (Vite + React 18 SPA)
**Target:** `/var/www/html/shivamehndiart-v2` (Next.js 16 + Payload 3.85 + React 19)

---

## Current Site Overview

| Aspect | Source |
|--------|--------|
| **Stack** | Vite + React 18 SPA, React Router, Bootstrap 5 |
| **Data** | Hardcoded in components |
| **Media** | ~75+ images in `/public/{Category}/` folders |
| **SEO** | Manual schema.org markup in `src/lib/seo.js` |
| **Deployment** | Vercel with SSR prerendering |
| **Booking** | Google Forms embed |
| **Business** | Shiva Mehndi Art | Founder: Bhumi Chanpura | Ahmedabad, Gujarat |
| **Domain** | https://www.shivamehndiart.com |

---

## Page Routes

| Route | Component | Type |
|-------|-----------|------|
| `/` | HomePage | Landing with stats, services preview, gallery, FAQ, YouTube |
| `/services` | ServicesPage | Service cards, booking flow, extras |
| `/bridal-mehndi` | BridalMehndiPage | Dedicated bridal service page |
| `/classes` | ClassesPage | Mehndi classes info |
| `/home-service-mehndi-in-ahmedabad` | HomeServiceMehndiAhmedabadPage | Home service page |
| `/artist` | ArtistPage | Artist profile (Bhumi Chanpura) |
| `/portfolio` | PortfolioPage | Filterable gallery with 8 categories |
| `/contact` | ContactPage | Contact info + Google Form embed + map |
| `/privacy-policy` | PrivacyPolicyPage | Static policy content |
| `/booking-policy` | BookingPolicyPage | Static policy content |
| `/thank-you` | ThankYouPage | Post-booking confirmation |

---

## Payload Content Model

### Globals

#### `SiteSettings` (business info + SEO defaults)
- Business name, alternate name
- Founder name, phone, email
- Address (street, city, region, postal code, country)
- Area served, service types
- Social links (Instagram, Facebook, YouTube, Google Maps)
- Default OG image
- Site description
- Aggregate rating (value, count)

#### `Header`
- Logo image
- Navigation links (label + internal route)

#### `Footer`
- Logo image
- Tagline/description
- Popular bookings links
- Trust/policy links
- Social links

### Collections

#### `Services`
- Slug (unique)
- Title
- Subtitle / tagline
- Description (rich text or plain)
- Image (upload, relation to media)
- Highlights / key points (array of text)
- Extras / add-ons (array of text)
- Booking steps (array of text)
- Promise points (array of objects: title + text)
- FAQ items (array of objects: question + answer, relationship or embedded)
- YouTube videos (array of objects: videoId, title, uploadDate)
- Testimonials (array of objects: name, quote, rating — or relationship to Testimonials)
- SEO meta (title, description, image) — via plugin-seo
- Status (draft/published)

Seeded services: Bridal Mehndi, Engagement Mehndi, Baby Shower Mehndi, Mehndi Classes, Home Service

#### `PortfolioCategories`
- Slug (unique)
- Title (e.g. "Bridal", "Arabic", "Heavy Sider")
- Sort order

#### `Portfolio`
- Image (upload, relation to media) — **required**
- Category (relationship to PortfolioCategories)
- Title (auto-generated from filename or custom)
- Alt text
- Featured (boolean) — for featured/hero images
- Caption (optional)
- Sort order

#### `Testimonials`
- Author name
- Quote / review body
- Rating (1-5)
- Source (Google, direct, etc.)
- Featured (boolean)

#### `YouTubeVideos`
- YouTube video ID
- Title
- Description
- Upload date
- Related service (relationship to Services, optional)

#### `FAQ`
- Question
- Answer (rich text)
- Related page/service (optional, for filtering)

#### `StaticPages` (for privacy-policy, booking-policy, thank-you)
- Slug (unique)
- Title
- Content (rich text)
- SEO meta

---

## Media Migration

### Source structure
```
public/
├── Bridal/        ~20 images (JPG/HEIC + webp)
├── Arabic/        ~3 images
├── Babyshower/    ~3 images
├── Designer_Bengle_Length/  ~10 images
├── Engagement/    ~5 images
├── Heavy_Sider/   ~16 images
├── Indo_Arabic/   ~1 image
├── Legs/          ~5 images
├── Minimal/       ~5 images
├── featured/      ~3 featured images
├── img/           ~15 misc images (logo, banner, OG, avatars)
└── img/video/     ~1 video banner
```

### Approach
1. Upload all images through Payload admin into `media` collection
2. Create portfolio entries linking to media + category
3. OR write a batch seed script using Payload Local API

---

## Frontend Rebuild Order

1. **Layout** — Header + Footer (from Globals), SEO head, Google Fonts, Bootstrap/Font Awesome
2. **Home** — Hero, trust stats, service preview, gallery preview, FAQ, YouTube
3. **Services page** — Service cards from `Services` collection
4. **Individual service pages** — `/bridal-mehndi`, `/classes`, `/home-service-mehndi-in-ahmedabad`
5. **Artist** — From SiteSettings global
6. **Portfolio** — Category filter + gallery grid from `Portfolio` + `PortfolioCategories`
7. **Contact** — Static page + Google Form embed + map embed
8. **Static pages** — Privacy policy, booking policy, thank-you
9. **SEO** — Structured data (schema.org) for LocalBusiness, Service, Course, FAQ, ImageGallery, VideoObject

---

## SEO Migration Notes

The existing `src/lib/seo.js` has these schema builders that need porting:
- `buildLocalBusinessSchema()` → auto-generate from SiteSettings
- `buildServiceSchema()` → auto-generate from Services
- `buildCourseSchema()` → for Classes page
- `buildPersonSchema()` → for Artist page
- `buildWebPageSchema()` → for every page
- `buildFaqSchema()` → from FAQ data
- `buildImageGallerySchema()` → for Portfolio page
- `buildVideoObjectSchemas()` → from YouTube videos
- `buildPolicyWebPageSchema()` → for policy pages

Recommended: Use `@payloadcms/plugin-seo` for per-page meta, plus a shared component for JSON-LD schema.

---

## Deployment

- Hosting: Vercel (current), Payload Cloud, or custom VPS
- Database: PostgreSQL (already configured in v2)
- Media storage: Local (dev) → S3/Cloud storage (production)
- Build: `pnpm build` via Next.js standalone output

---

## Reference Files

- Source skill loaded: `payload` (11 reference docs in `reference/`)
- Payload docs: https://payloadcms.com/docs
- Plugin-SEO: https://github.com/payloadcms/plugin-seo
- Plugin Form Builder: https://github.com/payloadcms/plugin-form-builder
