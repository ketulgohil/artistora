# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview & Vision

**Artistora** (https://www.artistora.com) is an artist marketplace connecting customers with verified wedding and event artists (Mehndi Artists, Photographers, Makeup Artists, Decor & Event Planners) in Ahmedabad, Gujarat, India.

- **Stack:** Payload CMS 3.85.1, Next.js 16.3.4 (App Router, Turbopack, React 19), PostgreSQL 16 (Supabase hosted via `@payloadcms/db-postgres` with Drizzle ORM engine), Tailwind CSS v4, Resend email, Supabase S3 storage, Redis (Local `ioredis` for WhatsApp session caching & outreach).
- **Core Entities:** Users (auth), Artists (profiles & portfolios), Leads (quote requests), Quotes (pricing bids), Bookings (multi-artist event management), Reviews (ratings), Media / PrivateMedia, DiscoveredArtists / OutreachMessages (growth pipeline).

---

## ⚠️ Critical Database & Migration Safety

**NEVER run `npx payload migrate` on live or production databases.** It drops and recreates tables, causing irreversible data loss.

- Schema changes are pushed automatically and safely when the dev server starts (`npm run dev`) or during `npm run build`.
- **Backup before sensitive operations:** `npm run db:backup` (dumps schema & data into `backups/`).
- **Restore if needed:** `npm run db:restore -- backups/<filename>.sql`

---

## Essential Development Commands

```bash
# Development
npm run dev                  # Start Next.js + Payload dev server (auto-pushes schema safely)
npm run devsafe              # Clear .next cache and start dev server
npm run build                # Production build (Next.js + Payload static/dynamic generation)
npm run lint                 # Run ESLint (0 errors required)

# Integration & E2E Testing
npm run test:int             # Run Vitest integration tests (32 tests in tests/int/api.int.spec.ts)
npx vitest run tests/int/<name>.int.spec.ts  # Run single integration test
npm run test:e2e             # Run Playwright E2E tests
npx playwright test tests/e2e/<name>.spec.ts # Run single E2E test

# Payload Types & Admin Import Map
npm run generate:types       # Regenerate src/payload-types.ts (auto-generated in dev)
npm run generate:importmap   # Regenerate Payload admin import map

# Database & Media Migrations
npm run db:backup            # Backup PostgreSQL database to backups/
npm run db:restore -- <file> # Restore PostgreSQL database from backup SQL
npm run migrate:media:s3     # Migrate local uploads to Supabase S3 bucket

# Seeding Scripts
npx tsx src/seed.ts          # Seed media & portfolio items
npx tsx src/seed-content.ts  # Seed services, testimonials, FAQ, videos
npx tsx src/seed-artists.ts  # Seed sample artist profiles
npx tsx src/seed-outreach.ts # Seed discovered artists for outreach

# WhatsApp Outreach & Scrapers (Local Redis on redis://127.0.0.1:6379)
NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx src/outreach/whatsapp/send-with-redis.ts <phone> "<message>"
npx tsx src/outreach/run-scrapers.ts
```

---

## Core Architecture & Security Conventions

### 1. Payload CMS 3.x Local API vs REST vs Custom Route Handlers
- **Local API Signature:** Always use standard Payload 3.x Local API methods:
  - `payload.find({ collection, where, limit, depth, req, overrideAccess })`
  - `payload.findByID({ collection, id, depth, req, overrideAccess })`
  - `payload.create({ collection, data, req, overrideAccess })`
  - `payload.update({ collection, id, data, req, overrideAccess })` *(Never use deprecated `payload.updateByID`)*
  - `payload.delete({ collection, id, req, overrideAccess })`
- **Access Control & overrideAccess:**
  - Local API defaults to `overrideAccess: true` (bypasses access control for system operations).
  - When acting on behalf of an authenticated user, pass `{ overrideAccess: false, user: req.user }`.
- **Custom Frontend API Endpoints:** Dedicated route handlers (`src/app/api/dashboard/profile/route.ts`, `src/app/api/dashboard/upload/route.ts`) authenticate using `payload.auth({ headers })`, whitelist permitted fields, and invoke Local API to prevent 403 Forbidden errors caused by Payload REST field-level restrictions on self-updates.

### 2. Collection Hook Security & The `isNonAdmin` Pattern
- **CRITICAL Hook Rule:** Collection hooks must distinguish between authenticated non-admin client requests (`req.user.role === 'artist'` or `'customer'`) and internal system Local API / background / test calls where `req.user` is `undefined`.
- **Always use:**
  ```typescript
  const isNonAdmin = Boolean(req.user && req.user.role !== 'admin')
  ```
  *(Never use `!isAdmin` or `!req.user` to gate non-admin stripping, as that strips fields during server-side Local API calls, tests, and webhooks).*
- **Transaction Atomicity:** Always pass `req` to nested Payload calls inside hooks (`req.payload.find({ ..., req })`, `req.payload.create({ ..., req })`) to ensure operations commit within the same PostgreSQL transaction.

### 3. Collection Access Controls & Field Security

- **`Users` (`src/collections/Users.ts`):**
  - Roles: `customer`, `artist`, `admin`.
  - Public registration defaults to `customer` or `artist`.
  - Privilege escalation blocked in `beforeChange`: `admin` role can only be set by existing admins or during initial bootstrap. Non-admins cannot alter `role`.
- **`Artists` (`src/collections/Artists.ts`):**
  - Public directory only shows `approvalStatus = 'approved'`.
  - `verified` is a trust badge (does not bypass approval).
  - Non-admin updates strip: `user`, `verified`, `approvalStatus`, `rating`, `reviewCount`, `searchRank`, `isFeatured`, `subscriptionPlan`, `subscriptionStatus`, `maxPortfolioItems`, and analytics counters (`profileViews`, `leadsReceived`, `quotesSent`, `bookingsWon`, `totalEarnings`).
- **`Leads` (`src/collections/Leads.ts`):**
  - Quote inquiries with token security (`viewTokenHash` for quote viewing, `bookingAccessTokenHash` for booking access).
  - Non-admin updates strip: token hashes, `matchedArtists`, `acceptedQuote`, `status`, `lostReason`, `assignedAdmin`, `userId`.
  - `afterChange`: Automatically converts booked leads to `bookings` and notifies matched artists via email.
- **`Quotes` (`src/collections/Quotes.ts`):**
  - Submitted by approved artists for matched leads.
  - Non-admin artists cannot change quote `status`, `lead`, or `artist` binding.
  - Once status is `accepted`, financial terms (`amount`, `priceType`, `unitRate`, `units`, `travelFee`, `numberOfArtists`) are locked against modification.
- **`Bookings` (`src/collections/Bookings.ts`):**
  - Multi-artist event scheduling, payment status (`unpaid`, `deposit_paid`, `paid`), event progress (`artist_pending` -> `confirmed` -> `in_progress` -> `completed` -> `cancelled`).
  - Route handler `src/app/api/bookings/[id]/action/route.ts` enforces strict Broken Function Level Authorization (BFLA) checks: artists can only confirm/start/complete their own assigned bookings; customers can only cancel unpaid/pending bookings.
- **`Reviews` (`src/collections/Reviews.ts`):**
  - Tied to completed bookings. `afterChange` and `afterDelete` hooks automatically recalculate artist's average `rating` and `reviewCount`.
- **`Media` & `PrivateMedia` (`src/collections/Media.ts`, `src/collections/PrivateMedia.ts`):**
  - `media`: Public portfolio images, profile photos, and service graphics. Accessible publicly.
  - `private-media`: Customer reference design images and sensitive attachments. Only accessible by admins and authorized booking parties.

### 4. Frontend & UI/UX Guidelines (Tailwind CSS v4)
- **Tailwind CSS v4 Spacing Rule:** All padding, margin, and gap utilities **MUST end with `!`** (e.g., `px-4!`, `py-12!`, `mb-6!`, `gap-4!`). Without the `!`, spacing gets zeroed out by a Chromium `@layer` cascade bug.
- **Button Tokens:** Use predefined styles from `styles.css`: `.btn-brand`, `.btn-outline-brand`, `.btn-outline-soft`, `.btn-dark-brand`.
- **Mobile-First Design (UI/UX Pro Max):**
  - Dashboard (`/dashboard`): Reorganized mobile layout with Profile first, followed by Bookings, Quotes, Leads, Availability, and Analytics.
  - Header: Centered Artistora logo, clean drawer navigation, clear auth state.
  - Footer: Clean mobile navigation links, brand badge, and quick access.
  - FAQ (`/faq`): Interactive accordion on mobile view to avoid excessive scrolling.
  - Touch targets: Minimum 44×44px with 8px+ spacing.

### 5. Media & Uploads
- Public portfolio/avatar URLs follow: `/api/media/file/<filename>`.
- Artist portfolio limit enforced based on `subscriptionPlan` (Free: 10, Pro/Basic: 25, Premium: 50).
- Frontend image upload endpoint: `src/app/api/dashboard/upload/route.ts`.

### 6. WhatsApp & Growth Automation (Baileys Standard)
- **Engine Standard:** Always use **Baileys (`@whiskeysockets/baileys`)** via WebSockets for all WhatsApp outreach and automation scripts (avoid heavy Puppeteer/Chromium `whatsapp-web.js`).
- **Session Persistence:** Multi-file auth credentials (`creds.json`, keys) are gzipped and stored in local Docker Redis (`redis://127.0.0.1:6379`) under `whatsapp:baileys:auth:tarball` using `src/outreach/whatsapp/baileys-session.ts`.
- **Function Signatures:**
  - `validateAndNormalizePhone(phone: string): string | null` from `src/outreach/whatsapp/queue-send.ts` returns `string | null` (e.g., `'91XXXXXXXXXX'`), NOT an object.
  - `logOutreachMessage(rawPhone: string, messageBody: string, options?: LogMessageOptions)` from `src/outreach/whatsapp/log-message.ts`.
- **Deduplication & Jitter:** Always verify recipients against `outreach_messages` (`status = 'sent'`) and enforce a 45–65s human delay between outgoing messages.
- **Logging:** All messages are logged to `outreach_messages` with recipient phone, rendered message body, status, and campaign identifier.

### 7. Instagram Automation (Private Mobile API Standard)
- **Engine Standard:** Always use **Instagram Private Mobile API (`instagram-private-api`)** via direct mobile protocol for all Instagram DM outreach and bio extraction (avoid brittle DOM-clicking Playwright/Puppeteer bots).
- **Session Persistence:** State and cookie jar are serialized and persisted in local Docker Redis (`redis://127.0.0.1:6379`) under `artistora:instagram:session:state` using `src/outreach/instagram/session.ts`.
- **CLI Commands:**
  - Link session: `npx tsx scripts/auth-instagram.ts`
  - Run batch outreach: `npx tsx scripts/send-instagram-outreach.ts`
  - Send single test DM: `npx tsx scripts/send-instagram-outreach.ts --test @target_handle`
- **Deduplication & Jitter:** Always verify recipients against `outreach_messages` (`channel = 'instagram'`, `status = 'sent'`) and enforce 45–65s human jitter delays.
