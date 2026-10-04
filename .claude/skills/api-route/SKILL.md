---
name: api-route
description: Scaffold a new authenticated Next.js App Router API route handler following Artistora's security pattern
---

When asked to create a new API route or endpoint:

1. Ask (if not provided):
   - Path (e.g., `/api/dashboard/quotes`)
   - HTTP methods needed (`GET`, `POST`, `PATCH`, `DELETE`)
   - Access level: `artist` | `customer` | `admin` | `public`

2. Create `src/app/api/<path>/route.ts` using this exact structure:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient, authenticateRequest } from '@/lib/payload'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const authResult = await authenticateRequest(request, payload)

    if (!authResult?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Role check (remove if public route):
    // if (authResult.user.role !== 'artist') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // const result = await payload.find({ collection: '...', where: { ... }, depth: 1 })

    return NextResponse.json({ data: result.docs })
  } catch (error: any) {
    console.error('<route-name> GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
```

**Security rules — always enforce:**
- Never use `overrideAccess: true` in client-facing route handlers
- Always call `authenticateRequest(request, payload)` before any data operation
- Whitelist returned fields — never expose `viewTokenHash`, `bookingAccessTokenHash`, `passwordResetToken`, `verificationToken`, or any admin-only field
- For artist-owned resources, verify ownership: `authResult.user.id === resource.artist.user` before returning or mutating

**After creating the route:**
- Add test cases in `tests/int/api.int.spec.ts`: unauthenticated (401), wrong role (403), happy path (200)
- Run `npm run lint` to verify no TypeScript errors
