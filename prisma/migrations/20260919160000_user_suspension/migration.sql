-- Staff can suspend marketplace accounts without deleting them
ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "suspended" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "suspended_reason" TEXT,
    ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "users_suspended_idx" ON "users"("suspended");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");

CREATE OR REPLACE FUNCTION public.create_private_listing(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_listing_id uuid;
  v_email text;
  v_role "UserRole";
  v_suspended boolean;
  v_make text;
  v_model text;
  v_year integer;
  v_price integer;
  v_mileage integer;
BEGIN
  v_email := lower(trim(payload->>'sellerEmail'));

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF jsonb_typeof(payload->'images') IS DISTINCT FROM 'array'
     OR jsonb_array_length(payload->'images') < 1 THEN
    RAISE EXCEPTION 'At least one photo is required';
  END IF;

  v_make := trim(payload->>'make');
  v_model := trim(payload->>'model');
  v_year := (payload->>'year')::integer;
  v_price := (payload->>'price')::integer;
  v_mileage := (payload->>'mileage')::integer;

  SELECT id, role, suspended INTO v_seller_id, v_role, v_suspended
  FROM users
  WHERE email = v_email;

  IF v_seller_id IS NULL THEN
    INSERT INTO users (name, phone, email, role, account_type)
    VALUES (
      trim(payload->>'sellerName'),
      trim(payload->>'phone'),
      v_email,
      'user',
      'individual'
    )
    RETURNING id INTO v_seller_id;
  ELSIF coalesce(v_suspended, false) THEN
    RAISE EXCEPTION 'This account has been suspended';
  ELSIF v_role = 'user' THEN
    UPDATE users
    SET
      name = trim(payload->>'sellerName'),
      phone = trim(payload->>'phone'),
      updated_at = now()
    WHERE id = v_seller_id;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      v_seller_id::text || ':' || v_make || ':' || v_model || ':' || v_year || ':' || v_price || ':' || v_mileage,
      0
    )
  );

  SELECT listings.id INTO v_listing_id
  FROM listings
  WHERE listings.seller_id = v_seller_id
    AND lower(listings.make) = lower(v_make)
    AND lower(listings.model) = lower(v_model)
    AND listings.year = v_year
    AND listings.price = v_price
    AND listings.mileage = v_mileage
    AND listings.created_at > now() - interval '2 minutes'
  ORDER BY listings.created_at DESC
  LIMIT 1;

  IF v_listing_id IS NOT NULL THEN
    RETURN v_listing_id;
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
      nullif(v_make, ''),
      nullif(v_model, '')
    ),
    v_make,
    v_model,
    v_year,
    v_price,
    v_mileage,
    (payload->>'transmission')::"Transmission",
    (payload->>'fuelType')::"FuelType",
    (payload->>'bodyType')::"BodyType",
    trim(payload->>'district'),
    trim(payload->>'city'),
    ARRAY(SELECT jsonb_array_elements_text(payload->'images')),
    trim(payload->>'description'),
    v_seller_id,
    'private',
    'active'
  )
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$$;
