import { writeFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import { createAccessToken, hashPassword } from "../lib/auth-edge";
import { DEFAULT_PROGRAM } from "../lib/guests/core";
import { issueGuestLink } from "../lib/guests/experience";
const url = new URL(process.env.DATABASE_URL!);
if (!/^\/booking_mesh_guest_test_\d+$/.test(url.pathname))
  throw Error("UI fixtures require isolated guest test database");
async function main() {
  const admin = await prisma.user.create({
    data: {
      email: "guest-test-admin@example.com",
      name: "Guest test admin",
      role: "admin",
      passwordHash: await hashPassword("synthetic-test-only"),
    },
  });
  const staff = await prisma.user.create({
    data: {
      email: "guest-test-staff@example.com",
      name: "Guest test staff",
      role: "staff",
      passwordHash: await hashPassword("synthetic-test-only"),
    },
  });
  const guest = await prisma.guest.create({
    data: {
      name: "Aarav Guest Test",
      phone: "919876543290",
      email: "aarav-test@example.com",
      city: "Delhi",
      tags: ["Family", "Nature"],
      preferences: "Quiet room, vegetarian breakfast",
      notes: "Prefers an early morning walk",
      whatsappConsent: true,
      emailConsent: true,
      birthday: new Date("1990-10-09"),
    },
  });
  await prisma.guestContact.create({
    data: { guestId: guest.id, kind: "phone", value: "919876543298" },
  });
  const conversionLead = await prisma.userLead.create({
    data: {
      name: "Nisha Conversion Test",
      phoneNumber: "919800000001",
      email: "nisha-conversion@example.com",
      source: "phone_book",
      status: "opted_out",
      city: "Jaipur",
      tags: ["Nature"],
    },
  });
  const marketingLead = await prisma.userLead.create({
    data: {
      name: "Dev Marketing Conversion",
      phoneNumber: "919800000002",
      source: "phone_book",
      city: "Pune",
    },
  });
  const stay = await prisma.booking.create({
    data: {
      guestId: guest.id,
      bookingId: "UI-STAY",
      guestFirstName: "Aarav",
      guestFullName: guest.name,
      status: "completed",
      checkInDate: new Date("2026-01-01"),
      checkOutDate: new Date("2026-01-04"),
      nightCount: 3,
      totalAmount: 10000,
      amountPaidOnline: 10000,
      balanceAmount: 0,
      paymentStatus: "paid_in_full",
    },
  });
  await prisma.guestReward.create({
    data: {
      guestId: guest.id,
      bookingId: stay.id,
      points: 1000,
      earningRate: 10,
      kind: "earn",
      reason: "Completed settled stay UI-STAY",
      eventKey: "ui-fixture-earn",
      expiresAt: new Date("2099-01-01"),
    },
  });
  await prisma.appConfig.update({
    where: { key: "guest.program" },
    data: { value: JSON.stringify({ ...DEFAULT_PROGRAM, enabled: true }) },
  });
  const feedback = await issueGuestLink(
    guest.id,
    "feedback",
    stay.id,
    admin.id,
    "http://localhost:4041",
  );
  const prefs = await issueGuestLink(
    guest.id,
    "preferences",
    undefined,
    admin.id,
    "http://localhost:4041",
  );
  const token = await createAccessToken({
    userId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
  const staffToken = await createAccessToken({
    userId: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
  });
  writeFileSync(
    process.env.GUEST_UI_FIXTURE_FILE!,
    JSON.stringify({
      guestId: guest.id,
      conversionLeadId: conversionLead.id,
      marketingLeadId: marketingLead.id,
      token,
      staffToken,
      feedbackUrl: feedback.url,
      preferencesUrl: prefs.url,
    }),
    { mode: 0o600 },
  );
}
main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
