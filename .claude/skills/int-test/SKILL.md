---
name: int-test
description: Write a Vitest integration test for a Payload CMS collection or API route following Artistora's test patterns — with proper afterAll cleanup
---

When asked to write integration tests for a collection or route:

1. Ask (if not provided): what collection or route to test, which behaviors to cover

2. Follow the established pattern from `tests/int/api.int.spec.ts`:

```typescript
import { getPayload, Payload } from 'payload'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// Mock email to prevent real Resend calls
vi.mock('../../src/lib/email', () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue({}),
  sendArtistApprovedNotification: vi.fn().mockResolvedValue({}),
}))

import config from '../../src/payload.config'

let payload: Payload
const testEmail = `test-<feature>-${Date.now()}@testrunner.com`

describe('<CollectionName>', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  }, 300_000)

  afterAll(async () => {
    // Delete in reverse dependency order: reviews → bookings → quotes → leads → artists → users
    // Wrap each in try/catch so partial cleanup does not abort the rest
    try { await payload.delete({ collection: 'users', where: { email: { contains: 'testrunner.com' } } }) } catch {}
  })

  it('admin can create', async () => { /* ... */ })
  it('non-admin cannot set restricted fields', async () => { /* ... */ })
  it('public endpoint filters by approvalStatus', async () => { /* ... */ })
})
```

**Required test matrix for every new collection:**
- ✅ Admin can create / read / update / delete
- ✅ Non-admin (`isNonAdmin`) cannot set restricted fields (verify they are stripped in `beforeChange`)
- ✅ Artist can read their own record, cannot read others'
- ✅ Public-facing endpoints return only `approvalStatus = 'approved'` records
- ✅ Unauthenticated API route returns 401

**Running tests:**
1. `npx vitest run tests/int/api.int.spec.ts`
2. If the run aborts mid-way, immediately run `npx tsx scripts/clean-test-data.ts` before anything else
3. All tests must be green before committing

**Zero-test-data rule:** All test records must use the `@testrunner.com` email domain and be deleted in `afterAll`. Never leave test data in the database after a run.
