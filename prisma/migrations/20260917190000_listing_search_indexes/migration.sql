-- Filter indexes used by /listings search, facets, and counts
CREATE INDEX IF NOT EXISTS "listings_make_idx" ON "listings"("make");
CREATE INDEX IF NOT EXISTS "listings_body_type_idx" ON "listings"("body_type");
CREATE INDEX IF NOT EXISTS "listings_status_idx" ON "listings"("status");
CREATE INDEX IF NOT EXISTS "listings_created_at_idx" ON "listings"("created_at");
CREATE INDEX IF NOT EXISTS "listings_status_make_idx" ON "listings"("status", "make");
CREATE INDEX IF NOT EXISTS "listings_status_body_type_idx" ON "listings"("status", "body_type");
CREATE INDEX IF NOT EXISTS "listings_status_district_idx" ON "listings"("status", "district");
