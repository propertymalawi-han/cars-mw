-- Hide listings from public search without deleting, and allow staff soft-delete
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'muted';

ALTER TABLE "listings"
    ADD COLUMN IF NOT EXISTS "muted_reason" TEXT,
    ADD COLUMN IF NOT EXISTS "muted_previous_status" "ListingStatus",
    ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "listings_deleted_at_idx" ON "listings"("deleted_at");

DROP POLICY IF EXISTS "Public can view active listings" ON "listings";
CREATE POLICY "Public can view active listings"
    ON "listings" FOR SELECT
    USING (status = 'active' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Anonymous can view seller contact for active listings" ON "users";
CREATE POLICY "Anonymous can view seller contact for active listings"
    ON "users" FOR SELECT
    TO anon
    USING (
      EXISTS (
        SELECT 1 FROM listings
        WHERE listings.seller_id = users.id
          AND listings.status = 'active'
          AND listings.deleted_at IS NULL
      )
    );
