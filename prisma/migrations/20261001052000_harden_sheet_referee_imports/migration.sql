ALTER TYPE "SheetRowStatus" ADD VALUE 'conflict';

ALTER TABLE "sheet_rows"
ADD COLUMN "linked_row_hash" TEXT,
ADD COLUMN "conflict_json" JSONB,
ADD COLUMN "import_error" TEXT;

ALTER TABLE "bookings" ADD COLUMN "source_key" TEXT;
ALTER TABLE "expenses" ADD COLUMN "source_key" TEXT;
ALTER TABLE "additional_sales" ADD COLUMN "source_key" TEXT;

UPDATE "bookings" AS destination
SET "source_key" = 'revenue:' || source."row_id"
FROM "sheet_rows" AS source
WHERE source."linked_record_type" = 'booking'
  AND source."linked_record_id" = destination."id";

UPDATE "expenses" AS destination
SET "source_key" = 'expenses:' || source."row_id"
FROM "sheet_rows" AS source
WHERE source."linked_record_type" = 'expense'
  AND source."linked_record_id" = destination."id";

UPDATE "additional_sales" AS destination
SET "source_key" = 'revenue:' || source."row_id"
FROM "sheet_rows" AS source
WHERE source."linked_record_type" = 'additional_sale'
  AND source."linked_record_id" = destination."id";

UPDATE "sheet_rows"
SET "linked_row_hash" = "row_hash"
WHERE "linked_record_id" IS NOT NULL;

CREATE UNIQUE INDEX "bookings_source_key_key" ON "bookings"("source_key");
CREATE UNIQUE INDEX "expenses_source_key_key" ON "expenses"("source_key");
CREATE UNIQUE INDEX "additional_sales_source_key_key" ON "additional_sales"("source_key");
