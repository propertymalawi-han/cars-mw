CREATE OR REPLACE FUNCTION public.handle_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_phone text;
  v_account_type "AccountType";
BEGIN
  v_name := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1),
    'CarsMW user'
  );
  v_phone := nullif(trim(NEW.raw_user_meta_data->>'phone'), '');

  BEGIN
    v_account_type := coalesce(NEW.raw_user_meta_data->>'account_type', 'individual')::"AccountType";
  EXCEPTION WHEN others THEN
    v_account_type := 'individual';
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users (
      id,
      name,
      email,
      phone,
      account_type,
      role,
      email_verified
    )
    VALUES (
      NEW.id,
      v_name,
      lower(NEW.email),
      v_phone,
      v_account_type,
      CASE
        WHEN v_account_type = 'dealer' THEN 'dealer'::"UserRole"
        ELSE 'user'::"UserRole"
      END,
      NEW.email_confirmed_at
    )
    ON CONFLICT (email) DO UPDATE SET
      name = excluded.name,
      phone = coalesce(excluded.phone, public.users.phone),
      account_type = CASE
        WHEN excluded.account_type = 'dealer' THEN 'dealer'::"AccountType"
        ELSE public.users.account_type
      END,
      role = CASE
        WHEN excluded.account_type = 'dealer' THEN 'dealer'::"UserRole"
        ELSE public.users.role
      END,
      email_verified = coalesce(excluded.email_verified, public.users.email_verified),
      updated_at = now();

    RETURN NEW;
  END IF;

  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    UPDATE public.users
    SET
      email_verified = NEW.email_confirmed_at,
      updated_at = now()
    WHERE email = lower(NEW.email) OR id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user();

CREATE OR REPLACE FUNCTION public.register_account(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
  v_slug text;
  v_base_slug text;
  v_suffix integer := 2;
  v_account_type "AccountType";
BEGIN
  v_email := lower(trim(payload->>'email'));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  v_account_type := coalesce(payload->>'accountType', 'individual')::"AccountType";

  SELECT id INTO v_user_id
  FROM users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    INSERT INTO users (name, email, phone, account_type, role)
    VALUES (
      trim(payload->>'name'),
      v_email,
      nullif(trim(payload->>'phone'), ''),
      v_account_type,
      CASE WHEN v_account_type = 'dealer' THEN 'dealer'::"UserRole" ELSE 'user'::"UserRole" END
    )
    RETURNING id INTO v_user_id;
  ELSE
    UPDATE users
    SET
      name = coalesce(nullif(trim(payload->>'name'), ''), name),
      phone = coalesce(nullif(trim(payload->>'phone'), ''), phone),
      account_type = CASE
        WHEN v_account_type = 'dealer' THEN 'dealer'::"AccountType"
        ELSE account_type
      END,
      role = CASE
        WHEN v_account_type = 'dealer' THEN 'dealer'::"UserRole"
        ELSE role
      END,
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  IF v_account_type = 'dealer' AND NOT EXISTS (
    SELECT 1 FROM dealers WHERE user_id = v_user_id
  ) THEN
    v_base_slug := trim(both '-' FROM lower(regexp_replace(
      coalesce(trim(payload->>'dealerName'), ''),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )));
    IF v_base_slug = '' THEN
      v_base_slug := 'dealer';
    END IF;

    v_slug := left(v_base_slug, 48);

    WHILE EXISTS (SELECT 1 FROM dealers WHERE slug = v_slug) LOOP
      v_slug := left(v_base_slug, 44) || '-' || v_suffix;
      v_suffix := v_suffix + 1;
    END LOOP;

    INSERT INTO dealers (name, slug, phone, whatsapp, districts, verified, user_id)
    VALUES (
      trim(payload->>'dealerName'),
      v_slug,
      trim(payload->>'dealerPhone'),
      trim(payload->>'whatsapp'),
      coalesce(
        array(SELECT jsonb_array_elements_text(payload->'districts')),
        array[]::text[]
      ),
      false,
      v_user_id
    );
  END IF;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_account(jsonb) TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR lower(email) = (
      SELECT lower(u.email)
      FROM auth.users u
      WHERE u.id = (SELECT auth.uid())
    )
  );
