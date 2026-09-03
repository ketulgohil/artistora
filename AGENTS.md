# Artistora — Project Reference for AI Agents

## Overview

Artistora is an **artist marketplace** connecting customers with verified artists in Ahmedabad, Gujarat — mehndi, photography, makeup, decor, music, and more. Built with Payload 3 CMS + Next.js 16 + Tailwind CSS v4.

**Domain:** https://www.artistora.com
**Business:** Artistora — Verified Artist Marketplace

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| CMS | Payload 3.85.1 |
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| React | 19.2.6 |
| Database | PostgreSQL 16 (Supabase, `@payloadcms/db-postgres`) |
| Storage | Supabase S3-compatible storage |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + custom CSS in `styles.css` |
| Fonts | Fraunces (display serif) + Manrope (body sans) via Google Fonts |
| Email | Resend transactional emails |
| Hosting | Local dev on port 3000; prod target: Vercel |

---

## Project Structure

```
shivamehndiart-v2/
├── src/
│   ├── app/
│   │   ├── (frontend)/          # Public site pages
│   │   │   ├── layout.tsx        # Root layout (Header + Footer + WhatsApp)
│   │   │   ├── styles.css        # Tailwind v4 + Artistora design tokens
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── services/page.tsx
│   │   │   ├── portfolio/page.tsx
│   │   │   ├── classes/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── bridal-mehndi/page.tsx
│   │   │   ├── artist/page.tsx   # About Artistora platform page
│   │   │   ├── artists/page.tsx  # Artist listing
│   │   │   ├── artists/[slug]/page.tsx  # Artist profile
│   │   │   ├── get-quote/page.tsx # Quote request form (public)
│   │   │   ├── book/page.tsx     # Booking form (logged-in)
│   │   │   ├── my-bookings/page.tsx # Customer booking lookup
│   │   │   ├── quotes/[leadId]/page.tsx # Quote comparison
│   │   │   ├── register/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx # Artist dashboard
│   │   │   ├── privacy-policy/page.tsx
│   │   │   ├── booking-policy/page.tsx
│   │   │   └── thank-you/page.tsx
│   │   ├── api/
│   │   │   ├── auth/             # NextAuth (register, login, logout)
│   │   │   ├── leads/route.ts    # POST lead, PATCH status
│   │   │   ├── quotes/route.ts   # POST artist quote, GET customer quotes
│   │   │   ├── quotes/[id]/accept/route.ts
│   │   │   ├── bookings/route.ts # POST booking, PATCH status
│   │   │   └── my-bookings/route.ts # GET by phone
│   │   └── (payload)/            # Payload admin panel (auto-generated)
│   ├── collections/              # Payload collection configs
│   │   ├── Users.ts              # NextAuth users
│   │   ├── Media.ts              # Uploaded images/files
│   │   ├── Artists.ts            # Artist profiles (linked to Users)
│   │   ├── Leads.ts              # Customer enquiries
│   │   ├── Quotes.ts             # Artist quotes (linked to Leads)
│   │   ├── Bookings.ts           # Confirmed bookings
│   │   ├── Reviews.ts            # Post-booking reviews
│   │   ├── Services.ts           # Service categories
│   │   ├── PortfolioCategories.ts
│   │   ├── PortfolioItems.ts     # Artist portfolio images
│   │   ├── Testimonials.ts
│   │   ├── FAQ.ts
│   │   ├── YouTubeVideos.ts
│   │   └── StaticPages.ts
│   ├── globals/                  # Payload global configs
│   │   ├── SiteSettings.ts       # Brand, contact, social, SEO defaults
│   │   └── HeaderFooter.ts       # Logo, nav, footer content
│   ├── components/               # Shared React components
│   │   ├── Header.tsx            # Client — nav, mobile menu, My Bookings
│   │   ├── Footer.tsx            # Server — logo, links, contact
│   │   ├── WhatsAppButton.tsx    # Client — floating WhatsApp CTA
│   │   └── SectionHeading.tsx    # Server — title + divider
│   ├── lib/
│   │   ├── payload.ts            # Data fetching helpers
│   │   └── email.ts              # Resend email functions (8 templates)
│   ├── payload.config.ts         # Payload config (collections, globals, db)
│   ├── seed.ts                   # Media + portfolio items seeder
│   ├── seed-content.ts           # Services, testimonials, FAQ, YouTube seeder
│   ├── seed-artists.ts           # Sample artists seeder
│   └── rebrand-globals.ts        # One-off DB globals update script
├── public/artistora/             # Logo assets (6 files)
├── AGENTS.md                     # THIS FILE
├── GAP-ANALYSIS-PLAN.md          # Marketplace gap analysis & fix plan
└── MIGRATION-PLAN.md             # Original migration plan (phases 1-8)
```

---

## ✅ Completed Work

### Phase 1-5: Base Site Migration
All 17 routes working (200 OK), content seeded, Payload CMS configured.

