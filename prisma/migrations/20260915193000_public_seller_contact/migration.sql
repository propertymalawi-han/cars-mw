GRANT SELECT (id, name, phone) ON TABLE "users" TO anon;

DROP POLICY IF EXISTS "Anonymous can view seller contact for active listings" ON "users";
CREATE POLICY "Anonymous can view seller contact for active listings"
    ON "users" FOR SELECT
    TO anon
    USING (
      EXISTS (
        SELECT 1 FROM listings
        WHERE listings.seller_id = users.id
          AND listings.status = 'active'
      )
    );
