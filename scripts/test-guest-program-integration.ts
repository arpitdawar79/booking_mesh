import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import {
  identityCandidates,
  resolveGuest,
  mergeGuests,
} from "../lib/guests/identity";
import { DEFAULT_PROGRAM } from "../lib/guests/core";
import { reconcileBooking, redeem, wallet } from "../lib/guests/rewards";
import { issueGuestLink, validGuestLink } from "../lib/guests/experience";
import {
  campaignAudience,
  claimGuestContact,
  personalizeGuestMessage,
} from "../lib/guests/retention";
const url = new URL(process.env.DATABASE_URL!);
assert.match(
  url.pathname,
  /^\/booking_mesh_guest_test_\d+$/,
  "Only use the isolated test database",
);
const program = { ...DEFAULT_PROGRAM, enabled: true };
async function booking(guestId: string, extra: Record<string, unknown> = {}) {
  return prisma.booking.create({
    data: {
      guestId,
      bookingId: randomUUID(),
      guestFirstName: "Test",
      guestFullName: "Test Guest",
      status: "completed",
      checkInDate: new Date("2026-01-01"),
      checkOutDate: new Date("2026-01-04"),
      nightCount: 3,
      totalAmount: 10000,
      amountPaidOnline: 10000,
      balanceAmount: 0,
      paymentStatus: "paid_in_full",
      ...extra,
    },
  });
}
async function main() {
  const legacy = await prisma.guest.findUniqueOrThrow({
    where: { id: "legacy" },
  });
  assert.ok(legacy.referralCode);
  assert.equal(legacy.whatsappConsent, false);
  assert.deepEqual(legacy.tags, []);
  assert.deepEqual(await identityCandidates(prisma, "9876543210"), ["legacy"]);
  const resolved = await resolveGuest({
    name: "Existing Guest",
    phone: "09876543210",
    email: "LEGACY@EXAMPLE.COM",
  });
  assert.equal(resolved, "legacy");
  assert.equal(
    (await prisma.guest.findUniqueOrThrow({ where: { id: resolved } })).email,
    "legacy@example.com",
  );
  const [one, two] = await Promise.all([
    resolveGuest({ name: "Race", phone: "9876543211" }),
    resolveGuest({ name: "Race", phone: "+91 98765 43211" }),
  ]);
  assert.equal(
    one,
    two,
    "Concurrent identity creation should return one guest",
  );
  const other = await prisma.guest.create({
    data: { name: "Email owner", email: "other@example.com" },
  });
  await assert.rejects(
    () =>
      resolveGuest({
        name: "Conflict",
        phone: "9876543210",
        email: "other@example.com",
      }),
    /different guests/,
  );
  assert.equal(
    (await identityCandidates(prisma, "9876543210", "OTHER@example.com"))
      .length,
    2,
  );
  await prisma.appConfig.create({
    data: { key: "guest.program", value: JSON.stringify(program) },
  });
  const stay = await booking(one);
  await Promise.all([reconcileBooking(stay.id), reconcileBooking(stay.id)]);
  assert.equal((await wallet(one)).balance, 1000);
  assert.equal(
    await prisma.guestReward.count({
      where: { bookingId: stay.id, kind: "earn" },
    }),
    1,
  );
  await prisma.appConfig.update({
    where: { key: "guest.program" },
    data: { value: JSON.stringify({ ...program, pointsPer100: 20 }) },
  });
  await reconcileBooking(stay.id);
  assert.equal(
    (await wallet(one)).balance,
    1000,
    "Changing rates must not reprice past earning",
  );
  await prisma.appConfig.update({
    where: { key: "guest.program" },
    data: { value: JSON.stringify(program) },
  });
  const futureA = await booking(one, {
    status: "confirmed",
    checkInDate: new Date("2090-01-01"),
    checkOutDate: new Date("2090-01-04"),
    amountPaidOnline: 0,
    balanceAmount: 10000,
    paymentStatus: "pending",
  });
  const futureB = await booking(one, {
    status: "confirmed",
    checkInDate: new Date("2090-02-01"),
    checkOutDate: new Date("2090-02-04"),
    amountPaidOnline: 0,
    balanceAmount: 10000,
    paymentStatus: "pending",
  });
  const requests = [futureA, futureB].map((b) =>
    redeem(
      one,
      {
        bookingId: b.id,
        points: 800,
        tierBenefit: false,
        idempotencyKey: randomUUID(),
      },
      "tester",
    ),
  );
  const outcomes = await Promise.allSettled(requests);
  assert.equal(
    outcomes.filter((r) => r.status === "fulfilled").length,
    1,
    "Only one competing 800 point redemption can succeed",
  );
  assert.equal((await wallet(one)).balance, 200);
  const redemption = await prisma.guestRedemption.findFirstOrThrow({
    where: { guestId: one },
  });
  await redeem(
    one,
    {
      bookingId: redemption.bookingId,
      points: 800,
      tierBenefit: false,
      idempotencyKey: redemption.eventKey,
    },
    "tester",
  );
  assert.equal(
    (await wallet(one)).balance,
    200,
    "Repeated redemption must not debit again",
  );
  await prisma.booking.update({
    where: { id: stay.id },
    data: { status: "cancelled" },
  });
  await reconcileBooking(stay.id);
  await reconcileBooking(stay.id);
  assert.equal(
    (await wallet(one)).balance,
    -800,
    "Spent points become debt if their earning stay is cancelled",
  );
  await prisma.booking.update({
    where: { id: redemption.bookingId },
    data: { status: "cancelled" },
  });
  await reconcileBooking(redemption.bookingId);
  assert.equal(
    (await wallet(one)).balance,
    0,
    "Cancelled reward booking returns spent points once",
  );
  await reconcileBooking(redemption.bookingId);
  assert.equal((await wallet(one)).balance, 0);
  assert.equal(
    Number(
      (
        await prisma.booking.findUniqueOrThrow({
          where: { id: redemption.bookingId },
        })
      ).totalAmount,
    ),
    10000,
    "Cancellation reverses the discount as well as returning points",
  );
  const exp = await prisma.guest.create({ data: { name: "Expiry" } });
  const expStay = await booking(exp.id);
  await reconcileBooking(expStay.id);
  await prisma.guestReward.updateMany({
    where: { guestId: exp.id, kind: "earn" },
    data: { expiresAt: new Date("2020-01-01") },
  });
  await wallet(exp.id);
  await reconcileBooking(expStay.id);
  assert.equal(
    (await wallet(exp.id)).balance,
    0,
    "Expiry must not trigger re-earning",
  );
  await prisma.booking.update({
    where: { id: expStay.id },
    data: { status: "cancelled" },
  });
  await reconcileBooking(expStay.id);
  assert.equal(
    (await wallet(exp.id)).balance,
    0,
    "Expired rewards must not become cancellation debt",
  );
  const referrer = await prisma.guest.create({ data: { name: "Referrer" } }),
    referred = await prisma.guest.create({ data: { name: "Referred" } });
  const referral = await prisma.guestReferral.create({
    data: {
      referrerId: referrer.id,
      referredGuestId: referred.id,
      createdAt: new Date("2025-01-01"),
    },
  });
  const referralStay = await booking(referred.id);
  await reconcileBooking(referralStay.id);
  await reconcileBooking(referralStay.id);
  assert.equal((await wallet(referrer.id)).balance, 500);
  assert.equal(
    (
      await prisma.guestReferral.findUniqueOrThrow({
        where: { id: referral.id },
      })
    ).status,
    "rewarded",
  );
  await prisma.payment.create({
    data: {
      bookingId: referralStay.id,
      amount: 1000,
      isRefund: true,
      method: "cash",
    },
  });
  await reconcileBooking(referralStay.id);
  assert.equal((await wallet(referrer.id)).balance, 0);
  assert.equal((await wallet(referred.id)).balance, 0);
  const offer = await prisma.guestOffer.create({
    data: {
      code: "RETURN",
      name: "Return",
      percent: 10,
      maxAmount: 250,
      minAmount: 1000,
      minStays: 0,
      startsAt: new Date("2020-01-01"),
      expiresAt: new Date("2099-01-01"),
      maxUses: 1,
      enabled: true,
    },
  });
  const offerBooking = await booking(other.id, {
    status: "confirmed",
    checkInDate: new Date("2090-01-01"),
    checkOutDate: new Date("2090-01-04"),
    amountPaidOnline: 0,
    balanceAmount: 10000,
  });
  const benefit = await redeem(
    other.id,
    {
      bookingId: offerBooking.id,
      points: 0,
      tierBenefit: false,
      offerCode: offer.code,
      idempotencyKey: randomUUID(),
    },
    "tester",
  );
  assert.equal(Number(benefit.amount), 250);
  assert.equal(
    Number(
      (
        await prisma.booking.findUniqueOrThrow({
          where: { id: offerBooking.id },
        })
      ).totalAmount,
    ),
    9750,
  );
  const limitBooking = await booking(one, {
    status: "confirmed",
    checkInDate: new Date("2090-03-01"),
    checkOutDate: new Date("2090-03-04"),
    amountPaidOnline: 0,
    balanceAmount: 10000,
  });
  await assert.rejects(
    () =>
      redeem(
        one,
        {
          bookingId: limitBooking.id,
          points: 0,
          tierBenefit: false,
          offerCode: offer.code,
          idempotencyKey: randomUUID(),
        },
        "tester",
      ),
    /limit/,
  );
  const invite = await issueGuestLink(
    referred.id,
    "feedback",
    referralStay.id,
    "tester",
    "http://localhost:4001",
  );
  const token = invite.url.split("/").at(-1)!;
  const link = await validGuestLink(token);
  assert.notEqual(link.tokenHash, token);
  assert.equal(link.scope, "feedback");
  await prisma.guestLink.update({
    where: { id: link.id },
    data: { expiresAt: new Date("2020-01-01") },
  });
  await assert.rejects(() => validGuestLink(token), /expired/);
  await assert.rejects(() => validGuestLink("bad"), /not found/);
  const audience = await campaignAudience([one]);
  assert.equal(audience[0].marketingEligible, false);
  await prisma.guest.update({
    where: { id: one },
    data: { whatsappConsent: true },
  });
  const lead = await prisma.userLead.create({
    data: { guestId: one, phoneNumber: "919876543211", status: "opted_out" },
  });
  assert.equal(
    (await campaignAudience([one]))[0].marketingEligible,
    false,
    "Lead opt-out wins over profile consent",
  );
  const campaign = await prisma.marketingCampaign.create({
    data: {
      name: "Test",
      messageBody: "Hello",
      guestIds: [one],
      status: "sending",
    },
  });
  await prisma.campaignLog.create({
    data: {
      campaignId: campaign.id,
      leadId: lead.id,
      phoneNumber: lead.phoneNumber,
    },
  });
  assert.equal(
    await claimGuestContact(one, lead.id, campaign.id),
    null,
    "Opt-out rechecked at send time",
  );
  assert.equal(
    personalizeGuestMessage(
      "Hi {{first_name}}: {{points}}",
      { name: "Test Guest", referralCode: "ABC" },
      {
        tier: { name: "Gold" },
        wallet: 42,
        stats: { preferredRoomType: null },
      },
    ),
    "Hi Test: 42",
  );
  const duplicate = await prisma.guest.create({
    data: { name: "Duplicate", phone: "919876543212", whatsappConsent: false },
  });
  await mergeGuests(one, duplicate.id, "tester");
  assert.equal(
    (await prisma.guest.findUniqueOrThrow({ where: { id: duplicate.id } }))
      .mergedIntoId,
    one,
  );
  assert.equal(
    (await prisma.guest.findUniqueOrThrow({ where: { id: one } }))
      .whatsappConsent,
    false,
  );
  assert.deepEqual(await identityCandidates(prisma, "9876543212"), [one]);
  const samePhoneDuplicate = await prisma.guest.create({
    data: { name: "Duplicate formatted contact", phone: "9876543211" },
  });
  await mergeGuests(one, samePhoneDuplicate.id, "tester");
  assert.deepEqual(
    await identityCandidates(prisma, "+91 98765 43211"),
    [one],
    "Profiles with the same normalized contact can be merged",
  );
  assert.equal(
    (
      await prisma.guest.findUniqueOrThrow({
        where: { id: samePhoneDuplicate.id },
      })
    ).phone,
    null,
    "Merged primary contact no longer blocks the survivor's unique phone",
  );
  console.log(
    "Identity races, conflicts, ledger idempotency, expiry, refund/cancellation reversals, referrals, offer limits, tokens, opt-outs and merges verified",
  );
}
main()
  .finally(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
