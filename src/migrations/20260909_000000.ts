import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ── Leads: new security fields ──
  await db.execute(sql`
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "user_id_id" integer REFERENCES "users"("id") ON DELETE SET NULL;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "view_token_hash" varchar;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "view_token_expires_at" timestamp(3) with time zone;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "view_token_revoked_at" timestamp(3) with time zone;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "booking_access_token_hash" varchar;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "booking_access_token_expires_at" timestamp(3) with time zone;
    CREATE INDEX IF NOT EXISTS "leads_user_id_idx" ON "leads" USING btree ("user_id_id");
  `)

  // Indexes on leads for token lookup
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "leads_view_token_hash_idx" ON "leads" USING btree ("view_token_hash");
    CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");
  `)

  // ── Bookings: quote uniqueness constraint ──
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "user_id_id" integer REFERENCES "users"("id") ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS "bookings_user_id_idx" ON "bookings" USING btree ("user_id_id");
    CREATE INDEX IF NOT EXISTS "bookings_quote_id_idx" ON "bookings" USING btree ("quote_id");
    CREATE INDEX IF NOT EXISTS "bookings_lead_id_idx" ON "bookings" USING btree ("lead_id");
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bookings_quote_unique'
      ) THEN
        ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quote_unique" UNIQUE ("quote_id");
      END IF;
    END$$;
  `)

  // ── Private media collection ──
  // Keep this explicit so production deployments do not depend on schema push.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "private_media" (
      "id" serial PRIMARY KEY NOT NULL,
      "alt" varchar DEFAULT '',
      "uploaded_by_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
      "lead_id_id" integer REFERENCES "leads"("id") ON DELETE SET NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric,
      "sizes_thumbnail_url" varchar,
      "sizes_thumbnail_width" numeric,
      "sizes_thumbnail_height" numeric,
      "sizes_thumbnail_mime_type" varchar,
      "sizes_thumbnail_filesize" numeric,
      "sizes_thumbnail_filename" varchar
    );
    CREATE INDEX IF NOT EXISTS "private_media_uploaded_by_idx" ON "private_media" USING btree ("uploaded_by_id");
    CREATE INDEX IF NOT EXISTS "private_media_lead_id_idx" ON "private_media" USING btree ("lead_id_id");
    CREATE INDEX IF NOT EXISTS "private_media_updated_at_idx" ON "private_media" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "private_media_created_at_idx" ON "private_media" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "private_media_filename_idx" ON "private_media" USING btree ("filename");
    CREATE INDEX IF NOT EXISTS "private_media_thumbnail_filename_idx" ON "private_media" USING btree ("sizes_thumbnail_filename");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_quote_unique";
    DROP INDEX IF EXISTS "bookings_quote_id_idx";
    DROP INDEX IF EXISTS "bookings_lead_id_idx";

    ALTER TABLE "leads" DROP COLUMN IF EXISTS "view_token_hash";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "user_id_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "view_token_expires_at";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "view_token_revoked_at";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "booking_access_token_hash";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "booking_access_token_expires_at";
    DROP INDEX IF EXISTS "leads_view_token_hash_idx";
    DROP INDEX IF EXISTS "leads_status_idx";
    DROP TABLE IF EXISTS "private_media";
  `)
}
