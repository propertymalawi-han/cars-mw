-- Vehicle make/model/variant catalog, with popular Malawi-market brands pinned
CREATE TABLE "makes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "makes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "makes_name_key" ON "makes"("name");
CREATE UNIQUE INDEX "makes_slug_key" ON "makes"("slug");
CREATE INDEX "makes_is_popular_sort_order_idx" ON "makes"("is_popular", "sort_order");

CREATE TABLE "models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "make_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body_type" "BodyType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "models_make_id_name_key" ON "models"("make_id", "name");
CREATE UNIQUE INDEX "models_make_id_slug_key" ON "models"("make_id", "slug");
CREATE INDEX "models_make_id_idx" ON "models"("make_id");

ALTER TABLE "models"
    ADD CONSTRAINT "models_make_id_fkey"
    FOREIGN KEY ("make_id") REFERENCES "makes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "variants_model_id_name_key" ON "variants"("model_id", "name");
CREATE INDEX "variants_model_id_idx" ON "variants"("model_id");

ALTER TABLE "variants"
    ADD CONSTRAINT "variants_model_id_fkey"
    FOREIGN KEY ("model_id") REFERENCES "models"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
