import { prisma } from "@/lib/prisma";
import type { SheetFixToken } from "@prisma/client";

export async function validateFixToken(
  token: string,
  kind?: "fix" | "gaps",
): Promise<SheetFixToken | null> {
  if (!token || token.length < 8) return null;
  const t = await prisma.sheetFixToken.findUnique({ where: { token } });
  if (!t) return null;
  if (kind && t.kind !== kind) return null;
  if (t.usedAt || t.expiresAt < new Date()) return null;
  return t;
}
