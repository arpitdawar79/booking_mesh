import { z } from "zod";

const fieldValues = z
  .record(z.string().min(1).max(40), z.string().max(500))
  .refine((value) => Object.keys(value).length <= 20, "Too many fields");

export const fixRequestSchema = z.object({
  token: z.string().min(8).max(128),
  fields: fieldValues,
});

export const gapsRequestSchema = z.object({
  token: z.string().min(8).max(128),
  updates: z
    .array(
      z.object({
        id: z.string().min(10).max(64),
        fields: fieldValues,
      }),
    )
    .min(1)
    .max(100),
});

export const syncRequestSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  wait: z.boolean().optional().default(false),
});

export const cutoffRequestSchema = z.object({
  syncFromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())),
});

export const dashboardQuerySchema = z.object({
  status: z
    .enum([
      "legacy",
      "complete",
      "incomplete",
      "nagged",
      "resolved",
      "skipped",
      "snoozed",
      "deleted",
      "possible_duplicate",
      "conflict",
    ])
    .optional(),
  sheet: z.enum(["expenses", "payouts", "revenue"]).optional(),
  queue: z.enum(["attention"]).optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const dashboardPatchSchema = z.object({
  id: z.string().min(5).max(64),
  fields: fieldValues.optional(),
  action: z
    .enum(["skip", "snooze", "accept", "keep", "unlink", "restore", "link", "import"])
    .optional(),
  days: z.coerce.number().int().min(1).max(90).optional(),
});
