---
name: clean-db
description: Purge all test and dummy data from the Artistora database — enforces zero-test-data policy
---

When asked to clean test data, purge dummy records, or before any production verification:

**Run the cleanup script:**
```bash
NODE_OPTIONS="--no-deprecation" node --import tsx scripts/clean-test-data.ts
```

**What it removes:**
- Artists where `slug` contains `test-artist` or `displayName` contains `Test`
- Users with `@testrunner.com` email addresses
- Leads, quotes, bookings, and reviews linked to those test users (in dependency order)

**After the script completes:**
- Confirm the reported counts — if all are `0`, the database is clean ✅
- If it reports N deletions, note what was removed in your response
- If a real artist was accidentally flagged (false positive), restore immediately from the latest backup

**When to run this skill proactively:**
- After any integration test run that aborted or threw mid-way
- Before showing the `/artists` page in production to anyone
- Any time you suspect test data crept in during development

**Zero-test-data rule (project policy):**
- Never leave test or dummy records in the database after a test run
- All integration test records must use the `@testrunner.com` email domain so this script can find and remove them
- If a test creates records outside this convention, document the cleanup steps and run them immediately
