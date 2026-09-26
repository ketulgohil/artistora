# Artistora SEO / AEO / GEO Audit

**Audit date:** 2026-09-26  
**Site:** https://www.artistora.com  
**Scope:** Technical SEO, local SEO, on-page SEO, structured data, AEO (answer-engine optimization), GEO (generative-engine optimization), and conversion-oriented content.

## Executive summary

Artistora has a strong baseline for a young local marketplace: server-rendered Next.js pages, clean slugs, page-level titles/descriptions/canonicals, a sitemap, location landing pages, artist profiles, breadcrumbs, FAQ content, and useful internal links.

The highest-impact problems are operational and trust-related rather than missing metadata:

1. The live `robots.txt` endpoint returns **404**, despite a `robots.ts` route existing in the repository.
2. The homepage publishes inconsistent structured data: the Organization schema points to a nonexistent logo, social profiles disagree, and the homepage advertises a hard-coded `4.9 / 150` aggregate rating that is not clearly backed by visible first-party review data.
3. The location pages are useful templates, but many have very similar copy and may be interpreted as scaled, thin location pages unless they contain real local inventory, testimonials, availability, landmarks, and service-specific evidence.
4. Artist visibility is governed by an `approved OR verified` rule. That should be an intentional policy, because either flag can make an artist indexable.
5. AEO/GEO foundations are present, but the site needs more concise answer blocks, entity consistency, evidence-backed claims, and original local content to become a reliable citation source.

## Current strengths

- Server-rendered public pages with crawlable HTML.
- Unique metadata on the primary commercial pages.
- Self-referencing canonical URLs on important pages.
- Sitemap includes static pages, area pages, and public artist profiles.
- Private/account pages mostly use `noindex` metadata.
- BreadcrumbList JSON-LD is implemented on major detail pages.
- FAQPage JSON-LD is present on FAQ, homepage, and area pages.
- HowTo JSON-LD is present on the customer and artist workflow page.
- Artist profiles expose useful commercial details: service, location, experience, starting price, portfolio, and reviews.
- Image delivery uses Next Image and modern formats are configured.
- Ahmedabad is consistently present in major titles and page copy.

## Findings and fixes

### P0 — Fix before the next deployment

#### 1. Live robots endpoint is broken

**Evidence:** `GET https://www.artistora.com/robots.txt` returned HTTP 404 during this audit. `GET https://www.artistora.com/sitemap.xml` returned HTTP 200.

**Why it matters:** Search engines can still crawl in the absence of robots, but the missing endpoint removes the intended crawl directives and sitemap declaration. It also creates a clear technical-health failure in crawlers and SEO tools.

**Repository status:** `src/app/(frontend)/robots.ts` exists and correctly declares disallow rules plus the sitemap. This indicates deployment drift, route-generation failure, or an outdated production deployment rather than a missing source file.

**Fix:** Deploy the current branch and verify the generated route. If it still 404s, move the metadata route to `src/app/robots.ts` and remove the route-group copy so there is only one route for `/robots.txt`.

**Acceptance test:**

```bash
curl -I https://www.artistora.com/robots.txt
curl -s https://www.artistora.com/robots.txt
```

Expected: HTTP 200, `Content-Type: text/plain`, sitemap URL, and the intended disallow rules.

#### 2. Correct Organization logo URL

**Issue:** The Organization schema referenced `/artistora/logo-white.png`, but the repository contains `logo-full-white.png` instead.

**Fix applied in source:** `src/app/(frontend)/layout.tsx` now references:

```text
https://www.artistora.com/artistora/logo-full-white.png
```

#### 3. Remove unsupported homepage review markup

**Issue:** The homepage emitted `AggregateRating` with `ratingValue: 4.9` and `reviewCount: 150`, while the visible page does not establish that exact review corpus. It also emitted inconsistent social URLs (`artistora` vs `artistoraofficial`).

**Risk:** Unsupported review markup can be ignored or treated as a trust/spam signal. Structured data must describe visible, verifiable page content.

**Fix applied in source:** Removed the hard-coded aggregate rating, removed the overly broad `SpeakableSpecification`, and aligned the homepage `sameAs` with the Organization entity.

**Future fix:** Add ratings only when they are calculated from published review records and the page visibly displays the same rating and count.

### P1 — High-impact SEO improvements

#### 4. Make indexability policy explicit for artist profiles

The public artist query currently uses `approvalStatus = approved OR verified = true`. The same rule is used for profile pages and sitemap inclusion.

Choose one documented policy:

