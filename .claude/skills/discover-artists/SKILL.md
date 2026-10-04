---
name: discover-artists
description: Discover Instagram artists for a given category and city, deduplicate against the DB, and seed into discovered_artists
---

When asked to discover artists on Instagram:

1. Ask (if not already provided): category (`mehndi` | `makeup` | `nail` | `decor`), city (default: `ahmedabad`), count target (default: 20)
2. Build a query list from the inputs:
   - `"{city} {category} artist"`
   - `"{category} artist {city}"`
   - `"bridal {category} {city}"`
   - `"{city} {category} studio"` (for nail/makeup)
3. Run the scraper:
   ```bash
   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/scrape-instagram-artists.ts --queries "<q1>,<q2>,<q3>"
   ```
4. After scraping, check counts in `discovered_artists`:
   - Query `discovered-artists` collection where `artistType = category`
   - Break down by `outreachStatus`: pending vs contacted
5. Report:
   - Total discovered (all time for this category)
   - Already contacted
   - New / pending (ready for outreach)
6. Ask user: "Ready to run outreach for these N new artists?"

**Hard limits — never exceed:**
- Max 30 profiles scraped per session — Instagram checkpoints trigger at higher volumes
- If a `checkpoint_required` error appears, stop immediately and wait 2+ hours before retrying
- Never re-scrape handles already in `discovered_artists` — the script upserts by handle, but verify dedup ran
