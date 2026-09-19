-- Record when a listing is marked sold so time-to-sale can be measured
ALTER TABLE "listings"
    ADD COLUMN IF NOT EXISTS "sold_at" TIMESTAMPTZ(6);

UPDATE "listings"
SET "sold_at" = "updated_at"
WHERE status = 'sold'
  AND "sold_at" IS NULL;

CREATE INDEX IF NOT EXISTS "listings_sold_at_idx" ON "listings"("sold_at");