- **Recommended:** public/indexable requires `approvalStatus = approved` and a profile-quality threshold; `verified` is a separate trust badge.
- If the OR rule is deliberate, document it and ensure every verified-but-not-approved profile is complete, consented, safe to expose, and ready for search.

Add a quality gate before sitemap inclusion: display name, city, service, bio, portfolio image, and a usable contact/quote path.

#### 5. Strengthen area pages with real local evidence

There are 20 Ahmedabad locality pages, which is a good architecture, but the current template repeats the same service lists, pricing claims, and FAQ patterns. Repeated locality pages can look programmatic and thin.

Each area page should add at least three of the following:

- Artists currently serving that area, with links to profiles.
- Service-specific availability or response information.
- A real local testimonial or completed-work example.
- Venue/landmark coverage that is genuinely relevant to event bookings.
- A unique “what to expect” section for that locality.
- Last-updated date and a responsible editorial owner.
- Internal links to the most relevant service pages and artist profiles.

Do not claim “top-rated”, “best”, “3x”, “40%”, or similar performance claims unless the business can substantiate them.

#### 6. Create service × intent landing pages

The current `/services` page is broad. Build a small, curated set of high-intent pages instead of generating every combination:

| Page | Primary intent |
|---|---|
| `/services/bridal-mehndi` | bridal mehndi artist Ahmedabad |
| `/services/wedding-photography` | wedding photographer Ahmedabad |
| `/services/bridal-makeup` | bridal makeup artist Ahmedabad |
| `/services/event-decor` | wedding/event decor Ahmedabad |
| `/services/event-planners` | event planner Ahmedabad |

Every page should include price context, selection criteria, service area, FAQs, examples/portfolio, a clear quote CTA, and links to relevant artists.

#### 7. Improve metadata and page intent on utility routes

Keep account and confirmation pages `noindex`. Review whether `/get-quote` should remain indexable; it can be indexable as a commercial landing page if it has explanatory content, FAQs, trust proof, and a useful fallback for users who do not submit the form. Otherwise set it to `noindex,follow` and focus indexing on service pages.

Ensure every indexable page has exactly one descriptive H1 and a useful first paragraph that answers the page intent without requiring JavaScript.

#### 8. Make sitemap freshness meaningful

The sitemap previously assigned `new Date()` to every static and area URL on every generation, which makes unchanged pages appear freshly modified. The source now omits synthetic `lastModified` values for static/area pages and keeps database `updatedAt` for artist profiles.

## AEO recommendations

AEO is strongest when the page gives a direct answer, then supports it with detail and proof.

Implement these patterns on the homepage and service pages:

1. Add a short “What is Artistora?” answer block (40–60 words).
2. Add direct answers for pricing, verification, service areas, booking timing, cancellation, and how quote matching works.
3. Use question headings followed immediately by a 1–2 sentence answer, then optional detail.
4. Keep FAQ JSON-LD synchronized with the visible FAQ text. Do not mark up hidden or unrelated questions.
5. Add `HowTo` only where the visible page genuinely presents ordered steps.
6. Use `Organization`, `WebSite`, `BreadcrumbList`, `ItemList`, `Service`, and profile-level service schemas where their properties are supported by visible content.
7. Avoid relying on `speakable` markup as a primary strategy; concise, well-written HTML answers matter more.

Suggested answer block:

> Artistora is an Ahmedabad-based marketplace for booking verified mehndi artists, photographers, makeup artists, decorators, musicians, and other event professionals. Customers share event details, compare quotes and portfolios, then book the artist that fits their date, style, and budget.

## GEO recommendations

Generative search systems need clear entities, corroboration, and quotable facts.

- Create one canonical entity description for Artistora and reuse it across the site, Google Business Profile, social profiles, directories, and press/about pages.
- Keep name, phone, service area, website, and social URLs consistent everywhere.
- Publish original local guides: wedding artist costs in Ahmedabad, bridal mehndi styles, how to choose a photographer, venue-specific checklists, and seasonal booking timelines.
- Add author/reviewer information and update dates to editorial guides.
- Turn real completed bookings into case studies with permission: event type, area, service, budget range, deliverables, and outcome.
- Earn local links from venues, wedding planners, event communities, colleges, cultural organizations, and relevant Ahmedabad publications.
- Maintain a Google Business Profile if Artistora has an eligible customer-facing location; otherwise avoid implying a staffed storefront.
- Add a clear About page explaining who operates the marketplace, how verification works, and how customer complaints are handled.
- Make claims evidence-backed. Generative systems are less likely to cite pages with unsupported “best”, “top-rated”, or numerical performance claims.

## Technical checklist

### Crawlability and indexation

