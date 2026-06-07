import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  DASHBOARD_PASSWORD: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USERNAME: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  GOOGLE_REVIEW_URL: z.string().optional(),
  INSTAGRAM_URL: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const messages = parsed.error.issues.map(
      (issue) => `${String(issue.path)}: ${issue.message}`,
    );
    console.error("[ENV] Missing or invalid environment variables:");
    messages.forEach((m) => console.error(`  - ${m}`));
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Environment validation failed: ${messages.join(", ")}`);
    }
  }
  return parsed.data ?? (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();
