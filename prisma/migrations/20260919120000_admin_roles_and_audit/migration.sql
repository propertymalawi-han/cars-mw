-- Internal staff role (separate from marketplace account_type)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'support';

-- Admin write-ahead log for data-changing staff actions
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_admin_user_id_created_at_idx"
    ON "admin_audit_logs"("admin_user_id", "created_at" DESC);
CREATE INDEX "admin_audit_logs_target_type_target_id_idx"
    ON "admin_audit_logs"("target_type", "target_id");
CREATE INDEX "admin_audit_logs_created_at_idx"
    ON "admin_audit_logs"("created_at" DESC);

ALTER TABLE "admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_admin_user_id_fkey"
    FOREIGN KEY ("admin_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "admin_audit_logs" TO service_role;

-- Keep admin/support when a staff member later signs up as a dealer
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
        WHEN public.users.role::text IN ('admin', 'support') THEN public.users.role
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
        WHEN role::text IN ('admin', 'support') THEN role
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
