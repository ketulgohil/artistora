# Shiva Mehndi Art — Migration & Marketplace Roadmap

This roadmap tracks the transition of **Shiva Mehndi Art** from a single-artist showcase to a high-end, premium **Mehndi Artist Marketplace**. It functions as our living blueprint, detailing completed work, pending tasks, visual design remediations, and architectural plans.

---

## 📊 Status Dashboard

| Track | Completion | Status | Key Focus |
| :--- | :--- | :--- | :--- |
| **Phase 1: Base Site Migration** | **95%** | 🟢 Almost Complete | Content tuning, Metadata refinements |
| **Phase 2: Premium Design Overhaul** | **15%** | 🟡 Planning | Visual richness, Elegant typography, Golden/Henna palette |
| **Phase 3: Marketplace MVP (Ahmedabad)** | **0%** | 🔴 Pending | Payload marketplace collections, `/artists` directory, Multi-quote routing |

---

## 🏛️ Phase 1: Base Site Migration (Vite SPA ➔ Next.js 16 & Payload 3.85)
Migrating the original React 18 SPA to an SEO-optimized, dynamic, Payload-powered architecture.

- [x] **Project Setup & Core Infrastructure:** Next.js 16 App Router, Payload 3.85, PostgreSQL database integration.
- [x] **Core Collections & Globals:**
  - `SiteSettings` (Business info, address, aggregate ratings, SEO defaults)
  - `Header` & `Footer` (Navigation, brand identity, CTAs)
  - `Services` (Dynamic offerings: Bridal, Engagement, Classes)
  - `PortfolioCategories` & `Portfolio` (Filterable high-quality image assets)
  - `Testimonials` & `FAQ` (Social proof and customer queries)
  - `YouTubeVideos` (Video integration for tutorials)
- [x] **Migrated Page Routes (`src/app/(frontend)/`):**
  - [x] Home Page (`/`)
  - [x] Services Page (`/services`)
  - [x] Bridal Mehndi Dedicated Page (`/bridal-mehndi`)
  - [x] Mehndi Classes Page (`/classes`)
  - [x] Home Service Ahmedabad Page (`/home-service-mehndi-in-ahmedabad`)
  - [x] Artist Profile (`/artist`)
  - [x] Portfolio Gallery (`/portfolio`)
  - [x] Contact Page (`/contact`)
  - [x] Policy Pages (`/privacy-policy`, `/booking-policy`)
  - [x] Confirmation Page (`/thank-you`)
- [x] **Data Seeding:** Custom seed scripts (`src/seed.ts`, `src/seed-content.ts`) fully populating PostgreSQL database.
- [ ] **Base Tuning:**
  - [ ] Fix ESLint circular dependency error in `eslint.config.mjs`.
  - [ ] Refine image responsive layouts to eliminate layout shift (CLS).

---

## 🎨 Phase 2: Premium Design Overhaul (Visual Critique & Remediation)
*Currently, the design feels like a generic, sterile corporate SaaS template. Mehndi is an opulent, artisanal, sensory, and highly cultural art form. The UI must match the richness of the craftsmanship.*

### 🔍 The Design Critique
1. **Typography is Too Sterile:** The current site uses `Inter` (`sans-serif`) across all text. This lacks character, warmth, and luxury.
2. **Lacks Warmth & Opulence:** The `--color-brand: #c77b44` (terracotta) is a step in the right direction, but without metallic highlights, rich henna greens, or warm sand backgrounds, it feels flat.
3. **Overly Grid-Restricted:** Hard, blocky boxes (`border: 1px solid var(--color-border)`) and standard rigid CSS grids make handcrafted, flowing art feel clinical.
4. **Hero Lacks a "Thesis":** The opening section needs to represent the premium quality of *luxurious bridal storytelling* right away through organic layout shapes and deep layering.

### 🛠️ Visual Remediation Strategy
We will transition from a plain layout to a **Heritage Luxury Artistry** theme.

