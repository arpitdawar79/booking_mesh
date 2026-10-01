-- CreateEnum
CREATE TYPE "SheetRowStatus" AS ENUM ('legacy', 'complete', 'incomplete', 'nagged', 'resolved', 'skipped', 'snoozed', 'deleted', 'possible_duplicate');

-- CreateEnum
CREATE TYPE "SheetFixTokenKind" AS ENUM ('fix', 'gaps');

-- CreateTable
CREATE TABLE "sheet_rows" (
    "id" TEXT NOT NULL,
    "sheet" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "row_num" INTEGER NOT NULL,
    "raw_json" JSONB NOT NULL,
    "row_hash" TEXT NOT NULL,
    "parsed_date" TIMESTAMP(3),
    "status" "SheetRowStatus" NOT NULL DEFAULT 'incomplete',
    "missing_required" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missing_soft" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "patches" JSONB,
    "linked_record_id" TEXT,
    "linked_record_type" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_nagged_at" TIMESTAMP(3),
    "nag_count" INTEGER NOT NULL DEFAULT 0,
    "snoozed_until" TIMESTAMP(3),
    "resolved_via" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheet_fix_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "kind" "SheetFixTokenKind" NOT NULL DEFAULT 'fix',
    "sheet_row_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sheet_fix_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sheet_rows_status_idx" ON "sheet_rows"("status");

-- CreateIndex
CREATE INDEX "sheet_rows_sheet_parsed_date_idx" ON "sheet_rows"("sheet", "parsed_date");

-- CreateIndex
CREATE UNIQUE INDEX "sheet_rows_sheet_row_id_key" ON "sheet_rows"("sheet", "row_id");

-- CreateIndex
CREATE UNIQUE INDEX "sheet_fix_tokens_token_key" ON "sheet_fix_tokens"("token");

-- CreateIndex
CREATE INDEX "sheet_fix_tokens_expires_at_idx" ON "sheet_fix_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "sheet_fix_tokens" ADD CONSTRAINT "sheet_fix_tokens_sheet_row_id_fkey" FOREIGN KEY ("sheet_row_id") REFERENCES "sheet_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
