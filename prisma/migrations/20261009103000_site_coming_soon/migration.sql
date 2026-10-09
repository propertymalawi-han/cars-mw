CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "coming_soon_enabled" BOOLEAN NOT NULL DEFAULT false,
    "coming_soon_message" VARCHAR(280) NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "site_settings"
    ADD CONSTRAINT "site_settings_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site availability"
    ON "site_settings"
    FOR SELECT
    TO anon, authenticated
    USING (true);

GRANT SELECT ("coming_soon_enabled", "coming_soon_message") ON TABLE "site_settings" TO anon, authenticated;
GRANT ALL ON TABLE "site_settings" TO service_role;

NOTIFY pgrst, 'reload schema';
