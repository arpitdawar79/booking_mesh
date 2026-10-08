-- CreateTable
CREATE TABLE "booking_amendments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_amendments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "booking_amendments" ADD CONSTRAINT "booking_amendments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
