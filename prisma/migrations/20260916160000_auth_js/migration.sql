CREATE TYPE "AccountType" AS ENUM ('individual', 'dealer');

ALTER TABLE "users"
  ADD COLUMN "email_verified" TIMESTAMPTZ(6),
  ADD COLUMN "password_hash" TEXT,
  ADD COLUMN "avatar_url" TEXT,
  ADD COLUMN "account_type" "AccountType" NOT NULL DEFAULT 'individual';

ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;

UPDATE "users"
SET "account_type" = 'dealer'
WHERE "role" = 'dealer';

CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key"
  ON "accounts"("provider", "provider_account_id");

ALTER TABLE "accounts"
    ADD CONSTRAINT "accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL
);

CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key"
  ON "verification_tokens"("identifier", "token");

ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "accounts" TO service_role;
GRANT ALL ON TABLE "sessions" TO service_role;
GRANT ALL ON TABLE "verification_tokens" TO service_role;

CREATE OR REPLACE FUNCTION public.create_private_listing(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_id uuid;
  listing_id uuid;
  v_email text;
  v_role "UserRole";
BEGIN
  v_email := lower(trim(payload->>'sellerEmail'));

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF jsonb_typeof(payload->'images') IS DISTINCT FROM 'array'
     OR jsonb_array_length(payload->'images') < 1 THEN
    RAISE EXCEPTION 'At least one photo is required';
  END IF;

  SELECT id, role INTO seller_id, v_role
  FROM users
  WHERE email = v_email;

  IF seller_id IS NULL THEN
    INSERT INTO users (name, phone, email, role, account_type)
    VALUES (
      trim(payload->>'sellerName'),
      trim(payload->>'phone'),
      v_email,
      'user',
      'individual'
    )
    RETURNING id INTO seller_id;
  ELSIF v_role = 'user' THEN
    UPDATE users
    SET
      name = trim(payload->>'sellerName'),
      phone = trim(payload->>'phone'),
      updated_at = now()
    WHERE id = seller_id;
  END IF;

  INSERT INTO listings (
    title,
    make,
    model,
    year,
    price,
    mileage,
    transmission,
    fuel_type,
    body_type,
    district,
    city,
    images,
    description,
    seller_id,
    seller_type,
    status
  )
  VALUES (
    concat_ws(
      ' ',
      payload->>'year',
      nullif(trim(payload->>'make'), ''),
      nullif(trim(payload->>'model'), '')
    ),
    trim(payload->>'make'),
    trim(payload->>'model'),
    (payload->>'year')::integer,
    (payload->>'price')::integer,
    (payload->>'mileage')::integer,
    (payload->>'transmission')::"Transmission",
    (payload->>'fuelType')::"FuelType",
    (payload->>'bodyType')::"BodyType",
    trim(payload->>'district'),
    trim(payload->>'city'),
    ARRAY(SELECT jsonb_array_elements_text(payload->'images')),
    trim(payload->>'description'),
    seller_id,
    'private',
    'active'
  )
  RETURNING id INTO listing_id;

  RETURN listing_id;
END;
$$;
