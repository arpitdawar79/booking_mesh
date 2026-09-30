-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('personal_chat', 'group_member', 'broadcast_list', 'manual_entry', 'booking_guest');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('active', 'opted_out', 'blocked', 'invalid');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "CampaignLogStatus" AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed', 'opted_out');

-- CreateEnum
CREATE TYPE "ExtractionJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ExtractionJobType" AS ENUM ('contacts', 'enrich');

-- CreateTable
CREATE TABLE "user_leads" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "name" TEXT,
    "push_name" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'group_member',
    "source_group_id" TEXT,
    "source_group_name" TEXT,
    "is_whatsapp_user" BOOLEAN NOT NULL DEFAULT true,
    "is_group_admin" BOOLEAN NOT NULL DEFAULT false,
    "profile_pic_url" TEXT,
    "about_text" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "city" TEXT,
    "state" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'active',
    "last_seen_at" TIMESTAMP(3),
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "template_id" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "target_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_sources" "LeadSource"[] DEFAULT ARRAY[]::"LeadSource"[],
    "exclude_opted_out" BOOLEAN NOT NULL DEFAULT true,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "read_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "status" "CampaignLogStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extraction_jobs" (
    "id" TEXT NOT NULL,
    "type" "ExtractionJobType" NOT NULL DEFAULT 'contacts',
    "status" "ExtractionJobStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "processed_items" INTEGER NOT NULL DEFAULT 0,
    "enrich_profiles" BOOLEAN NOT NULL DEFAULT false,
    "group_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "result" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extraction_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_leads_phone_number_key" ON "user_leads"("phone_number");

-- CreateIndex
CREATE INDEX "user_leads_source_idx" ON "user_leads"("source");

-- CreateIndex
CREATE INDEX "user_leads_status_idx" ON "user_leads"("status");

-- CreateIndex
CREATE INDEX "user_leads_source_group_id_idx" ON "user_leads"("source_group_id");

-- CreateIndex
CREATE INDEX "marketing_campaigns_status_idx" ON "marketing_campaigns"("status");

-- CreateIndex
CREATE INDEX "campaign_logs_campaign_id_idx" ON "campaign_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_logs_lead_id_idx" ON "campaign_logs"("lead_id");

-- CreateIndex
CREATE INDEX "campaign_logs_status_idx" ON "campaign_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_logs_campaign_id_lead_id_key" ON "campaign_logs"("campaign_id", "lead_id");

-- CreateIndex
CREATE INDEX "extraction_jobs_status_idx" ON "extraction_jobs"("status");

-- CreateIndex
CREATE INDEX "extraction_jobs_type_status_idx" ON "extraction_jobs"("type", "status");

-- CreateIndex
CREATE INDEX "extraction_jobs_created_at_idx" ON "extraction_jobs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "campaign_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "user_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
