import { prisma } from "@/lib/prisma";

const ADMIN_KEY = "adminWhatsAppGroupId";
const OPS_KEY = "opsWhatsAppGroupId";

let cached: { jid: string; at: number } | null = null;
const TTL_MS = 60_000;

function normalize(raw: string): string {
  const jid = raw.trim();
  if (!jid) return "";
  return jid.includes("@") ? jid : `${jid}@g.us`;
}

/**
 * Resolves the **Ops** WhatsApp group JID — the group where sheet-sync
 * digests, nags and commands live.
 *
 * Precedence: dashboard Ops selection → SHEET_OPS_GROUP_JID →
 * ADMIN_GROUP_JID envs → dashboard Admin selection (last-resort fallback so
 * notifications aren't silently dropped when no Ops group is chosen).
 * Cached for 60s so the message listener stays cheap.
 */
export async function resolveOpsGroupJid(): Promise<string> {
  const env = normalize(
    process.env.SHEET_OPS_GROUP_JID ??
      process.env.ADMIN_GROUP_JID ??
      process.env.ADMIN_WHATSAPP_GROUP_ID ??
      "",
  );
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.jid || env;
  }
  let jid = "";
  try {
    const cfgs = await prisma.appConfig.findMany({
      where: { key: { in: [OPS_KEY, ADMIN_KEY] } },
    });
    const map = Object.fromEntries(cfgs.map((c) => [c.key, c.value]));
    jid = normalize(map[OPS_KEY] ?? "") || normalize(map[ADMIN_KEY] ?? "");
  } catch {
    // DB unavailable — fall through to env
  }
  cached = { jid, at: Date.now() };
  return jid || env;
}

/** Clears the cache — used by the config save path so changes apply instantly. */
export function bustOpsGroupJidCache(): void {
  cached = null;
}
