# Setup Guide — Shiva Mehndi Art v2

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

## Steps

### 1. Clone & Install

```bash
git clone git@github.com:ketulgohil/shivamehndiart-v2.git
cd shivamehndiart-v2
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PAYLOAD_SECRET=<random-secret-key>
DATABASE_URL=postgresql://user:password@localhost:5432/shivamehndiart-v2
```

### 3. Database Setup

**Option A — Auto-schema push (easiest for fresh DB):**

The first time you start the dev server, Payload auto-creates tables from the collection configs:

```bash
npm run dev
```

Then seed the content:

```bash
npx tsx src/seed.ts        # Media + portfolio items
npx tsx src/seed-content.ts # Services, testimonials, FAQ, YouTube
```

**Option B — Generate & run migrations (recommended for prod):**

```bash
# Generate migration files from schema
npx payload migrate:create

# Apply migrations
npx payload migrate
```

Then seed:

```bash
npx tsx src/seed.ts
npx tsx src/seed-content.ts
```

### 4. Run Dev Server

```bash
npm run dev
```

Opens at `http://localhost:3000`. Admin panel at `http://localhost:3000/admin`.

### 5. Build for Production

```bash
npm run build
```

---

## Data Flow

| Content | Source | How to Edit |
|---------|--------|-------------|
| Collection schemas | `src/collections/*.ts` | Code changes → generate migration |
| Global settings | `src/globals/*.ts` | Code changes → generate migration |
| Media (images) | `src/seed.ts` + uploads | Re-run seed or upload via admin |
| Services, FAQ, YouTube | `src/seed-content.ts` | Re-run seed or edit via admin |
| Frontend pages | `src/app/(frontend)/*` | Code changes only |

## Generating Migrations After Schema Changes

Whenever you modify a collection or global:

```bash
npx payload migrate:create   # Creates migration SQL files
npx payload migrate           # Applies them to DB
```

Commit the generated files in `src/migrations/` to git so others can apply them.
