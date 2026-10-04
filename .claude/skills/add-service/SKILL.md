---
name: add-service
description: Add a new artist service category across all Artistora platform touch-points — collections, frontend, seed, scraper, and outreach scripts
---

When asked to add a new service or artist category (e.g., "Tattoo Artists", "DJ Services", "Bridal Wear"):

Work through this checklist in order — every file must be updated:

**1. Collections (schema)**
- `src/collections/Artists.ts` — add enum value to the `artistType` select field
- `src/collections/DiscoveredArtists.ts` — add the same enum value to `artistType`
- Run `npm run generate:types` after both changes to regenerate `src/payload-types.ts`

**2. Frontend pages**
- `src/app/(frontend)/services/page.tsx` — add a `ServiceCard` with title, description, image path (`/services/<slug>.jpg`), and href
- `src/app/(frontend)/artists/ArtistsGrid.tsx` — add a filter button with the matching `artistType` value
- `src/app/(frontend)/artists/page.tsx` — update page metadata/description if it lists categories
- `src/app/(frontend)/page.tsx` — add to the homepage services section if one is present

**3. AEO & SEO**
- `public/llms.txt` — add the new category to the artist categories list

**4. Seed data**
- `src/seed-content.ts` — add a seed entry for the new service card (title, description, image alt, slug)

**5. Media**
- `public/services/<slug>.jpg` — remind user to provide a distinct, high-quality image (never reuse an existing service image)

**6. Outreach automation**
- `scripts/scrape-instagram-artists.ts` — add discovery query strings for the new category (e.g., `"ahmedabad <category>"`, `"<category> artist ahmedabad"`)
- `scripts/send-instagram-outreach.ts` — add spintax compliment variants for the new category in the category-detection block

**After all changes:**
1. `npm run lint` — must pass with 0 errors
2. `npm run test:int` — must stay green
3. Start dev server (`npm run dev`) to verify schema push and confirm the service appears on `/services` and `/artists`
4. Push only after explicit user approval: `git push origin master`