#### 1. Elegant Font Pairing
*   **Headers (Display):** Pair with a gorgeous serif font, **`Playfair Display`** or **`Bodoni Moda`** via Google Fonts, to inject editorial weight, heritage, and luxury.
*   **Body & Utility:** Pair with **`Plus Jakarta Sans`** or keep `Inter` for exceptional legibility, but add generous letter-spacing to eyebrows and metadata.

#### 2. The Opulent Color Palette
```css
@theme inline {
  --color-brand: #b37343;          /* Rich Henna / Warm Copper */
  --color-brand-dark: #7a4621;     /* Deep Mahogany */
  --color-brand-light: #dfa67c;    /* Soft Amber / Terracotta */
  --color-accent-gold: #d4af37;    /* Warm Metallic Gold for accents/stars */
  --color-accent-green: #3f5e4d;   /* Traditional Henna Leaf Green */
  --color-surface-cream: #faf6f0;  /* Warm Sand / Premium Ivory Background */
  --color-surface-card: #ffffff;   /* Pure White Card Base */
  --color-text-primary: #21160e;   /* Soft Charcoal-Brown (Never pure black) */
}
```

#### 3. Distinctive Signature Elements (Our Aesthetic Risk)
*   **The "Henna Flourish" Detail:** Replace rigid rules with delicate, thin double-borders, organic arched frames for hero/featured images, and subtle custom CSS wavy dividers reminiscent of mehndi strokes.
*   **Editorial Portfolio:** Create an **asymmetric editorial masonry layout** for showcase items instead of a simple square grid, giving each piece of intricate linework breathing room.
*   **Immersive Media Framing:** Present key bridal photos inside smooth arched frames with soft inner shadow filters (`filter: drop-shadow(...)`) to convey hand-crafted luxury.

---

## 🚀 Phase 3: Mehndi Artist Marketplace MVP
Building the city-by-city marketplace, starting in Ahmedabad, inside the `/artists` subdirectory.

### 🗄️ 1. Payload Database Schema Extensions (New Collections)
*   **`Artists` Collection:**
    *   Relationship to `Users` (one-to-one)
    *   Fields: `displayName`, `slug`, `profilePhoto`, `bio`, `yearsOfExperience`, `travelRadius`, `startingPrice`, `services` (array of relationships to `Services`), `styles` (array of relationships to `Styles`), `verified` (boolean), `whatsappNumber`.
*   **`Leads` Collection:**
    *   Fields: `customerName`, `customerPhone`, `eventDate`, `eventLocation`, `guestCount`, `budgetRange`, `serviceType`, `additionalNotes`, `matchedArtists` (array of relationships to `Artists`).
*   **`Quotes` Collection:**
    *   Fields: `lead` (relationship to `Leads`), `artist` (relationship to `Artists`), `priceQuote`, `notes`, `status` (`pending`, `accepted`, `declined`).

### 🖥️ 2. Frontend Implementations & Customer Flow
*   **`/artists` Directory:**
    *   A high-end, visual search engine enabling customers to search, filter by price, style, experience, and service type.
*   **`/artists/[slug]` Profile View:**
    *   Premium dedicated profile with an integrated dynamic portfolio gallery, list of services, transparent pricing, and customer reviews.
*   **"Get 3 Quotes" Customer Flow:**
    *   An interactive multi-step form capture for lead placement.
    *   Routing logic to notify and match up to 3 artists, utilizing an elegant WhatsApp link action to complete bookings.

---

## 📈 Next Action Plan

1.  **Resolve Lint Constraints:** Debug the eslint config circle issue so our automated code checking is completely clean.
2.  **Apply Phase 2 Styling Rules:** Update `src/app/(frontend)/styles.css` with the new design tokens, beautiful Google Font pairing (`Playfair Display` + `Inter`), and Arched Image Frame styling.
3.  **Refine Hero Sections:** Re-style home page and signature services with opulent cream backgrounds, luxury typography, and micro-animations to instantly elevate visual appeal.
4.  **Scaffold Marketplace Collections:** Define and register `Artists`, `Leads`, and `Quotes` within Payload CMS.
