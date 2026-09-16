ALTER TYPE "ListingStatus" ADD VALUE 'expired';

ALTER TABLE "dealers" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

ALTER TABLE "listings" ADD COLUMN "featured_until" TIMESTAMPTZ(6);

CREATE INDEX "listings_featured_until_idx" ON "listings"("featured_until");

CREATE INDEX "view_history_listing_id_viewed_at_idx" ON "view_history"("listing_id", "viewed_at" DESC);