### Phase 6: Full Rebrand to Artistora (Completed)
- Old brand "Shiva Mehndi Art" → new brand "Artistora"
- New contact: Ketul Gohil +91 7405387720 / gohilketul5@gmail.com
- Domain: artistora.com
- New palette: Navy #04224B / Pink #ec6783 / Blush #fdeeee
- Fonts: Fraunces (display) + Manrope (body)
- All 17 pages rewritten with marketplace-neutral copy
- Email templates rebranded (8 functions in lib/email.ts)
- DB globals updated via rebrand-globals.ts
- Git remote: git@github.com:ketulgohil/artistora.git

### Marketplace MVP (Completed)
- Quotes collection (artist submits quotes for leads)
- Leads collection (customer enquiries)
- Bookings collection (confirmed bookings)
- Auth system (register, login, logout, dashboard)
- My Bookings page (phone lookup)
- Quote comparison page (customer views/accepts)
- Lead-to-booking auto-conversion (afterChange hook)
- Email notifications (lead confirmation, quote sent, booking confirmation)
- P0.1: Customer Identity & Secure Booking Access
- P0.2: Separate Lead from Quote
- P0.3: Artist Booking Acceptance (requested→artist_pending→confirmed→in_progress→completed)
- P0.4: Basic Availability (blocked dates + conflict detection)
- P0.5: Flexible Pricing (package, hourly, per_person, custom_quote)
- P0.6: Multi-Artist Bookings (assignedArtists, roles, statuses, notifications)
- P0.7: Payload Access Control (role & owner-level security across all collections)

---

## 📋 Pending — Gap Analysis (GAP-ANALYSIS-PLAN.md)

### P0 — Critical (Completed ✅)
| Item | Status | Description |
|------|--------|-------------|
| 2.3 Artist Booking Acceptance | [x] | Statuses requested→artist_pending→confirmed→in_progress→completed, accept/decline, decline reason |
| 2.4 Basic Availability | [x] | Date mechanism, conflict check before confirmation |
| 2.5 Flexible Pricing | [x] | priceType (hourly/per_person/package/custom), quote amount ≠ startingPrice |
| 2.6 Multi-Artist Bookings | [x] | assignedArtists array, per-artist status/role/fee, separate notifications |
| 2.7 Payload Access Control | [x] | Artist/customer/admin CRUD restrictions enforced in Payload |

### P1 — Important (20 items remaining)
Lead lifecycle, ownership, cancellation metadata, review protection, approval/verification dual status, full notification pipeline, customer privacy by stage.

### P2 — Scale (12 items remaining)
Payments/advance booking, artist analytics, featured listings/subscriptions, search ranking.

---

## 🎨 Design Tokens

**Colors:**
- brand: `#ec6783` (Artistora pink)
- brand-dark: `#d14a68`
- brand-deep: `#04224B` (Artistora navy)
- brand-light: `#f6a6b8`
- gold: `#c77e90`
- green: `#17856b`
- cream: `#fdeeee` (blush background)
- ink: `#04224B` (navy text)
- ink-soft: `#41506b`
- ink-muted: `#7e8aa3`
- line: `#f1d9dc`

**Tailwind v4 Bug:** ALL padding/margin/gap utility classes MUST end with `!` (e.g., `px-4!`, `py-12!`, `mb-6!`, `gap-4!`). Without the `!`, spacing classes get zeroed out by a CSS `@layer` cascade bug in Chromium.

**Buttons:** Use CSS classes from `styles.css`: `.btn-brand`, `.btn-outline-brand`, `.btn-outline-soft`, `.btn-dark-brand`

---

## Key Patterns

### Data Fetching
All pages are server components that import helpers from `@/lib/payload.ts`.

### Image URLs
```tsx
<img src={'/api/media/file/' + media.filename} alt={media.alt} />
```

### Lexical Rich Text
FAQ answers stored as Lexical JSON. Extract plain text with:
```ts
function extractLexicalText(richText: any): string {
  if (!richText?.root) return ''
  return (richText.root.children || [])
    .map((child: any) => (child.children || []).map((c: any) => c.text || '').join(''))
    .join('\n')
}
```

### Marketplace Flow
**Customer:** Get 3 Quotes → submit enquiry → Lead → matched artists → multiple Quotes → select quote → Booking Request → artist accepts → Confirmed → Event → Completed → Review

**Artist:** Register → pending → approved → public profile → receive quote/booking requests → quote → accept booking → complete job → receive review

**Admin:** Approve/verify → monitor leads → match artists → monitor quotes → manage cancellations/reviews

---

## Useful Commands

```bash
# Dev server
npm run dev

# Type generation (run after changing collections)
npm run generate:types

# Build for production
npm run build

# Seed content
npx tsx src/seed.ts          # Media + portfolio items
npx tsx src/seed-content.ts  # Services, testimonials, FAQ, YouTube
npx tsx src/seed-artists.ts  # Sample artists

# One-off rebrand globals
npx tsx src/rebrand-globals.ts
```
