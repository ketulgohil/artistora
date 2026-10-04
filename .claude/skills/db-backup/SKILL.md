---
name: db-backup
description: Backup or restore the Artistora PostgreSQL database — always run before risky schema changes, bulk deletes, or seed operations
---

When asked to backup or restore the database, or before any risky operation:

**Create a backup:**
```bash
npm run db:backup
```
Saves to `backups/<timestamp>.sql`. Note the filename from the output.

**Restore from a backup:**
```bash
npm run db:restore -- backups/<filename>.sql
```
After restoring, restart the dev server: `npm run dev`

---

**ALWAYS backup first before any of these (prompt the user if they skipped it):**
- Adding or removing fields from any Payload collection
- Running any bulk-delete or seed script (`clean-test-data.ts`, `seed-artists.ts`, etc.)
- Migrating media to S3 (`npm run migrate:media:s3`)
- Resetting a WhatsApp or Instagram Redis session
- Any operation touching more than 10 records at once

**NEVER run this — it will destroy production data:**
```
npx payload migrate   ← FORBIDDEN on live DB — drops and recreates tables
```
Schema changes sync safely and automatically when the dev server starts (`npm run dev`).

---

**Backup hygiene:**
- Keep the 3 most recent backups; older ones can be removed to save disk space
- After a successful restore, run `npm run dev` so Payload can push any pending schema diff
- Verify the restore by checking a known record in the Payload admin panel before resuming work
