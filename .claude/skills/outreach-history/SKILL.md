---
name: outreach-history
description: Show outreach history — who was contacted, when, on which channel, and campaign stats with pending counts
---

When asked about outreach history, contacted artists, campaign results, or "who have we messaged":

1. Run the history viewer:
   ```bash
   NODE_OPTIONS="--no-deprecation --import=tsx/esm" npx tsx scripts/show-outreach-history.ts
   ```
2. Parse and summarize the output into a clean report:
   - **Total sent** — broken down by channel (WhatsApp vs Instagram)
   - **By campaign** — group by `campaignName` with counts
   - **By artist type** — mehndi / makeup / decor / nail counts
   - **Recent 5** — name, channel, contact, timestamp (IST)
3. Also query pending artists (not yet contacted):
   - Query `discovered-artists` where `outreachStatus = 'pending'`
   - Report: "N artists discovered but not yet contacted"
4. If asked to filter by channel, category, or date range — apply filters directly via Payload Local API on `outreach-messages`.
5. Suggest next action if pending > 0: "Ready to run the next batch? (WhatsApp cap: 15/day, Instagram cap: 20/day)"

**Daily cap check — always include in the report:**
- WhatsApp: check Redis key `whatsapp:daily:sent:<YYYY-MM-DD>` — must be ≤ 15
- Instagram: count `outreach-messages` where `channel = 'instagram'` and `sentAt >= today 00:00 IST`
