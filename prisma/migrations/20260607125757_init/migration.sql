-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guest_first_name" TEXT NOT NULL,
    "guest_full_name" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "adult_count" INTEGER NOT NULL DEFAULT 1,
    "child_count" INTEGER NOT NULL DEFAULT 0,
    "check_in_date" TEXT NOT NULL,
    "check_out_date" TEXT NOT NULL,
    "check_in_time" TEXT NOT NULL DEFAULT '2:00 PM',
    "check_out_time" TEXT NOT NULL DEFAULT '11:00 AM',
    "night_count" INTEGER NOT NULL DEFAULT 1,
    "room_count" INTEGER NOT NULL DEFAULT 1,
    "room_type" TEXT NOT NULL DEFAULT 'Boutique Room',
    "meal_plan" TEXT NOT NULL DEFAULT 'As per booking',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "total_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amount_paid_online" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'Partially paid',
    "property_address" TEXT NOT NULL DEFAULT 'The Stream by Ekantah',
    "property_phone" TEXT NOT NULL DEFAULT '+91 ',
    "property_email" TEXT NOT NULL DEFAULT 'digital@ekantah.com',
    "parking_details" TEXT NOT NULL DEFAULT 'Available near the property. Please contact us before arrival for exact guidance.',
    "map_link" TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=The%20Stream%20by%20Ekantah%20Tirthan%20Valley',
    "cancellation_policy" TEXT NOT NULL DEFAULT 'As per the booking terms shared at the time of reservation.',
    "special_requests" TEXT NOT NULL DEFAULT 'None shared.',
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails_sent" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "cc_emails" TEXT,
    "subject" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',

    CONSTRAINT "emails_sent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_id_key" ON "bookings"("booking_id");

-- AddForeignKey
ALTER TABLE "emails_sent" ADD CONSTRAINT "emails_sent_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