- [x] Sitemap route exists in source.
- [ ] Live `robots.txt` returns 200 — deployment fix required.
- [x] Private account pages use `noindex` metadata.
- [ ] Verify all public artist profile URLs return 200 and only eligible profiles appear in the sitemap.
- [ ] Run a broken-link crawl for internal 4xx/5xx URLs.
- [ ] Verify canonical URLs on every indexable route after deployment.
- [ ] Submit sitemap in Google Search Console and Bing Webmaster Tools.

### Structured data

- [x] Organization logo URL corrected in source.
- [x] Homepage rating markup removed until it is evidence-backed.
- [ ] Validate homepage, FAQ, service, area, and artist profile schemas with Rich Results Test and Schema Markup Validator.
- [ ] Add stable `@id` values so Organization, WebSite, and page entities can be connected.
- [ ] Add `sameAs` only for owned, verified profiles.

### Performance and UX

- [ ] Measure Core Web Vitals on mobile using field data and Lighthouse.
- [ ] Confirm hero image LCP and font loading performance.
- [ ] Audit total JavaScript on public pages, especially client components.
- [ ] Confirm all meaningful images have descriptive, non-repetitive alt text.
- [ ] Add width/height or aspect-ratio to any remaining non-Next images to prevent layout shift.
- [ ] Test mobile tap targets, form completion, and WhatsApp CTA behavior.

## Content and keyword plan

Prioritize intent over raw volume:

| Cluster | Examples | Page type |
|---|---|---|
| Core marketplace | verified artists Ahmedabad, book artists Ahmedabad | Homepage / artists |
| Bridal mehndi | bridal mehndi artist Ahmedabad, mehndi artist near me | Service page + profiles |
| Photography | wedding photographer Ahmedabad, candid photographer Ahmedabad | Service page + profiles |
| Makeup | bridal makeup artist Ahmedabad, makeup artist home service | Service page + profiles |
| Decor | wedding decor Ahmedabad, mandap decorator Ahmedabad | Service page + profiles |
| Locality | mehndi artist Satellite, photographer Bopal | Area-service pages only where inventory exists |
| Informational | artist booking cost Ahmedabad, how to choose wedding photographer | Guides / FAQ |

Use Search Console query data before expanding the page set. Avoid publishing locality pages with no artists, no unique evidence, or no conversion path.

## 30 / 60 / 90-day roadmap

### First 30 days

- Deploy and verify `robots.txt`.
- Validate the schema fixes and remove unsupported claims site-wide.
- Connect Search Console and Bing Webmaster Tools.
- Establish one canonical NAP/entity profile.
- Audit public profile eligibility and sitemap membership.
- Add an About/verification-method page.

### Days 31–60

- Launch the five priority service landing pages.
- Upgrade the top 5–10 area pages with real inventory and local evidence.
- Add service-specific internal linking from homepage, services, artists, areas, FAQs, and profiles.
- Publish two original Ahmedabad-focused guides per month.
- Collect and publish consented first-party reviews tied to completed bookings.

### Days 61–90

- Build local partnerships and digital PR links.
- Add case studies and venue/occasion guides.
- Review queries, CTR, indexed pages, conversions, and profile engagement.
- Consolidate or noindex area pages that do not earn impressions or conversions.
- Add only evidence-backed ratings, offers, and review schema.

## Measurement plan

Track monthly:

- Indexed pages vs. sitemap URLs.
- Search impressions, clicks, CTR, and average position by service/locality.
- Non-brand clicks for “artist”, “mehndi”, “photographer”, “makeup”, and “decor” clusters.
- Quote-form starts, completions, and qualified leads from organic traffic.
- Artist profile views and profile-to-quote conversion rate.
- Core Web Vitals and crawl errors.
- Referring domains and local link quality.
- Mentions/citations in generative search results for the core entity and service queries.

## Files changed in this audit

- `src/app/(frontend)/layout.tsx` — corrected the Organization logo URL.
- `src/app/(frontend)/page.tsx` — removed unsupported homepage aggregate-rating/speakable markup and aligned social identity.
- `src/app/(frontend)/sitemap.ts` — stopped generating synthetic modification dates for unchanged static and area URLs.
- `src/components/Breadcrumbs.tsx` — switched the home breadcrumb to Next.js `Link` for crawlable client navigation and lint compliance.

## Final priority order

1. Restore live `robots.txt` and redeploy.
2. Validate structured data and remove unsupported claims everywhere.
3. Decide and enforce the approved/verified public profile policy.
4. Build service-intent landing pages.
5. Upgrade locality pages with real, unique evidence.
6. Publish original Ahmedabad guides and case studies.
7. Measure Search Console, leads, Core Web Vitals, and generative citations monthly.
