-- Category tree plus mute/restore fields for categories, makes, and models
DO $$ BEGIN
  CREATE TYPE "CatalogStatus" AS ENUM ('active', 'muted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "vehicle_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "status" "CatalogStatus" NOT NULL DEFAULT 'active',
    "muted_until" TIMESTAMPTZ(6),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_categories_slug_key" ON "vehicle_categories"("slug");
CREATE INDEX IF NOT EXISTS "vehicle_categories_parent_id_sort_order_idx"
    ON "vehicle_categories"("parent_id", "sort_order");
CREATE INDEX IF NOT EXISTS "vehicle_categories_status_muted_until_idx"
    ON "vehicle_categories"("status", "muted_until");

ALTER TABLE "vehicle_categories"
    DROP CONSTRAINT IF EXISTS "vehicle_categories_parent_id_fkey";
ALTER TABLE "vehicle_categories"
    ADD CONSTRAINT "vehicle_categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "vehicle_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "makes"
    ADD COLUMN IF NOT EXISTS "status" "CatalogStatus" NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS "muted_until" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "makes_status_muted_until_idx" ON "makes"("status", "muted_until");

ALTER TABLE "models"
    ADD COLUMN IF NOT EXISTS "status" "CatalogStatus" NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS "muted_until" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "models_status_muted_until_idx" ON "models"("status", "muted_until");

INSERT INTO "vehicle_categories" ("name", "slug", "parent_id", "status", "sort_order")
VALUES
    ('Cars', 'cars', NULL, 'active', 1),
    ('Bikes', 'bikes', NULL, 'active', 2),
    ('Leisure', 'leisure', NULL, 'active', 3),
    ('Commercial', 'commercial', NULL, 'active', 4)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vehicle_categories" ("name", "slug", "parent_id", "status", "sort_order")
SELECT 'Boats', 'boats', id, 'active', 1 FROM "vehicle_categories" WHERE slug = 'leisure'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vehicle_categories" ("name", "slug", "parent_id", "status", "sort_order")
SELECT 'Caravans', 'caravans', id, 'active', 2 FROM "vehicle_categories" WHERE slug = 'leisure'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vehicle_categories" ("name", "slug", "parent_id", "status", "sort_order")
SELECT 'Trucks', 'trucks', id, 'active', 1 FROM "vehicle_categories" WHERE slug = 'commercial'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vehicle_categories" ("name", "slug", "parent_id", "status", "sort_order")
SELECT 'Buses', 'buses', id, 'active', 2 FROM "vehicle_categories" WHERE slug = 'commercial'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vehicle_categories" ("name", "slug", "parent_id", "status", "sort_order")
SELECT 'Trailers', 'trailers', id, 'active', 3 FROM "vehicle_categories" WHERE slug = 'commercial'
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vehicle_categories" ("name", "slug", "parent_id", "status", "sort_order")
SELECT 'Attachments', 'attachments', id, 'active', 4 FROM "vehicle_categories" WHERE slug = 'commercial'
ON CONFLICT ("slug") DO NOTHING;
