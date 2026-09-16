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
    INSERT INTO users (name, phone, email, role)
    VALUES (
      trim(payload->>'sellerName'),
      trim(payload->>'phone'),
      v_email,
      'user'
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

REVOKE ALL ON FUNCTION public.create_private_listing(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_private_listing(jsonb) TO anon, authenticated;
