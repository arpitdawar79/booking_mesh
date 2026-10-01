import { randomBytes, randomUUID } from "crypto";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { APP_CONFIG_KEYS, sheetSyncEnv } from "./config";
import { getGoogleAuth } from "./google";
import { sendToAdminDm } from "./notify";
import { setConfig } from "./sync";
import type { LogFn } from "./sync";

const RENEW_WITHIN_MS = 24 * 3600_000; // renew if expiry <24h away

async function cfg(key: string) {
  const row = await prisma.appConfig.findUnique({ where: { key } });
  return row?.value ?? null;
}

/**
 * Ensures a Drive push-notification channel exists for the sheet file.
 * Channels last ~7 days; call daily from cron to keep it alive.
 */
export async function ensureWatchChannel(log: LogFn): Promise<void> {
  const fileId = sheetSyncEnv.fileId();
  const baseUrl = sheetSyncEnv.appBaseUrl().replace(/\/$/, "");
  if (!fileId || !baseUrl) {
    log("sheet-watch", "SHEET_FILE_ID or APP_BASE_URL missing — skipping");
    return;
  }

  const [channelId, expiry] = await Promise.all([
    cfg(APP_CONFIG_KEYS.watchChannelId),
    cfg(APP_CONFIG_KEYS.watchExpiry),
  ]);
  const expiryMs = expiry ? new Date(expiry).getTime() : 0;
  if (channelId && expiryMs - Date.now() > RENEW_WITHIN_MS) {
    log("sheet-watch", `channel alive until ${expiry}`);
    return;
  }

  // Stop the old channel if we know it
  const resourceId = await cfg(APP_CONFIG_KEYS.watchResourceId);
  if (channelId && resourceId) {
    try {
      await google.drive({ version: "v3", auth: getGoogleAuth() }).channels.stop({
        requestBody: { id: channelId, resourceId },
      });
    } catch {
      // already expired — fine
    }
  }

  const drive = google.drive({ version: "v3", auth: getGoogleAuth() });
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");

  // Persist id+token BEFORE watching: Google fires a `sync` verification ping
  // immediately, and the webhook rejects channels it doesn't know yet.
  await setConfig(APP_CONFIG_KEYS.watchChannelId, id);
  await setConfig(APP_CONFIG_KEYS.watchToken, token);

  const res = await drive.files.watch({
    fileId,
    requestBody: {
      id,
      token,
      type: "web_hook",
      address: `${baseUrl}/api/sync/sheet`,
    },
  });

  const newExpiry = res.data.expiration
    ? new Date(Number(res.data.expiration)).toISOString()
    : new Date(Date.now() + 6 * 86400_000).toISOString();

  await setConfig(APP_CONFIG_KEYS.watchResourceId, res.data.resourceId ?? "");
  await setConfig(APP_CONFIG_KEYS.watchExpiry, newExpiry);
  log("sheet-watch", `watch channel ${id} → expires ${newExpiry}`);
}

export async function runWatchRenewalJob(log: LogFn): Promise<void> {
  try {
    await ensureWatchChannel(log);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("sheet-watch", `renewal failed: ${msg}`);
    await sendToAdminDm(`⚠️ Sheet watch renewal failed: ${msg}`).catch(
      () => {},
    );
    throw err;
  }
}
