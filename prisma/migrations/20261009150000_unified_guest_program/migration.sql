-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "birthday" DATE,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "do_not_contact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_marketing_at" TIMESTAMP(3),
ADD COLUMN     "merged_into_id" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "referral_code" TEXT NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "whatsapp_consent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_leads" ADD COLUMN     "guest_id" TEXT;

-- AlterTable
ALTER TABLE "marketing_campaigns" ADD COLUMN     "guest_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "guest_contacts" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_activities" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actor_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_rewards" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "earning_rate" INTEGER,
    "points" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actor_id" TEXT,
    "event_key" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_guest_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reward_booking_id" TEXT,
    "awarded_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewarded_at" TIMESTAMP(3),

    CONSTRAINT "guest_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_offers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "max_amount" DECIMAL(10,2) NOT NULL,
    "min_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "min_stays" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_redemptions" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(10,2) NOT NULL,
    "original_total" DECIMAL(10,2) NOT NULL,
    "rule_snapshot" JSONB NOT NULL,
    "event_key" TEXT NOT NULL,
    "reversed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_feedback" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "follow_up" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "guest_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_links" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guest_contacts_guest_id_idx" ON "guest_contacts"("guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_contacts_kind_value_key" ON "guest_contacts"("kind", "value");

-- CreateIndex
CREATE INDEX "guest_activities_guest_id_created_at_idx" ON "guest_activities"("guest_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "guest_rewards_event_key_key" ON "guest_rewards"("event_key");

-- CreateIndex
CREATE INDEX "guest_rewards_guest_id_created_at_idx" ON "guest_rewards"("guest_id", "created_at");

-- CreateIndex
CREATE INDEX "guest_rewards_booking_id_idx" ON "guest_rewards"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_referrals_referred_guest_id_key" ON "guest_referrals"("referred_guest_id");

-- CreateIndex
CREATE INDEX "guest_referrals_referrer_id_idx" ON "guest_referrals"("referrer_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_offers_code_key" ON "guest_offers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "guest_redemptions_booking_id_key" ON "guest_redemptions"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_redemptions_event_key_key" ON "guest_redemptions"("event_key");

-- CreateIndex
CREATE INDEX "guest_redemptions_guest_id_idx" ON "guest_redemptions"("guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_redemptions_guest_id_offer_id_key" ON "guest_redemptions"("guest_id", "offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_feedback_booking_id_key" ON "guest_feedback"("booking_id");

-- CreateIndex
CREATE INDEX "guest_feedback_guest_id_idx" ON "guest_feedback"("guest_id");

-- CreateIndex
CREATE INDEX "guest_feedback_status_idx" ON "guest_feedback"("status");

-- CreateIndex
CREATE UNIQUE INDEX "guest_links_token_hash_key" ON "guest_links"("token_hash");

-- CreateIndex
CREATE INDEX "guest_links_guest_id_idx" ON "guest_links"("guest_id");

-- CreateIndex
CREATE INDEX "guest_links_expires_at_idx" ON "guest_links"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "guests_referral_code_key" ON "guests"("referral_code");

-- CreateIndex
CREATE INDEX "guests_merged_into_id_idx" ON "guests"("merged_into_id");

-- CreateIndex
CREATE INDEX "user_leads_guest_id_idx" ON "user_leads"("guest_id");

-- AddForeignKey
ALTER TABLE "user_leads" ADD CONSTRAINT "user_leads_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_contacts" ADD CONSTRAINT "guest_contacts_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_activities" ADD CONSTRAINT "guest_activities_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_rewards" ADD CONSTRAINT "guest_rewards_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_rewards" ADD CONSTRAINT "guest_rewards_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_referrals" ADD CONSTRAINT "guest_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_referrals" ADD CONSTRAINT "guest_referrals_referred_guest_id_fkey" FOREIGN KEY ("referred_guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_redemptions" ADD CONSTRAINT "guest_redemptions_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_redemptions" ADD CONSTRAINT "guest_redemptions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "guest_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_redemptions" ADD CONSTRAINT "guest_redemptions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_feedback" ADD CONSTRAINT "guest_feedback_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_feedback" ADD CONSTRAINT "guest_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_links" ADD CONSTRAINT "guest_links_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_links" ADD CONSTRAINT "guest_links_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "guests" ALTER COLUMN "referral_code" DROP DEFAULT;

ALTER TABLE "guest_feedback" ADD CONSTRAINT "guest_feedback_rating_range" CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE "guest_offers" ADD CONSTRAINT "guest_offer_valid_dates" CHECK (expires_at > starts_at);
ALTER TABLE "guest_offers" ADD CONSTRAINT "guest_offer_valid_limits" CHECK (percent BETWEEN 1 AND 50 AND max_uses > 0 AND max_amount > 0 AND min_amount >= 0 AND min_stays >= 0);
ALTER TABLE "guest_referrals" ADD CONSTRAINT "guest_referral_no_self" CHECK (referrer_id <> referred_guest_id);
