-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'dealer', 'admin');
CREATE TYPE "SellerType" AS ENUM ('dealer', 'private');
CREATE TYPE "ListingStatus" AS ENUM ('active', 'sold', 'draft');
CREATE TYPE "Transmission" AS ENUM ('automatic', 'manual');
CREATE TYPE "FuelType" AS ENUM ('petrol', 'diesel', 'hybrid', 'electric');
CREATE TYPE "BodyType" AS ENUM ('sedan', 'suv', 'pickup', 'hatchback', 'van', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable
CREATE TABLE "dealers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "districts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dealers_slug_key" ON "dealers"("slug");
CREATE UNIQUE INDEX "dealers_user_id_key" ON "dealers"("user_id");

ALTER TABLE "dealers"
    ADD CONSTRAINT "dealers_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "body_type" "BodyType" NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL,
    "seller_id" UUID NOT NULL,
    "seller_type" "SellerType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listings_status_created_at_idx" ON "listings"("status", "created_at" DESC);
CREATE INDEX "listings_city_idx" ON "listings"("city");
CREATE INDEX "listings_district_idx" ON "listings"("district");
CREATE INDEX "listings_make_model_idx" ON "listings"("make", "model");
CREATE INDEX "listings_price_idx" ON "listings"("price");
CREATE INDEX "listings_seller_id_seller_type_idx" ON "listings"("seller_id", "seller_type");

ALTER TABLE "listings"
    ADD CONSTRAINT "listings_seller_id_fkey"
    FOREIGN KEY ("seller_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON COLUMN "listings"."price" IS 'Price in Malawian Kwacha (integer, no decimals)';

-- Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dealers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view dealers"
    ON "dealers" FOR SELECT
    USING (true);

CREATE POLICY "Public can view active listings"
    ON "listings" FOR SELECT
    USING (status = 'active');

CREATE POLICY "Users can view own profile"
    ON "users" FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = id);

CREATE POLICY "Authenticated users can insert own listings"
    ON "listings" FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "Sellers can update own listings"
    ON "listings" FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = seller_id)
    WITH CHECK ((select auth.uid()) = seller_id);

GRANT SELECT ON TABLE "dealers" TO anon, authenticated;
GRANT SELECT ON TABLE "listings" TO anon, authenticated;
GRANT SELECT ON TABLE "users" TO authenticated;
GRANT INSERT, UPDATE ON TABLE "listings" TO authenticated;
GRANT ALL ON TABLE "users" TO service_role;
GRANT ALL ON TABLE "dealers" TO service_role;
GRANT ALL ON TABLE "listings" TO service_role;
