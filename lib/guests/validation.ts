import { z } from "zod";
import { DEFAULT_PROGRAM } from "./core";
export const profileFields = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().max(40).nullable().optional(),
  email: z.union([z.email().max(254), z.literal(""), z.null()]).optional(),
  idType: z.string().max(80).nullable().optional(),
  idNumber: z.string().max(120).nullable().optional(),
  address: z.string().max(1000).nullable().optional(),
  preferences: z.string().max(3000).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  birthday: z.iso.date().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  whatsappConsent: z.boolean().optional(),
  emailConsent: z.boolean().optional(),
  doNotContact: z.boolean().optional(),
});
export const programSchema = z
  .object({
    enabled: z.boolean(),
    pointsPer100: z.number().int().min(0).max(1000),
    rupeesPerPoint: z.number().min(0.01).max(10),
    referralPoints: z.number().int().min(0).max(100000),
    minimumSpend: z.number().min(1).max(1000000),
    expiryDays: z.number().int().min(30).max(3650),
    maxDiscountPercent: z.number().int().min(1).max(50),
    silverStays: z.number().int().min(1).max(1000),
    goldStays: z.number().int().min(1).max(1000),
    platinumStays: z.number().int().min(1).max(1000),
    silverPercent: z.number().int().min(0).max(50),
    goldPercent: z.number().int().min(0).max(50),
    platinumPercent: z.number().int().min(0).max(50),
    winBackDays: z.number().int().min(30).max(730),
    secondStayDays: z.number().int().min(7).max(365),
    cooldownDays: z.number().int().min(1).max(90),
    benefits: z.array(z.string().trim().min(1).max(120)).max(20),
  })
  .refine((p) => p.silverStays < p.goldStays && p.goldStays < p.platinumStays, {
    message: "Tier stay thresholds must increase",
  })
  .refine(
    (p) =>
      p.silverPercent <= p.goldPercent &&
      p.goldPercent <= p.platinumPercent &&
      p.platinumPercent <= p.maxDiscountPercent,
    { message: "Tier benefits must increase and stay below the discount cap" },
  );
export const programDefaults = () => ({ ...DEFAULT_PROGRAM });
export const offerSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{3,30}$/),
    name: z.string().trim().min(1).max(120),
    percent: z.number().int().min(1).max(50),
    maxAmount: z.number().min(1).max(100000),
    minAmount: z.number().min(0).max(1000000),
    minStays: z.number().int().min(0).max(1000),
    startsAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    maxUses: z.number().int().min(1).max(100000),
    enabled: z.boolean(),
  })
  .refine((p) => new Date(p.expiresAt) > new Date(p.startsAt), {
    message: "Offer expiry must be after start",
  });
export const redemptionSchema = z.object({
  bookingId: z.string().min(1),
  points: z.number().int().min(0).max(1000000).default(0),
  offerCode: z.string().max(30).optional(),
  tierBenefit: z.boolean().default(false),
  idempotencyKey: z.uuid(),
});
export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(3000).optional(),
  followUp: z.boolean().default(false),
});
export const segments = [
  "all",
  "returning",
  "first_time",
  "prospect",
  "upcoming",
  "win_back",
  "birthday",
  "service_recovery",
  "rewards",
  "expiring_rewards",
  "profile_incomplete",
  "ready_to_contact",
] as const;
