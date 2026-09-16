CREATE TYPE "EnquiryStatus" AS ENUM ('pending', 'replied', 'closed');

CREATE TABLE "favourites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favourites_user_id_listing_id_key" ON "favourites"("user_id", "listing_id");
CREATE INDEX "favourites_user_id_created_at_idx" ON "favourites"("user_id", "created_at" DESC);

ALTER TABLE "favourites"
    ADD CONSTRAINT "favourites_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favourites"
    ADD CONSTRAINT "favourites_listing_id_fkey"
    FOREIGN KEY ("listing_id") REFERENCES "listings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "view_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "view_history_user_id_listing_id_key" ON "view_history"("user_id", "listing_id");
CREATE INDEX "view_history_user_id_viewed_at_idx" ON "view_history"("user_id", "viewed_at" DESC);

ALTER TABLE "view_history"
    ADD CONSTRAINT "view_history_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "view_history"
    ADD CONSTRAINT "view_history_listing_id_fkey"
    FOREIGN KEY ("listing_id") REFERENCES "listings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "enquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "dealer_id" UUID,
    "message" TEXT NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "enquiries_user_id_created_at_idx" ON "enquiries"("user_id", "created_at" DESC);
CREATE INDEX "enquiries_dealer_id_created_at_idx" ON "enquiries"("dealer_id", "created_at" DESC);

ALTER TABLE "enquiries"
    ADD CONSTRAINT "enquiries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enquiries"
    ADD CONSTRAINT "enquiries_listing_id_fkey"
    FOREIGN KEY ("listing_id") REFERENCES "listings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enquiries"
    ADD CONSTRAINT "enquiries_dealer_id_fkey"
    FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "enquiry_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "enquiry_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "enquiry_messages_enquiry_id_created_at_idx" ON "enquiry_messages"("enquiry_id", "created_at");

ALTER TABLE "enquiry_messages"
    ADD CONSTRAINT "enquiry_messages_enquiry_id_fkey"
    FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enquiry_messages"
    ADD CONSTRAINT "enquiry_messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "dealer_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reviews_user_id_dealer_id_key" ON "reviews"("user_id", "dealer_id");
CREATE INDEX "reviews_dealer_id_created_at_idx" ON "reviews"("dealer_id", "created_at" DESC);

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_dealer_id_fkey"
    FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_rating_check"
    CHECK ("rating" >= 1 AND "rating" <= 5);

CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_preferences_user_id_key_key"
    ON "notification_preferences"("user_id", "key");

ALTER TABLE "notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favourites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "view_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enquiry_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE "favourites" TO service_role;
GRANT ALL ON TABLE "view_history" TO service_role;
GRANT ALL ON TABLE "enquiries" TO service_role;
GRANT ALL ON TABLE "enquiry_messages" TO service_role;
GRANT ALL ON TABLE "reviews" TO service_role;
GRANT ALL ON TABLE "notification_preferences" TO service_role;
