-- Sequential public vehicle IDs, shown as CMW-10001, CMW-10002, …
CREATE SEQUENCE "listings_vehicle_number_seq" AS INTEGER START WITH 10001;

ALTER TABLE "listings"
ADD COLUMN "vehicle_number" INTEGER;

WITH numbered AS (
  SELECT
    id,
    10000 + ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS n
  FROM "listings"
)
UPDATE "listings"
SET "vehicle_number" = numbered.n
FROM numbered
WHERE "listings".id = numbered.id;

ALTER TABLE "listings"
ALTER COLUMN "vehicle_number" SET NOT NULL,
ALTER COLUMN "vehicle_number" SET DEFAULT nextval('listings_vehicle_number_seq');

ALTER SEQUENCE "listings_vehicle_number_seq" OWNED BY "listings"."vehicle_number";

SELECT setval(
  'listings_vehicle_number_seq',
  GREATEST((SELECT COALESCE(MAX("vehicle_number"), 10000) FROM "listings"), 10000)
);

CREATE UNIQUE INDEX "listings_vehicle_number_key" ON "listings"("vehicle_number");

GRANT USAGE, SELECT ON SEQUENCE "listings_vehicle_number_seq" TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
